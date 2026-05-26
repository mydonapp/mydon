import { Location } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { BackNavigator } from '../../back-navigator';

interface PageSnapshot {
  url: string;
  node: HTMLElement;
  scrollY: number;
}

const START_THRESHOLD = 10; // px before claiming a horizontal back-swipe
const COMMIT_FRACTION = 0.4;
const COMMIT_VELOCITY = 0.45; // px/ms
/** Slide duration must match the CSS .is-finishing transition. */
const FINISH_MS = 420;
/** How long after a page becomes active before we re-snapshot it for previews. */
const SETTLE_MS = 800;
const STACK_MAX = 5;

/**
 * Wraps `<router-outlet>` and provides:
 *
 *  - iOS-style interactive back-swipe — left-edge drag pulls the current page
 *    right while the previous page's DOM snapshot parallaxes in from -25%
 *    with a dim wash. Releasing past a threshold commits `Location.back()`;
 *    under it springs back.
 *  - Animated back for buttons — `BackNavigator.back()` replays the same slide,
 *    so detail-page back chevrons feel like the gesture (not a hard jump).
 *
 * Mobile + touch + not reduce-motion only. Every piece of state that affects
 * the template is a **signal** — getter bindings caused NG0100 last time.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-page-stage',
  templateUrl: './page-stage.html',
  styleUrl: './page-stage.css',
})
export class PageStageComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly backNavigator = inject(BackNavigator);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  private readonly stageRef = viewChild<ElementRef<HTMLElement>>('stage');
  private readonly prevRef = viewChild<ElementRef<HTMLElement>>('prev');
  private readonly currentRef = viewChild<ElementRef<HTMLElement>>('current');
  private readonly edgeRef = viewChild<ElementRef<HTMLElement>>('edge');

  // ── State (all signals — keeps template bindings cycle-stable) ──────────────
  protected readonly swiping = signal(false);
  protected readonly finishing = signal(false);
  protected readonly swipeX = signal(0); // px
  protected readonly swipeP = signal(0); // 0 → 1
  private readonly enabledSig = signal(this.computeEnabled());
  private readonly stackLen = signal(0);

  protected readonly armed = computed(() => this.enabledSig() && this.stackLen() > 0 && !this.finishing());

  // ── Snapshot stack + settle ────────────────────────────────────────────────
  private stack: PageSnapshot[] = [];
  private settled: PageSnapshot | null = null;
  private settleTimer?: ReturnType<typeof setTimeout>;
  private pendingSnapshot: PageSnapshot | null = null;
  private leavingTrigger: 'imperative' | 'popstate' | 'hashchange' = 'imperative';
  private snapshot: PageSnapshot | null = null;
  private width = 1;

  // ── Gesture scratchpad ─────────────────────────────────────────────────────
  private active = false;
  private moved = false;
  private startX = 0;
  private startY = 0;
  private lastX = 0;
  private lastT = 0;

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationStart | NavigationEnd => e instanceof NavigationStart || e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        if (e instanceof NavigationStart) {
          this.onNavigationStart(e);
        } else {
          this.onNavigationEnd();
        }
      });

    this.backNavigator.register(() => this.animatedBack());
    afterNextRender(() => this.refreshEnabled());

    this.destroyRef.onDestroy(this.renderer.listen('window', 'resize', () => this.refreshEnabled()));
  }

  // ── Navigation lifecycle ───────────────────────────────────────────────────
  private onNavigationStart(e: NavigationStart): void {
    this.leavingTrigger = e.navigationTrigger ?? 'imperative';
    clearTimeout(this.settleTimer);
    const leavingUrl = this.router.url;
    // Prefer the settled (content) snapshot of the page being left; fall back
    // to a live capture only if we never got a settled one (left too fast).
    this.pendingSnapshot = this.settled && this.settled.url === leavingUrl ? this.settled : this.captureCurrent();
  }

  private onNavigationEnd(): void {
    if (this.swiping() || this.finishing()) {
      // The gesture / back-button drove this navigation; teardown handles it.
      this.teardownAfterCommit();
      return;
    }
    if (this.leavingTrigger === 'popstate') {
      this.popStack();
    } else if (this.pendingSnapshot) {
      this.pushStack(this.pendingSnapshot);
    }
    this.pendingSnapshot = null;
    this.settled = null;

    // Re-snapshot once the new page has had time to render its data, so the
    // next back-swipe previews real content instead of its skeleton.
    clearTimeout(this.settleTimer);
    this.settleTimer = setTimeout(() => {
      this.settled = this.captureCurrent();
    }, SETTLE_MS);
  }

  private captureCurrent(): PageSnapshot | null {
    const host = this.currentRef()?.nativeElement;
    if (!host || !host.firstElementChild) {
      return null;
    }
    const node = host.cloneNode(true) as HTMLElement;
    node.classList.remove('page-current'); // stop the stage selectors from re-targeting it
    node.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    return { url: this.router.url, node, scrollY: window.scrollY };
  }

  private pushStack(snap: PageSnapshot): void {
    this.stack.push(snap);
    if (this.stack.length > STACK_MAX) {
      this.stack.shift();
    }
    this.stackLen.set(this.stack.length);
  }

  private popStack(): PageSnapshot | undefined {
    const snap = this.stack.pop();
    this.stackLen.set(this.stack.length);
    return snap;
  }

  // ── Pointer gesture (edge strip captures it) ────────────────────────────────
  onEdgeDown(e: PointerEvent): void {
    if (e.button > 0 || !this.armed()) {
      return;
    }
    this.active = true;
    this.moved = false;
    this.startX = this.lastX = e.clientX;
    this.startY = e.clientY;
    this.lastT = e.timeStamp;
    // Capture so we keep getting move/up even as the finger leaves the strip
    // and travels across the page (the page can't steal the gesture).
    this.edgeRef()?.nativeElement.setPointerCapture?.(e.pointerId);
  }

  onEdgeMove(e: PointerEvent): void {
    if (!this.active) {
      return;
    }
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    if (!this.moved) {
      if (Math.hypot(dx, dy) < START_THRESHOLD) {
        return;
      }
      if (dx <= 0 || Math.abs(dx) <= Math.abs(dy)) {
        this.active = false; // vertical / leftward — not a back-swipe
        return;
      }
      this.moved = true;
      if (!this.arm()) {
        this.active = false;
        return;
      }
      this.swiping.set(true);
    }

    e.preventDefault();
    const x = Math.max(0, Math.min(this.width, dx));
    this.setProgress(x / this.width, x);
    this.lastX = e.clientX;
    this.lastT = e.timeStamp;
  }

  onEdgeUp(e: PointerEvent): void {
    if (!this.swiping()) {
      this.active = false;
      return;
    }
    const dx = Math.max(0, Math.min(this.width, e.clientX - this.startX));
    const p = dx / this.width;
    const v = (e.clientX - this.lastX) / Math.max(1, e.timeStamp - this.lastT);
    this.active = false;
    if (p >= COMMIT_FRACTION || v >= COMMIT_VELOCITY) {
      this.commit();
    } else {
      this.cancel();
    }
  }

  onEdgeCancel(): void {
    if (this.swiping()) {
      this.cancel();
    }
    this.active = false;
  }

  // ── Programmatic back (used by detail-header back chevron) ─────────────────
  /** Returns true if the animation took over; caller should suppress its own nav. */
  private animatedBack(): boolean {
    if (!this.enabledSig() || this.swiping() || this.finishing() || !this.stack.length) {
      return false;
    }
    if (!this.arm()) {
      return false;
    }
    // Force a layout read so the from-state is committed before the transition.
    void this.stageRef()?.nativeElement.offsetWidth;
    this.commit();
    return true;
  }

  // ── Animation primitives ───────────────────────────────────────────────────
  /** Mount the previous-page snapshot behind the live page at p=0. */
  private arm(): boolean {
    const stage = this.stageRef()?.nativeElement;
    const prev = this.prevRef()?.nativeElement;
    const current = this.currentRef()?.nativeElement;
    const snap = this.stack[this.stack.length - 1];
    if (!stage || !prev || !current || !snap) {
      return false;
    }
    this.snapshot = snap;
    this.width = stage.clientWidth || window.innerWidth;

    // Pin .page-prev to the live .page-current's exact viewport box so the
    // clone gets the identical width/position the real page does — any
    // safe-area-inset / scrollbar / breakpoint discrepancy is gone, and the
    // commit hand-off is pixel-stable (no padding flicker on arrival).
    const rect = current.getBoundingClientRect();
    prev.style.top = `${rect.top}px`;
    prev.style.left = `${rect.left}px`;
    prev.style.width = `${rect.width}px`;
    prev.style.height = `${rect.height}px`;
    prev.style.right = 'auto';
    prev.style.bottom = 'auto';

    prev.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'page-prev-scroll';
    wrap.style.transform = `translateY(${-snap.scrollY}px)`;
    wrap.appendChild(snap.node);
    prev.appendChild(wrap);

    this.setProgress(0, 0);
    return true;
  }

  private setProgress(p: number, x: number): void {
    this.swipeP.set(p);
    this.swipeX.set(x);
  }

  private commit(): void {
    this.swiping.set(false);
    this.finishing.set(true);
    this.setProgress(1, this.width);
    // Navigate once the slide-out has played; NavigationEnd does the teardown.
    setTimeout(() => this.location.back(), FINISH_MS);
  }

  private cancel(): void {
    this.swiping.set(false);
    this.finishing.set(true);
    this.setProgress(0, 0);
    setTimeout(() => this.reset(), FINISH_MS + 40);
  }

  private teardownAfterCommit(): void {
    this.popStack(); // the page we previewed is now the live one
    requestAnimationFrame(() => this.reset());
  }

  private reset(): void {
    const prev = this.prevRef()?.nativeElement;
    if (prev) {
      prev.innerHTML = '';
      // Drop the pinned rect; next arm() reads a fresh one.
      prev.style.top = '';
      prev.style.left = '';
      prev.style.width = '';
      prev.style.height = '';
      prev.style.right = '';
      prev.style.bottom = '';
    }
    this.snapshot = null;
    this.swiping.set(false);
    this.finishing.set(false);
    this.setProgress(0, 0);
    this.active = false;
    this.moved = false;
  }

  // ── Eligibility ───────────────────────────────────────────────────────────
  private computeEnabled(): boolean {
    if (typeof matchMedia === 'undefined') {
      return false;
    }
    return (
      matchMedia('(max-width: 767px)').matches &&
      matchMedia('(pointer: coarse)').matches &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  private refreshEnabled(): void {
    this.enabledSig.set(this.computeEnabled());
  }
}

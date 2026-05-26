import {
  ChangeDetectionStrategy,
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  Renderer2,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LedgerService } from '../services/ledger.service';
import { OrganizationsService } from '../services/organizations.service';
import { PrivacyService } from '../services/privacy.service';
import { SidebarStateService } from '../services/sidebar-state.service';
import { UserService } from '../services/user.service';
import { IconComponent } from '../shared/components/icon/icon';
import { PageStageComponent } from '../shared/components/page-stage/page-stage';
import { ToastContainerComponent } from '../shared/components/toast-container/toast-container';
import { ToggleComponent } from '../shared/components/toggle/toggle';
import { BtnDirective } from '../shared/directives/btn.directive';
import { Menu, MenuItem as NgMenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { FocusTrapDirective } from '../shared/directives/focus-trap.directive';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  exact?: boolean;
  /** Mobile only: relocate this item from a bottom-nav tab into the "more" menu. */
  more?: boolean;
  /** Mobile only: label override for the bottom-nav tab (falls back to label). */
  mobileLabel?: string;
}

/** Pixels of travel before a press is treated as a horizontal swipe. */
const DRAG_THRESHOLD = 8;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    PageStageComponent,
    ToastContainerComponent,
    ToggleComponent,
    BtnDirective,
    IconComponent,
    Menu,
    NgMenuItem,
    MenuTrigger,
    OverlayModule,
    FocusTrapDirective,
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
})
export class AppLayoutComponent implements OnInit, AfterViewInit {
  private readonly authService = inject(AuthService);
  protected readonly userService = inject(UserService);
  protected readonly privacyService = inject(PrivacyService);
  protected readonly sidebarState = inject(SidebarStateService);
  private readonly ledgerService = inject(LedgerService);
  protected readonly organizationsService = inject(OrganizationsService);
  private readonly router = inject(Router);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  readonly organizations = this.organizationsService.organizations;
  readonly activeLedgerId = computed(() => this.userService.user()?.activeLedgerId ?? null);
  readonly activeOrg = computed(
    () =>
      this.organizations().find((o) => o.ledgers.some((l) => l.id === this.activeLedgerId())) ??
      this.organizations().at(0) ??
      null,
  );
  readonly activeLedger = computed(() => {
    const id = this.activeLedgerId();
    for (const org of this.organizations()) {
      const found = org.ledgers.find((l) => l.id === id);
      if (found) {
        return found;
      }
    }
    return this.activeOrg()?.ledgers.at(0) ?? null;
  });
  /** The switcher only appears when there's more than one ledger to switch between
   *  (which also covers the multiple-orgs case, since every org has at least one ledger). */
  readonly canSwitchWorkspace = computed(
    () => this.organizations().reduce((n, o) => n + o.ledgers.length, 0) > 1,
  );

  /** Aria menu instances, referenced by their triggers via `[menu]`. */
  readonly orgMenu = viewChild<Menu<string>>('orgMenu');
  readonly userMenu = viewChild<Menu<string>>('userMenu');

  private readonly bottomNav = viewChild<ElementRef<HTMLElement>>('bottomNav');
  private readonly navSlots = viewChildren<ElementRef<HTMLElement>>('navSlot');

  /** Measured geometry of each tab slot, relative to the nav's left edge.
     Driving the pill from real rects (not calc) kills the sub-pixel drift that
     made the highlight creep off the icon further to the right. */
  private readonly slotRects = signal<{ left: number; width: number }[]>([]);

  menu: MenuItem[] = [
    {
      label: 'components.sidebar.menu.dashboard',
      mobileLabel: 'components.sidebar.menu.home',
      route: '/app',
      icon: 'layout-dashboard',
      exact: true,
    },
    { label: 'components.sidebar.menu.accounts', route: '/app/accounts', icon: 'wallet' },
    { label: 'components.sidebar.menu.reports', route: '/app/reports', icon: 'scale', more: true },
    { label: 'components.sidebar.menu.budgets', route: '/app/budgets', icon: 'circle-dollar-sign' },
    { label: 'components.sidebar.menu.importTransactions', route: '/app/import', icon: 'file-text' },
  ];

  /** Tabs shown in the mobile bottom nav — everything not pushed into "more". */
  readonly bottomNavItems = this.menu.filter((m) => !m.more);

  /** Items relocated into the bottom-nav "more" popup on mobile. */
  readonly moreItems = this.menu.filter((m) => m.more);

  /** Total tab slots in the bottom nav (route items + the profile tab). */
  readonly navCount = computed(() => this.bottomNavItems.length + 1);

  /** Route tab the current URL maps to. Sticks on profile-only pages (settings/manage). */
  readonly activeIndex = signal(0);

  /** Visual resting position of the glass pill — fractional while a finger drags. */
  readonly navPos = signal(0);

  /** Horizontal scale of the pill: >1 stretches it like liquid mid-drag. */
  readonly stretch = signal(1);

  /** True while a horizontal swipe is in progress (disables the slide tween). */
  readonly dragging = signal(false);

  /** True briefly while the pill slides between tabs on a tap/route change —
     drives the same "grows taller than the bar + soft edges" liquid feel as a
     drag, then clears so it snaps crisp on the target. */
  readonly moving = signal(false);
  private movingTimer?: ReturnType<typeof setTimeout>;

  /** Tab currently under the finger during a drag — gets a live highlight. */
  readonly hotIndex = signal(-1);

  /** A finger/pointer is held down on the nav — drives the loupe magnify. */
  readonly pressed = signal(false);

  /** Mobile "More" sheet. Kept separate from the desktop sidebar's
     `userMenuOpen` so the two surfaces never interfere. */
  readonly moreOpen = signal(false); // mounted in the DOM
  readonly moreShown = signal(false); // visually slid in (drives the transition)

  /** Px the sheet is dragged down while swiping to dismiss. */
  readonly sheetDrag = signal(0);
  readonly sheetDragging = signal(false);
  readonly sheetTranslate = computed(() => `${this.sheetDrag()}px`);

  /** Pill x/width as px strings, lerped from the measured slot rects for the
     current (possibly fractional) navPos. `null` → CSS calc fallback. */
  private readonly pillMetrics = computed<{ x: string; w: string } | null>(() => {
    const rects = this.slotRects();
    if (!rects.length) {
      return null;
    }
    const pos = this.navPos();
    const last = rects.length - 1;
    const i0 = Math.max(0, Math.min(last, Math.floor(pos)));
    const i1 = Math.max(0, Math.min(last, Math.ceil(pos)));
    const f = pos - i0;
    const left = rects[i0].left + (rects[i1].left - rects[i0].left) * f;
    const width = rects[i0].width + (rects[i1].width - rects[i0].width) * f;
    return { x: `${left}px`, w: `${width}px` };
  });

  readonly indX = computed(() => this.pillMetrics()?.x ?? null);
  readonly indW = computed(() => this.pillMetrics()?.w ?? null);

  userInitial = computed(() => {
    const name = this.userService.user()?.name;
    return name?.charAt(0)?.toUpperCase() ?? 'U';
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.syncActiveFromUrl());

    // The window resize listener can't live in the host object (it targets window); torn down on destroy.
    this.destroyRef.onDestroy(this.renderer.listen('window', 'resize', () => this.measureSlots()));
  }

  ngOnInit() {
    this.userService.fetchUser();
    this.ledgerService.fetch();
    this.organizationsService.fetch();
    this.syncActiveFromUrl();
  }

  async switchLedger(ledgerId: string | undefined) {
    this.orgMenu()?.close();
    if (!ledgerId || ledgerId === this.activeLedgerId()) {
      return;
    }
    await this.organizationsService.switchToLedger(ledgerId);
  }

  ngAfterViewInit() {
    // Measure once the bar has laid out (and after web fonts settle the labels).
    requestAnimationFrame(() => this.measureSlots());
  }

  /** Cache each tab's real position/size so the pill can track it exactly. */
  private measureSlots() {
    const nav = this.bottomNav()?.nativeElement;
    const slots = this.navSlots();
    if (!nav || !slots.length) {
      return;
    }
    const navLeft = nav.getBoundingClientRect().left;
    this.slotRects.set(
      slots.map((s) => {
        const r = s.nativeElement.getBoundingClientRect();
        return { left: r.left - navLeft, width: r.width };
      }),
    );
  }

  /** Resolve the deepest route tab matching the current URL and park the pill there. */
  private syncActiveFromUrl() {
    const url = this.router.url.split(/[?#]/)[0];
    let best = -1;
    let bestLen = -1;
    this.bottomNavItems.forEach((item, i) => {
      const matches = item.exact ? url === item.route : url === item.route || url.startsWith(item.route + '/');
      if (matches && item.route.length > bestLen) {
        best = i;
        bestLen = item.route.length;
      }
    });
    if (best < 0) {
      return; // profile-only page — leave the pill where it was
    }
    this.activeIndex.set(best);
    if (!this.dragging()) {
      if (this.navPos() !== best) {
        this.flagMoving();
      }
      this.navPos.set(best);
      this.stretch.set(1);
    }
    // A route change can alter viewport width (scrollbars); keep rects fresh.
    requestAnimationFrame(() => this.measureSlots());
  }

  /** Briefly mark the pill as "in motion" so it bulges + softens while it
     travels, then settles crisp. Re-armed on every hop so rapid taps stay fluid. */
  private flagMoving() {
    this.moving.set(true);
    clearTimeout(this.movingTimer);
    this.movingTimer = setTimeout(() => this.moving.set(false), 300);
  }

  // ── Tap / keyboard activation ───────────────────────────────────────────────
  selectTab(index: number) {
    if (this.navPos() !== index) {
      this.flagMoving();
    }
    this.activeIndex.set(index);
    this.navPos.set(index);
    this.stretch.set(1);
    this.router.navigate([this.bottomNavItems[index].route]);
  }

  // ── Press + horizontal swipe ────────────────────────────────────────────────
  private pressing = false;
  private moved = false;
  private startX = 0;
  private startY = 0;
  private lastX = 0;
  private lastT = 0;

  onPointerDown(event: PointerEvent) {
    if (event.button > 0) {
      return; // ignore right/middle click
    }
    this.pressing = true;
    this.pressed.set(true);
    this.moved = false;
    this.startX = this.lastX = event.clientX;
    this.startY = event.clientY;
    this.lastT = event.timeStamp;
  }

  onPointerMove(event: PointerEvent) {
    if (!this.pressing) {
      return;
    }
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    if (!this.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) {
        return;
      }
      // Only hijack clearly-horizontal intent so vertical scroll still works.
      if (Math.abs(dx) <= Math.abs(dy)) {
        this.pressing = false;
        this.pressed.set(false);
        return;
      }
      this.moved = true;
      this.dragging.set(true);
    }

    event.preventDefault();
    const pos = this.posFromClientX(event.clientX);
    this.navPos.set(pos);
    this.hotIndex.set(Math.round(pos));

    const dt = Math.max(1, event.timeStamp - this.lastT);
    const velocity = Math.abs(event.clientX - this.lastX) / dt; // px/ms
    this.stretch.set(Math.min(1.35, 1 + velocity * 0.5));
    this.lastX = event.clientX;
    this.lastT = event.timeStamp;
  }

  onPointerUp() {
    this.pressed.set(false);
    if (!this.pressing) {
      return;
    }
    const wasDrag = this.moved;
    this.pressing = false;
    this.moved = false;
    this.hotIndex.set(-1);
    this.stretch.set(1);

    if (!wasDrag) {
      this.dragging.set(false);
      return; // a tap — the button's (click) handles activation
    }

    const target = Math.round(this.navPos());
    this.dragging.set(false);
    if (target >= this.bottomNavItems.length) {
      // Released on the profile tab: don't open the menu from a swipe — settle back.
      this.navPos.set(this.activeIndex());
      return;
    }
    this.selectTab(target);
  }

  onPointerCancel() {
    this.pressed.set(false);
    if (!this.pressing && !this.moved) {
      return;
    }
    this.pressing = false;
    this.moved = false;
    this.dragging.set(false);
    this.hotIndex.set(-1);
    this.stretch.set(1);
    this.navPos.set(this.activeIndex());
  }

  /** Map a clientX to a fractional tab position so the pill centres under the
     finger. Uses the measured slot rects so drag matches the resting geometry. */
  private posFromClientX(clientX: number): number {
    const el = this.bottomNav()?.nativeElement;
    if (!el) {
      return this.navPos();
    }
    const navLeft = el.getBoundingClientRect().left;
    const rects = this.slotRects();
    const last = rects.length - 1;

    if (last >= 1) {
      const x = clientX - navLeft;
      const centre = (i: number) => rects[i].left + rects[i].width / 2;
      if (x <= centre(0)) {
        return 0;
      }
      if (x >= centre(last)) {
        return last;
      }
      for (let i = 0; i < last; i++) {
        const a = centre(i);
        const b = centre(i + 1);
        if (x <= b) {
          return i + (x - a) / (b - a);
        }
      }
      return last;
    }

    // Fallback before the rects are measured: assume uniform slots.
    const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const count = this.navCount();
    const tabWidth = (el.getBoundingClientRect().width - pad * 2) / count;
    if (tabWidth <= 0) {
      return this.navPos();
    }
    const pos = (clientX - navLeft - pad) / tabWidth - 0.5;
    return Math.min(count - 1, Math.max(0, pos));
  }

  // ── Mobile "More" sheet ─────────────────────────────────────────────────────
  private moreCloseTimer?: ReturnType<typeof setTimeout>;

  toggleMore(event: Event) {
    event.stopPropagation();
    if (this.moreOpen()) {
      this.closeMore();
    } else {
      this.openMore();
    }
  }

  private openMore() {
    clearTimeout(this.moreCloseTimer);
    this.sheetDrag.set(0);
    this.sheetDragging.set(false);
    this.moreOpen.set(true);
    // Mount off-screen, then flip to shown next frame so the slide-in runs.
    requestAnimationFrame(() => requestAnimationFrame(() => this.moreShown.set(true)));
  }

  closeMore() {
    if (!this.moreOpen() || !this.moreShown()) {
      return;
    }
    this.moreShown.set(false);
    this.sheetDragging.set(false);
    this.moreCloseTimer = setTimeout(() => {
      this.moreOpen.set(false);
      this.sheetDrag.set(0);
    }, 360);
  }

  private sheetStartY = 0;
  private sheetPressing = false;

  onSheetPointerDown(event: PointerEvent) {
    if (event.button > 0) {
      return;
    }
    this.sheetPressing = true;
    this.sheetStartY = event.clientY;
  }

  onSheetPointerMove(event: PointerEvent) {
    if (!this.sheetPressing) {
      return;
    }
    const dy = event.clientY - this.sheetStartY;
    if (dy <= 0) {
      if (this.sheetDragging()) {
        this.sheetDrag.set(0);
      }
      return;
    }
    if (!this.sheetDragging()) {
      this.sheetDragging.set(true);
    }
    event.preventDefault();
    this.sheetDrag.set(dy);
  }

  onSheetPointerUp() {
    if (!this.sheetPressing) {
      return;
    }
    this.sheetPressing = false;
    const dragged = this.sheetDrag();
    this.sheetDragging.set(false);
    if (dragged > 90) {
      this.closeMore();
    } else {
      this.sheetDrag.set(0);
    }
  }

  goTo(route: string) {
    this.closeMore();
    this.router.navigate([route]);
  }

  goToSettings() {
    this.closeMore();
    this.router.navigate(['/app/settings']);
  }

  goToManage() {
    this.closeMore();
    this.router.navigate(['/app/manage']);
  }

  async togglePrivacy() {
    this.privacyService.toggle();
    try {
      await this.userService.updatePreferences({ privacyMode: this.privacyService.isPrivate() });
    } catch {
      // stub
    }
  }

  async logout() {
    this.closeMore();
    await this.authService.logout();
  }

  /** Route a user-menu selection (the Aria menu emits the chosen item's value). */
  onUserMenuSelect(value: string) {
    this.userMenu()?.close();
    switch (value) {
      case 'privacy':
        this.togglePrivacy();
        break;
      case 'settings':
        this.goToSettings();
        break;
      case 'manage':
        this.goToManage();
        break;
      case 'logout':
        this.logout();
        break;
    }
  }
}

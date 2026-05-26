import { AfterViewInit, Directive, ElementRef, OnDestroy, inject, output } from '@angular/core';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Keeps keyboard focus inside an open dialog/sheet: moves focus in on open, wraps Tab/Shift+Tab at the
 * edges, and restores focus to the opener when the element is destroyed. Emits `(escape)` so the host
 * decides how to close. Apply to the dialog container (give it `tabindex="-1"` as a focus fallback).
 */
@Directive({
  selector: '[appFocusTrap]',
  host: { '(keydown)': 'onKeydown($event)' },
})
export class FocusTrapDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly escape = output<void>();

  private previouslyFocused: HTMLElement | null = null;

  ngAfterViewInit(): void {
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    // Defer so projected/animated content has rendered before we move focus in.
    queueMicrotask(() => this.focusFirst());
  }

  ngOnDestroy(): void {
    this.previouslyFocused?.focus?.();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.escape.emit();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const focusable = this.focusable();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusable(): HTMLElement[] {
    return Array.from(this.el.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (e) => e.offsetParent !== null,
    );
  }

  private focusFirst(): void {
    (this.focusable()[0] ?? this.el.nativeElement).focus();
  }
}

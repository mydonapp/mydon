import { Component, DestroyRef, HostListener, effect, inject, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class ModalComponent {
  open     = input(false);
  boxClass = input('');
  closed   = output<void>();

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      if (this.open()) {
        this.lockScroll();
      } else {
        this.unlockScroll();
      }
    });

    this.destroyRef.onDestroy(() => this.unlockScroll());
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.closed.emit();
  }

  private lockScroll(): void {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  private unlockScroll(): void {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
}

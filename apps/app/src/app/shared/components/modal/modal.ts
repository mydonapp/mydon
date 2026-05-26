import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { FocusTrapDirective } from '../../directives/focus-trap.directive';

@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.html',
  styleUrl: './modal.css',
  imports: [FocusTrapDirective],
})
export class ModalComponent {
  open = input(false);
  boxClass = input('');
  closed = output<void>();

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

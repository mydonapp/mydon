import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class ModalComponent {
  open     = input(false);
  boxClass = input('');
  closed   = output<void>();

  private readonly dialogEl =
    viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialogEl()?.nativeElement;
      if (!el) return;
      if (this.open()) {
        if (!el.open) el.showModal();
      } else {
        if (el.open) el.close();
      }
    });
  }

  onDialogClose(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    const el = this.dialogEl()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      this.closed.emit();
    }
  }
}

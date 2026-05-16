import { Component, computed, input } from '@angular/core';

export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.css',
})
export class ProgressBarComponent {
  value = input(0);
  variant = input<ProgressBarVariant>('default');

  readonly clamped = computed(() => Math.min(100, Math.max(0, this.value())));
}

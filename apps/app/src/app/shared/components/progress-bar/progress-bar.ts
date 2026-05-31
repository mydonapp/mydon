import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'error';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.css',
})
export class ProgressBarComponent {
  value = input(0);
  variant = input<ProgressBarVariant>('default');

  /** Optional 0–100 reference position (e.g. "expected pace"); renders a thin vertical line. */
  readonly marker = input<number | null>(null);

  readonly ariaLabel = input<string>('');

  readonly clamped = computed(() => Math.min(100, Math.max(0, this.value())));

  readonly clampedMarker = computed(() => {
    const m = this.marker();
    return m === null ? null : Math.min(100, Math.max(0, m));
  });
}

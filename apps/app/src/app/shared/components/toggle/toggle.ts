import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toggle',
  templateUrl: './toggle.html',
  styleUrl: './toggle.css',
})
export class ToggleComponent {
  value = input(false);
  size = input<'sm' | 'md' | 'lg'>('md');
  disabled = input(false);

  readonly ariaLabel = input<string>('');

  valueChange = output<boolean>();

  toggle(): void {
    if (!this.disabled()) {
      this.valueChange.emit(!this.value());
    }
  }
}

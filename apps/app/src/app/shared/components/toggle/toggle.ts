import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-toggle',
  templateUrl: './toggle.html',
  styleUrl: './toggle.css',
})
export class ToggleComponent {
  value    = input(false);
  size     = input<'sm' | 'md' | 'lg'>('md');
  disabled = input(false);

  valueChange = output<boolean>();

  toggle(): void {
    if (!this.disabled()) {
      this.valueChange.emit(!this.value());
    }
  }
}

import { Component, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-icon',
  imports: [LucideDynamicIcon],
  templateUrl: './icon.html',
  host: { class: 'inline-flex items-center justify-center flex-shrink-0' },
})
export class IconComponent {
  name = input.required<string>();
  size = input<number>(18);
  strokeWidth = input<number>(1.5);
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-icon',
  imports: [LucideDynamicIcon],
  templateUrl: './icon.html',
  host: {
    class: 'inline-flex items-center justify-center flex-shrink-0',
    '[attr.aria-hidden]': "ariaLabel() ? null : 'true'",
    '[attr.role]': "ariaLabel() ? 'img' : null",
    '[attr.aria-label]': 'ariaLabel() || null',
  },
})
export class IconComponent {
  name = input.required<string>();
  size = input<number>(18);
  strokeWidth = input<number>(1.5);
  /** Accessible name. When set, the icon is exposed as `role="img"` with this label; otherwise it is
   *  hidden from assistive tech (decorative — the default, since icons usually sit beside a text label). */
  readonly ariaLabel = input<string>('');
}

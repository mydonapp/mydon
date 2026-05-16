import { Directive, input } from '@angular/core';

@Directive({
  selector: '[appCard]',
  host: {
    class: 'card',
    '[class.card-elevated]': 'elevated()',
  },
})
export class CardDirective {
  elevated = input(false);
}

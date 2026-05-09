import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.html',
  imports: [],
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>('');
}

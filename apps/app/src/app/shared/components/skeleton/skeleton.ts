import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-skeleton',
  template: '',
  styleUrl: './skeleton.css',
  host: { 'aria-hidden': 'true' },
})
export class SkeletonComponent {}

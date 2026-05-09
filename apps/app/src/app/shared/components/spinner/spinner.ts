import { Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.html',
  styleUrl: './spinner.css',
})
export class SpinnerComponent {
  size = input<'sm' | 'md' | 'lg'>('md');
}

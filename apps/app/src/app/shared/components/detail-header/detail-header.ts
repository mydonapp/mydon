import { Component, HostListener, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-detail-header',
  templateUrl: './detail-header.html',
  styleUrl: './detail-header.css',
  imports: [RouterLink, IconComponent],
})
export class DetailHeaderComponent {
  readonly backLink = input.required<string | unknown[]>();
  readonly backLabel = input.required<string>();
  readonly title = input.required<string>();

  private readonly scrollY = signal(0);
  readonly isScrolled = computed(() => this.scrollY() > 20);
  readonly isScrolling = computed(() => this.scrollY() > 5);

  @HostListener('window:scroll')
  onScroll(): void { this.scrollY.set(window.scrollY); }
}

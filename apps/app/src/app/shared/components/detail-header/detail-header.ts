import { Component, HostListener, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BackNavigator } from '../../back-navigator';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-detail-header',
  templateUrl: './detail-header.html',
  styleUrl: './detail-header.css',
  imports: [IconComponent],
})
export class DetailHeaderComponent {
  readonly backLink = input.required<string | unknown[]>();
  readonly backLabel = input.required<string>();
  readonly title = input.required<string>();

  private readonly backNavigator = inject(BackNavigator);
  private readonly router = inject(Router);

  /** Hand off to the animated back when PageStage can take over; otherwise do
     the navigation programmatically. We own the click entirely so there's no
     `routerLink` listener navigating in parallel — that caused a double-hop. */
  onBack(event: MouseEvent): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    event.preventDefault();
    if (this.backNavigator.back()) {
      return;
    }
    const link = this.backLink();
    if (Array.isArray(link)) {
      void this.router.navigate(link);
    } else {
      void this.router.navigateByUrl(link);
    }
  }

  private readonly scrollY = signal(0);
  readonly isScrolled = computed(() => this.scrollY() > 20);
  readonly isScrolling = computed(() => this.scrollY() > 5);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrollY.set(window.scrollY);
  }
}

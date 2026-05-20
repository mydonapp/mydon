import { Injectable } from '@angular/core';

/**
 * Tiny coordination service so in-app back buttons can trigger the same
 * animated back the swipe gesture uses. PageStage registers a handler; the
 * back button calls back(). Returns true if a handler took over (caller
 * should preventDefault its routerLink) and false if there's nothing to
 * animate (desktop, deep-linked with no history).
 */
@Injectable({ providedIn: 'root' })
export class BackNavigator {
  private handler: (() => boolean) | null = null;

  register(handler: () => boolean): void {
    this.handler = handler;
  }

  back(): boolean {
    return this.handler?.() ?? false;
  }
}

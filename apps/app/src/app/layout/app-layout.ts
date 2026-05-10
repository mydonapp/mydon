import { Component, inject, computed, signal, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { PrivacyService } from '../services/privacy.service';
import { SidebarStateService } from '../services/sidebar-state.service';
import { ToastContainerComponent } from '../shared/components/toast-container/toast-container';
import { ToggleComponent } from '../shared/components/toggle/toggle';
import { BtnDirective } from '../shared/directives/btn.directive';
import { IconComponent } from '../shared/components/icon/icon';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    ToastContainerComponent,
    ToggleComponent,
    BtnDirective,
    IconComponent,
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
})
export class AppLayoutComponent implements OnInit {
  authService   = inject(AuthService);
  userService   = inject(UserService);
  privacyService = inject(PrivacyService);
  sidebarState  = inject(SidebarStateService);
  router       = inject(Router);

  userMenuOpen = signal(false);

  menu: MenuItem[] = [
    { label: 'components.sidebar.menu.dashboard',          route: '/app',          icon: 'layout-dashboard', exact: true },
    { label: 'components.sidebar.menu.accounts',           route: '/app/accounts', icon: 'wallet' },
    { label: 'components.sidebar.menu.budgets',            route: '/app/budgets',  icon: 'circle-dollar-sign' },
    { label: 'components.sidebar.menu.importTransactions', route: '/app/import',   icon: 'file-text' },
  ];

  userInitial = computed(() => {
    const name = this.userService.user()?.name;
    return name?.charAt(0)?.toUpperCase() ?? 'U';
  });

  userFirstName = computed(() => {
    const name = this.userService.user()?.name;
    return name?.split(' ')[0] ?? null;
  });

  ngOnInit() {
    this.userService.fetchUser();
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.userMenuOpen.update(v => !v);
  }

  goToSettings() {
    this.userMenuOpen.set(false);
    this.router.navigate(['/app/settings']);
  }

  goToManage() {
    this.userMenuOpen.set(false);
    this.router.navigate(['/app/manage']);
  }

  async logout() {
    this.userMenuOpen.set(false);
    await this.authService.logout();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.userMenuOpen.set(false);
  }
}

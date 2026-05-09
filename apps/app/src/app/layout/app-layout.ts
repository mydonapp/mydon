import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { PrivacyService } from '../services/privacy.service';
import { ToastContainerComponent } from '../shared/components/toast-container/toast-container';
import { BaseToggleComponent } from '../shared/components/base-toggle/base-toggle';
import { BaseButtonComponent } from '../shared/components/base-button/base-button';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  imports: [
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    ToastContainerComponent,
    BaseToggleComponent,
    BaseButtonComponent,
  ],
  templateUrl: './app-layout.html',
})
export class AppLayoutComponent implements OnInit {
  authService = inject(AuthService);
  userService = inject(UserService);
  privacyService = inject(PrivacyService);
  router = inject(Router);

  drawerOpen = false;

  menu: MenuItem[] = [
    {
      label: 'components.sidebar.menu.dashboard',
      route: '/app',
      icon: 'ri-dashboard-line',
    },
    {
      label: 'components.sidebar.menu.accounts',
      route: '/app/accounts',
      icon: 'ri-wallet-3-line',
    },
    {
      label: 'components.sidebar.menu.budgets',
      route: '/app/budgets',
      icon: 'ri-money-dollar-circle-line',
    },
    {
      label: 'components.sidebar.menu.manage',
      route: '/app/manage',
      icon: 'ri-list-settings-line',
    },
    {
      label: 'components.sidebar.menu.importTransactions',
      route: '/app/import',
      icon: 'ri-file-text-line',
    },
    {
      label: 'components.sidebar.menu.settings',
      route: '/app/settings',
      icon: 'ri-settings-3-line',
    },
  ];

  userInitial = computed(() => {
    const user = this.userService.user();
    return user?.name?.charAt(0)?.toUpperCase() || 'U';
  });

  ngOnInit() {
    this.userService.fetchUser();
  }

  closeDrawer() {
    this.drawerOpen = false;
  }

  async logout() {
    await this.authService.logout();
  }
}

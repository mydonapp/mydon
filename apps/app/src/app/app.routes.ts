import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth/login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/login').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/signup',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/signup').then(
        (m) => m.SignupComponent,
      ),
  },
  {
    path: 'app',
    loadComponent: () =>
      import('./layout/app-layout').then(
        (m) => m.AppLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'accounts',
        loadComponent: () =>
          import('./features/accounts/accounts').then(
            (m) => m.AccountsComponent,
          ),
      },
      {
        path: 'accounts/:id',
        loadComponent: () =>
          import('./features/account/account').then(
            (m) => m.AccountComponent,
          ),
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./features/import/import').then(
            (m) => m.ImportComponent,
          ),
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('./features/budgets/budgets').then(
            (m) => m.BudgetsComponent,
          ),
      },
      {
        path: 'budgets/:id',
        loadComponent: () =>
          import('./features/budget-detail/budget-detail').then(
            (m) => m.BudgetDetailComponent,
          ),
      },
      {
        path: 'manage',
        loadComponent: () =>
          import('./features/manage/manage').then(
            (m) => m.ManageComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings').then(
            (m) => m.SettingsComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];

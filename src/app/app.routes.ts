import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard], // Protect this route
  },
  {
    path: 'settings',
    // Lazy load the settings component for better performance
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent
      ),
    canActivate: [authGuard], // Also protect settings
  },
  {
    path: '',
    redirectTo: '/login', // Default to login
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/login', // Redirect unknown paths to login
  },
];

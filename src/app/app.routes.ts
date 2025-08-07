import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SettingsComponent } from './features/settings/settings.component'; // Will be created next

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'settings',
    // Lazy load the settings component for better performance
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent
      ),
  },
  {
    path: '',
    redirectTo: '/dashboard', // Default to dashboard, assuming user might be logged in
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/dashboard' // Redirect unknown paths to dashboard
  }
];

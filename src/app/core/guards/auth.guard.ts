import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if the user is authenticated (replace with your actual auth logic)
  if (authService.isAuthenticated()) {
    return true; // User is authenticated, allow access
  } else {
    // User is not authenticated, redirect to login page
    return router.parseUrl('/login');
  }
};

// guards/management-setup.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { environment } from '../environments/environment';

export const managementSetupGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Get token from query params
  const token = route.queryParams['token'];

  // Decode URL-encoded characters (e.g., %21 → !)
  const decodedToken = token ? decodeURIComponent(token) : null;

  // Compare against environment token
  if (decodedToken !== environment.managementSetupToken) {
    router.navigate(['/']);
    return false;
  }

  return true;
};

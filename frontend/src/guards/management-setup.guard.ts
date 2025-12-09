import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { environment } from '../environments/environment';

export const managementSetupGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = route.queryParams['token'];

  if (token !== environment.managementSetupToken) {
    router.navigate(['/']);
    return false;
  }
  return true;
};
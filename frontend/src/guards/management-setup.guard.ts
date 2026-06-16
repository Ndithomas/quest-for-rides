import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { environment } from '../environments/environment';

export const managementSetupGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = route.paramMap.get('token'); 

  if (token !== environment.managementSetupToken) {
    router.navigateByUrl('/');
    return false;
  }

  return true;
};
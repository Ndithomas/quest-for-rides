// guards/role-auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    authService.clearAuthData();
    router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url },
      replaceUrl: true
    });
    return false;
  }

  const user = authService.getUser();
  const userRole = (user?.role || user?.user_type || 'guest').toLowerCase();
  const requiredRoles: string[] = (route.data as any)['roles'] || [];

  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    const redirectMap: { [key: string]: string } = {
      'management': '/management-dashboard',
      'owner': '/owner-dashboard', 
      'guest': '/guest-dashboard'
    };
    const redirectPath = redirectMap[userRole] || '/';
    
    router.navigate([redirectPath], { replaceUrl: true });
    return false;
  }

  return true;
};
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleRedirectService {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  getDashboardRoute(): string {
    const user = this.authService.getUser();
    
    if (!user) {
      return '/login';
    }

    const role = user.role?.toLowerCase();
    
    switch (role) {
      case 'guest':
        return '/guest-dashboard';
      case 'owner':
        return '/owner-dashboard';
      case 'management':
        return '/management-dashboard';
      default:
        return '/';
    }
  }


  redirectToDashboard(): void {
    const route = this.getDashboardRoute();
    this.router.navigate([route]);
  }
}

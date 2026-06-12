import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleRedirectService } from '../services/role-redirect.service';
import { ProfileService } from '../services/profile.service';
import { NotificationService } from '../services/notification.service';

import { Subscription } from 'rxjs';

interface TokenUser {
  username?: string;
  role?: 'guest' | 'owner' | 'management';
  email?: string;
  user_id?: number;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private roleRedirect = inject(RoleRedirectService);
  private profileService = inject(ProfileService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  isLoggedIn = signal(false);
  username = signal<string>('Guest');
  unreadNotificationCount = signal(0);
  isScrolled = false;
  isSidebarOpen = signal(false);
  private notificationSubscription: Subscription | null = null;

  toggleSidebar(): void {
    this.isSidebarOpen.update(open => !open);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  ngOnInit(): void {
    this.updateAuthStatus();
    this.subscribeToNotifications();
  }

  private subscribeToNotifications(): void {
    if (this.isLoggedIn()) {
      this.notificationSubscription = this.notificationService.unreadCount$.subscribe(count => {
        this.unreadNotificationCount.set(count);
      });
      // Initial load
      this.notificationService.refreshUnreadCount();
    }
  }

  private updateAuthStatus(): void {
    const loggedIn = this.authService.isLoggedIn();
    this.isLoggedIn.set(loggedIn);

    if (!loggedIn) {
      this.username.set('User');
      return;
    }

    const userFromToken = this.authService.decodeUserFromToken() as TokenUser;
    if (userFromToken?.username) {
      this.username.set(userFromToken.username);
    }

    this.profileService.getProfile().subscribe({
      next: (profile) => {
        if (profile?.username) {
          this.username.set(profile.username);
        }
      },
      error: (err) => {
        console.error('Failed to load profile for navbar:', err);
      }
    });
  }

  goHome(): void {
    this.closeMobileMenu();
    if (this.isLoggedIn()) {
      this.roleRedirect.redirectToDashboard();
    } else {
      this.router.navigate(['/']);
    }
  }

  closeMobileMenu(): void {
    const navbar = document.querySelector('#navbarNav');
    if (navbar?.classList.contains('show')) {
      navbar.classList.remove('show');
    }
  }

  logout(): void {
    const refreshToken = this.authService.getRefreshToken();

    if (refreshToken) {
      this.authService.logout(refreshToken).subscribe({
        next: () => this.finalizeLogout(),
        error: () => this.finalizeLogout()
      });
    } else {
      this.finalizeLogout();
    }
  }

  private finalizeLogout(): void {
    this.authService.clearAuthData();
    this.updateAuthStatus();
    this.closeMobileMenu();
    this.closeSidebar();
    this.clearBrowserCache();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private clearBrowserCache(): void {
    if (typeof window === 'undefined') return;

    localStorage.clear();
    sessionStorage.clear();

    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }
    window.history.pushState(null, '', window.location.href);
  }

  getBookingsRoute(): string {
    const user = this.authService.decodeUserFromToken();
    switch (user?.role) {
      case 'guest':
        return '/bookings';
      case 'owner':
        return '/owner/bookings';
      case 'management':
        return '/management/bookings';
      default:
        return '/bookings';
    }
  }

  getBookingsLabel(): string {
    const user = this.authService.decodeUserFromToken();
    switch (user?.role) {
      case 'guest':
        return 'My Bookings';
      case 'owner':
        return 'Owner Bookings';
      case 'management':
        return 'All Bookings';
      default:
        return 'Bookings';
    }
  }

// CORRECT - This is a getter
get currentUserRole(): string | null {
  const user = this.authService.decodeUserFromToken();
  return user?.role || null;
}

  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }
}

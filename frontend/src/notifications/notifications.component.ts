import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../services/notification.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { Router, RouterLink } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { DateFormatPipe } from '../shared/pipes';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, RouterLink, DateFormatPipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications = signal<Notification[]>([]);
  loading = signal(true);
  error = signal('');
  filterType = signal<'all' | 'unread' | 'read'>('all');
  private pollSubscription: Subscription | null = null;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService // <-- inject
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
  }

  private startAutoRefresh(): void {
    this.pollSubscription = interval(10000).subscribe(() => {
      this.loadNotifications();
    });
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.error.set('');

    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.error.set('Failed to load notifications');
        this.loading.set(false);
      }
    });
  }

  getFilteredNotifications(): Notification[] {
    const filter = this.filterType();
    if (filter === 'unread') {
      return this.notifications().filter(n => !n.is_read);
    } else if (filter === 'read') {
      return this.notifications().filter(n => n.is_read);
    }
    return this.notifications();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        const updated_notifications = this.notifications().map(n => ({
          ...n,
          is_read: true
        }));
        this.notifications.set(updated_notifications);
        this.notificationService.refreshUnreadCount();
      },
      error: (err) => {
        console.error('Error marking all as read:', err);
      }
    });
  }

  deleteNotification(id: number, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        const updated_notifications = this.notifications().filter(n => n.id !== id);
        this.notifications.set(updated_notifications);
        this.notificationService.refreshUnreadCount();
      },
      error: (err) => {
        console.error('Error deleting notification:', err);
      }
    });
  }

  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'booking_created': 'bi-calendar-plus',
      'booking_confirmed': 'bi-check-circle',
      'booking_rejected': 'bi-x-circle',
      'booking_cancelled': 'bi-dash-circle',
      'booking_completed': 'bi-flag-fill',
      'payment_completed': 'bi-check-lg',
      'payment_failed': 'bi-exclamation-lg',
      'payment_refunded': 'bi-arrow-counterclockwise',
      'car_verified': 'bi-shield-check',
      'car_rejected': 'bi-shield-x',
      'review_received': 'bi-star-fill',
      'payout_requested': 'bi-cash-coin',
      'payout_approved': 'bi-check-circle',
      'payout_completed': 'bi-check-lg',
      'payout_rejected': 'bi-x-circle',
    };
    return iconMap[type] || 'bi-bell';
  }

  getNotificationColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'booking_created': 'info',
      'booking_confirmed': 'success',
      'booking_rejected': 'danger',
      'booking_cancelled': 'warning',
      'booking_completed': 'success',
      'payment_completed': 'success',
      'payment_failed': 'danger',
      'payment_refunded': 'warning',
      'car_verified': 'success',
      'car_rejected': 'danger',
      'review_received': 'warning',
      'payout_requested': 'info',
      'payout_approved': 'success',
      'payout_completed': 'success',
      'payout_rejected': 'danger',
    };
    return colorMap[type] || 'secondary';
  }

  getReadyNotifications(): Notification[] {
    return this.getFilteredNotifications();
  }

  getUnreadCount(): number {
    return this.notifications().filter(n => !n.is_read).length;
  }

  navigateToActivity(notification: Notification): void {
    // Mark as read when clicked (don't wait for response)
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: (updated) => {
          const index = this.notifications().findIndex(n => n.id === notification.id);
          if (index !== -1) {
            const updated_notifications = [...this.notifications()];
            updated_notifications[index] = updated;
            this.notifications.set(updated_notifications);
          }
          this.notificationService.refreshUnreadCount();
          this.performNavigation(notification);
        },
        error: (err) => {
          console.error('Error marking notification as read:', err);
          this.performNavigation(notification);
        }
      });
    } else {
      this.performNavigation(notification);
    }
  }

  private performNavigation(notification: Notification): void {
    if (notification.object_id) {
      let routeSegments: any[] | null = null;
      let queryParams = {};

      // Determine route based on notification type
      if (notification.notification_type.includes('booking')) {
        const user = this.authService.getUser();
        if (user) {
          if (user.role === 'guest') {
            routeSegments = ['/booking-confirmation', notification.object_id];
          } else if (user.role === 'owner') {
            routeSegments = ['/owner/bookings'];
            queryParams = { highlight: notification.object_id };
          } else if (user.role === 'management') {
            routeSegments = ['/booking-details', notification.object_id];
          }
        } else {
          console.warn('User not found, cannot determine route for booking notification');
          return;
        }
      } else if (notification.notification_type.includes('payment')) {
        routeSegments = ['/payment', notification.object_id];
      } else if (notification.notification_type.includes('payout')) {
        routeSegments = ['/owner', 'payouts', notification.object_id];
      } else if (notification.notification_type.includes('car')) {
        routeSegments = ['/cars', notification.object_id];
      } else if (notification.notification_type.includes('review')) {
        routeSegments = ['/reviews', notification.object_id];
      }

      if (routeSegments) {
        this.router.navigate(routeSegments, { queryParams });
      } else {
        console.warn('No route defined for notification type:', notification.notification_type);
      }
    } else {
      console.warn('Notification has no object_id');
    }
  }
}
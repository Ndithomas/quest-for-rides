import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../services/notification.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, RouterLink],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications = signal<Notification[]>([]);
  loading = signal(true);
  error = signal('');
  filterType = signal<'all' | 'unread' | 'read'>('all');

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {}

  loadNotifications(): void {
    this.loading.set(true);
    this.error.set('');

    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load notifications');
        console.error('Error loading notifications:', err);
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

  markAsRead(notification: Notification): void {
    if (notification.is_read) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: (updated) => {
        const index = this.notifications().findIndex(n => n.id === notification.id);
        if (index !== -1) {
          const updated_notifications = [...this.notifications()];
          updated_notifications[index] = updated;
          this.notifications.set(updated_notifications);
        }
        this.notificationService.refreshUnreadCount();
      },
      error: (err) => {
        console.error('Error marking notification as read:', err);
      }
    });
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

  deleteNotification(id: number): void {
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
      'payment_completed': 'bi-check-lg',
      'payment_failed': 'bi-exclamation-lg',
      'car_verified': 'bi-shield-check',
      'car_rejected': 'bi-shield-x',
      'booking_completed': 'bi-flag-fill',
      'review_received': 'bi-star-fill'
    };
    return iconMap[type] || 'bi-bell';
  }

  getNotificationColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'booking_created': 'info',
      'booking_confirmed': 'success',
      'booking_rejected': 'danger',
      'booking_cancelled': 'warning',
      'payment_completed': 'success',
      'payment_failed': 'danger',
      'car_verified': 'success',
      'car_rejected': 'danger',
      'booking_completed': 'success',
      'review_received': 'warning'
    };
    return colorMap[type] || 'secondary';
  }

  getReadyNotifications(): Notification[] {
    return this.getFilteredNotifications();
  }

  getUnreadCount(): number {
    return this.notifications().filter(n => !n.is_read).length;
  }
}

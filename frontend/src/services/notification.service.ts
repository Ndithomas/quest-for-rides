import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../environments/environment';
import { catchError, debounceTime } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  content_type?: number;
  object_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private basePath = '/api/notifications';
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();
  private refreshSubject = new Subject<void>();
  private platformId = inject(PLATFORM_ID);

  constructor(
    private api: ApiService,
    private authService: AuthService
  ) {
    if (isPlatformBrowser(this.platformId) && this.authService.isLoggedIn()) {
      this.setupRefreshListener();
      this.refreshUnreadCount();
    }
  }

  getNotifications(): Observable<Notification[]> {
    return this.api.get<Notification[]>(`${this.basePath}/`);
  }

  getNotification(id: number): Observable<Notification> {
    return this.api.get<Notification>(`${this.basePath}/${id}/`);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.api.patch<Notification>(`${this.basePath}/${id}/read/`, { is_read: true });
  }

  markAllAsRead(): Observable<any> {
    return this.api.post(`${this.basePath}/mark-all-read/`, {});
  }

  deleteNotification(id: number): Observable<any> {
    return this.api.delete(`${this.basePath}/${id}/delete/`);
  }

  getUnreadCount(): Observable<{ unread_count: number }> {
    return this.api.get<{ unread_count: number }>(`${this.basePath}/unread-count/`);
  }

  private setupRefreshListener(): void {
    this.refreshSubject.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.getUnreadCount()
        .pipe(
          catchError(() => {
            return new Observable<{ unread_count: number }>(observer => observer.next({ unread_count: 0 }));
          })
        )
        .subscribe(data => {
          this.unreadCountSubject.next(data.unread_count);
        });
    });
  }

  refreshUnreadCount(): void {
    this.refreshSubject.next();
  }
}
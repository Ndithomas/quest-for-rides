import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../environments/environment';
import { switchMap, catchError, debounceTime } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

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
  private apiUrl = `${environment.apiBaseUrl}/api/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();
  private refreshSubject = new Subject<void>();
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {
    if (isPlatformBrowser(this.platformId)) {
      this.startPolling();
      this.setupRefreshListener();
    }
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/`);
  }

  getNotification(id: number): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/${id}/`);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${id}/read/`, { is_read: true });
  }

  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-all-read/`, {});
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/delete/`);
  }

  getUnreadCount(): Observable<{ unread_count: number }> {
    return this.http.get<{ unread_count: number }>(`${this.apiUrl}/unread-count/`);
  }

  private startPolling(): void {
    // Poll every 15 seconds for unread count
    interval(15000)
      .pipe(
        switchMap(() => this.getUnreadCount()),
        catchError(() => {
          return new Observable<{ unread_count: number }>(observer => observer.next({ unread_count: 0 }));
        })
      )
      .subscribe((data: { unread_count: number }) => {
        this.unreadCountSubject.next(data.unread_count);
      });
  }

  private setupRefreshListener(): void {
    // When refreshUnreadCount is called multiple times, debounce it
    this.refreshSubject.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.getUnreadCount().subscribe(data => {
        this.unreadCountSubject.next(data.unread_count);
      });
    });
  }

  refreshUnreadCount(): void {
    this.refreshSubject.next();
  }
}

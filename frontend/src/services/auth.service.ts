import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/api/auth/`;

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { 
    this.hydrateAuthSession();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Restores session data from localStorage into memory instantly on page refresh
   */
  private hydrateAuthSession(): void {
    if (!this.isBrowser()) return;
    
    const token = this.getAccessToken();
    if (token) {
      const user = this.getUser();
      if (user) {
        this.currentUserSubject.next(user);
      }
    } else {
      this.clearAuthData();
    }
  }

  register(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}register/`, data).pipe(
      map(response => {
        this.setToken(response.access, response.refresh);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  login(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}login/`, data).pipe(
      map(response => {
        this.setToken(response.access, response.refresh);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  getUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}user-profile/`).pipe(
      map(user => {
        const safeUser = {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role
        };
        this.setUser(safeUser);
        return safeUser;
      }),
      catchError(this.handleError)
    );
  }

  refreshToken(refreshToken: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}token/refresh/`, { refresh: refreshToken }).pipe(
      tap((response: any) => {
        if (response.access) {
          localStorage.setItem('access_token', response.access);
          if (response.refresh) {
            localStorage.setItem('refresh_token', response.refresh);
          }
        }
      }),
      catchError((error) => {
        this.clearAuthData();
        this.router.navigate(['/login'], { replaceUrl: true });
        return throwError(() => error);
      })
    );
  }

  logout(refreshToken: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}logout/`, { refresh: refreshToken }).pipe(
      tap(() => {
        this.clearAuthData();
        this.preventBackNavigation();
        this.router.navigate(['/login'], { replaceUrl: true });
      }),
      catchError((error) => {
        this.clearAuthData();
        this.preventBackNavigation();
        this.router.navigate(['/login'], { replaceUrl: true });
        return throwError(() => error);
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}forgot-password/`, { email }).pipe(
      catchError(this.handleError)
    );
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}reset-password/`, data).pipe(
      catchError(this.handleError)
    );
  }

  checkManagementUsers(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}management-exists/`).pipe(
      catchError(() => [false])
    );
  }

  decodeUserFromToken(): any {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(base64));

      return {
        id: decoded.user_id,
        username: decoded.username || '',
        role: decoded.role || 'guest'
      };
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

  private setToken(access: string, refresh: string): void {
    if (!this.isBrowser()) return;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    this.enableBackNavigation();
    
    // Automatically extract user info right when tokens are set
    const user = this.getUser();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  private setUser(user: any): void {
    if (!this.isBrowser()) return;
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getAccessToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem('refresh_token');
  }

  getUser(): any {
    if (!this.isBrowser()) return null;

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    return this.decodeUserFromToken();
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  clearAuthData(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    this.currentUserSubject.next(null);
  }

  private preventBackNavigation(): void {
    if (!this.isBrowser()) return;
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', this.onBrowserBack);
  }

  private onBrowserBack = (): void => {
    if (this.isLoggedIn()) return;
    history.pushState(null, '', location.href);
    this.router.navigate(['/login'], { replaceUrl: true });
  };

  enableBackNavigation(): void {
    if (!this.isBrowser()) return;
    window.removeEventListener('popstate', this.onBrowserBack);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.status === 0) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    } else if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
        if (error.error.missing) {
          errorMessage = `Missing required fields: ${error.error.missing.join(', ')}`;
        }
      } else if (typeof error.error === 'object') {
        const errors = this.extractValidationErrors(error.error);
        errorMessage = errors.length > 0 ? errors.join(' ') : errorMessage;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  private extractValidationErrors(errorObject: any): string[] {
    const errors: string[] = [];
    for (const key in errorObject) {
      const value = errorObject[key];
      if (Array.isArray(value)) {
        errors.push(...value);
      } else if (typeof value === 'string') {
        errors.push(value);
      }
    }
    return errors;
  }
}
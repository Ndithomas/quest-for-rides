import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/api/auth/`;
  private _user: any = null;
  private _token: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // 🔄 Restore state on service init
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    if (token) {
      this._token = token;
      this._user = user ? JSON.parse(user) : this.decodeUserFromToken();
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
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
          this.setToken(response.access, response.refresh || refreshToken);
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
    this._token = access;
    this._user = this.decodeUserFromToken();
    this.enableBackNavigation();
  }

  private setUser(user: any): void {
    if (!this.isBrowser()) return;
    localStorage.setItem('user', JSON.stringify(user));
    this._user = user;
  }

  getAccessToken(): string | null {
    return this._token || localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getUser(): any {
    return this._user || this.decodeUserFromToken();
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  clearAuthData(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this._token = null;
    this._user = null;
    sessionStorage.clear();
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

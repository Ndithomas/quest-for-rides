import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiBaseUrl || '';

  constructor(private http: HttpClient) { }

  private fullUrl(path: string) {
    if (!path) { return this.baseUrl; }
    if (path.startsWith('http')) { return path; }
    // allow paths that already include /api
    return `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(this.fullUrl(path), { params }).pipe(catchError(this.handleError));
  }

  post<T>(path: string, body: any, params?: HttpParams): Observable<T> {
    return this.http.post<T>(this.fullUrl(path), body, { params }).pipe(catchError(this.handleError));
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(this.fullUrl(path), body).pipe(catchError(this.handleError));
  }

  patch<T>(path: string, body: any): Observable<T> {
    return this.http.patch<T>(this.fullUrl(path), body).pipe(catchError(this.handleError));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.fullUrl(path)).pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    return throwError(() => error || 'Server error');
  }
}

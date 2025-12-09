// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (req.url.includes('/api/auth/')) {
    return next(req);
  }

  const token = authService.getAccessToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          return authService.refreshToken(refreshToken).pipe(
            switchMap((newTokens: any) => {
              // Retry the original request with new token
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newTokens.access}`
                }
              });
              return next(newReq);
            }),
            catchError(refreshError => {
             
              authService.clearAuthData();
              router.navigate(['/login'], { replaceUrl: true });
              return throwError(() => refreshError);
            })
          );
        } else {
          authService.clearAuthData();
          router.navigate(['/login'], { replaceUrl: true });
        }
      }
      return throwError(() => error);
    })
  );
};
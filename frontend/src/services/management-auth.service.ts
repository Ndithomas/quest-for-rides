// src/app/services/management-auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'guest' | 'owner' | 'management';
  phone_number?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

export interface AdminCar {
  id: number;
  make: string;
  model: string;
  year: number;
  daily_rate: number;
  status: 'active' | 'inactive' | 'maintenance' | 'booked' | 'suspended' | 'available';
  license_plate: string;
  is_verified: boolean;
  owner_name: string;
  owner_username: string;
  owner_email: string;
  owner_phone: string;
  created_at: string;
}


export interface PaginatedUsers {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUser[];
}

export interface PaginatedCars {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminCar[];
}


export interface VerifyCarResponse {
  message: string;
  is_verified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ManagementAuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/auth/`;
  private readonly api = `${environment.apiBaseUrl}/api/management/`;

  constructor(private readonly http: HttpClient) { }

  createManagementAccount(data: any, secretCode: string): Observable<any> {
    const payload = {
      ...data,
      secret_code: secretCode
    };

    return this.http.post(`${this.apiUrl}create-management/`, payload).pipe(
      catchError((error: HttpErrorResponse) => {
        let msg = 'Management setup failed.';

        if (error.status === 403) {
          msg = 'Invalid secret code.';
        } else if (error.status === 400) {
          const body = error.error;
          if (typeof body === 'string') {
            msg = body;
          } else if (body?.message) {
            msg = body.message;
          }
          if (msg.toLowerCase().includes('already')) {
            msg = 'Management account already exists.';
          }
        } else if (error.status === 0) {
          msg = 'Cannot connect to server.';
        }

        return throwError(() => new Error(msg));
      })
    );
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.api}dashboard/stats/`);
  }

  getAllUsers(url?: string): Observable<PaginatedUsers> {
    const requestUrl = url || `${this.api}users/`;
    return this.http.get<PaginatedUsers>(requestUrl);
  }

  getAllCars(url?: string): Observable<PaginatedCars> {
    const requestUrl = url || `${this.api}cars/`;
    return this.http.get<PaginatedCars>(requestUrl);
  }

  getUserDetail(userId: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.api}users/${userId}/`);
  }

  verifyCar(carId: number, isVerified: boolean) {
    return this.http.patch<{ message: string; is_verified: boolean }>(
      `${this.api}cars/${carId}/verify/`,
      { is_verified: isVerified }
    );
  }

}
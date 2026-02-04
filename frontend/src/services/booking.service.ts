import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';


export interface BookingCreateRequest {
  car: number;
  start_date: string;
  end_date: string;
  special_requirements?: string | null;
}

export interface BookingPayment {
  id: number;
  amount: number;
  status: string;
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface Booking {
  id: number;
  guest: any;
  owner: any;
  car: number;
  car_title: string;
  car_make: string;
  car_model: string;
  car_year?: number; // Add this
  car_license_plate?: string; // Add this
  start_date: string;
  end_date: string;
  status: string;
  daily_rate: number;
  total_price: number;
  special_requirements?: string;
  owner_notes?: string;
  rejection_reason?: string;
  payment_status?: string;
  payment?: BookingPayment;
  review?: any;
  created_at: string;
  confirmed_at?: string;
  updated_at?: string;
  car_status?: string;
  getPaymentMethod?(): string;
}
export interface PaginatedBookings {
  count: number;
  next: string | null;
  previous: string | null;
  results: Booking[];
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.apiBaseUrl}/api/bookings`;

  constructor(private http: HttpClient) { }

  createBooking(booking: BookingCreateRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/`, booking);
  }

  getBooking(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${id}/`);
  }

  getMyBookings(page: number = 1, status: string = 'all', page_size: number = 10): Observable<PaginatedBookings> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', page_size.toString());
    if (status !== 'all') {
      params = params.set('status', status);
    }
    return this.http.get<PaginatedBookings>(`${this.apiUrl}/my-bookings/`, { params });
  }

  getPendingConfirmations(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/pending-confirmations/`);
  }

  getAllBookings(url?: string): Observable<PaginatedBookings> {
    const requestUrl = url || `${this.apiUrl}/all-bookings/`;
    return this.http.get<PaginatedBookings>(requestUrl);
  }

  getOwnerBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/owner-bookings/`);
  }

  confirmBooking(
    id: number,
    status: 'confirmed' | 'rejected',
    notes?: string,
    reason?: string
  ): Observable<Booking> {
    const payload: any = { status };
    if (notes) payload.owner_notes = notes;
    if (reason) payload.rejection_reason = reason;
    return this.http.patch<Booking>(`${this.apiUrl}/${id}/confirm/`, payload);
  }

  updateBookingStatus(id: number, status: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/${id}/update-status/`, { status });
  }

  guestCancelBooking(id: number): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.apiUrl}/${id}/guest-cancel/`, {});
  }

  ownerCancelUnpaidBooking(id: number): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.apiUrl}/${id}/owner-cancel-unpaid/`, {});
  }

  markBookingCompleted(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/mark-completed/`, {});
  }

  getBookingStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats/`);
  }
}



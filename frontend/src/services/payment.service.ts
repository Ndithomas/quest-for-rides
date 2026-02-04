import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Booking } from './booking.service';
import { ApiService } from './api.service';

export interface Car {
  id: number;
  make: string;
  model: string;
}

export interface PaymentTransaction {
  id: number;
  booking_payment: number;
  transaction_type: string;
  transaction_type_display: string;
  amount: number;
  status: string;
  status_display: string;
  external_transaction_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentInvoice {
  id: number;
  booking_payment: number;
  invoice_number: string;
  issued_date: string;
  due_date: string;
  paid_date: string | null;
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
}

export interface PlatformCommission {
  id: number;
  platform_amount: number;
  owner_payout: number;
  refunded_platform: number;
  refunded_owner: number;
  created_at: string;
}

export interface Payout {
  id: number;
  owner: number;
  owner_username: string;
  owner_email: string;
  amount: number;
  status: string;
  status_display: string;
  payment_method: string;
  payment_method_display: string;
  phone_number: string;
  external_reference: string;
  notes: string;
  requested_at: string;
  approved_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingPayment {
  id: number;
  booking: Booking;
  amount: number;
  status: string;
  status_display: string;
  campay_reference: string;
  customer_phone: string;
  transactions: PaymentTransaction[];
  invoice: PaymentInvoice;
  commission: PlatformCommission;
  created_at: string;
  updated_at: string;
  payment_method?: string;
  transaction_id?: string;
}

export interface CamPayInitiateData {
  phone: string;
}

export interface PaymentAnalytics {
  total_transactions: number;
  total_revenue: number;
  platform_commission: number;
  owner_payouts: number;
  total_refunded: number;
  currency: string;
}

export interface OwnerEarnings {
  total_earnings: number;
  available_balance: number;
  total_owner_payout?: number;
  total_refunded_owner?: number;
  currency: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private basePath = '/api/payments';

  constructor(private api: ApiService) { }

  getBookingPayment(bookingId: number): Observable<BookingPayment> {
    return this.api.get<BookingPayment>(`${this.basePath}/booking/${bookingId}/`);
  }

  initiateCamPayPayment(bookingId: number, data: CamPayInitiateData): Observable<any> {
    return this.api.post(`${this.basePath}/booking/${bookingId}/initiate/`, data);
  }

  checkCamPayStatus(bookingId: number): Observable<any> {
    return this.api.get(`${this.basePath}/booking/${bookingId}/check-status/`);
  }

  updatePaymentStatus(bookingId: number, data: {
    status: string;
    external_transaction_id?: string;
    notes?: string;
  }): Observable<any> {
    return this.api.post(`${this.basePath}/booking/${bookingId}/status-update/`, data);
  }

  initiateRefund(bookingId: number, data?: { reason?: string; amount?: number }): Observable<any> {
    return this.api.post(`${this.basePath}/booking/${bookingId}/refund/`, data || {});
  }

  getAllPayments(page: number = 1, page_size: number = 20): Observable<PaginatedResponse<BookingPayment>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', page_size.toString());
    return this.api.get<PaginatedResponse<BookingPayment>>(`${this.basePath}/list/`, params);
  }

  getPaymentAnalytics(): Observable<PaymentAnalytics> {
    return this.api.get<PaymentAnalytics>(`${this.basePath}/analytics/`);
  }

  getOwnerPayments(url?: string): Observable<PaginatedResponse<BookingPayment>> {
    const requestUrl = url ? url : `${this.basePath}/owner/payments/`;
    return this.api.get<PaginatedResponse<BookingPayment>>(requestUrl);
  }

  getOwnerEarnings(): Observable<OwnerEarnings> {
    return this.api.get<OwnerEarnings>(`${this.basePath}/owner/earnings/`);
  }

  getOwnerPayouts(url?: string): Observable<PaginatedResponse<Payout>> {
    const requestUrl = url ? url : `${this.basePath}/owner/payouts/`;
    return this.api.get<PaginatedResponse<Payout>>(requestUrl);
  }

  requestPayout(data: { amount: number; payment_method: string; phone_number: string; notes?: string }): Observable<Payout> {
    return this.api.post<Payout>(`${this.basePath}/owner/payout-request/`, data);
  }

  getGuestPayments(url?: string): Observable<PaginatedResponse<BookingPayment>> {
    const requestUrl = url ? url : `${this.basePath}/guest/payments/`;
    return this.api.get<PaginatedResponse<BookingPayment>>(requestUrl);
  }

  getManagementPayouts(status?: string, page: number = 1, page_size: number = 20): Observable<PaginatedResponse<Payout>> {
    let url = `${this.basePath}/management/payouts/`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', page_size.toString());
    if (status && status !== 'all') {
      params = params.set('status', status);
    }
    return this.api.get<PaginatedResponse<Payout>>(url, params);
  }

  approvePayout(payoutId: number): Observable<Payout> {
    return this.api.post<Payout>(`${this.basePath}/management/payout/${payoutId}/approve/`, {});
  }

  processPayout(payoutId: number): Observable<Payout> {
    return this.api.post<Payout>(`${this.basePath}/management/payout/${payoutId}/process/`, {});
  }

  rejectPayout(payoutId: number, reason: string): Observable<Payout> {
    return this.api.post<Payout>(`${this.basePath}/management/payout/${payoutId}/reject/`, { reason });
  }

}
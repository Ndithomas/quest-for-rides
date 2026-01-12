// src/services/payment.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Booking } from './booking.service';


export interface Car {
  id: number;
  make: string;
  model: string; // <-- 'model' is here
  // Add other car properties if needed (e.g., year, license_plate)
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
  phone: string; // Format: 2376xxxxxxxx
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

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiBaseUrl}/api/payments`;

  constructor(private http: HttpClient) { }

  getBookingPayment(bookingId: number): Observable<BookingPayment> {
    return this.http.get<BookingPayment>(`${this.apiUrl}/booking/${bookingId}/`);
  }

  initiateCamPayPayment(bookingId: number, data: CamPayInitiateData): Observable<any> {
    return this.http.post(`${this.apiUrl}/booking/${bookingId}/initiate/`, data);
  }

  checkCamPayStatus(bookingId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/booking/${bookingId}/check-status/`);
  }

  updatePaymentStatus(bookingId: number, data: {
    status: string;
    external_transaction_id?: string;
    notes?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/booking/${bookingId}/status-update/`, data);
  }

  initiateRefund(bookingId: number, data?: { reason?: string; amount?: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/booking/${bookingId}/refund/`, data || {});
  }

  getAllPayments(): Observable<BookingPayment[]> {
    return this.http.get<BookingPayment[]>(`${this.apiUrl}/list/`);
  }

  getPaymentAnalytics(): Observable<PaymentAnalytics> {
    return this.http.get<PaymentAnalytics>(`${this.apiUrl}/analytics/`);
  }

  // ============ Owner Endpoints ============
  getOwnerPayments(): Observable<BookingPayment[]> {
    return this.http.get<BookingPayment[]>(`${this.apiUrl}/owner/payments/`);
  }

  getOwnerEarnings(): Observable<OwnerEarnings> {
    return this.http.get<OwnerEarnings>(`${this.apiUrl}/owner/earnings/`);
  }

  getOwnerPayouts(): Observable<Payout[]> {
    return this.http.get<Payout[]>(`${this.apiUrl}/owner/payouts/`);
  }

  requestPayout(data: { amount: number; payment_method: string; phone_number: string; notes?: string }): Observable<Payout> {
    return this.http.post<Payout>(`${this.apiUrl}/owner/payout-request/`, data);
  }
  
  getGuestPayments(): Observable<BookingPayment[]> {
    return this.http.get<BookingPayment[]>(`${this.apiUrl}/guest/payments/`);
  }

  // ============ Management Endpoints ============
  getManagementPayouts(status?: string): Observable<Payout[]> {
    let url = `${this.apiUrl}/management/payouts/`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get<Payout[]>(url);
  }

  approvePayout(payoutId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/management/payout/${payoutId}/approve/`, {});
  }

  processPayout(payoutId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/management/payout/${payoutId}/process/`, {});
  }

  rejectPayout(payoutId: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/management/payout/${payoutId}/reject/`, { reason });
  }
}
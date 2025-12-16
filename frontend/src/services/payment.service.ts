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

export interface BookingPayment {
  id: number;
  booking: Booking; // <--- The correct type is imported
  amount: number;
  status: string;
  status_display: string;
  campay_reference: string;
  customer_phone: string;
  transactions: PaymentTransaction[];
  invoice: PaymentInvoice;
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
  platform_commission_10_percent: number;
  owner_payouts: number;
  currency: string;
}

export interface OwnerEarnings {
  total_earnings: number;
  available_balance: number;
  currency: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiBaseUrl}/api/payments`;

  constructor(private http: HttpClient) { }

  // ============ Guest Payment Endpoints ============
  getBookingPayment(bookingId: number): Observable<BookingPayment> {
    return this.http.get<BookingPayment>(`${this.apiUrl}/booking/${bookingId}/`);
  }

  initiateCamPayPayment(bookingId: number, data: CamPayInitiateData): Observable<any> {
    return this.http.post(`${this.apiUrl}/booking/${bookingId}/initiate/`, data);
  }

  checkCamPayStatus(bookingId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/booking/${bookingId}/check-status/`);
  }

  // ============ Admin Endpoints ============
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
  
  getGuestPayments(): Observable<BookingPayment[]> {
    return this.http.get<BookingPayment[]>(`${this.apiUrl}/guest/payments/`);
  }
}
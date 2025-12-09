// src/app/services/payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentMethod {
  id: number;
  payment_type: string;
  payment_type_display: string;
  is_default: boolean;
  last_four: string;
  holder_name: string;
  expiry_month: number;
  expiry_year: number;
  is_active: boolean;
  created_at: string;
}

export interface PaymentTransaction {
  id: number;
  booking_payment: number;
  transaction_type: string;
  transaction_type_display: string;
  amount: number;
  status: string;
  status_display: string;
  payment_method: PaymentMethod;
  external_transaction_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentInvoice {
  id: number;
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
  booking: number;
  amount: number;
  status: string;
  status_display: string;
  payment_method: PaymentMethod;
  transaction_id: string;
  transactions: PaymentTransaction[];
  invoice: PaymentInvoice;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:8000/api/payments';

  constructor(private http: HttpClient) {}

  // Get payment details for a booking
  getBookingPayment(bookingId: number): Observable<BookingPayment> {
    return this.http.get<BookingPayment>(`${this.apiUrl}/booking/${bookingId}/`);
  }

  // Update payment status (admin/management)
  updatePaymentStatus(bookingId: number, data: { status: string; transaction_id?: string; notes?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/booking/${bookingId}/status-update/`, data);
  }

  // Initiate refund
  initiateRefund(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/booking/${bookingId}/refund/`, {});
  }

  // Get all payments (admin/management)
  getAllPayments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/list/`);
  }

  // Get payment analytics (admin/management)
  getPaymentAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/`);
  }

  // Process payment (for guest) - you'll implement this endpoint later
  processPayment(bookingId: number, paymentData: {
    payment_method_id?: number;
    card_number?: string;
    expiry_month?: number;
    expiry_year?: number;
    cvv?: string;
    save_card?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/booking/${bookingId}/process/`, paymentData);
  }

  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/methods/`);
  }

  addPaymentMethod(data: {
    payment_type: string;
    card_number: string;
    expiry_month: number;
    expiry_year: number;
    cvv: string;
    holder_name: string;
    is_default?: boolean;
  }): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(`${this.apiUrl}/methods/`, data);
  }

  setDefaultPaymentMethod(methodId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/methods/${methodId}/set-default/`, {});
  }

  removePaymentMethod(methodId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/methods/${methodId}/`);
  }
}
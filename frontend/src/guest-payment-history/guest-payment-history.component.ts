import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PaymentService, BookingPayment, PaginatedResponse } from '../services/payment.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { CurrencyXAFPipe, DateFormatPipe, StatusClassPipe } from '../shared/pipes';

@Component({
  selector: 'app-guest-payment-history',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent, CurrencyXAFPipe, DateFormatPipe, StatusClassPipe],
  templateUrl: './guest-payment-history.component.html',
  styleUrls: ['./guest-payment-history.component.scss']
})
export class GuestPaymentHistoryComponent implements OnInit {
  payments: BookingPayment[] = [];
  loading = true;
  isLoadingMore = false;
  nextPageUrl: string | null = null;
  error = '';

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.paymentService.getGuestPayments().subscribe({
      next: (response: PaginatedResponse<BookingPayment>) => {
        this.payments = response.results; // Extract from results
        this.nextPageUrl = response.next;   // Save the next page URL
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.error = 'Failed to load payment history';
        this.loading = false;
      }
    });
  }

  loadMore(): void {
    if (!this.nextPageUrl || this.isLoadingMore) return;

    this.isLoadingMore = true;
    this.paymentService.getGuestPayments(this.nextPageUrl).subscribe({
      next: (response: PaginatedResponse<BookingPayment>) => {
        // Append new payments to the existing list
        this.payments = [...this.payments, ...response.results];
        this.nextPageUrl = response.next;
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error('Error loading more payments:', error);
        this.isLoadingMore = false;
      }
    });
  }

  getRefundedAmount(payment: BookingPayment): number {
    if (!payment.commission) return 0;
    return (payment.commission.refunded_platform || 0) + (payment.commission.refunded_owner || 0);
  }

  getNetAmount(payment: BookingPayment): number {
    return payment.amount - this.getRefundedAmount(payment);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getPaymentMethod(payment: BookingPayment): string {
    if (payment.payment_method) {
      return payment.payment_method;
    }
    if (payment.campay_reference) {
      return 'CamPay';
    }
    return 'N/A';
  }
  
  isCamPay(payment: BookingPayment): boolean {
    return !!payment.campay_reference || 
          (payment.payment_method?.toLowerCase().includes('campay') || false);
  }
  trackByPaymentId(index: number, payment: BookingPayment): number {
  return payment.id;
}

}
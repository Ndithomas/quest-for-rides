import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PaymentService, BookingPayment } from '../services/payment.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-guest-payment-history',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './guest-payment-history.component.html',
  styleUrls: ['./guest-payment-history.component.scss']
})
export class GuestPaymentHistoryComponent implements OnInit {
  payments: BookingPayment[] = [];
  loading = true;
  error = '';

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.paymentService.getGuestPayments().subscribe({
      next: (payments) => {
        this.payments = payments;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.error = 'Failed to load payment history';
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'badge bg-success';
      case 'pending': return 'badge bg-warning';
      case 'failed': return 'badge bg-danger';
      case 'refunded': return 'badge bg-secondary';
      default: return 'badge bg-secondary';
    }
  }

  formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0
  }).format(amount);
  // Outputs: 150,000 XAF
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
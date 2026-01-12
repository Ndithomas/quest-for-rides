import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, BookingPayment } from '../services/payment.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-refund-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './refund-management.component.html',
  styleUrls: ['./refund-management.component.scss']
})
export class RefundManagementComponent implements OnInit {
  payments: BookingPayment[] = [];
  filteredPayments: BookingPayment[] = [];
  loading = true;
  error = '';
  success = '';
  processing = false;

  // Filters
  filterStatus = 'all';
  filterSearch = '';

  // Refund form
  selectedPayment: BookingPayment | null = null;
  refundAmount: number = 0;
  refundReason = '';
  showRefundForm = false;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.error = '';
    this.paymentService.getAllPayments().subscribe({
      next: (data: BookingPayment[]) => {
        this.payments = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.error = 'Failed to load payment data';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredPayments = this.payments.filter(payment => {
      const statusMatch = this.filterStatus === 'all' || payment.status === this.filterStatus;
      const searchMatch = this.filterSearch === '' ||
        payment.booking?.id.toString().includes(this.filterSearch) ||
        payment.customer_phone?.includes(this.filterSearch);
      return statusMatch && searchMatch;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  selectPayment(payment: BookingPayment): void {
    this.selectedPayment = payment;
    this.refundAmount = payment.amount;
    this.refundReason = '';
    this.showRefundForm = true;
  }

  closeRefundForm(): void {
    this.showRefundForm = false;
    this.selectedPayment = null;
    this.success = '';
  }

  processRefund(): void {
    if (!this.selectedPayment || this.refundAmount <= 0) {
      this.error = 'Please enter a valid refund amount';
      return;
    }

    this.processing = true;
    this.error = '';
    this.success = '';

    this.paymentService.initiateRefund(this.selectedPayment.booking.id, {
      reason: this.refundReason,
      amount: this.refundAmount
    }).subscribe({
      next: (response) => {
        this.success = `Refund of ${this.formatCurrency(this.refundAmount)} processed successfully`;
        this.processing = false;
        this.showRefundForm = false;
        this.selectedPayment = null;
        setTimeout(() => this.loadPayments(), 2000);
      },
      error: (error) => {
        console.error('Error processing refund:', error);
        this.error = error?.error?.detail || 'Failed to process refund';
        this.processing = false;
      }
    });
  }

  getRefundedAmount(payment: BookingPayment): number {
    if (!payment.commission) return 0;
    return (payment.commission.refunded_platform || 0) + (payment.commission.refunded_owner || 0);
  }

  getRefundableAmount(payment: BookingPayment): number {
    return payment.amount - this.getRefundedAmount(payment);
  }

  canRefund(payment: BookingPayment): boolean {
    return payment.status === 'completed' && this.getRefundableAmount(payment) > 0;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'badge bg-success';
      case 'pending': return 'badge bg-warning';
      case 'failed': return 'badge bg-danger';
      case 'refunded': return 'badge bg-secondary';
      case 'partially_refunded': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  }
}

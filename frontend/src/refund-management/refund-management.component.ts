import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, BookingPayment, PaginatedResponse } from '../services/payment.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { CurrencyXAFPipe, DateFormatPipe, StatusClassPipe } from '../shared/pipes';

@Component({
  selector: 'app-refund-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent, CurrencyXAFPipe, DateFormatPipe, StatusClassPipe],
  templateUrl: './refund-management.component.html',
  styleUrls: ['./refund-management.component.scss']
})
export class RefundManagementComponent implements OnInit {
  // ── Main data ───────────────────────────────────────────────
  allPayments: BookingPayment[] = [];
  filteredPayments: BookingPayment[] = [];

  // ── Pagination state ────────────────────────────────────────
  currentPage = 1;
  hasMore = false;
  loadingMore = false;
  pageSize = 20;

  // ── Other states ────────────────────────────────────────────
  loading = true;
  error = '';
  success = '';
  processing = false;

  // Filters
  filterStatus = 'all';
  filterSearch = '';

  // Refund form
  selectedPayment: BookingPayment | null = null;
  refundAmount = 0;
  refundReason = '';
  showRefundForm = false;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadPayments(true);
  }

  // ── Load payments with pagination ───────────────────────────
  loadPayments(reset = false): void {
    if (reset) {
      this.loading = true;
      this.allPayments = [];
      this.currentPage = 1;
      this.hasMore = false;
    } else {
      this.loadingMore = true;
    }

    this.error = '';

    this.paymentService.getAllPayments(this.currentPage, this.pageSize)
      .subscribe({
        next: (response: PaginatedResponse<BookingPayment>) => {
          const newPayments = response.results;

          this.allPayments = reset
            ? newPayments
            : [...this.allPayments, ...newPayments];

          this.hasMore = !!response.next;

          this.applyFilters();

          this.loading = false;
          this.loadingMore = false;

          if (!reset) this.currentPage++;
        },
        error: (err) => {
          console.error('Error loading payments:', err);
          this.error = 'Failed to load payment data. Please try again.';
          this.loading = false;
          this.loadingMore = false;
        }
      });
  }

  loadMore(): void {
    if (!this.hasMore || this.loadingMore || this.loading) return;
    this.loadPayments(false);
  }

  // ── Filters ────────────────────────────────────────────────
  applyFilters(): void {
    let temp = [...this.allPayments];

    if (this.filterStatus !== 'all') {
      temp = temp.filter(p => p.status === this.filterStatus);
    }

    if (this.filterSearch.trim()) {
      const search = this.filterSearch.trim().toLowerCase();
      temp = temp.filter(p =>
        p.booking?.id.toString().toLowerCase().includes(search) ||
        p.customer_phone?.toLowerCase().includes(search)
      );
    }

    this.filteredPayments = temp;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  refresh(): void {
    this.loadPayments(true);
  }

  // ── Refund logic ───────────────────────────────────────────
  selectPayment(payment: BookingPayment): void {
    this.selectedPayment = payment;
    this.refundAmount = this.getRefundableAmount(payment);
    this.refundReason = '';
    this.showRefundForm = true;
  }

  closeRefundForm(): void {
    this.showRefundForm = false;
    this.selectedPayment = null;
  }

  processRefund(): void {
    if (!this.selectedPayment || this.refundAmount <= 0 || this.refundAmount > this.getRefundableAmount(this.selectedPayment)) {
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
      next: () => {
        this.success = `Refund of ${this.formatCurrency(this.refundAmount)} processed successfully`;
        this.processing = false;
        this.showRefundForm = false;
        this.selectedPayment = null;

        setTimeout(() => this.loadPayments(true), 1800);
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Failed to process refund';
        this.processing = false;
      }
    });
  }

  // ── Helper methods ─────────────────────────────────────────
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
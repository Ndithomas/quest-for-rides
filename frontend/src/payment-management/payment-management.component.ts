import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, BookingPayment, PaginatedResponse } from '../services/payment.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-payment-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './payment-management.component.html',
  styleUrl: './payment-management.component.scss'
})
export class PaymentManagementComponent implements OnInit {
  payments: BookingPayment[] = [];
  filteredPayments: BookingPayment[] = [];

  loading = true;
  error = '';
  success = '';

  // Filters
  statusFilter = 'all';
  searchTerm = '';
  startDate: string | null = null;   // yyyy-MM-dd
  endDate: string | null = null;

  // Analytics
  analytics: any = null;  // PaymentAnalytics from your service
  showAnalytics = false;

  get startIndex(): number {
    return (this.page - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.page * this.pageSize, this.filteredPayments.length);
  }

  // Simple client-side pagination
  page = 1;
  pageSize = 10;
  get totalPages(): number {
    return Math.ceil(this.filteredPayments.length / this.pageSize);
  }

  constructor(private paymentService: PaymentService) { }

  ngOnInit() {
    this.loadPayments();
    this.loadAnalytics();
  }

  loadPayments() {
    this.loading = true;
    this.paymentService.getAllPayments(1, 100).subscribe({  // Added page parameters
      next: (response: PaginatedResponse<BookingPayment>) => {  // Changed to handle PaginatedResponse
        this.payments = response.results;  // Extract results array
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load payment history';
        this.loading = false;
      }
    });
  }

  loadAnalytics() {
    this.paymentService.getPaymentAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
      },
      error: () => {
        console.warn('Analytics failed to load');
      }
    });
  }

  applyFilters() {
    let result = [...this.payments];

    // Status
    if (this.statusFilter !== 'all') {
      result = result.filter(p => p.status.toLowerCase() === this.statusFilter.toLowerCase());
    }

    // Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(p => {
        return (
          p.id.toString().includes(term) ||
          p.booking?.id?.toString().includes(term) ||
          `${p.booking?.car_make || ''} ${p.booking?.car_model || ''}`.toLowerCase().includes(term) ||
          p.booking?.guest?.username?.toLowerCase().includes(term) ||
          p.booking?.owner?.username?.toLowerCase().includes(term) ||
          p.customer_phone?.includes(term) ||
          p.transaction_id?.toLowerCase().includes(term) ||
          p.campay_reference?.toLowerCase().includes(term) ||
          p.amount.toString().includes(term)
        );
      });
    }

    // Date range
    if (this.startDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(p => new Date(p.created_at) >= start);
    }

    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(p => new Date(p.created_at) <= end);
    }

    this.filteredPayments = result;
    this.page = 1; // Reset to first page after filter
  }

  clearFilters() {
    this.statusFilter = 'all';
    this.searchTerm = '';
    this.startDate = null;
    this.endDate = null;
    this.applyFilters();
  }

  // Pagination helpers
  get paginatedPayments(): BookingPayment[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredPayments.slice(start, start + this.pageSize);
  }

  previousPage() {
    if (this.page > 1) this.page--;
  }

  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }

  // Actions
  updatePaymentStatus(payment: BookingPayment, newStatus: string) {
    if (!confirm(`Change status to "${newStatus}"?`)) return;

    this.paymentService.updatePaymentStatus(payment.booking.id, { status: newStatus }).subscribe({
      next: () => {
        this.success = `Payment #${payment.id} updated successfully`;
        payment.status = newStatus;
        setTimeout(() => this.success = '', 4000);
      },
      error: () => {
        this.error = 'Failed to update status';
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  getStatusClass(status: string): string {
    const s = status?.toLowerCase() || '';
    if (s.includes('complete')) return 'badge bg-success';
    if (s.includes('pend')) return 'badge bg-warning';
    if (s.includes('fail')) return 'badge bg-danger';
    if (s.includes('refund')) return 'badge bg-info';
    return 'badge bg-secondary';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('fr-CM', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }
}
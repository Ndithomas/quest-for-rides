import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, BookingPayment, PaginatedResponse } from '../services/payment.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { CurrencyXAFPipe, DateFormatPipe, StatusClassPipe } from '../shared/pipes';

@Component({
  selector: 'app-owner-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent, CurrencyXAFPipe, DateFormatPipe, StatusClassPipe],
  templateUrl: './owner-payments.component.html',
  styleUrl: './owner-payments.component.scss'
})
export class OwnerPaymentsComponent implements OnInit {
  payments: BookingPayment[] = [];
  completedPaymentsCount: number = 0;
  totalRevenue: number = 0;

  filteredPayments: BookingPayment[] = [];
  nextPageUrl: string | null = null;
  isLoadingMore = false;

  loading = true;
  error = '';
  success = '';

  statusFilter = 'all';
  searchTerm = '';
  sortBy = 'newest';

  constructor(private paymentService: PaymentService) { }

  ngOnInit(): void {
    this.loadOwnerPayments();
  }

  loadOwnerPayments(): void {
    this.loading = true;
    this.paymentService.getOwnerPayments().subscribe({
      next: (response: PaginatedResponse<BookingPayment>) => {
        this.payments = response.results;
        this.nextPageUrl = response.next;
        this.updateStats();
        this.loading = false;
        this.applyFilters();
      },
      error: (error) => {
        this.error = 'Failed to load payments.';
        this.loading = false;
      }
    });
  }

  loadMore(): void {
    if (!this.nextPageUrl || this.isLoadingMore) return;

    this.isLoadingMore = true;
    this.paymentService.getOwnerPayments(this.nextPageUrl).subscribe({
      next: (response: PaginatedResponse<BookingPayment>) => {
        this.payments = [...this.payments, ...response.results];
        this.nextPageUrl = response.next;
        this.updateStats();
        this.isLoadingMore = false;
        this.applyFilters();
      },
      error: () => {
        this.isLoadingMore = false;
      }
    });
  }

  private updateStats(): void {
    this.completedPaymentsCount = this.payments.filter(p => p.status === 'completed').length;
    this.totalRevenue = this.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  applyFilters(): void {
    let filtered = [...this.payments];

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === this.statusFilter);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.booking.toString().includes(term) ||
        (p.campay_reference && p.campay_reference.toLowerCase().includes(term)) ||
        (p.customer_phone && p.customer_phone.includes(term))
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      if (this.sortBy === 'newest') return dateB - dateA;
      if (this.sortBy === 'oldest') return dateA - dateB;
      if (this.sortBy === 'amount_high') return b.amount - a.amount;
      if (this.sortBy === 'amount_low') return a.amount - b.amount;
      return dateB - dateA;
    });

    this.filteredPayments = filtered;
  }

  formatCurrency(amount: number): string {
    return `FCFA ${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'badge bg-success';
      case 'pending': return 'badge bg-warning';
      case 'failed': return 'badge bg-danger';
      case 'refunded': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  }

  getStatusDisplay(status: string): string {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  clearFilters(): void {
    this.statusFilter = 'all';
    this.searchTerm = '';
    this.sortBy = 'newest';
    this.applyFilters();
  }

  getOwnerShare(amount: number): number {
    return amount * 0.9;
  }

  getPlatformFee(amount: number): number {
    return amount * 0.1;
  }
}
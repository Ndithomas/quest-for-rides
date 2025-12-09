import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../services/payment.service';
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
payments: any[] = [];
  filteredPayments: any[] = [];
  loading = false;
  error = '';
  success = '';
  
  // Filters
  statusFilter = 'all';
  searchTerm = '';
  startDate = '';
  endDate = '';

  // Analytics
  analytics: any = null;
  showAnalytics = false;

  constructor(private paymentService: PaymentService) {}

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.loading = true;
    this.paymentService.getAllPayments().subscribe({
      next: (response: any) => {
        this.payments = response.results || response;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load payments';
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.filteredPayments = this.payments.filter(payment => {
      let matches = true;
      
      if (this.statusFilter !== 'all') {
        matches = matches && payment.status === this.statusFilter;
      }
      
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        matches = matches && (
          payment.transaction_id?.toLowerCase().includes(term) ||
          payment.booking?.toString().includes(term) ||
          payment.amount?.toString().includes(term)
        );
      }
      
      if (this.startDate) {
        matches = matches && new Date(payment.created_at) >= new Date(this.startDate);
      }
      
      if (this.endDate) {
        matches = matches && new Date(payment.created_at) <= new Date(this.endDate);
      }
      
      return matches;
    });
  }

  updatePaymentStatus(paymentId: number, status: string) {
    if (confirm(`Change payment status to ${status}?`)) {
      this.paymentService.updatePaymentStatus(paymentId, { status }).subscribe({
        next: () => {
          this.success = 'Payment status updated';
          this.loadPayments();
          setTimeout(() => this.success = '', 3000);
        },
        error: () => {
          this.error = 'Failed to update payment status';
        }
      });
    }
  }

  loadAnalytics() {
    this.paymentService.getPaymentAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.showAnalytics = true;
      },
      error: () => {
        this.error = 'Failed to load analytics';
      }
    });
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
}

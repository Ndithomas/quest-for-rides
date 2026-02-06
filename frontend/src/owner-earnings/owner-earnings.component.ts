import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PaymentService, OwnerEarnings, BookingPayment } from '../services/payment.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { CurrencyXAFPipe, DateFormatPipe, StatusClassPipe } from '../shared/pipes';

@Component({
  selector: 'app-owner-earnings',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent, CurrencyXAFPipe, DateFormatPipe, StatusClassPipe],
  templateUrl: './owner-earnings.component.html',
  styleUrls: ['./owner-earnings.component.scss']
})
export class OwnerEarningsComponent implements OnInit {
  loading = true;
  isLoadingMore = false; // For the button spinner
  error = '';

  earningsData: OwnerEarnings | null = null;
  payments: BookingPayment[] = [];
  nextPageUrl: string | null = null;

  constructor(private paymentService: PaymentService) { }

  ngOnInit(): void {
    this.loadOwnerEarnings();
    this.loadOwnerPayments();
  }

  loadOwnerEarnings(): void {
    this.paymentService.getOwnerEarnings().subscribe({
      next: (earnings: OwnerEarnings) => {
        this.earningsData = earnings;
      },
      error: (error) => {
        console.error('Error loading earnings:', error);
        this.error = 'Failed to load earnings information';
        this.loading = false;
      }
    });
  }

  loadOwnerPayments(): void {
    this.paymentService.getOwnerPayments().subscribe({
      next: (response: any) => {
        // response is now { count, next, previous, results }
        this.payments = response.results;
        this.nextPageUrl = response.next; // Store the next page URL
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.payments = [];
        this.loading = false;
      }
    });
  }
  loadMore(): void {
    if (!this.nextPageUrl || this.isLoadingMore) return;

    this.isLoadingMore = true;
    this.paymentService.getOwnerPayments(this.nextPageUrl).subscribe({
      next: (response: any) => {
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
  getCompletedPayments(): BookingPayment[] {
    return this.payments.filter(payment => payment.status === 'completed');
  }

  getTotalRevenue(): number {
    return this.getCompletedPayments().reduce((sum, payment) => sum + payment.amount, 0);
  }

  getGrossEarnings(): number {
    return this.getCompletedPayments().reduce((sum, payment) => sum + (payment.commission?.owner_payout || 0), 0);
  }

  getRefundedAmount(): number {
    return this.getCompletedPayments().reduce((sum, payment) => sum + (payment.commission?.refunded_owner || 0), 0);
  }

  getNetEarnings(): number {
    return this.getGrossEarnings() - this.getRefundedAmount();
  }

  getPlatformCommission(): number {
    return this.getCompletedPayments().reduce((sum, payment) => sum + (payment.commission?.platform_amount || 0), 0);
  }

  formatCurrency(amount: number): string {
    if (!this.earningsData) return 'FCFA 0';
    const symbol = this.earningsData.currency === 'XAF' ? 'FCFA' : '$';
    return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PaymentService, OwnerEarnings, BookingPayment } from '../services/payment.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-owner-earnings',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './owner-earnings.component.html',
  styleUrls: ['./owner-earnings.component.scss']
})
export class OwnerEarningsComponent implements OnInit {
  loading = true;
  error = '';
  
  // Backend data
  earningsData: OwnerEarnings | null = null;
  payments: BookingPayment[] = []; // Add this property
  
  constructor(private paymentService: PaymentService) {}

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
      next: (payments: BookingPayment[]) => {
        this.payments = payments;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.payments = [];
        this.loading = false;
      }
    });
  }

  // Helper methods
  getCompletedPayments(): BookingPayment[] {
    return this.payments.filter(payment => payment.status === 'completed');
  }

  getTotalRevenue(): number {
    return this.getCompletedPayments().reduce((sum, payment) => sum + payment.amount, 0);
  }

  getPlatformCommission(): number {
    return this.getTotalRevenue() * 0.1; // 10% commission
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
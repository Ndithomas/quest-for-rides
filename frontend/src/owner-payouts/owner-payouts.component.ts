import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, OwnerEarnings, Payout } from '../services/payment.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-owner-payouts',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent, DatePipe, CurrencyPipe],
  templateUrl: './owner-payouts.component.html'
})
export class OwnerPayoutsComponent implements OnInit {
  loading = true;
  loadingHistory = false;
  requesting = false;
  error = '';
  success = '';
  
  // Backend data
  earnings: OwnerEarnings | null = null;
  
  // Request payout form
  showRequestForm = false;
  payoutAmount: number = 0;
  paymentMethod: string = 'campay';
  phoneNumber: string = '';
  notes: string = '';
  minimumPayout = 5000;

  // Payout history
  payoutHistory: Payout[] = [];

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadOwnerEarnings();
    this.loadPayoutHistory();
  }

  loadOwnerEarnings(): void {
    this.loading = true;
    this.error = '';
    
    this.paymentService.getOwnerEarnings().subscribe({
      next: (earnings) => {
        this.earnings = earnings;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading earnings:', err);
        this.error = 'Failed to load earnings information. Please try again later.';
        this.loading = false;
      }
    });
  }

  loadPayoutHistory(): void {
    this.loadingHistory = true;
    this.error = '';

    this.paymentService.getOwnerPayouts().subscribe({
      next: (payouts) => {
        this.payoutHistory = payouts.sort((a, b) => {
          const dateA = new Date(b.requested_at || '').getTime();
          const dateB = new Date(a.requested_at || '').getTime();
          return dateA - dateB;
        });
        this.loadingHistory = false;
      },
      error: (err) => {
        console.error('Error loading payout history:', err);
        this.error = 'Failed to load payout history.';
        this.loadingHistory = false;
      }
    });
  }

  toggleRequestForm(): void {
    this.showRequestForm = !this.showRequestForm;
    if (this.showRequestForm && this.earnings) {
      this.payoutAmount = this.earnings.available_balance; // Default to full available balance
      this.error = '';
      this.success = '';
    }
  }

  requestPayout(): void {
    if (!this.earnings) return;

    this.error = '';
    
    // Client-side validation
    if (this.payoutAmount < this.minimumPayout) {
      this.error = `Minimum payout amount is ${this.formatCurrency(this.minimumPayout)}`;
      return;
    }
    if (this.payoutAmount > this.earnings.available_balance) {
      this.error = 'Payout amount exceeds available balance';
      return;
    }
    if (!this.phoneNumber || !/^237[0-9]{9}$/.test(this.phoneNumber)) {
      this.error = 'Please enter a valid Cameroon phone number starting with 237 followed by 9 digits';
      return;
    }

    this.requesting = true;

    const payoutRequest = {
      amount: this.payoutAmount,
      payment_method: this.paymentMethod,
      phone_number: this.phoneNumber,
      notes: this.notes
    };

    this.paymentService.requestPayout(payoutRequest).subscribe({
      next: () => {
        this.success = `Payout request for ${this.formatCurrency(this.payoutAmount)} to ${this.phoneNumber} submitted successfully!`;
        this.showRequestForm = false;
        this.requesting = false;
        this.phoneNumber = '';
        this.payoutAmount = 0;
        this.notes = '';

        // Reload data
        this.loadOwnerEarnings();
        this.loadPayoutHistory();

        setTimeout(() => this.success = '', 8000);
      },
      error: (err) => {
        console.error('Error requesting payout:', err);
        this.error = err?.error?.detail || 'Failed to submit payout request. Please try again.';
        this.requesting = false;
      }
    });
  }

  formatCurrency(amount: number): string {
    if (!this.earnings || amount === undefined) return '';
    const symbol = this.earnings.currency === 'XAF' ? 'FCFA' : '$';
    return `${symbol} ${amount.toLocaleString('en-US')}`;
  }
}
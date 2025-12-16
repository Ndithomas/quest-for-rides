import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, OwnerEarnings } from '../services/payment.service';
import { NavbarComponent } from '../navbar/navbar.component';

interface PayoutHistoryItem {
  id?: number;
  amount: number;
  phone_number: string;
  status: string;
  status_display?: string;
  external_transaction_id?: string;
  created_at: string;
  // Add more fields if backend provides them
}

@Component({
  selector: 'app-owner-payouts',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, DatePipe, CurrencyPipe],
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
  minimumPayout = 5000; // Matches backend minimum and UI

  // Payout history
  payoutHistory: PayoutHistoryItem[] = [];

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

    // Reusing getOwnerPayments() as it returns the list of BookingPayment objects
    // Each BookingPayment likely represents a completed payout to the owner (platform commission deducted)
    this.paymentService.getOwnerPayments().subscribe({
      next: (payments) => {
        // Map to a simpler history format
        this.payoutHistory = payments.map(payment => ({
          amount: payment.amount,
          phone_number: payment.customer_phone, // Assuming payout uses same phone field; adjust if needed
          status: payment.status,
          status_display: payment.status_display,
          external_transaction_id: payment.campay_reference,
          created_at: payment.created_at
        })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

    // TODO: Implement actual backend endpoint when available, e.g.:
    // this.paymentService.requestOwnerPayout({ amount: this.payoutAmount, phone: this.phoneNumber }).subscribe({ ... })

    // Temporary mock success (remove when real endpoint exists)
    setTimeout(() => {
      this.success = `Payout request for ${this.formatCurrency(this.payoutAmount)} to ${this.phoneNumber} submitted successfully!`;
      this.showRequestForm = false;
      this.requesting = false;

      // Reload data
      this.loadOwnerEarnings();
      this.loadPayoutHistory();

      setTimeout(() => this.success = '', 8000);
    }, 1500);
  }

  formatCurrency(amount: number): string {
    if (!this.earnings || amount === undefined) return '';
    const symbol = this.earnings.currency === 'XAF' ? 'FCFA' : '$';
    return `${symbol} ${amount.toLocaleString('en-US')}`;
  }
}
// src/app/payment-processing/payment-processing.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../services/payment.service';
import { BookingService } from '../services/booking.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-payment-processing',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './payment-processing.component.html',
  styleUrl: './payment-processing.component.scss'
})
export class PaymentProcessingComponent implements OnInit {
  bookingId: number = 0;
  booking: any = null;
  paymentMethods: any[] = [];

  selectedMethod: 'saved' | 'new' = 'new';
  selectedSavedMethodId: number | null = null;

  // New card fields
  cardNumber = '';
  expiryMonth = '';
  expiryYear = '';
  cvv = '';
  cardHolder = '';
  saveCard = false;

  loading = true;
  processing = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.paramMap.get('bookingId'));
    if (!this.bookingId) {
      this.router.navigate(['/']);
      return;
    }
    this.loadBookingAndMethods();
  }

  loadBookingAndMethods(): void {
    this.loading = true;

    this.bookingService.getBooking(this.bookingId).subscribe({
      next: (booking) => {
        this.booking = booking;
        this.loadPaymentMethods();
      },
      error: () => {
        this.error = 'Unable to load booking details.';
        this.loading = false;
      }
    });
  }

  loadPaymentMethods(): void {
    this.paymentService.getPaymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods = methods.filter((m: any) => m.is_active);

        // Auto-select default method if exists
        const defaultMethod = this.paymentMethods.find((m: any) => m.is_default);
        if (defaultMethod) {
          this.selectedSavedMethodId = defaultMethod.id;
        }

        this.loading = false;
      },
      error: () => {
        console.warn('Could not load saved payment methods');
        this.loading = false;
      }
    });
  }

  // Card number formatting: 1234 5678 9012 3456
  formatCardNumber(): void {
    let value = this.cardNumber.replace(/\s/g, '').replace(/\D/g, '');
    if (value.length > 16) value = value.substring(0, 16);
    this.cardNumber = value.match(/.{1,4}/g)?.join(' ') || value;
  }

  // Expiry month: 01-12
  formatExpiryMonth(): void {
    let val = this.expiryMonth.replace(/\D/g, '');
    if (val.length > 2) val = val.substring(0, 2);
    if (+val > 12) val = '12';
    if (+val === 0) val = '';
    this.expiryMonth = val;
  }

  // Expiry year: last 2 digits
  formatExpiryYear(): void {
    let val = this.expiryYear.replace(/\D/g, '');
    if (val.length > 2) val = val.substring(0, 2);
    this.expiryYear = val;
  }

  // CVV: 3-4 digits
  formatCvv(): void {
    this.cvv = this.cvv.replace(/\D/g, '').substring(0, 4);
  }

  get hasSavedMethods(): boolean {
    return this.paymentMethods.length > 0;
  }

  processPayment(): void {
    this.error = '';
    this.processing = true;

    if (!this.booking) {
      this.error = 'Booking information is missing.';
      this.processing = false;
      return;
    }

    let payload: any = {};

    if (this.selectedMethod === 'saved' && this.selectedSavedMethodId) {
      payload.payment_method_id = this.selectedSavedMethodId;
    } else {
      // Validate new card fields
      const cleanNumber = this.cardNumber.replace(/\s/g, '');
      if (!cleanNumber || cleanNumber.length < 16) {
        this.error = 'Please enter a valid card number';
        this.processing = false;
        return;
      }
      if (!this.expiryMonth || !this.expiryYear || !this.cvv || !this.cardHolder.trim()) {
        this.error = 'Please complete all card details';
        this.processing = false;
        return;
      }

      payload = {
        card_number: cleanNumber,
        expiry_month: Number(this.expiryMonth),
        expiry_year: Number(this.expiryYear),
        cvv: this.cvv,
        holder_name: this.cardHolder.trim(),
        save_card: this.saveCard
      };
    }

    this.paymentService.processPayment(this.bookingId, payload).subscribe({
      next: () => {
        this.router.navigate(['/payment-success', this.bookingId]);
      },
      error: (err) => {
        this.processing = false;
        this.error = err.error?.detail || err.error?.message || 'Payment failed. Please try again.';
      }
    });
  }

  cancelPayment(): void {
    this.router.navigate(['/booking-confirmation', this.bookingId]);
  }
}
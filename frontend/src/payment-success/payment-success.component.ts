import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentService } from '../services/payment.service';
import { BookingService } from '../services/booking.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent,RouterLink],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.scss'
})
export class PaymentSuccessComponent implements OnInit {
bookingId: number = 0;
  booking: any = null;
  payment: any = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private bookingService: BookingService
  ) {}

  ngOnInit() {
    this.bookingId = Number(this.route.snapshot.paramMap.get('bookingId'));
    this.loadPaymentDetails();
  }

  loadPaymentDetails() {
    this.loading = true;
    this.paymentService.getBookingPayment(this.bookingId).subscribe({
      next: (payment) => {
        this.payment = payment;
        this.loadBooking();
      },
      error: (error) => {
        console.error('Error loading payment:', error);
        this.error = 'Failed to load payment details';
        this.loading = false;
      }
    });
  }

  loadBooking() {
    this.bookingService.getBooking(this.bookingId).subscribe({
      next: (booking) => {
        this.booking = booking;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading booking:', error);
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPaymentMethodDisplay(): string {
    if (!this.payment?.payment_method) return 'Credit Card';
    return this.payment.payment_method.payment_type_display || 
           this.payment.payment_method.payment_type?.replace('_', ' ') || 
           'Credit Card';
  }

  getPaymentStatusDisplay(): string {
    if (!this.payment?.status) return 'Unknown';
    return this.payment.status.charAt(0).toUpperCase() + this.payment.status.slice(1);
  }

  downloadReceipt() {
    // Create receipt content
    const receiptContent = this.generateReceiptContent();
    
    // Create and download file
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-receipt-booking-${this.bookingId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  generateReceiptContent(): string {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
========================================
          PAYMENT RECEIPT
========================================

Booking ID: ${this.bookingId}
Receipt Date: ${formattedDate}
Receipt Time: ${formattedTime}

----------------------------------------
PAYMENT DETAILS:
----------------------------------------
Transaction ID: ${this.payment?.transaction_id || 'N/A'}
Amount: R${this.payment?.amount?.toFixed(2) || '0.00'}
Payment Method: ${this.getPaymentMethodDisplay()}
Payment Status: ${this.getPaymentStatusDisplay()}
Payment Date: ${this.formatDate(this.payment?.created_at)}

----------------------------------------
BOOKING DETAILS:
----------------------------------------
Car: ${this.booking?.car_make || ''} ${this.booking?.car_model || ''}
Start Date: ${this.formatDate(this.booking?.start_date)}
End Date: ${this.formatDate(this.booking?.end_date)}
Daily Rate: R${this.booking?.daily_rate?.toFixed(2) || '0.00'}
Total Price: R${this.booking?.total_price?.toFixed(2) || '0.00'}

----------------------------------------
Thank you for your payment!
For any questions, contact support@quest4res.com
========================================
    `.trim();
  }

  goToDashboard() {
    this.router.navigate(['/guest-dashboard']);
  }

  viewBooking() {
    this.router.navigate(['/booking-confirmation', this.bookingId]);
  }

  printReceipt() {
    window.print();
  }
  calculateDays(): number {
  if (!this.booking?.start_date || !this.booking?.end_date) return 0;
  const start = new Date(this.booking.start_date);
  const end = new Date(this.booking.end_date);
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
}



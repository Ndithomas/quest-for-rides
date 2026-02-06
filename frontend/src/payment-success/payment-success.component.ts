import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentService } from '../services/payment.service';
import { BookingService } from '../services/booking.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { DateFormatPipe, CurrencyXAFPipe } from '../shared/pipes';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, RouterLink, DateFormatPipe, CurrencyXAFPipe],
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
        
        // Check if payment was made via CamPay
        if (payment.campay_reference) {
          // CamPay specific success handling
          console.log('CamPay Payment Success:', payment.campay_reference);
        }
        
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

  // CamPay specific methods
  getPaymentMethodDisplay(): string {
    if (!this.payment) return 'CamPay';
    
    // Check for CamPay reference
    if (this.payment.campay_reference) {
      return 'CamPay (Mobile Money)';
    }
    
    // Fallback to payment method if available
    if (this.payment.payment_method) {
      return this.payment.payment_method.replace('_', ' ').toUpperCase();
    }
    
    return 'CamPay';
  }

  getPaymentStatusDisplay(): string {
    if (!this.payment?.status) return 'Unknown';
    
    const statusMap: {[key: string]: string} = {
      'completed': 'Completed',
      'pending': 'Pending',
      'failed': 'Failed',
      'refunded': 'Refunded',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[this.payment.status] || this.payment.status.charAt(0).toUpperCase() + this.payment.status.slice(1);
  }

  getCamPayReference(): string {
    return this.payment?.campay_reference || 'N/A';
  }

  getCustomerPhone(): string {
    return this.payment?.customer_phone || 'Not provided';
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

  calculateDays(): number {
    if (!this.booking?.start_date || !this.booking?.end_date) return 0;
    const start = new Date(this.booking.start_date);
    const end = new Date(this.booking.end_date);
    const diffMs = end.getTime() - start.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  // CamPay specific receipt generation
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
        CAMPAY PAYMENT RECEIPT
========================================

Booking ID: ${this.bookingId}
Transaction Date: ${formattedDate}
Transaction Time: ${formattedTime}

----------------------------------------
PAYMENT DETAILS (CamPay):
----------------------------------------
CamPay Reference: ${this.getCamPayReference()}
Customer Phone: ${this.getCustomerPhone()}
Payment Method: ${this.getPaymentMethodDisplay()}
Payment Status: ${this.getPaymentStatusDisplay()}
Amount: R${this.payment?.amount?.toFixed(2) || '0.00'}
Transaction ID: ${this.payment?.transaction_id || 'N/A'}

----------------------------------------
BOOKING DETAILS:
----------------------------------------
Car: ${this.booking?.car?.make || ''} ${this.booking?.car?.model || ''}
License Plate: ${this.booking?.car?.license_plate || 'N/A'}
Start Date: ${this.formatDate(this.booking?.start_date)}
End Date: ${this.formatDate(this.booking?.end_date)}
Duration: ${this.calculateDays()} days
Daily Rate: R${this.booking?.daily_rate?.toFixed(2) || '0.00'}
Total Price: R${this.booking?.total_price?.toFixed(2) || '0.00'}

----------------------------------------
NOTES:
----------------------------------------
• This is a mobile money payment via CamPay
• Keep this receipt for your records
• Contact support if you have any questions

Support: support@quest4rides.com
Phone: +237 XXX XXX XXX
========================================
    `.trim();
  }

  downloadReceipt() {
    const receiptContent = this.generateReceiptContent();
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campay-receipt-booking-${this.bookingId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
}
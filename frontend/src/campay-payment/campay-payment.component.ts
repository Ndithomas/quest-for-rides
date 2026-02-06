import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService, CamPayInitiateData } from '../services/payment.service';
import { BookingService } from '../services/booking.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { DateFormatPipe } from '../shared/pipes';

@Component({
  selector: 'app-campay-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent, DateFormatPipe],
  templateUrl: './campay-payment.component.html',
  styleUrl: './campay-payment.component.scss'
})
export class CampayPaymentComponent implements OnInit, OnDestroy {
  bookingId: number = 0;
  booking: any = null; 
  phoneNumber: string = '';
  loading = true; // Set to true to show loading spinner on initial load
  processing = false;
  error = '';
  success = '';
  paymentStatus: any = null;
  statusCheckInterval: any = null;

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
    this.loadBooking();
  }

  loadBooking(): void {
    this.loading = true;
    this.bookingService.getBooking(this.bookingId).subscribe({
      next: (booking: any) => {
        this.booking = booking;
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Unable to load booking details.';
        this.loading = false;
        console.error(error);
      }
    });
  }

  formatPhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove non-digits

    // Optional: Auto-prepend '237' if the user starts with '6' or '7' (mobile operator codes)
    if (!value.startsWith('237') && value.length > 0 && ['6', '7'].includes(value[0])) {
        value = '237' + value;
    }
    
    // Limit to 12 characters (237 + 9 digits)
    this.phoneNumber = value.substring(0, 12);
  }

  initiatePayment(): void {
    // Check for 237 followed by 9 digits (12 characters total)
    if (!this.phoneNumber || this.phoneNumber.length !== 12 || !/^237\d{9}$/.test(this.phoneNumber)) {
      this.error = 'Please enter a valid Cameroon phone number (e.g., 2376xxxxxxxx)';
      return;
    }

    this.processing = true;
    this.error = '';
    this.success = '';

    const paymentData: CamPayInitiateData = {
      phone: this.phoneNumber
    };

    this.paymentService.initiateCamPayPayment(this.bookingId, paymentData).subscribe({
      next: (response: any) => {
        this.success = 'Payment request sent! Please check your phone to confirm.';
        this.startStatusChecking();
      },
      error: (error: any) => {
        this.error = error.error?.error || error.error?.detail || 'Failed to initiate payment. Please try again.';
        this.processing = false;
      }
    });
  }

  startStatusChecking(): void {
    // Clear any existing interval before starting a new one
    if (this.statusCheckInterval) {
        clearInterval(this.statusCheckInterval);
    }
    // Check status every 5 seconds
    this.statusCheckInterval = setInterval(() => {
      this.checkPaymentStatus();
    }, 5000);
  }

  checkPaymentStatus(): void {
    this.paymentService.checkCamPayStatus(this.bookingId).subscribe({
      next: (status: any) => {
        this.paymentStatus = status;
        
        if (status.status === 'completed' || status.campay_status === 'SUCCESSFUL') {
          clearInterval(this.statusCheckInterval);
          this.processing = false;
          this.success = 'Payment successful! Redirecting...';
          setTimeout(() => {
            this.router.navigate(['/payment-success', this.bookingId]);
          }, 2000);
        } else if (status.status === 'failed' || status.campay_status === 'FAILED') {
          clearInterval(this.statusCheckInterval);
          this.processing = false;
          this.error = 'Payment failed. Please try again.';
          this.paymentStatus = null; // Clear status display to allow user to retry
        }
      },
      error: (error: any) => {
        // Silently fail, will retry on next interval
        console.error('Status check error:', error);
      }
    });
  }

  cancelPayment(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    this.router.navigate(['/booking-confirmation', this.bookingId]);
  }

  ngOnDestroy(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval); // Crucial for memory leak prevention
    }
  }
}
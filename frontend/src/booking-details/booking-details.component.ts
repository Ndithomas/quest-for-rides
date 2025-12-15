// src/app/booking-details/booking-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { BookingService, Booking } from '../services/booking.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './booking-details.component.html',
  styleUrls: ['./booking-details.component.scss']
})
export class BookingDetailsComponent implements OnInit {
  booking: Booking | null = null;
  isLoading = false;
  error: string | null = null;
  bookingId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService
  ) { }

ngOnInit(): void {
  this.route.params.subscribe(params => {
    const id = params['bookingId'];           // ← Fix: 'bookingId' not 'id'
    const bookingId = id ? +id : NaN;

    if (isNaN(bookingId) || bookingId <= 0) {
      this.error = 'Invalid booking ID';
      this.isLoading = false;
      return;
    }
    this.bookingId = bookingId;
    this.loadBooking();
  });
}

  loadBooking(): void {
    this.isLoading = true;
    this.error = null;

    this.bookingService.getBooking(this.bookingId).subscribe({
      next: (data) => {
        this.booking = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading booking:', err);
        this.error = 'Failed to load booking details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getDaysBetween(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
        return 'status-confirmed';
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'refunded':
        return 'status-refunded';
      default:
        return 'status-unknown';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'payment-pending';
      case 'completed':
        return 'payment-completed';
      case 'failed':
        return 'payment-failed';
      case 'refunded':
        return 'payment-refunded';
      default:
        return 'payment-unknown';
    }
  }

  goBack(): void {
    this.router.navigate(['/management/bookings']);
  }

  updateBookingStatus(status: string): void {
    if (!confirm(`Are you sure you want to change booking status to "${status}"?`)) {
      return;
    }

    if (!this.booking) return;

    this.bookingService.updateBookingStatus(this.booking.id, status).subscribe({
      next: (updatedBooking) => {
        this.booking = updatedBooking;
        alert(`Booking status updated to ${status}`);
      },
      error: (err) => {
        console.error('Error updating booking status:', err);
        alert('Failed to update booking status');
      }
    });
  }
  getCarYear(): string {
    if (!this.booking) return 'N/A';
    return this.booking.car_year?.toString() || 'N/A';
  }

  getCarLicensePlate(): string {
    if (!this.booking) return 'N/A';
    return this.booking.car_license_plate || 'N/A';
  }
  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'fa-clock';
      case 'confirmed': return 'fa-check-circle';
      case 'active': return 'fa-car';
      case 'completed': return 'fa-check-square';
      case 'cancelled': return 'fa-times-circle';
      case 'refunded': return 'fa-exchange-alt';
      default: return 'fa-question-circle';
    }
  }
}
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService, Booking } from '../services/booking.service';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink,NavbarComponent,FooterComponent],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss'
})
export class BookingsComponent implements OnInit {
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  error = signal('');

  filterStatus = signal<'all' | 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'>('all');

  constructor(
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.error.set('');

    this.bookingService.getMyBookings().subscribe({
      next: (bookings: Booking[]) => {
        this.bookings.set(bookings);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.error.set(err.error?.detail || 'Failed to load bookings. Please try again.');
        this.loading.set(false);
      }
    });
  }

  setFilterStatus(status: string): void {
    this.filterStatus.set(status as any);
  }

  getFilteredBookings(): Booking[] {
    const status = this.filterStatus();
    if (status === 'all') return this.bookings();
    return this.bookings().filter(b => b.status === status);
  }

 getStatusText(booking: Booking): string {
    if (booking.status === 'confirmed' && booking.payment_status !== 'completed') {
        return 'Payment Required';
    }
    return booking.status;
}

getStatusBadgeClass(booking: Booking): string {
    if (booking.status === 'confirmed' && booking.payment_status !== 'completed') {
        return 'badge-warning'; 
    }
    switch (booking.status) {
        case 'pending':   return 'badge-warning';
        case 'confirmed': return 'badge-success'; 
        case 'rejected':  return 'badge-danger';
        case 'cancelled': return 'badge-secondary';
        case 'completed': return 'badge-info';
        default:          return 'badge-secondary';
    }
}

  cancelBooking(booking: Booking): void {
    if (booking.status !== 'pending') {
      this.error.set('Only pending bookings can be cancelled.');
      return;
    }

    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    this.bookingService.guestCancelBooking(booking.id).subscribe({
      next: () => this.loadBookings(),
      error: (err) => this.error.set(err.error?.detail || 'Failed to cancel booking.')
    });
  }

  goToPayment(bookingId: number): void {
    this.router.navigate(['/payment-processing', bookingId]);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
}
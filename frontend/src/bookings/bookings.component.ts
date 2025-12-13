import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService, Booking } from '../services/booking.service';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss'
})
export class BookingsComponent implements OnInit, OnDestroy {
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  error = signal('');
  timeLeftMap = signal<Map<number, string>>(new Map());
  private timerInterval: any;

  filterStatus = signal<'all' | 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'>('all');

  constructor(
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookings();
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  startTimer(): void {
    // Update timers every minute
    this.timerInterval = setInterval(() => {
      this.updateAllTimers();
    }, 60000); // Update every minute
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  updateAllTimers(): void {
    const newTimeLeftMap = new Map<number, string>();
    
    this.bookings().forEach(booking => {
      if (booking.status === 'pending') {
        const timeLeft = this.getTimeLeft(booking);
        newTimeLeftMap.set(booking.id, timeLeft);
      }
    });
    
    this.timeLeftMap.set(newTimeLeftMap);
  }

  getTimeLeft(booking: Booking): string {
    const created = new Date(booking.created_at);
    const deadline = new Date(created.getTime() + 24 * 60 * 60 * 1000); // 24 hours from creation
    const now = new Date();
    
    if (deadline < now) return 'Expired';
    
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes}m left to confirm`;
    }
    return `${hours}h ${minutes}m left to confirm`;
  }

  loadBookings(): void {
    this.loading.set(true);
    this.error.set('');

    this.bookingService.getMyBookings().subscribe({
      next: (bookings: Booking[]) => {
        this.bookings.set(bookings);
        this.loading.set(false);
        this.updateAllTimers(); // Initialize timers after loading bookings
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

    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    this.loading.set(true);
    this.bookingService.guestCancelBooking(booking.id).subscribe({
      next: (response) => {
        // Reload bookings to get updated status
        this.loadBookings();
        // Show success message
        alert('Booking cancelled successfully!');
      },
      error: (err) => {
        console.error('Error cancelling booking:', err);
        this.error.set(err.error?.detail || 'Failed to cancel booking. Please try again.');
        this.loading.set(false);
      }
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
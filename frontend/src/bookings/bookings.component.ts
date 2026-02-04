import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { BookingService, Booking, PaginatedBookings } from '../services/booking.service';
import { ReviewService, ReviewCreate } from '../services/review.service';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss'
})
export class BookingsComponent implements OnInit, OnDestroy {
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  error = signal('');
  timeLeftMap = signal<Map<number, string>>(new Map());
  private timerInterval: any;

  filterStatus = signal<'all' | 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'>('all');
  currentPage = signal(1);
  hasMore = signal(false);

  
  showReviewModal = signal(false);
  reviewingBookingId = signal<number | null>(null);
  reviewRating = signal(5);
  reviewComment = signal('');
  reviewSubmitting = signal(false);
  reviewError = signal('');
  reviewSuccess = signal(false);
  reviewSuccessMessage = signal('');

  

  constructor(
    private bookingService: BookingService,
    private reviewService: ReviewService,
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
    this.timerInterval = setInterval(() => {
      this.updateAllTimers();
    }, 60000);
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
    const deadline = new Date(created.getTime() + 24 * 60 * 60 * 1000);
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
    this.loadPage(1, true);
  }

  loadPage(page: number, reset: boolean = false): void {
    if (reset) {
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }
    this.error.set('');

    this.bookingService.getMyBookings(page, this.filterStatus()).subscribe({
      next: (response: PaginatedBookings) => {
        if (reset) {
          this.bookings.set(response.results);
        } else {
          this.bookings.update(b => [...b, ...response.results]);
        }
        this.hasMore.set(!!response.next);
        this.currentPage.set(page);
        this.loading.set(false);
        this.loadingMore.set(false);
        this.updateAllTimers();
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to load bookings. Please try again.');
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  setFilterStatus(status: string): void {
    this.filterStatus.set(status as any);
    this.currentPage.set(1);
    this.loadPage(1, true);
  }

  getFilteredBookings(): Booking[] {
    const status = this.filterStatus();
    if (status === 'all') return this.bookings();
    return this.bookings().filter(b => b.status === status);
  }

  loadMore(): void {
    if (!this.hasMore() || this.loadingMore()) return;
    this.loadPage(this.currentPage() + 1, false);
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
        this.loadBookings();
        alert('Booking cancelled successfully!');
      },
      error: (err) => {
        console.error('Error cancelling booking:', err);
        this.error.set(err.error?.detail || 'Failed to cancel booking. Please try again.');
        this.loading.set(false);
      }
    });
  }

  // FIXED: Changed to use campay-payment route
  goToPayment(bookingId: number): void {
    this.router.navigate(['/campay-payment', bookingId]);
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

  openReviewModal(booking: Booking): void {
    if (booking.status !== 'completed') {
      this.error.set('Only completed bookings can be reviewed.');
      return;
    }
    this.reviewingBookingId.set(booking.id);
    this.reviewRating.set(5);
    this.reviewComment.set('');
    this.reviewError.set('');
    this.showReviewModal.set(true);
  }

  closeReviewModal(): void {
    this.showReviewModal.set(false);
    this.reviewingBookingId.set(null);
    this.reviewComment.set('');
  }

  setReviewRating(rating: number): void {
    this.reviewRating.set(rating);
  }

  submitReview(): void {
    const bookingId = this.reviewingBookingId();
    if (!bookingId) return;

    if (this.reviewRating() < 1 || this.reviewRating() > 5) {
      this.reviewError.set('Please select a rating between 1 and 5.');
      return;
    }

    this.reviewSubmitting.set(true);
    this.reviewError.set('');

    const review: ReviewCreate = {
      booking_id: bookingId,
      rating: this.reviewRating(),
      comment: this.reviewComment()
    };

    this.reviewService.createReview(review).subscribe({
      next: () => {
        // Show success message
        this.reviewSuccess.set(true);
        this.reviewSuccessMessage.set('Thank you! Your review has been submitted successfully.');
        
        // Close modal after a short delay
        setTimeout(() => {
          this.closeReviewModal();
          this.reviewSuccess.set(false);
          // Reload bookings to show updated review status
          this.loadBookings();
        }, 1500);
      },
      error: (err) => {
        this.reviewError.set(err.error?.detail || 'Failed to submit review. Please try again.');
        this.reviewSubmitting.set(false);
      }
    });
  }

  getReviewStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }
}
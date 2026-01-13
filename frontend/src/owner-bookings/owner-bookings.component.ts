import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { BookingService, Booking } from '../services/booking.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-owner-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './owner-bookings.component.html',
  styleUrl: './owner-bookings.component.scss'
})
export class OwnerBookingsComponent implements OnInit {
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  error = signal('');
  success = signal('');
  filter = signal<'pending' | 'confirmed-unpaid' | 'confirmed-paid' | 'active' | 'completed' | 'rejected' | 'cancelled' | 'all'>('all');
  cancellingId = signal<number | null>(null);
  showCancelModal = signal(false);
  bookingToCancel = signal<Booking | null>(null);  
  showModal = signal(false);
  modalType = signal<'confirm' | 'reject'>('confirm');
  currentBooking = signal<Booking | null>(null);
  notes = signal('');
  reason = signal('');

  constructor(
    private bookingService: BookingService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadBookings();
  }

  loadBookings() {
    this.loading.set(true);
    this.error.set('');
    this.bookingService.getPendingConfirmations().subscribe({
      next: (bookings: Booking[]) => {
        this.bookingService.getMyBookings().subscribe({
          next: (allBookings: Booking[]) => {
            const currentUser = this.authService.getUser();
            if (!currentUser) {
              this.error.set('User not found');
              this.loading.set(false);
              return;
            }
            const ownerBookings = allBookings.filter(b => {
              if (b.owner && typeof b.owner === 'object') {
                return b.owner.id === currentUser.id;
              }
              if (typeof b.owner === 'number') {
                return b.owner === currentUser.id;
              }
              return false;
            });

            this.bookings.set(ownerBookings);
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set(err.error?.detail || 'Failed to load all bookings');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to load pending bookings');
        this.loading.set(false);
      }
    });
  }
  loadBookingsSimple() {
    this.loading.set(true);
    this.error.set('');

    this.bookingService.getMyBookings().subscribe({
      next: (allBookings: Booking[]) => {
        const currentUser = this.authService.getUser();
        if (!currentUser) {
          this.error.set('User not found');
          this.loading.set(false);
          return;
        }

        const ownerBookings = allBookings.filter(b => {
          if (b.owner && typeof b.owner === 'object') {
            return b.owner.id === currentUser.id;
          }
          if (typeof b.owner === 'number') {
            return b.owner === currentUser.id;
          }
          return false;
        });

        this.bookings.set(ownerBookings);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to load bookings');
        this.loading.set(false);
      }
    });
  }

  setFilter(status: any) {
    this.filter.set(status);
  }

  openModal(booking: Booking, type: 'confirm' | 'reject') {
    this.currentBooking.set(booking);
    this.modalType.set(type);
    this.notes.set('');
    this.reason.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.notes.set('');
    this.reason.set('');
  }

  confirmOrReject() {
    const b = this.currentBooking();
    if (!b) return;

    if (this.modalType() === 'reject' && !this.reason().trim()) {
      this.error.set('Please provide a reason for rejection');
      return;
    }

    const status = this.modalType() === 'confirm' ? 'confirmed' : 'rejected';

    this.bookingService.confirmBooking(b.id, status, this.notes(), this.reason()).subscribe({
      next: (updatedBooking) => {
        this.success.set(`Booking ${status}!`);
        this.loadBookingsSimple();
        this.closeModal();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.detail || `Failed to ${status} booking`);
        this.closeModal();
      }
    });
  }

  filtered() {
    const f = this.filter();
    if (f === 'all') return this.bookings();

    return this.bookings().filter(b => {
      switch (f) {
        case 'pending':
          return b.status === 'pending';
        case 'confirmed-unpaid':
          return b.status === 'confirmed' &&
            (b.payment_status !== 'completed' || !b.payment?.status || b.payment.status !== 'completed');
        case 'confirmed-paid':
          return b.status === 'confirmed' &&
            (b.payment_status === 'completed' || b.payment?.status === 'completed');
        case 'active':
          return b.status === 'active';
        case 'completed':
          return b.status === 'completed';
        case 'rejected':
          return b.status === 'rejected';
        case 'cancelled':
          return b.status === 'cancelled';
        default:
          return false;
      }
    });
  }

  days(start: string, end: string): number {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  getStatusBadgeClass(booking: Booking): string {
    if (booking.status === 'confirmed') {
      const isPaid = booking.payment_status === 'completed' ||
        booking.payment?.status === 'completed';

      if (isPaid) {
        return 'success';
      } else {
        return 'info';
      }
    }

    switch (booking.status) {
      case 'pending': return 'warning';
      case 'active': return 'primary';
      case 'completed': return 'secondary';
      case 'rejected': return 'danger';
      case 'cancelled': return 'dark';
      default: return 'secondary';
    }
  }

  getStatusDisplayText(booking: Booking): string {
    if (booking.status === 'confirmed') {
      const isPaid = booking.payment_status === 'completed' ||
        booking.payment?.status === 'completed';

      if (isPaid) {
        return 'Confirmed & Paid';
      } else {
        return 'Confirmed (Awaiting Payment)';
      }
    }

    return booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
  }

  isBookingPaid(booking: Booking): boolean {
    return booking.payment_status === 'completed' ||
      booking.payment?.status === 'completed';
  }

  getFilterDisplayText(filterValue: string): string {
    switch (filterValue) {
      case 'pending': return 'Pending';
      case 'confirmed-unpaid': return 'Confirmed (Unpaid)';
      case 'confirmed-paid': return 'Confirmed (Paid)';
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      case 'cancelled': return 'Cancelled';
      case 'all': return 'All';
      default: return filterValue;
    }
  }
  cancelUnpaidBooking(bookingId: number): void {
    if (!confirm('Are you sure you want to cancel this booking because the guest has not paid? The car will become available again.')) {
      return;
    }

    this.cancellingId.set(bookingId);

    this.bookingService.ownerCancelUnpaidBooking(bookingId).subscribe({
      next: () => {
        this.success.set('Booking cancelled successfully. Car is now available.');
        this.loadBookingsSimple();
        this.cancellingId.set(null);
        setTimeout(() => this.success.set(''), 4000);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to cancel booking.');
        this.cancellingId.set(null);
      }
    });
  }
  openCancelConfirmModal(booking: Booking): void {
  this.bookingToCancel.set(booking);
  this.showCancelModal.set(true);
}

closeCancelModal(): void {
  this.showCancelModal.set(false);
  this.bookingToCancel.set(null);
}

confirmCancelUnpaid(): void {
  const booking = this.bookingToCancel();
  if (!booking) return;

  this.cancellingId.set(booking.id);

  this.bookingService.ownerCancelUnpaidBooking(booking.id).subscribe({
    next: () => {
      this.success.set('Booking cancelled successfully. The car is now available again.');
      this.loadBookingsSimple();
      this.closeCancelModal();
      this.cancellingId.set(null);
      setTimeout(() => this.success.set(''), 5000);
    },
    error: (err) => {
      this.error.set(err.error?.detail || 'Failed to cancel booking. Please try again.');
      this.cancellingId.set(null);
    }
  });
}
}
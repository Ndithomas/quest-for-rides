import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { BookingService } from '../services/booking.service';
import { ListingsService } from '../services/listings.service';
import { DateFormatPipe, CurrencyXAFPipe } from '../shared/pipes';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, DateFormatPipe, CurrencyXAFPipe],
  templateUrl: './booking-confirmation.component.html',
  styleUrls: ['./booking-confirmation.component.scss']
})
export class BookingConfirmationComponent implements OnInit {
  booking = signal<any>(null);
  car = signal<any>(null);
  loading = signal(true);
  error = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private bookingService: BookingService,
    private listingsService: ListingsService
  ) { }

  ngOnInit(): void {
    const bookingId = this.route.snapshot.paramMap.get('bookingId');
    if (bookingId) {
      this.loadBooking(+bookingId);
    } else {
      this.error.set('Invalid booking ID');
      this.loading.set(false);
    }
  }

  loadBooking(id: number): void {
    this.loading.set(true);
    this.bookingService.getBooking(id).subscribe({
      next: (booking: any) => {
        this.booking.set(booking);
        this.listingsService.getCar(booking.car).subscribe({
          next: (car: any) => {
            this.car.set(car);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => {
        this.error.set('Failed to load booking details');
        this.loading.set(false);
      }
    });
  }

  getStatusLabel(): string {
  const b = this.booking();
  if (!b) return '';
  
  if (b.status === 'confirmed' && (!b.payment || b.payment?.status !== 'completed')) {
    return 'Confirmed – Payment Required';
  }

  switch (b.status) {
    case 'pending': return 'Awaiting Owner Confirmation';
    case 'confirmed': return 'Confirmed & Paid';
    case 'rejected': return 'Rejected by Owner';
    default: return b.status.charAt(0).toUpperCase() + b.status.slice(1);
  }
}

  getStatusColor(): string {
    const b = this.booking();
    if (!b) return '';

    if (b.status === 'confirmed' && (!b.payment || b.payment.status !== 'completed')) {
      return 'status-payment-required';
    }

    switch (b.status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'rejected': return 'status-rejected';
      default: return 'status-default';
    }
  }

  getDayCount(): number {
    const booking = this.booking();
    if (!booking) return 0;
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    const diffMs = end.getTime() - start.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/guest-dashboard']);
  }

  goToBookings(): void {
    this.router.navigate(['/bookings']);
  }


  initiatePayment(): void {
    const bookingId = this.booking()?.id;
    if (bookingId) {
      this.router.navigate(['/campay-payment', bookingId]);
    }
  }

  goBack(): void {
    this.location.back();
  }
}

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { ListingsComponent } from '../listings/listings.component';
import { BookingService, Booking } from '../services/booking.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-guest-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NavbarComponent,
    FooterComponent,
    ListingsComponent
  ],
  templateUrl: './guest-dashboard.component.html',
  styleUrls: ['./guest-dashboard.component.scss']
})
export class GuestDashboardComponent implements OnInit {
  pendingCount = signal(0);
  paymentRequiredCount = signal(0);
  upcomingCount = signal(0);
  username = signal('Guest');

  constructor(
    private bookingService: BookingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Set username
    const user = this.authService.decodeUserFromToken();
    this.username.set(user?.username || 'Guest');

    // Load booking stats only (no full list needed)
    this.loadBookingStats();
  }

  private loadBookingStats(): void {
    this.bookingService.getMyBookings().subscribe({
      next: (bookings: Booking[]) => {
        this.pendingCount.set(
          bookings.filter(b => b.status === 'pending').length
        );

        this.paymentRequiredCount.set(
          bookings.filter(b =>
            b.status === 'confirmed' && b.payment_status !== 'completed'
          ).length
        );

        this.upcomingCount.set(
          bookings.filter(b =>
            b.status === 'confirmed' && b.payment_status === 'completed'
          ).length
        );
      },
      error: (err) => {
        console.error('Failed to load booking stats:', err);
        // Keep counts at 0 on error
      }
    });
  }
}
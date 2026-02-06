import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingsService } from '../services/listings.service';
import { BookingService } from '../services/booking.service';
import { ReviewService, Review } from '../services/review.service';
import { AuthService } from '../services/auth.service';
import { FooterComponent } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { ReviewsComponent } from '../reviews/reviews.component';

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, FooterComponent, NavbarComponent, ReviewsComponent],
  templateUrl: './car-detail.component.html',
  styleUrl: './car-detail.component.scss'
})
export class CarDetailComponent implements OnInit {
  Math = Math;
  car = signal<any>(null);
  photos = signal<any[]>([]);
  currentPhoto = signal(0);

  loading = signal(true);
  error = signal<string>('');

  startDate = signal<string>('');
  endDate = signal<string>('');
  specialRequirements = '';

  bookingLoading = signal(false);
  bookingSuccess = signal(false);
  bookingError = signal<string>('');

  // User role for booking restriction
  currentUser = signal<any>(null);
  isGuestUser = signal(false);
  isLoggedIn = signal(false);

  canShowBookingForm = computed(() => {
    return !this.isLoggedIn() || this.isGuestUser();
  });

  // Reviews
  reviews = signal<Review[]>([]);
  reviewsLoading = signal(false);
  averageRating = computed(() => {
    const revs = this.reviews();
    if (revs.length === 0) return 0;
    const sum = revs.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = sum / revs.length;

    const maxRating = revs.reduce((m, r) => Math.max(m, r.rating || 0), 0);
    const normalized = maxRating > 5 ? (avg / 2) : avg;
    return Math.round(normalized * 10) / 10;
  });

  numDays = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) return 0;

    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  });

  totalPrice = computed(() => {
    return this.numDays() * (this.car()?.daily_rate || 0);
  });

  isCarBookable = computed(() => {
    const c = this.car();
    if (!c || !c.is_verified) return false;

    const badge = (c.status_badge || '').toLowerCase();
    const display = (c.status_display || '').toLowerCase();

    const booked = badge === 'booked' || display.includes('booked');
    const unavailable = ['maintenance', 'inactive'].includes(badge);

    return !booked && !unavailable;
  });

  processedFeatures = computed<string[]>(() => {
    const f = this.car()?.features;
    if (!f) return [];
    if (Array.isArray(f)) return f;
    return f.toString()
      .replace(/\n/g, ',')
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private listingsService: ListingsService,
    private bookingService: BookingService,
    private reviewService: ReviewService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Get current user role
    const user = this.authService.getUser();
    this.currentUser.set(user);
    this.isGuestUser.set(user?.role === 'guest');

    this.isLoggedIn.set(this.authService.isLoggedIn());

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (isNaN(id)) {
      this.error.set('Invalid car ID');
      this.loading.set(false);
      return;
    }
    this.loadCar(id);
  }

  loadCar(id: number) {
    this.loading.set(true);
    this.error.set('');
    this.listingsService.getCar(id).subscribe({
      next: (data) => {
        this.car.set(data);
        this.photos.set(Array.isArray(data.photos) ? data.photos : []);
        this.loading.set(false);
        // Load reviews for this car
        this.loadCarReviews(id);
      },
      error: (err: any) => {
        this.error.set(err.status === 404 ? 'Car not found.' : 'Failed to load car details.');
        this.loading.set(false);
      }
    });
  }

  loadCarReviews(carId: number): void {
    this.reviewsLoading.set(true);
    this.reviewService.getCarReviews(carId).subscribe({
      next: (reviews: Review[]) => {
        this.reviews.set(reviews);
        this.reviewsLoading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load car reviews:', err);
        this.reviewsLoading.set(false);
      }
    });
  }

  refreshCar() {
    const id = this.car()?.id;
    if (id) this.loadCar(id);
  }

  getCurrentPhotoUrl(): string {
    return this.photos()[this.currentPhoto()]?.image || '/assets/placeholder.jpg';
  }

  next() {
    const len = this.photos().length;
    if (len > 1) this.currentPhoto.set((this.currentPhoto() + 1) % len);
  }

  prev() {
    const len = this.photos().length;
    if (len > 1) {
      this.currentPhoto.set(this.currentPhoto() === 0 ? len - 1 : this.currentPhoto() - 1);
    }
  }

  today(): string {
    return new Date().toISOString().split('T')[0];
  }

  back() {
    this.location.back();
  }

  getCarTitle(): string {
    const c = this.car();
    return c ? `${c.year} ${c.make} ${c.model}` : 'Loading...';
  }

  getCarLocation(): string {
    return this.car()?.location_name || 'Location not set';
  }

  getLicensePlate(): string {
    return this.car()?.license_plate || 'N/A';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  roundRating(): number {
    return Math.round(this.averageRating());
  }

  normalizeRating(rating: number | undefined | null): number {
    if (!rating) return 0;
    const r = Number(rating) || 0;
    return r > 5 ? Math.round(r / 2) : Math.round(r);
  }

  // Booking
  submitBooking() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (!this.isGuestUser()) {
      this.bookingError.set('Only guests can book cars. Please log in as a guest account.');
      return;
    }

    if (this.numDays() === 0) {
      this.bookingError.set('Please select valid dates.');
      return;
    }

    this.bookingLoading.set(true);
    this.bookingError.set('');
    this.bookingSuccess.set(false);

    this.bookingService.createBooking({
      car: this.car()!.id,
      start_date: this.startDate(),
      end_date: this.endDate(),
      special_requirements: this.specialRequirements  // ← normal string, no ()
    }).subscribe({
      next: (booking) => {
        this.bookingSuccess.set(true);
        this.bookingLoading.set(false);
        setTimeout(() => {
          this.router.navigate(['/booking-confirmation', booking.id]);
        }, 1500);
      },
      error: (err: any) => {
        this.bookingError.set(err.error?.detail || 'Booking failed. Please try again.');
        this.bookingLoading.set(false);
      }
    });
  }
}
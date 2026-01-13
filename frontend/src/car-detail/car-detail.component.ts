import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingsService } from '../services/listings.service';
import { BookingService } from '../services/booking.service';
import { AuthService } from '../services/auth.service';
import { FooterComponent } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, FooterComponent, NavbarComponent],
  templateUrl: './car-detail.component.html',
  styleUrl: './car-detail.component.scss'
})
export class CarDetailComponent implements OnInit {
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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
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
      },
      error: (err) => {
        this.error.set(err.status === 404 ? 'Car not found.' : 'Failed to load car details.');
        this.loading.set(false);
      }
    });
  }

  refreshCar() {
    const id = this.car()?.id;
    if (id) this.loadCar(id);
  }

  // Gallery
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

  // Booking
  submitBooking() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
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
      error: (err) => {
        this.bookingError.set(err.error?.detail || 'Booking failed. Please try again.');
        this.bookingLoading.set(false);
      }
    });
  }
}
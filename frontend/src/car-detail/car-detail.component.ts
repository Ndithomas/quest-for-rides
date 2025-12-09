import { Component, OnInit, signal } from '@angular/core';
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
  error = signal('');

  startDate: string = '';
  endDate: string = '';
  specialRequirements: string = '';

  bookingLoading = signal(false);
  bookingError = signal('');
  bookingSuccess = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private listingsService: ListingsService,
    private bookingService: BookingService,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCar(+id);
    } else {
      this.error.set('Invalid car ID');
      this.loading.set(false);
    }
  }

  loadCar(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.listingsService.getCar(id).subscribe({
      next: (data: any) => {
        if (!data) {
          this.error.set('Car not found');
          this.loading.set(false);
          return;
        }
        this.car.set(data);
        this.photos.set(data.photos && Array.isArray(data.photos) ? data.photos : []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load car details');
        this.loading.set(false);
      }
    });
  }

  // Gallery
  getCurrentPhotoUrl(): string {
    const photo = this.photos()[this.currentPhoto()];
    return photo?.image || '';
  }

  getThumbnailUrl(photo: any): string {
    return photo.image;
  }

  next() {
    if (this.photos().length > 1) {
      this.currentPhoto.set((this.currentPhoto() + 1) % this.photos().length);
    }
  }

  prev() {
    if (this.photos().length > 1) {
      this.currentPhoto.set(
        (this.currentPhoto() - 1 + this.photos().length) % this.photos().length
      );
    }
  }

  getCarTitle(): string {
    const c = this.car();
    return c ? `${c.year || ''} ${c.make || ''} ${c.model || ''}`.trim() : 'Loading...';
  }

  getCarLocation(): string {
    return this.car()?.location_name || 'Location not set';
  }

  getDailyRate(): number {
    return this.car()?.daily_rate || 0;
  }

  getOwnerName(): string {
    return this.car()?.owner_name || this.car()?.owner?.username || 'Owner';
  }

  getLicensePlate(): string {
    return this.car()?.license_plate || 'Not specified';
  }

  getStatus(): string {
    const status = this.car()?.status || 'available';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  today(): string {
    return new Date().toISOString().split('T')[0];
  }

  numDays(): number {
    if (!this.startDate || !this.endDate) return 0;
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  totalPrice(): number {
    return this.numDays() * this.getDailyRate();
  }


  submitBooking(): void {
    this.bookingError.set('');

    if (!this.startDate || !this.endDate) {
      this.bookingError.set('Please select start and end dates.');
      return;
    }

    if (new Date(this.endDate) <= new Date(this.startDate)) {
      this.bookingError.set('End date must be after start date.');
      return;
    }

    this.bookingLoading.set(true);

    const bookingRequest = {
      car: this.car()!.id,
      start_date: this.startDate,
      end_date: this.endDate,
      special_requirements: this.specialRequirements || null
    };

    this.bookingService.createBooking(bookingRequest).subscribe({
      next: (booking) => {
        this.bookingLoading.set(false);
        this.bookingSuccess.set(true);

        setTimeout(() => {
          this.router.navigate(['/booking-confirmation', booking.id]);
        }, 1800);
      },
      error: (error) => {
        this.bookingLoading.set(false);
        const message =
          error?.error?.detail ||
          error?.error?.car?.[0] ||
          'Failed to create booking. The car may be unavailable for these dates.';
        this.bookingError.set(message);
      }
    });
  }

  back() {
    this.location.back();
  }
}
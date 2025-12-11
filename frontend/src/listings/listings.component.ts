import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ListingsService } from '../services/listings.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './listings.component.html',
  styleUrl: './listings.component.scss'
})
export class ListingsComponent implements OnInit {
  location = signal('');
  make = signal('');
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);

  cars = signal<any[]>([]);
  loading = signal(true);
  searchError = signal('');

  constructor(
    private listingsService: ListingsService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    this.loading.set(true);
    this.searchError.set('');

    const filters: any = {};
    const locationValue = this.location();
    const makeValue = this.make();
    const minPriceValue = this.minPrice();
    const maxPriceValue = this.maxPrice();

    if (locationValue && locationValue.trim() !== '') {
      filters.location = locationValue.trim();
    }
    if (makeValue && makeValue.trim() !== '') {
      filters.make = makeValue.trim();
    }
    if (minPriceValue !== null && minPriceValue > 0) {
      filters.min_price = minPriceValue;
    }
    if (maxPriceValue !== null && maxPriceValue > 0) {
      filters.max_price = maxPriceValue;
    }

    this.listingsService.search(filters).subscribe({
      next: (data) => {
        this.cars.set(data || []);
        this.loading.set(false);
      },
      error: (error) => {
        this.searchError.set('Failed to load cars. Please try again.');
        this.cars.set([]);
        this.loading.set(false);
      }
    });
  }

  clear(): void {
    this.location.set('');
    this.make.set('');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.search();
  }

  // ONLY CHANGE: removed login check — now anyone can view car details
  view(carId: number): void {
    this.router.navigate(['/car', carId]);
  }

  trackByCarId(index: number, car: any): number {
    return car?.id || index;
  }

  getCarTitle(car: any): string {
    return `${car.year || ''} ${car.make || ''} ${car.model || ''}`.trim();
  }

  getDailyRate(car: any): string {
    const rate = parseFloat(car.daily_rate || '0');
    return rate > 0 ? rate.toFixed(2) : '0.00';
  }

  hasPricing(car: any): boolean {
    return parseFloat(car.daily_rate || '0') > 0;
  }

  getCarImage(car: any): string | null {
    // Return primary photo if exists, otherwise first photo, otherwise null
    if (car.photos && car.photos.length > 0) {
      const primaryPhoto = car.photos.find((p: any) => p.is_primary);
      if (primaryPhoto && primaryPhoto.image) {
        return primaryPhoto.image;
      }
      // Fallback to first photo if no primary
      if (car.photos[0] && car.photos[0].image) {
        return car.photos[0].image;
      }
    }
    // Fallback to primary_photo field if available (direct URL)
    if (car.primary_photo) {
      return car.primary_photo;
    }
    return null;
  }
}
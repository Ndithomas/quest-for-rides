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
  currentPage = signal(1);
  hasNext = signal(false);

  constructor(
    private listingsService: ListingsService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.search();  // first 10 cars
  }

  search(page: number = 1): void {
    this.loading.set(true);
    this.searchError.set('');

    const filters: any = {};
    if (this.location()) filters.location = this.location();
    if (this.make()) filters.make = this.make();
    if (this.minPrice()) filters.min_price = this.minPrice();
    if (this.maxPrice()) filters.max_price = this.maxPrice();

    this.listingsService.search(filters, page).subscribe({
      next: (res) => {
        if (page === 1) {
          this.cars.set(res.results); // replace first page
        } else {
          this.cars.set([...this.cars(), ...res.results]); // append for Load More
        }
        this.currentPage.set(page);
        this.hasNext.set(!!res.next);
        this.loading.set(false);
      },
      error: () => {
        this.searchError.set('Failed to load cars.');
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
    if (car.photos && car.photos.length > 0) {
      const primaryPhoto = car.photos.find((p: any) => p.is_primary);
      if (primaryPhoto && primaryPhoto.image) {
        return primaryPhoto.image;
      }

      if (car.photos[0] && car.photos[0].image) {
        return car.photos[0].image;
      }
    }
    if (car.primary_photo) {
      return car.primary_photo;
    }
    return null;
  }
}
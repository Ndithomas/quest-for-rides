import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ListingsService } from '../services/listings.service';
import { FooterComponent } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { DeleteCarComponent } from '../delete-car/delete-car.component';

@Component({
  selector: 'app-owner-cars',
  standalone: true,
  imports: [
    CommonModule,
    FooterComponent,
    NavbarComponent,
    RouterLink,
    DeleteCarComponent
  ],
  templateUrl: './owner-cars.component.html',
  styleUrls: ['./owner-cars.component.scss']
})
export class OwnerCarsComponent implements OnInit {

  cars = signal<any[]>([]);
  loading = signal(true);
  showDeleteModal = signal(false);
  selectedCar = signal<any>(null);
  isDeleting = signal(false);

  totalCars = computed(() => this.cars().length);

  availableCars = computed(() =>
    this.cars().filter((c: any) => c.status === 'active').length
  );

  totalEarnings = computed(() =>
    this.cars().reduce((sum: number, c: any) => sum + (c.total_earnings || 0), 0)
  );

  totalTrips = computed(() =>
    this.cars().reduce((sum: number, c: any) => sum + (c.total_trips || 0), 0)
  );

  constructor(
    private listingsService: ListingsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchCars();
  }

  fetchCars(): void {
    this.loading.set(true);

    this.listingsService.getMyCars().subscribe({
      next: (data: any[]) => this.cars.set(data || []),
      error: (err) => {
        console.error('Failed to load cars:', err);
        this.cars.set([]);
      },
      complete: () => this.loading.set(false)
    });
  }

  view(carId: number): void {
    this.router.navigate(['/car', carId]);
  }

  edit(carId: number): void {
    this.router.navigate(['/owner/edit-car', carId]);
  }

  addNewCar(): void {
    this.router.navigate(['/owner/add-car']);
  }

  openDeleteModal(car: any): void {
    this.selectedCar.set(car);
    this.isDeleting.set(false);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedCar.set(null);
    this.isDeleting.set(false);
  }

  onDeleteCar(): void {
    const car = this.selectedCar();
    if (!car?.id) return;

    this.isDeleting.set(true);

    this.listingsService.deleteCar(car.id).subscribe({
      next: () => {
        this.cars.update((cars) => cars.filter((c) => c.id !== car.id));
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Failed to delete car:', err);
        this.isDeleting.set(false);
      }
    });
  }

  trackByCarId(index: number, car: any): any {
    return car?.id ?? index;
  }

  getPrimaryPhoto(car: any): string {
    if (car.photos?.length > 0) {
      const primary = car.photos.find((p: any) => p.is_primary);
      return primary?.image || car.photos[0].image;
    }
    return '';
  }

  hasPhoto(car: any): boolean {
    return this.getPrimaryPhoto(car) !== '';
  }

  getStatusDisplay(status: string): string {
    const map: any = {
      active: 'Available',
      inactive: 'Inactive',
      maintenance: 'Maintenance',
      booked: 'Booked'
    };
    return map[status] || 'Available';
  }

  getStatusBadgeClass(status: string): string {
    const classMap: any = {
      active: 'bg-success',
      inactive: 'bg-secondary',
      maintenance: 'bg-warning text-dark',
      booked: 'bg-primary'
    };
    return classMap[status] || 'bg-success';
  }
}

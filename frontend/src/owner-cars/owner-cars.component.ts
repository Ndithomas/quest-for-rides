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
  imports: [CommonModule, RouterLink, FooterComponent, NavbarComponent, DeleteCarComponent],
  templateUrl: './owner-cars.component.html',
  styleUrls: ['./owner-cars.component.scss']
})
export class OwnerCarsComponent implements OnInit {
  cars = signal<any[]>([]);
  loading = signal(true);
  showDeleteModal = signal(false);
  selectedCar = signal<any>(null);
  isDeleting = signal(false);
  markingId = signal<number | null>(null);
  changingStatusId = signal<number | null>(null);
  totalCars = computed(() => this.cars().length);
   

  constructor(
    private listingsService: ListingsService,
    private router: Router
  ) { }

  availableCars = computed(() => {
    return this.cars().filter(car =>
      car.status === 'available' && car.status_badge !== 'booked'
    ).length;
  });

  totalEarnings = computed(() =>
    this.cars().reduce((sum, c) => sum + (c.total_earnings || 0), 0)
  );

  totalTrips = computed(() =>
    this.cars().reduce((sum, c) => sum + (c.total_trips || 0), 0)
  );

  ngOnInit(): void {
    this.fetchCars();
  }

  fetchCars(): void {
    this.loading.set(true);
    this.listingsService.getMyCars().subscribe({
      next: (data) => {
        this.cars.set(data || []);
        console.log('Cars loaded:', this.cars());
      },
      error: (err) => {
        console.error('Failed to load cars:', err);
        this.cars.set([]);
      },
      complete: () => this.loading.set(false)
    });
  }

  view(id: number): void {
    this.router.navigate(['/car', id]);
  }

  edit(id: number): void {
    this.router.navigate(['/owner/edit-car', id]);
  }

  openDeleteModal(car: any): void {
    this.selectedCar.set(car);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedCar.set(null);
  }

  onDeleteCar(): void {
    const car = this.selectedCar();
    if (!car?.id) return;

    this.isDeleting.set(true);
    this.listingsService.deleteCar(car.id).subscribe({
      next: () => {
        this.cars.update(cars => cars.filter(c => c.id !== car.id));
        this.closeDeleteModal();
      },
      error: () => this.isDeleting.set(false)
    });
  }

  changeStatus(carId: number, newStatus: 'available' | 'maintenance' | 'inactive'): void {
    this.changingStatusId.set(carId);

    this.listingsService.toggleStatus(carId, newStatus).subscribe({
      next: (updatedCar) => {
        this.cars.update(cars =>
          cars.map(c => {
            if (c.id === carId) {
              return {
                ...c,
                status: newStatus,
                status_badge: this.getStatusBadgeForStatus(newStatus),
                status_display: this.getStatusDisplayText(newStatus)
              };
            }
            return c;
          })
        );
        this.changingStatusId.set(null);
      },
      error: (err) => {
        console.error('Failed to update status:', err);
        alert('Failed to update status. Please try again.');
        this.changingStatusId.set(null);
      }
    });
  }

  private getStatusBadgeForStatus(status: string): string {
    return status;
  }

  private getStatusDisplayText(status: string): string {
    const statusMap: Record<string, string> = {
      'available': 'Available',
      'maintenance': 'Under Maintenance',
      'inactive': 'Unavailable',
      'booked': 'Booked',
      'recently-returned': 'Returned – Awaiting Check'
    };
    return statusMap[status] || 'Unknown';
  }

  markAsAvailable(id: number): void {
    this.markingId.set(id);
    this.listingsService.markCarAvailable(id).subscribe({
      next: () => {
        this.cars.update(cars =>
          cars.map(c => c.id === id ? {
            ...c,
            status: 'available',
            status_badge: 'available',
            status_display: 'Available'
          } : c)
        );
        this.markingId.set(null);
      },
      error: () => {
        alert('Failed to update status. Please try again.');
        this.markingId.set(null);
      }
    });
  }

  getPrimaryPhoto(car: any): string {
    const primary = car.photos?.find((p: any) => p.is_primary);
    return primary?.image || car.photos?.[0]?.image || '';
  }

  hasPhoto(car: any): boolean {
    return !!this.getPrimaryPhoto(car);
  }

  getStatusBadgeClass(car: any): string {
    return car.status_badge || 'available';
  }

  trackByCarId(index: number, car: any): any {
    return car?.id ?? index;
  }
  
}
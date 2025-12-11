// src/app/car-verification/car-verification.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ListingsService, CarList } from '../services/listings.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-car-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './car-verification.component.html',
  styleUrls: ['./car-verification.component.scss']
})
export class CarVerificationComponent implements OnInit {
  cars = signal<any[]>([]);
  filteredCars = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.cars();
    return this.cars().filter(car =>
      `${car.make} ${car.model}`.toLowerCase().includes(term) ||
      car.license_plate.toLowerCase().includes(term) ||
      (car.owner_name || '').toLowerCase().includes(term)
    );
  });

  searchTerm = signal('');
  loading = signal(true);

  constructor(private listingsService: ListingsService) {}

  ngOnInit(): void {
    this.loadCars();
  }

  loadCars() {
    this.loading.set(true);
    this.listingsService.getAllCars().subscribe({
      next: (data) => {
        this.cars.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filterCars() {
    
  }

  toggleVerify(car: CarList) {
    const newStatus = !car.is_verified;
    this.listingsService.verifyCar(car.id, newStatus).subscribe({
      next: () => {
        car.is_verified = newStatus;
        // Optional: show success toast
      },
      error: () => alert('Failed to update verification')
    });
  }

  getStatusClass(status: string) {
    const map: any = {
      active: 'bg-success',
      inactive: 'bg-secondary',
      maintenance: 'bg-warning text-dark'
    };
    return map[status] || 'bg-secondary';
  }
}
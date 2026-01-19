import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  ManagementAuthService,
  PaginatedCars,
  AdminCar
} from '../services/management-auth.service';

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

  cars: AdminCar[] = [];
  filteredCars: AdminCar[] = [];

  searchTerm = '';
  loading = true;
  loadingMore = false;
  nextPageUrl: string | null = null;
  totalCount = 0;

  constructor(private managementService: ManagementAuthService) {}

  ngOnInit(): void {
    this.loadCars();
  }

  loadCars() {
    this.loading = true;

    this.managementService.getAllCars().subscribe({
      next: (data: PaginatedCars) => {
        this.cars = data.results;
        this.totalCount = data.count;
        this.nextPageUrl = data.next;
        this.applyFilters();
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  loadMore() {
    if (!this.nextPageUrl || this.loadingMore) return;

    this.loadingMore = true;

    this.managementService.getAllCars(this.nextPageUrl).subscribe({
      next: (data: PaginatedCars) => {
        this.cars = [...this.cars, ...data.results];
        this.nextPageUrl = data.next;
        this.applyFilters();
        this.loadingMore = false;
      },
      error: () => (this.loadingMore = false)
    });
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredCars = [...this.cars];
      return;
    }

    this.filteredCars = this.cars.filter(car => {
      const carText = `${car.year} ${car.make} ${car.model}`.toLowerCase();
      const plate = car.license_plate.toLowerCase();
      const owner = car.owner_name.toLowerCase();

      return (
        carText.includes(term) ||
        plate.includes(term) ||
        owner.includes(term)
      );
    });
  }

  search() {
    this.applyFilters();
  }

  toggleVerify(car: AdminCar) {
    this.managementService.verifyCar(car.id, !car.is_verified).subscribe({
      next: (res) => {
        car.is_verified = res.is_verified;
      },
      error: (err) => {
        alert(err.message || 'Failed to update verification status');
      }
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      active: 'bg-success',
      inactive: 'bg-secondary',
      maintenance: 'bg-warning text-dark',
      booked: 'bg-info'
    };
    return map[status] || 'bg-secondary';
  }
}

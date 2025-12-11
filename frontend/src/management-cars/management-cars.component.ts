// src/app/management-cars/management-cars.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ListingsService } from '../services/listings.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-management-cars',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './management-cars.component.html',
  styleUrl: './management-cars.component.scss'
})
export class ManagementCarsComponent implements OnInit {
  cars = signal<any[]>([]);
  loading = signal(true);

  totalCars = computed(() => this.cars().length);
  verifiedCars = computed(() => this.cars().filter(c => c.is_verified).length);
  pendingCars = computed(() => this.cars().filter(c => !c.is_verified).length);

  constructor(private listingsService: ListingsService) {}

  ngOnInit(): void {
    this.loadCars();
  }

  loadCars(): void {
    this.loading.set(true);
    this.listingsService.getAllCars().subscribe({
      next: (data) => {
        this.cars.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
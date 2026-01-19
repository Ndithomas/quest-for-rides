// src/app/management-cars/management-cars.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ManagementAuthService, PaginatedCars } from '../services/management-auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-management-cars',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './management-cars.component.html',
  styleUrls: ['./management-cars.component.scss'] // fixed typo
})
export class ManagementCarsComponent implements OnInit {
  cars = signal<any[]>([]);
  loading = signal(true);
  nextPageUrl = signal<string | null>(null);
  isLoadingMore = signal(false);
  totalCountFromServer = signal(0);

  totalVerifiedCars = signal(0);
  totalPendingCars = signal(0);

  totalCars = computed(() => this.totalCountFromServer());
  verifiedCars = computed(() => this.totalVerifiedCars());
  pendingCars = computed(() => this.totalPendingCars());

  constructor(private managementService: ManagementAuthService) { }

  ngOnInit(): void {
    this.loadCars();
  }

  loadCars(): void {
    this.loading.set(true);
    this.managementService.getAllCars().subscribe({
      next: (data: PaginatedCars) => {
        this.cars.set(data.results);
        this.nextPageUrl.set(data.next);
        this.totalCountFromServer.set(data.count);
        this.totalVerifiedCars.set(data.count);
        this.totalPendingCars.set(0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadMore(): void {
    const nextUrl = this.nextPageUrl();
    if (!nextUrl || this.isLoadingMore()) return;

    this.isLoadingMore.set(true);
    this.managementService.getAllCars(nextUrl).subscribe({
      next: (data: PaginatedCars) => {
        this.cars.update(prev => [...prev, ...data.results]);
        this.nextPageUrl.set(data.next);
        this.totalVerifiedCars.set(this.totalVerifiedCars());
        this.totalPendingCars.set(this.totalPendingCars());
        this.isLoadingMore.set(false);
      },
      error: () => this.isLoadingMore.set(false)
    });
  }
}

// src/app/management-dashboard/management-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ManagementAuthService, AdminUser, AdminCar, PaginatedUsers } from '../services/management-auth.service';
import { BookingService, Booking, PaginatedBookings } from '../services/booking.service';
import { FooterComponent } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-management-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent, NavbarComponent],
  templateUrl: './management-dashboard.component.html',
  styleUrls: ['./management-dashboard.component.scss']
})
export class ManagementDashboardComponent implements OnInit {
  stats: any = {};
  recentUsers: AdminUser[] = [];
  recentCars: AdminCar[] = [];
  recentBookings: Booking[] = [];

  constructor(
    private managementService: ManagementAuthService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData() {
    this.managementService.getStats().subscribe(data => {
      this.stats = data;
    });

    this.bookingService.getBookingStats().subscribe(bookingStats => {
      this.stats = { ...this.stats, ...bookingStats };
    });

    this.managementService.getAllUsers().subscribe((response: PaginatedUsers) => {
      this.recentUsers = response.results
        .sort((a: AdminUser, b: AdminUser) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);
    });

    this.managementService.getAllCars().subscribe((response: any) => {
      const carsArray = response.results || response; 
      this.recentCars = carsArray
        .sort((a: AdminCar, b: AdminCar) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);
    });

    
    this.bookingService.getAllBookings().subscribe((response: PaginatedBookings) => {
      this.recentBookings = response.results
        .sort((a: Booking, b: Booking) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getDaysBetween(start: string, end: string): number {
    const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-CM', { 
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }
}
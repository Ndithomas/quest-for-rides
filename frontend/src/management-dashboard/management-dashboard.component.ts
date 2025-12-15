// src/app/management-dashboard/management-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ManagementAuthService, AdminUser, AdminCar } from '../services/management-auth.service';
import { BookingService, Booking } from '../services/booking.service';
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
    // Get management stats (users, cars)
    this.managementService.getStats().subscribe(data => {
      this.stats = data;
    });

    // Get booking stats
    this.bookingService.getBookingStats().subscribe(bookingStats => {
      // Merge booking stats with existing stats
      this.stats = {
        ...this.stats,
        ...bookingStats
      };
    });

    // Recent Users (latest 6)
    this.managementService.getAllUsers().subscribe(users => {
      this.recentUsers = users
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);
    });

    // Recent Cars (latest 6)
    this.managementService.getAllCars().subscribe(cars => {
      this.recentCars = cars
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);
    });

    this.bookingService.getAllBookings().subscribe(bookings => {
      this.recentBookings = bookings
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  getDaysBetween(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
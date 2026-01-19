import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService, Booking } from '../services/booking.service';
import { PaginatedResponse } from '../services/listings.service'; // Ensure this path is correct
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-management-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './management-bookings.component.html',
  styleUrls: ['./management-bookings.component.scss']
})
export class ManagementBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  totalCount: number = 0;
  isLoading = false;
  isLoadingMore = false;
  nextPageUrl: string | null = null;
  error: string | null = null;
  notification: { message: string, type: 'success' | 'error' | 'info' } | null = null;

  searchTerm = '';
  statusFilter = 'all';
  sortBy = 'newest';

  statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' }
  ];

  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'total_price_desc', label: 'Highest Price' },
    { value: 'total_price_asc', label: 'Lowest Price' }
  ];

  constructor(private bookingService: BookingService) { }

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
  this.isLoading = true;
  this.error = null;

  this.bookingService.getAllBookings().subscribe({
    next: (response: PaginatedResponse<Booking>) => {
      this.bookings = response.results;
      this.nextPageUrl = response.next;
      this.totalCount = response.count; 
      
      this.applyFilters();
      this.isLoading = false;
    },
    error: (err) => {
      this.error = 'Failed to load bookings.';
      this.isLoading = false;
    }
  });
}

  loadMore(): void {
    if (!this.nextPageUrl || this.isLoadingMore) return;

    this.isLoadingMore = true;
    this.bookingService.getAllBookings(this.nextPageUrl).subscribe({
      next: (response: PaginatedResponse<Booking>) => {
        // Append new data to existing bookings
        this.bookings = [...this.bookings, ...response.results];
        this.nextPageUrl = response.next;
        this.applyFilters();
        this.isLoadingMore = false;
      },
      error: () => {
        this.isLoadingMore = false;
        this.showNotification('Failed to load more bookings', 'error');
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.bookings];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(booking =>
        booking.guest?.username?.toLowerCase().includes(term) ||
        booking.car_make?.toLowerCase().includes(term) ||
        booking.id.toString().includes(term)
      );
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === this.statusFilter);
    }

    filtered.sort((a, b) => {
      if (this.sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (this.sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (this.sortBy === 'total_price_desc') return b.total_price - a.total_price;
      if (this.sortBy === 'total_price_asc') return a.total_price - b.total_price;
      return 0;
    });

    this.filteredBookings = filtered;
  }

  // Helper Methods for HTML
  getNotificationIcon(type: 'success' | 'error' | 'info'): string {
    const icons = { success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', info: 'fas fa-info-circle' };
    return icons[type] || icons.info;
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.notification = { message, type };
    setTimeout(() => this.notification = null, 3000);
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-CM', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount);
  }

  refreshBookings(): void {
    this.loadBookings();
  }

  get totalRevenue(): number {
    return this.filteredBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.total_price, 0);
  }

  get pendingBookingsCount(): number {
    return this.filteredBookings.filter(b => b.status === 'pending').length;
  }

  get activeBookingsCount(): number {
    return this.filteredBookings.filter(b => b.status === 'active').length;
  }
}
// src/app/management-bookings/management-bookings.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService, Booking } from '../services/booking.service';
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
  isLoading = false;
  error: string | null = null;
  notification: { message: string, type: 'success' | 'error' | 'info' } | null = null;

  // Filters
  searchTerm = '';
  statusFilter = 'all';
  sortBy = 'newest';

  // Status options
  statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' }
  ];

  // Sort options
  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'total_price_desc', label: 'Highest Price' },
    { value: 'total_price_asc', label: 'Lowest Price' }
  ];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  // ADD THIS METHOD to fix the error
  getNotificationIcon(type: 'success' | 'error' | 'info'): string {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-info-circle';
    }
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = null;
    }, 3000);
  }

  loadBookings(): void {
    this.isLoading = true;
    this.error = null;

    this.bookingService.getAllBookings().subscribe({
      next: (data) => {
        this.bookings = data;
        this.applyFilters();
        this.isLoading = false;
        this.showNotification(`${data.length} bookings loaded`, 'success');
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.error = 'Failed to load bookings. Please try again.';
        this.isLoading = false;
        this.showNotification('Failed to load bookings', 'error');
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.bookings];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(booking =>
        booking.guest?.username?.toLowerCase().includes(term) ||
        booking.guest?.email?.toLowerCase().includes(term) ||
        booking.car_title?.toLowerCase().includes(term) ||
        booking.car_make?.toLowerCase().includes(term) ||
        booking.car_model?.toLowerCase().includes(term) ||
        booking.id.toString().includes(term)
      );
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === this.statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'total_price_desc':
          return b.total_price - a.total_price;
        case 'total_price_asc':
          return a.total_price - b.total_price;
        default:
          return 0;
      }
    });

    this.filteredBookings = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredBookings.length / this.itemsPerPage);
    this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));
  }

  get paginatedBookings(): Booking[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredBookings.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  updateBookingStatus(bookingId: number, status: string): void {
    if (!confirm(`Are you sure you want to change this booking status to "${status}"?`)) {
      return;
    }

    this.bookingService.updateBookingStatus(bookingId, status).subscribe({
      next: (updatedBooking) => {
        // Update the booking in the array
        const index = this.bookings.findIndex(b => b.id === bookingId);
        if (index !== -1) {
          this.bookings[index] = updatedBooking;
        }
        this.applyFilters();
        this.showNotification(`Booking status updated to ${status}`, 'success');
      },
      error: (err) => {
        console.error('Error updating booking status:', err);
        this.showNotification('Failed to update booking status', 'error');
      }
    });
  }

  refreshBookings(): void {
    this.loadBookings();
    this.showNotification('Bookings refreshed', 'info');
  }

  get totalRevenue(): number {
    return this.filteredBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, booking) => sum + booking.total_price, 0);
  }

  get pendingBookingsCount(): number {
    return this.filteredBookings.filter(b => b.status === 'pending').length;
  }

  get activeBookingsCount(): number {
    return this.filteredBookings.filter(b => b.status === 'active').length;
  }

}
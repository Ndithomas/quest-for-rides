import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ManagementAuthService, AdminUser, PaginatedUsers } from '../services/management-auth.service';
import { ManagementUserActionsService } from '../services/management-user-actions.service';
import { FooterComponent } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-management-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FooterComponent, NavbarComponent],
  templateUrl: './management-users.component.html',
  styleUrl: './management-users.component.scss'
})
export class ManagementUsersComponent implements OnInit {
  users: AdminUser[] = [];
  filteredUsers: AdminUser[] = [];
  searchTerm = '';
  loading = true;

  loadingMore = false;
  nextPageUrl: string | null = null;
  totalCount = 0;

  constructor(
    private service: ManagementAuthService,
    private userActions: ManagementUserActionsService
  ) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.service.getAllUsers().subscribe({
      next: (data: PaginatedUsers) => {
        this.users = data.results;
        this.totalCount = data.count;
        this.nextPageUrl = data.next;
        this.applyFilters();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadMore() {
    if (!this.nextPageUrl || this.loadingMore) return;
    this.loadingMore = true;
    this.service.getAllUsers(this.nextPageUrl).subscribe({
      next: (data: PaginatedUsers) => {
        this.users = [...this.users, ...data.results];
        this.nextPageUrl = data.next;
        this.applyFilters();
        this.loadingMore = false;
      },
      error: () => this.loadingMore = false
    });
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredUsers = this.users;
      return;
    }
    this.filteredUsers = this.users.filter(u =>
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(term)
    );
  }

  getInitials(user: AdminUser): string {
    const first = user.first_name ? user.first_name[0] : '';
    const last = user.last_name ? user.last_name[0] : '';
    return (first + last).toUpperCase();
  }

  search() {
    this.applyFilters();
  }

  getRoleBadge(role: string) {
    return {
      guest: 'bg-info',
      owner: 'bg-primary',
      management: 'bg-dark'
    }[role] || 'bg-secondary';
  }

  getStatusBadge(status: string) {
    if (status === 'active') return 'bg-success';
    if (status === 'inactive') return 'bg-danger';
    if (status === 'suspended') return 'bg-warning text-dark';
    return 'bg-secondary';
  }

  toggleUserStatus(user: AdminUser) {
    alert(`Toggle status: ${user.username} (current: ${user.status})`);

  }


}

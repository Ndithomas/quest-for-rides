import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ManagementAuthService, AdminUser } from '../services/management-auth.service';
import { ManagementUserActionsService } from '../services/management-user-actions.service';
import { FooterComponent } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-management-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink,FooterComponent,NavbarComponent],
  templateUrl: './management-users.component.html',
  styleUrl: './management-users.component.scss'
})
export class ManagementUsersComponent implements OnInit {
  users: AdminUser[] = [];
  filteredUsers: AdminUser[] = [];
  searchTerm = '';
  loading = true;

  constructor(
    private service: ManagementAuthService,
    private userActions: ManagementUserActionsService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.service.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  getInitials(user: AdminUser): string {
    const first = user.first_name ? user.first_name[0] : '';
    const last = user.last_name ? user.last_name[0] : '';
    return (first + last).toUpperCase();
  }

  search() {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(term)
    );
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
    // Implement status toggle logic here, e.g. cycle through statuses or provide UI for admin
  }

  changeStatus(user: AdminUser) {
    this.loading = true;
    this.userActions.changeUserStatus(user.id, user.status).subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Failed to update status.');
      }
    });
  }
}

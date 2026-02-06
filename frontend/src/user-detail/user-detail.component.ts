import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ManagementAuthService, AdminUser } from '../services/management-auth.service';
import { ManagementUserActionsService } from '../services/management-user-actions.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { DateFormatPipe } from '../shared/pipes';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent, DateFormatPipe],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
  user: AdminUser | null = null;
  loading = true;
  statusChanging = false;
  selectedStatus: string = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: ManagementAuthService,
    private userActions: ManagementUserActionsService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const userId = +params['id']; // Convert to number
      if (userId) {
        this.loadUserDetail(userId);
      }
    });
  }

  loadUserDetail(userId: number): void {
    this.loading = true;
    this.authService.getUserDetail(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.selectedStatus = user.status;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load user details.';
        this.loading = false;
      }
    });
  }

  changeStatus(): void {
    if (!this.user || this.selectedStatus === this.user.status) return;

    this.statusChanging = true;
    this.userActions.changeUserStatus(this.user.id, this.selectedStatus as 'active' | 'inactive' | 'suspended').subscribe({
      next: () => {
        this.successMessage = 'Status updated successfully.';
        if (this.user) this.user.status = this.selectedStatus as any;
        this.statusChanging = false;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: () => {
        this.errorMessage = 'Failed to update status.';
        this.statusChanging = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-success';
      case 'inactive': return 'bg-danger';
      case 'suspended': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  }

  getRoleBadge(role: string): string {
    const map: Record<string, string> = {
      guest: 'bg-info',
      owner: 'bg-primary',
      management: 'bg-dark'
    };
    return map[role] || 'bg-secondary';
  }

  goBack(): void {
    this.router.navigate(['/management-users']);
  }
}
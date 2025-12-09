// src/app/management-setup/management-setup.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ManagementAuthService } from '../services/management-auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-management-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './management-setup.component.html',
  styleUrls: ['./management-setup.component.scss']
})
export class ManagementSetupComponent {
  user: any = {
    secretCode: '',
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
  };

  loading = false;
  error: string | null = null;
  success = false;

  constructor(
    private managementAuth: ManagementAuthService,
    private router: Router
  ) {}

  onSubmit(form: any): void {
    this.loading = true;
    this.error = null;

    const { secretCode, ...userData } = this.user;
    
    this.managementAuth.createManagementAccount(userData, secretCode).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.success = true;
      },
      error: (err: any) => {
        this.loading = false;
        this.handleErrorResponse(err);
      }
    });
  }

  private handleErrorResponse(err: any): void {
    // Directly use backend error message
    if (err.error?.message) {
      this.error = err.error.message;
    } 
    else if (err.message && !err.message.includes('Http failure response')) {
      this.error = err.message;
    }
    else {
      this.error = 'Management setup failed. Please try again.';
    }

    this.user.password = ''; 
  }

  onInputChange(): void {
    this.error = null;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
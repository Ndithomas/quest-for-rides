import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleRedirectService } from '../services/role-redirect.service';
import { NavbarComponent } from '../navbar/navbar.component';

import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, HttpClientModule, NavbarComponent, RouterLink, FooterComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  user: any = {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: '',
    phone_number: ''
  };

  loading = false;
  error: string | null = null;
  fieldErrors: any = {};
  
  constructor(
    private authService: AuthService,
    private roleRedirect: RoleRedirectService,
    private router: Router
  ) {}

  onSubmit(form: any): void {
    if (form.valid && this.user.role) {
      this.loading = true;
      this.error = null;
      this.fieldErrors = {};

      this.authService.register(this.user).subscribe({
        next: (res: any) => {
          this.loading = false;
          this.roleRedirect.redirectToDashboard();
        },
        error: (err: any) => {
          this.loading = false;
          this.handleErrorResponse(err);
        }
      });
    } else {
      this.markFormFieldsAsTouched(form);
      if (!this.user.role) {
        this.error = 'Please select a role.';
      } else {
        this.error = 'Please fill in all required fields.';
      }
    }
  }

  private handleErrorResponse(err: any): void {
    if (err.error?.message) {
      this.error = err.error.message;
    } 
    else if (err.error?.detail) {
      this.error = err.error.detail;
    }
    else if (err.message && !err.message.includes('Http failure response')) {
      this.error = err.message;
    }
    else {
      this.error = 'Registration failed. Please try again.';
    }

    this.user.password = ''; 
  }

  private markFormFieldsAsTouched(form: any): void {
    Object.keys(form.controls).forEach(key => {
      form.controls[key].markAsTouched();
    });
  }

  onInputChange(): void {
    this.error = null;
    this.fieldErrors = {};
  }
}
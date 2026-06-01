import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleRedirectService } from '../services/role-redirect.service';
import { NavbarComponent } from '../navbar/navbar.component';

import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NavbarComponent, RouterLink, FooterComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  credentials: any = {
    username: '',
    password: ''
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
    if (form.valid) {
      this.loading = true;
      this.error = null;
      this.fieldErrors = {};

      this.authService.login(this.credentials).subscribe({
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
      this.error = 'Please fill in all required fields.';
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
      this.error = 'Login failed. Please try again.';
    }

    this.credentials.password = ''; 
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
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  email: string = '';
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  constructor(private authService: AuthService, private router: Router) {}
  
  onSubmit(form: any): void {
    if (form.valid) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      this.authService.forgotPassword(this.email).subscribe({
        next: (res: any) => {
          this.loading = false;
          this.successMessage = res.message || 'If the email exists, a reset code has been sent';
          this.email = ''; // Clear email after successful submission
        },
        error: (err: any) => {
          this.loading = false;
          this.handleErrorResponse(err);
        }
      });
    } else {
      this.markFormFieldsAsTouched(form);
      this.error = 'Please enter a valid email address.';
    }
  }

  private handleErrorResponse(err: any): void {
    // Use the error message from the service
    this.error = err.message || 'Failed to send reset code. Please try again.';
  }

  private markFormFieldsAsTouched(form: any): void {
    Object.keys(form.controls).forEach(key => {
      form.controls[key].markAsTouched();
    });
  }

  // Clear error when user starts typing
  onInputChange(): void {
    this.error = null;
    this.successMessage = null;
  }
}

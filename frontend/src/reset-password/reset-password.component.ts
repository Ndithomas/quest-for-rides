import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  resetData: any = {
    email: '',
    reset_code: '',
    new_password: '',
    confirm_password: ''
  };
  
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    // Pre-fill email from query params if available
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.resetData.email = params['email'];
      }
    });
  }
  
  onSubmit(form: any): void {
    if (form.valid && this.passwordsMatch()) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      const { confirm_password, ...submitData } = this.resetData;

      this.authService.resetPassword(submitData).subscribe({
        next: (res: any) => {
          this.loading = false;
          this.successMessage = res.message || 'Password reset successfully!';
          
          // Redirect to login after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err: any) => {
          this.loading = false;
          this.handleErrorResponse(err);
        }
      });
    } else {
      this.markFormFieldsAsTouched(form);
      if (!this.passwordsMatch()) {
        this.error = 'Passwords do not match';
      } else {
        this.error = 'Please fill in all required fields.';
      }
    }
  }

  passwordsMatch(): boolean {
    return this.resetData.new_password === this.resetData.confirm_password;
  }

  private handleErrorResponse(err: any): void {
    // Use the error message from the service
    this.error = err.message || 'Failed to reset password. Please try again.';
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
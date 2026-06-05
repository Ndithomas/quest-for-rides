import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { RoleRedirectService } from '../services/role-redirect.service';


describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let roleRedirectService: RoleRedirectService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    // Get instances of services to mock their methods
    authService = TestBed.inject(AuthService);
    roleRedirectService = TestBed.inject(RoleRedirectService);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should redirect to dashboard on successful login', () => {
    // Arrange
    const mockForm = { valid: true };
    component.credentials = { username: 'test', password: 'password' };
    spyOn(authService, 'login').and.returnValue(of({ access: 'token', refresh: 'token' }));
    spyOn(roleRedirectService, 'redirectToDashboard');

    component.onSubmit(mockForm);

    // Assert
    expect(component.loading).toBeFalse();
    expect(roleRedirectService.redirectToDashboard).toHaveBeenCalled();
  });
  it('should handle login error and clear password field', () => {
    // Arrange
    const mockForm = { valid: true };
    const mockError = { error: { message: 'Invalid credentials' } };
    spyOn(authService, 'login').and.returnValue(throwError(() => mockError));

    component.onSubmit(mockForm);

    // Assert
    expect(component.loading).toBeFalse();
    expect(component.error).toEqual('Invalid credentials');
    expect(component.credentials.password).toEqual('');
  });

  it('should show error if form is invalid', () => {
    // Arrange
    const mockForm = { 
      valid: false,
      controls: {
        username: { markAsTouched: jasmine.createSpy() },
        password: { markAsTouched: jasmine.createSpy() }  
      }
    };
    component.onSubmit(mockForm);
    
    // Assert
    expect(component.error).toEqual('Please fill in all required fields.');
    
  });

});

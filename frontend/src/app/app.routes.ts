import { Routes } from '@angular/router';
import { roleAuthGuard } from '../guards/role-auth.guard';
import { HomeComponent } from '../home/home.component';
import { WelcomePageComponent } from '../welcome-page/welcome-page.component';
import { managementSetupGuard } from '../guards/management-setup.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: '', component: WelcomePageComponent },

      {
        path: 'listings',
        loadComponent: () => import('../listings/listings.component')
          .then(m => m.ListingsComponent)
      },
      {
        path: 'car/:id',
        loadComponent: () => import('../car-detail/car-detail.component')
          .then(m => m.CarDetailComponent)
      },

      {
        path: 'login',
        loadComponent: () => import('../login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('../register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('../forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('../reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      },


      {
        path: 'guest-dashboard',
        loadComponent: () => import('../guest-dashboard/guest-dashboard.component').then(m => m.GuestDashboardComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['guest'] }
      },
      {
        path: 'owner-dashboard',
        loadComponent: () => import('../owner-dashboard/owner-dashboard.component').then(m => m.OwnerDashboardComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['owner'] }
      },
      {
        path: 'management-dashboard',
        loadComponent: () => import('../management-dashboard/management-dashboard.component').then(m => m.ManagementDashboardComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['management'] }
      },


      {
        path: 'management/users',
        loadComponent: () => import('../management-users/management-users.component')
          .then(m => m.ManagementUsersComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['management'] }
      },
      {
        path: 'user-detail/:id',
        loadComponent: () => import('../user-detail/user-detail.component')
          .then(m => m.UserDetailComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['management'] }
      },
      {
        path: 'management/cars',
        loadComponent: () => import('../management-cars/management-cars.component')
          .then(m => m.ManagementCarsComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['management'] }
      },
      {
        path: 'management/bookings',
        loadComponent: () => import('../management-bookings/management-bookings.component')
          .then(m => m.ManagementBookingsComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['management'] }
      },
      {
        path: 'verify-cars',
        loadComponent: () => import('../car-verification/car-verification.component')
          .then(m => m.CarVerificationComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['management'] }  // only management can verify cars
      },

      {
        path: 'profile',
        loadComponent: () => import('../profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['guest', 'owner', 'management'] }
      },

      {
        path: 'bookings',
        loadComponent: () => import('../bookings/bookings.component').then(m => m.BookingsComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['guest'] }
      },

      {
        path: 'booking-confirmation/:bookingId',
        loadComponent: () => import('../booking-confirmation/booking-confirmation.component').then(m => m.BookingConfirmationComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['guest'] }
      },


      {
        path: 'owner/add-car',
        loadComponent: () => import('../add-car/add-car.component').then(m => m.AddCarComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['owner'] }
      },
      {
        path: 'owner/cars',
        loadComponent: () => import('../owner-cars/owner-cars.component').then(m => m.OwnerCarsComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['owner'] }
      },
      {
        path: 'owner/edit-car/:id',
        loadComponent: () => import('../edit-owner-cars/edit-owner-cars.component').then(m => m.EditOwnerCarsComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['owner'] }
      },
      {
        path: 'owner/bookings',
        loadComponent: () => import('../owner-bookings/owner-bookings.component').then(m => m.OwnerBookingsComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['owner'] }
      },
      {
        path: 'booking-details/:bookingId',
        loadComponent: () => import('../booking-details/booking-details.component').then(m => m.BookingDetailsComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['management'] }
      },

      {
        path: 'payment-processing/:bookingId',
        loadComponent: () => import('../payment-processing/payment-processing.component')
          .then(m => m.PaymentProcessingComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['guest'] }
      },
      {
        path: 'payment-success/:bookingId',
        loadComponent: () => import('../payment-success/payment-success.component')
          .then(m => m.PaymentSuccessComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['guest'] }
      },
      {
        path: 'payment-management',
        loadComponent: () => import('../payment-management/payment-management.component')
          .then(m => m.PaymentManagementComponent),
        canActivate: [roleAuthGuard],
        data: { roles: ['management'] }
      },
    ],
  },

  {
    path: 'setup-mgmt-v3-9f8e2c7a1b4x2025-internal-only-never-share',
    loadComponent: () => import('../management-setup/management-setup.component')
      .then(m => m.ManagementSetupComponent),
    canActivate: [managementSetupGuard]
  },

  { path: '**', redirectTo: '', pathMatch: 'full' },
];
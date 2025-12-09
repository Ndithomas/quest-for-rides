import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../services/auth.service';
import { RoleRedirectService } from '../services/role-redirect.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private roleRedirect: RoleRedirectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // If user is logged in, redirect to their dashboard
    if (this.authService.isLoggedIn()) {
      this.roleRedirect.redirectToDashboard();
    }
  }
}
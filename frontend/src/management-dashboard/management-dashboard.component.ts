// src/app/management-dashboard/management-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ManagementAuthService, AdminUser, AdminCar } from '../services/management-auth.service';
import { FooterComponent } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-management-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule,FooterComponent,NavbarComponent],
  templateUrl: './management-dashboard.component.html',
  styleUrls: ['./management-dashboard.component.scss']
})
export class ManagementDashboardComponent implements OnInit {
  stats: any = {};
  recentUsers: AdminUser[] = [];
  recentCars: AdminCar[] = [];

  constructor(private service: ManagementAuthService) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData() {
    // Stats
    this.service.getStats().subscribe(data => this.stats = data);

    // Recent Users (latest 6)
    this.service.getAllUsers().subscribe(users => {
      this.recentUsers = users
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);
    });

    // Recent Cars (latest 6)
    this.service.getAllCars().subscribe(cars => {
      this.recentCars = cars
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);
    });
  }
}
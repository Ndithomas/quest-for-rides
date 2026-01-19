import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ListingsService, Car, PaginatedResponse } from '../services/listings.service';



@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [NavbarComponent,FooterComponent,RouterLink, CommonModule],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.scss']
})
export class OwnerDashboardComponent implements OnInit {
cars: Car[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(private listingsService: ListingsService) {}

  ngOnInit(): void {
    this.loadOwnerCars(); 
  }

  loadOwnerCars(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // 2. Change the type in subscribe and access .results
    this.listingsService.getMyCars().subscribe({
      next: (data: PaginatedResponse<Car>) => {
        // Look inside 'data.results' to find the actual array of cars
        this.cars = data.results; 
        this.isLoading = false;
        console.log('Total number of cars loaded on this page:', this.cars.length); 
      },
      error: (err: Error) => {
        this.errorMessage = `Failed to load car count: ${err.message}`;
        this.isLoading = false;
        console.error(this.errorMessage, err);
      }
    });
  }
}

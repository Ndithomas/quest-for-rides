import { Injectable } from '@angular/core';
import { HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { ApiService } from './api.service';

export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  title: string;
  description: string;
  features: string[];
  location_name: string;
  daily_rate: number;
  owner: number;
  owner_name: string;
  status: 'available' | 'booked' | 'maintenance' | 'inactive';
  created_at: string;
  updated_at: string;

  is_verified: boolean;
}

export interface CarPhoto {
  id: number;
  image: string;
  is_primary: boolean;
  created_at: string;
}

export interface PricingRule {
  id: number;
  period: string;
  period_display: string;
  price: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface Availability {
  date: string;
  is_available: boolean;
}

export interface CarCreate {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  title: string;
  description: string;
  features: string[];
  location_name: string;
  daily_rate: number;
}

export interface CarList {
  id: number;
  title: string;
  make: string;
  model: string;
  year: number;
  daily_rate: number;
  location_name: string;
  primary_photo: string | null;
  photos: CarPhoto[];
  owner_name: string;
  is_verified: boolean;
  status_display: 'Available' | 'Booked' | 'Under Maintenance' | 'Unavailable';
  status_badge: 'available' | 'booked' | 'maintenance' | 'inactive';
  license_plate: string;
  status: 'available' | 'booked' | 'maintenance' | 'inactive';
}

export interface CarDetail extends Car {
  photos: CarPhoto[];
  pricing_rules: PricingRule[];
  status_display: string;
  status_badge: string;
}

export interface PaginatedResponse<T> {
  count: number;    // Total number of items (Total Vehicles)
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ListingsService {
  private basePath = '/api/listings';
  constructor(private api: ApiService) { }

  search(filters: any = {}, page: number = 1) {
    let params = new HttpParams().set('page', page);

    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.api.get<PaginatedResponse<CarList>>(`${this.basePath}/search/`, params).pipe(catchError(this.handleError));
  }

  getMyCars(url?: string): Observable<PaginatedResponse<Car>> {
    const requestUrl = url ? url : `${this.basePath}/cars/`;
    return this.api.get<PaginatedResponse<Car>>(requestUrl).pipe(catchError(this.handleError));
  }

  createCar(formData: FormData): Observable<Car> {
    return this.api.post<Car>(`${this.basePath}/cars/`, formData).pipe(catchError(this.handleError));
  }

  getCar(id: number): Observable<CarDetail> {
    return this.api.get<CarDetail>(`${this.basePath}/cars/${id}/`).pipe(catchError(this.handleError));
  }

  updateCar(id: number, data: any): Observable<Car> {
    return this.api.put<Car>(`${this.basePath}/owner/cars/${id}/`, data)
      .pipe(catchError(this.handleError));
  }

  patchCar(id: number, data: any): Observable<Car> {
    return this.api.patch<Car>(`${this.basePath}/owner/cars/${id}/`, data)
      .pipe(catchError(this.handleError));
  }

  deleteCar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/owner/cars/${id}/`)
      .pipe(catchError(this.handleError));
  }

  uploadPhotos(carId: number, files: File[]): Observable<CarPhoto[]> {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    return this.api.post<CarPhoto[]>(`${this.basePath}/cars/${carId}/photos/`, formData)
      .pipe(catchError(this.handleError));
  }

  setPrimaryPhoto(photoId: number): Observable<CarPhoto> {
    return this.api.patch<CarPhoto>(`${this.basePath}/photos/${photoId}/set-primary/`, {})
      .pipe(catchError(this.handleError));
  }

  deletePhoto(photoId: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/photos/${photoId}/`)
      .pipe(catchError(this.handleError));
  }

  getAvailability(carId: number): Observable<Availability[]> {
    return this.api.get<Availability[]>(`${this.basePath}/cars/${carId}/availability/`).pipe(catchError(this.handleError));
  }

  setAvailability(carId: number, dates: any[]): Observable<Availability[]> {
    return this.api.post<Availability[]>(`${this.basePath}/cars/${carId}/availability/`, { dates })
      .pipe(catchError(this.handleError));
  }

  getPricing(carId: number): Observable<PricingRule[]> {
    return this.api.get<PricingRule[]>(`${this.basePath}/cars/${carId}/pricing/`).pipe(catchError(this.handleError));
  }

  addPricingRule(carId: number, rule: any): Observable<PricingRule> {
    return this.api.post<PricingRule>(`${this.basePath}/cars/${carId}/pricing/`, rule)
      .pipe(catchError(this.handleError));
  }


  toggleStatus(carId: number, status: 'available' | 'maintenance' | 'inactive'): Observable<Car> {
    return this.api.patch<Car>(`${this.basePath}/cars/${carId}/toggle-status/`, { status })
      .pipe(catchError(this.handleError));
  }

  getAllCars(): Observable<CarList[]> {
    return this.api.get<CarList[]>(`${this.basePath}/cars/all/`)
      .pipe(catchError(this.handleError));
  }

  isCarCurrentlyBooked(car: CarList | CarDetail): boolean {
    return car.status_badge === 'booked' || car.status === 'booked';
  }

  markCarAvailable(id: number): Observable<any> {
    return this.api.post(`${this.basePath}/cars/${id}/mark-available/`, {})
      .pipe(catchError(this.handleError));
  }

  getCarStatusDisplay(car: CarList | CarDetail): string {
    if (this.isCarCurrentlyBooked(car)) {
      return 'Booked';
    }

    const statusMap: Record<string, string> = {
      'available': 'Available',
      'booked': 'Booked',
      'maintenance': 'Under Maintenance',
      'inactive': 'Unavailable'
    };

    return statusMap[car.status] || 'Unavailable';
  }

  private handleError(error: any) {
    console.error('Listings Service Error:', error);

    let errorMessage = 'An error occurred';
    if (error instanceof HttpErrorResponse) {
      if (error.error && error.error.detail) {
        errorMessage = error.error.detail;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.status === 0) {
        errorMessage = 'Network error: Please check your connection';
      } else {
        errorMessage = `Error ${error.status}: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return throwError(() => new Error(errorMessage));
  }
}
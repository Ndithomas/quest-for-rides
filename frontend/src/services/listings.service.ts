import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

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
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
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
}

export interface CarDetail extends Car {
  photos: CarPhoto[];
  pricing_rules: PricingRule[];
}

@Injectable({
  providedIn: 'root'
})
export class ListingsService {
  private apiUrl = `${environment.apiBaseUrl}/api/listings`;
  constructor(private http: HttpClient) {}

  // Public: Search all active cars (guests OK)
  search(filters: any = {}): Observable<CarList[]> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '' && value !== false) {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<CarList[]>(`${this.apiUrl}/search/`, { params })
      .pipe(catchError(this.handleError));
  }

  // Owner: Get my cars
  getMyCars(): Observable<Car[]> {
    return this.http.get<Car[]>(`${this.apiUrl}/cars/`).pipe(catchError(this.handleError));
  }

  createCar(formData: FormData): Observable<Car> {
    return this.http.post<Car>(`${this.apiUrl}/cars/`, formData).pipe(catchError(this.handleError));
  }

  getCar(id: number): Observable<CarDetail> {
    return this.http.get<CarDetail>(`${this.apiUrl}/cars/${id}/`).pipe(catchError(this.handleError));
  }

  

updateCar(id: number, data: any): Observable<Car> {
  // Use /owner/cars/ for updates
  return this.http.put<Car>(`${this.apiUrl}/owner/cars/${id}/`, data)
    .pipe(catchError(this.handleError));
}

patchCar(id: number, data: any): Observable<Car> {
  return this.http.patch<Car>(`${this.apiUrl}/owner/cars/${id}/`, data)
    .pipe(catchError(this.handleError));
}

deleteCar(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/owner/cars/${id}/`)
    .pipe(catchError(this.handleError));
}


  // Photo management - UPDATED to match backend
  uploadPhotos(carId: number, files: File[]): Observable<CarPhoto[]> {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    return this.http.post<CarPhoto[]>(`${this.apiUrl}/cars/${carId}/photos/`, formData)
      .pipe(catchError(this.handleError));
  }

  setPrimaryPhoto(photoId: number): Observable<CarPhoto> {
    return this.http.patch<CarPhoto>(`${this.apiUrl}/photos/${photoId}/set-primary/`, {})
      .pipe(catchError(this.handleError));
  }

  deletePhoto(photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/photos/${photoId}/`)
      .pipe(catchError(this.handleError));
  }

  // Availability
  getAvailability(carId: number): Observable<Availability[]> {
    return this.http.get<Availability[]>(`${this.apiUrl}/cars/${carId}/availability/`).pipe(catchError(this.handleError));
  }

  setAvailability(carId: number, dates: any[]): Observable<Availability[]> {
    return this.http.post<Availability[]>(`${this.apiUrl}/cars/${carId}/availability/`, { dates })
      .pipe(catchError(this.handleError));
  }

  // Pricing
  getPricing(carId: number): Observable<PricingRule[]> {
    return this.http.get<PricingRule[]>(`${this.apiUrl}/cars/${carId}/pricing/`).pipe(catchError(this.handleError));
  }

  addPricingRule(carId: number, rule: any): Observable<PricingRule> {
    return this.http.post<PricingRule>(`${this.apiUrl}/cars/${carId}/pricing/`, rule)
      .pipe(catchError(this.handleError));
  }

  // Status
  toggleStatus(carId: number, status: 'active' | 'inactive' | 'maintenance'): Observable<Car> {
    return this.http.patch<Car>(`${this.apiUrl}/cars/${carId}/toggle-status/`, { status })
      .pipe(catchError(this.handleError));
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
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Reviewer {
  id: number;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
}

export interface Review {
  id: number;
  booking: number;
  car?: number;
  car_title?: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  reviewer?: Reviewer | null;
}

export interface ReviewCreate {
  booking_id: number;
  rating: number;
  comment?: string;
}

export interface PaginatedReviews {
  count: number;
  next: string | null;
  previous: string | null;
  results: Review[];
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private basePath = '/api/reviews';

  constructor(private api: ApiService) { }

  createReview(review: ReviewCreate): Observable<Review> {
    return this.api.post<Review>(`${this.basePath}/`, review);
  }

  getReview(id: number): Observable<Review> {
    return this.api.get<Review>(`${this.basePath}/${id}/`);
  }

  getMyReviews(): Observable<Review[]> {
    return this.api.get<PaginatedReviews>(`${this.basePath}/my-reviews/`).pipe(
      map(response => response.results || [])
    );
  }

  getCarReviews(carId: number): Observable<Review[]> {
    return this.api.get<PaginatedReviews>(`${this.basePath}/cars/${carId}/`).pipe(
      map(response => response.results || [])
    );
  }

  deleteReview(id: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}/`);
  }
}


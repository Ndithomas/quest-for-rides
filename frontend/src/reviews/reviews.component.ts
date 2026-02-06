import { Component, OnInit, Input, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReviewService, Review } from '../services/review.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { DateFormatPipe } from '../shared/pipes';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, RouterLink, DateFormatPipe],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']
})
export class ReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private route = inject(ActivatedRoute);

  reviews = signal<Review[]>([]);
  loading = signal(true);
  error = signal('');
  @Input() carId: number | null = null;
  @Input() embedded: boolean = false;

  averageRating = computed(() => {
    const revs = this.reviews();
    if (revs.length === 0) return 0;
    const sum = revs.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = sum / revs.length;
    // Detect if ratings are on a 10-point scale and normalize to 5-point scale
    const maxRating = revs.reduce((m, r) => Math.max(m, r.rating || 0), 0);
    const normalized = maxRating > 5 ? (avg / 2) : avg;
    return Math.round(normalized * 10) / 10;
  });

  roundRating = computed(() => Math.round(this.averageRating()));

  ngOnInit(): void {
    // If `carId` provided as @Input (embedded usage), prefer it.
    if (this.carId) {
      this.loadCarReviews();
      return;
    }

    const carIdParam = this.route.snapshot.paramMap.get('carId');
    if (carIdParam) {
      this.carId = Number(carIdParam);
      this.loadCarReviews();
    } else {
      this.loadMyReviews();
    }
  }

  loadMyReviews(): void {
    this.loading.set(true);
    this.reviewService.getMyReviews().subscribe({
      next: (reviews: Review[]) => {
        this.reviews.set(reviews);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err.error?.detail || 'Failed to load reviews');
        this.loading.set(false);
      }
    });
  }

  loadCarReviews(): void {
    if (!this.carId) return;
    this.loading.set(true);
    this.reviewService.getCarReviews(this.carId).subscribe({
      next: (reviews: Review[]) => {
        this.reviews.set(reviews);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err.error?.detail || 'Failed to load reviews');
        this.loading.set(false);
      }
    });
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}


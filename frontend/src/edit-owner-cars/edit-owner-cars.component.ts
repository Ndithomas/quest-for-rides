// src/app/edit-car/edit-owner-cars.component.ts
import { Component, OnDestroy, OnInit, signal } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingsService } from '../services/listings.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-edit-owner-cars',
  standalone: true,
  imports: [FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './edit-owner-cars.component.html',
  styleUrls: ['./edit-owner-cars.component.scss']
})
export class EditOwnerCarsComponent implements OnInit, OnDestroy {

  carId = signal<number | null>(null);

  make = signal('');
  model = signal('');
  year = signal<number | null>(null);
  licensePlate = signal('');
  title = signal('');
  description = signal('');
  features = signal('');
  locationName = signal('');
  dailyRate = signal<number | null>(null);
  status = signal<'active' | 'inactive' | 'maintenance' | 'booked'>('active');

  existingPhotos = signal<any[]>([]);
  selectedFiles: File[] = [];
  previewUrls = signal<string[]>([]);

  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  maxYear = new Date().getFullYear() + 1;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private listingsService: ListingsService
  ) { }

  ngOnInit(): void {
    this.loading.set(false);
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.carId.set(Number(id));
    this.loadCar();
  }

  loadCar(): void {
    if (!this.carId()) return;

    this.loading.set(true);

    this.listingsService.getCar(this.carId()!).subscribe({
      next: (car: any) => {
        this.make.set(car.make || '');
        this.model.set(car.model || '');
        this.year.set(car.year || null);
        this.licensePlate.set(car.license_plate || '');
        this.title.set(car.title || '');
        this.description.set(car.description || '');
        this.features.set(Array.isArray(car.features) ? car.features.join('\n') : '');
        this.locationName.set(car.location_name || '');
        this.dailyRate.set(car.daily_rate || null);
        this.status.set(car.status || 'active');
        this.existingPhotos.set(car.photos || []);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load car');
        this.loading.set(false);
      }
    });
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    const total = this.existingPhotos().length + this.selectedFiles.length;
    const remaining = 6 - total;

    if (files.length > remaining) {
      this.errorMessage.set(`You can only add ${remaining} more photo(s)`);
      return;
    }

    for (let i = 0; i < files.length && this.selectedFiles.length < remaining; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        this.selectedFiles.push(file);
        const url = URL.createObjectURL(file);
        this.previewUrls.update(urls => [...urls, url]);
      }
    }

    event.target.value = '';
  }

  removeNewPhoto(index: number): void {
    URL.revokeObjectURL(this.previewUrls()[index]);
    this.previewUrls.update(urls => urls.filter((_, i) => i !== index));
    this.selectedFiles.splice(index, 1);
  }

  removeExistingPhoto(photoId: number): void {
    if (!confirm('Delete this photo permanently?')) return;

    this.listingsService.deletePhoto(photoId).subscribe({
      next: () => {
        this.existingPhotos.update(p => p.filter(x => x.id !== photoId));
      },
      error: () => alert('Failed to delete photo')
    });
  }

  setPrimaryPhoto(photoId: number): void {
    this.listingsService.setPrimaryPhoto(photoId).subscribe({
      next: () => {
        this.existingPhotos.update(photos =>
          photos.map(p => ({ ...p, is_primary: p.id === photoId }))
        );
      },
      error: () => alert('Failed to set primary photo')
    });
  }

  getPreviewUrl(file: File): string {
    const index = this.selectedFiles.indexOf(file);
    return this.previewUrls()[index] || '';
  }

  submit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const yearVal = this.year();
    const rateVal = this.dailyRate();

    if (!this.make()?.trim()) return this.errorMessage.set('Make is required');
    if (!this.model()?.trim()) return this.errorMessage.set('Model is required');
    if (!yearVal || yearVal < 1900 || yearVal > this.maxYear)
      return this.errorMessage.set('Valid year required');
    if (!this.licensePlate()?.trim()) return this.errorMessage.set('License plate required');
    if (!this.title()?.trim()) return this.errorMessage.set('Title required');
    if (!this.locationName()?.trim()) return this.errorMessage.set('Location required');
    if (!rateVal || rateVal <= 0) return this.errorMessage.set('Daily rate must be > 0');

    this.loading.set(true);

    // Use FormData instead of JSON to match your working add-car component
    const formData = new FormData();
    formData.append('title', this.title().trim());
    formData.append('make', this.make().trim());
    formData.append('model', this.model().trim());
    formData.append('year', yearVal.toString());
    formData.append('daily_rate', rateVal.toString());
    formData.append('license_plate', this.licensePlate().trim().toUpperCase());
    formData.append('location_name', this.locationName().trim());
    formData.append('status', this.status());

    if (this.description().trim()) formData.append('description', this.description().trim());
    if (this.features().trim()) formData.append('features', this.features().trim());

    this.listingsService.updateCar(this.carId()!, formData).subscribe({
      next: (car: any) => {
        if (this.selectedFiles.length > 0) {
          this.uploadNewPhotos();
        } else {
          this.finishSuccess();
        }
      },
      error: (err) => {
        this.handleError(err);
        this.loading.set(false);
      }
    });
  }

  private uploadNewPhotos(): void {
    this.listingsService.uploadPhotos(this.carId()!, this.selectedFiles).subscribe({
      next: () => this.finishSuccess(),
      error: () => {
        this.successMessage.set('Car updated! New photos failed to upload.');
        setTimeout(() => this.router.navigate(['/owner/cars']), 2000);
      }
    });
  }

  private finishSuccess(): void {
    this.successMessage.set('Car updated successfully!');
    setTimeout(() => this.router.navigate(['/owner/cars']), 1500);
  }

  private handleError(err: any): void {
    let msg = 'Failed to update car';
    if (err.error) {
      if (typeof err.error === 'string') msg = err.error;
      else if (err.error.detail) msg = err.error.detail;
      else if (typeof err.error === 'object') {
        const errors = Object.values(err.error).flat();
        msg = errors.join(' • ');
      }
    }
    this.errorMessage.set(msg);
  }

  ngOnDestroy(): void {
    this.previewUrls().forEach(url => URL.revokeObjectURL(url));
  }
}
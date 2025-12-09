import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ListingsService } from '../services/listings.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-add-car',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './add-car.component.html',
  styleUrls: ['./add-car.component.scss']
})
export class AddCarComponent implements OnDestroy {
  make = signal('');
  model = signal('');
  year = signal<number | null>(null);
  licensePlate = signal('');
  title = signal('');
  description = signal('');
  features = signal('');
  locationName = signal('');
  dailyRate = signal<number | null>(null);

  selectedFiles: File[] = [];
  previewUrls = signal<string[]>([]);

  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private listingsService: ListingsService,
    private router: Router
  ) {}

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    const remaining = 6 - this.selectedFiles.length;

    if (files.length > remaining) {
      this.errorMessage.set(`You can only add ${remaining} more photo(s)`);
      return;
    }

    for (let i = 0; i < files.length && this.selectedFiles.length < 6; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        this.selectedFiles.push(file);
        const url = URL.createObjectURL(file);
        this.previewUrls.update(urls => [...urls, url]);
      }
    }
    event.target.value = '';
  }

  removePhoto(index: number): void {
    URL.revokeObjectURL(this.previewUrls()[index]);
    this.previewUrls.update(urls => urls.filter((_, i) => i !== index));
    this.selectedFiles.splice(index, 1);
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
    if (!yearVal || yearVal < 1900 || yearVal > 2030) return this.errorMessage.set('Valid year required');
    if (!this.licensePlate()?.trim()) return this.errorMessage.set('License plate required');
    if (!this.title()?.trim()) return this.errorMessage.set('Title is required');
    if (!this.locationName()?.trim()) return this.errorMessage.set('Location is required');
    if (!rateVal || rateVal <= 0) return this.errorMessage.set('Daily rate must be > 0');
    if (this.selectedFiles.length === 0) return this.errorMessage.set('At least 1 car photo is required');

    this.loading.set(true);

    const formData = new FormData();
    formData.append('make', this.make().trim());
    formData.append('model', this.model().trim());
    formData.append('year', yearVal.toString());
    formData.append('license_plate', this.licensePlate().trim().toUpperCase());
    formData.append('title', this.title().trim());
    formData.append('location_name', this.locationName().trim());
    formData.append('daily_rate', rateVal.toString());

    if (this.description().trim()) formData.append('description', this.description().trim());
    if (this.features().trim()) formData.append('features', this.features().trim());

    // Add photos to the same FormData if backend supports it
    for (let i = 0; i < this.selectedFiles.length; i++) {
      formData.append('photos', this.selectedFiles[i]);
    }

    this.listingsService.createCar(formData).subscribe({
      next: (response: any) => {
        // Handle different response formats
        const carId = response.id || response.car?.id || response.data?.id;
        
        if (carId && this.selectedFiles.length > 0) {
          // Try to upload photos separately if not included in initial request
          this.uploadPhotosSeparately(carId);
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

  uploadPhotosSeparately(carId: number): void {
    if (this.selectedFiles.length === 0) {
      this.finishSuccess();
      return;
    }

    this.listingsService.uploadPhotos(carId, this.selectedFiles).subscribe({
      next: () => {
        this.finishSuccess();
      },
      error: (err) => {
        console.error('Photo upload failed:', err);
        this.successMessage.set('Car added successfully! Photos failed to upload – you can add them later.');
        setTimeout(() => this.router.navigate(['/owner/cars']), 2000);
      }
    });
  }

  finishSuccess(): void {
    this.successMessage.set('Car added successfully!');
    this.loading.set(false);
    setTimeout(() => this.router.navigate(['/owner/cars']), 1500);
  }

  handleError(err: any): void {
    console.error('Error:', err);
    let msg = 'Failed to add car';
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

  clearForm(): void {
    this.previewUrls().forEach(url => URL.revokeObjectURL(url));
    this.previewUrls.set([]);
    this.selectedFiles = [];
    this.make.set(''); 
    this.model.set(''); 
    this.year.set(null);
    this.licensePlate.set(''); 
    this.title.set(''); 
    this.description.set('');
    this.features.set(''); 
    this.locationName.set(''); 
    this.dailyRate.set(null);
    this.errorMessage.set(''); 
    this.successMessage.set('');
  }

  ngOnDestroy(): void {
    this.previewUrls().forEach(url => URL.revokeObjectURL(url));
  }
}
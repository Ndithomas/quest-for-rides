import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-car',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-car.component.html',
  styleUrls: ['./delete-car.component.scss']
})
export class DeleteCarComponent {
  @Input() car: any = null;
  @Input() deleting: boolean = false;

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  carTitle = computed(() => {
    if (!this.car) return 'Unknown Car';
    return `${this.car.year || ''} ${this.car.make || ''} ${this.car.model || ''}`.trim();
  });

  licensePlate = computed(() => this.car?.license_plate || '—');

  primaryPhoto = computed(() => {
    if (!this.car?.photos?.length) return null;
    const primary = this.car.photos.find((p: any) => p.is_primary);
    return primary?.image || this.car.photos[0]?.image || null;
  });
}

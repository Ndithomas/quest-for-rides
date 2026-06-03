import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { ManagementBookingsComponent } from './management-bookings.component';

describe('ManagementBookingsComponent', () => {
  let component: ManagementBookingsComponent;
  let fixture: ComponentFixture<ManagementBookingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementBookingsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

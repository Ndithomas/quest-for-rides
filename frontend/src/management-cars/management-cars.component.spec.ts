import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { ManagementCarsComponent } from './management-cars.component';

describe('ManagementCarsComponent', () => {
  let component: ManagementCarsComponent;
  let fixture: ComponentFixture<ManagementCarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementCarsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementCarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

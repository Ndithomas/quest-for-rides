import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CarVerificationComponent } from './car-verification.component';

describe('CarVerificationComponent', () => {
  let component: CarVerificationComponent;
  let fixture: ComponentFixture<CarVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarVerificationComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
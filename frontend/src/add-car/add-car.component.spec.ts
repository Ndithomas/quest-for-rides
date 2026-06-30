import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AddCarComponent } from './add-car.component';

describe('AddCarComponent', () => {
  let component: AddCarComponent;
  let fixture: ComponentFixture<AddCarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AddCarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should clear the form', () => {
    component.make.set('Toyota');
    component.model.set('Corolla');
    component.year.set(2022);
    component.licensePlate.set('ABC123');
    component.title.set('Nice Car');
    component.locationName.set('Pretoria');
    component.dailyRate.set(500);

    component.clearForm();

    expect(component.make()).toBe('');
    expect(component.model()).toBe('');
    expect(component.year()).toBeNull();
    expect(component.licensePlate()).toBe('');
    expect(component.title()).toBe('');
    expect(component.locationName()).toBe('');
    expect(component.dailyRate()).toBeNull();
  });

  it('should show an error if make is missing', () => {
    component.submit();

    expect(component.errorMessage()).toBe('Make is required');
  });
});

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
});

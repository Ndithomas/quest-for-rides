import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { OwnerCarsComponent } from './owner-cars.component';

describe('OwnerCarsComponent', () => {
  let component: OwnerCarsComponent;
  let fixture: ComponentFixture<OwnerCarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerCarsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerCarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

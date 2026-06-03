import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { OwnerEarningsComponent } from './owner-earnings.component';

describe('OwnerEarningsComponent', () => {
  let component: OwnerEarningsComponent;
  let fixture: ComponentFixture<OwnerEarningsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerEarningsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerEarningsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { PayoutManagementComponent } from './payout-management.component';

describe('PayoutManagementComponent', () => {
  let component: PayoutManagementComponent;
  let fixture: ComponentFixture<PayoutManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayoutManagementComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayoutManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

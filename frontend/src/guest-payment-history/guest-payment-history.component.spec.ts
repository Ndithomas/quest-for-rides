import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { GuestPaymentHistoryComponent } from './guest-payment-history.component';

describe('GuestPaymentHistoryComponent', () => {
  let component: GuestPaymentHistoryComponent;
  let fixture: ComponentFixture<GuestPaymentHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestPaymentHistoryComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestPaymentHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

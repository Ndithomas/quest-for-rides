import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestPaymentHistoryComponent } from './guest-payment-history.component';

describe('GuestPaymentHistoryComponent', () => {
  let component: GuestPaymentHistoryComponent;
  let fixture: ComponentFixture<GuestPaymentHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestPaymentHistoryComponent]
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

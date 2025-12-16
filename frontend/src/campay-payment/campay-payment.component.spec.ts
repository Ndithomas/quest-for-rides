import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampayPaymentComponent } from './campay-payment.component';

describe('CampayPaymentComponent', () => {
  let component: CampayPaymentComponent;
  let fixture: ComponentFixture<CampayPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampayPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CampayPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CampayPaymentComponent } from './campay-payment.component';

describe('CampayPaymentComponent', () => {
  let component: CampayPaymentComponent;
  let fixture: ComponentFixture<CampayPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampayPaymentComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
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

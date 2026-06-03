import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { OwnerPaymentsComponent } from './owner-payments.component';

describe('OwnerPaymentsComponent', () => {
  let component: OwnerPaymentsComponent;
  let fixture: ComponentFixture<OwnerPaymentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerPaymentsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerPaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

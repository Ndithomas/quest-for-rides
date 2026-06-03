import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { RefundManagementComponent } from './refund-management.component';

describe('RefundManagementComponent', () => {
  let component: RefundManagementComponent;
  let fixture: ComponentFixture<RefundManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ RefundManagementComponent ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

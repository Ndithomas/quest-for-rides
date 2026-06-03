import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { OwnerPayoutsComponent } from './owner-payouts.component';

describe('OwnerPayoutsComponent', () => {
  let component: OwnerPayoutsComponent;
  let fixture: ComponentFixture<OwnerPayoutsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerPayoutsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerPayoutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

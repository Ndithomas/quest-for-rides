import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { GuestDashboardComponent } from './guest-dashboard.component';

describe('GuestDashboardComponent', () => {
  let component: GuestDashboardComponent;
  let fixture: ComponentFixture<GuestDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestDashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

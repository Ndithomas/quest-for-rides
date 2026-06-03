import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { PlatformEarningsComponent } from './platform-earnings.component';

describe('PlatformEarningsComponent', () => {
  let component: PlatformEarningsComponent;
  let fixture: ComponentFixture<PlatformEarningsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ PlatformEarningsComponent ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlatformEarningsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

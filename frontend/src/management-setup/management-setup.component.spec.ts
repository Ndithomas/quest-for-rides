import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { ManagementSetupComponent } from './management-setup.component';

describe('ManagementSetupComponent', () => {
  let component: ManagementSetupComponent;
  let fixture: ComponentFixture<ManagementSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementSetupComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

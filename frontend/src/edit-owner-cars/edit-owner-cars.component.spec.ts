import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { EditOwnerCarsComponent } from './edit-owner-cars.component';

describe('EditOwnerCarsComponent', () => {
  let component: EditOwnerCarsComponent;
  let fixture: ComponentFixture<EditOwnerCarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditOwnerCarsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EditOwnerCarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

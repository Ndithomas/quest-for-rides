import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarVerificationComponent } from './car-verification.component';

describe('CarVerificationComponent', () => {
  let component: CarVerificationComponent;
  let fixture: ComponentFixture<CarVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarVerificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

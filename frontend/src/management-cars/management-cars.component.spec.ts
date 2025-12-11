import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementCarsComponent } from './management-cars.component';

describe('ManagementCarsComponent', () => {
  let component: ManagementCarsComponent;
  let fixture: ComponentFixture<ManagementCarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementCarsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementCarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

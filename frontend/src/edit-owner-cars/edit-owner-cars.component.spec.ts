import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditOwnerCarsComponent } from './edit-owner-cars.component';

describe('EditOwnerCarsComponent', () => {
  let component: EditOwnerCarsComponent;
  let fixture: ComponentFixture<EditOwnerCarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditOwnerCarsComponent]
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

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementSetupComponent } from './management-setup.component';

describe('ManagementSetupComponent', () => {
  let component: ManagementSetupComponent;
  let fixture: ComponentFixture<ManagementSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementSetupComponent]
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

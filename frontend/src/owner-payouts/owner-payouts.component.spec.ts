import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerPayoutsComponent } from './owner-payouts.component';

describe('OwnerPayoutsComponent', () => {
  let component: OwnerPayoutsComponent;
  let fixture: ComponentFixture<OwnerPayoutsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerPayoutsComponent]
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

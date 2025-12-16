import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerPaymentsComponent } from './owner-payments.component';

describe('OwnerPaymentsComponent', () => {
  let component: OwnerPaymentsComponent;
  let fixture: ComponentFixture<OwnerPaymentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerPaymentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerPaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

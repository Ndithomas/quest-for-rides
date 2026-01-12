import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformEarningsComponent } from './platform-earnings.component';

describe('PlatformEarningsComponent', () => {
  let component: PlatformEarningsComponent;
  let fixture: ComponentFixture<PlatformEarningsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ PlatformEarningsComponent ]
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

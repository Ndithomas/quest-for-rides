import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { ManagementUsersComponent } from './management-users.component';

describe('ManagementUsersComponent', () => {
  let component: ManagementUsersComponent;
  let fixture: ComponentFixture<ManagementUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementUsersComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

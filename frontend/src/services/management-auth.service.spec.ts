import { TestBed } from '@angular/core/testing';

import { ManagementAuthService } from './management-auth.service';

describe('ManagementAuthService', () => {
  let service: ManagementAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManagementAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

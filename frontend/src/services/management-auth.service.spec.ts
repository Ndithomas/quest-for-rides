import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ManagementAuthService } from './management-auth.service';

describe('ManagementAuthService', () => {
  let service: ManagementAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting()
    ]
  });
    service = TestBed.inject(ManagementAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

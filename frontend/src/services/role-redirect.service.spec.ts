import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RoleRedirectService } from './role-redirect.service';

describe('RoleRedirectService', () => {
  let service: RoleRedirectService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting()
    ]
  });
    service = TestBed.inject(RoleRedirectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

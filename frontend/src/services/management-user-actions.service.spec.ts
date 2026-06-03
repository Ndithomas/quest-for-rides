import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ManagementUserActionsService } from './management-user-actions.service';

describe('ManagementUserActionsService', () => {
  let service: ManagementUserActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting()
    ]
  });
    service = TestBed.inject(ManagementUserActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

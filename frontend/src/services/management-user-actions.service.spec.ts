import { TestBed } from '@angular/core/testing';

import { ManagementUserActionsService } from './management-user-actions.service';

describe('ManagementUserActionsService', () => {
  let service: ManagementUserActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManagementUserActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

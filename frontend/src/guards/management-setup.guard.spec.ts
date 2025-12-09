import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { managementSetupGuard } from './management-setup.guard';

describe('managementSetupGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => managementSetupGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

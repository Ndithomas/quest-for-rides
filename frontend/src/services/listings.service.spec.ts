import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ListingsService } from './listings.service';

describe('ListingsService', () => {
  let service: ListingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting()
    ]
  });
    service = TestBed.inject(ListingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

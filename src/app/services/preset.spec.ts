import { TestBed } from '@angular/core/testing';

import { PresetService } from './preset';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('PresetService', () => {
  let service: PresetService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PresetService]
    });
    service = TestBed.inject(PresetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

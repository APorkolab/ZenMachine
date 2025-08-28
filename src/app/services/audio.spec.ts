import { TestBed } from '@angular/core/testing';

import { AudioService } from './audio';

describe('AudioService', () => {
  let service: AudioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have an audio context', () => {
    expect((service as any).audioContext).toBeDefined();
  });

  it('should have a master gain node', () => {
    expect((service as any).masterGainNode).toBeDefined();
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, JamendoResponse } from './api';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch random tracks from Jamendo API', () => {
    const dummyResponse: JamendoResponse = {
      results: [
        { id: '1', name: 'Track 1', artist_name: 'Artist 1', audio: 'url1' },
        { id: '2', name: 'Track 2', artist_name: 'Artist 2', audio: 'url2' }
      ]
    };

    service.getRamdomTracks().subscribe(response => {
      expect(response.results.length).toBe(2);
      expect(response).toEqual(dummyResponse);
    });

    const req = httpMock.expectOne(request => request.url.includes('api.jamendo.com'));
    expect(req.request.method).toBe('GET');
    req.flush(dummyResponse);
  });
});

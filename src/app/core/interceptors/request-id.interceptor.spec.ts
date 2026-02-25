import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { requestIdInterceptor } from './request-id.interceptor';
import { environment } from '../../../environments/environment';

describe('requestIdInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([requestIdInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should add x-request-id header for API requests', () => {
    http.get(`${environment.apiUrl}/test`).subscribe();
    const req = httpTesting.expectOne(`${environment.apiUrl}/test`);
    expect(req.request.headers.has('x-request-id')).toBeTrue();
    req.flush({});
  });

  it('should not add x-request-id header for non-API requests', () => {
    http.get('https://other-api.com/data').subscribe();
    const req = httpTesting.expectOne('https://other-api.com/data');
    expect(req.request.headers.has('x-request-id')).toBeFalse();
    req.flush({});
  });

  it('should generate unique request ids for each request', () => {
    http.get(`${environment.apiUrl}/test1`).subscribe();
    http.get(`${environment.apiUrl}/test2`).subscribe();
    const req1 = httpTesting.expectOne(`${environment.apiUrl}/test1`);
    const req2 = httpTesting.expectOne(`${environment.apiUrl}/test2`);
    expect(req1.request.headers.get('x-request-id')).not.toBe(
      req2.request.headers.get('x-request-id')
    );
    req1.flush({});
    req2.flush({});
  });

  it('should produce a valid UUID as request id', () => {
    http.get(`${environment.apiUrl}/uuid-check`).subscribe();
    const req = httpTesting.expectOne(`${environment.apiUrl}/uuid-check`);
    const requestId = req.request.headers.get('x-request-id')!;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(requestId).toMatch(uuidRegex);
    req.flush({});
  });
});

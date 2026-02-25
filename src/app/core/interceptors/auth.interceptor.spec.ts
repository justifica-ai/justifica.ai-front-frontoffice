import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let mockSession: ReturnType<typeof signal>;

  beforeEach(() => {
    mockSession = signal(null as unknown);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { session: mockSession },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should not add Authorization header when no session exists', () => {
    http.get(`${environment.apiUrl}/test`).subscribe();
    const req = httpTesting.expectOne(`${environment.apiUrl}/test`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should add Authorization header with Bearer token when session exists', () => {
    mockSession.set({ access_token: 'test-token-abc123' });
    http.get(`${environment.apiUrl}/test`).subscribe();
    const req = httpTesting.expectOne(`${environment.apiUrl}/test`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-abc123');
    req.flush({});
  });

  it('should not add Authorization header for non-API requests even with session', () => {
    mockSession.set({ access_token: 'some-token' });
    http.get('https://other-api.com/data').subscribe();
    const req = httpTesting.expectOne('https://other-api.com/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should not add Authorization header when session has no access_token', () => {
    mockSession.set({ access_token: null });
    http.get(`${environment.apiUrl}/test`).subscribe();
    const req = httpTesting.expectOne(`${environment.apiUrl}/test`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});

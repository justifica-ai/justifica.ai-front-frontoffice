import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { authInterceptor, _resetAuthInterceptorState } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

function createMockAuthService(accessToken: string | null = null) {
  const mockSession = signal(accessToken ? { access_token: accessToken } : null);

  const refreshSpy = jasmine.createSpy('refreshSession');
  const signOutSpy = jasmine.createSpy('signOut').and.resolveTo({});

  return {
    session: mockSession,
    signOut: signOutSpy,
    getSupabaseClient: () => ({
      auth: { refreshSession: refreshSpy },
    }),
    _refreshSpy: refreshSpy,
    _mockSession: mockSession,
  };
}

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let toastService: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  function setupTestBed(accessToken: string | null = 'test-token') {
    _resetAuthInterceptorState();

    const authMock = createMockAuthService(accessToken);
    toastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    router = jasmine.createSpyObj('Router', ['navigate'], { url: '/dashboard' });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);

    return authMock;
  }

  afterEach(() => {
    httpTesting.verify();
  });

  // =========================================================================
  // Token Injection
  // =========================================================================
  describe('Token Injection', () => {
    it('should add Authorization header for API requests when session exists', () => {
      setupTestBed('my-token-123');
      http.get(`${API_URL}/data`).subscribe();
      const req = httpTesting.expectOne(`${API_URL}/data`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer my-token-123');
      req.flush({});
    });

    it('should NOT add Authorization header when no session exists', () => {
      setupTestBed(null);
      http.get(`${API_URL}/data`).subscribe();
      const req = httpTesting.expectOne(`${API_URL}/data`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('should NOT add Authorization header for non-API requests', () => {
      setupTestBed('some-token');
      http.get('https://other-api.com/data').subscribe();
      const req = httpTesting.expectOne('https://other-api.com/data');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('should NOT add Authorization header for auth endpoints', () => {
      setupTestBed('some-token');
      http.get(`${API_URL}/auth/login`).subscribe();
      const req = httpTesting.expectOne(`${API_URL}/auth/login`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('should skip auth endpoints: register', () => {
      setupTestBed('some-token');
      http.get(`${API_URL}/auth/register`).subscribe();
      const req = httpTesting.expectOne(`${API_URL}/auth/register`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('should skip auth endpoints: forgot-password', () => {
      setupTestBed('some-token');
      http.get(`${API_URL}/auth/forgot-password`).subscribe();
      const req = httpTesting.expectOne(`${API_URL}/auth/forgot-password`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });
  });

  // =========================================================================
  // Token Refresh on 401
  // =========================================================================
  describe('Token Refresh on 401', () => {
    it('should retry request with new token after successful refresh', fakeAsync(() => {
      const authMock = setupTestBed('old-token');
      authMock._refreshSpy.and.resolveTo({
        data: { session: { access_token: 'new-token' } },
        error: null,
      });

      let result: unknown;
      http.get(`${API_URL}/data`).subscribe((r) => (result = r));

      // First request returns 401
      const firstReq = httpTesting.expectOne(`${API_URL}/data`);
      expect(firstReq.request.headers.get('Authorization')).toBe('Bearer old-token');
      firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick(); // Resolve refreshSession promise

      // Retried request with new token
      const retryReq = httpTesting.expectOne(`${API_URL}/data`);
      expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
      retryReq.flush({ value: 42 });

      expect(result).toEqual({ value: 42 });
    }));

    it('should call refreshSession exactly once', fakeAsync(() => {
      const authMock = setupTestBed('old-token');
      authMock._refreshSpy.and.resolveTo({
        data: { session: { access_token: 'new-token' } },
        error: null,
      });

      http.get(`${API_URL}/data`).subscribe();

      const firstReq = httpTesting.expectOne(`${API_URL}/data`);
      firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(authMock._refreshSpy).toHaveBeenCalledTimes(1);

      const retryReq = httpTesting.expectOne(`${API_URL}/data`);
      retryReq.flush({});
    }));

    it('should queue multiple concurrent 401 requests and resolve with single refresh', fakeAsync(() => {
      const authMock = setupTestBed('old-token');
      authMock._refreshSpy.and.resolveTo({
        data: { session: { access_token: 'refreshed-token' } },
        error: null,
      });

      const results: unknown[] = [];
      http.get(`${API_URL}/data1`).subscribe((r) => results.push(r));
      http.get(`${API_URL}/data2`).subscribe((r) => results.push(r));

      // Both requests return 401
      const req1 = httpTesting.expectOne(`${API_URL}/data1`);
      const req2 = httpTesting.expectOne(`${API_URL}/data2`);
      req1.flush(null, { status: 401, statusText: 'Unauthorized' });
      req2.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick(); // Resolve refresh

      // Only one refresh call
      expect(authMock._refreshSpy).toHaveBeenCalledTimes(1);

      // Both retried with new token
      const retry1 = httpTesting.expectOne(`${API_URL}/data1`);
      const retry2 = httpTesting.expectOne(`${API_URL}/data2`);
      expect(retry1.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
      expect(retry2.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
      retry1.flush({ id: 1 });
      retry2.flush({ id: 2 });

      expect(results).toEqual([{ id: 1 }, { id: 2 }]);
    }));

    it('should not intercept non-401 errors', () => {
      const authMock = setupTestBed('token');
      let caughtError: { status: number } | undefined;
      http.get(`${API_URL}/data`).subscribe({ error: (e) => (caughtError = e) });

      const req = httpTesting.expectOne(`${API_URL}/data`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(authMock._refreshSpy).not.toHaveBeenCalled();
      expect(caughtError?.status).toBe(500);
    });
  });

  // =========================================================================
  // Refresh Failure — Session Expiry
  // =========================================================================
  describe('Refresh Failure', () => {
    it('should sign out on refresh failure', fakeAsync(() => {
      const authMock = setupTestBed('old-token');
      authMock._refreshSpy.and.resolveTo({
        data: { session: null },
        error: { message: 'Invalid refresh token' },
      });

      http.get(`${API_URL}/data`).subscribe({ error: () => {} });

      const req = httpTesting.expectOne(`${API_URL}/data`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(authMock.signOut).toHaveBeenCalled();
    }));

    it('should show "Sessão expirada" toast on refresh failure', fakeAsync(() => {
      const authMock = setupTestBed('old-token');
      authMock._refreshSpy.and.resolveTo({
        data: { session: null },
        error: { message: 'expired' },
      });

      http.get(`${API_URL}/data`).subscribe({ error: () => {} });

      const req = httpTesting.expectOne(`${API_URL}/data`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(toastService.error).toHaveBeenCalledWith(
        'Sessão expirada',
        'Faça login novamente.',
      );
    }));

    it('should redirect to login with returnUrl on refresh failure', fakeAsync(() => {
      const authMock = setupTestBed('old-token');
      authMock._refreshSpy.and.resolveTo({
        data: { session: null },
        error: { message: 'expired' },
      });

      http.get(`${API_URL}/data`).subscribe({ error: () => {} });

      const req = httpTesting.expectOne(`${API_URL}/data`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/dashboard' } },
      );
    }));

    it('should save returnUrl to localStorage on refresh failure', fakeAsync(() => {
      const authMock = setupTestBed('old-token');
      authMock._refreshSpy.and.resolveTo({
        data: { session: null },
        error: { message: 'expired' },
      });

      spyOn(localStorage, 'setItem');

      http.get(`${API_URL}/data`).subscribe({ error: () => {} });

      const req = httpTesting.expectOne(`${API_URL}/data`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(localStorage.setItem).toHaveBeenCalledWith('justifica_returnUrl', '/dashboard');
    }));

    it('should dispatch session-expired event on refresh failure', fakeAsync(() => {
      const authMock = setupTestBed('old-token');
      authMock._refreshSpy.and.resolveTo({
        data: { session: null },
        error: { message: 'expired' },
      });

      let eventFired = false;
      const listener = () => { eventFired = true; };
      window.addEventListener('session-expired', listener);

      http.get(`${API_URL}/data`).subscribe({ error: () => {} });

      const req = httpTesting.expectOne(`${API_URL}/data`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(eventFired).toBeTrue();
      window.removeEventListener('session-expired', listener);
    }));

    it('should handle refreshSession throwing an exception', fakeAsync(() => {
      const authMock = setupTestBed('old-token');
      authMock._refreshSpy.and.rejectWith(new Error('Network error'));

      http.get(`${API_URL}/data`).subscribe({ error: () => {} });

      const req = httpTesting.expectOne(`${API_URL}/data`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(authMock.signOut).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith(
        'Sessão expirada',
        'Faça login novamente.',
      );
    }));

    it('should propagate 401 error to subscriber when refresh fails', fakeAsync(() => {
      const authMock = setupTestBed('old-token');
      authMock._refreshSpy.and.resolveTo({
        data: { session: null },
        error: { message: 'expired' },
      });

      let caughtError: { status: number } | undefined;
      http.get(`${API_URL}/data`).subscribe({ error: (e) => (caughtError = e) });

      const req = httpTesting.expectOne(`${API_URL}/data`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(caughtError?.status).toBe(401);
    }));
  });

  // =========================================================================
  // Successful responses (passthrough)
  // =========================================================================
  describe('Passthrough', () => {
    it('should pass through successful responses', () => {
      setupTestBed('token');
      let result: unknown;
      http.get(`${API_URL}/data`).subscribe((r) => (result = r));

      const req = httpTesting.expectOne(`${API_URL}/data`);
      req.flush({ ok: true });

      expect(result).toEqual({ ok: true });
    });
  });
});

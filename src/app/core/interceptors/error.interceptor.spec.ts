import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let toastService: jasmine.SpyObj<ToastService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    toastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);
    authService = jasmine.createSpyObj('AuthService', ['signOut']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should handle 401 by signing out and redirecting to login', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    const req = httpTesting.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authService.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    expect(toastService.error).toHaveBeenCalledWith('Sessão expirada', 'Faça login novamente.');
  });

  it('should handle 403 with access denied toast', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    const req = httpTesting.expectOne('/api/test');
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Acesso negado',
      'Você não tem permissão para esta ação.'
    );
  });

  it('should handle 404 with not found toast', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    const req = httpTesting.expectOne('/api/test');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Não encontrado',
      'O recurso solicitado não foi encontrado.'
    );
  });

  it('should handle 422 without showing any toast', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    const req = httpTesting.expectOne('/api/test');
    req.flush('Unprocessable', { status: 422, statusText: 'Unprocessable Entity' });

    expect(toastService.error).not.toHaveBeenCalled();
    expect(toastService.warning).not.toHaveBeenCalled();
  });

  it('should handle 429 with rate limit warning toast', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    const req = httpTesting.expectOne('/api/test');
    req.flush('Too Many', { status: 429, statusText: 'Too Many Requests' });

    expect(toastService.warning).toHaveBeenCalledWith(
      'Muitas requisições',
      'Aguarde alguns instantes e tente novamente.'
    );
  });

  it('should handle 500 with server error toast', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    const req = httpTesting.expectOne('/api/test');
    req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Erro no servidor',
      'Tente novamente em alguns instantes.'
    );
  });

  it('should handle 502 with server error toast', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    const req = httpTesting.expectOne('/api/test');
    req.flush('Bad Gateway', { status: 502, statusText: 'Bad Gateway' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Erro no servidor',
      'Tente novamente em alguns instantes.'
    );
  });

  it('should handle 503 with server error toast', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    const req = httpTesting.expectOne('/api/test');
    req.flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Erro no servidor',
      'Tente novamente em alguns instantes.'
    );
  });

  it('should re-throw the error to the subscriber', () => {
    let caughtError: HttpErrorResponse | undefined;
    http.get('/api/test').subscribe({ error: (err) => (caughtError = err) });
    const req = httpTesting.expectOne('/api/test');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(caughtError).toBeDefined();
    expect(caughtError!.status).toBe(500);
  });

  it('should pass through successful responses', () => {
    let result: unknown;
    http.get('/api/test').subscribe((res) => (result = res));
    const req = httpTesting.expectOne('/api/test');
    req.flush({ data: 'ok' });

    expect(result).toEqual({ data: 'ok' });
    expect(toastService.error).not.toHaveBeenCalled();
  });
});

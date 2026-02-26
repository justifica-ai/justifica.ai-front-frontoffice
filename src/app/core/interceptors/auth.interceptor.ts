import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, ReplaySubject, from, throwError, switchMap, take, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../../environments/environment';
import { APP_ROUTES } from '../constants/app-routes';

/** Auth endpoint paths excluded from 401 refresh logic to avoid loops */
const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
];

let isRefreshing = false;
let refreshResult$ = new ReplaySubject<string | null>(1);

/** Reset module-level state between tests */
export function _resetAuthInterceptorState(): void {
  isRefreshing = false;
  refreshResult$ = new ReplaySubject<string | null>(1);
}

function isAuthEndpoint(url: string): boolean {
  return AUTH_PATHS.some((path) => url.includes(path));
}

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  // Skip non-API requests
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // Skip auth endpoints to avoid infinite refresh loops
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  const session = auth.session();
  if (!session?.access_token) {
    return next(req);
  }

  return next(addToken(req, session.access_token)).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401(req, next, auth, router, toast);
      }
      return throwError(() => error);
    }),
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  router: Router,
  toast: ToastService,
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshResult$ = new ReplaySubject<string | null>(1);

    from(auth.getSupabaseClient().auth.refreshSession()).subscribe({
      next: ({ data, error }) => {
        isRefreshing = false;
        if (!error && data?.session) {
          refreshResult$.next(data.session.access_token);
          refreshResult$.complete();
        } else {
          refreshResult$.next(null);
          refreshResult$.complete();
          onRefreshFailure(auth, router, toast);
        }
      },
      error: () => {
        isRefreshing = false;
        refreshResult$.next(null);
        refreshResult$.complete();
        onRefreshFailure(auth, router, toast);
      },
    });
  }

  // Both the initiating request AND queued concurrent requests wait here
  return refreshResult$.pipe(
    take(1),
    switchMap((token) => {
      if (token) {
        return next(addToken(req, token));
      }
      return throwError(
        () => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: req.url }),
      );
    }),
  );
}

function onRefreshFailure(auth: AuthService, router: Router, toast: ToastService): void {
  // Dispatch event so active forms can save drafts to localStorage
  window.dispatchEvent(new CustomEvent('session-expired'));

  // Save return URL for post-login redirect
  const currentUrl = router.url;
  if (currentUrl && !currentUrl.startsWith('/auth/')) {
    localStorage.setItem('justifica_returnUrl', currentUrl);
  }

  auth.signOut();
  toast.error('Sessão expirada', 'Faça login novamente.');
  router.navigate([APP_ROUTES.AUTH.LOGIN], {
    queryParams: currentUrl && !currentUrl.startsWith('/auth/') ? { returnUrl: currentUrl } : {},
  });
}

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { APP_ROUTES } from '../constants/app-routes';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          auth.signOut();
          router.navigate([APP_ROUTES.AUTH.LOGIN]);
          toast.error('Sessão expirada', 'Faça login novamente.');
          break;
        case 403:
          toast.error('Acesso negado', 'Você não tem permissão para esta ação.');
          break;
        case 404:
          toast.error('Não encontrado', 'O recurso solicitado não foi encontrado.');
          break;
        case 422:
          // Validation errors — handled by the calling service
          break;
        case 429:
          toast.warning('Muitas requisições', 'Aguarde alguns instantes e tente novamente.');
          break;
        case 500:
        case 502:
        case 503:
          toast.error('Erro no servidor', 'Tente novamente em alguns instantes.');
          break;
        default:
          if (!navigator.onLine) {
            toast.warning('Sem conexão', 'Verifique sua conexão com a internet.');
          }
          break;
      }

      return throwError(() => error);
    }),
  );
};

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        // 401 is handled by authInterceptor (token refresh + redirect)
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

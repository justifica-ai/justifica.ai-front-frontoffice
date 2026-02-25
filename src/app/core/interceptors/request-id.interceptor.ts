import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  // Only add request ID for API requests
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const clonedReq = req.clone({
    setHeaders: {
      'x-request-id': crypto.randomUUID(),
    },
  });

  return next(clonedReq);
};

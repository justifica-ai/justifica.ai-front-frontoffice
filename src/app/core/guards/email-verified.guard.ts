import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { APP_ROUTES } from '../constants/app-routes';

export const emailVerifiedGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.user();
  if (!user) {
    return router.createUrlTree([APP_ROUTES.AUTH.LOGIN]);
  }

  if (user.email_confirmed_at) {
    return true;
  }

  return router.createUrlTree([APP_ROUTES.AUTH.VERIFY_EMAIL]);
};

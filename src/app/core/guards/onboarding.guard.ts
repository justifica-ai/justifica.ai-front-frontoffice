import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { APP_ROUTES } from '../constants/app-routes';
import { ProfileService } from '../../features/onboarding/services/profile.service';

/**
 * Guard that redirects to /onboarding if the user has not completed onboarding.
 * Should be applied to main app routes AFTER authGuard and emailVerifiedGuard.
 */
export const onboardingGuard: CanActivateFn = async () => {
  const profileService = inject(ProfileService);
  const router = inject(Router);

  try {
    if (!profileService.profile()) {
      await profileService.loadProfile();
    }

    if (profileService.onboardingCompleted()) {
      return true;
    }

    return router.createUrlTree([APP_ROUTES.ONBOARDING]);
  } catch {
    // If profile fails to load, allow access (don't block the user)
    return true;
  }
};

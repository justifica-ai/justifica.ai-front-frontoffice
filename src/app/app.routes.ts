import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { emailVerifiedGuard } from './core/guards/email-verified.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // ═══════ Auth (público) ═══════
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent,
      ),
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },

  // ═══════ Onboarding ═══════
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent,
      ),
    loadChildren: () =>
      import('./features/onboarding/onboarding.routes').then((m) => m.onboardingRoutes),
  },

  // ═══════ App (autenticado) ═══════
  {
    path: '',
    canActivate: [authGuard, emailVerifiedGuard],
    loadComponent: () =>
      import('./layouts/app-layout/app-layout.component').then(
        (m) => m.AppLayoutComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'appeals/new',
        pathMatch: 'full',
      },
      {
        path: 'appeals',
        loadChildren: () =>
          import('./features/appeal/appeal.routes').then((m) => m.appealRoutes),
      },
      {
        path: 'payment',
        loadChildren: () =>
          import('./features/payment/payment.routes').then((m) => m.paymentRoutes),
      },
      {
        path: 'history',
        loadChildren: () =>
          import('./features/history/history.routes').then((m) => m.historyRoutes),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.routes').then((m) => m.profileRoutes),
      },
      {
        path: 'affiliate',
        loadChildren: () =>
          import('./features/affiliate/affiliate.routes').then(
            (m) => m.affiliateRoutes,
          ),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./features/notifications/notifications.routes').then(
            (m) => m.notificationRoutes,
          ),
      },
    ],
  },

  // ═══════ Fallback ═══════
  { path: '**', redirectTo: '' },
];

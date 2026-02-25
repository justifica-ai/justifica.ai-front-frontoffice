import { Routes } from '@angular/router';

export const onboardingRoutes: Routes = [
  {
    path: '',
    title: 'Complete seu Perfil — Justifica.AI',
    loadComponent: () => import('./pages/complete-profile/complete-profile.component').then((m) => m.CompleteProfileComponent),
  },
];

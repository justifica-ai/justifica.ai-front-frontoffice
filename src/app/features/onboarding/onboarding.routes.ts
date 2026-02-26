import { Routes } from '@angular/router';

export const onboardingRoutes: Routes = [
  {
    path: '',
    title: 'Complete seu Perfil — Justifica.AI',
    loadComponent: () =>
      import('./pages/onboarding-stepper/onboarding-stepper.component').then(
        (m) => m.OnboardingStepperComponent,
      ),
  },
];

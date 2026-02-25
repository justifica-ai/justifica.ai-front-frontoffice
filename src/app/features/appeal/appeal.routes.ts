import { Routes } from '@angular/router';

export const appealRoutes: Routes = [
  {
    path: 'new',
    title: 'Novo Recurso — Justifica.AI',
    loadComponent: () => import('./pages/new-appeal/new-appeal.component').then((m) => m.NewAppealComponent),
  },
  {
    path: ':id/preview',
    title: 'Pré-visualização — Justifica.AI',
    loadComponent: () => import('./pages/appeal-preview/appeal-preview.component').then((m) => m.AppealPreviewComponent),
  },
  {
    path: ':id',
    title: 'Detalhes do Recurso — Justifica.AI',
    loadComponent: () => import('./pages/appeal-detail/appeal-detail.component').then((m) => m.AppealDetailComponent),
  },
  { path: '', redirectTo: 'new', pathMatch: 'full' },
];

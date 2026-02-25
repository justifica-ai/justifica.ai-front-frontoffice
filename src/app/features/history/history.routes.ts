import { Routes } from '@angular/router';

export const historyRoutes: Routes = [
  {
    path: '',
    title: 'Meus Recursos — Justifica.AI',
    loadComponent: () => import('./pages/appeal-list/appeal-list.component').then((m) => m.AppealListComponent),
  },
  {
    path: ':id',
    title: 'Detalhes do Recurso — Justifica.AI',
    loadComponent: () => import('./pages/history-detail/history-detail.component').then((m) => m.HistoryDetailComponent),
  },
];

import { Routes } from '@angular/router';

export const affiliateRoutes: Routes = [
  {
    path: '',
    title: 'Programa de Afiliados — Justifica.AI',
    loadComponent: () => import('./pages/affiliate-dashboard/affiliate-dashboard.component').then((m) => m.AffiliateDashboardComponent),
  },
  {
    path: 'apply',
    title: 'Tornar-se Afiliado — Justifica.AI',
    loadComponent: () => import('./pages/affiliate-apply/affiliate-apply.component').then((m) => m.AffiliateApplyComponent),
  },
  {
    path: 'withdrawals',
    title: 'Saques — Justifica.AI',
    loadComponent: () => import('./pages/affiliate-withdrawals/affiliate-withdrawals.component').then((m) => m.AffiliateWithdrawalsComponent),
  },
];

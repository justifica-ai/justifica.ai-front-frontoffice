import { Routes } from '@angular/router';

export const notificationRoutes: Routes = [
  {
    path: '',
    title: 'Notificações — Justifica.AI',
    loadComponent: () => import('./pages/notification-center/notification-center.component').then((m) => m.NotificationCenterComponent),
  },
];

import { Routes } from '@angular/router';

export const paymentRoutes: Routes = [
  {
    path: ':id',
    title: 'Pagamento PIX — Justifica.AI',
    loadComponent: () => import('./pages/pix-payment/pix-payment.component').then((m) => m.PixPaymentComponent),
  },
  {
    path: ':id/success',
    title: 'Pagamento Confirmado — Justifica.AI',
    loadComponent: () => import('./pages/payment-success/payment-success.component').then((m) => m.PaymentSuccessComponent),
  },
];

import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    title: 'Meu Perfil — Justifica.AI',
    loadComponent: () => import('./pages/edit-profile/edit-profile.component').then((m) => m.EditProfileComponent),
  },
  {
    path: 'vehicles',
    title: 'Meus Veículos — Justifica.AI',
    loadComponent: () => import('./pages/my-vehicles/my-vehicles.component').then((m) => m.MyVehiclesComponent),
  },
  {
    path: 'change-password',
    title: 'Alterar Senha — Justifica.AI',
    loadComponent: () => import('./pages/change-password/change-password.component').then((m) => m.ChangePasswordComponent),
  },
  {
    path: 'privacy',
    title: 'Privacidade — Justifica.AI',
    loadComponent: () => import('./pages/privacy-settings/privacy-settings.component').then((m) => m.PrivacySettingsComponent),
  },
  {
    path: 'delete-account',
    title: 'Excluir Conta — Justifica.AI',
    loadComponent: () => import('./pages/delete-account/delete-account.component').then((m) => m.DeleteAccountComponent),
  },
];

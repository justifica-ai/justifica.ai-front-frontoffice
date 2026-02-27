import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/profile-layout/profile-layout.component').then(
        (m) => m.ProfileLayoutComponent,
      ),
    children: [
      {
        path: '',
        title: 'Meu Perfil — Justifica.AI',
        loadComponent: () =>
          import('./pages/edit-profile/edit-profile.component').then(
            (m) => m.EditProfileComponent,
          ),
      },
      {
        path: 'vehicles',
        title: 'Meus Veículos — Justifica.AI',
        loadComponent: () =>
          import('./pages/my-vehicles/my-vehicles.component').then(
            (m) => m.MyVehiclesComponent,
          ),
      },
      {
        path: 'security',
        title: 'Segurança — Justifica.AI',
        loadComponent: () =>
          import('./pages/security/security.component').then(
            (m) => m.SecurityComponent,
          ),
      },
      {
        path: 'communication',
        title: 'Comunicação — Justifica.AI',
        loadComponent: () =>
          import('./pages/communication/communication.component').then(
            (m) => m.CommunicationComponent,
          ),
      },
      {
        path: 'privacy',
        title: 'Privacidade — Justifica.AI',
        loadComponent: () =>
          import('./pages/privacy-settings/privacy-settings.component').then(
            (m) => m.PrivacySettingsComponent,
          ),
      },
    ],
  },
];

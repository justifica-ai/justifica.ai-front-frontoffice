import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { APP_ROUTES } from '../../core/constants/app-routes';
import { NotificationBellComponent } from '../../features/notifications/components/notification-bell/notification-bell.component';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationBellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Mobile Header -->
    <header class="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
      <a [routerLink]="['/']" class="flex items-center gap-1" aria-label="Ir para o início">
        <span class="text-lg font-bold text-brand-700">Justifica</span>
        <span class="text-lg font-bold text-brand-500">.AI</span>
      </a>
      <div class="flex items-center gap-3">
        <app-notification-bell />
        <button (click)="toggleMobileMenu()" class="p-2 text-gray-500 hover:text-brand-600" [attr.aria-label]="mobileMenuOpen() ? 'Fechar menu' : 'Abrir menu'" [attr.aria-expanded]="mobileMenuOpen()">
          @if (mobileMenuOpen()) {
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          }
        </button>
      </div>
    </header>

    <!-- Mobile Menu Overlay -->
    @if (mobileMenuOpen()) {
      <div class="lg:hidden fixed inset-0 z-30 bg-black/50" (click)="closeMobileMenu()" aria-hidden="true"></div>
      <nav class="lg:hidden fixed top-14 right-0 z-40 w-64 h-[calc(100vh-3.5rem)] bg-white border-l border-gray-200 p-4 overflow-y-auto"
           role="navigation" aria-label="Menu principal">
        @for (item of navItems; track item.path) {
          <a [routerLink]="[item.path]" routerLinkActive="bg-brand-50 text-brand-700 font-semibold"
             [routerLinkActiveOptions]="{ exact: item.path === '/' }"
             (click)="closeMobileMenu()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors mb-1">
            <span class="text-sm">{{ item.label }}</span>
          </a>
        }
        <hr class="my-3 border-gray-200" />
        <button (click)="onSignOut()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm">
          Sair da conta
        </button>
      </nav>
    }

    <!-- Desktop Sidebar -->
    <aside class="hidden lg:flex flex-col fixed top-0 left-0 z-20 w-60 h-screen bg-white border-r border-gray-200">
      <div class="h-16 flex items-center px-6 border-b border-gray-200">
        <a [routerLink]="['/']" class="flex items-center gap-1" aria-label="Ir para o início">
          <span class="text-xl font-bold text-brand-700">Justifica</span>
          <span class="text-xl font-bold text-brand-500">.AI</span>
        </a>
      </div>

      <nav class="flex-1 p-4 overflow-y-auto" role="navigation" aria-label="Menu principal">
        @for (item of navItems; track item.path) {
          <a [routerLink]="[item.path]" routerLinkActive="bg-brand-50 text-brand-700 font-semibold"
             [routerLinkActiveOptions]="{ exact: item.path === '/' }"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors mb-1">
            <span class="text-sm">{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="p-4 border-t border-gray-200">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
            {{ userInitial() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-700 truncate">{{ userEmail() }}</p>
          </div>
        </div>
        <button (click)="onSignOut()" class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors border border-red-200">
          Sair da conta
        </button>
      </div>
    </aside>

    <!-- Desktop Header -->
    <header class="hidden lg:flex fixed top-0 left-60 right-0 z-10 h-16 bg-white border-b border-gray-200 px-6 items-center justify-end gap-4">
      <app-notification-bell />
    </header>

    <!-- Main Content -->
    <main class="lg:ml-60 pt-14 lg:pt-16 min-h-screen bg-gray-50">
      <div class="p-4 lg:p-6">
        <router-outlet />
      </div>
    </main>
  `,
})
export class AppLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly routes = APP_ROUTES;
  readonly mobileMenuOpen = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Novo Recurso', path: '/appeals/new', icon: 'file-plus' },
    { label: 'Meus Recursos', path: '/history', icon: 'folder' },
    { label: 'Meu Perfil', path: '/profile', icon: 'user' },
    { label: 'Notificações', path: '/notifications', icon: 'bell' },
    { label: 'Programa de Afiliados', path: '/affiliate', icon: 'users' },
  ];

  readonly userEmail = this.auth.user
    ? (() => {
        const user = this.auth.user();
        return user?.email ?? '';
      })
    : () => '';

  readonly userInitial = () => {
    const email = this.userEmail();
    return email ? email.charAt(0).toUpperCase() : '?';
  };

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  async onSignOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate([APP_ROUTES.AUTH.LOGIN]);
  }
}

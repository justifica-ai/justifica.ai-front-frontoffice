import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

interface ProfileTab {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
}

export const PROFILE_TABS: readonly ProfileTab[] = [
  { label: 'Dados Pessoais', path: '/profile', icon: 'user' },
  { label: 'Veículos', path: '/profile/vehicles', icon: 'car' },
  { label: 'Segurança', path: '/profile/security', icon: 'shield' },
  { label: 'Comunicação', path: '/profile/communication', icon: 'bell' },
  { label: 'Privacidade', path: '/profile/privacy', icon: 'lock' },
] as const;

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h1>

      <!-- Desktop tabs -->
      <nav class="hidden sm:flex border-b border-gray-200 mb-6" role="tablist" aria-label="Abas do perfil">
        @for (tab of tabs; track tab.path) {
          <a [routerLink]="[tab.path]"
             routerLinkActive="border-brand-600 text-brand-700"
             [routerLinkActiveOptions]="{ exact: tab.path === '/profile' }"
             class="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors whitespace-nowrap -mb-px"
             role="tab">
            {{ tab.label }}
          </a>
        }
      </nav>

      <!-- Mobile dropdown selector -->
      <div class="sm:hidden mb-6">
        <label for="profile-tab-select" class="sr-only">Selecionar aba do perfil</label>
        <button
          type="button"
          class="w-full flex items-center justify-between h-11 px-4 rounded-lg border border-gray-300 bg-white text-sm text-gray-700"
          (click)="mobileMenuOpen.set(!mobileMenuOpen())"
          [attr.aria-expanded]="mobileMenuOpen()">
          <span>Selecionar seção</span>
          <svg class="w-4 h-4 text-gray-400 transition-transform"
               [class.rotate-180]="mobileMenuOpen()"
               fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        @if (mobileMenuOpen()) {
          <div class="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden" role="listbox">
            @for (tab of tabs; track tab.path) {
              <a [routerLink]="[tab.path]"
                 routerLinkActive="bg-brand-50 text-brand-700 font-semibold"
                 [routerLinkActiveOptions]="{ exact: tab.path === '/profile' }"
                 (click)="mobileMenuOpen.set(false)"
                 class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                 role="option"
                 aria-selected="false">
                {{ tab.label }}
              </a>
            }
          </div>
        }
      </div>

      <!-- Tab content -->
      <router-outlet />
    </div>
  `,
})
export class ProfileLayoutComponent {
  readonly tabs = PROFILE_TABS;
  readonly mobileMenuOpen = signal(false);
}

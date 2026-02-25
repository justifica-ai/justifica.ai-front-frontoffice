import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div class="mb-8 text-center">
        <a href="https://justifica.ai" class="inline-block" aria-label="Ir para a página inicial do Justifica.AI">
          <span class="text-2xl font-bold text-brand-700">Justifica</span>
          <span class="text-2xl font-bold text-brand-500">.AI</span>
        </a>
        <p class="mt-2 text-sm text-gray-500">Seu recurso de multa com inteligência artificial</p>
      </div>

      <main class="w-full max-w-md">
        <div class="bg-white rounded-xl shadow-md p-8">
          <router-outlet />
        </div>
      </main>

      <footer class="mt-8 text-center text-xs text-gray-400">
        <p>&copy; {{ currentYear }} Justifica.AI — Todos os direitos reservados</p>
        <div class="mt-2 flex gap-4 justify-center">
          <a href="https://justifica.ai/termos" class="hover:text-brand-600 transition-colors" target="_blank" rel="noopener">
            Termos de Uso
          </a>
          <a href="https://justifica.ai/privacidade" class="hover:text-brand-600 transition-colors" target="_blank" rel="noopener">
            Política de Privacidade
          </a>
        </div>
      </footer>
    </div>
  `,
})
export class AuthLayoutComponent {
  readonly currentYear = new Date().getFullYear();
}

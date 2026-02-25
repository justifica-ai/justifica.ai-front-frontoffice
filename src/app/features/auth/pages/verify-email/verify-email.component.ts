import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-100 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-brand-600">
          <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Verifique seu e-mail</h1>
      <p class="text-sm text-gray-500">Enviamos um link de verificação para o seu e-mail. Clique no link para ativar sua conta.</p>
    </div>
  `,
})
export class VerifyEmailComponent {}

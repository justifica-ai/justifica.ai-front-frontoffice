import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-bold text-gray-800 mb-2">Esqueci minha senha</h1>
    <p class="text-sm text-gray-500 mb-6">Informe seu e-mail para redefinir sua senha</p>

    <div class="space-y-4">
      <p class="text-sm text-gray-400 italic">Formulário será implementado em EP-01</p>
    </div>

    <div class="mt-6 text-center">
      <a routerLink="/auth/login" class="text-sm text-brand-600 font-semibold hover:text-brand-700">Voltar para o login</a>
    </div>
  `,
})
export class ForgotPasswordComponent {}

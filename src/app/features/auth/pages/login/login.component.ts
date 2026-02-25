import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-bold text-gray-800 mb-2">Entrar</h1>
    <p class="text-sm text-gray-500 mb-6">Acesse sua conta para gerenciar seus recursos</p>

    <div class="space-y-4">
      <p class="text-sm text-gray-400 italic">Formulário de login será implementado em EP-01</p>
    </div>

    <div class="mt-6 text-center text-sm text-gray-500">
      Não tem conta?
      <a routerLink="/auth/register" class="text-brand-600 font-semibold hover:text-brand-700">Criar conta</a>
    </div>
  `,
})
export class LoginComponent {}

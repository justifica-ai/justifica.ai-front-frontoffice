import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-bold text-gray-800 mb-2">Criar conta</h1>
    <p class="text-sm text-gray-500 mb-6">Cadastre-se para gerar seu recurso de multa</p>

    <div class="space-y-4">
      <p class="text-sm text-gray-400 italic">Formulário de cadastro será implementado em EP-01</p>
    </div>

    <div class="mt-6 text-center text-sm text-gray-500">
      Já tem conta?
      <a routerLink="/auth/login" class="text-brand-600 font-semibold hover:text-brand-700">Entrar</a>
    </div>
  `,
})
export class RegisterComponent {}

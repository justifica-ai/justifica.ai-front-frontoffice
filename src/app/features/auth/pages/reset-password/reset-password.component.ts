import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-bold text-gray-800 mb-2">Redefinir senha</h1>
    <p class="text-sm text-gray-500 mb-6">Escolha uma nova senha para sua conta</p>
    <p class="text-sm text-gray-400 italic">Formulário será implementado em EP-01</p>
  `,
})
export class ResetPasswordComponent {}

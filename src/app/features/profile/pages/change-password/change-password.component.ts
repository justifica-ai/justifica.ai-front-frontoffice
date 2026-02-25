import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-change-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-md mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Alterar Senha</h1>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm text-gray-400 italic">Formulário será implementado em EP-02</p>
      </div>
    </div>
  `,
})
export class ChangePasswordComponent {}

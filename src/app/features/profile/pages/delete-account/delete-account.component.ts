import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-delete-account',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-md mx-auto">
      <h1 class="text-2xl font-bold text-red-600 mb-2">Excluir Conta</h1>
      <p class="text-sm text-gray-500 mb-6">Esta ação é irreversível e todos os seus dados serão apagados.</p>
      <div class="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <p class="text-sm text-gray-400 italic">Funcionalidade será implementada em EP-15</p>
      </div>
    </div>
  `,
})
export class DeleteAccountComponent {}

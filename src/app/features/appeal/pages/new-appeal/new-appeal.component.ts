import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-new-appeal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Novo Recurso</h1>
      <p class="text-sm text-gray-500 mb-6">Preencha os dados da multa para gerar seu recurso</p>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm text-gray-400 italic">Formulário multi-step será implementado em EP-03</p>
      </div>
    </div>
  `,
})
export class NewAppealComponent {}

import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-appeal-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Pré-visualização do Recurso</h1>
      <p class="text-sm text-gray-500 mb-6">Revise o documento antes de pagar</p>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm text-gray-400 italic">Preview com blur será implementado em EP-04</p>
      </div>
    </div>
  `,
})
export class AppealPreviewComponent {}

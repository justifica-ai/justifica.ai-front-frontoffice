import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-affiliate-apply',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-md mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Tornar-se Afiliado</h1>
      <p class="text-sm text-gray-500 mb-6">Indique amigos e ganhe comissão em cada recurso gerado</p>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm text-gray-400 italic">Formulário de aplicação será implementado em EP-11</p>
      </div>
    </div>
  `,
})
export class AffiliateApplyComponent {}

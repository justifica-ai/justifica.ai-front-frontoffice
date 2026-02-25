import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-affiliate-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Programa de Afiliados</h1>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm text-gray-400 italic">Dashboard de afiliados será implementado em EP-11</p>
      </div>
    </div>
  `,
})
export class AffiliateDashboardComponent {}

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-appeal-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Meus Recursos</h1>
          <p class="text-sm text-gray-500">Acompanhe o status dos seus recursos de multa</p>
        </div>
        <a routerLink="/appeals/new" class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors text-sm">
          Novo Recurso
        </a>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p class="text-sm text-gray-400 italic">Lista de recursos será implementada em EP-07</p>
      </div>
    </div>
  `,
})
export class AppealListComponent {}

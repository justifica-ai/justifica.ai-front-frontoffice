import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-my-vehicles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Meus Veículos</h1>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm text-gray-400 italic">Lista de veículos será implementada em EP-02</p>
      </div>
    </div>
  `,
})
export class MyVehiclesComponent {}

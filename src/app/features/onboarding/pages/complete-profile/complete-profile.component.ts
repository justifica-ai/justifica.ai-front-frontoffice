import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-md mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Complete seu perfil</h1>
      <p class="text-sm text-gray-500 mb-6">Precisamos de algumas informações para gerar seu recurso</p>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm text-gray-400 italic">Formulário de onboarding será implementado em EP-02</p>
      </div>
    </div>
  `,
})
export class CompleteProfileComponent {}

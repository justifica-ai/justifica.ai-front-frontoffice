import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-privacy-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Privacidade e LGPD</h1>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm text-gray-400 italic">Configurações de privacidade serão implementadas em EP-15</p>
      </div>
    </div>
  `,
})
export class PrivacySettingsComponent {}

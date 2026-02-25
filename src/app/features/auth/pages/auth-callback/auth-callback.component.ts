import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="text-center">
      <div class="w-8 h-8 mx-auto mb-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm text-gray-500">Autenticando...</p>
    </div>
  `,
})
export class AuthCallbackComponent {}

import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Notificações</h1>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p class="text-sm text-gray-400 italic">Central de notificações será implementada em EP-14</p>
      </div>
    </div>
  `,
})
export class NotificationCenterComponent {}

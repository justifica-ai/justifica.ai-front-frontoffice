import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-pix-payment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-md mx-auto text-center">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Pagamento PIX</h1>
      <p class="text-sm text-gray-500 mb-6">Pague com PIX para liberar seu recurso</p>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm text-gray-400 italic">QR Code PIX será implementado em EP-05</p>
      </div>
    </div>
  `,
})
export class PixPaymentComponent {}

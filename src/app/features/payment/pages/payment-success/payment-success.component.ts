import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-md mx-auto text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-100 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent-600">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Pagamento confirmado!</h1>
      <p class="text-sm text-gray-500 mb-6">Seu recurso está sendo gerado e ficará disponível em instantes.</p>
      <a routerLink="/history" class="inline-flex items-center justify-center px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors">
        Ver meus recursos
      </a>
    </div>
  `,
})
export class PaymentSuccessComponent {}

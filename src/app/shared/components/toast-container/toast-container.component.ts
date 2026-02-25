import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
         role="region" aria-label="Notificações" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="pointer-events-auto rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-up"
             [class]="getToastClasses(toast.type)" role="alert">
          <div class="flex-1">
            <p class="font-semibold text-sm">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="text-sm mt-0.5 opacity-90">{{ toast.message }}</p>
            }
          </div>
          <button (click)="toastService.dismiss(toast.id)"
                  class="text-current opacity-60 hover:opacity-100 transition-opacity p-1"
                  aria-label="Fechar notificação">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  getToastClasses(type: string): string {
    const base = 'border';
    switch (type) {
      case 'success':
        return `${base} bg-accent-50 border-accent-500 text-accent-700`;
      case 'error':
        return `${base} bg-red-50 border-red-500 text-red-700`;
      case 'warning':
        return `${base} bg-amber-50 border-amber-500 text-amber-700`;
      case 'info':
        return `${base} bg-brand-50 border-brand-500 text-brand-700`;
      default:
        return `${base} bg-white border-gray-200 text-gray-700`;
    }
  }
}

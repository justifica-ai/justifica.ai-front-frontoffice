import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { VehicleService } from '../../services/vehicle.service';
import type { Vehicle } from '../../../../core/models/vehicle.model';

@Component({
  selector: 'app-delete-vehicle-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-40 bg-black/50 transition-opacity"
      role="presentation"
      (click)="close.emit()"
      (keydown.escape)="close.emit()"
    ></div>

    <!-- Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-vehicle-title"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up"
        (click)="$event.stopPropagation()"
      >
        <div class="p-6 text-center">
          <!-- Warning icon -->
          <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-error-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 id="delete-vehicle-title" class="text-lg font-bold text-gray-800 mb-2">
            Remover veículo?
          </h2>
          <p class="text-sm text-gray-600 mb-1">
            Tem certeza que deseja remover o veículo com placa
          </p>
          <p class="text-base font-bold text-gray-800 mb-4 tracking-wider">
            {{ vehicle().plate }}
          </p>
          @if (vehicle().nickname) {
            <p class="text-sm text-gray-500 mb-4">({{ vehicle().nickname }})</p>
          }
          <p class="text-xs text-gray-400 mb-6">
            Esta ação não pode ser desfeita.
          </p>

          <div class="flex gap-3 justify-center">
            <button
              type="button"
              (click)="close.emit()"
              [disabled]="deleting()"
              class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="onConfirm()"
              [disabled]="deleting()"
              class="px-6 py-2.5 bg-error-500 text-white rounded-xl font-semibold text-sm hover:bg-error-600 focus-visible:ring-2 focus-visible:ring-error-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              @if (deleting()) {
                <span class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Removendo...
                </span>
              } @else {
                Sim, remover
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DeleteVehicleModalComponent {
  private readonly vehicleService = inject(VehicleService);

  vehicle = input.required<Vehicle>();
  close = output<void>();
  deleted = output<void>();

  readonly deleting = signal(false);

  async onConfirm(): Promise<void> {
    this.deleting.set(true);

    try {
      const success = await this.vehicleService.deleteVehicle(this.vehicle().id);
      if (success) {
        this.deleted.emit();
      }
    } finally {
      this.deleting.set(false);
    }
  }
}

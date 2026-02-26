import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { VehicleService } from '../../services/vehicle.service';
import { VehicleFormModalComponent } from '../../components/vehicle-form-modal/vehicle-form-modal.component';
import { DeleteVehicleModalComponent } from '../../components/delete-vehicle-modal/delete-vehicle-modal.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import type { Vehicle } from '../../../../core/models/vehicle.model';

@Component({
  selector: 'app-my-vehicles',
  standalone: true,
  imports: [
    VehicleFormModalComponent,
    DeleteVehicleModalComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Meus Veículos</h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ vehicleService.total() }} de 10 veículos cadastrados
          </p>
        </div>
        <button
          type="button"
          (click)="openCreateModal()"
          [disabled]="vehicleService.hasReachedLimit()"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          [attr.title]="vehicleService.hasReachedLimit() ? 'Limite de 10 veículos atingido' : 'Adicionar novo veículo'"
          [attr.aria-label]="vehicleService.hasReachedLimit() ? 'Limite de 10 veículos atingido' : 'Adicionar novo veículo'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Adicionar veículo
        </button>
      </div>

      <!-- Loading -->
      @if (vehicleService.loading()) {
        <div class="space-y-4">
          @for (_ of [1, 2, 3]; track $index) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div class="flex items-center gap-4">
                <app-skeleton-loader width="80px" height="32px" />
                <div class="flex-1 space-y-2">
                  <app-skeleton-loader width="60%" height="16px" />
                  <app-skeleton-loader width="40%" height="14px" />
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!vehicleService.loading() && vehicleService.total() === 0) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <app-empty-state
            title="Nenhum veículo cadastrado"
            description="Adicione um veículo para agilizar o preenchimento dos seus recursos."
          >
            <button
              type="button"
              (click)="openCreateModal()"
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Adicionar veículo
            </button>
          </app-empty-state>
        </div>
      }

      <!-- Error -->
      @if (vehicleService.error()) {
        <div class="bg-error-50 border border-error-200 rounded-xl p-4 mb-4" role="alert">
          <div class="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-error-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-sm text-error-600">{{ vehicleService.error() }}</p>
            <button
              type="button"
              (click)="vehicleService.loadVehicles()"
              class="ml-auto text-sm font-semibold text-error-600 hover:text-error-700 underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      }

      <!-- Vehicle List — Mobile Cards -->
      @if (!vehicleService.loading() && vehicleService.total() > 0) {
        <div class="space-y-3 md:hidden">
          @for (v of vehicleService.vehicles(); track v.id) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <!-- Plate badge -->
                  <div class="px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
                    <span class="text-sm font-mono font-bold text-gray-800 tracking-wider">
                      {{ v.plate }}
                    </span>
                  </div>
                  <div>
                    @if (v.nickname) {
                      <p class="text-sm font-semibold text-gray-800">{{ v.nickname }}</p>
                    }
                    @if (v.brand || v.model) {
                      <p class="text-xs text-gray-500">
                        {{ formatVehicleName(v) }}
                        @if (v.year) { · {{ v.year }} }
                      </p>
                    }
                  </div>
                </div>
                @if (v.isDefault) {
                  <span class="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full">
                    Padrão
                  </span>
                }
              </div>

              <!-- Card Actions -->
              <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                @if (!v.isDefault) {
                  <button
                    type="button"
                    (click)="onSetDefault(v)"
                    class="text-xs text-brand-600 font-semibold hover:text-brand-700 transition-colors"
                    [attr.aria-label]="'Definir ' + v.plate + ' como padrão'"
                  >
                    Definir padrão
                  </button>
                  <span class="text-gray-300">·</span>
                }
                <button
                  type="button"
                  (click)="openEditModal(v)"
                  class="text-xs text-gray-600 font-semibold hover:text-gray-700 transition-colors"
                  [attr.aria-label]="'Editar veículo ' + v.plate"
                >
                  Editar
                </button>
                <span class="text-gray-300">·</span>
                <button
                  type="button"
                  (click)="openDeleteModal(v)"
                  class="text-xs text-error-500 font-semibold hover:text-error-600 transition-colors"
                  [attr.aria-label]="'Remover veículo ' + v.plate"
                >
                  Remover
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Vehicle List — Desktop Table -->
        <div class="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table class="w-full" aria-label="Lista de veículos">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th scope="col" class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Placa</th>
                <th scope="col" class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Veículo</th>
                <th scope="col" class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Ano</th>
                <th scope="col" class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Cor</th>
                <th scope="col" class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th scope="col" class="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  <span class="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (v of vehicleService.vehicles(); track v.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3">
                    <span class="text-sm font-mono font-bold text-gray-800 tracking-wider">
                      {{ v.plate }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div>
                      @if (v.nickname) {
                        <p class="text-sm font-semibold text-gray-800">{{ v.nickname }}</p>
                      }
                      @if (v.brand || v.model) {
                        <p class="text-sm text-gray-500">
                          {{ formatVehicleName(v) }}
                        </p>
                      }
                      @if (!v.nickname && !v.brand && !v.model) {
                        <span class="text-sm text-gray-400 italic">—</span>
                      }
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    {{ v.year ?? '—' }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    {{ v.color ?? '—' }}
                  </td>
                  <td class="px-4 py-3">
                    @if (v.isDefault) {
                      <span class="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full">
                        Padrão
                      </span>
                    } @else {
                      <button
                        type="button"
                        (click)="onSetDefault(v)"
                        class="text-xs text-brand-600 font-semibold hover:text-brand-700 hover:underline transition-colors"
                        [attr.aria-label]="'Definir ' + v.plate + ' como padrão'"
                      >
                        Definir padrão
                      </button>
                    }
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        (click)="openEditModal(v)"
                        class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        [attr.aria-label]="'Editar veículo ' + v.plate"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        (click)="openDeleteModal(v)"
                        class="p-1.5 text-gray-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors"
                        [attr.aria-label]="'Remover veículo ' + v.plate"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Form Modal -->
    @if (showFormModal()) {
      <app-vehicle-form-modal
        [vehicle]="editingVehicle()"
        (close)="closeFormModal()"
        (saved)="onVehicleSaved()"
      />
    }

    <!-- Delete Modal -->
    @if (showDeleteModal() && deletingVehicle()) {
      <app-delete-vehicle-modal
        [vehicle]="deletingVehicle()!"
        (close)="closeDeleteModal()"
        (deleted)="onVehicleDeleted()"
      />
    }
  `,
})
export class MyVehiclesComponent implements OnInit {
  protected readonly vehicleService = inject(VehicleService);

  readonly showFormModal = signal(false);
  readonly showDeleteModal = signal(false);
  readonly editingVehicle = signal<Vehicle | null>(null);
  readonly deletingVehicle = signal<Vehicle | null>(null);

  ngOnInit(): void {
    this.vehicleService.loadVehicles();
  }

  openCreateModal(): void {
    this.editingVehicle.set(null);
    this.showFormModal.set(true);
  }

  openEditModal(vehicle: Vehicle): void {
    this.editingVehicle.set(vehicle);
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingVehicle.set(null);
  }

  onVehicleSaved(): void {
    this.closeFormModal();
  }

  openDeleteModal(vehicle: Vehicle): void {
    this.deletingVehicle.set(vehicle);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deletingVehicle.set(null);
  }

  onVehicleDeleted(): void {
    this.closeDeleteModal();
  }

  async onSetDefault(vehicle: Vehicle): Promise<void> {
    await this.vehicleService.setDefaultVehicle(vehicle.id);
  }

  formatVehicleName(v: Vehicle): string {
    return [v.brand, v.model].filter((x) => !!x).join(' ');
  }
}

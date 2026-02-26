import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { ToastService } from '../../../core/services/toast.service';
import type {
  Vehicle,
  VehicleListResponse,
  CreateVehicleInput,
  UpdateVehicleInput,
} from '../../../core/models/vehicle.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  private readonly _vehicles = signal<Vehicle[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly vehicles = this._vehicles.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly total = computed(() => this._vehicles().length);
  readonly hasReachedLimit = computed(() => this._vehicles().length >= 10);
  readonly defaultVehicle = computed(() => this._vehicles().find((v) => v.isDefault) ?? null);

  async loadVehicles(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<VehicleListResponse>(
          `${environment.apiUrl}${API_ROUTES.VEHICLES.BASE}`,
        ),
      );
      this._vehicles.set(response.vehicles);
    } catch {
      this._error.set('Erro ao carregar veículos. Tente novamente.');
      this.toast.error('Erro ao carregar veículos', 'Não foi possível obter a lista de veículos.');
    } finally {
      this._loading.set(false);
    }
  }

  async createVehicle(input: CreateVehicleInput): Promise<Vehicle | null> {
    try {
      const vehicle = await firstValueFrom(
        this.http.post<Vehicle>(
          `${environment.apiUrl}${API_ROUTES.VEHICLES.BASE}`,
          input,
        ),
      );
      await this.loadVehicles();
      this.toast.success('Veículo cadastrado', `Placa ${vehicle.plate} adicionado com sucesso.`);
      return vehicle;
    } catch {
      this.toast.error('Erro ao cadastrar veículo', 'Verifique os dados e tente novamente.');
      return null;
    }
  }

  async updateVehicle(id: string, input: UpdateVehicleInput): Promise<Vehicle | null> {
    try {
      const vehicle = await firstValueFrom(
        this.http.patch<Vehicle>(
          `${environment.apiUrl}${API_ROUTES.VEHICLES.BY_ID(id)}`,
          input,
        ),
      );
      await this.loadVehicles();
      this.toast.success('Veículo atualizado', 'Os dados do veículo foram atualizados.');
      return vehicle;
    } catch {
      this.toast.error('Erro ao atualizar veículo', 'Não foi possível salvar as alterações.');
      return null;
    }
  }

  async deleteVehicle(id: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.delete<{ message: string }>(
          `${environment.apiUrl}${API_ROUTES.VEHICLES.BY_ID(id)}`,
        ),
      );
      await this.loadVehicles();
      this.toast.success('Veículo removido', 'O veículo foi removido da sua conta.');
      return true;
    } catch {
      this.toast.error('Erro ao remover veículo', 'Não foi possível remover o veículo.');
      return false;
    }
  }

  async setDefaultVehicle(id: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.patch<Vehicle>(
          `${environment.apiUrl}${API_ROUTES.VEHICLES.SET_DEFAULT(id)}`,
          {},
        ),
      );
      await this.loadVehicles();
      this.toast.success('Veículo padrão', 'O veículo padrão foi alterado.');
      return true;
    } catch {
      this.toast.error('Erro ao definir padrão', 'Não foi possível alterar o veículo padrão.');
      return false;
    }
  }
}

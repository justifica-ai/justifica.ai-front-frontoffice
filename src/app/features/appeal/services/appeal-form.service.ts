import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { ToastService } from '../../../core/services/toast.service';
import {
  AppealFormState,
  AppealType,
  APPEAL_FORM_STORAGE_KEY,
  createEmptyFormState,
  UploadedFile,
} from '../models/appeal-form.model';

interface CreateAppealResponse {
  id: string;
  status: string;
  appealType: string;
  createdAt: string;
}

interface UploadResponse {
  fileId: string;
  r2Key: string;
}

@Injectable()
export class AppealFormService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  // ─── State ───

  private readonly _formState = signal<AppealFormState>(createEmptyFormState('first_instance'));
  private readonly _isSaving = signal(false);
  private readonly _lastSaveError = signal<string | null>(null);

  readonly formState = this._formState.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly lastSaveError = this._lastSaveError.asReadonly();

  readonly currentStep = computed(() => this._formState().currentStep);
  readonly appealId = computed(() => this._formState().appealId);
  readonly lastSavedAt = computed(() => this._formState().lastSavedAt);

  // ─── Auto-save timer ───

  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private static readonly AUTO_SAVE_INTERVAL_MS = 30_000;

  // ─── Lifecycle ───

  ngOnDestroy(): void {
    this.stopAutoSave();
  }

  // ─── Initialization ───

  initialize(appealType: AppealType): void {
    const saved = this.loadFromLocalStorage();

    if (saved && saved.appealType === appealType) {
      this._formState.set(saved);
    } else {
      this._formState.set(createEmptyFormState(appealType));
    }

    this.startAutoSave();
  }

  // ─── Step navigation ───

  goToStep(step: number): void {
    if (step < 0 || step > 4) return;
    this.updateState({ currentStep: step });
  }

  nextStep(): void {
    const current = this._formState().currentStep;
    if (current < 4) {
      this.goToStep(current + 1);
    }
  }

  previousStep(): void {
    const current = this._formState().currentStep;
    if (current > 0) {
      this.goToStep(current - 1);
    }
  }

  // ─── Partial state updates ───

  updateVehicle(data: Partial<AppealFormState['vehicle']>): void {
    const current = this._formState();
    this.updateState({ vehicle: { ...current.vehicle, ...data } });
  }

  updateInfraction(data: Partial<AppealFormState['infraction']>): void {
    const current = this._formState();
    this.updateState({ infraction: { ...current.infraction, ...data } });
  }

  updateDriver(data: Partial<AppealFormState['driver']>): void {
    const current = this._formState();
    this.updateState({ driver: { ...current.driver, ...data } });
  }

  updateArguments(data: Partial<AppealFormState['arguments']>): void {
    const current = this._formState();
    this.updateState({ arguments: { ...current.arguments, ...data } });
  }

  addUploadedFile(file: UploadedFile): void {
    const current = this._formState();
    this.updateState({ uploadedFiles: [...current.uploadedFiles, file] });
  }

  updateUploadedFile(fileId: string, updates: Partial<UploadedFile>): void {
    const current = this._formState();
    const files = current.uploadedFiles.map((f) =>
      f.id === fileId ? { ...f, ...updates } : f,
    );
    this.updateState({ uploadedFiles: files });
  }

  removeUploadedFile(fileId: string): void {
    const current = this._formState();
    this.updateState({
      uploadedFiles: current.uploadedFiles.filter((f) => f.id !== fileId),
    });
  }

  // ─── API: Create appeal draft ───

  async createDraft(): Promise<string | null> {
    const state = this._formState();

    if (state.appealId) return state.appealId;

    try {
      const response = await this.http
        .post<CreateAppealResponse>(`${environment.apiUrl}${API_ROUTES.APPEALS.BASE}`, {
          appealType: state.appealType,
          vehicleId: state.vehicle.vehicleId ?? undefined,
        })
        .toPromise();

      if (response?.id) {
        this.updateState({ appealId: response.id });
        return response.id;
      }

      return null;
    } catch {
      this.toast.error('Erro ao criar rascunho. Tente novamente.');
      return null;
    }
  }

  // ─── API: Sync form data to backend ───

  async syncToApi(): Promise<boolean> {
    const state = this._formState();

    if (!state.appealId) {
      const id = await this.createDraft();
      if (!id) return false;
    }

    this._isSaving.set(true);
    this._lastSaveError.set(null);

    try {
      const appealId = this._formState().appealId!;
      const formData = this.buildFormDataPayload(state);

      await this.http
        .patch(`${environment.apiUrl}${API_ROUTES.APPEALS.BY_ID(appealId)}`, { formData })
        .toPromise();

      const now = new Date().toISOString();
      this.updateState({ lastSavedAt: now });
      this.saveToLocalStorage();
      return true;
    } catch {
      this._lastSaveError.set('Erro ao salvar no servidor');
      return false;
    } finally {
      this._isSaving.set(false);
    }
  }

  // ─── API: Request file upload ───

  async requestUpload(
    file: File,
  ): Promise<{ fileId: string; r2Key: string } | null> {
    const state = this._formState();

    if (!state.appealId) {
      const id = await this.createDraft();
      if (!id) return null;
    }

    const appealId = this._formState().appealId!;

    try {
      const response = await this.http
        .post<UploadResponse>(
          `${environment.apiUrl}${API_ROUTES.APPEALS.BY_ID(appealId)}/upload`,
          {
            filename: file.name,
            contentType: file.type,
            sizeBytes: file.size,
          },
        )
        .toPromise();

      return response ?? null;
    } catch {
      this.toast.error('Erro ao preparar upload. Tente novamente.');
      return null;
    }
  }

  // ─── Manual save (button click) ───

  async saveNow(): Promise<void> {
    this.saveToLocalStorage();
    await this.syncToApi();
  }

  // ─── localStorage ───

  private saveToLocalStorage(): void {
    try {
      const state = this._formState();
      localStorage.setItem(APPEAL_FORM_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota exceeded or not available — ignore silently
    }
  }

  private loadFromLocalStorage(): AppealFormState | null {
    try {
      const raw = localStorage.getItem(APPEAL_FORM_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AppealFormState;
    } catch {
      return null;
    }
  }

  clearLocalStorage(): void {
    try {
      localStorage.removeItem(APPEAL_FORM_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  // ─── Auto-save ───

  private startAutoSave(): void {
    this.stopAutoSave();
    this.autoSaveInterval = setInterval(() => {
      this.saveToLocalStorage();
      if (this._formState().appealId) {
        this.syncToApi();
      }
    }, AppealFormService.AUTO_SAVE_INTERVAL_MS);
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // ─── Helpers ───

  private updateState(partial: Partial<AppealFormState>): void {
    this._formState.update((current) => ({ ...current, ...partial }));
    this.saveToLocalStorage();
  }

  private buildFormDataPayload(
    state: AppealFormState,
  ): Record<string, unknown> {
    return {
      vehicle: state.vehicle,
      infraction: state.infraction,
      driver: state.driver,
      arguments: state.arguments,
      uploadedFiles: state.uploadedFiles
        .filter((f) => f.status === 'done')
        .map((f) => ({ id: f.id, name: f.name, r2Key: f.r2Key })),
    };
  }
}

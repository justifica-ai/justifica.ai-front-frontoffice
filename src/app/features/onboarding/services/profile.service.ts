import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ROUTES } from '../../../core/constants/api-routes';
import type { UserProfile, CommunicationPreferences, UserSession, ChangePasswordInput } from '../../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  private readonly _profile = signal<UserProfile | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly onboardingCompleted = computed(() => this._profile()?.onboardingCompleted ?? false);

  async loadProfile(): Promise<UserProfile> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const profile = await firstValueFrom(
        this.http.get<UserProfile>(
          `${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`,
        ),
      );
      this._profile.set(profile);
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar perfil';
      this._error.set(message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async updateProfile(data: Partial<Pick<UserProfile, 'fullName' | 'phone' | 'onboardingCompleted'>>): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch<UserProfile>(
          `${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`,
          data,
        ),
      );
      const current = this._profile();
      if (current) {
        this._profile.set({ ...current, ...data });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      this._error.set(message);
      throw error;
    }
  }

  async updatePreferences(preferences: CommunicationPreferences): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(
          `${environment.apiUrl}${API_ROUTES.PROFILE.PREFERENCES}`,
          preferences,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar preferências';
      this._error.set(message);
      throw error;
    }
  }

  async changePassword(input: ChangePasswordInput): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(
          `${environment.apiUrl}${API_ROUTES.PROFILE.CHANGE_PASSWORD}`,
          input,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao alterar senha';
      this._error.set(message);
      throw error;
    }
  }

  async loadSessions(): Promise<UserSession[]> {
    try {
      const sessions = await firstValueFrom(
        this.http.get<UserSession[]>(
          `${environment.apiUrl}${API_ROUTES.PROFILE.SESSIONS}`,
        ),
      );
      return sessions;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar sessões';
      this._error.set(message);
      throw error;
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(
          `${environment.apiUrl}${API_ROUTES.PROFILE.SESSION_BY_ID(sessionId)}`,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao encerrar sessão';
      this._error.set(message);
      throw error;
    }
  }

  async requestDataExport(): Promise<{ message: string }> {
    try {
      const result = await firstValueFrom(
        this.http.post<{ message: string }>(
          `${environment.apiUrl}${API_ROUTES.PROFILE.DATA_EXPORT}`,
          {},
        ),
      );
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao solicitar exportação de dados';
      this._error.set(message);
      throw error;
    }
  }

  async downloadDataExport(): Promise<Blob> {
    try {
      const blob = await firstValueFrom(
        this.http.get(
          `${environment.apiUrl}${API_ROUTES.PROFILE.DATA_EXPORT_DOWNLOAD}`,
          { responseType: 'blob' },
        ),
      );
      return blob;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao baixar exportação de dados';
      this._error.set(message);
      throw error;
    }
  }

  async requestDeletion(password: string): Promise<{ message: string }> {
    try {
      const result = await firstValueFrom(
        this.http.post<{ message: string }>(
          `${environment.apiUrl}${API_ROUTES.PROFILE.DELETE_REQUEST}`,
          { password },
        ),
      );
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao solicitar exclusão de conta';
      this._error.set(message);
      throw error;
    }
  }

  async cancelDeletion(): Promise<{ message: string }> {
    try {
      const result = await firstValueFrom(
        this.http.delete<{ message: string }>(
          `${environment.apiUrl}${API_ROUTES.PROFILE.DELETE_REQUEST}`,
        ),
      );
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cancelar exclusão de conta';
      this._error.set(message);
      throw error;
    }
  }

  async revokeConsent(consentType: string): Promise<{ message: string }> {
    try {
      const result = await firstValueFrom(
        this.http.post<{ message: string }>(
          `${environment.apiUrl}${API_ROUTES.PROFILE.REVOKE_CONSENT}`,
          { consentType },
        ),
      );
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao revogar consentimento';
      this._error.set(message);
      throw error;
    }
  }
}

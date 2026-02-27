import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../../onboarding/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { UserStatus } from '../../../../core/models/user.model';

@Component({
  selector: 'app-privacy-settings',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      <!-- LGPD Info -->
      <section>
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Seus direitos (LGPD)</h2>
        <p class="text-sm text-gray-600 leading-relaxed">
          De acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a
          acessar, corrigir, exportar e solicitar a exclusão dos seus dados pessoais a qualquer momento.
        </p>
      </section>

      <!-- Consent Management -->
      <section>
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Consentimento de marketing</h2>
        <p class="text-sm text-gray-600 mb-4">
          Gerencie seu consentimento para receber comunicações de marketing por e-mail, SMS e WhatsApp.
        </p>
        @if (loading()) {
          <div class="h-10 w-48 bg-gray-200 animate-pulse rounded-lg" aria-hidden="true"></div>
        } @else if (hasMarketingConsent()) {
          <button
            type="button"
            class="h-11 px-6 rounded-lg font-semibold text-sm text-warning-700 border border-warning-300 hover:bg-warning-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning-500 disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="revokingConsent()"
            (click)="onRevokeConsent()">
            @if (revokingConsent()) {
              Revogando...
            } @else {
              Revogar consentimento de marketing
            }
          </button>
        } @else {
          <p class="text-sm text-gray-500 italic">
            Nenhum consentimento de marketing ativo. Você pode reativar nas
            <a class="text-brand-600 hover:text-brand-700 underline" routerLink="/profile/communication">configurações de comunicação</a>.
          </p>
        }
      </section>

      <!-- Export Data -->
      <section class="border-t border-gray-200 pt-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Exportar meus dados</h2>
        <p class="text-sm text-gray-600 mb-4">
          Solicite uma cópia de todos os seus dados pessoais. O arquivo ficará disponível por 48 horas.
        </p>
        <button
          type="button"
          class="h-11 px-6 rounded-lg font-semibold text-sm text-brand-700 border border-brand-300 hover:bg-brand-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
          [disabled]="exporting()"
          (click)="onExportData()">
          @if (exporting()) {
            Exportando...
          } @else {
            Exportar meus dados
          }
        </button>
      </section>

      <!-- Delete Account -->
      <section class="border-t border-gray-200 pt-8">
        @if (isPendingDeletion()) {
          <div class="p-4 bg-warning-50 border border-warning-200 rounded-lg space-y-4" role="alert" aria-label="Conta com exclusão pendente">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-warning-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div>
                <h2 class="text-lg font-semibold text-warning-800">Exclusão de conta solicitada</h2>
                <p class="text-sm text-warning-700 mt-1">
                  Sua conta está programada para exclusão permanente após 7 dias da solicitação.
                  Você pode cancelar a exclusão a qualquer momento antes do prazo.
                </p>
              </div>
            </div>
            <button
              type="button"
              class="h-11 px-6 rounded-lg font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="cancelling()"
              (click)="onCancelDeletion()">
              @if (cancelling()) {
                Cancelando...
              } @else {
                Cancelar exclusão da conta
              }
            </button>
          </div>
        } @else {
          <h2 class="text-lg font-semibold text-error-700 mb-2">Excluir minha conta</h2>
          <p class="text-sm text-gray-600 mb-4">
            Ao solicitar a exclusão, seus dados serão permanentemente removidos após 7 dias.
            Você poderá cancelar durante esse período.
          </p>

          @if (!showDeleteConfirm()) {
            <button
              type="button"
              class="h-11 px-6 rounded-lg font-semibold text-sm text-error-600 border border-error-300 hover:bg-error-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-500"
              (click)="showDeleteConfirm.set(true)">
              Solicitar exclusão
            </button>
          } @else {
            <div class="p-4 bg-error-50 border border-error-200 rounded-lg space-y-4" role="alertdialog" aria-label="Confirmar exclusão de conta">
              <p class="text-sm font-medium text-error-800">
                Para confirmar a exclusão, digite sua senha atual:
              </p>
              <div>
                <label for="delete-password" class="block text-sm font-medium text-gray-700 mb-1">
                  Senha <span class="text-error-500" aria-hidden="true">*</span>
                  <span class="sr-only">(obrigatório)</span>
                </label>
                <input
                  id="delete-password"
                  type="password"
                  [formControl]="passwordControl"
                  class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-2 focus:outline-brand-500 focus:border-brand-500 transition-colors"
                  placeholder="Digite sua senha"
                  autocomplete="current-password"
                  aria-describedby="delete-password-hint" />
                <p id="delete-password-hint" class="mt-1 text-xs text-gray-500">
                  Sua senha é necessária para confirmar a exclusão da conta.
                </p>
              </div>
              <div class="flex gap-3">
                <button
                  type="button"
                  class="h-10 px-5 rounded-lg font-semibold text-sm text-white bg-error-600 hover:bg-error-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  [disabled]="deleting() || passwordControl.invalid"
                  (click)="onRequestDeletion()">
                  @if (deleting()) {
                    Solicitando...
                  } @else {
                    Confirmar exclusão
                  }
                </button>
                <button
                  type="button"
                  class="h-10 px-5 rounded-lg font-semibold text-sm text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
                  [disabled]="deleting()"
                  (click)="onCancelDeleteForm()">
                  Cancelar
                </button>
              </div>
            </div>
          }
        }
      </section>
    </div>
  `,
})
export class PrivacySettingsComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly exporting = signal(false);
  readonly deleting = signal(false);
  readonly cancelling = signal(false);
  readonly revokingConsent = signal(false);
  readonly showDeleteConfirm = signal(false);
  readonly userStatus = signal<UserStatus>('active');
  readonly hasMarketingConsent = signal(false);

  readonly isPendingDeletion = computed(() => this.userStatus() === 'pending_deletion');

  readonly passwordControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  async ngOnInit(): Promise<void> {
    try {
      let profile = this.profileService.profile();
      if (!profile) {
        profile = await this.profileService.loadProfile();
      }
      this.userStatus.set((profile.status as UserStatus) ?? 'active');
      const prefs = profile.communicationPreferences;
      this.hasMarketingConsent.set(
        !!(prefs?.emailMarketing || prefs?.sms || prefs?.whatsapp),
      );
    } catch {
      this.toast.error('Erro ao carregar dados de privacidade.');
    } finally {
      this.loading.set(false);
    }
  }

  async onExportData(): Promise<void> {
    this.exporting.set(true);

    try {
      await this.profileService.requestDataExport();
      const blob = await this.profileService.downloadDataExport();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'meus-dados-justifica-ai.json';
      anchor.click();
      URL.revokeObjectURL(url);
      this.toast.success('Dados exportados com sucesso!');
    } catch {
      this.toast.error('Erro ao exportar dados. Tente novamente.');
    } finally {
      this.exporting.set(false);
    }
  }

  async onRequestDeletion(): Promise<void> {
    if (this.passwordControl.invalid) return;

    this.deleting.set(true);

    try {
      await this.profileService.requestDeletion(this.passwordControl.value);
      this.userStatus.set('pending_deletion');
      this.showDeleteConfirm.set(false);
      this.passwordControl.reset();
      this.toast.success('Solicitação de exclusão registrada. Você tem 7 dias para cancelar.');
    } catch {
      this.toast.error('Erro ao solicitar exclusão. Verifique sua senha e tente novamente.');
    } finally {
      this.deleting.set(false);
    }
  }

  async onCancelDeletion(): Promise<void> {
    this.cancelling.set(true);

    try {
      await this.profileService.cancelDeletion();
      this.userStatus.set('active');
      this.toast.success('Exclusão cancelada. Sua conta foi reativada.');
    } catch {
      this.toast.error('Erro ao cancelar exclusão. Tente novamente.');
    } finally {
      this.cancelling.set(false);
    }
  }

  async onRevokeConsent(): Promise<void> {
    this.revokingConsent.set(true);

    try {
      await this.profileService.revokeConsent('marketing_consent');
      this.hasMarketingConsent.set(false);
      this.toast.success('Consentimento de marketing revogado com sucesso.');
    } catch {
      this.toast.error('Erro ao revogar consentimento. Tente novamente.');
    } finally {
      this.revokingConsent.set(false);
    }
  }

  onCancelDeleteForm(): void {
    this.showDeleteConfirm.set(false);
    this.passwordControl.reset();
  }
}

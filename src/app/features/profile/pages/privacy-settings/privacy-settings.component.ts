import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../../../onboarding/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-privacy-settings',
  standalone: true,
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

      <!-- Export Data -->
      <section>
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Exportar meus dados</h2>
        <p class="text-sm text-gray-600 mb-4">
          Baixe uma cópia de todos os seus dados pessoais em formato JSON.
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
        <h2 class="text-lg font-semibold text-error-700 mb-2">Excluir minha conta</h2>
        <p class="text-sm text-gray-600 mb-4">
          Ao solicitar a exclusão, todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
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
              Tem certeza que deseja excluir sua conta? Todos os dados serão perdidos permanentemente.
            </p>
            <div class="flex gap-3">
              <button
                type="button"
                class="h-10 px-5 rounded-lg font-semibold text-sm text-white bg-error-600 hover:bg-error-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-500 disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="deleting()"
                (click)="onDeleteAccount()">
                @if (deleting()) {
                  Excluindo...
                } @else {
                  Sim, excluir minha conta
                }
              </button>
              <button
                type="button"
                class="h-10 px-5 rounded-lg font-semibold text-sm text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
                [disabled]="deleting()"
                (click)="showDeleteConfirm.set(false)">
                Cancelar
              </button>
            </div>
          </div>
        }
      </section>
    </div>
  `,
})
export class PrivacySettingsComponent {
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly exporting = signal(false);
  readonly deleting = signal(false);
  readonly showDeleteConfirm = signal(false);

  async onExportData(): Promise<void> {
    this.exporting.set(true);

    try {
      const blob = await this.profileService.exportData();
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

  async onDeleteAccount(): Promise<void> {
    this.deleting.set(true);

    try {
      await this.profileService.deleteAccount();
      this.toast.success('Conta excluída. Você será redirecionado.');
      await this.router.navigate(['/']);
    } catch {
      this.toast.error('Erro ao excluir conta. Tente novamente.');
    } finally {
      this.deleting.set(false);
    }
  }
}

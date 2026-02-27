import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ProfileService } from '../../../onboarding/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { CommunicationPreferences } from '../../../../core/models/user.model';

@Component({
  selector: 'app-communication',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <p class="text-sm text-gray-600">
        Escolha como deseja receber novidades e atualizações sobre seus recursos.
      </p>

      @if (loading()) {
        <div class="animate-pulse space-y-4">
          <div class="h-14 bg-gray-200 rounded-lg"></div>
          <div class="h-14 bg-gray-200 rounded-lg"></div>
          <div class="h-14 bg-gray-200 rounded-lg"></div>
        </div>
      } @else {
        <div class="space-y-3" role="group" aria-label="Preferências de comunicação">
          <!-- Email Marketing -->
          <label
            for="emailMarketing"
            class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <div>
              <p class="text-sm font-medium text-gray-800">E-mail de novidades</p>
              <p class="text-xs text-gray-500">Receba promoções e novidades por e-mail</p>
            </div>
            <div class="relative">
              <input
                id="emailMarketing"
                type="checkbox"
                class="sr-only peer"
                [checked]="preferences().emailMarketing"
                [disabled]="saving()"
                (change)="onToggle('emailMarketing', $event)" />
              <div
                class="w-11 h-6 bg-gray-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500 rounded-full peer-checked:bg-brand-600 transition-colors"
                aria-hidden="true">
              </div>
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"
                aria-hidden="true">
              </div>
            </div>
          </label>

          <!-- WhatsApp -->
          <label
            for="whatsapp"
            class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <div>
              <p class="text-sm font-medium text-gray-800">WhatsApp</p>
              <p class="text-xs text-gray-500">Receba atualizações por WhatsApp</p>
            </div>
            <div class="relative">
              <input
                id="whatsapp"
                type="checkbox"
                class="sr-only peer"
                [checked]="preferences().whatsapp"
                [disabled]="saving()"
                (change)="onToggle('whatsapp', $event)" />
              <div
                class="w-11 h-6 bg-gray-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500 rounded-full peer-checked:bg-brand-600 transition-colors"
                aria-hidden="true">
              </div>
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"
                aria-hidden="true">
              </div>
            </div>
          </label>

          <!-- SMS -->
          <label
            for="sms"
            class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <div>
              <p class="text-sm font-medium text-gray-800">SMS</p>
              <p class="text-xs text-gray-500">Receba notificações por SMS</p>
            </div>
            <div class="relative">
              <input
                id="sms"
                type="checkbox"
                class="sr-only peer"
                [checked]="preferences().sms"
                [disabled]="saving()"
                (change)="onToggle('sms', $event)" />
              <div
                class="w-11 h-6 bg-gray-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500 rounded-full peer-checked:bg-brand-600 transition-colors"
                aria-hidden="true">
              </div>
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"
                aria-hidden="true">
              </div>
            </div>
          </label>
        </div>
      }
    </div>
  `,
})
export class CommunicationComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly preferences = signal<CommunicationPreferences>({
    emailMarketing: false,
    whatsapp: false,
    sms: false,
  });

  async ngOnInit(): Promise<void> {
    try {
      const profile = this.profileService.profile() ?? await this.profileService.loadProfile();
      if (profile.communicationPreferences) {
        this.preferences.set(profile.communicationPreferences);
      }
    } catch {
      this.toast.error('Erro ao carregar preferências.');
    } finally {
      this.loading.set(false);
    }
  }

  async onToggle(key: keyof CommunicationPreferences, event: Event): Promise<void> {
    const checked = (event.target as HTMLInputElement).checked;
    const updated = { ...this.preferences(), [key]: checked };
    this.preferences.set(updated);
    this.saving.set(true);

    try {
      await this.profileService.updatePreferences(updated);
      this.toast.success('Preferências atualizadas!');
    } catch {
      this.preferences.update((prev) => ({ ...prev, [key]: !checked }));
      this.toast.error('Erro ao atualizar preferências.');
    } finally {
      this.saving.set(false);
    }
  }
}

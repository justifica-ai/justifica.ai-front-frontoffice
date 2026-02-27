import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../../onboarding/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="animate-pulse space-y-4">
          <div class="h-11 bg-gray-200 rounded-lg"></div>
          <div class="h-11 bg-gray-200 rounded-lg"></div>
          <div class="h-11 bg-gray-200 rounded-lg"></div>
        </div>
      } @else {
        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Full Name -->
          <div>
            <label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">
              Nome completo <span class="text-error-500">*</span>
              <span class="sr-only">(obrigatório)</span>
            </label>
            <input
              id="fullName"
              formControlName="fullName"
              type="text"
              class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              [class.border-error-500]="showError('fullName')" />
            @if (showError('fullName')) {
              <p class="mt-1 text-xs text-error-500" role="alert">Nome é obrigatório</p>
            }
          </div>

          <!-- Email (read-only) -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              E-mail
              <span class="ml-1 text-gray-400" title="Campo não editável">🔒</span>
            </label>
            <input
              id="email"
              formControlName="email"
              type="email"
              class="w-full h-11 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed" />
          </div>

          <!-- CPF (read-only, masked) -->
          <div>
            <label for="cpf" class="block text-sm font-medium text-gray-700 mb-1">
              CPF
              <span class="ml-1 text-gray-400" title="Campo não editável">🔒</span>
            </label>
            <input
              id="cpf"
              type="text"
              [value]="cpfMasked()"
              readonly
              class="w-full h-11 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed" />
          </div>

          <!-- Phone -->
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              id="phone"
              formControlName="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              maxlength="15"
              class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              (input)="onPhoneInput($event)" />
          </div>

          <!-- Submit -->
          <div class="pt-2">
            <button
              type="submit"
              class="h-11 px-6 rounded-lg font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="saving() || profileForm.pristine">
              @if (saving()) {
                Salvando...
              } @else {
                Salvar alterações
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
})
export class EditProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly cpfMasked = signal('•••.•••.•••-••');

  readonly profileForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: [{ value: '', disabled: true }],
    phone: [''],
  });

  async ngOnInit(): Promise<void> {
    try {
      const profile = this.profileService.profile() ?? await this.profileService.loadProfile();
      this.profileForm.patchValue({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone ?? '',
      });
      if (profile.cpfHash) {
        this.cpfMasked.set('•••.•••.•••-••');
      }
    } catch {
      this.toast.error('Erro ao carregar perfil.');
    } finally {
      this.loading.set(false);
    }
  }

  showError(field: string): boolean {
    const control = this.profileForm.get(field);
    return control !== null && control.invalid && control.touched;
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replaceAll(/\D/g, '');
    if (digits.length > 11) digits = digits.substring(0, 11);

    let formatted = '';
    if (digits.length > 0) formatted += `(${digits.substring(0, 2)}`;
    if (digits.length > 2) formatted += `) ${digits.substring(2, 7)}`;
    if (digits.length > 7) formatted += `-${digits.substring(7, 11)}`;

    input.value = formatted;
    this.profileForm.controls.phone.setValue(digits, { emitEvent: false });
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    try {
      const { fullName, phone } = this.profileForm.getRawValue();
      await this.profileService.updateProfile({
        fullName,
        phone: phone || undefined,
      });
      this.profileForm.markAsPristine();
      this.toast.success('Perfil atualizado com sucesso!');
    } catch {
      this.toast.error('Erro ao salvar perfil. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }
}


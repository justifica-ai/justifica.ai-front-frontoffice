import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { APP_ROUTES } from '../../../../core/constants/app-routes';
import {
  calculateStrength,
  passwordStrengthValidator,
  passwordMatchValidator,
  cpfValidator,
  phoneValidator,
  formatCpf,
  formatPhone,
} from '../../../../shared/utils/validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-bold text-gray-800 mb-2">Criar conta</h1>
    <p class="text-sm text-gray-500 mb-6">Cadastre-se para gerar seu recurso de multa</p>

    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-5" novalidate>
      <!-- Full Name -->
      <div>
        <label for="reg-name" class="block text-sm font-medium text-gray-700 mb-1">
          Nome completo <span class="text-red-500" aria-hidden="true">*</span>
          <span class="sr-only">(obrigatório)</span>
        </label>
        <input
          id="reg-name"
          type="text"
          formControlName="fullName"
          autocomplete="name"
          autofocus
          placeholder="Seu nome completo"
          class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
                 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
          [class.border-red-500]="showFieldError('fullName')"
          [attr.aria-invalid]="showFieldError('fullName')"
          [attr.aria-describedby]="showFieldError('fullName') ? 'reg-name-error' : null" />
        @if (showFieldError('fullName')) {
          <p id="reg-name-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ getFieldError('fullName') }}
          </p>
        }
      </div>

      <!-- Email -->
      <div>
        <label for="reg-email" class="block text-sm font-medium text-gray-700 mb-1">
          E-mail <span class="text-red-500" aria-hidden="true">*</span>
          <span class="sr-only">(obrigatório)</span>
        </label>
        <input
          id="reg-email"
          type="email"
          formControlName="email"
          autocomplete="email"
          placeholder="seu@email.com"
          class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
                 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
          [class.border-red-500]="showFieldError('email')"
          [attr.aria-invalid]="showFieldError('email')"
          [attr.aria-describedby]="showFieldError('email') ? 'reg-email-error' : null" />
        @if (showFieldError('email')) {
          <p id="reg-email-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ getFieldError('email') }}
          </p>
        }
      </div>

      <!-- CPF -->
      <div>
        <label for="reg-cpf" class="block text-sm font-medium text-gray-700 mb-1">
          CPF <span class="text-red-500" aria-hidden="true">*</span>
          <span class="sr-only">(obrigatório)</span>
        </label>
        <input
          id="reg-cpf"
          type="text"
          formControlName="cpf"
          inputmode="numeric"
          autocomplete="off"
          placeholder="000.000.000-00"
          maxlength="14"
          (input)="onCpfInput($event)"
          class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
                 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
          [class.border-red-500]="showFieldError('cpf')"
          [attr.aria-invalid]="showFieldError('cpf')"
          [attr.aria-describedby]="showFieldError('cpf') ? 'reg-cpf-error' : null" />
        @if (showFieldError('cpf')) {
          <p id="reg-cpf-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ getFieldError('cpf') }}
          </p>
        }
      </div>

      <!-- Phone (optional) -->
      <div>
        <label for="reg-phone" class="block text-sm font-medium text-gray-700 mb-1">
          Telefone <span class="text-xs text-gray-400">(opcional)</span>
        </label>
        <input
          id="reg-phone"
          type="tel"
          formControlName="phone"
          inputmode="numeric"
          autocomplete="tel"
          placeholder="(00) 00000-0000"
          maxlength="15"
          (input)="onPhoneInput($event)"
          class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
                 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
          [class.border-red-500]="showFieldError('phone')"
          [attr.aria-invalid]="showFieldError('phone')"
          [attr.aria-describedby]="showFieldError('phone') ? 'reg-phone-error' : null" />
        @if (showFieldError('phone')) {
          <p id="reg-phone-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ getFieldError('phone') }}
          </p>
        }
      </div>

      <!-- Password -->
      <div>
        <label for="reg-password" class="block text-sm font-medium text-gray-700 mb-1">
          Senha <span class="text-red-500" aria-hidden="true">*</span>
          <span class="sr-only">(obrigatório)</span>
        </label>
        <div class="relative">
          <input
            id="reg-password"
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            autocomplete="new-password"
            placeholder="••••••••"
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder-gray-400
                   focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
            [class.border-red-500]="showFieldError('password')"
            [attr.aria-invalid]="showFieldError('password')"
            [attr.aria-describedby]="showFieldError('password') ? 'reg-password-error' : 'reg-password-strength'" />
          <button
            type="button"
            (click)="togglePasswordVisibility()"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
            [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'">
            @if (showPassword()) {
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            }
          </button>
        </div>

        <!-- Strength indicator -->
        <div id="reg-password-strength" class="mt-2" role="status" aria-live="polite">
          <div class="flex gap-1">
            @for (i of [0, 1, 2, 3]; track i) {
              <div class="h-1.5 flex-1 rounded-full transition-colors"
                   [class]="i < strengthBars() ? strengthColor() : 'bg-gray-200'">
              </div>
            }
          </div>
          @if (passwordValue()) {
            <p class="text-xs mt-1" [class]="strengthTextColor()">
              Força: {{ strengthLabel() }}
            </p>
          }
        </div>

        @if (showFieldError('password')) {
          <p id="reg-password-error" class="mt-1 text-sm text-red-600" role="alert">
            A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.
          </p>
        }
      </div>

      <!-- Confirm Password -->
      <div>
        <label for="reg-confirm" class="block text-sm font-medium text-gray-700 mb-1">
          Confirmar senha <span class="text-red-500" aria-hidden="true">*</span>
          <span class="sr-only">(obrigatório)</span>
        </label>
        <input
          id="reg-confirm"
          type="password"
          formControlName="confirmPassword"
          autocomplete="new-password"
          placeholder="••••••••"
          class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
                 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
          [class.border-red-500]="showFieldError('confirmPassword') || showMismatchError()"
          [attr.aria-invalid]="showFieldError('confirmPassword') || showMismatchError()"
          [attr.aria-describedby]="showFieldError('confirmPassword') ? 'reg-confirm-error' : (showMismatchError() ? 'reg-mismatch-error' : null)" />
        @if (showFieldError('confirmPassword')) {
          <p id="reg-confirm-error" class="mt-1 text-sm text-red-600" role="alert">
            Confirmação de senha é obrigatória.
          </p>
        }
        @if (showMismatchError()) {
          <p id="reg-mismatch-error" class="mt-1 text-sm text-red-600" role="alert">
            As senhas não coincidem.
          </p>
        }
      </div>

      <!-- Affiliate Code (collapsible) -->
      <div>
        @if (!showAffiliateField()) {
          <button
            type="button"
            (click)="showAffiliateField.set(true)"
            class="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
            aria-expanded="false"
            aria-controls="affiliate-field">
            Tem código de indicação?
          </button>
        } @else {
          <div id="affiliate-field">
            <label for="reg-affiliate" class="block text-sm font-medium text-gray-700 mb-1">
              Código de indicação <span class="text-xs text-gray-400">(opcional)</span>
            </label>
            <input
              id="reg-affiliate"
              type="text"
              formControlName="affiliateCode"
              autocomplete="off"
              placeholder="Ex: ABC123"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
                     focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors" />
          </div>
        }
      </div>

      <!-- Terms & LGPD Checkboxes -->
      <div class="space-y-3">
        <div class="flex items-start gap-2">
          <input
            id="reg-terms"
            type="checkbox"
            formControlName="acceptTerms"
            class="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 transition-colors"
            [attr.aria-invalid]="showFieldError('acceptTerms')"
            [attr.aria-describedby]="showFieldError('acceptTerms') ? 'reg-terms-error' : null" />
          <label for="reg-terms" class="text-sm text-gray-600 select-none">
            Li e aceito os
            <a [href]="APP_ROUTES.EXTERNAL.TERMS" target="_blank" rel="noopener noreferrer"
               class="text-brand-600 hover:text-brand-700 font-medium underline">
              Termos de Uso
            </a>
            <span class="text-red-500" aria-hidden="true">*</span>
            <span class="sr-only">(obrigatório)</span>
          </label>
        </div>
        @if (showFieldError('acceptTerms')) {
          <p id="reg-terms-error" class="text-sm text-red-600 ml-6" role="alert">
            Você precisa aceitar os Termos de Uso.
          </p>
        }

        <div class="flex items-start gap-2">
          <input
            id="reg-lgpd"
            type="checkbox"
            formControlName="acceptLGPD"
            class="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 transition-colors"
            [attr.aria-invalid]="showFieldError('acceptLGPD')"
            [attr.aria-describedby]="showFieldError('acceptLGPD') ? 'reg-lgpd-error' : null" />
          <label for="reg-lgpd" class="text-sm text-gray-600 select-none">
            Autorizo o tratamento dos meus dados conforme a
            <a [href]="APP_ROUTES.EXTERNAL.PRIVACY" target="_blank" rel="noopener noreferrer"
               class="text-brand-600 hover:text-brand-700 font-medium underline">
              Política de Privacidade
            </a>
            <span class="text-red-500" aria-hidden="true">*</span>
            <span class="sr-only">(obrigatório)</span>
          </label>
        </div>
        @if (showFieldError('acceptLGPD')) {
          <p id="reg-lgpd-error" class="text-sm text-red-600 ml-6" role="alert">
            Você precisa autorizar o tratamento de dados.
          </p>
        }
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        [disabled]="registerForm.invalid || isSubmitting()"
        class="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white
               hover:bg-brand-700 focus:ring-2 focus:ring-brand-500/50 focus:outline-none
               disabled:opacity-50 disabled:cursor-not-allowed transition-colors
               flex items-center justify-center gap-2"
        aria-label="Criar conta">
        @if (isSubmitting()) {
          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Criando conta...
        } @else {
          Criar conta
        }
      </button>
    </form>

    <!-- Login link -->
    <div class="mt-6 text-center text-sm text-gray-500">
      Já tem conta?
      <a [routerLink]="APP_ROUTES.AUTH.LOGIN" class="text-brand-600 font-semibold hover:text-brand-700">Entrar</a>
    </div>
  `,
})
export class RegisterComponent {
  protected readonly APP_ROUTES = APP_ROUTES;

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly registerForm = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      cpf: ['', [Validators.required, cpfValidator]],
      phone: ['', [phoneValidator]],
      password: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
      affiliateCode: [''],
      acceptTerms: [false, [Validators.requiredTrue]],
      acceptLGPD: [false, [Validators.requiredTrue]],
    },
    { validators: [passwordMatchValidator] },
  );

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly showAffiliateField = signal(false);

  readonly passwordValue = toSignal(
    this.registerForm.controls.password.valueChanges,
    { initialValue: '' },
  );

  readonly strength = computed(() => calculateStrength(this.passwordValue()));

  readonly strengthBars = computed(() => {
    switch (this.strength().level) {
      case 'weak': return 1;
      case 'medium': return 2;
      case 'strong': return 3;
      case 'very-strong': return 4;
    }
  });

  readonly strengthColor = computed(() => {
    switch (this.strength().level) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'strong': return 'bg-accent-500';
      case 'very-strong': return 'bg-green-500';
    }
  });

  readonly strengthTextColor = computed(() => {
    switch (this.strength().level) {
      case 'weak': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      case 'strong': return 'text-accent-600';
      case 'very-strong': return 'text-green-600';
    }
  });

  readonly strengthLabel = computed(() => {
    switch (this.strength().level) {
      case 'weak': return 'Fraca';
      case 'medium': return 'Média';
      case 'strong': return 'Forte';
      case 'very-strong': return 'Muito forte';
    }
  });

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  showFieldError(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  showMismatchError(): boolean {
    const confirm = this.registerForm.controls.confirmPassword;
    return (
      !!this.registerForm.errors?.['passwordMismatch'] &&
      (confirm.dirty || confirm.touched)
    );
  }

  getFieldError(field: string): string {
    const control = this.registerForm.get(field);
    if (!control?.errors) return '';

    switch (field) {
      case 'fullName':
        if (control.errors['required']) return 'Nome completo é obrigatório.';
        if (control.errors['minlength']) return 'Nome deve ter no mínimo 3 caracteres.';
        break;
      case 'email':
        if (control.errors['required']) return 'E-mail é obrigatório.';
        if (control.errors['email']) return 'E-mail inválido.';
        break;
      case 'cpf':
        if (control.errors['required']) return 'CPF é obrigatório.';
        if (control.errors['cpf']) return 'CPF inválido. Verifique os números.';
        break;
      case 'phone':
        if (control.errors['phone']) return 'Telefone inválido. Use DDD + número.';
        break;
    }
    return '';
  }

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatCpf(input.value);
    this.registerForm.controls.cpf.setValue(formatted, { emitEvent: false });
    input.value = formatted;
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatPhone(input.value);
    this.registerForm.controls.phone.setValue(formatted, { emitEvent: false });
    input.value = formatted;
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const { fullName, email, cpf, phone, password, affiliateCode } = this.registerForm.getRawValue();

      const metadata: Record<string, unknown> = {
        full_name: fullName,
        cpf: cpf.replace(/\D/g, ''),
        ...(phone && { phone: phone.replace(/\D/g, '') }),
        ...(affiliateCode && { affiliate_code: affiliateCode }),
      };

      const { error } = await this.auth.signUp(email, password, metadata);

      if (error) {
        if (error.message?.toLowerCase().includes('already registered')) {
          this.toast.error('E-mail já cadastrado', 'Use outro e-mail ou faça login.');
        } else {
          this.toast.error('Erro ao criar conta', error.message || 'Tente novamente mais tarde.');
        }
        return;
      }

      this.toast.success('Conta criada!', 'Verifique seu e-mail para ativar sua conta.');
      await this.router.navigate([APP_ROUTES.AUTH.VERIFY_EMAIL], {
        queryParams: { email },
      });
    } catch {
      this.toast.error('Erro inesperado', 'Ocorreu um erro. Tente novamente.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

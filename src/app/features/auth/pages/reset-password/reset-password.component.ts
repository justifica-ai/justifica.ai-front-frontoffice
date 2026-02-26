import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { APP_ROUTES } from '../../../../core/constants/app-routes';
import {
  calculateStrength,
  passwordStrengthValidator,
  passwordMatchValidator,
} from '../../../../shared/utils/validators';

// Re-export for backward compatibility with tests
export { calculateStrength, type PasswordStrengthLevel } from '../../../../shared/utils/validators';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-bold text-gray-800 mb-2">Redefinir senha</h1>

    @if (tokenError()) {
      <!-- Invalid/expired token -->
      <div class="rounded-lg border border-red-200 bg-red-50 p-4 mt-4" role="alert">
        <div class="flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               class="text-red-600 mt-0.5 shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <p class="text-sm font-semibold text-red-800">{{ tokenError() }}</p>
            <p class="text-sm text-red-700 mt-1">
              O link pode ter expirado ou já foi utilizado.
            </p>
          </div>
        </div>
      </div>

      <div class="mt-6 text-center">
        <a [routerLink]="APP_ROUTES.AUTH.FORGOT_PASSWORD"
           class="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
          Solicitar novo link
        </a>
      </div>
    } @else {
      <p class="text-sm text-gray-500 mb-6">Escolha uma nova senha para sua conta</p>

      @if (errorMessage()) {
        <div class="mb-4 rounded-lg bg-red-50 border border-red-200 p-3" role="alert">
          <p class="text-sm text-red-700">{{ errorMessage() }}</p>
        </div>
      }

      <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="space-y-5" novalidate>
        <!-- New Password -->
        <div>
          <label for="reset-password" class="block text-sm font-medium text-gray-700 mb-1">
            Nova senha <span class="text-red-500" aria-hidden="true">*</span>
            <span class="sr-only">(obrigatório)</span>
          </label>
          <div class="relative">
            <input
              id="reset-password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="newPassword"
              autocomplete="new-password"
              autofocus
              placeholder="••••••••"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder-gray-400
                     focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
              [class.border-red-500]="showFieldError('newPassword')"
              [attr.aria-invalid]="showFieldError('newPassword')"
              [attr.aria-describedby]="showFieldError('newPassword') ? 'reset-password-error' : 'password-strength'" />
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
          <div id="password-strength" class="mt-2" role="status" aria-live="polite">
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

          @if (showFieldError('newPassword')) {
            <p id="reset-password-error" class="mt-1 text-sm text-red-600" role="alert">
              A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.
            </p>
          }
        </div>

        <!-- Confirm Password -->
        <div>
          <label for="reset-confirm" class="block text-sm font-medium text-gray-700 mb-1">
            Confirmar nova senha <span class="text-red-500" aria-hidden="true">*</span>
            <span class="sr-only">(obrigatório)</span>
          </label>
          <input
            id="reset-confirm"
            type="password"
            formControlName="confirmPassword"
            autocomplete="new-password"
            placeholder="••••••••"
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
                   focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
            [class.border-red-500]="showFieldError('confirmPassword')"
            [attr.aria-invalid]="showFieldError('confirmPassword')"
            [attr.aria-describedby]="showFieldError('confirmPassword') ? 'reset-confirm-error' : null" />
          @if (showFieldError('confirmPassword')) {
            <p id="reset-confirm-error" class="mt-1 text-sm text-red-600" role="alert">
              {{ getConfirmError() }}
            </p>
          }
          @if (resetForm.errors?.['passwordMismatch'] && resetForm.get('confirmPassword')?.touched) {
            <p class="mt-1 text-sm text-red-600" role="alert">
              As senhas não coincidem.
            </p>
          }
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          [disabled]="isSubmitting()"
          class="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white
                 hover:bg-brand-700 focus:ring-2 focus:ring-brand-500/50 focus:outline-none
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                 flex items-center justify-center gap-2"
          aria-label="Redefinir senha">
          @if (isSubmitting()) {
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Redefinindo...
          } @else {
            Redefinir senha
          }
        </button>
      </form>
    }
  `,
})
export class ResetPasswordComponent implements OnInit {
  protected readonly APP_ROUTES = APP_ROUTES;

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly resetForm = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordMatchValidator] },
  );

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly tokenError = signal('');

  private token = '';

  readonly passwordValue = toSignal(this.resetForm.controls.newPassword.valueChanges, { initialValue: '' });

  readonly strength = computed(() => calculateStrength(this.passwordValue()));

  readonly strengthBars = computed(() => {
    const s = this.strength();
    switch (s.level) {
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

  ngOnInit(): void {
    // Read token from URL fragment or query params
    // Supabase reset emails redirect with hash fragment: #access_token=xxx&type=recovery
    // Or as query param: ?token=xxx
    const fragment = this.route.snapshot.fragment;
    if (fragment) {
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const type = params.get('type');
      if (accessToken && type === 'recovery') {
        this.token = accessToken;
        return;
      }
    }

    const queryToken = this.route.snapshot.queryParamMap.get('token');
    if (queryToken) {
      this.token = queryToken;
      return;
    }

    this.tokenError.set('Link de redefinição inválido.');
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  showFieldError(field: 'newPassword' | 'confirmPassword'): boolean {
    const control = this.resetForm.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  getConfirmError(): string {
    const control = this.resetForm.controls.confirmPassword;
    if (control.errors?.['required']) return 'Confirmação de senha é obrigatória.';
    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const { newPassword } = this.resetForm.getRawValue();

      // First set the session using the recovery token
      const { error: sessionError } = await this.auth.getSupabaseClient().auth.setSession({
        access_token: this.token,
        refresh_token: '',
      });

      if (sessionError) {
        if (sessionError.message?.toLowerCase().includes('expired')) {
          this.tokenError.set('O link de redefinição expirou.');
        } else {
          this.tokenError.set('Link de redefinição inválido ou já utilizado.');
        }
        return;
      }

      // Then update the password
      const { error: updateError } = await this.auth.updatePassword(newPassword);

      if (updateError) {
        this.errorMessage.set(updateError.message || 'Erro ao redefinir a senha. Tente novamente.');
        return;
      }

      this.toast.success('Senha alterada!', 'Sua senha foi redefinida com sucesso.');
      await this.router.navigateByUrl(APP_ROUTES.AUTH.LOGIN);
    } catch {
      this.errorMessage.set('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

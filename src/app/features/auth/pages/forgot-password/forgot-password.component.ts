import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { APP_ROUTES } from '../../../../core/constants/app-routes';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-bold text-gray-800 mb-2">Esqueci minha senha</h1>
    <p class="text-sm text-gray-500 mb-6">Informe seu e-mail para receber o link de redefinição</p>

    @if (submitted()) {
      <!-- Success state — always show same message (anti-enumeration) -->
      <div class="rounded-lg border border-accent-200 bg-accent-50 p-4" role="status">
        <div class="flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               class="text-accent-600 mt-0.5 shrink-0" aria-hidden="true">
            <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          <div>
            <p class="text-sm font-semibold text-accent-800">Verifique seu e-mail</p>
            <p class="text-sm text-accent-700 mt-1">
              Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
              Verifique também a pasta de spam.
            </p>
          </div>
        </div>
      </div>

      <div class="mt-6 text-center">
        <a [routerLink]="APP_ROUTES.AUTH.LOGIN"
           class="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
          Voltar para o login
        </a>
      </div>
    } @else {
      <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="space-y-5" novalidate>
        <!-- Email Field -->
        <div>
          <label for="forgot-email" class="block text-sm font-medium text-gray-700 mb-1">
            E-mail <span class="text-red-500" aria-hidden="true">*</span>
            <span class="sr-only">(obrigatório)</span>
          </label>
          <input
            id="forgot-email"
            type="email"
            formControlName="email"
            autocomplete="email"
            autofocus
            placeholder="seu@email.com"
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
                   focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
            [class.border-red-500]="showFieldError()"
            [attr.aria-invalid]="showFieldError()"
            [attr.aria-describedby]="showFieldError() ? 'forgot-email-error' : null" />
          @if (showFieldError()) {
            <p id="forgot-email-error" class="mt-1 text-sm text-red-600" role="alert">
              {{ getFieldError() }}
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
          aria-label="Enviar link de redefinição de senha">
          @if (isSubmitting()) {
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Enviando...
          } @else {
            Enviar link
          }
        </button>
      </form>

      <div class="mt-6 text-center">
        <a [routerLink]="APP_ROUTES.AUTH.LOGIN"
           class="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
          Voltar para o login
        </a>
      </div>
    }
  `,
})
export class ForgotPasswordComponent {
  protected readonly APP_ROUTES = APP_ROUTES;

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);

  showFieldError(): boolean {
    const control = this.forgotForm.controls.email;
    return control.invalid && (control.dirty || control.touched);
  }

  getFieldError(): string {
    const control = this.forgotForm.controls.email;
    if (control.errors?.['required']) return 'E-mail é obrigatório.';
    if (control.errors?.['email']) return 'Formato de e-mail inválido.';
    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const { email } = this.forgotForm.getRawValue();
      await this.auth.resetPassword(email);
    } catch {
      // Silent — anti-enumeration: always show the same success message
    } finally {
      this.isSubmitting.set(false);
      this.submitted.set(true);
    }
  }
}

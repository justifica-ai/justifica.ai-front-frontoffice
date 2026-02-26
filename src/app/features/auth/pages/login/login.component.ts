import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { APP_ROUTES } from '../../../../core/constants/app-routes';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-bold text-gray-800 mb-2">Entrar</h1>
    <p class="text-sm text-gray-500 mb-6">Acesse sua conta para gerenciar seus recursos</p>

    <!-- Email Not Verified Card -->
    @if (emailNotVerified()) {
      <div class="mb-6 rounded-lg border border-brand-200 bg-brand-50 p-4" role="alert">
        <div class="flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               class="text-brand-600 mt-0.5 shrink-0" aria-hidden="true">
            <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          <div>
            <p class="text-sm font-semibold text-brand-800">E-mail não verificado</p>
            <p class="text-sm text-brand-700 mt-1">
              Verifique sua caixa de entrada para confirmar seu e-mail antes de acessar.
            </p>
            <button
              type="button"
              (click)="resendVerification()"
              [disabled]="resendingVerification()"
              class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors disabled:opacity-50"
              aria-label="Reenviar e-mail de verificação">
              @if (resendingVerification()) {
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Reenviando...
              } @else {
                Reenviar e-mail de verificação
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Account Suspended Card -->
    @if (accountSuspended()) {
      <div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
        <div class="flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               class="text-red-600 mt-0.5 shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>
          </svg>
          <div>
            <p class="text-sm font-semibold text-red-800">Conta suspensa</p>
            <p class="text-sm text-red-700 mt-1">
              Sua conta foi suspensa. Entre em contato com o suporte para mais informações.
            </p>
          </div>
        </div>
      </div>
    }

    <!-- Rate Limited / Retry Card -->
    @if (retryAfter() > 0) {
      <div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4" role="alert">
        <div class="flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               class="text-amber-600 mt-0.5 shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <div>
            <p class="text-sm font-semibold text-amber-800">Muitas tentativas</p>
            <p class="text-sm text-amber-700 mt-1">
              Aguarde {{ retryAfter() }} segundos antes de tentar novamente.
            </p>
          </div>
        </div>
      </div>
    }

    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5" novalidate>
      <!-- Email Field -->
      <div>
        <label for="login-email" class="block text-sm font-medium text-gray-700 mb-1">
          E-mail <span class="text-red-500" aria-hidden="true">*</span>
          <span class="sr-only">(obrigatório)</span>
        </label>
        <input
          id="login-email"
          type="email"
          formControlName="email"
          autocomplete="email"
          autofocus
          placeholder="seu@email.com"
          class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
                 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
          [class.border-red-500]="showFieldError('email')"
          [attr.aria-invalid]="showFieldError('email')"
          [attr.aria-describedby]="showFieldError('email') ? 'login-email-error' : null" />
        @if (showFieldError('email')) {
          <p id="login-email-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ getFieldError('email') }}
          </p>
        }
      </div>

      <!-- Password Field -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label for="login-password" class="block text-sm font-medium text-gray-700">
            Senha <span class="text-red-500" aria-hidden="true">*</span>
            <span class="sr-only">(obrigatório)</span>
          </label>
          <a [routerLink]="APP_ROUTES.AUTH.FORGOT_PASSWORD" class="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">
            Esqueci minha senha
          </a>
        </div>
        <div class="relative">
          <input
            id="login-password"
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder-gray-400
                   focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
            [class.border-red-500]="showFieldError('password')"
            [attr.aria-invalid]="showFieldError('password')"
            [attr.aria-describedby]="showFieldError('password') ? 'login-password-error' : null" />
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
        @if (showFieldError('password')) {
          <p id="login-password-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ getFieldError('password') }}
          </p>
        }
      </div>

      <!-- Remember Me -->
      <div class="flex items-center">
        <input
          id="login-remember"
          type="checkbox"
          formControlName="rememberMe"
          class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 transition-colors" />
        <label for="login-remember" class="ml-2 text-sm text-gray-600 select-none">
          Lembrar-me
        </label>
      </div>

      <!-- Error Message -->
      @if (errorMessage()) {
        <div class="rounded-lg bg-red-50 border border-red-200 p-3" role="alert">
          <p class="text-sm text-red-700">{{ errorMessage() }}</p>
        </div>
      }

      <!-- Submit Button -->
      <button
        type="submit"
        [disabled]="isSubmitting() || retryAfter() > 0"
        class="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white
               hover:bg-brand-700 focus:ring-2 focus:ring-brand-500/50 focus:outline-none
               disabled:opacity-50 disabled:cursor-not-allowed transition-colors
               flex items-center justify-center gap-2"
        aria-label="Entrar na sua conta">
        @if (isSubmitting()) {
          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Entrando...
        } @else {
          Entrar
        }
      </button>
    </form>

    <div class="mt-6 text-center text-sm text-gray-500">
      Não tem conta?
      <a [routerLink]="APP_ROUTES.AUTH.REGISTER" class="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
        Criar conta
      </a>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  protected readonly APP_ROUTES = APP_ROUTES;

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly emailNotVerified = signal(false);
  readonly accountSuspended = signal(false);
  readonly retryAfter = signal(0);
  readonly resendingVerification = signal(false);

  private returnUrl = '/';
  private retryCountdownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  showFieldError(field: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  getFieldError(field: 'email' | 'password'): string {
    const control = this.loginForm.controls[field];
    if (control.errors?.['required']) {
      return field === 'email' ? 'E-mail é obrigatório.' : 'Senha é obrigatória.';
    }
    if (control.errors?.['email']) {
      return 'Formato de e-mail inválido.';
    }
    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Reset state
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.emailNotVerified.set(false);
    this.accountSuspended.set(false);

    const { email, password } = this.loginForm.getRawValue();

    try {
      const { error } = await this.auth.signIn(email, password);

      if (error) {
        this.handleAuthError(error);
        return;
      }

      // Success — navigate
      await this.router.navigateByUrl(this.returnUrl);
    } catch {
      this.errorMessage.set('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async resendVerification(): Promise<void> {
    this.resendingVerification.set(true);
    try {
      const email = this.loginForm.controls.email.value;
      const { error } = await this.auth.resendVerificationEmail(email);
      if (error) {
        this.toast.error('Erro ao reenviar', 'Não foi possível reenviar o e-mail de verificação.');
      } else {
        this.toast.success('E-mail reenviado', 'Verifique sua caixa de entrada.');
      }
    } catch {
      this.toast.error('Erro ao reenviar', 'Tente novamente em alguns instantes.');
    } finally {
      this.resendingVerification.set(false);
    }
  }

  private handleAuthError(error: { message: string; status?: number }): void {
    const msg = error.message?.toLowerCase() ?? '';

    // Email not confirmed
    if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
      this.emailNotVerified.set(true);
      return;
    }

    // User banned / suspended
    if (msg.includes('user banned') || msg.includes('banned')) {
      this.accountSuspended.set(true);
      return;
    }

    // Rate limited
    if (msg.includes('rate limit') || msg.includes('too many requests') || error.status === 429) {
      this.startRetryCountdown(30);
      return;
    }

    // Invalid credentials (generic message for security)
    if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
      this.errorMessage.set('E-mail ou senha incorretos.');
      return;
    }

    // Fallback
    this.errorMessage.set('Ocorreu um erro ao fazer login. Tente novamente.');
  }

  private startRetryCountdown(seconds: number): void {
    this.retryAfter.set(seconds);
    this.clearRetryCountdown();

    this.retryCountdownInterval = setInterval(() => {
      this.retryAfter.update((v) => {
        if (v <= 1) {
          this.clearRetryCountdown();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  private clearRetryCountdown(): void {
    if (this.retryCountdownInterval !== null) {
      clearInterval(this.retryCountdownInterval);
      this.retryCountdownInterval = null;
    }
  }
}

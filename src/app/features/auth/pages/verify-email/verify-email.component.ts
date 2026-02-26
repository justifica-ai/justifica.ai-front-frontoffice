import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { APP_ROUTES } from '../../../../core/constants/app-routes';

const RESEND_COOLDOWN_SECONDS = 60;

export function maskEmail(email: string): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
}

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (verifying()) {
      <div class="text-center" role="status" aria-live="polite">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-100 flex items-center justify-center">
          <svg class="animate-spin h-8 w-8 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Verificando seu e-mail...</h1>
        <p class="text-sm text-gray-500">Aguarde enquanto ativamos sua conta.</p>
      </div>
    } @else if (verified()) {
      <div class="text-center" role="status">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               class="text-green-600" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">E-mail verificado!</h1>
        <p class="text-sm text-gray-500 mb-6">Sua conta foi ativada. Você já pode fazer login.</p>
        <a [routerLink]="APP_ROUTES.AUTH.LOGIN"
           class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white
                  hover:bg-brand-700 transition-colors">
          Ir para o login
        </a>
      </div>
    } @else if (alreadyVerified()) {
      <div class="text-center" role="status">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               class="text-accent-600" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">E-mail já verificado</h1>
        <p class="text-sm text-gray-500 mb-6">Sua conta já está ativa. Faça login para continuar.</p>
        <a [routerLink]="APP_ROUTES.AUTH.LOGIN"
           class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white
                  hover:bg-brand-700 transition-colors">
          Ir para o login
        </a>
      </div>
    } @else if (tokenExpired()) {
      <div class="text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               class="text-red-600" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Link expirado</h1>
        <p class="text-sm text-gray-500 mb-6">O link de verificação expirou. Solicite um novo link abaixo.</p>
        <button
          type="button"
          [disabled]="resending() || cooldownRemaining() > 0"
          (click)="resendVerification()"
          class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white
                 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Reenviar link de verificação">
          @if (resending()) {
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Reenviando...
          } @else if (cooldownRemaining() > 0) {
            Reenviar em {{ cooldownRemaining() }}s
          } @else {
            Reenviar link
          }
        </button>
      </div>
    } @else {
      <!-- Default: waiting for verification (post-signup) -->
      <div class="text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               class="text-brand-600" aria-hidden="true">
            <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Verifique seu e-mail</h1>
        <p class="text-sm text-gray-500 mb-1">
          Enviamos um link de verificação para
        </p>
        @if (maskedEmail()) {
          <p class="text-sm font-semibold text-gray-800 mb-4" aria-label="E-mail de verificação">{{ maskedEmail() }}</p>
        } @else {
          <p class="text-sm text-gray-500 mb-4">o seu e-mail cadastrado.</p>
        }
        <p class="text-sm text-gray-500 mb-6">Clique no link do e-mail para ativar sua conta. Verifique também a pasta de spam.</p>

        <div class="space-y-3">
          <button
            type="button"
            [disabled]="resending() || cooldownRemaining() > 0"
            (click)="resendVerification()"
            class="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white
                   hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                   flex items-center justify-center gap-2"
            aria-label="Reenviar link de verificação">
            @if (resending()) {
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Reenviando...
            } @else if (cooldownRemaining() > 0) {
              Reenviar em {{ cooldownRemaining() }}s
            } @else {
              Reenviar link de verificação
            }
          </button>

          <a [routerLink]="APP_ROUTES.AUTH.REGISTER"
             class="block text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
            Não é seu e-mail? Voltar ao cadastro
          </a>
        </div>
      </div>
    }
  `,
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  protected readonly APP_ROUTES = APP_ROUTES;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly verifying = signal(false);
  readonly verified = signal(false);
  readonly alreadyVerified = signal(false);
  readonly tokenExpired = signal(false);
  readonly resending = signal(false);
  readonly cooldownRemaining = signal(0);
  readonly maskedEmail = signal('');

  private email = '';
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // Read email from query params or navigation state
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) {
      this.email = emailParam;
      this.maskedEmail.set(maskEmail(emailParam));
    }

    // Check for verification token in URL
    const fragment = this.route.snapshot.fragment;
    if (fragment) {
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const type = params.get('type');
      if (accessToken && type === 'signup') {
        this.verifyToken(accessToken);
        return;
      }
    }

    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    if (tokenParam) {
      this.verifyToken(tokenParam);
    }
  }

  ngOnDestroy(): void {
    this.clearCooldownTimer();
  }

  async resendVerification(): Promise<void> {
    if (!this.email || this.resending() || this.cooldownRemaining() > 0) return;

    this.resending.set(true);

    try {
      const { error } = await this.auth.resendVerificationEmail(this.email);
      if (error) {
        this.toast.error('Erro ao reenviar', error.message || 'Tente novamente mais tarde.');
      } else {
        this.toast.success('Link reenviado!', 'Verifique sua caixa de entrada.');
        this.startCooldown();
      }
    } catch {
      this.toast.error('Erro inesperado', 'Tente novamente mais tarde.');
    } finally {
      this.resending.set(false);
    }
  }

  private async verifyToken(token: string): Promise<void> {
    this.verifying.set(true);

    try {
      const { error } = await this.auth.getSupabaseClient().auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      });

      if (error) {
        if (error.message?.toLowerCase().includes('expired')) {
          this.tokenExpired.set(true);
        } else if (error.message?.toLowerCase().includes('already') || error.message?.toLowerCase().includes('confirmed')) {
          this.alreadyVerified.set(true);
        } else {
          this.tokenExpired.set(true);
        }
      } else {
        this.verified.set(true);
        this.toast.success('E-mail verificado!', 'Sua conta foi ativada com sucesso.');
      }
    } catch {
      this.tokenExpired.set(true);
    } finally {
      this.verifying.set(false);
    }
  }

  private startCooldown(): void {
    this.cooldownRemaining.set(RESEND_COOLDOWN_SECONDS);
    this.clearCooldownTimer();
    this.cooldownTimer = setInterval(() => {
      const remaining = this.cooldownRemaining() - 1;
      if (remaining <= 0) {
        this.cooldownRemaining.set(0);
        this.clearCooldownTimer();
      } else {
        this.cooldownRemaining.set(remaining);
      }
    }, 1000);
  }

  private clearCooldownTimer(): void {
    if (this.cooldownTimer !== null) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }
}

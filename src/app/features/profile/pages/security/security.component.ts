import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ProfileService } from '../../../onboarding/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { UserSession } from '../../../../core/models/user.model';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      <!-- Change Password -->
      <section>
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Alterar senha</h2>
        <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="space-y-4">
          <div>
            <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Senha atual <span class="text-error-500">*</span>
              <span class="sr-only">(obrigatório)</span>
            </label>
            <input
              id="currentPassword"
              formControlName="currentPassword"
              type="password"
              autocomplete="current-password"
              class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              [class.border-error-500]="showPasswordError('currentPassword')" />
            @if (showPasswordError('currentPassword')) {
              <p class="mt-1 text-xs text-error-500" role="alert">Senha atual é obrigatória</p>
            }
          </div>

          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Nova senha <span class="text-error-500">*</span>
              <span class="sr-only">(obrigatório)</span>
            </label>
            <input
              id="newPassword"
              formControlName="newPassword"
              type="password"
              autocomplete="new-password"
              class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              [class.border-error-500]="showPasswordError('newPassword')" />
            @if (showPasswordError('newPassword')) {
              @if (passwordForm.controls.newPassword.errors?.['required']) {
                <p class="mt-1 text-xs text-error-500" role="alert">Nova senha é obrigatória</p>
              } @else if (passwordForm.controls.newPassword.errors?.['minlength']) {
                <p class="mt-1 text-xs text-error-500" role="alert">Senha deve ter no mínimo 8 caracteres</p>
              }
            }
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Confirmar nova senha <span class="text-error-500">*</span>
              <span class="sr-only">(obrigatório)</span>
            </label>
            <input
              id="confirmPassword"
              formControlName="confirmPassword"
              type="password"
              autocomplete="new-password"
              class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              [class.border-error-500]="showPasswordError('confirmPassword') || showMismatchError()" />
            @if (showPasswordError('confirmPassword')) {
              <p class="mt-1 text-xs text-error-500" role="alert">Confirmação de senha é obrigatória</p>
            } @else if (showMismatchError()) {
              <p class="mt-1 text-xs text-error-500" role="alert">As senhas não coincidem</p>
            }
          </div>

          <div class="pt-2">
            <button
              type="submit"
              class="h-11 px-6 rounded-lg font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="changingPassword()">
              @if (changingPassword()) {
                Alterando...
              } @else {
                Alterar senha
              }
            </button>
          </div>
        </form>
      </section>

      <!-- Active Sessions -->
      <section>
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Sessões ativas</h2>
        @if (loadingSessions()) {
          <div class="animate-pulse space-y-3">
            <div class="h-16 bg-gray-200 rounded-lg"></div>
            <div class="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        } @else if (sessions().length === 0) {
          <p class="text-sm text-gray-500">Nenhuma sessão ativa encontrada.</p>
        } @else {
          <ul class="space-y-3" role="list" aria-label="Lista de sessões ativas">
            @for (session of sessions(); track session.id) {
              <li class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                <div>
                  <p class="text-sm font-medium text-gray-800">
                    {{ session.device }}
                    @if (session.isCurrent) {
                      <span class="ml-2 text-xs font-semibold text-brand-600">(sessão atual)</span>
                    }
                  </p>
                  <p class="text-xs text-gray-500">
                    IP: {{ session.ipMasked }} · Último acesso: {{ session.lastAccessAt }}
                  </p>
                </div>
                @if (!session.isCurrent) {
                  <button
                    type="button"
                    class="h-9 px-4 rounded-lg text-sm font-medium text-error-600 border border-error-300 hover:bg-error-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    [disabled]="endingSession() === session.id"
                    (click)="onEndSession(session.id)"
                    [attr.aria-label]="'Encerrar sessão de ' + session.device">
                    @if (endingSession() === session.id) {
                      Encerrando...
                    } @else {
                      Encerrar
                    }
                  </button>
                }
              </li>
            }
          </ul>
        }
      </section>
    </div>
  `,
})
export class SecurityComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);

  readonly changingPassword = signal(false);
  readonly loadingSessions = signal(true);
  readonly sessions = signal<UserSession[]>([]);
  readonly endingSession = signal<string | null>(null);

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordMatchValidator] },
  );

  async ngOnInit(): Promise<void> {
    await this.loadSessions();
  }

  showPasswordError(field: string): boolean {
    const control = this.passwordForm.get(field);
    return control !== null && control.invalid && control.touched;
  }

  showMismatchError(): boolean {
    const confirmControl = this.passwordForm.controls.confirmPassword;
    return (
      confirmControl.touched &&
      confirmControl.valid &&
      this.passwordForm.hasError('passwordMismatch')
    );
  }

  async onChangePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.changingPassword.set(true);

    try {
      const { currentPassword, newPassword } = this.passwordForm.getRawValue();
      await this.profileService.changePassword({ currentPassword, newPassword });
      this.passwordForm.reset();
      this.toast.success('Senha alterada com sucesso!');
    } catch {
      this.toast.error('Erro ao alterar senha. Verifique sua senha atual.');
    } finally {
      this.changingPassword.set(false);
    }
  }

  async onEndSession(sessionId: string): Promise<void> {
    this.endingSession.set(sessionId);

    try {
      await this.profileService.endSession(sessionId);
      this.sessions.update((sessions) =>
        sessions.filter((s) => s.id !== sessionId),
      );
      this.toast.success('Sessão encerrada com sucesso!');
    } catch {
      this.toast.error('Erro ao encerrar sessão.');
    } finally {
      this.endingSession.set(null);
    }
  }

  private async loadSessions(): Promise<void> {
    try {
      const sessions = await this.profileService.loadSessions();
      this.sessions.set(sessions);
    } catch {
      this.toast.error('Erro ao carregar sessões.');
    } finally {
      this.loadingSessions.set(false);
    }
  }
}

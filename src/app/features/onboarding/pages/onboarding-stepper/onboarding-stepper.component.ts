import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { VehicleService } from '../../../profile/services/vehicle.service';
import { ProfileService } from '../../services/profile.service';
import type { CommunicationPreferences } from '../../../../core/models/user.model';
import {
  MERCOSUL_PLATE_REGEX,
  OLD_PLATE_REGEX,
  validateRenavamCheckDigit,
} from '../../../../core/models/vehicle.model';

interface StepConfig {
  readonly index: number;
  readonly label: string;
  readonly description: string;
}

export const ONBOARDING_STEPS: readonly StepConfig[] = [
  { index: 0, label: 'Bem-vindo', description: 'Informações importantes' },
  { index: 1, label: 'Veículo', description: 'Cadastre seu veículo' },
  { index: 2, label: 'Comunicação', description: 'Preferências de contato' },
  { index: 3, label: 'Pronto!', description: 'Comece a usar' },
] as const;

@Component({
  selector: 'app-onboarding-stepper',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Stepper progress indicator -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        @for (step of steps; track step.index) {
          <div class="flex flex-col items-center flex-1">
            <div
              class="flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-colors"
              [class.bg-brand-600]="step.index <= currentStep()"
              [class.text-white]="step.index <= currentStep()"
              [class.bg-gray-200]="step.index > currentStep()"
              [class.text-gray-500]="step.index > currentStep()"
              [attr.aria-current]="step.index === currentStep() ? 'step' : null">
              @if (step.index < currentStep()) {
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              } @else {
                {{ step.index + 1 }}
              }
            </div>
            <span
              class="mt-1 text-xs font-medium hidden sm:block"
              [class.text-brand-600]="step.index <= currentStep()"
              [class.text-gray-400]="step.index > currentStep()">
              {{ step.label }}
            </span>
          </div>
          @if (step.index < steps.length - 1) {
            <div
              class="flex-1 h-0.5 mx-2 transition-colors"
              [class.bg-brand-600]="step.index < currentStep()"
              [class.bg-gray-200]="step.index >= currentStep()">
            </div>
          }
        }
      </div>
    </div>

    <!-- Step content -->
    <div class="min-h-70">
      @switch (currentStep()) {
        <!-- Step 1: Welcome -->
        @case (0) {
          <div>
            <h2 class="text-xl font-bold text-gray-900 mb-2">Bem-vindo ao Justifica.AI!</h2>
            <p class="text-sm text-gray-600 mb-4">
              Antes de começar, é importante que você saiba:
            </p>
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p class="text-sm text-amber-800 leading-relaxed">
                <strong>Aviso legal:</strong> O Justifica.AI é uma ferramenta de auxílio à redação de
                recursos administrativos contra multas de trânsito. Não somos um escritório de advocacia
                e não prestamos assessoria jurídica. O resultado do recurso depende exclusivamente da
                análise do órgão de trânsito competente.
              </p>
            </div>
            <p class="text-sm text-gray-600 mb-6">
              Nos próximos passos, você poderá cadastrar seu veículo e definir suas preferências
              de comunicação. Você pode pular qualquer etapa e completar depois.
            </p>
            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 h-11 rounded-lg font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                (click)="nextStep()">
                Entendi, continuar
              </button>
              <button
                type="button"
                class="h-11 px-4 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                (click)="skipStep()">
                Pular
              </button>
            </div>
          </div>
        }

        <!-- Step 2: Vehicle registration -->
        @case (1) {
          <div>
            <h2 class="text-xl font-bold text-gray-900 mb-2">Cadastre seu veículo</h2>
            <p class="text-sm text-gray-600 mb-4">
              Adicione os dados do veículo para agilizar o preenchimento dos seus recursos.
            </p>
            <form [formGroup]="vehicleForm" (ngSubmit)="saveVehicle()" class="space-y-4">
              <div>
                <label for="plate" class="block text-sm font-medium text-gray-700 mb-1">
                  Placa <span class="text-error-500">*</span>
                  <span class="sr-only">(obrigatório)</span>
                </label>
                <input
                  id="plate"
                  formControlName="plate"
                  type="text"
                  placeholder="ABC1D23 ou ABC-1234"
                  maxlength="8"
                  class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm uppercase placeholder:normal-case focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  [class.border-error-500]="showVehicleError('plate')"
                  (input)="onPlateInput($event)"
                  aria-describedby="plate-error" />
                @if (showVehicleError('plate')) {
                  <p id="plate-error" class="mt-1 text-xs text-error-500" role="alert">
                    {{ getVehicleError('plate') }}
                  </p>
                }
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="brand" class="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input
                    id="brand"
                    formControlName="brand"
                    type="text"
                    placeholder="Ex: Volkswagen"
                    class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors" />
                </div>
                <div>
                  <label for="model" class="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                  <input
                    id="model"
                    formControlName="model"
                    type="text"
                    placeholder="Ex: Gol"
                    class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors" />
                </div>
              </div>
              <div>
                <label for="renavam" class="block text-sm font-medium text-gray-700 mb-1">RENAVAM</label>
                <input
                  id="renavam"
                  formControlName="renavam"
                  type="text"
                  placeholder="11 dígitos"
                  maxlength="11"
                  class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  [class.border-error-500]="showVehicleError('renavam')"
                  aria-describedby="renavam-error" />
                @if (showVehicleError('renavam')) {
                  <p id="renavam-error" class="mt-1 text-xs text-error-500" role="alert">
                    {{ getVehicleError('renavam') }}
                  </p>
                }
              </div>
              <div class="flex gap-3">
                <button
                  type="submit"
                  class="flex-1 h-11 rounded-lg font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  [disabled]="savingVehicle()">
                  @if (savingVehicle()) {
                    Salvando...
                  } @else {
                    Salvar e continuar
                  }
                </button>
                <button
                  type="button"
                  class="h-11 px-4 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                  (click)="skipStep()">
                  Fazer depois
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Step 3: Communication preferences -->
        @case (2) {
          <div>
            <h2 class="text-xl font-bold text-gray-900 mb-2">Preferências de comunicação</h2>
            <p class="text-sm text-gray-600 mb-6">
              Escolha como deseja receber novidades e informações sobre seus recursos.
            </p>
            <div class="space-y-4 mb-6">
              <label class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <div>
                  <span class="text-sm font-medium text-gray-900">E-mail marketing</span>
                  <p class="text-xs text-gray-500 mt-0.5">Receba dicas, novidades e promoções por e-mail</p>
                </div>
                <input
                  type="checkbox"
                  [checked]="emailMarketing()"
                  (change)="emailMarketing.set(!emailMarketing())"
                  class="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  aria-label="Ativar e-mail marketing" />
              </label>
              <label class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <div>
                  <span class="text-sm font-medium text-gray-900">WhatsApp</span>
                  <p class="text-xs text-gray-500 mt-0.5">Receba atualizações sobre seus recursos via WhatsApp</p>
                </div>
                <input
                  type="checkbox"
                  [checked]="whatsapp()"
                  (change)="whatsapp.set(!whatsapp())"
                  class="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  aria-label="Ativar WhatsApp" />
              </label>
              <label class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <div>
                  <span class="text-sm font-medium text-gray-900">SMS</span>
                  <p class="text-xs text-gray-500 mt-0.5">Receba notificações rápidas por SMS</p>
                </div>
                <input
                  type="checkbox"
                  [checked]="sms()"
                  (change)="sms.set(!sms())"
                  class="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  aria-label="Ativar SMS" />
              </label>
            </div>
            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 h-11 rounded-lg font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="savingPreferences()"
                (click)="savePreferences()">
                @if (savingPreferences()) {
                  Salvando...
                } @else {
                  Salvar e continuar
                }
              </button>
              <button
                type="button"
                class="h-11 px-4 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                (click)="skipStep()">
                Pular
              </button>
            </div>
          </div>
        }

        <!-- Step 4: Done -->
        @case (3) {
          <div class="text-center">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 mb-4">
              <svg class="w-8 h-8 text-accent-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-gray-900 mb-2">Tudo pronto!</h2>
            <p class="text-sm text-gray-600 mb-8">
              Seu perfil está configurado. Agora você pode gerar seu primeiro recurso de multa
              ou explorar a plataforma.
            </p>
            <div class="space-y-3">
              <button
                type="button"
                class="w-full h-11 rounded-lg font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="completing()"
                (click)="completeOnboarding('/appeals/new')">
                @if (completing()) {
                  Finalizando...
                } @else {
                  Gerar meu primeiro recurso →
                }
              </button>
              <button
                type="button"
                class="w-full h-11 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
                [disabled]="completing()"
                (click)="completeOnboarding('/')">
                Explorar a plataforma
              </button>
            </div>
          </div>
        }
      }
    </div>

    <!-- Step counter (mobile) -->
    <div class="mt-6 text-center sm:hidden">
      <span class="text-xs text-gray-400">
        Passo {{ currentStep() + 1 }} de {{ steps.length }}
      </span>
    </div>
  `,
})
export class OnboardingStepperComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly vehicleService = inject(VehicleService);
  private readonly profileService = inject(ProfileService);

  readonly steps = ONBOARDING_STEPS;
  readonly currentStep = signal(0);
  readonly savingVehicle = signal(false);
  readonly savingPreferences = signal(false);
  readonly completing = signal(false);

  // Communication preferences (all unchecked by default per ROADMAP)
  readonly emailMarketing = signal(false);
  readonly whatsapp = signal(false);
  readonly sms = signal(false);

  // Vehicle reactive form
  readonly vehicleForm = this.fb.nonNullable.group({
    plate: ['', [Validators.required, Validators.minLength(7), this.plateValidator]],
    brand: [''],
    model: [''],
    renavam: ['', [this.renavamValidator]],
  });

  readonly submitted = signal(false);

  readonly isLastStep = computed(() => this.currentStep() === this.steps.length - 1);

  ngOnInit(): void {
    // Load profile in background to ensure fresh data
    this.profileService.loadProfile().catch(() => {
      // Silently fail — guard already handled redirect
    });
  }

  nextStep(): void {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update((s) => s + 1);
    }
  }

  skipStep(): void {
    this.nextStep();
  }

  async saveVehicle(): Promise<void> {
    this.submitted.set(true);

    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }

    this.savingVehicle.set(true);

    try {
      const { plate, brand, model, renavam } = this.vehicleForm.getRawValue();
      await this.vehicleService.createVehicle({
        plate: plate.toUpperCase().replaceAll(/[^A-Z0-9]/g, ''),
        brand: brand || undefined,
        model: model || undefined,
        renavam: renavam || undefined,
        isDefault: true,
      });
      this.toast.success('Veículo cadastrado com sucesso!');
      this.nextStep();
    } catch {
      this.toast.error('Erro ao cadastrar veículo. Tente novamente.');
    } finally {
      this.savingVehicle.set(false);
    }
  }

  async savePreferences(): Promise<void> {
    this.savingPreferences.set(true);

    try {
      const preferences: CommunicationPreferences = {
        emailMarketing: this.emailMarketing(),
        whatsapp: this.whatsapp(),
        sms: this.sms(),
      };
      await this.profileService.updatePreferences(preferences);
      this.toast.success('Preferências salvas com sucesso!');
      this.nextStep();
    } catch {
      this.toast.error('Erro ao salvar preferências. Tente novamente.');
    } finally {
      this.savingPreferences.set(false);
    }
  }

  async completeOnboarding(redirectTo: string): Promise<void> {
    this.completing.set(true);

    try {
      await this.profileService.updateProfile({ onboardingCompleted: true });
      await this.router.navigate([redirectTo]);
    } catch {
      this.toast.error('Erro ao finalizar. Tente novamente.');
    } finally {
      this.completing.set(false);
    }
  }

  onPlateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.toUpperCase().replaceAll(/[^A-Z0-9]/g, '');
    if (value.length > 7) {
      value = value.substring(0, 7);
    }
    input.value = value;
    this.vehicleForm.controls.plate.setValue(value, { emitEvent: false });
  }

  showVehicleError(field: 'plate' | 'renavam'): boolean {
    const control = this.vehicleForm.controls[field];
    return control.invalid && (control.touched || this.submitted());
  }

  getVehicleError(field: 'plate' | 'renavam'): string {
    const control = this.vehicleForm.controls[field];
    if (control.hasError('required')) return 'Campo obrigatório';
    if (control.hasError('minlength')) return 'Placa inválida';
    if (control.hasError('invalidPlate')) return 'Formato de placa inválido (ex: ABC1D23 ou ABC1234)';
    if (control.hasError('invalidRenavam')) return 'RENAVAM inválido (11 dígitos)';
    return '';
  }

  private plateValidator(control: import('@angular/forms').AbstractControl): import('@angular/forms').ValidationErrors | null {
    const value = control.value?.toUpperCase().replaceAll(/[^A-Z0-9]/g, '') ?? '';
    if (!value) return null;
    if (MERCOSUL_PLATE_REGEX.test(value) || OLD_PLATE_REGEX.test(value.replace('-', ''))) return null;
    return { invalidPlate: true };
  }

  private renavamValidator(control: import('@angular/forms').AbstractControl): import('@angular/forms').ValidationErrors | null {
    const value = control.value ?? '';
    if (!value) return null;
    if (value.length !== 11 || !/^\d{11}$/.test(value)) return { invalidRenavam: true };
    if (!validateRenavamCheckDigit(value)) return { invalidRenavam: true };
    return null;
  }
}

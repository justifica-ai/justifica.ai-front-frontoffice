import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppealFormService } from '../../services/appeal-form.service';
import {
  APPEAL_STEPS,
  AppealType,
} from '../../models/appeal-form.model';
import { ToastService } from '../../../../core/services/toast.service';
import { StepVehicleComponent } from './steps/step-vehicle/step-vehicle.component';
import { StepInfractionComponent } from './steps/step-infraction/step-infraction.component';
import { StepDriverComponent } from './steps/step-driver/step-driver.component';
import { StepArgumentsComponent } from './steps/step-arguments/step-arguments.component';

const APPEAL_TYPE_LABELS: Record<AppealType, string> = {
  prior_defense: 'Defesa Prévia',
  first_instance: 'Recurso em 1ª Instância',
  second_instance: 'Recurso em 2ª Instância',
};

@Component({
  selector: 'app-new-appeal',
  standalone: true,
  imports: [
    StepVehicleComponent,
    StepInfractionComponent,
    StepDriverComponent,
    StepArgumentsComponent,
  ],
  providers: [AppealFormService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto px-4 py-6 md:py-10">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Novo Recurso</h1>
        <p class="text-sm text-gray-500">
          {{ appealTypeLabel() }} — Preencha os dados para gerar seu recurso
        </p>
      </div>

      <!-- Stepper indicator -->
      <nav aria-label="Etapas do formulário" class="mb-8">
        <ol class="flex items-center w-full">
          @for (step of steps; track step.index; let last = $last) {
            <li
              class="flex items-center"
              [class.flex-1]="!last"
              [class.w-auto]="last"
            >
              <button
                type="button"
                (click)="goToStep(step.index)"
                class="flex items-center gap-2 group"
                [attr.aria-current]="currentStep() === step.index ? 'step' : null"
                [attr.aria-label]="step.label + (isStepCompleted(step.index) ? ' — concluída' : currentStep() === step.index ? ' — etapa atual' : '')"
              >
                <!-- Step circle -->
                <span
                  class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors flex-shrink-0"
                  [class.bg-brand-600]="currentStep() === step.index"
                  [class.text-white]="currentStep() === step.index"
                  [class.bg-accent-500]="isStepCompleted(step.index) && currentStep() !== step.index"
                  [class.text-white]="isStepCompleted(step.index) && currentStep() !== step.index"
                  [class.bg-gray-200]="!isStepCompleted(step.index) && currentStep() !== step.index"
                  [class.text-gray-500]="!isStepCompleted(step.index) && currentStep() !== step.index"
                >
                  @if (isStepCompleted(step.index) && currentStep() !== step.index) {
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  } @else {
                    {{ step.index + 1 }}
                  }
                </span>

                <!-- Step label (hidden on mobile) -->
                <span
                  class="hidden md:block text-xs font-medium transition-colors"
                  [class.text-brand-700]="currentStep() === step.index"
                  [class.text-accent-600]="isStepCompleted(step.index) && currentStep() !== step.index"
                  [class.text-gray-400]="!isStepCompleted(step.index) && currentStep() !== step.index"
                >
                  {{ step.label }}
                </span>
              </button>

              <!-- Connector line -->
              @if (!last) {
                <div
                  class="flex-1 h-0.5 mx-2 md:mx-4 transition-colors"
                  [class.bg-accent-500]="isStepCompleted(step.index)"
                  [class.bg-gray-200]="!isStepCompleted(step.index)"
                ></div>
              }
            </li>
          }
        </ol>
      </nav>

      <!-- Auto-save indicator -->
      <div class="flex items-center justify-end gap-2 mb-4 h-5">
        @if (formService.isSaving()) {
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <div class="w-3 h-3 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin"></div>
            Salvando...
          </div>
        } @else if (formService.lastSavedAt()) {
          <div class="flex items-center gap-1 text-xs text-accent-600">
            <span>💾</span> Salvo
          </div>
        }
      </div>

      <!-- Step content -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
        @switch (currentStep()) {
          @case (0) { <app-step-vehicle /> }
          @case (1) { <app-step-infraction /> }
          @case (2) { <app-step-driver /> }
          @case (3) { <app-step-arguments /> }
          @case (4) {
            <!-- Review & Summary -->
            <div class="space-y-6">
              <div>
                <h2 class="text-lg font-bold text-gray-800 mb-1">Revisão do Recurso</h2>
                <p class="text-sm text-gray-500">
                  Confira os dados antes de gerar seu recurso.
                </p>
              </div>

              <!-- Vehicle summary -->
              <div class="border border-gray-200 rounded-xl p-4">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span>🚗</span> Veículo
                  </h3>
                  <button
                    type="button"
                    (click)="goToStep(0)"
                    class="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    aria-label="Editar dados do veículo"
                  >
                    Editar
                  </button>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span class="text-gray-400 text-xs">Placa</span>
                    <p class="font-medium text-gray-700">{{ formService.formState().vehicle.plate || '—' }}</p>
                  </div>
                  <div>
                    <span class="text-gray-400 text-xs">Marca/Modelo</span>
                    <p class="font-medium text-gray-700">{{ vehicleSummary() }}</p>
                  </div>
                  <div>
                    <span class="text-gray-400 text-xs">Ano</span>
                    <p class="font-medium text-gray-700">{{ formService.formState().vehicle.year || '—' }}</p>
                  </div>
                </div>
              </div>

              <!-- Infraction summary -->
              <div class="border border-gray-200 rounded-xl p-4">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span>📋</span> Infração
                  </h3>
                  <button
                    type="button"
                    (click)="goToStep(1)"
                    class="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    aria-label="Editar dados da infração"
                  >
                    Editar
                  </button>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span class="text-gray-400 text-xs">Auto Nº</span>
                    <p class="font-medium text-gray-700">{{ formService.formState().infraction.autoNumber || '—' }}</p>
                  </div>
                  <div>
                    <span class="text-gray-400 text-xs">Código CTB</span>
                    <p class="font-medium text-gray-700">{{ formService.formState().infraction.infractionCode || '—' }}</p>
                  </div>
                  <div>
                    <span class="text-gray-400 text-xs">Data</span>
                    <p class="font-medium text-gray-700">{{ formService.formState().infraction.infractionDate || '—' }}</p>
                  </div>
                  <div class="col-span-2 md:col-span-3">
                    <span class="text-gray-400 text-xs">Descrição</span>
                    <p class="font-medium text-gray-700">{{ formService.formState().infraction.infractionDescription || '—' }}</p>
                  </div>
                </div>
              </div>

              <!-- Driver summary -->
              <div class="border border-gray-200 rounded-xl p-4">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span>👤</span> Condutor
                  </h3>
                  <button
                    type="button"
                    (click)="goToStep(2)"
                    class="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    aria-label="Editar dados do condutor"
                  >
                    Editar
                  </button>
                </div>
                <div class="text-sm">
                  @if (formService.formState().driver.isOwner) {
                    <p class="text-gray-600">Proprietário do veículo</p>
                  } @else {
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <span class="text-gray-400 text-xs">Nome</span>
                        <p class="font-medium text-gray-700">{{ formService.formState().driver.driverName || '—' }}</p>
                      </div>
                      <div>
                        <span class="text-gray-400 text-xs">CNH</span>
                        <p class="font-medium text-gray-700">{{ formService.formState().driver.driverCnh || '—' }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Arguments summary -->
              <div class="border border-gray-200 rounded-xl p-4">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span>💬</span> Argumentos
                  </h3>
                  <button
                    type="button"
                    (click)="goToStep(3)"
                    class="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    aria-label="Editar argumentos de defesa"
                  >
                    Editar
                  </button>
                </div>
                <div class="text-sm">
                  <div class="flex flex-wrap gap-1.5 mb-2">
                    @for (reason of formService.formState().arguments.defenseReasons; track reason) {
                      <span class="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs rounded-full font-medium">
                        {{ reason }}
                      </span>
                    }
                  </div>
                  @if (formService.formState().arguments.additionalDetails) {
                    <p class="text-gray-600 text-sm">{{ formService.formState().arguments.additionalDetails }}</p>
                  }
                  @if (formService.formState().uploadedFiles.length > 0) {
                    <p class="text-xs text-gray-400 mt-2">
                      📎 {{ formService.formState().uploadedFiles.length }} arquivo(s) anexado(s)
                    </p>
                  }
                </div>
              </div>

              <!-- Generate CTA -->
              <div class="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  (click)="goToStep(3)"
                  class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  (click)="generateAppeal()"
                  [disabled]="isGenerating()"
                  class="flex-1 px-8 py-3 bg-brand-600 text-white rounded-xl font-bold text-base hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  @if (isGenerating()) {
                    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gerando recurso...
                  } @else {
                    Gerar meu recurso
                  }
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class NewAppealComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly formService = inject(AppealFormService);

  readonly steps = APPEAL_STEPS;
  readonly isGenerating = signal(false);

  readonly currentStep = computed(() => this.formService.formState().currentStep);

  readonly appealTypeLabel = computed(() => {
    const type = this.formService.formState().appealType;
    return APPEAL_TYPE_LABELS[type] ?? '';
  });

  readonly vehicleSummary = computed(() => {
    const v = this.formService.formState().vehicle;
    const parts = [v.brand, v.model].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '—';
  });

  ngOnInit(): void {
    const type = this.route.snapshot.queryParamMap.get('type') as AppealType | null;

    if (!type || !['prior_defense', 'first_instance', 'second_instance'].includes(type)) {
      this.router.navigate(['/appeals/new']);
      return;
    }

    this.formService.initialize(type);
  }

  ngOnDestroy(): void {
    // Service handles cleanup via its own ngOnDestroy
  }

  goToStep(step: number): void {
    this.formService.goToStep(step);
  }

  isStepCompleted(stepIndex: number): boolean {
    return stepIndex < this.currentStep();
  }

  async generateAppeal(): Promise<void> {
    this.isGenerating.set(true);

    try {
      await this.formService.saveNow();

      const appealId = this.formService.appealId();
      if (!appealId) {
        this.toast.error('Erro ao criar rascunho. Tente novamente.');
        return;
      }

      this.formService.clearLocalStorage();
      this.router.navigate(['/payment', appealId]);
    } catch {
      this.toast.error('Erro ao processar. Tente novamente.');
    } finally {
      this.isGenerating.set(false);
    }
  }
}

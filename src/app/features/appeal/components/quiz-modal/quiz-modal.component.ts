import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';

export type AppealType = 'prior_defense' | 'first_instance' | 'second_instance';

interface QuizStep {
  question: string;
  yesLabel: string;
  noLabel: string;
}

const QUIZ_STEPS: QuizStep[] = [
  {
    question: 'Você já recebeu a notificação de penalidade (com valor e prazo de pagamento)?',
    yesLabel: 'Sim, recebi',
    noLabel: 'Ainda não',
  },
  {
    question: 'Você já apresentou Defesa Prévia ou Recurso na JARI?',
    yesLabel: 'Sim, já apresentei e foi negado',
    noLabel: 'Não apresentei nada',
  },
  {
    question: 'Seu recurso foi negado pela JARI?',
    yesLabel: 'Sim, foi negado',
    noLabel: 'Não sei',
  },
];

@Component({
  selector: 'app-quiz-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-40 bg-black/50 transition-opacity"
      role="presentation"
      (click)="close.emit()"
      (keydown.escape)="close.emit()"
    ></div>

    <!-- Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-title"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-up"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 pb-0">
          <h2
            id="quiz-title"
            class="text-lg font-bold text-gray-800"
          >
            Qual recurso é o certo para mim?
          </h2>
          <button
            type="button"
            (click)="close.emit()"
            aria-label="Fechar quiz"
            class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
          @if (result()) {
            <!-- Result -->
            <div class="text-center py-4">
              <div
                class="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-50 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p class="text-sm text-gray-500 mb-2">O recurso ideal para o seu caso é:</p>
              <p class="text-xl font-bold text-brand-700 mb-1">
                {{ resultLabel() }}
              </p>
              <p class="text-sm text-gray-500 mb-6">
                {{ resultDescription() }}
              </p>
              <div class="flex gap-3 justify-center">
                <button
                  type="button"
                  (click)="selectResult()"
                  class="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
                >
                  Selecionar este tipo
                </button>
                <button
                  type="button"
                  (click)="restart()"
                  class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
                >
                  Refazer
                </button>
              </div>
            </div>
          } @else if (showDontKnowHelp()) {
            <!-- "Não sei" help screen -->
            <div class="text-center py-4">
              <div
                class="w-16 h-16 mx-auto mb-4 rounded-full bg-warning-50 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-base font-semibold text-gray-800 mb-2">Sem problema!</p>
              <p class="text-sm text-gray-600 mb-4">
                Verifique o resultado do seu recurso no site do DETRAN do seu estado
                ou entre em contato com o órgão autuador. Se ainda tiver dúvida,
                o <strong>Recurso em 1ª Instância</strong> é o mais comum.
              </p>
              <div class="flex gap-3 justify-center">
                <button
                  type="button"
                  (click)="selectType.emit('first_instance')"
                  class="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
                >
                  Usar 1ª Instância
                </button>
                <button
                  type="button"
                  (click)="restart()"
                  class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
                >
                  Refazer quiz
                </button>
              </div>
            </div>
          } @else {
            <!-- Question -->
            <div class="mb-2">
              <div class="flex items-center gap-2 mb-4">
                @for (step of QUIZ_STEPS; track $index) {
                  <div
                    class="h-1.5 flex-1 rounded-full transition-colors"
                    [class.bg-brand-500]="$index <= currentStep()"
                    [class.bg-gray-200]="$index > currentStep()"
                  ></div>
                }
              </div>
              <p class="text-sm text-gray-500 mb-1">
                Pergunta {{ currentStep() + 1 }} de {{ QUIZ_STEPS.length }}
              </p>
            </div>
            <p class="text-base font-semibold text-gray-800 mb-6">
              {{ QUIZ_STEPS[currentStep()].question }}
            </p>
            <div class="flex flex-col gap-3">
              <button
                type="button"
                (click)="answer(true)"
                class="w-full p-4 border-2 border-gray-200 rounded-xl text-left text-sm font-medium text-gray-700 hover:border-brand-400 hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
              >
                {{ QUIZ_STEPS[currentStep()].yesLabel }}
              </button>
              <button
                type="button"
                (click)="answer(false)"
                class="w-full p-4 border-2 border-gray-200 rounded-xl text-left text-sm font-medium text-gray-700 hover:border-brand-400 hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
              >
                {{ QUIZ_STEPS[currentStep()].noLabel }}
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .warning-50 { background-color: #FFFBEB; }
  `,
})
export class QuizModalComponent {
  readonly close = output<void>();
  readonly selectType = output<AppealType>();

  readonly QUIZ_STEPS = QUIZ_STEPS;

  readonly currentStep = signal(0);
  readonly result = signal<AppealType | null>(null);
  readonly showDontKnowHelp = signal(false);

  answer(yes: boolean): void {
    const step = this.currentStep();

    if (step === 0) {
      if (yes) {
        // Received penalty notification → go to question 2
        this.currentStep.set(1);
      } else {
        // Not yet → Defesa Prévia
        this.result.set('prior_defense');
      }
    } else if (step === 1) {
      if (yes) {
        // Already filed and denied → go to question 3
        this.currentStep.set(2);
      } else {
        // Didn't file anything → 1ª Instância
        this.result.set('first_instance');
      }
    } else if (step === 2) {
      if (yes) {
        // JARI denied → 2ª Instância
        this.result.set('second_instance');
      } else {
        // Doesn't know → show help screen
        this.showDontKnowHelp.set(true);
      }
    }
  }

  resultLabel(): string {
    return LABELS[this.result()!] ?? '';
  }

  resultDescription(): string {
    return DESCRIPTIONS[this.result()!] ?? '';
  }

  selectResult(): void {
    if (this.result()) {
      this.selectType.emit(this.result()!);
    }
  }

  restart(): void {
    this.currentStep.set(0);
    this.result.set(null);
    this.showDontKnowHelp.set(false);
  }
}

const LABELS: Record<AppealType, string> = {
  prior_defense: 'Defesa Prévia',
  first_instance: 'Recurso em 1ª Instância',
  second_instance: 'Recurso em 2ª Instância',
};

const DESCRIPTIONS: Record<AppealType, string> = {
  prior_defense: 'Conteste a multa antes que ela seja aplicada.',
  first_instance: 'Recorra na Junta Administrativa de Recursos de Infrações (JARI).',
  second_instance: 'Recorra ao Conselho Estadual de Trânsito (CETRAN).',
};

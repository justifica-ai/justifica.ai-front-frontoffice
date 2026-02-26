import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { QuizModalComponent, AppealType } from '../../components/quiz-modal/quiz-modal.component';

interface AppealTypeCard {
  type: AppealType;
  emoji: string;
  title: string;
  description: string;
  deadline: string;
  mostCommon: boolean;
}

const APPEAL_TYPE_CARDS: AppealTypeCard[] = [
  {
    type: 'prior_defense',
    emoji: '📝',
    title: 'Defesa Prévia',
    description:
      'Você acabou de receber a notificação da multa e quer contestar ANTES que ela seja aplicada.',
    deadline: 'Até 30 dias após notificação da autuação',
    mostCommon: false,
  },
  {
    type: 'first_instance',
    emoji: '📄',
    title: 'Recurso em 1ª Instância',
    description:
      'A multa já foi aplicada e você quer recorrer na Junta Administrativa (JARI).',
    deadline: 'Até 30 dias após notificação de penalidade',
    mostCommon: true,
  },
  {
    type: 'second_instance',
    emoji: '📑',
    title: 'Recurso em 2ª Instância',
    description:
      'Seu recurso na JARI foi negado e você quer recorrer ao Conselho Estadual de Trânsito.',
    deadline: 'Até 30 dias após resultado da JARI',
    mostCommon: false,
  },
];

@Component({
  selector: 'app-resource-type-selection',
  standalone: true,
  imports: [QuizModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto px-4 py-6 md:py-10">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Qual tipo de recurso você precisa?
        </h1>
        <p class="text-sm md:text-base text-gray-500">
          Selecione o tipo de recurso administrativo adequado para sua situação.
        </p>
      </div>

      <!-- Cards -->
      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        role="radiogroup"
        aria-label="Tipo de recurso"
      >
        @for (card of cards; track card.type) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="selectedType() === card.type"
            [attr.aria-label]="card.title + ': ' + card.description"
            (click)="selectType(card.type)"
            class="relative flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 hover:shadow-md"
            [class.border-brand-500]="selectedType() === card.type"
            [class.bg-brand-50]="selectedType() === card.type"
            [class.shadow-md]="selectedType() === card.type"
            [class.border-gray-200]="selectedType() !== card.type"
            [class.bg-white]="selectedType() !== card.type"
            [class.hover:border-brand-300]="selectedType() !== card.type"
          >
            <!-- Most common badge -->
            @if (card.mostCommon) {
              <span
                class="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent-500 text-white text-xs font-bold rounded-full whitespace-nowrap"
              >
                Mais comum
              </span>
            }

            <!-- Selection check -->
            @if (selectedType() === card.type) {
              <div
                class="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            }

            <!-- Emoji -->
            <span class="text-3xl mb-3" aria-hidden="true">{{ card.emoji }}</span>

            <!-- Title -->
            <h2
              class="text-base font-bold mb-1.5"
              [class.text-brand-700]="selectedType() === card.type"
              [class.text-gray-800]="selectedType() !== card.type"
            >
              {{ card.title }}
            </h2>

            <!-- Description -->
            <p class="text-sm text-gray-500 mb-3 leading-relaxed">
              {{ card.description }}
            </p>

            <!-- Deadline badge -->
            <span
              class="inline-flex items-center gap-1.5 mt-auto px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ card.deadline }}
            </span>
          </button>
        }
      </div>

      <!-- Quiz link -->
      <div class="text-center mb-8">
        <button
          type="button"
          (click)="openQuiz()"
          class="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium hover:underline focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-lg px-2 py-1 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Não sei qual escolher
        </button>
      </div>

      <!-- Continue button -->
      <div class="flex justify-center">
        <button
          type="button"
          [disabled]="!selectedType()"
          (click)="continueToForm()"
          class="w-full md:w-auto px-8 py-3 bg-brand-600 text-white rounded-xl font-semibold text-base hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-600"
        >
          Continuar
        </button>
      </div>
    </div>

    <!-- Quiz Modal -->
    @if (quizOpen()) {
      <app-quiz-modal
        (close)="closeQuiz()"
        (selectType)="onQuizResult($event)"
      />
    }
  `,
})
export class ResourceTypeSelectionComponent {
  readonly cards = APPEAL_TYPE_CARDS;
  readonly selectedType = signal<AppealType | null>(null);
  readonly quizOpen = signal(false);

  private usedQuiz = false;
  private readonly router = inject(Router);

  selectType(type: AppealType): void {
    this.selectedType.set(type);
  }

  openQuiz(): void {
    this.quizOpen.set(true);
  }

  closeQuiz(): void {
    this.quizOpen.set(false);
  }

  onQuizResult(type: AppealType): void {
    this.usedQuiz = true;
    this.selectedType.set(type);
    this.quizOpen.set(false);
  }

  continueToForm(): void {
    const type = this.selectedType();
    if (!type) return;

    this.dispatchAnalytics(type);
    this.router.navigate(['/appeals/new/form'], { queryParams: { type } });
  }

  private dispatchAnalytics(type: AppealType): void {
    window.dispatchEvent(
      new CustomEvent('form_started', {
        detail: { type, usedQuiz: this.usedQuiz },
      }),
    );
  }
}

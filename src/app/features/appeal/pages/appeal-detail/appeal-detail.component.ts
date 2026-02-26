import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { environment } from '../../../../../environments/environment';
import { API_ROUTES } from '../../../../core/constants/api-routes';
import { ToastService } from '../../../../core/services/toast.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

// ─── Response interfaces ───

export interface AppealDetailResponse {
  id: string;
  userId: string;
  vehicleId: string | null;
  infractionId: string | null;
  status: string;
  appealType: string | null;
  formData: AppealFormData | null;
  generatedContent: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppealFormData {
  vehicle?: {
    plate?: string;
    brand?: string;
    model?: string;
    year?: string;
    color?: string;
    renavam?: string;
  };
  infraction?: {
    autoNumber?: string;
    infractionDate?: string;
    infractionTime?: string;
    infractionCode?: string;
    infractionDescription?: string;
    location?: string;
    organName?: string;
    notificationDate?: string;
    speedMeasured?: string;
    speedLimit?: string;
  };
  driver?: {
    isOwner?: boolean;
    driverName?: string;
    driverCnhCategory?: string;
  };
  arguments?: {
    defenseReasons?: string[];
    additionalDetails?: string;
  };
}

export interface DocumentResponse {
  documentId: string;
  appealId: string;
  content: string;
  version: number;
  createdAt: string;
}

// ─── Timeline step definition ───

interface TimelineStep {
  key: string;
  label: string;
  icon: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { key: 'draft', label: 'Rascunho', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
  { key: 'generated', label: 'Gerado', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'awaiting_payment', label: 'Pagamento', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'paid', label: 'Pago', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const STATUS_ORDER: Record<string, number> = {
  draft: 0,
  generated: 1,
  awaiting_payment: 2,
  paid: 3,
  downloaded: 3,
};

const APPEAL_TYPE_MAP: Record<string, string> = {
  first_instance: 'Recurso de 1ª Instância',
  second_instance: 'Recurso de 2ª Instância',
  prior_defense: 'Defesa Prévia',
  detran: 'Defesa DETRAN',
  jari: 'Recurso JARI',
  cetran: 'Recurso CETRAN',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  draft: 'Rascunho',
  generated: 'Gerado',
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Pago',
  downloaded: 'Baixado',
  expired: 'Expirado',
  generation_failed: 'Falha na geração',
};

@Component({
  selector: 'app-appeal-detail',
  standalone: true,
  imports: [StatusBadgeComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-2xl px-4 py-8">
      @if (loading()) {
        <div class="space-y-4">
          <app-skeleton-loader height="2rem" width="50%" />
          <app-skeleton-loader height="4rem" />
          <app-skeleton-loader height="12rem" />
          <app-skeleton-loader height="8rem" />
        </div>
      } @else if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p class="text-sm text-red-600">{{ error() }}</p>
          <button
            type="button"
            class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            (click)="loadAppeal()"
            aria-label="Tentar carregar recurso novamente"
          >
            Tentar novamente
          </button>
        </div>
      } @else if (appeal()) {
        <!-- Header -->
        <div class="mb-6 flex items-start justify-between">
          <div>
            <button
              type="button"
              class="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 transition"
              (click)="navigateBack()"
              aria-label="Voltar para lista de recursos"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
            <h1 class="text-2xl font-bold text-gray-800">
              Detalhes do Recurso
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              Criado em {{ formattedCreatedAt() }}
            </p>
          </div>
          <app-status-badge
            [status]="appeal()!.status"
            [label]="statusLabel()"
          />
        </div>

        <!-- Status Timeline -->
        @if (!isTerminalStatus()) {
          <div
            class="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            role="progressbar"
            [attr.aria-valuenow]="currentStepIndex()"
            [attr.aria-valuemin]="0"
            [attr.aria-valuemax]="3"
            aria-label="Progresso do recurso"
          >
            <div class="flex items-center justify-between">
              @for (step of timelineSteps; track step.key; let i = $index; let last = $last) {
                <div class="flex flex-col items-center text-center" [class.flex-1]="!last">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                    [class.bg-accent-500]="i <= currentStepIndex()"
                    [class.text-white]="i <= currentStepIndex()"
                    [class.bg-gray-200]="i > currentStepIndex()"
                    [class.text-gray-400]="i > currentStepIndex()"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="step.icon" />
                    </svg>
                  </div>
                  <span
                    class="mt-1.5 text-xs font-medium"
                    [class.text-accent-700]="i <= currentStepIndex()"
                    [class.text-gray-400]="i > currentStepIndex()"
                  >
                    {{ step.label }}
                  </span>
                </div>
                @if (!last) {
                  <div
                    class="mx-1 mt-[-1.25rem] h-0.5 flex-1"
                    [class.bg-accent-500]="i < currentStepIndex()"
                    [class.bg-gray-200]="i >= currentStepIndex()"
                  ></div>
                }
              }
            </div>
          </div>
        }

        <!-- Terminal status banner -->
        @if (appeal()!.status === 'expired') {
          <div class="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <svg class="h-6 w-6 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-sm font-medium text-amber-700">
              Este recurso expirou. Crie um novo recurso para continuar.
            </p>
          </div>
        }
        @if (appeal()!.status === 'generation_failed') {
          <div class="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <svg class="h-6 w-6 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm font-medium text-red-700">
              Ocorreu um erro na geração do documento. Tente gerar novamente.
            </p>
          </div>
        }

        <!-- Appeal Type -->
        @if (appealTypeLabel()) {
          <div class="mb-4">
            <span class="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
              {{ appealTypeLabel() }}
            </span>
          </div>
        }

        <!-- Appeal Info Card -->
        <div class="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-bold text-gray-700">Informações do recurso</h2>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            @if (vehiclePlate()) {
              <div>
                <span class="text-xs text-gray-500">Placa do veículo</span>
                <p class="font-medium text-gray-800">{{ vehiclePlate() }}</p>
              </div>
            }
            @if (vehicleDescription()) {
              <div>
                <span class="text-xs text-gray-500">Veículo</span>
                <p class="font-medium text-gray-800">{{ vehicleDescription() }}</p>
              </div>
            }
            @if (infractionCode()) {
              <div>
                <span class="text-xs text-gray-500">Código da infração</span>
                <p class="font-medium text-gray-800">{{ infractionCode() }}</p>
              </div>
            }
            @if (infractionDescription()) {
              <div class="sm:col-span-2">
                <span class="text-xs text-gray-500">Descrição da infração</span>
                <p class="font-medium text-gray-800">{{ infractionDescription() }}</p>
              </div>
            }
            @if (infractionDate()) {
              <div>
                <span class="text-xs text-gray-500">Data da infração</span>
                <p class="font-medium text-gray-800">{{ infractionDate() }}</p>
              </div>
            }
            @if (autoNumber()) {
              <div>
                <span class="text-xs text-gray-500">Nº do auto</span>
                <p class="font-medium text-gray-800">{{ autoNumber() }}</p>
              </div>
            }
            @if (organName()) {
              <div>
                <span class="text-xs text-gray-500">Órgão autuador</span>
                <p class="font-medium text-gray-800">{{ organName() }}</p>
              </div>
            }
            @if (driverName()) {
              <div>
                <span class="text-xs text-gray-500">Condutor</span>
                <p class="font-medium text-gray-800">{{ driverName() }}</p>
              </div>
            }
            @if (defenseReasons().length > 0) {
              <div class="sm:col-span-2">
                <span class="text-xs text-gray-500">Motivos da defesa</span>
                <div class="mt-1 flex flex-wrap gap-1.5">
                  @for (reason of defenseReasons(); track reason) {
                    <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{{ reason }}</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Document Section (paid/downloaded) -->
        @if (isPaid()) {
          @if (document()) {
            <div class="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
              <button
                type="button"
                class="flex w-full items-center justify-between p-5 text-left"
                (click)="toggleDocument()"
                [attr.aria-expanded]="documentExpanded()"
                aria-controls="document-content"
              >
                <h2 class="text-sm font-bold text-gray-700">
                  Documento completo
                </h2>
                <svg
                  class="h-5 w-5 text-gray-400 transition-transform"
                  [class.rotate-180]="documentExpanded()"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              @if (documentExpanded()) {
                <div id="document-content" class="border-t border-gray-100 p-5">
                  <div class="mb-3 flex items-center gap-2 text-xs text-gray-400">
                    <span>Versão {{ document()!.version }}</span>
                    <span>&middot;</span>
                    <span>Gerado em {{ formatDate(document()!.createdAt) }}</span>
                  </div>
                  <div
                    class="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700"
                    [innerText]="document()!.content"
                  ></div>
                </div>
              }
            </div>
          }
        }

        <!-- Preview Section (generated, not paid) -->
        @if (appeal()!.status === 'generated' && appeal()!.generatedContent) {
          <div class="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="relative overflow-hidden p-5">
              <div
                class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                aria-hidden="true"
              >
                <span class="-rotate-45 select-none text-3xl font-black tracking-widest text-gray-300/40">
                  PREVIEW
                </span>
              </div>
              <h2 class="mb-3 text-sm font-bold text-gray-700">Pré-visualização do documento</h2>
              <div
                class="relative z-0 select-none text-sm leading-relaxed text-gray-700 whitespace-pre-line"
                [style.mask-image]="'linear-gradient(to bottom, black 60%, transparent 100%)'"
                [style.-webkit-mask-image]="'linear-gradient(to bottom, black 60%, transparent 100%)'"
                aria-label="Pré-visualização parcial do recurso"
              >
                {{ previewText() }}
              </div>
            </div>
          </div>
        }

        <!-- Action Buttons -->
        <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          @if (isPaid()) {
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 focus:ring-2 focus:ring-brand-500"
              (click)="downloadPdf()"
              [disabled]="downloading()"
              aria-label="Baixar PDF"
            >
              @if (downloading()) {
                <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25" />
                  <path fill="currentColor" class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Baixando...
              } @else {
                Baixar PDF
              }
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-xl border-2 border-brand-600 bg-white px-5 py-3.5 text-sm font-bold text-brand-600 shadow-sm transition hover:bg-brand-50 focus:ring-2 focus:ring-brand-500"
              (click)="copyText()"
              [attr.aria-label]="copied() ? 'Texto copiado' : 'Copiar texto'"
            >
              @if (copied()) {
                Copiado!
              } @else {
                Copiar texto
              }
            </button>
          }
          @if (appeal()!.status === 'generated') {
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 focus:ring-2 focus:ring-brand-500 sm:col-span-2"
              (click)="navigateToPaywall()"
              aria-label="Pagar e acessar documento completo"
            >
              Pagar e acessar documento completo
            </button>
          }
          @if (appeal()!.status === 'awaiting_payment') {
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 focus:ring-2 focus:ring-brand-500 sm:col-span-2"
              (click)="navigateToPayment()"
              aria-label="Ver PIX e realizar pagamento"
            >
              Ver PIX
            </button>
          }
          @if (appeal()!.status === 'draft') {
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 focus:ring-2 focus:ring-brand-500 sm:col-span-2"
              (click)="continueDraft()"
              aria-label="Continuar preenchendo o formulário"
            >
              Continuar formulário
            </button>
          }
        </div>

        <!-- Dates footer -->
        <div class="text-center text-xs text-gray-400">
          <span>Atualizado em {{ formattedUpdatedAt() }}</span>
          @if (appeal()!.expiresAt) {
            <span class="mx-2">&middot;</span>
            <span>Expira em {{ formatDate(appeal()!.expiresAt!) }}</span>
          }
        </div>
      }
    </div>
  `,
})
export class AppealDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private appealId = '';

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly appeal = signal<AppealDetailResponse | null>(null);
  readonly document = signal<DocumentResponse | null>(null);
  readonly documentExpanded = signal(true);
  readonly downloading = signal(false);
  readonly copied = signal(false);

  readonly timelineSteps = TIMELINE_STEPS;

  // ─── Computed values ───

  readonly statusLabel = computed(() =>
    STATUS_LABEL_MAP[this.appeal()?.status ?? ''] ?? this.appeal()?.status ?? '',
  );

  readonly appealTypeLabel = computed(() =>
    APPEAL_TYPE_MAP[this.appeal()?.appealType ?? ''] ?? '',
  );

  readonly currentStepIndex = computed(() =>
    STATUS_ORDER[this.appeal()?.status ?? ''] ?? -1,
  );

  readonly isTerminalStatus = computed(() => {
    const status = this.appeal()?.status;
    return status === 'expired' || status === 'generation_failed';
  });

  readonly isPaid = computed(() => {
    const status = this.appeal()?.status;
    return status === 'paid' || status === 'downloaded';
  });

  readonly formattedCreatedAt = computed(() =>
    this.formatDate(this.appeal()?.createdAt ?? ''),
  );

  readonly formattedUpdatedAt = computed(() =>
    this.formatDate(this.appeal()?.updatedAt ?? ''),
  );

  readonly vehiclePlate = computed(() =>
    this.appeal()?.formData?.vehicle?.plate ?? '',
  );

  readonly vehicleDescription = computed(() => {
    const v = this.appeal()?.formData?.vehicle;
    if (!v?.brand && !v?.model) return '';
    return [v.brand, v.model, v.year].filter(Boolean).join(' ');
  });

  readonly infractionCode = computed(() =>
    this.appeal()?.formData?.infraction?.infractionCode ?? '',
  );

  readonly infractionDescription = computed(() =>
    this.appeal()?.formData?.infraction?.infractionDescription ?? '',
  );

  readonly infractionDate = computed(() =>
    this.appeal()?.formData?.infraction?.infractionDate ?? '',
  );

  readonly autoNumber = computed(() =>
    this.appeal()?.formData?.infraction?.autoNumber ?? '',
  );

  readonly organName = computed(() =>
    this.appeal()?.formData?.infraction?.organName ?? '',
  );

  readonly driverName = computed(() => {
    const d = this.appeal()?.formData?.driver;
    if (d?.isOwner) return 'Proprietário';
    return d?.driverName ?? '';
  });

  readonly defenseReasons = computed(() =>
    this.appeal()?.formData?.arguments?.defenseReasons ?? [],
  );

  readonly previewText = computed(() => {
    const content = this.appeal()?.generatedContent ?? '';
    return content.slice(0, 500);
  });

  readonly documentContent = computed(() =>
    this.document()?.content ?? this.appeal()?.generatedContent ?? '',
  );

  // ─── Lifecycle ───

  ngOnInit(): void {
    this.appealId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.appealId) {
      this.toast.error('Recurso não encontrado');
      void this.router.navigate(['/history']);
      return;
    }

    this.loadAppeal();
  }

  // ─── Data loading ───

  loadAppeal(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<AppealDetailResponse>(
        `${environment.apiUrl}${API_ROUTES.APPEALS.BY_ID(this.appealId)}`,
      )
      .subscribe({
        next: (response) => {
          this.appeal.set(response);
          if (response.status === 'paid' || response.status === 'downloaded') {
            this.loadDocument();
          } else {
            this.loading.set(false);
          }
        },
        error: () => {
          this.error.set('Não foi possível carregar os dados do recurso. Tente novamente.');
          this.loading.set(false);
        },
      });
  }

  private loadDocument(): void {
    this.http
      .get<DocumentResponse>(
        `${environment.apiUrl}${API_ROUTES.APPEALS.DOWNLOAD(this.appealId)}?format=json`,
      )
      .subscribe({
        next: (response) => {
          this.document.set(response);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  // ─── Actions ───

  toggleDocument(): void {
    this.documentExpanded.set(!this.documentExpanded());
  }

  downloadPdf(): void {
    if (this.downloading()) return;
    this.downloading.set(true);

    this.http
      .get(
        `${environment.apiUrl}${API_ROUTES.APPEALS.DOWNLOAD(this.appealId)}?format=pdf`,
        { responseType: 'blob' },
      )
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `recurso-${this.appealId}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          this.downloading.set(false);
          this.toast.success('PDF baixado com sucesso!');
        },
        error: () => {
          this.downloading.set(false);
          this.toast.error('Não foi possível baixar o PDF. Tente novamente.');
        },
      });
  }

  copyText(): void {
    const content = this.documentContent();
    if (!content) return;

    navigator.clipboard
      .writeText(content)
      .then(() => {
        this.copied.set(true);
        this.toast.success('Texto copiado!');
        setTimeout(() => this.copied.set(false), 3000);
      })
      .catch(() => {
        this.toast.error('Não foi possível copiar o texto.');
      });
  }

  navigateToPaywall(): void {
    void this.router.navigate(['/payment', this.appealId]);
  }

  navigateToPayment(): void {
    void this.router.navigate(['/payment', this.appealId, 'pix']);
  }

  continueDraft(): void {
    void this.router.navigate(['/appeals', 'new', 'form'], {
      queryParams: { appealId: this.appealId },
    });
  }

  navigateBack(): void {
    void this.router.navigate(['/history']);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

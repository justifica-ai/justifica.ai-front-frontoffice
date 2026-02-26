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
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

export interface AppealDetailResponse {
  id: string;
  status: string;
  appealType: string | null;
  formData: {
    infractionCode?: string;
    infractionDescription?: string;
    vehiclePlate?: string;
    issuingAuthority?: string;
  } | null;
  generatedContent: string | null;
  createdAt: string;
}

export interface DocumentResponse {
  documentId: string;
  appealId: string;
  content: string;
  version: number;
  createdAt: string;
}

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-2xl px-4 py-8">
      @if (loading()) {
        <div class="space-y-4">
          <app-skeleton-loader height="2rem" width="60%" />
          <app-skeleton-loader height="1rem" width="40%" />
          <app-skeleton-loader height="24rem" />
          <app-skeleton-loader height="3.5rem" />
        </div>
      } @else if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p class="text-sm text-red-600">{{ error() }}</p>
          <button
            type="button"
            class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            (click)="loadData()"
            aria-label="Tentar novamente"
          >
            Tentar novamente
          </button>
        </div>
      } @else {
        <!-- Success header -->
        <div class="mb-8 text-center">
          <div
            class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent-100"
            role="img"
            aria-label="Recurso pronto"
          >
            <svg class="h-10 w-10 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-800">
            🎉 Seu recurso está pronto!
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            Pagamento confirmado. Seu documento foi gerado com sucesso.
          </p>
        </div>

        <!-- Appeal summary card -->
        @if (appeal()) {
          <div
            class="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            aria-label="Resumo do recurso"
          >
            <h2 class="mb-3 text-sm font-bold text-gray-700">Resumo do recurso</h2>
            <div class="grid grid-cols-2 gap-3 text-sm">
              @if (appeal()!.appealType) {
                <div>
                  <span class="text-gray-500">Tipo</span>
                  <p class="font-medium text-gray-800">{{ appeal()!.appealType }}</p>
                </div>
              }
              @if (appeal()!.formData?.infractionCode) {
                <div>
                  <span class="text-gray-500">Infração</span>
                  <p class="font-medium text-gray-800">{{ appeal()!.formData!.infractionCode }}</p>
                </div>
              }
              @if (appeal()!.formData?.vehiclePlate) {
                <div>
                  <span class="text-gray-500">Placa</span>
                  <p class="font-medium text-gray-800">{{ appeal()!.formData!.vehiclePlate }}</p>
                </div>
              }
              @if (appeal()!.formData?.issuingAuthority) {
                <div>
                  <span class="text-gray-500">Órgão autuador</span>
                  <p class="font-medium text-gray-800">{{ appeal()!.formData!.issuingAuthority }}</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- Document content -->
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
                📄 Documento completo
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
              <div
                id="document-content"
                class="border-t border-gray-100 p-5"
              >
                <div
                  class="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700"
                  [innerText]="document()!.content"
                ></div>
              </div>
            }
          </div>
        }

        <!-- Action buttons -->
        <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
              📥 Baixar PDF
            }
          </button>

          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-xl border-2 border-brand-600 bg-white px-5 py-3.5 text-sm font-bold text-brand-600 shadow-sm transition hover:bg-brand-50 focus:ring-2 focus:ring-brand-500"
            (click)="copyText()"
            [attr.aria-label]="copied() ? 'Texto copiado' : 'Copiar texto'"
          >
            @if (copied()) {
              ✓ Copiado!
            } @else {
              📋 Copiar texto
            }
          </button>

          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:ring-2 focus:ring-gray-400"
            (click)="shareWhatsApp()"
            aria-label="Compartilhar via WhatsApp"
          >
            💬 Compartilhar
          </button>
        </div>

        <!-- Protocol instructions card -->
        <div class="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h2 class="mb-3 text-sm font-bold text-blue-800">
            📝 Próximos passos
          </h2>
          <ol
            class="space-y-2 text-sm text-blue-700"
            aria-label="Instruções para protocolar o recurso"
          >
            <li class="flex items-start gap-2">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-800">1</span>
              <span>Baixe o PDF do recurso acima</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-800">2</span>
              <span>Imprima o documento ou salve em seu dispositivo</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-800">3</span>
              <span>Protocole no órgão autuador dentro do prazo indicado na notificação</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-800">4</span>
              <span>Guarde o comprovante de protocolo para acompanhamento</span>
            </li>
          </ol>
        </div>

        <!-- Rating section -->
        @if (!ratingSubmitted()) {
          <div class="mb-6 rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
            <h2 class="mb-2 text-sm font-bold text-gray-700">
              ⭐ Como você avalia o documento gerado?
            </h2>
            <p class="mb-3 text-xs text-gray-500">Sua avaliação nos ajuda a melhorar</p>
            <div class="flex justify-center gap-1" role="radiogroup" aria-label="Avaliação do documento">
              @for (star of stars; track star) {
                <button
                  type="button"
                  class="text-3xl transition-transform hover:scale-110"
                  [class.text-yellow-400]="star <= (hoveredRating() || selectedRating())"
                  [class.text-gray-300]="star > (hoveredRating() || selectedRating())"
                  (mouseenter)="hoveredRating.set(star)"
                  (mouseleave)="hoveredRating.set(0)"
                  (click)="selectRating(star)"
                  [attr.aria-label]="star + ' estrela' + (star > 1 ? 's' : '')"
                  role="radio"
                  [attr.aria-checked]="star === selectedRating()"
                >
                  ★
                </button>
              }
            </div>
            @if (selectedRating() > 0) {
              <div class="mt-3">
                <textarea
                  class="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  rows="2"
                  placeholder="Deixe um comentário (opcional)"
                  [value]="ratingComment()"
                  (input)="onCommentInput($event)"
                  aria-label="Comentário sobre o documento"
                ></textarea>
                <button
                  type="button"
                  class="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  (click)="submitRating()"
                  aria-label="Enviar avaliação"
                >
                  Enviar avaliação
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="mb-6 rounded-xl border border-accent-200 bg-accent-50 p-5 text-center">
            <p class="text-sm font-medium text-accent-700">
              ✅ Obrigado pela sua avaliação!
            </p>
          </div>
        }

        <!-- Info footer -->
        <div class="text-center text-xs text-gray-400">
          🔒 Documento enviado para o seu e-mail cadastrado
        </div>
      }
    </div>
  `,
})
export class PaymentSuccessComponent implements OnInit {
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

  readonly selectedRating = signal(0);
  readonly hoveredRating = signal(0);
  readonly ratingComment = signal('');
  readonly ratingSubmitted = signal(false);

  readonly stars = [1, 2, 3, 4, 5];

  readonly hasContent = computed(
    () => !!this.document()?.content || !!this.appeal()?.generatedContent,
  );

  readonly documentContent = computed(() => {
    return this.document()?.content ?? this.appeal()?.generatedContent ?? '';
  });

  ngOnInit(): void {
    this.appealId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.appealId) {
      this.toast.error('Recurso não encontrado');
      void this.router.navigate(['/']);
      return;
    }

    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Load appeal details
    this.http
      .get<AppealDetailResponse>(
        `${environment.apiUrl}${API_ROUTES.APPEALS.BY_ID(this.appealId)}`,
      )
      .subscribe({
        next: (response) => {
          this.appeal.set(response);
          this.loadDocument();
        },
        error: () => {
          this.error.set(
            'Não foi possível carregar os dados do recurso. Tente novamente.',
          );
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
          // Document might not be ready yet — still show the page
          this.loading.set(false);
        },
      });
  }

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

  shareWhatsApp(): void {
    const text = encodeURIComponent(
      'Acabei de gerar meu recurso de multa com a Justifica.AI! 🚗✨ Confira: https://justifica.ai',
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
  }

  selectRating(star: number): void {
    this.selectedRating.set(star);
  }

  onCommentInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.ratingComment.set(target.value);
  }

  submitRating(): void {
    this.ratingSubmitted.set(true);
    this.toast.success('Obrigado pela sua avaliação!');
    // TODO: Send rating to backend when endpoint is available
  }
}

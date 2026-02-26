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

interface PreviewResponse {
  data: {
    preview: string;
    totalLength: number;
    appealId: string;
    documentId: string;
    appealType: string;
    infractionCode: string;
  };
}

@Component({
  selector: 'app-appeal-preview',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-2xl px-4 py-8">
      @if (loading()) {
        <div class="space-y-4">
          <app-skeleton-loader height="2rem" width="60%" />
          <app-skeleton-loader height="1rem" width="40%" />
          <app-skeleton-loader height="20rem" />
        </div>
      } @else if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p class="text-sm text-red-600">{{ error() }}</p>
          <button
            type="button"
            class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            (click)="loadPreview()"
            aria-label="Tentar carregar pré-visualização novamente"
          >
            Tentar novamente
          </button>
        </div>
      } @else {
        <!-- Success badge -->
        <div
          class="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3"
          role="status"
        >
          <span class="text-xl" aria-hidden="true">📄</span>
          <p class="text-sm font-semibold text-green-800">
            Seu recurso está pronto!
          </p>
        </div>

        <!-- Infraction summary -->
        @if (infractionCode() || appealTypeLabel()) {
          <div class="mb-4 flex flex-wrap gap-3 text-xs text-gray-500">
            @if (infractionCode()) {
              <span class="rounded-full bg-gray-100 px-3 py-1">
                Infração: {{ infractionCode() }}
              </span>
            }
            @if (appealTypeLabel()) {
              <span class="rounded-full bg-gray-100 px-3 py-1">
                {{ appealTypeLabel() }}
              </span>
            }
          </div>
        }

        <!-- Preview container -->
        <div class="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <!-- Watermark -->
          <div
            class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            aria-hidden="true"
          >
            <span
              class="-rotate-45 select-none text-4xl font-black tracking-widest text-gray-300/40 sm:text-5xl"
            >
              PREVIEW — NÃO PAGO
            </span>
          </div>

          <!-- Preview text with mask -->
          <div
            class="preview-text relative z-0 select-none p-6 text-sm leading-relaxed text-gray-700 whitespace-pre-line sm:p-8 sm:text-base"
            [style.mask-image]="'linear-gradient(to bottom, black 60%, transparent 100%)'"
            [style.-webkit-mask-image]="'linear-gradient(to bottom, black 60%, transparent 100%)'"
            aria-label="Pré-visualização do recurso — conteúdo parcial"
          >
            @for (paragraph of paragraphs(); track $index) {
              <p class="mb-3 indent-8">{{ paragraph }}</p>
            }
          </div>
        </div>

        <!-- CTA section -->
        <div class="mt-8 text-center">
          <p class="mb-2 text-sm text-gray-500">
            Pague para acessar o documento completo e baixar em PDF.
          </p>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3 text-base font-semibold text-white shadow-md transition hover:bg-brand-700 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:outline-none"
            (click)="navigateToPaywall()"
            aria-label="Pagar e acessar documento completo"
          >
            Pagar e acessar documento completo
          </button>
        </div>
      }
    </div>
  `,
})
export class AppealPreviewComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private appealId = '';

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly preview = signal('');
  readonly totalLength = signal(0);
  readonly documentId = signal('');
  readonly infractionCode = signal('');
  readonly appealType = signal('');

  readonly paragraphs = computed(() =>
    this.preview()
      .split('\n')
      .filter((line) => line.trim().length > 0),
  );

  readonly appealTypeLabel = computed(() => {
    const typeMap: Record<string, string> = {
      first_instance: 'Recurso de 1ª Instância',
      second_instance: 'Recurso de 2ª Instância',
      prior_defense: 'Defesa Prévia',
      detran: 'Defesa DETRAN',
      jari: 'Recurso JARI',
      cetran: 'Recurso CETRAN',
    };
    return typeMap[this.appealType()] ?? '';
  });

  ngOnInit(): void {
    this.appealId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.appealId) {
      this.toast.error('Recurso não encontrado');
      void this.router.navigate(['/']);
      return;
    }

    this.loadPreview();
  }

  loadPreview(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<PreviewResponse>(
        `${environment.apiUrl}${API_ROUTES.APPEALS.PREVIEW(this.appealId)}`,
      )
      .subscribe({
        next: (response) => {
          this.preview.set(response.data.preview);
          this.totalLength.set(response.data.totalLength);
          this.documentId.set(response.data.documentId);
          this.infractionCode.set(response.data.infractionCode);
          this.appealType.set(response.data.appealType);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Não foi possível carregar a pré-visualização. Tente novamente.');
          this.loading.set(false);
        },
      });
  }

  navigateToPaywall(): void {
    void this.router.navigate(['/payment', this.appealId]);
  }
}

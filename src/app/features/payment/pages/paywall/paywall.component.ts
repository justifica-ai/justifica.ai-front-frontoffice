import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { environment } from '../../../../../environments/environment';
import { API_ROUTES } from '../../../../core/constants/api-routes';
import { ToastService } from '../../../../core/services/toast.service';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

export interface PricingData {
  amountGross: number;
  discountVolumePct: number;
  discountVolume: number;
  discountCouponPct: number;
  discountCoupon: number;
  couponName: string | null;
  couponMessage: string | null;
  amountNet: number;
  affiliateCommission: number;
  currency: string;
}

interface PricingResponse {
  data: PricingData;
}

interface AppealSummary {
  id: string;
  appealType: string | null;
  formData: {
    vehicle?: { plate?: string };
    infraction?: { infractionCode?: string };
  } | null;
}

interface AppealResponse {
  data: AppealSummary;
}

const APPEAL_TYPE_LABELS: Record<string, string> = {
  first_instance: 'Recurso de 1ª Instância',
  second_instance: 'Recurso de 2ª Instância',
  prior_defense: 'Defesa Prévia',
  detran: 'Defesa DETRAN',
  jari: 'Recurso JARI',
  cetran: 'Recurso CETRAN',
};

@Component({
  selector: 'app-paywall',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-lg px-4 py-8">
      @if (loading()) {
        <div class="space-y-4">
          <app-skeleton-loader height="2rem" width="60%" />
          <app-skeleton-loader height="1rem" width="40%" />
          <app-skeleton-loader height="14rem" />
          <app-skeleton-loader height="3.5rem" />
        </div>
      } @else if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p class="text-sm text-red-600">{{ error() }}</p>
          <button
            type="button"
            class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            (click)="loadData()"
            aria-label="Tentar carregar dados novamente"
          >
            Tentar novamente
          </button>
        </div>
      } @else if (pricing()) {
        <!-- Header -->
        <div class="mb-6 text-center">
          <h1 class="text-2xl font-bold text-gray-800">Resumo do pedido</h1>
          <p class="mt-1 text-sm text-gray-500">
            Revise os detalhes e efetue o pagamento via PIX
          </p>
        </div>

        <!-- Appeal summary badges -->
        @if (appealTypeLabel() || vehiclePlate() || infractionCode()) {
          <div
            class="mb-4 flex flex-wrap justify-center gap-2 text-xs text-gray-500"
            role="group"
            aria-label="Detalhes do recurso"
          >
            @if (appealTypeLabel()) {
              <span class="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
                {{ appealTypeLabel() }}
              </span>
            }
            @if (infractionCode()) {
              <span class="rounded-full bg-gray-100 px-3 py-1">
                Infração: {{ infractionCode() }}
              </span>
            }
            @if (vehiclePlate()) {
              <span class="rounded-full bg-gray-100 px-3 py-1">
                Placa: {{ vehiclePlate() }}
              </span>
            }
          </div>
        }

        <!-- Price card -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <!-- Price breakdown -->
          <div class="space-y-3">
            <!-- Gross amount -->
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Valor do recurso</span>
              <span
                class="font-medium"
                [class.text-gray-400]="hasDiscount()"
                [class.line-through]="hasDiscount()"
                [class.text-gray-800]="!hasDiscount()"
              >
                {{ formatCurrency(pricing()!.amountGross) }}
              </span>
            </div>

            <!-- Volume discount -->
            @if (pricing()!.discountVolume > 0) {
              <div class="flex items-center justify-between text-sm">
                <span class="text-accent-600">
                  Desconto de volume (−{{ pricing()!.discountVolumePct }}%)
                </span>
                <span class="font-medium text-accent-600">
                  −{{ formatCurrency(pricing()!.discountVolume) }}
                </span>
              </div>
            }

            <!-- Coupon discount -->
            @if (pricing()!.discountCoupon > 0) {
              <div class="flex items-center justify-between text-sm">
                <span class="text-accent-600">
                  Cupom "{{ pricing()!.couponName }}" (−{{ pricing()!.discountCouponPct }}%)
                </span>
                <span class="font-medium text-accent-600">
                  −{{ formatCurrency(pricing()!.discountCoupon) }}
                </span>
              </div>
            }

            <!-- Divider -->
            <div class="border-t border-gray-200" aria-hidden="true"></div>

            <!-- Net amount -->
            <div class="flex items-center justify-between">
              <span class="text-base font-semibold text-gray-800">Total</span>
              <span class="text-xl font-bold text-brand-600">
                {{ formatCurrency(pricing()!.amountNet) }}
              </span>
            </div>
          </div>

          <!-- Coupon section -->
          <div class="mt-6 border-t border-gray-100 pt-4">
            @if (couponApplied()) {
              <div
                class="flex items-center justify-between rounded-lg bg-accent-50 px-3 py-2"
                role="status"
              >
                <div class="flex items-center gap-2">
                  <span class="text-accent-600" aria-hidden="true">✓</span>
                  <span class="text-sm font-medium text-accent-700">
                    Cupom "{{ pricing()!.couponName }}" aplicado
                  </span>
                </div>
                <button
                  type="button"
                  class="text-xs font-medium text-gray-500 hover:text-red-600"
                  (click)="removeCoupon()"
                  aria-label="Remover cupom de desconto"
                >
                  Remover
                </button>
              </div>
            } @else if (!couponExpanded()) {
              <button
                type="button"
                class="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
                (click)="toggleCoupon()"
                aria-expanded="false"
                aria-controls="coupon-section"
              >
                Tem um cupom de desconto?
              </button>
            } @else {
              <div id="coupon-section" class="space-y-2">
                <label
                  for="coupon-input"
                  class="block text-sm font-medium text-gray-700"
                >
                  Código do cupom
                </label>
                <div class="flex gap-2">
                  <input
                    id="coupon-input"
                    type="text"
                    [value]="couponInput()"
                    (input)="onCouponInputChange($event)"
                    [disabled]="applyingCoupon()"
                    maxlength="50"
                    placeholder="Ex: DESCONTO10"
                    class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none disabled:opacity-50"
                    aria-describedby="coupon-feedback"
                    (keyup.enter)="applyCoupon()"
                  />
                  <button
                    type="button"
                    class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
                    [disabled]="applyingCoupon() || !couponInput().trim()"
                    (click)="applyCoupon()"
                    aria-label="Aplicar cupom de desconto"
                  >
                    @if (applyingCoupon()) {
                      <span
                        class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                        aria-hidden="true"
                      ></span>
                    } @else {
                      Aplicar
                    }
                  </button>
                </div>
                @if (couponFeedback()) {
                  <p
                    id="coupon-feedback"
                    class="text-xs text-red-600"
                    role="alert"
                  >
                    {{ couponFeedback() }}
                  </p>
                }
              </div>
            }
          </div>
        </div>

        <!-- CTA Button -->
        <div class="mt-6">
          <button
            type="button"
            class="w-full rounded-xl bg-accent-600 px-6 py-4 text-lg font-bold text-white shadow-md transition hover:bg-accent-700 focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:outline-none"
            (click)="proceedToPayment()"
            [attr.aria-label]="'Gerar PIX e pagar ' + formatCurrency(pricing()!.amountNet)"
          >
            Gerar PIX — {{ formatCurrency(pricing()!.amountNet) }}
          </button>
        </div>

        <!-- Trust badges -->
        <div class="mt-6 space-y-3 text-center">
          <p class="flex items-center justify-center gap-2 text-sm text-gray-600">
            <span aria-hidden="true">🔒</span>
            Pague somente se gostar do recurso gerado
          </p>
          <div class="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
            <span class="flex items-center gap-1">
              <span aria-hidden="true">✓</span>
              Pagamento 100% seguro via PIX
            </span>
            <span class="flex items-center gap-1">
              <span aria-hidden="true">✓</span>
              Documento entregue em instantes
            </span>
          </div>
        </div>
      }
    </div>
  `,
})
export class PaywallComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private appealId = '';

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pricing = signal<PricingData | null>(null);
  readonly appeal = signal<AppealSummary | null>(null);
  readonly couponInput = signal('');
  readonly couponExpanded = signal(false);
  readonly applyingCoupon = signal(false);
  readonly couponFeedback = signal<string | null>(null);

  readonly couponApplied = computed(
    () => !!this.pricing()?.couponName && (this.pricing()?.discountCoupon ?? 0) > 0,
  );

  readonly hasDiscount = computed(
    () => (this.pricing()?.discountVolume ?? 0) + (this.pricing()?.discountCoupon ?? 0) > 0,
  );

  readonly appealTypeLabel = computed(() =>
    APPEAL_TYPE_LABELS[this.appeal()?.appealType ?? ''] ?? '',
  );

  readonly vehiclePlate = computed(() => {
    const fd = this.appeal()?.formData;
    if (!fd || typeof fd !== 'object') return '';
    const vehicle = (fd as Record<string, unknown>)['vehicle'];
    if (!vehicle || typeof vehicle !== 'object') return '';
    const plate = (vehicle as Record<string, unknown>)['plate'];
    return typeof plate === 'string' ? plate : '';
  });

  readonly infractionCode = computed(() => {
    const fd = this.appeal()?.formData;
    if (!fd || typeof fd !== 'object') return '';
    const infraction = (fd as Record<string, unknown>)['infraction'];
    if (!infraction || typeof infraction !== 'object') return '';
    const code = (infraction as Record<string, unknown>)['infractionCode'];
    return typeof code === 'string' ? code : '';
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
    this.loadAppealSummary();
    this.loadPricing();
  }

  toggleCoupon(): void {
    this.couponExpanded.set(!this.couponExpanded());
  }

  onCouponInputChange(event: Event): void {
    this.couponInput.set((event.target as HTMLInputElement).value);
  }

  applyCoupon(): void {
    const code = this.couponInput().trim();
    if (!code) return;

    this.applyingCoupon.set(true);
    this.couponFeedback.set(null);

    this.http
      .get<PricingResponse>(
        `${environment.apiUrl}${API_ROUTES.APPEALS.PRICING(this.appealId)}`,
        { params: new HttpParams().set('coupon', code) },
      )
      .subscribe({
        next: (response) => {
          this.pricing.set(response.data);
          this.applyingCoupon.set(false);

          if (response.data.couponName && response.data.discountCoupon > 0) {
            this.couponFeedback.set(null);
            this.toast.success('Cupom aplicado com sucesso!');
          } else if (response.data.couponMessage) {
            this.couponFeedback.set(response.data.couponMessage);
          } else {
            this.couponFeedback.set('Cupom inválido ou expirado.');
          }
        },
        error: () => {
          this.applyingCoupon.set(false);
          this.couponFeedback.set('Erro ao validar cupom. Tente novamente.');
        },
      });
  }

  removeCoupon(): void {
    this.couponInput.set('');
    this.couponExpanded.set(false);
    this.couponFeedback.set(null);

    this.http
      .get<PricingResponse>(
        `${environment.apiUrl}${API_ROUTES.APPEALS.PRICING(this.appealId)}`,
      )
      .subscribe({
        next: (response) => {
          this.pricing.set(response.data);
        },
        error: () => {
          this.toast.error('Erro ao atualizar preço.');
        },
      });
  }

  proceedToPayment(): void {
    const coupon = this.couponApplied() ? this.couponInput().trim() : undefined;
    const queryParams = coupon ? { coupon } : {};
    void this.router.navigate(['/payment', this.appealId, 'pix'], { queryParams });
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  private loadAppealSummary(): void {
    this.http
      .get<AppealResponse>(
        `${environment.apiUrl}${API_ROUTES.APPEALS.BY_ID(this.appealId)}`,
      )
      .subscribe({
        next: (response) => {
          this.appeal.set(response.data);
        },
        error: () => {
          // Appeal summary is optional — pricing is the main content
        },
      });
  }

  private loadPricing(): void {
    this.http
      .get<PricingResponse>(
        `${environment.apiUrl}${API_ROUTES.APPEALS.PRICING(this.appealId)}`,
      )
      .subscribe({
        next: (response) => {
          this.pricing.set(response.data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(
            'Não foi possível carregar o preço. Tente novamente.',
          );
          this.loading.set(false);
        },
      });
  }
}

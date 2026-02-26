import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
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

export interface PayResponse {
  data: {
    transactionId: string;
    pixCharge: {
      txid: string;
      qrCode: string;
      brcode: string;
      expiresAt: string;
    };
    amount: {
      gross: number;
      discounts: {
        volume: number;
        coupon: number;
      };
      net: number;
    };
  };
}

export interface PaymentStatusResponse {
  data: {
    status: 'pending' | 'paid' | 'expired';
    txid: string;
    expiresAt: string;
  };
}

const POLLING_INTERVAL_MS = 3000;
const REDIRECT_DELAY_MS = 2000;
const COUNTDOWN_INTERVAL_MS = 1000;
const EXPIRY_WARNING_SECONDS = 300;

@Component({
  selector: 'app-pix-payment',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-lg px-4 py-8">
      @if (loading()) {
        <div class="space-y-4">
          <app-skeleton-loader height="2rem" width="60%" />
          <app-skeleton-loader height="1rem" width="40%" />
          <app-skeleton-loader height="18rem" />
          <app-skeleton-loader height="3.5rem" />
        </div>
      } @else if (confirmed()) {
        <!-- Payment confirmed -->
        <div class="text-center py-12">
          <div
            class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent-100"
            role="img"
            aria-label="Pagamento confirmado"
          >
            <svg class="h-10 w-10 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-800">Pagamento confirmado!</h1>
          <p class="mt-2 text-sm text-gray-500">
            Redirecionando para o download do documento...
          </p>
        </div>
      } @else if (expired()) {
        <!-- Charge expired -->
        <div class="text-center py-12">
          <div
            class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100"
            role="img"
            aria-label="Cobrança expirada"
          >
            <svg class="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-800">Cobrança expirada</h1>
          <p class="mt-2 text-sm text-gray-500">
            O prazo para pagamento deste PIX expirou.
          </p>
          <button
            type="button"
            class="mt-6 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 focus:ring-2 focus:ring-brand-500"
            (click)="regenerateCharge()"
            aria-label="Gerar novo código PIX"
          >
            Gerar novo PIX
          </button>
        </div>
      } @else if (error()) {
        <!-- Error state -->
        <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p class="text-sm text-red-600">{{ error() }}</p>
          <button
            type="button"
            class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            (click)="createCharge()"
            aria-label="Tentar novamente"
          >
            Tentar novamente
          </button>
        </div>
      } @else if (paymentData()) {
        <!-- Header -->
        <div class="mb-6 text-center">
          <h1 class="text-2xl font-bold text-gray-800">Pagamento via PIX</h1>
          <p class="mt-1 text-sm text-gray-500">
            Escaneie o QR Code ou copie o código para pagar
          </p>
        </div>

        <!-- Amount card -->
        <div class="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Valor a pagar</span>
            <span class="text-xl font-bold text-gray-800">
              {{ formatCurrency(paymentData()!.amount.net) }}
            </span>
          </div>
          @if (totalDiscount() > 0) {
            <div class="mt-1 flex items-center justify-between text-xs text-accent-600">
              <span>Desconto aplicado</span>
              <span>−{{ formatCurrency(totalDiscount()) }}</span>
            </div>
          }
        </div>

        <!-- QR Code -->
        <div class="mb-4 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <img
            [src]="paymentData()!.pixCharge.qrCode"
            alt="QR Code PIX para pagamento"
            class="mx-auto h-56 w-56"
            width="224"
            height="224"
          />

          <!-- Countdown -->
          <div class="mt-4">
            <p
              class="text-sm font-medium"
              [class.text-gray-600]="remainingSeconds() > expiryWarningThreshold"
              [class.text-red-600]="remainingSeconds() <= expiryWarningThreshold"
              role="timer"
              [attr.aria-label]="'Expira em ' + countdownDisplay()"
            >
              Expira em {{ countdownDisplay() }}
            </p>
          </div>
        </div>

        <!-- Copy button -->
        <button
          type="button"
          class="mb-6 w-full rounded-xl border-2 border-brand-600 bg-white px-6 py-4 text-base font-bold text-brand-600 shadow-sm transition hover:bg-brand-50 focus:ring-2 focus:ring-brand-500"
          (click)="copyBrcode()"
          [attr.aria-label]="copied() ? 'Código PIX copiado' : 'Copiar código PIX'"
        >
          @if (copied()) {
            ✓ Código copiado!
          } @else {
            📋 Copiar código PIX
          }
        </button>

        <!-- Instructions -->
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-5">
          <h2 class="mb-3 text-sm font-bold text-gray-700">Como pagar:</h2>
          <ol class="space-y-2 text-sm text-gray-600" aria-label="Passos para pagamento PIX">
            <li class="flex items-start gap-2">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">1</span>
              <span>Abra o app do seu banco</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">2</span>
              <span>Escaneie o QR Code ou cole o código PIX</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">3</span>
              <span>Confirme o pagamento</span>
            </li>
          </ol>
        </div>

        <!-- Trust badge -->
        <div class="mt-4 text-center text-xs text-gray-400">
          🔒 Pagamento seguro via PIX · Confirmação instantânea
        </div>
      }
    </div>
  `,
})
export class PixPaymentComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private appealId = '';
  private couponCode: string | undefined;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly paymentData = signal<PayResponse['data'] | null>(null);
  readonly confirmed = signal(false);
  readonly expired = signal(false);
  readonly copied = signal(false);
  readonly remainingSeconds = signal(0);

  readonly expiryWarningThreshold = EXPIRY_WARNING_SECONDS;

  readonly totalDiscount = computed(() => {
    const data = this.paymentData();
    if (!data) return 0;
    return data.amount.discounts.volume + data.amount.discounts.coupon;
  });

  readonly countdownDisplay = computed(() => {
    const total = this.remainingSeconds();
    if (total <= 0) return '00:00';
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });

  ngOnInit(): void {
    this.appealId = this.route.snapshot.paramMap.get('id') ?? '';
    this.couponCode = this.route.snapshot.queryParamMap.get('coupon') ?? undefined;

    if (!this.appealId) {
      this.toast.error('Recurso não encontrado');
      void this.router.navigate(['/']);
      return;
    }

    this.createCharge();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.stopCountdown();
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }

  createCharge(): void {
    this.loading.set(true);
    this.error.set(null);
    this.expired.set(false);

    const body: Record<string, string> = {};
    if (this.couponCode) {
      body['couponCode'] = this.couponCode;
    }

    this.http
      .post<PayResponse>(
        `${environment.apiUrl}${API_ROUTES.APPEALS.PAY(this.appealId)}`,
        body,
      )
      .subscribe({
        next: (response) => {
          this.paymentData.set(response.data);
          this.loading.set(false);
          this.startCountdown(response.data.pixCharge.expiresAt);
          this.startPolling();
        },
        error: () => {
          this.error.set(
            'Não foi possível gerar a cobrança PIX. Tente novamente.',
          );
          this.loading.set(false);
        },
      });
  }

  copyBrcode(): void {
    const brcode = this.paymentData()?.pixCharge.brcode;
    if (!brcode) return;

    navigator.clipboard
      .writeText(brcode)
      .then(() => {
        this.copied.set(true);
        this.toast.success('Código PIX copiado!');
        setTimeout(() => this.copied.set(false), 3000);
      })
      .catch(() => {
        this.toast.error('Não foi possível copiar o código.');
      });
  }

  regenerateCharge(): void {
    this.paymentData.set(null);
    this.createCharge();
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  private startCountdown(expiresAtIso: string): void {
    this.stopCountdown();

    const expiresAt = new Date(expiresAtIso).getTime();
    const updateRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      this.remainingSeconds.set(remaining);

      if (remaining <= 0) {
        this.stopCountdown();
        this.stopPolling();
        this.expired.set(true);
      }
    };

    updateRemaining();
    this.countdownTimer = setInterval(updateRemaining, COUNTDOWN_INTERVAL_MS);
  }

  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollingTimer = setInterval(() => this.pollStatus(), POLLING_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private pollStatus(): void {
    this.http
      .get<PaymentStatusResponse>(
        `${environment.apiUrl}${API_ROUTES.APPEALS.PAYMENT_STATUS(this.appealId)}`,
      )
      .subscribe({
        next: (response) => {
          if (response.data.status === 'paid') {
            this.onPaymentConfirmed();
          } else if (response.data.status === 'expired') {
            this.stopPolling();
            this.stopCountdown();
            this.expired.set(true);
          }
        },
        error: () => {
          // Silently ignore polling errors — will retry on next interval
        },
      });
  }

  private onPaymentConfirmed(): void {
    this.stopPolling();
    this.stopCountdown();
    this.confirmed.set(true);

    this.redirectTimer = setTimeout(() => {
      void this.router.navigate(['/payment', this.appealId, 'success']);
    }, REDIRECT_DELAY_MS);
  }
}

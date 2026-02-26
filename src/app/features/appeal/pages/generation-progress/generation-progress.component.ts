import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap, tap, catchError, EMPTY, filter, take } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { API_ROUTES } from '../../../../core/constants/api-routes';
import { Appeal } from '../../../../core/models/appeal.model';
import { ToastService } from '../../../../core/services/toast.service';

const PROGRESS_MESSAGES = [
  'Analisando sua infração...',
  'Consultando legislação...',
  'Redigindo seu recurso...',
  'Verificando fundamentação...',
  'Finalizando documento...',
] as const;

const MESSAGE_ROTATION_MS = 4_000;
const POLL_INTERVAL_MS = 3_000;
const SLOW_THRESHOLD_S = 45;
const TIMEOUT_THRESHOLD_S = 60;

@Component({
  selector: 'app-generation-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <!-- Animated spinner -->
      <div class="relative mb-8">
        <div
          class="h-20 w-20 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600"
          role="status"
          [attr.aria-label]="currentMessage()"
        ></div>
        <div
          class="absolute inset-0 flex items-center justify-center text-2xl"
          aria-hidden="true"
        >
          ⚖️
        </div>
      </div>

      <!-- Rotating message -->
      <p
        class="mb-3 text-center text-lg font-semibold text-gray-800"
        aria-live="polite"
        aria-atomic="true"
      >
        {{ currentMessage() }}
      </p>

      <!-- Estimated time -->
      @if (!showSlowMessage() && !isTimedOut()) {
        <p class="text-center text-sm text-gray-500">
          Isso geralmente leva 15–30 segundos
        </p>
      }

      <!-- Slow message -->
      @if (showSlowMessage() && !isTimedOut()) {
        <p class="text-center text-sm font-medium text-amber-600" role="alert">
          Estamos finalizando, aguarde mais um momento...
        </p>
      }

      <!-- Timeout message -->
      @if (isTimedOut()) {
        <p class="text-center text-sm font-medium text-amber-600" role="alert">
          Estamos com volume alto. Você será notificado por e-mail.
        </p>
      }

      <!-- Progress bar skeleton -->
      <div class="mt-8 w-full max-w-xs">
        <div class="h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div
            class="h-full animate-pulse rounded-full bg-brand-500"
            [style.width]="progressWidth()"
          ></div>
        </div>
      </div>

      <!-- Elapsed time -->
      <p class="mt-4 text-xs text-gray-400">
        Tempo decorrido: {{ elapsedDisplay() }}
      </p>
    </div>
  `,
})
export class GenerationProgressComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private appealId = '';
  private messageTimer: ReturnType<typeof setInterval> | null = null;
  private elapsedTimer: ReturnType<typeof setInterval> | null = null;

  readonly messageIndex = signal(0);
  readonly elapsedSeconds = signal(0);

  readonly currentMessage = computed(
    () => PROGRESS_MESSAGES[this.messageIndex() % PROGRESS_MESSAGES.length],
  );

  readonly showSlowMessage = computed(
    () => this.elapsedSeconds() >= SLOW_THRESHOLD_S && this.elapsedSeconds() < TIMEOUT_THRESHOLD_S,
  );

  readonly isTimedOut = computed(
    () => this.elapsedSeconds() >= TIMEOUT_THRESHOLD_S,
  );

  readonly progressWidth = computed(() => {
    const pct = Math.min(
      (this.elapsedSeconds() / TIMEOUT_THRESHOLD_S) * 100,
      95,
    );
    return `${pct}%`;
  });

  readonly elapsedDisplay = computed(() => {
    const s = this.elapsedSeconds();
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  });

  ngOnInit(): void {
    this.appealId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.appealId) {
      this.toast.error('Recurso não encontrado');
      void this.router.navigate(['/']);
      return;
    }

    this.startMessageRotation();
    this.startElapsedTimer();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private startMessageRotation(): void {
    this.messageTimer = setInterval(() => {
      this.messageIndex.update((i) => i + 1);
    }, MESSAGE_ROTATION_MS);
  }

  private startElapsedTimer(): void {
    this.elapsedTimer = setInterval(() => {
      this.elapsedSeconds.update((s) => s + 1);
    }, 1_000);
  }

  private startPolling(): void {
    interval(POLL_INTERVAL_MS)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => !this.isTimedOut()),
        switchMap(() =>
          this.http
            .get<{ data: Appeal }>(
              `${environment.apiUrl}${API_ROUTES.APPEALS.BY_ID(this.appealId)}`,
            )
            .pipe(
              catchError(() => EMPTY),
            ),
        ),
        tap((response) => this.handlePollResponse(response.data)),
        filter((response) => this.isTerminalStatus(response.data.status)),
        take(1),
      )
      .subscribe();

    // Timeout watcher — redirects when threshold exceeded
    interval(1_000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => this.elapsedSeconds() >= TIMEOUT_THRESHOLD_S),
        take(1),
        tap(() => {
          this.toast.info(
            'Geração em andamento',
            'Você receberá um e-mail quando o documento estiver pronto.',
          );
          this.clearTimers();
          void this.router.navigate(['/']);
        }),
      )
      .subscribe();
  }

  private handlePollResponse(appeal: Appeal): void {
    if (appeal.status === 'generated') {
      this.clearTimers();
      void this.router.navigate(['/appeals', this.appealId, 'preview']);
    } else if (appeal.status === 'failed') {
      this.clearTimers();
      this.toast.error(
        'Falha na geração',
        'Não foi possível gerar seu recurso. Tente novamente.',
      );
      void this.router.navigate(['/appeals', this.appealId]);
    }
  }

  private isTerminalStatus(status: string): boolean {
    return status === 'generated' || status === 'failed';
  }

  private clearTimers(): void {
    if (this.messageTimer !== null) {
      clearInterval(this.messageTimer);
      this.messageTimer = null;
    }
    if (this.elapsedTimer !== null) {
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
  }
}

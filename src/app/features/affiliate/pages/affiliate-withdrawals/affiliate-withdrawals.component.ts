import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AffiliateService } from '../../services/affiliate.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import {
  WITHDRAWAL_STATUS_LABELS,
  type AffiliateWithdrawal,
  type Pagination,
} from '../../../../core/models/affiliate.model';

@Component({
  selector: 'app-affiliate-withdrawals',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <a
        routerLink="/affiliate"
        class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-4 transition-colors"
        aria-label="Voltar para o dashboard de afiliados"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Voltar
      </a>

      <h1 class="text-2xl font-bold text-gray-800 mb-6">Histórico de Saques</h1>

      <!-- Loading -->
      @if (loading()) {
        <div class="space-y-3" aria-live="polite" aria-label="Carregando saques">
          @for (i of [1, 2, 3]; track i) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div class="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div class="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && withdrawals().length === 0) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <app-empty-state
            title="Nenhum saque realizado"
            description="Seus saques aparecerão aqui quando você solicitar."
          >
            <a
              routerLink="/affiliate"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
            >
              Ir para o Dashboard
            </a>
          </app-empty-state>
        </div>
      }

      <!-- Withdrawals list -->
      @if (!loading() && withdrawals().length > 0) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="overflow-x-auto" role="region" aria-label="Tabela de saques">
            <table class="w-full text-sm" aria-label="Histórico de saques">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th class="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Chave PIX</th>
                  <th class="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Processado em</th>
                </tr>
              </thead>
              <tbody>
                @for (withdrawal of withdrawals(); track withdrawal.id) {
                  <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td class="py-3 px-4 text-gray-700">{{ formatDate(withdrawal.createdAt) }}</td>
                    <td class="py-3 px-4 text-right font-semibold text-gray-800">{{ formatCurrency(withdrawal.amount) }}</td>
                    <td class="py-3 px-4 text-gray-600 text-xs font-mono">{{ maskPixKey(withdrawal.pixKey) }}</td>
                    <td class="py-3 px-4 text-center">
                      <app-status-badge
                        [status]="withdrawal.status"
                        [label]="getStatusLabel(withdrawal.status)"
                      />
                    </td>
                    <td class="py-3 px-4 text-gray-500">
                      {{ withdrawal.processedAt ? formatDate(withdrawal.processedAt) : '—' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (pagination() && pagination()!.totalPages > 1) {
            <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p class="text-xs text-gray-500">
                Mostrando {{ startItem() }}–{{ endItem() }} de {{ pagination()!.total }}
              </p>
              <div class="flex gap-1">
                <button
                  (click)="goToPage(currentPage() - 1)"
                  [disabled]="currentPage() === 1"
                  class="px-3 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  aria-label="Página anterior"
                >
                  Anterior
                </button>
                <button
                  (click)="goToPage(currentPage() + 1)"
                  [disabled]="currentPage() === pagination()!.totalPages"
                  class="px-3 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  aria-label="Próxima página"
                >
                  Próxima
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AffiliateWithdrawalsComponent implements OnInit {
  private readonly service = inject(AffiliateService);

  readonly withdrawals = signal<AffiliateWithdrawal[]>([]);
  readonly pagination = signal<Pagination | null>(null);
  readonly loading = signal(false);
  readonly currentPage = signal(1);

  readonly startItem = computed(() => {
    const p = this.pagination();
    if (!p) return 0;
    return (p.page - 1) * p.limit + 1;
  });

  readonly endItem = computed(() => {
    const p = this.pagination();
    if (!p) return 0;
    return Math.min(p.page * p.limit, p.total);
  });

  ngOnInit(): void {
    this.loadWithdrawals();
  }

  async loadWithdrawals(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.service.loadWithdrawals({
        page: this.currentPage(),
        limit: 20,
      });
      this.withdrawals.set(response.data);
      this.pagination.set(response.pagination);
    } catch {
      // Error handled by interceptor
    } finally {
      this.loading.set(false);
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadWithdrawals();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatCurrency(value: string): string {
    const num = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(num) ? 0 : num);
  }

  maskPixKey(pixKey: string): string {
    if (pixKey.length <= 6) return pixKey;
    return pixKey.substring(0, 3) + '***' + pixKey.substring(pixKey.length - 3);
  }

  getStatusLabel(status: string): string {
    return WITHDRAWAL_STATUS_LABELS[status as keyof typeof WITHDRAWAL_STATUS_LABELS] ?? status;
  }
}

import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AffiliateService } from '../../services/affiliate.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import {
  AFFILIATE_STATUS_LABELS,
  type AffiliateConversion,
} from '../../../../core/models/affiliate.model';

@Component({
  selector: 'app-affiliate-dashboard',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Programa de Afiliados</h1>
          <p class="text-sm text-gray-500 mt-1">Indique amigos e ganhe comissão em cada recurso gerado</p>
        </div>
        @if (service.isActive()) {
          <a
            routerLink="/affiliate/withdrawals"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
            aria-label="Ver histórico de saques"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Saques
          </a>
        }
      </div>

      <!-- Loading state -->
      @if (service.loading()) {
        <div class="space-y-4" aria-live="polite" aria-label="Carregando dados do afiliado">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div class="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div class="h-8 w-28 bg-gray-200 rounded animate-pulse"></div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Error state -->
      @if (service.error()) {
        <div class="bg-white rounded-xl shadow-sm border border-red-200 p-6 text-center" role="alert">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p class="text-gray-700 font-medium mb-1">Erro ao carregar dashboard</p>
          <p class="text-sm text-gray-500 mb-4">{{ service.error() }}</p>
          <button
            (click)="loadData()"
            class="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      }

      <!-- Not an affiliate -->
      @if (service.notAffiliate() && !service.loading()) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <app-empty-state
            title="Você ainda não é afiliado"
            description="Torne-se um afiliado e ganhe comissão indicando a Justifica.AI para seus amigos e seguidores."
          >
            <a
              routerLink="/affiliate/apply"
              class="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
              aria-label="Cadastrar-se como afiliado"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              Tornar-se Afiliado
            </a>
          </app-empty-state>
        </div>
      }

      <!-- Pending status -->
      @if (service.isPending() && !service.loading()) {
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center" role="status">
          <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-600">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 class="text-lg font-semibold text-amber-800 mb-1">Solicitação em análise</h2>
          <p class="text-sm text-amber-700">Sua solicitação de afiliado está sendo analisada. Você será notificado quando for aprovada.</p>
        </div>
      }

      <!-- Suspended/Blocked status -->
      @if ((service.isSuspended() || service.isBlocked()) && !service.loading()) {
        <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center" role="alert">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <h2 class="text-lg font-semibold text-red-800 mb-1">
            Conta {{ service.isSuspended() ? 'suspensa' : 'bloqueada' }}
          </h2>
          <p class="text-sm text-red-700">
            Sua conta de afiliado está {{ service.isSuspended() ? 'suspensa' : 'bloqueada' }}.
            Entre em contato com o suporte para mais informações.
          </p>
        </div>
      }

      <!-- Active dashboard -->
      @if (service.isActive() && !service.loading()) {
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" role="region" aria-label="Indicadores de desempenho">
          <!-- Total Clicks -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total de Clicks</p>
            <p class="text-2xl font-bold text-gray-800">{{ formatNumber(metrics()?.totalClicks ?? 0) }}</p>
          </div>

          <!-- Total Conversions -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Conversões</p>
            <p class="text-2xl font-bold text-gray-800">{{ formatNumber(metrics()?.totalConversions ?? 0) }}</p>
            <p class="text-xs text-gray-400 mt-1">Taxa: {{ formatPercent(metrics()?.conversionRate ?? 0) }}</p>
          </div>

          <!-- Available Balance -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Saldo Disponível</p>
            <p class="text-2xl font-bold text-accent-600">{{ formatCurrency(metrics()?.availableBalance ?? '0') }}</p>
            <p class="text-xs text-gray-400 mt-1">Pendente: {{ formatCurrency(metrics()?.pendingBalance ?? '0') }}</p>
          </div>

          <!-- Total Earnings -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Acumulado</p>
            <p class="text-2xl font-bold text-gray-800">{{ formatCurrency(metrics()?.totalEarnings ?? '0') }}</p>
            <p class="text-xs text-gray-400 mt-1">Comissão: {{ affiliate()?.commissionRate ?? '0' }}%</p>
          </div>
        </div>

        <!-- Referral Link + Withdrawal -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <!-- Referral Link Card -->
          <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 class="text-sm font-semibold text-gray-700 mb-3">Seu Link de Indicação</h2>
            @if (service.link()) {
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  readonly
                  [value]="service.link()?.link ?? ''"
                  class="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 select-all"
                  aria-label="Link de indicação"
                />
                <button
                  (click)="copyLink()"
                  class="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors whitespace-nowrap"
                  [attr.aria-label]="linkCopied() ? 'Link copiado' : 'Copiar link de indicação'"
                >
                  {{ linkCopied() ? 'Copiado!' : 'Copiar' }}
                </button>
              </div>
              <div class="flex items-center gap-2 mt-3">
                <span class="text-xs text-gray-500">Compartilhar:</span>
                <button
                  (click)="shareWhatsApp()"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  aria-label="Compartilhar no WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </button>
                <button
                  (click)="shareTwitter()"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
                  aria-label="Compartilhar no Twitter"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Twitter
                </button>
              </div>
            } @else {
              <div class="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
            }
          </div>

          <!-- Withdrawal Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 class="text-sm font-semibold text-gray-700 mb-3">Solicitar Saque</h2>
            <p class="text-2xl font-bold text-accent-600 mb-1">{{ formatCurrency(metrics()?.availableBalance ?? '0') }}</p>
            <p class="text-xs text-gray-500 mb-4">Saldo disponível para saque</p>
            @if (showWithdrawalForm()) {
              <div class="space-y-3">
                <div>
                  <label for="pix-key" class="block text-xs font-medium text-gray-600 mb-1">
                    Chave PIX <span class="text-red-500" aria-hidden="true">*</span>
                    <span class="sr-only">(obrigatório)</span>
                  </label>
                  <input
                    id="pix-key"
                    type="text"
                    [value]="withdrawalPixKey()"
                    (input)="onPixKeyInput($event)"
                    placeholder="CPF, e-mail, celular ou chave aleatória"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    aria-describedby="pix-key-hint"
                  />
                  <p id="pix-key-hint" class="text-xs text-gray-400 mt-1">Mínimo para saque: R$ 50,00</p>
                </div>
                <div class="flex gap-2">
                  <button
                    (click)="submitWithdrawal()"
                    [disabled]="service.withdrawalLoading() || !withdrawalPixKey()"
                    class="flex-1 px-3 py-2 text-sm font-medium text-white bg-accent-600 rounded-lg hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ service.withdrawalLoading() ? 'Solicitando...' : 'Confirmar Saque' }}
                  </button>
                  <button
                    (click)="showWithdrawalForm.set(false)"
                    class="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            } @else {
              <button
                (click)="showWithdrawalForm.set(true)"
                [disabled]="!service.canWithdraw()"
                class="w-full px-4 py-2.5 text-sm font-medium text-white bg-accent-600 rounded-lg hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                [attr.aria-label]="service.canWithdraw() ? 'Solicitar saque' : 'Saldo insuficiente para saque (mínimo R$ 50,00)'"
              >
                Solicitar Saque
              </button>
              @if (!service.canWithdraw()) {
                <p class="text-xs text-gray-400 mt-2 text-center">Mínimo R$ 50,00 para saque</p>
              }
            }
          </div>
        </div>

        <!-- Conversions Chart -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-700">Conversões por dia</h2>
            <div class="flex gap-1" role="tablist" aria-label="Período do gráfico">
              <button
                (click)="chartPeriod.set(7)"
                [class]="chartPeriod() === 7
                  ? 'px-3 py-1 text-xs font-medium text-brand-700 bg-brand-50 rounded-md'
                  : 'px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-md'"
                role="tab"
                [attr.aria-selected]="chartPeriod() === 7"
                aria-controls="chart-panel"
              >
                7 dias
              </button>
              <button
                (click)="chartPeriod.set(30)"
                [class]="chartPeriod() === 30
                  ? 'px-3 py-1 text-xs font-medium text-brand-700 bg-brand-50 rounded-md'
                  : 'px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-md'"
                role="tab"
                [attr.aria-selected]="chartPeriod() === 30"
                aria-controls="chart-panel"
              >
                30 dias
              </button>
            </div>
          </div>
          <div id="chart-panel" role="tabpanel" class="h-40 flex items-end gap-1" aria-label="Gráfico de conversões">
            @for (bar of chartData(); track bar.date) {
              <div
                class="flex-1 flex flex-col items-center justify-end h-full group"
                [attr.aria-label]="bar.date + ': ' + bar.count + ' conversões, R$ ' + bar.total"
              >
                <div class="relative w-full flex justify-center">
                  <div
                    class="invisible group-hover:visible absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
                  >
                    {{ bar.count }} conv. &bull; R$ {{ bar.total }}
                  </div>
                </div>
                <div
                  class="w-full rounded-t transition-all duration-200"
                  [class]="bar.count > 0 ? 'bg-brand-500 hover:bg-brand-600' : 'bg-gray-100'"
                  [style.height.%]="bar.height"
                  [style.min-height.px]="4"
                ></div>
                @if (chartPeriod() === 7) {
                  <span class="text-[10px] text-gray-400 mt-1">{{ bar.label }}</span>
                }
              </div>
            }
          </div>
        </div>

        <!-- Recent Conversions Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Conversões Recentes</h2>
          @if (recentConversions().length === 0) {
            <p class="text-sm text-gray-400 italic text-center py-4">Nenhuma conversão registrada</p>
          } @else {
            <div class="overflow-x-auto" role="region" aria-label="Tabela de conversões recentes">
              <table class="w-full text-sm" aria-label="Conversões recentes">
                <thead>
                  <tr class="border-b border-gray-100">
                    <th class="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th class="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Comissão</th>
                    <th class="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (conversion of recentConversions(); track conversion.id) {
                    <tr class="border-b border-gray-50 last:border-0">
                      <td class="py-2.5 px-3 text-gray-700">{{ formatDate(conversion.createdAt) }}</td>
                      <td class="py-2.5 px-3 text-right font-medium text-gray-800">{{ formatCurrency(conversion.commissionAmount) }}</td>
                      <td class="py-2.5 px-3 text-center">
                        <app-status-badge
                          [status]="conversion.isPaid ? 'paid' : 'pending'"
                          [label]="conversion.isPaid ? 'Pago' : 'Pendente'"
                        />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AffiliateDashboardComponent implements OnInit {
  readonly service = inject(AffiliateService);
  private readonly toast = inject(ToastService);

  readonly linkCopied = signal(false);
  readonly showWithdrawalForm = signal(false);
  readonly withdrawalPixKey = signal('');
  readonly chartPeriod = signal<7 | 30>(7);

  readonly affiliate = computed(() => this.service.dashboard()?.affiliate ?? null);
  readonly metrics = computed(() => this.service.dashboard()?.metrics ?? null);
  readonly recentConversions = computed(() => this.service.dashboard()?.recentConversions ?? []);

  readonly statusLabel = computed(() => {
    const status = this.service.affiliateStatus();
    return status ? AFFILIATE_STATUS_LABELS[status] : '';
  });

  readonly chartData = computed(() => {
    const days = this.chartPeriod();
    const conversions = this.recentConversions();
    return this.buildChartData(conversions, days);
  });

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    await this.service.loadDashboard();
    if (this.service.isActive()) {
      await this.service.loadLink();
    }
  }

  async copyLink(): Promise<void> {
    const link = this.service.link()?.link;
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      this.linkCopied.set(true);
      this.toast.success('Link copiado', 'Seu link de indicação foi copiado para a área de transferência.');
      setTimeout(() => this.linkCopied.set(false), 3000);
    } catch {
      this.toast.error('Erro ao copiar', 'Não foi possível copiar o link. Tente selecionar e copiar manualmente.');
    }
  }

  shareWhatsApp(): void {
    const link = this.service.link()?.link;
    if (!link) return;
    const text = encodeURIComponent(`Recebi uma multa de trânsito? Use a Justifica.AI para gerar seu recurso automaticamente! ${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
  }

  shareTwitter(): void {
    const link = this.service.link()?.link;
    if (!link) return;
    const text = encodeURIComponent('Recurso de multa de trânsito com IA! Gere seu recurso automaticamente com a @JustificaAI');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`, '_blank', 'noopener');
  }

  onPixKeyInput(event: Event): void {
    this.withdrawalPixKey.set((event.target as HTMLInputElement).value);
  }

  async submitWithdrawal(): Promise<void> {
    const pixKey = this.withdrawalPixKey();
    if (!pixKey) return;

    const result = await this.service.requestWithdrawal({ pixKey });
    if (result) {
      this.showWithdrawalForm.set(false);
      this.withdrawalPixKey.set('');
    }
  }

  formatCurrency(value: string): string {
    const num = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(num) ? 0 : num);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value);
  }

  formatPercent(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value / 100);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private buildChartData(conversions: AffiliateConversion[], days: number): ChartBar[] {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dayMap = new Map<string, { count: number; total: number }>();
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dayMap.set(key, { count: 0, total: 0 });
    }

    for (const conv of conversions) {
      const key = new Date(conv.createdAt).toISOString().split('T')[0];
      const entry = dayMap.get(key);
      if (entry) {
        entry.count++;
        entry.total += parseFloat(conv.commissionAmount);
      }
    }

    const entries = Array.from(dayMap.entries()).reverse();
    const maxCount = Math.max(...entries.map(([, v]) => v.count), 1);

    return entries.map(([dateStr, data]) => {
      const date = new Date(dateStr + 'T12:00:00');
      return {
        date: dateStr,
        label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        count: data.count,
        total: data.total.toFixed(2),
        height: Math.max((data.count / maxCount) * 100, 3),
      };
    });
  }
}

interface ChartBar {
  date: string;
  label: string;
  count: number;
  total: string;
  height: number;
}


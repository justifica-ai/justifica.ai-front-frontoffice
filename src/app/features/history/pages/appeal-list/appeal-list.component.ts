import { Component, ChangeDetectionStrategy, signal, computed, inject, DestroyRef, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppealListService } from '../../services/appeal-list.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  AppealListItem,
  AppealListStatus,
  AppealListResponse,
  APPEAL_LIST_STATUS_CONFIG,
  APPEAL_STATUS_TABS,
  APPEAL_TYPE_LABELS,
  DRAFT_EXPIRATION_DAYS,
  StatusDisplayConfig,
  StatusFilterTab,
} from '../../../../core/models/appeal.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-appeal-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Meus Recursos</h1>
          <p class="text-sm text-gray-500 mt-1">Acompanhe e gerencie seus recursos de multa</p>
        </div>
        <a routerLink="/appeals/new"
           class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors text-sm"
           aria-label="Criar novo recurso">
          + Novo Recurso
        </a>
      </div>

      <!-- Search -->
      <div class="mb-4">
        <label for="appeal-search" class="sr-only">Buscar por placa ou AIT</label>
        <div class="relative">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400" aria-hidden="true">🔍</span>
          <input
            id="appeal-search"
            type="search"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            placeholder="Buscar por placa ou AIT..."
            class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            aria-label="Buscar recursos por placa ou número do AIT"
          />
        </div>
      </div>

      <!-- Status filter tabs -->
      <div class="flex gap-2 overflow-x-auto pb-3 mb-6" role="tablist" aria-label="Filtrar por status">
        @for (tab of statusTabs; track tab.label) {
          <button
            role="tab"
            [attr.aria-selected]="activeFilter() === tab.status"
            (click)="filterByStatus(tab.status)"
            [class]="getTabClasses(tab.status)">
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- Loading skeletons -->
      @if (loading() && appeals().length === 0) {
        <div class="space-y-4" aria-label="Carregando recursos" role="status">
          @for (i of skeletonItems; track i) {
            <div class="animate-pulse bg-white rounded-xl p-5 border border-gray-200">
              <div class="flex items-center gap-2 mb-3">
                <div class="h-5 bg-gray-200 rounded-full w-24"></div>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <div class="h-3 bg-gray-200 rounded w-10 mb-1"></div>
                  <div class="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div>
                  <div class="h-3 bg-gray-200 rounded w-8 mb-1"></div>
                  <div class="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div>
                  <div class="h-3 bg-gray-200 rounded w-10 mb-1"></div>
                  <div class="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div>
                  <div class="h-3 bg-gray-200 rounded w-10 mb-1"></div>
                  <div class="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && appeals().length === 0) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div class="text-5xl mb-4" aria-hidden="true">📂</div>
          @if (searchQuery() || activeFilter()) {
            <h2 class="text-lg font-semibold text-gray-700 mb-2">Nenhum recurso encontrado</h2>
            <p class="text-gray-500 mb-6">Tente ajustar os filtros ou o termo de busca</p>
            <button
              (click)="clearFilters()"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm">
              Limpar filtros
            </button>
          } @else {
            <h2 class="text-lg font-semibold text-gray-700 mb-2">Você ainda não tem recursos</h2>
            <p class="text-gray-500 mb-6">Crie seu primeiro recurso de multa com ajuda da IA</p>
            <a routerLink="/appeals/new"
               class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors text-sm">
              Criar Meu Primeiro Recurso
            </a>
          }
        </div>
      }

      <!-- Appeal cards -->
      @if (appeals().length > 0) {
        <div class="space-y-4" role="list" aria-label="Lista de recursos">
          @for (appeal of appeals(); track appeal.id) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow" role="listitem">
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <!-- Status + expiration badges -->
                  <div class="flex items-center gap-2 mb-3 flex-wrap">
                    <span [class]="getStatusBadgeClasses(appeal.status)">
                      <span [class]="'w-2 h-2 rounded-full inline-block ' + getStatusConfig(appeal.status).dotClass" aria-hidden="true"></span>
                      {{ getStatusConfig(appeal.status).label }}
                    </span>
                    @if (appeal.status === 'draft' && getDaysUntilExpiration(appeal) <= 7) {
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700"
                            data-testid="expiration-badge">
                        ⏱ Expira em {{ getDaysUntilExpiration(appeal) }} {{ getDaysUntilExpiration(appeal) === 1 ? 'dia' : 'dias' }}
                      </span>
                    }
                  </div>

                  <!-- Details grid -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span class="text-gray-500 block text-xs">Placa</span>
                      <span class="font-semibold text-gray-800">{{ appeal.vehiclePlate || '–' }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 block text-xs">AIT</span>
                      <span class="font-medium text-gray-800">{{ appeal.aitCode || '–' }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 block text-xs">Tipo</span>
                      <span class="text-gray-700">{{ getAppealTypeLabel(appeal.appealType) }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 block text-xs">Criado em</span>
                      <span class="text-gray-700">{{ formatDate(appeal.createdAt) }}</span>
                    </div>
                  </div>

                  <!-- Secondary info -->
                  @if (appeal.organName || appeal.infractionDate) {
                    <p class="text-xs text-gray-500 mt-2">
                      @if (appeal.organName) { {{ appeal.organName }} }
                      @if (appeal.organName && appeal.infractionDate) { · }
                      @if (appeal.infractionDate) { Infração em {{ formatDate(appeal.infractionDate) }} }
                    </p>
                  }

                  @if (appeal.amountPaid) {
                    <p class="text-xs text-green-600 font-medium mt-1">R$ {{ appeal.amountPaid }}</p>
                  }
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 flex-shrink-0 sm:self-center">
                  @switch (appeal.status) {
                    @case ('draft') {
                      <a [routerLink]="['/appeals', appeal.id]"
                         class="px-3 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
                        Continuar
                      </a>
                      <button (click)="confirmDelete(appeal)"
                              [disabled]="deleting() === appeal.id"
                              class="px-3 py-1.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                        @if (deleting() === appeal.id) { Excluindo... } @else { Excluir }
                      </button>
                    }
                    @case ('generated') {
                      <a [routerLink]="['/appeals', appeal.id, 'preview']"
                         class="px-3 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
                        Ver Preview
                      </a>
                    }
                    @case ('awaiting_payment') {
                      <a [routerLink]="['/payment', appeal.id, 'pix']"
                         class="px-3 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
                        Pagar com PIX
                      </a>
                    }
                    @case ('paid') {
                      <button (click)="onDownloadDocument(appeal.id)"
                              [disabled]="downloading() === appeal.id"
                              class="px-3 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50">
                        @if (downloading() === appeal.id) { Baixando... } @else { Baixar PDF }
                      </button>
                    }
                    @case ('downloaded') {
                      <button (click)="onDownloadDocument(appeal.id)"
                              [disabled]="downloading() === appeal.id"
                              class="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                        Baixar Novamente
                      </button>
                    }
                    @case ('expired') {
                      <a routerLink="/appeals/new"
                         class="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                        Criar Novo
                      </a>
                    }
                    @case ('generation_failed') {
                      <a [routerLink]="['/appeals', appeal.id]"
                         class="px-3 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
                        Tentar Novamente
                      </a>
                    }
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (hasMore()) {
          <div class="mt-6 text-center">
            <button
              (click)="loadMore()"
              [disabled]="loading()"
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-50">
              @if (loading()) { Carregando... } @else { Carregar mais }
            </button>
          </div>
        }

        <!-- Result count -->
        <p class="text-sm text-gray-500 text-center mt-4" aria-live="polite">
          Mostrando {{ appeals().length }} de {{ total() }} {{ total() === 1 ? 'recurso' : 'recursos' }}
        </p>
      }
    </div>
  `,
})
export class AppealListComponent implements OnInit {
  private readonly service = inject(AppealListService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly appeals = signal<AppealListItem[]>([]);
  readonly loading = signal(false);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly activeFilter = signal<AppealListStatus | null>(null);
  readonly searchQuery = signal('');
  readonly deleting = signal<string | null>(null);
  readonly downloading = signal<string | null>(null);

  readonly hasMore = computed(() => this.appeals().length < this.total());

  readonly statusTabs: StatusFilterTab[] = APPEAL_STATUS_TABS;
  readonly skeletonItems = [1, 2, 3];

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
    });
  }

  ngOnInit(): void {
    this.fetchAppeals(true);
  }

  async fetchAppeals(reset: boolean): Promise<void> {
    if (reset) {
      this.currentPage.set(1);
      this.appeals.set([]);
    }

    this.loading.set(true);
    try {
      const response: AppealListResponse = await this.service.loadAppeals({
        status: this.activeFilter() ?? undefined,
        q: this.searchQuery() || undefined,
        page: this.currentPage(),
        limit: PAGE_SIZE,
      });

      if (reset) {
        this.appeals.set(response.data);
      } else {
        this.appeals.update((current) => [...current, ...response.data]);
      }
      this.total.set(response.total);
    } catch {
      this.toast.error('Erro ao carregar recursos', 'Tente novamente em instantes');
    } finally {
      this.loading.set(false);
    }
  }

  filterByStatus(status: AppealListStatus | null): void {
    this.activeFilter.set(status);
    this.fetchAppeals(true);
  }

  onSearchInput(event: Event): void {
    const term = (event.target as HTMLInputElement).value.trim();
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchQuery.set(term);
      this.fetchAppeals(true);
    }, 400);
  }

  loadMore(): void {
    this.currentPage.update((p) => p + 1);
    this.fetchAppeals(false);
  }

  clearFilters(): void {
    this.activeFilter.set(null);
    this.searchQuery.set('');
    this.fetchAppeals(true);
  }

  async confirmDelete(appeal: AppealListItem): Promise<void> {
    const confirmed = confirm('Tem certeza que deseja excluir este rascunho? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    this.deleting.set(appeal.id);
    try {
      await this.service.deleteAppeal(appeal.id);
      this.appeals.update((list) => list.filter((a) => a.id !== appeal.id));
      this.total.update((t) => t - 1);
      this.toast.success('Rascunho excluído com sucesso');
    } catch {
      this.toast.error('Erro ao excluir rascunho', 'Tente novamente');
    } finally {
      this.deleting.set(null);
    }
  }

  async onDownloadDocument(id: string): Promise<void> {
    this.downloading.set(id);
    try {
      const blob = await this.service.downloadDocument(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recurso-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast.success('Download iniciado');
    } catch {
      this.toast.error('Erro ao baixar documento', 'Tente novamente');
    } finally {
      this.downloading.set(null);
    }
  }

  getStatusConfig(status: AppealListStatus): StatusDisplayConfig {
    return APPEAL_LIST_STATUS_CONFIG[status] ?? APPEAL_LIST_STATUS_CONFIG['draft'];
  }

  getStatusBadgeClasses(status: AppealListStatus): string {
    const config = this.getStatusConfig(status);
    return `inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${config.bgClass} ${config.textClass}`;
  }

  getTabClasses(status: AppealListStatus | null): string {
    const base = 'whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0';
    return this.activeFilter() === status
      ? `${base} bg-brand-600 text-white`
      : `${base} bg-gray-100 text-gray-600 hover:bg-gray-200`;
  }

  getAppealTypeLabel(type: string | null): string {
    if (!type) return '–';
    return APPEAL_TYPE_LABELS[type] ?? type;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '–';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getDaysUntilExpiration(appeal: AppealListItem): number {
    const created = new Date(appeal.createdAt);
    const expiresAt = new Date(created.getTime() + DRAFT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  }
}

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { ToastService } from '../../../core/services/toast.service';
import type {
  AffiliateDashboardResponse,
  AffiliateLinkResponse,
  AffiliateApplyInput,
  AffiliateApplyResponse,
  WithdrawalRequestInput,
  WithdrawalRequestResponse,
  WithdrawalsListResponse,
  ConversionsListResponse,
  ConversionsListQuery,
  WithdrawalsListQuery,
  AffiliateStatus,
} from '../../../core/models/affiliate.model';

@Injectable({ providedIn: 'root' })
export class AffiliateService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  private readonly _dashboard = signal<AffiliateDashboardResponse | null>(null);
  private readonly _link = signal<AffiliateLinkResponse | null>(null);
  private readonly _loading = signal(false);
  private readonly _applyLoading = signal(false);
  private readonly _withdrawalLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _affiliateStatus = signal<AffiliateStatus | null>(null);
  private readonly _notAffiliate = signal(false);

  readonly dashboard = this._dashboard.asReadonly();
  readonly link = this._link.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly applyLoading = this._applyLoading.asReadonly();
  readonly withdrawalLoading = this._withdrawalLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly affiliateStatus = this._affiliateStatus.asReadonly();
  readonly notAffiliate = this._notAffiliate.asReadonly();

  readonly isActive = computed(() => this._affiliateStatus() === 'active');
  readonly isPending = computed(() => this._affiliateStatus() === 'pending');
  readonly isSuspended = computed(() => this._affiliateStatus() === 'suspended');
  readonly isBlocked = computed(() => this._affiliateStatus() === 'blocked');

  readonly canWithdraw = computed(() => {
    const dash = this._dashboard();
    if (!dash || !this.isActive()) return false;
    return parseFloat(dash.metrics.availableBalance) >= 50;
  });

  readonly availableBalance = computed(() => {
    const dash = this._dashboard();
    return dash ? parseFloat(dash.metrics.availableBalance) : 0;
  });

  async loadDashboard(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._notAffiliate.set(false);

    try {
      const response = await firstValueFrom(
        this.http.get<AffiliateDashboardResponse>(
          `${environment.apiUrl}${API_ROUTES.AFFILIATES.ME}`,
        ),
      );
      this._dashboard.set(response);
      this._affiliateStatus.set(response.affiliate.status);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        this._notAffiliate.set(true);
        this._affiliateStatus.set(null);
      } else {
        this._error.set('Erro ao carregar dashboard do afiliado.');
        this.toast.error('Erro ao carregar dashboard', 'Não foi possível obter os dados do programa de afiliados.');
      }
    } finally {
      this._loading.set(false);
    }
  }

  async loadLink(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<AffiliateLinkResponse>(
          `${environment.apiUrl}${API_ROUTES.AFFILIATES.ME_LINK}`,
        ),
      );
      this._link.set(response);
    } catch {
      this.toast.error('Erro ao carregar link', 'Não foi possível obter seu link de afiliado.');
    }
  }

  async apply(input: AffiliateApplyInput): Promise<AffiliateApplyResponse | null> {
    this._applyLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.http.post<AffiliateApplyResponse>(
          `${environment.apiUrl}${API_ROUTES.AFFILIATES.APPLY}`,
          input,
        ),
      );
      this._affiliateStatus.set(response.status);
      this._notAffiliate.set(false);
      this.toast.success('Solicitação enviada', 'Sua solicitação de afiliado foi enviada com sucesso. Aguarde a aprovação.');
      return response;
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        this.toast.warning('Solicitação já existe', 'Você já possui uma solicitação de afiliado.');
      } else if (status === 403) {
        this.toast.error('Conta suspensa', 'Sua conta de afiliado está suspensa. Entre em contato com o suporte.');
      } else if (status === 429) {
        this.toast.warning('Aguarde', 'Você precisa aguardar 30 dias para reaplicar.');
      } else {
        this.toast.error('Erro na solicitação', 'Não foi possível enviar sua solicitação. Tente novamente.');
      }
      return null;
    } finally {
      this._applyLoading.set(false);
    }
  }

  async requestWithdrawal(input: WithdrawalRequestInput): Promise<WithdrawalRequestResponse | null> {
    this._withdrawalLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.http.post<WithdrawalRequestResponse>(
          `${environment.apiUrl}${API_ROUTES.AFFILIATES.ME_WITHDRAWALS}`,
          input,
        ),
      );
      this.toast.success('Saque solicitado', `Saque de R$ ${response.amount} solicitado com sucesso.`);
      await this.loadDashboard();
      return response;
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 400) {
        this.toast.warning('Saldo insuficiente', 'O saldo mínimo para saque é de R$ 50,00.');
      } else if (status === 409) {
        this.toast.warning('Saque pendente', 'Você já possui um saque pendente. Aguarde o processamento.');
      } else {
        this.toast.error('Erro no saque', 'Não foi possível solicitar o saque. Tente novamente.');
      }
      return null;
    } finally {
      this._withdrawalLoading.set(false);
    }
  }

  async loadWithdrawals(query: WithdrawalsListQuery = {}): Promise<WithdrawalsListResponse> {
    let params = new HttpParams();
    if (query.page != null) params = params.set('page', String(query.page));
    if (query.limit != null) params = params.set('limit', String(query.limit));

    return firstValueFrom(
      this.http.get<WithdrawalsListResponse>(
        `${environment.apiUrl}${API_ROUTES.AFFILIATES.ME_WITHDRAWALS}`,
        { params },
      ),
    );
  }

  async loadConversions(query: ConversionsListQuery = {}): Promise<ConversionsListResponse> {
    let params = new HttpParams();
    if (query.page != null) params = params.set('page', String(query.page));
    if (query.limit != null) params = params.set('limit', String(query.limit));

    return firstValueFrom(
      this.http.get<ConversionsListResponse>(
        `${environment.apiUrl}${API_ROUTES.AFFILIATES.ME_CONVERSIONS}`,
        { params },
      ),
    );
  }

  resetState(): void {
    this._dashboard.set(null);
    this._link.set(null);
    this._loading.set(false);
    this._applyLoading.set(false);
    this._withdrawalLoading.set(false);
    this._error.set(null);
    this._affiliateStatus.set(null);
    this._notAffiliate.set(false);
  }
}

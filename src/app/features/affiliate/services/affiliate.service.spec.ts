import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AffiliateService } from './affiliate.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';
import { API_ROUTES } from '../../../core/constants/api-routes';
import type {
  AffiliateDashboardResponse,
  AffiliateLinkResponse,
  AffiliateApplyResponse,
  WithdrawalRequestResponse,
  WithdrawalsListResponse,
  ConversionsListResponse,
} from '../../../core/models/affiliate.model';

describe('AffiliateService', () => {
  let service: AffiliateService;
  let httpMock: HttpTestingController;
  let toastSpy: jasmine.SpyObj<ToastService>;

  const meUrl = `${environment.apiUrl}${API_ROUTES.AFFILIATES.ME}`;
  const linkUrl = `${environment.apiUrl}${API_ROUTES.AFFILIATES.ME_LINK}`;
  const applyUrl = `${environment.apiUrl}${API_ROUTES.AFFILIATES.APPLY}`;
  const withdrawalsUrl = `${environment.apiUrl}${API_ROUTES.AFFILIATES.ME_WITHDRAWALS}`;
  const conversionsUrl = `${environment.apiUrl}${API_ROUTES.AFFILIATES.ME_CONVERSIONS}`;

  const mockDashboard: AffiliateDashboardResponse = {
    affiliate: {
      id: 'aff-1',
      code: 'ABC12345',
      status: 'active',
      commissionRate: '20.00',
      totalEarnings: '500.00',
      pendingBalance: '100.00',
      availableBalance: '200.00',
      pixKey: 'test@email.com',
      activatedAt: '2026-01-10T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    metrics: {
      totalClicks: 150,
      totalConversions: 10,
      conversionRate: 6.67,
      totalEarnings: '500.00',
      pendingBalance: '100.00',
      availableBalance: '200.00',
    },
    recentConversions: [
      { id: 'conv-1', commissionAmount: '15.00', isPaid: true, createdAt: '2026-02-20T10:00:00.000Z' },
    ],
  };

  const mockLink: AffiliateLinkResponse = {
    code: 'ABC12345',
    link: 'https://app.justifica.ai?ref=ABC12345',
  };

  const mockApplyResponse: AffiliateApplyResponse = {
    id: 'aff-new',
    code: 'NEW12345',
    status: 'pending',
    message: 'Solicitação enviada com sucesso.',
  };

  const mockWithdrawalResponse: WithdrawalRequestResponse = {
    id: 'wd-1',
    amount: '200.00',
    pixKey: 'test@email.com',
    status: 'pending',
    message: 'Saque solicitado com sucesso.',
  };

  beforeEach(() => {
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        AffiliateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastSpy },
      ],
    });

    service = TestBed.inject(AffiliateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have null dashboard', () => {
      expect(service.dashboard()).toBeNull();
    });

    it('should have null link', () => {
      expect(service.link()).toBeNull();
    });

    it('should not be loading', () => {
      expect(service.loading()).toBeFalse();
    });

    it('should have no error', () => {
      expect(service.error()).toBeNull();
    });

    it('should not be affiliate', () => {
      expect(service.notAffiliate()).toBeFalse();
    });

    it('should have null affiliate status', () => {
      expect(service.affiliateStatus()).toBeNull();
    });
  });

  describe('loadDashboard', () => {
    it('should load dashboard successfully', async () => {
      const promise = service.loadDashboard();
      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne(meUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockDashboard);
      await promise;

      expect(service.loading()).toBeFalse();
      expect(service.dashboard()).toEqual(mockDashboard);
      expect(service.affiliateStatus()).toBe('active');
      expect(service.notAffiliate()).toBeFalse();
      expect(service.error()).toBeNull();
    });

    it('should set notAffiliate on 404', async () => {
      const promise = service.loadDashboard();
      const req = httpMock.expectOne(meUrl);
      req.flush(null, { status: 404, statusText: 'Not Found' });
      await promise;

      expect(service.loading()).toBeFalse();
      expect(service.notAffiliate()).toBeTrue();
      expect(service.affiliateStatus()).toBeNull();
    });

    it('should set error on other errors', async () => {
      const promise = service.loadDashboard();
      const req = httpMock.expectOne(meUrl);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
      await promise;

      expect(service.loading()).toBeFalse();
      expect(service.error()).toBe('Erro ao carregar dashboard do afiliado.');
      expect(toastSpy.error).toHaveBeenCalledWith(
        'Erro ao carregar dashboard',
        'Não foi possível obter os dados do programa de afiliados.',
      );
    });
  });

  describe('loadLink', () => {
    it('should load link successfully', async () => {
      const promise = service.loadLink();
      const req = httpMock.expectOne(linkUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockLink);
      await promise;

      expect(service.link()).toEqual(mockLink);
    });

    it('should show toast on error', async () => {
      const promise = service.loadLink();
      const req = httpMock.expectOne(linkUrl);
      req.flush(null, { status: 500, statusText: 'Error' });
      await promise;

      expect(toastSpy.error).toHaveBeenCalledWith(
        'Erro ao carregar link',
        'Não foi possível obter seu link de afiliado.',
      );
    });
  });

  describe('apply', () => {
    const applyInput = {
      pixKeyType: 'email' as const,
      pixKey: 'test@email.com',
      promotionMethod: 'Redes sociais e YouTube com conteúdo sobre trânsito',
    };

    it('should apply successfully', async () => {
      const promise = service.apply(applyInput);
      expect(service.applyLoading()).toBeTrue();

      const req = httpMock.expectOne(applyUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(applyInput);
      req.flush(mockApplyResponse);

      const result = await promise;
      expect(result).toEqual(mockApplyResponse);
      expect(service.applyLoading()).toBeFalse();
      expect(service.affiliateStatus()).toBe('pending');
      expect(service.notAffiliate()).toBeFalse();
      expect(toastSpy.success).toHaveBeenCalled();
    });

    it('should handle 409 conflict', async () => {
      const promise = service.apply(applyInput);
      const req = httpMock.expectOne(applyUrl);
      req.flush(null, { status: 409, statusText: 'Conflict' });

      const result = await promise;
      expect(result).toBeNull();
      expect(toastSpy.warning).toHaveBeenCalledWith(
        'Solicitação já existe',
        'Você já possui uma solicitação de afiliado.',
      );
    });

    it('should handle 403 forbidden', async () => {
      const promise = service.apply(applyInput);
      const req = httpMock.expectOne(applyUrl);
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      const result = await promise;
      expect(result).toBeNull();
      expect(toastSpy.error).toHaveBeenCalledWith(
        'Conta suspensa',
        'Sua conta de afiliado está suspensa. Entre em contato com o suporte.',
      );
    });

    it('should handle 429 rate limit', async () => {
      const promise = service.apply(applyInput);
      const req = httpMock.expectOne(applyUrl);
      req.flush(null, { status: 429, statusText: 'Too Many Requests' });

      const result = await promise;
      expect(result).toBeNull();
      expect(toastSpy.warning).toHaveBeenCalledWith(
        'Aguarde',
        'Você precisa aguardar 30 dias para reaplicar.',
      );
    });

    it('should handle other errors', async () => {
      const promise = service.apply(applyInput);
      const req = httpMock.expectOne(applyUrl);
      req.flush(null, { status: 500, statusText: 'Error' });

      const result = await promise;
      expect(result).toBeNull();
      expect(toastSpy.error).toHaveBeenCalledWith(
        'Erro na solicitação',
        'Não foi possível enviar sua solicitação. Tente novamente.',
      );
    });
  });

  describe('requestWithdrawal', () => {
    const withdrawalInput = { pixKey: 'test@email.com' };

    it('should request withdrawal and reload dashboard', fakeAsync(() => {
      service.requestWithdrawal(withdrawalInput);
      expect(service.withdrawalLoading()).toBeTrue();

      const postReq = httpMock.expectOne(withdrawalsUrl);
      expect(postReq.request.method).toBe('POST');
      expect(postReq.request.body).toEqual(withdrawalInput);
      postReq.flush(mockWithdrawalResponse);
      tick();

      const getReq = httpMock.expectOne(meUrl);
      expect(getReq.request.method).toBe('GET');
      getReq.flush(mockDashboard);
      tick();

      expect(service.withdrawalLoading()).toBeFalse();
      expect(toastSpy.success).toHaveBeenCalled();
      expect(service.dashboard()).toEqual(mockDashboard);
    }));

    it('should handle 400 insufficient balance', async () => {
      const promise = service.requestWithdrawal(withdrawalInput);
      const req = httpMock.expectOne(withdrawalsUrl);
      req.flush(null, { status: 400, statusText: 'Bad Request' });

      const result = await promise;
      expect(result).toBeNull();
      expect(toastSpy.warning).toHaveBeenCalledWith(
        'Saldo insuficiente',
        'O saldo mínimo para saque é de R$ 50,00.',
      );
    });

    it('should handle 409 pending withdrawal', async () => {
      const promise = service.requestWithdrawal(withdrawalInput);
      const req = httpMock.expectOne(withdrawalsUrl);
      req.flush(null, { status: 409, statusText: 'Conflict' });

      const result = await promise;
      expect(result).toBeNull();
      expect(toastSpy.warning).toHaveBeenCalledWith(
        'Saque pendente',
        'Você já possui um saque pendente. Aguarde o processamento.',
      );
    });

    it('should handle other errors', async () => {
      const promise = service.requestWithdrawal(withdrawalInput);
      const req = httpMock.expectOne(withdrawalsUrl);
      req.flush(null, { status: 500, statusText: 'Error' });

      const result = await promise;
      expect(result).toBeNull();
      expect(toastSpy.error).toHaveBeenCalledWith(
        'Erro no saque',
        'Não foi possível solicitar o saque. Tente novamente.',
      );
    });
  });

  describe('loadWithdrawals', () => {
    const mockResponse: WithdrawalsListResponse = {
      data: [
        { id: 'wd-1', amount: '100.00', pixKey: 'test@email.com', status: 'completed', processedAt: '2026-02-20T00:00:00.000Z', createdAt: '2026-02-18T00:00:00.000Z' },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };

    it('should load withdrawals with no params', async () => {
      const promise = service.loadWithdrawals();
      const req = httpMock.expectOne(withdrawalsUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should load withdrawals with query params', async () => {
      const promise = service.loadWithdrawals({ page: 2, limit: 10 });
      const req = httpMock.expectOne(`${withdrawalsUrl}?page=2&limit=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });
  });

  describe('loadConversions', () => {
    const mockResponse: ConversionsListResponse = {
      data: [
        { id: 'conv-1', commissionAmount: '15.00', isPaid: true, createdAt: '2026-02-20T10:00:00.000Z' },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };

    it('should load conversions with no params', async () => {
      const promise = service.loadConversions();
      const req = httpMock.expectOne(conversionsUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should load conversions with query params', async () => {
      const promise = service.loadConversions({ page: 3, limit: 5 });
      const req = httpMock.expectOne(`${conversionsUrl}?page=3&limit=5`);
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resetState', () => {
    it('should reset all state', async () => {
      const promise = service.loadDashboard();
      const req = httpMock.expectOne(meUrl);
      req.flush(mockDashboard);
      await promise;

      expect(service.dashboard()).not.toBeNull();

      service.resetState();

      expect(service.dashboard()).toBeNull();
      expect(service.link()).toBeNull();
      expect(service.loading()).toBeFalse();
      expect(service.applyLoading()).toBeFalse();
      expect(service.withdrawalLoading()).toBeFalse();
      expect(service.error()).toBeNull();
      expect(service.affiliateStatus()).toBeNull();
      expect(service.notAffiliate()).toBeFalse();
    });
  });

  describe('computed properties', () => {
    it('isActive should be true when status is active', async () => {
      const promise = service.loadDashboard();
      const req = httpMock.expectOne(meUrl);
      req.flush(mockDashboard);
      await promise;

      expect(service.isActive()).toBeTrue();
      expect(service.isPending()).toBeFalse();
      expect(service.isSuspended()).toBeFalse();
      expect(service.isBlocked()).toBeFalse();
    });

    it('isPending should be true when status is pending', async () => {
      const pendingDashboard = {
        ...mockDashboard,
        affiliate: { ...mockDashboard.affiliate, status: 'pending' },
      };
      const promise = service.loadDashboard();
      const req = httpMock.expectOne(meUrl);
      req.flush(pendingDashboard);
      await promise;

      expect(service.isPending()).toBeTrue();
      expect(service.isActive()).toBeFalse();
    });

    it('canWithdraw should be true when active and balance >= 50', async () => {
      const promise = service.loadDashboard();
      const req = httpMock.expectOne(meUrl);
      req.flush(mockDashboard);
      await promise;

      expect(service.canWithdraw()).toBeTrue();
      expect(service.availableBalance()).toBe(200);
    });

    it('canWithdraw should be false when balance < 50', async () => {
      const lowBalance = {
        ...mockDashboard,
        metrics: { ...mockDashboard.metrics, availableBalance: '30.00' },
      };
      const promise = service.loadDashboard();
      const req = httpMock.expectOne(meUrl);
      req.flush(lowBalance);
      await promise;

      expect(service.canWithdraw()).toBeFalse();
      expect(service.availableBalance()).toBe(30);
    });

    it('canWithdraw should be false when not active', async () => {
      const pendingDashboard = {
        ...mockDashboard,
        affiliate: { ...mockDashboard.affiliate, status: 'pending' },
      };
      const promise = service.loadDashboard();
      const req = httpMock.expectOne(meUrl);
      req.flush(pendingDashboard);
      await promise;

      expect(service.canWithdraw()).toBeFalse();
    });
  });
});

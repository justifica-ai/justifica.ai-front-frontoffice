import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AffiliateDashboardComponent } from './affiliate-dashboard.component';
import { AffiliateService } from '../../services/affiliate.service';
import { ToastService } from '../../../../core/services/toast.service';
import type {
  AffiliateDashboardResponse,
  AffiliateLinkResponse,
} from '../../../../core/models/affiliate.model';

describe('AffiliateDashboardComponent', () => {
  let component: AffiliateDashboardComponent;
  let fixture: ComponentFixture<AffiliateDashboardComponent>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  // Writable signals for controlling mock state
  const mockLoading = signal(false);
  const mockError = signal<string | null>(null);
  const mockNotAffiliate = signal(false);
  const mockIsActive = signal(false);
  const mockIsPending = signal(false);
  const mockIsSuspended = signal(false);
  const mockIsBlocked = signal(false);
  const mockDashboard = signal<AffiliateDashboardResponse | null>(null);
  const mockLink = signal<AffiliateLinkResponse | null>(null);
  const mockCanWithdraw = signal(false);
  const mockWithdrawalLoading = signal(false);
  const mockAffiliateStatus = signal<string | null>(null);
  const mockAvailableBalance = signal(0);

  let mockService: Record<string, unknown>;

  const dashboardData: AffiliateDashboardResponse = {
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
      { id: 'conv-2', commissionAmount: '10.00', isPaid: false, createdAt: '2026-02-19T10:00:00.000Z' },
    ],
  };

  const linkData: AffiliateLinkResponse = {
    code: 'ABC12345',
    link: 'https://app.justifica.ai?ref=ABC12345',
  };

  function resetSignals(): void {
    mockLoading.set(false);
    mockError.set(null);
    mockNotAffiliate.set(false);
    mockIsActive.set(false);
    mockIsPending.set(false);
    mockIsSuspended.set(false);
    mockIsBlocked.set(false);
    mockDashboard.set(null);
    mockLink.set(null);
    mockCanWithdraw.set(false);
    mockWithdrawalLoading.set(false);
    mockAffiliateStatus.set(null);
    mockAvailableBalance.set(0);
  }

  beforeEach(async () => {
    resetSignals();

    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    mockService = {
      loading: mockLoading.asReadonly(),
      error: mockError.asReadonly(),
      notAffiliate: mockNotAffiliate.asReadonly(),
      isActive: mockIsActive.asReadonly(),
      isPending: mockIsPending.asReadonly(),
      isSuspended: mockIsSuspended.asReadonly(),
      isBlocked: mockIsBlocked.asReadonly(),
      dashboard: mockDashboard.asReadonly(),
      link: mockLink.asReadonly(),
      canWithdraw: mockCanWithdraw.asReadonly(),
      withdrawalLoading: mockWithdrawalLoading.asReadonly(),
      affiliateStatus: mockAffiliateStatus.asReadonly(),
      availableBalance: mockAvailableBalance.asReadonly(),
      loadDashboard: jasmine.createSpy('loadDashboard').and.resolveTo(),
      loadLink: jasmine.createSpy('loadLink').and.resolveTo(),
      requestWithdrawal: jasmine.createSpy('requestWithdrawal').and.resolveTo(null),
      resetState: jasmine.createSpy('resetState'),
    };

    await TestBed.configureTestingModule({
      imports: [AffiliateDashboardComponent],
      providers: [
        { provide: AffiliateService, useValue: mockService },
        { provide: ToastService, useValue: toastSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AffiliateDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadDashboard on ngOnInit', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(mockService['loadDashboard']).toHaveBeenCalled();
  }));

  it('should call loadLink when active', fakeAsync(() => {
    mockIsActive.set(true);
    fixture.detectChanges();
    tick();
    expect(mockService['loadDashboard']).toHaveBeenCalled();
    expect(mockService['loadLink']).toHaveBeenCalled();
  }));

  it('should not call loadLink when not active', fakeAsync(() => {
    mockIsActive.set(false);
    fixture.detectChanges();
    tick();
    expect(mockService['loadLink']).not.toHaveBeenCalled();
  }));

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      mockLoading.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });

  describe('error state', () => {
    it('should show error message', () => {
      mockError.set('Erro ao carregar dashboard do afiliado.');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Erro ao carregar dashboard');
    });

    it('should retry on button click', fakeAsync(() => {
      mockError.set('Erro ao carregar dashboard do afiliado.');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const retryBtn = el.querySelector('button');
      expect(retryBtn?.textContent?.trim()).toBe('Tentar novamente');
      retryBtn?.click();
      tick();
      expect(mockService['loadDashboard']).toHaveBeenCalled();
    }));
  });

  describe('not affiliate state', () => {
    it('should show CTA to apply', () => {
      mockNotAffiliate.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Você ainda não é afiliado');
      expect(el.querySelector('a[routerLink="/affiliate/apply"]')).toBeTruthy();
    });
  });

  describe('pending state', () => {
    it('should show pending message', () => {
      mockIsPending.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Solicitação em análise');
    });
  });

  describe('suspended/blocked state', () => {
    it('should show suspended message', () => {
      mockIsSuspended.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('suspensa');
    });

    it('should show blocked message', () => {
      mockIsBlocked.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('bloqueada');
    });
  });

  describe('active dashboard', () => {
    beforeEach(() => {
      mockIsActive.set(true);
      mockDashboard.set(dashboardData);
      mockLink.set(linkData);
    });

    it('should show KPI cards', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Total de Clicks');
      expect(el.textContent).toContain('Conversões');
      expect(el.textContent).toContain('Saldo Disponível');
      expect(el.textContent).toContain('Total Acumulado');
    });

    it('should display metrics values', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('150');
      expect(el.textContent).toContain('10');
      expect(el.textContent).toContain('6,7%');
      expect(el.textContent).toContain('20.00%');
    });

    it('should show referral link', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const input = el.querySelector('input[aria-label="Link de indicação"]') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.value).toBe('https://app.justifica.ai?ref=ABC12345');
    });

    it('should show copy button', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const buttons = Array.from(el.querySelectorAll('button'));
      const copyBtn = buttons.find((b) => b.textContent?.trim() === 'Copiar');
      expect(copyBtn).toBeTruthy();
    });

    it('should show share buttons', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('button[aria-label="Compartilhar no WhatsApp"]')).toBeTruthy();
      expect(el.querySelector('button[aria-label="Compartilhar no Twitter"]')).toBeTruthy();
    });

    it('should show conversions table', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Conversões Recentes');
      const rows = el.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should show empty conversions message', () => {
      mockDashboard.set({ ...dashboardData, recentConversions: [] });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Nenhuma conversão registrada');
    });

    it('should show chart', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Conversões por dia');
      expect(el.querySelector('#chart-panel')).toBeTruthy();
    });

    it('should switch chart period', () => {
      fixture.detectChanges();
      expect(component.chartPeriod()).toBe(7);
      component.chartPeriod.set(30);
      fixture.detectChanges();
      expect(component.chartData().length).toBe(30);
    });

    it('should show Saques link', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('a[routerLink="/affiliate/withdrawals"]')).toBeTruthy();
    });
  });

  describe('withdrawal form', () => {
    beforeEach(() => {
      mockIsActive.set(true);
      mockDashboard.set(dashboardData);
      mockCanWithdraw.set(true);
    });

    it('should toggle withdrawal form', () => {
      fixture.detectChanges();
      expect(component.showWithdrawalForm()).toBeFalse();
      component.showWithdrawalForm.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('#pix-key')).toBeTruthy();
    });

    it('should submit withdrawal', fakeAsync(() => {
      (mockService['requestWithdrawal'] as jasmine.Spy).and.resolveTo({ id: 'wd-1', amount: '200.00', pixKey: 'test@email.com', status: 'pending', message: 'ok' });
      component.showWithdrawalForm.set(true);
      component.withdrawalPixKey.set('test@email.com');
      fixture.detectChanges();

      component.submitWithdrawal();
      tick();

      expect(mockService['requestWithdrawal']).toHaveBeenCalledWith({ pixKey: 'test@email.com' });
      expect(component.showWithdrawalForm()).toBeFalse();
      expect(component.withdrawalPixKey()).toBe('');
    }));

    it('should not submit if pixKey is empty', fakeAsync(() => {
      component.showWithdrawalForm.set(true);
      component.withdrawalPixKey.set('');
      component.submitWithdrawal();
      tick();
      expect(mockService['requestWithdrawal']).not.toHaveBeenCalled();
    }));

    it('should disable button when cannot withdraw', () => {
      mockCanWithdraw.set(false);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const buttons = Array.from(el.querySelectorAll('button'));
      const withdrawBtn = buttons.find((b) => b.textContent?.trim() === 'Solicitar Saque');
      expect(withdrawBtn?.disabled).toBeTrue();
    });
  });

  describe('copy link', () => {
    it('should copy link to clipboard', fakeAsync(() => {
      mockIsActive.set(true);
      mockLink.set(linkData);
      spyOn(navigator.clipboard, 'writeText').and.resolveTo();
      fixture.detectChanges();

      component.copyLink();
      tick();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://app.justifica.ai?ref=ABC12345');
      expect(component.linkCopied()).toBeTrue();
      expect(toastSpy.success).toHaveBeenCalled();

      tick(3000);
      expect(component.linkCopied()).toBeFalse();
    }));

    it('should handle copy error', fakeAsync(() => {
      mockIsActive.set(true);
      mockLink.set(linkData);
      spyOn(navigator.clipboard, 'writeText').and.rejectWith(new Error('fail'));
      fixture.detectChanges();

      component.copyLink();
      tick();

      expect(toastSpy.error).toHaveBeenCalled();
    }));

    it('should do nothing if no link', fakeAsync(() => {
      mockLink.set(null);
      component.copyLink();
      tick();
      expect(toastSpy.success).not.toHaveBeenCalled();
    }));
  });

  describe('share', () => {
    beforeEach(() => {
      mockLink.set(linkData);
      spyOn(window, 'open');
    });

    it('should share on WhatsApp', () => {
      component.shareWhatsApp();
      expect(window.open).toHaveBeenCalledWith(
        jasmine.stringContaining('wa.me'),
        '_blank',
        'noopener',
      );
    });

    it('should share on Twitter', () => {
      component.shareTwitter();
      expect(window.open).toHaveBeenCalledWith(
        jasmine.stringContaining('twitter.com'),
        '_blank',
        'noopener',
      );
    });

    it('should do nothing on WhatsApp if no link', () => {
      mockLink.set(null);
      component.shareWhatsApp();
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should do nothing on Twitter if no link', () => {
      mockLink.set(null);
      component.shareTwitter();
      expect(window.open).not.toHaveBeenCalled();
    });
  });

  describe('formatters', () => {
    it('should format currency', () => {
      expect(component.formatCurrency('500.00')).toContain('500');
    });

    it('should format currency NaN as zero', () => {
      expect(component.formatCurrency('invalid')).toContain('0');
    });

    it('should format number', () => {
      expect(component.formatNumber(1500)).toBe('1.500');
    });

    it('should format percent', () => {
      expect(component.formatPercent(6.67)).toContain('6,7');
    });

    it('should format date', () => {
      const result = component.formatDate('2026-02-20T10:00:00.000Z');
      expect(result).toContain('20');
      expect(result).toContain('02');
      expect(result).toContain('2026');
    });
  });

  describe('pix key input', () => {
    it('should update withdrawalPixKey on input', () => {
      const event = { target: { value: 'new-key' } } as unknown as Event;
      component.onPixKeyInput(event);
      expect(component.withdrawalPixKey()).toBe('new-key');
    });
  });

  describe('chartData', () => {
    it('should generate 7 data points for 7-day period', () => {
      mockDashboard.set(dashboardData);
      component.chartPeriod.set(7);
      expect(component.chartData().length).toBe(7);
    });

    it('should generate 30 data points for 30-day period', () => {
      mockDashboard.set(dashboardData);
      component.chartPeriod.set(30);
      expect(component.chartData().length).toBe(30);
    });

    it('should have height >= 3 for all bars', () => {
      mockDashboard.set(dashboardData);
      component.chartPeriod.set(7);
      for (const bar of component.chartData()) {
        expect(bar.height).toBeGreaterThanOrEqual(3);
      }
    });
  });
});

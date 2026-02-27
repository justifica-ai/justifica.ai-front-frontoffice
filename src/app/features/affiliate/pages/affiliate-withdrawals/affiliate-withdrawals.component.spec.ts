import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AffiliateWithdrawalsComponent } from './affiliate-withdrawals.component';
import { AffiliateService } from '../../services/affiliate.service';
import type { WithdrawalsListResponse } from '../../../../core/models/affiliate.model';

describe('AffiliateWithdrawalsComponent', () => {
  let component: AffiliateWithdrawalsComponent;
  let fixture: ComponentFixture<AffiliateWithdrawalsComponent>;
  let mockService: Record<string, unknown>;

  const emptyResponse: WithdrawalsListResponse = {
    data: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  };

  const withdrawalsResponse: WithdrawalsListResponse = {
    data: [
      { id: 'wd-1', amount: '200.00', pixKey: 'teste@email.com', status: 'completed', processedAt: '2026-02-22T12:00:00.000Z', createdAt: '2026-02-20T12:00:00.000Z' },
      { id: 'wd-2', amount: '100.00', pixKey: '12345678901', status: 'pending', processedAt: null, createdAt: '2026-02-25T12:00:00.000Z' },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  };

  const paginatedResponse: WithdrawalsListResponse = {
    data: [
      { id: 'wd-3', amount: '50.00', pixKey: 'key@test.com', status: 'processing', processedAt: null, createdAt: '2026-02-28T12:00:00.000Z' },
    ],
    pagination: { page: 2, limit: 20, total: 25, totalPages: 2 },
  };

  beforeEach(async () => {
    mockService = {
      loadWithdrawals: jasmine.createSpy('loadWithdrawals').and.resolveTo(emptyResponse),
    };

    await TestBed.configureTestingModule({
      imports: [AffiliateWithdrawalsComponent],
      providers: [
        { provide: AffiliateService, useValue: mockService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AffiliateWithdrawalsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load withdrawals on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(mockService['loadWithdrawals']).toHaveBeenCalledWith({ page: 1, limit: 20 });
  }));

  describe('loading state', () => {
    it('should show skeleton during loading', () => {
      // Don't call detectChanges (which triggers ngOnInit) — manually set loading
      component.loading.set(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('should show empty message when no withdrawals', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Nenhum saque realizado');
    }));

    it('should show link to dashboard', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('a[routerLink="/affiliate"]')).toBeTruthy();
    }));
  });

  describe('withdrawals list', () => {
    beforeEach(() => {
      (mockService['loadWithdrawals'] as jasmine.Spy).and.resolveTo(withdrawalsResponse);
    });

    it('should render withdrawal rows', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const rows = el.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    }));

    it('should display withdrawal amounts', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('200');
      expect(el.textContent).toContain('100');
    }));

    it('should render table headers', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Data');
      expect(el.textContent).toContain('Valor');
      expect(el.textContent).toContain('Chave PIX');
      expect(el.textContent).toContain('Status');
    }));

    it('should show processed date or dash', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('22/02/2026');
      expect(el.textContent).toContain('—');
    }));
  });

  describe('pagination', () => {
    it('should not show pagination when single page', fakeAsync(() => {
      (mockService['loadWithdrawals'] as jasmine.Spy).and.resolveTo(withdrawalsResponse);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const paginationButtons = Array.from(el.querySelectorAll('button')).filter(
        (b) => b.textContent?.trim() === 'Anterior' || b.textContent?.trim() === 'Próxima',
      );
      expect(paginationButtons.length).toBe(0);
    }));

    it('should show pagination when multiple pages', fakeAsync(() => {
      (mockService['loadWithdrawals'] as jasmine.Spy).and.resolveTo(paginatedResponse);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Mostrando');
      expect(el.textContent).toContain('de 25');
    }));

    it('should navigate to next page', fakeAsync(() => {
      (mockService['loadWithdrawals'] as jasmine.Spy).and.resolveTo({
        ...withdrawalsResponse,
        pagination: { page: 1, limit: 20, total: 25, totalPages: 2 },
      });
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      (mockService['loadWithdrawals'] as jasmine.Spy).and.resolveTo(paginatedResponse);
      component.goToPage(2);
      tick();

      expect(component.currentPage()).toBe(2);
      expect(mockService['loadWithdrawals']).toHaveBeenCalledWith({ page: 2, limit: 20 });
    }));
  });

  describe('formatters', () => {
    it('should format date', () => {
      expect(component.formatDate('2026-02-20T00:00:00.000Z')).toContain('20');
    });

    it('should format currency', () => {
      expect(component.formatCurrency('200.00')).toContain('200');
    });

    it('should mask PIX key', () => {
      expect(component.maskPixKey('12345678901')).toBe('123***901');
    });

    it('should not mask short PIX key', () => {
      expect(component.maskPixKey('abc')).toBe('abc');
    });

    it('should get status label', () => {
      expect(component.getStatusLabel('completed')).toBe('Concluído');
      expect(component.getStatusLabel('pending')).toBe('Pendente');
      expect(component.getStatusLabel('processing')).toBe('Processando');
      expect(component.getStatusLabel('rejected')).toBe('Rejeitado');
    });

    it('should return raw status for unknown', () => {
      expect(component.getStatusLabel('unknown')).toBe('unknown');
    });
  });

  describe('back link', () => {
    it('should show back link to affiliate', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('a[routerLink="/affiliate"]')).toBeTruthy();
    });
  });

  describe('startItem and endItem', () => {
    it('should compute correct range', fakeAsync(() => {
      (mockService['loadWithdrawals'] as jasmine.Spy).and.resolveTo(paginatedResponse);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.startItem()).toBe(21);
      expect(component.endItem()).toBe(25);
    }));

    it('should return 0 when no pagination', () => {
      expect(component.startItem()).toBe(0);
      expect(component.endItem()).toBe(0);
    });
  });
});

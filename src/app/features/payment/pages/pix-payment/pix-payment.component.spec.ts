import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { Component } from '@angular/core';

import {
  PixPaymentComponent,
  PayResponse,
  PaymentStatusResponse,
} from './pix-payment.component';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { API_ROUTES } from '../../../../core/constants/api-routes';

@Component({ standalone: true, template: '' })
class DummyComponent {}

const APPEAL_ID = 'test-appeal-abc';
const PAY_URL = `${environment.apiUrl}${API_ROUTES.APPEALS.PAY(APPEAL_ID)}`;
const STATUS_URL = `${environment.apiUrl}${API_ROUTES.APPEALS.PAYMENT_STATUS(APPEAL_ID)}`;

const FUTURE_EXPIRY = new Date(Date.now() + 30 * 60 * 1000).toISOString();

function mockPayData(overrides: Partial<PayResponse['data']> = {}): PayResponse['data'] {
  return {
    transactionId: 'tx-uuid-123',
    pixCharge: {
      txid: 'abc12345678901234567890123456789',
      qrCode: 'data:image/png;base64,iVBOR...',
      brcode: '00020126580014br.gov.bcb.pix...',
      expiresAt: FUTURE_EXPIRY,
    },
    amount: {
      gross: 39.9,
      discounts: { volume: 0, coupon: 0 },
      net: 39.9,
    },
    ...overrides,
  };
}

function mockPayResponse(overrides: Partial<PayResponse['data']> = {}): PayResponse {
  return { data: mockPayData(overrides) };
}

function mockStatusResponse(
  status: 'pending' | 'paid' | 'expired' = 'pending',
): PaymentStatusResponse {
  return {
    data: {
      status,
      txid: 'abc12345678901234567890123456789',
      expiresAt: FUTURE_EXPIRY,
    },
  };
}

describe('PixPaymentComponent', () => {
  let component: PixPaymentComponent;
  let fixture: ComponentFixture<PixPaymentComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let toastService: ToastService;

  function setup(
    params: Record<string, string> = { id: APPEAL_ID },
    queryParams: Record<string, string> = {},
  ): void {
    TestBed.configureTestingModule({
      imports: [PixPaymentComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'payment/:id/pix', component: DummyComponent },
          { path: 'payment/:id/success', component: DummyComponent },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => params[key] ?? null,
              },
              queryParamMap: {
                get: (key: string) => queryParams[key] ?? null,
              },
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(PixPaymentComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService);
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  afterEach(() => {
    component?.ngOnDestroy();
    // Discard any in-flight polling requests before verifying
    httpMock?.match(STATUS_URL);
    httpMock?.verify();
  });

  // ─── Initialization ───

  describe('initialization', () => {
    it('should create the component', () => {
      setup();
      expect(component).toBeTruthy();
    });

    it('should start in loading state', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      expect(component.loading()).toBeTrue();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());
      discardPeriodicTasks();
    }));

    it('should redirect to home if no appeal id', () => {
      setup({ id: '' });
      fixture.detectChanges();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should redirect to home if id param is missing', () => {
      setup({});
      fixture.detectChanges();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should show error toast when no appeal id', () => {
      setup({ id: '' });
      fixture.detectChanges();
      expect(toastService.toasts().length).toBeGreaterThan(0);
    });
  });

  // ─── Create Charge ───

  describe('create charge', () => {
    it('should call POST /api/appeals/:id/pay on init', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      const req = httpMock.expectOne(PAY_URL);
      expect(req.request.method).toBe('POST');
      req.flush(mockPayResponse());
      discardPeriodicTasks();
    }));

    it('should send couponCode from query params', fakeAsync(() => {
      setup({ id: APPEAL_ID }, { coupon: 'DESCONTO10' });
      fixture.detectChanges();

      const req = httpMock.expectOne(PAY_URL);
      expect(req.request.body).toEqual({ couponCode: 'DESCONTO10' });
      req.flush(mockPayResponse());
      discardPeriodicTasks();
    }));

    it('should send empty body when no coupon', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      const req = httpMock.expectOne(PAY_URL);
      expect(req.request.body).toEqual({});
      req.flush(mockPayResponse());
      discardPeriodicTasks();
    }));

    it('should set payment data on success', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      expect(component.paymentData()).toBeTruthy();
      expect(component.paymentData()!.transactionId).toBe('tx-uuid-123');
      expect(component.loading()).toBeFalse();
      discardPeriodicTasks();
    }));

    it('should show error on API failure', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).error(new ProgressEvent('error'), { status: 500 });

      expect(component.error()).toBeTruthy();
      expect(component.loading()).toBeFalse();
    }));
  });

  // ─── Computed values ───

  describe('computed values', () => {
    it('should calculate total discount', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(
        mockPayResponse({
          amount: {
            gross: 39.9,
            discounts: { volume: 1.2, coupon: 3.99 },
            net: 34.71,
          },
        }),
      );

      expect(component.totalDiscount()).toBeCloseTo(5.19, 2);
      discardPeriodicTasks();
    }));

    it('should return zero discount when no discounts', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      expect(component.totalDiscount()).toBe(0);
      discardPeriodicTasks();
    }));

    it('should format countdown display', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      const display = component.countdownDisplay();
      expect(display).toMatch(/^\d{2}:\d{2}$/);
      discardPeriodicTasks();
    }));
  });

  // ─── Countdown ───

  describe('countdown', () => {
    it('should start countdown after charge created', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      expect(component.remainingSeconds()).toBeGreaterThan(0);
      discardPeriodicTasks();
    }));

    it('should decrease remaining seconds over time', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      const initial = component.remainingSeconds();
      tick(5000);
      // Flush any polling requests during the 5 seconds (1 at 3s)
      httpMock.match(STATUS_URL).forEach((req) =>
        req.flush(mockStatusResponse('pending')),
      );
      expect(component.remainingSeconds()).toBeLessThan(initial);
      discardPeriodicTasks();
    }));

    it('should set expired when countdown reaches zero', fakeAsync(() => {
      const pastExpiry = new Date(Date.now() - 1000).toISOString();
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(
        mockPayResponse({
          pixCharge: {
            txid: 'abc12345678901234567890123456789',
            qrCode: 'data:image/png;base64,...',
            brcode: '00020126...',
            expiresAt: pastExpiry,
          },
        }),
      );

      expect(component.expired()).toBeTrue();
      discardPeriodicTasks();
    }));
  });

  // ─── Polling ───

  describe('polling', () => {
    it('should poll payment status every 3 seconds', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      tick(3000);
      const req1 = httpMock.expectOne(STATUS_URL);
      expect(req1.request.method).toBe('GET');
      req1.flush(mockStatusResponse('pending'));

      tick(3000);
      const req2 = httpMock.expectOne(STATUS_URL);
      req2.flush(mockStatusResponse('pending'));

      discardPeriodicTasks();
    }));

    it('should set confirmed when status is paid', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      tick(3000);
      httpMock.expectOne(STATUS_URL).flush(mockStatusResponse('paid'));
      tick(1);

      expect(component.confirmed()).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should redirect to success after payment confirmed', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      tick(3000);
      httpMock.expectOne(STATUS_URL).flush(mockStatusResponse('paid'));

      tick(2000);
      expect(router.navigate).toHaveBeenCalledWith([
        '/payment',
        APPEAL_ID,
        'success',
      ]);
      discardPeriodicTasks();
    }));

    it('should set expired when polling returns expired', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      tick(3000);
      httpMock.expectOne(STATUS_URL).flush(mockStatusResponse('expired'));
      tick(1);

      expect(component.expired()).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should silently handle polling errors', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      tick(3000);
      httpMock.expectOne(STATUS_URL).error(new ProgressEvent('error'));

      expect(component.confirmed()).toBeFalse();
      expect(component.expired()).toBeFalse();
      discardPeriodicTasks();
    }));
  });

  // ─── Copy brcode ───

  describe('copy brcode', () => {
    it('should copy brcode to clipboard', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      spyOn(navigator.clipboard, 'writeText').and.resolveTo();
      component.copyBrcode();
      tick(); // flush clipboard promise microtask

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        '00020126580014br.gov.bcb.pix...',
      );
      expect(component.copied()).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should show toast on successful copy', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      spyOn(navigator.clipboard, 'writeText').and.resolveTo();
      component.copyBrcode();
      tick(); // flush clipboard promise microtask

      expect(toastService.toasts().length).toBeGreaterThan(0);
      discardPeriodicTasks();
    }));

    it('should reset copied state after 3 seconds', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      spyOn(navigator.clipboard, 'writeText').and.resolveTo();
      component.copyBrcode();
      tick(); // flush clipboard promise microtask

      expect(component.copied()).toBeTrue();
      tick(3000);
      // Flush any polling that happened during the 3s
      httpMock.match(STATUS_URL).forEach((req) =>
        req.flush(mockStatusResponse('pending')),
      );
      expect(component.copied()).toBeFalse();
      discardPeriodicTasks();
    }));

    it('should show error toast on clipboard failure', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      spyOn(navigator.clipboard, 'writeText').and.rejectWith(
        new Error('Clipboard denied'),
      );
      component.copyBrcode();
      tick(); // flush rejected clipboard promise

      expect(component.copied()).toBeFalse();
      discardPeriodicTasks();
    }));

    it('should not copy if no payment data', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).error(new ProgressEvent('error'));

      spyOn(navigator.clipboard, 'writeText');
      component.copyBrcode();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    }));
  });

  // ─── Regenerate ───

  describe('regenerate charge', () => {
    it('should create new charge when regenerating', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      // Simulate expired, then regenerate
      component.regenerateCharge();

      const req = httpMock.expectOne(PAY_URL);
      expect(req.request.method).toBe('POST');
      req.flush(mockPayResponse());

      expect(component.paymentData()).toBeTruthy();
      expect(component.loading()).toBeFalse();
      discardPeriodicTasks();
    }));
  });

  // ─── Format ───

  describe('formatCurrency', () => {
    it('should format as Brazilian Real', () => {
      setup();
      expect(component.formatCurrency(39.9)).toBe('R$ 39,90');
    });

    it('should format zero', () => {
      setup();
      expect(component.formatCurrency(0)).toBe('R$ 0,00');
    });

    it('should format with decimals', () => {
      setup();
      expect(component.formatCurrency(1234.56)).toBe('R$ 1234,56');
    });
  });

  // ─── Template rendering ───

  describe('template rendering', () => {
    it('should show loading skeleton initially', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('app-skeleton-loader')).toBeTruthy();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());
      discardPeriodicTasks();
    }));

    it('should show QR Code image when data loaded', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.src).toContain('data:image/png;base64');
      expect(img.alt).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should show copy button when data loaded', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector(
        'button[aria-label="Copiar código PIX"]',
      ) as HTMLButtonElement;
      expect(btn).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should show countdown timer', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());
      fixture.detectChanges();

      const timer = fixture.nativeElement.querySelector(
        '[role="timer"]',
      ) as HTMLElement;
      expect(timer).toBeTruthy();
      expect(timer.textContent).toMatch(/Expira em \d{2}:\d{2}/);
      discardPeriodicTasks();
    }));

    it('should show instructions', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());
      fixture.detectChanges();

      const instructions = fixture.nativeElement.querySelector(
        'ol[aria-label="Passos para pagamento PIX"]',
      ) as HTMLElement;
      expect(instructions).toBeTruthy();
      expect(instructions.querySelectorAll('li').length).toBe(3);
      discardPeriodicTasks();
    }));

    it('should show error state with retry button', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).error(new ProgressEvent('error'));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('button[aria-label="Tentar novamente"]')).toBeTruthy();
    }));

    it('should show confirmed state', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      tick(3000);
      httpMock.expectOne(STATUS_URL).flush(mockStatusResponse('paid'));
      tick(1);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Pagamento confirmado');
      discardPeriodicTasks();
    }));

    it('should show expired state with regenerate button', fakeAsync(() => {
      const pastExpiry = new Date(Date.now() - 1000).toISOString();
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(
        mockPayResponse({
          pixCharge: {
            txid: 'abc12345678901234567890123456789',
            qrCode: 'data:image/png;base64,...',
            brcode: '00020126...',
            expiresAt: pastExpiry,
          },
        }),
      );
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Cobrança expirada');
      expect(
        el.querySelector('button[aria-label="Gerar novo código PIX"]'),
      ).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should show discount when present', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(
        mockPayResponse({
          amount: {
            gross: 39.9,
            discounts: { volume: 1.2, coupon: 3.99 },
            net: 34.71,
          },
        }),
      );
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Desconto aplicado');
      discardPeriodicTasks();
    }));

    it('should show amount', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('R$ 39,90');
      discardPeriodicTasks();
    }));
  });

  // ─── Cleanup ───

  describe('cleanup', () => {
    it('should stop timers on destroy', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PAY_URL).flush(mockPayResponse());

      component.ngOnDestroy();

      // Advance time — no polling requests should be made
      tick(6000);
      const pending = httpMock.match(STATUS_URL);
      expect(pending.length).toBe(0);
      discardPeriodicTasks();
    }));
  });
});

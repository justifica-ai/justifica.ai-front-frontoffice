import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { Component } from '@angular/core';

import { PaywallComponent, PricingData } from './paywall.component';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { API_ROUTES } from '../../../../core/constants/api-routes';

@Component({ standalone: true, template: '' })
class DummyComponent {}

const APPEAL_ID = 'test-appeal-abc';
const PRICING_URL = `${environment.apiUrl}${API_ROUTES.APPEALS.PRICING(APPEAL_ID)}`;
const APPEAL_URL = `${environment.apiUrl}${API_ROUTES.APPEALS.BY_ID(APPEAL_ID)}`;

function mockPricingData(overrides: Partial<PricingData> = {}): PricingData {
  return {
    amountGross: 39.9,
    discountVolumePct: 0,
    discountVolume: 0,
    discountCouponPct: 0,
    discountCoupon: 0,
    couponName: null,
    couponMessage: null,
    amountNet: 39.9,
    affiliateCommission: 0,
    currency: 'BRL',
    ...overrides,
  };
}

function mockPricingResponse(overrides: Partial<PricingData> = {}): { data: PricingData } {
  return { data: mockPricingData(overrides) };
}

function mockAppealResponse(overrides: Record<string, unknown> = {}): {
  data: Record<string, unknown>;
} {
  return {
    data: {
      id: APPEAL_ID,
      appealType: 'first_instance',
      formData: {
        vehicle: { plate: 'ABC1D23' },
        infraction: { infractionCode: '746-10' },
      },
      ...overrides,
    },
  };
}

describe('PaywallComponent', () => {
  let component: PaywallComponent;
  let fixture: ComponentFixture<PaywallComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let toastService: ToastService;

  function setup(
    params: Record<string, string> = { id: APPEAL_ID },
  ): void {
    TestBed.configureTestingModule({
      imports: [PaywallComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'payment/:id', component: DummyComponent },
          { path: 'payment/:id/pix', component: DummyComponent },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => params[key] ?? null,
              },
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(PaywallComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService);
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  function flushInitialRequests(
    pricingOverrides: Partial<PricingData> = {},
    appealOverrides: Record<string, unknown> = {},
  ): void {
    httpMock.expectOne(APPEAL_URL).flush(mockAppealResponse(appealOverrides));
    httpMock.expectOne(PRICING_URL).flush(mockPricingResponse(pricingOverrides));
  }

  afterEach(() => {
    httpMock?.verify();
  });

  // ─── Initialization ───

  describe('initialization', () => {
    it('should create the component', () => {
      setup();
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      setup();
      fixture.detectChanges();
      expect(component.loading()).toBeTrue();
      flushInitialRequests();
    });

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

  // ─── Loading Data ───

  describe('loading data', () => {
    it('should call pricing API on init', () => {
      setup();
      fixture.detectChanges();

      httpMock.expectOne(APPEAL_URL).flush(mockAppealResponse());
      const req = httpMock.expectOne(PRICING_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockPricingResponse());
    });

    it('should call appeal detail API on init', () => {
      setup();
      fixture.detectChanges();

      const req = httpMock.expectOne(APPEAL_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockAppealResponse());
      httpMock.expectOne(PRICING_URL).flush(mockPricingResponse());
    });

    it('should set pricing data on successful response', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      expect(component.pricing()).toBeTruthy();
      expect(component.pricing()!.amountGross).toBe(39.9);
      expect(component.pricing()!.amountNet).toBe(39.9);
      expect(component.loading()).toBeFalse();
    });

    it('should set appeal data on successful response', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      expect(component.appeal()).toBeTruthy();
      expect(component.appeal()!.appealType).toBe('first_instance');
    });

    it('should show error when pricing API fails', () => {
      setup();
      fixture.detectChanges();

      httpMock.expectOne(APPEAL_URL).flush(mockAppealResponse());
      httpMock
        .expectOne(PRICING_URL)
        .error(new ProgressEvent('error'), { status: 500 });

      expect(component.error()).toBeTruthy();
      expect(component.loading()).toBeFalse();
    });

    it('should still show pricing when appeal API fails', () => {
      setup();
      fixture.detectChanges();

      httpMock
        .expectOne(APPEAL_URL)
        .error(new ProgressEvent('error'), { status: 500 });
      httpMock.expectOne(PRICING_URL).flush(mockPricingResponse());

      expect(component.pricing()).toBeTruthy();
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeNull();
    });

    it('should reload data when retry button is clicked', () => {
      setup();
      fixture.detectChanges();

      httpMock.expectOne(APPEAL_URL).flush(mockAppealResponse());
      httpMock
        .expectOne(PRICING_URL)
        .error(new ProgressEvent('error'), { status: 500 });

      expect(component.error()).toBeTruthy();

      component.loadData();
      flushInitialRequests();

      expect(component.error()).toBeNull();
      expect(component.loading()).toBeFalse();
      expect(component.pricing()).toBeTruthy();
    });
  });

  // ─── Computed Values ───

  describe('computed values', () => {
    it('should map first_instance to label', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests({}, { appealType: 'first_instance' });
      expect(component.appealTypeLabel()).toBe('Recurso de 1ª Instância');
    });

    it('should map second_instance to label', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests({}, { appealType: 'second_instance' });
      expect(component.appealTypeLabel()).toBe('Recurso de 2ª Instância');
    });

    it('should map prior_defense to label', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests({}, { appealType: 'prior_defense' });
      expect(component.appealTypeLabel()).toBe('Defesa Prévia');
    });

    it('should return empty for unknown appeal type', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests({}, { appealType: 'unknown_type' });
      expect(component.appealTypeLabel()).toBe('');
    });

    it('should extract vehicle plate from formData', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      expect(component.vehiclePlate()).toBe('ABC1D23');
    });

    it('should extract infraction code from formData', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      expect(component.infractionCode()).toBe('746-10');
    });

    it('should return empty plate when formData is null', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests({}, { formData: null });
      expect(component.vehiclePlate()).toBe('');
    });

    it('should return empty infraction when formData has no infraction', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests({}, { formData: { vehicle: {} } });
      expect(component.infractionCode()).toBe('');
    });

    it('should detect hasDiscount when volume discount exists', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests({ discountVolume: 1.2, discountVolumePct: 3 });
      expect(component.hasDiscount()).toBeTrue();
    });

    it('should detect hasDiscount when coupon discount exists', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests({
        discountCoupon: 3.99,
        discountCouponPct: 10,
        couponName: 'TEST',
      });
      expect(component.hasDiscount()).toBeTrue();
    });

    it('should return false for hasDiscount when no discounts', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      expect(component.hasDiscount()).toBeFalse();
    });
  });

  // ─── Currency Formatting ───

  describe('formatCurrency', () => {
    beforeEach(() => {
      setup();
    });

    it('should format 39.9 as R$ 39,90', () => {
      expect(component.formatCurrency(39.9)).toBe('R$ 39,90');
    });

    it('should format 1.5 as R$ 1,50', () => {
      expect(component.formatCurrency(1.5)).toBe('R$ 1,50');
    });

    it('should format 0 as R$ 0,00', () => {
      expect(component.formatCurrency(0)).toBe('R$ 0,00');
    });

    it('should format 100 as R$ 100,00', () => {
      expect(component.formatCurrency(100)).toBe('R$ 100,00');
    });

    it('should format 35.91 correctly', () => {
      expect(component.formatCurrency(35.91)).toBe('R$ 35,91');
    });
  });

  // ─── Coupon Flow ───

  describe('coupon flow', () => {
    it('should not show coupon input initially', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      expect(component.couponExpanded()).toBeFalse();
    });

    it('should toggle coupon input on click', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      component.toggleCoupon();
      expect(component.couponExpanded()).toBeTrue();

      component.toggleCoupon();
      expect(component.couponExpanded()).toBeFalse();
    });

    it('should update coupon input value', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      const fakeEvent = {
        target: { value: 'DESCONTO10' },
      } as unknown as Event;
      component.onCouponInputChange(fakeEvent);
      expect(component.couponInput()).toBe('DESCONTO10');
    });

    it('should not apply empty coupon', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      component.couponInput.set('   ');
      component.applyCoupon();

      // No HTTP request should be made for empty coupon
      httpMock.expectNone((req) => req.url.includes('pricing'));
      expect(component.applyingCoupon()).toBeFalse();
    });

    it('should apply coupon successfully', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      component.couponInput.set('DESCONTO10');
      component.applyCoupon();

      expect(component.applyingCoupon()).toBeTrue();

      const req = httpMock.expectOne(
        (r) =>
          r.url === PRICING_URL &&
          r.params.get('coupon') === 'DESCONTO10',
      );
      req.flush(
        mockPricingResponse({
          discountCouponPct: 10,
          discountCoupon: 3.99,
          couponName: 'DESCONTO10',
          amountNet: 35.91,
        }),
      );

      expect(component.applyingCoupon()).toBeFalse();
      expect(component.couponApplied()).toBeTrue();
      expect(component.pricing()!.discountCoupon).toBe(3.99);
      expect(component.pricing()!.amountNet).toBe(35.91);
      expect(component.couponFeedback()).toBeNull();
    });

    it('should show feedback when coupon is invalid', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      component.couponInput.set('BADCODE');
      component.applyCoupon();

      const req = httpMock.expectOne(
        (r) =>
          r.url === PRICING_URL &&
          r.params.get('coupon') === 'BADCODE',
      );
      req.flush(
        mockPricingResponse({
          couponMessage: 'Cupom expirado.',
        }),
      );

      expect(component.couponApplied()).toBeFalse();
      expect(component.couponFeedback()).toBe('Cupom expirado.');
    });

    it('should show generic error when coupon has no message', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      component.couponInput.set('UNKNOWN');
      component.applyCoupon();

      httpMock
        .expectOne((r) => r.url === PRICING_URL && r.params.has('coupon'))
        .flush(mockPricingResponse());

      expect(component.couponFeedback()).toBe(
        'Cupom inválido ou expirado.',
      );
    });

    it('should show error feedback when coupon API fails', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      component.couponInput.set('ERROR');
      component.applyCoupon();

      httpMock
        .expectOne((r) => r.url === PRICING_URL && r.params.has('coupon'))
        .error(new ProgressEvent('error'), { status: 500 });

      expect(component.applyingCoupon()).toBeFalse();
      expect(component.couponFeedback()).toBe(
        'Erro ao validar cupom. Tente novamente.',
      );
    });

    it('should remove coupon and reload pricing', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests({
        discountCoupon: 3.99,
        discountCouponPct: 10,
        couponName: 'DESCONTO10',
        amountNet: 35.91,
      });

      expect(component.couponApplied()).toBeTrue();

      component.removeCoupon();

      const req = httpMock.expectOne(PRICING_URL);
      req.flush(mockPricingResponse());

      expect(component.couponApplied()).toBeFalse();
      expect(component.couponInput()).toBe('');
      expect(component.couponExpanded()).toBeFalse();
      expect(component.couponFeedback()).toBeNull();
      expect(component.pricing()!.amountNet).toBe(39.9);
    });

    it('should show toast on remove coupon failure', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests({
        discountCoupon: 3.99,
        couponName: 'DESCONTO10',
      });

      component.removeCoupon();

      httpMock
        .expectOne(PRICING_URL)
        .error(new ProgressEvent('error'), { status: 500 });

      expect(toastService.toasts().length).toBeGreaterThan(0);
    });

    it('should show success toast when coupon applied', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      component.couponInput.set('DESCONTO10');
      component.applyCoupon();

      httpMock
        .expectOne((r) => r.url === PRICING_URL && r.params.has('coupon'))
        .flush(
          mockPricingResponse({
            discountCouponPct: 10,
            discountCoupon: 3.99,
            couponName: 'DESCONTO10',
            amountNet: 35.91,
          }),
        );

      const successToast = toastService
        .toasts()
        .find((t) => t.type === 'success');
      expect(successToast).toBeTruthy();
    });
  });

  // ─── Navigation ───

  describe('navigation', () => {
    it('should navigate to PIX page without coupon', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      component.proceedToPayment();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/payment', APPEAL_ID, 'pix'],
        { queryParams: {} },
      );
    });

    it('should navigate to PIX page with coupon when applied', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests({
        discountCoupon: 3.99,
        discountCouponPct: 10,
        couponName: 'CUPOM20',
        amountNet: 35.91,
      });

      component.couponInput.set('CUPOM20');
      component.proceedToPayment();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/payment', APPEAL_ID, 'pix'],
        { queryParams: { coupon: 'CUPOM20' } },
      );
    });

    it('should not pass coupon when coupon is not applied', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      component.couponInput.set('NOTAPPLIED');
      component.proceedToPayment();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/payment', APPEAL_ID, 'pix'],
        { queryParams: {} },
      );
    });
  });

  // ─── Template Rendering ───

  describe('template rendering', () => {
    it('should show skeleton loader while loading', () => {
      setup();
      fixture.detectChanges();

      const skeletons =
        fixture.nativeElement.querySelectorAll('app-skeleton-loader');
      expect(skeletons.length).toBeGreaterThan(0);

      flushInitialRequests();
    });

    it('should show error message on failure', () => {
      setup();
      fixture.detectChanges();

      httpMock.expectOne(APPEAL_URL).flush(mockAppealResponse());
      httpMock
        .expectOne(PRICING_URL)
        .error(new ProgressEvent('error'), { status: 500 });
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('.text-red-600');
      expect(errorEl).toBeTruthy();
    });

    it('should show pricing breakdown when loaded', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('R$ 39,90');
      expect(el.textContent).toContain('Resumo do pedido');
    });

    it('should show CTA with net amount', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests({ amountNet: 35.91 });
      fixture.detectChanges();

      const cta = fixture.nativeElement.querySelector(
        'button[aria-label*="Gerar PIX"]',
      );
      expect(cta).toBeTruthy();
      expect(cta.textContent).toContain('R$ 35,91');
    });

    it('should show trust badges', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Pagamento 100% seguro via PIX');
      expect(el.textContent).toContain('Documento entregue em instantes');
    });

    it('should show appeal type badge', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Recurso de 1ª Instância');
    });

    it('should show vehicle plate badge', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Placa: ABC1D23');
    });

    it('should show infraction code badge', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Infração: 746-10');
    });

    it('should show volume discount line when present', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests({
        discountVolumePct: 3,
        discountVolume: 1.2,
        amountNet: 38.7,
      });
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Desconto de volume');
      expect(el.textContent).toContain('−3%');
    });

    it('should show retry button on error', () => {
      setup();
      fixture.detectChanges();

      httpMock.expectOne(APPEAL_URL).flush(mockAppealResponse());
      httpMock
        .expectOne(PRICING_URL)
        .error(new ProgressEvent('error'), { status: 500 });
      fixture.detectChanges();

      const retryBtn = fixture.nativeElement.querySelector(
        'button[aria-label*="Tentar"]',
      );
      expect(retryBtn).toBeTruthy();
    });
  });
});

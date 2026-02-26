import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { Component } from '@angular/core';

import {
  AppealDetailComponent,
  AppealDetailResponse,
  DocumentResponse,
} from './appeal-detail.component';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { API_ROUTES } from '../../../../core/constants/api-routes';

@Component({ standalone: true, template: '' })
class DummyComponent {}

const APPEAL_ID = 'test-appeal-detail-123';
const DETAIL_URL = `${environment.apiUrl}${API_ROUTES.APPEALS.BY_ID(APPEAL_ID)}`;
const DOCUMENT_URL = `${environment.apiUrl}${API_ROUTES.APPEALS.DOWNLOAD(APPEAL_ID)}?format=json`;

function mockAppealResponse(
  overrides: Partial<AppealDetailResponse> = {},
): AppealDetailResponse {
  return {
    id: APPEAL_ID,
    userId: 'user-abc',
    vehicleId: 'vehicle-123',
    infractionId: 'infraction-456',
    status: 'generated',
    appealType: 'first_instance',
    formData: {
      vehicle: {
        plate: 'ABC1D23',
        brand: 'Fiat',
        model: 'Uno',
        year: '2020',
        color: 'Branco',
        renavam: '12345678901',
      },
      infraction: {
        autoNumber: 'AIT-001',
        infractionDate: '2025-01-15',
        infractionTime: '14:30',
        infractionCode: '746-10',
        infractionDescription: 'Dirigir sem cinto de segurança',
        location: 'Av. Paulista, 1000',
        organName: 'DETRAN-SP',
        notificationDate: '2025-02-01',
        speedMeasured: '',
        speedLimit: '',
      },
      driver: {
        isOwner: true,
        driverName: '',
        driverCnhCategory: 'B',
      },
      arguments: {
        defenseReasons: ['Ausência de sinalização', 'Erro no enquadramento'],
        additionalDetails: 'Detalhes adicionais da defesa.',
      },
    },
    generatedContent: 'Conteúdo gerado do recurso para preview...',
    expiresAt: null,
    createdAt: '2025-07-01T10:00:00.000Z',
    updatedAt: '2025-07-02T15:30:00.000Z',
    ...overrides,
  };
}

function mockDocumentResponse(
  overrides: Partial<DocumentResponse> = {},
): DocumentResponse {
  return {
    documentId: 'doc-789',
    appealId: APPEAL_ID,
    content: 'Documento completo do recurso com todos os argumentos...',
    version: 1,
    createdAt: '2025-07-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('AppealDetailComponent', () => {
  let component: AppealDetailComponent;
  let fixture: ComponentFixture<AppealDetailComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let toastService: ToastService;

  function setup(params: Record<string, string> = { id: APPEAL_ID }): void {
    TestBed.configureTestingModule({
      imports: [AppealDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'history', component: DummyComponent },
          { path: 'payment/:id', component: DummyComponent },
          { path: 'payment/:id/pix', component: DummyComponent },
          { path: 'appeals/new/form', component: DummyComponent },
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

    fixture = TestBed.createComponent(AppealDetailComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService);
    spyOn(router, 'navigate').and.resolveTo(true);
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
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());
    });

    it('should redirect to history if no appeal id', () => {
      setup({ id: '' });
      fixture.detectChanges();
      expect(router.navigate).toHaveBeenCalledWith(['/history']);
    });

    it('should redirect to history if id param is missing', () => {
      setup({});
      fixture.detectChanges();
      expect(router.navigate).toHaveBeenCalledWith(['/history']);
    });

    it('should show error toast when no appeal id', () => {
      setup({ id: '' });
      fixture.detectChanges();
      expect(toastService.toasts().length).toBeGreaterThan(0);
    });
  });

  // ─── Loading appeal ───

  describe('loading appeal', () => {
    it('should call the detail API endpoint', () => {
      setup();
      fixture.detectChanges();
      const req = httpMock.expectOne(DETAIL_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockAppealResponse());
    });

    it('should set appeal data on successful response', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());

      expect(component.appeal()).toBeTruthy();
      expect(component.appeal()!.id).toBe(APPEAL_ID);
      expect(component.appeal()!.status).toBe('generated');
      expect(component.loading()).toBeFalse();
    });

    it('should set error on failed response', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .error(new ProgressEvent('error'), { status: 500 });

      expect(component.error()).toBeTruthy();
      expect(component.loading()).toBeFalse();
    });

    it('should retry when loadAppeal is called again', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .error(new ProgressEvent('error'), { status: 500 });

      expect(component.error()).toBeTruthy();

      component.loadAppeal();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());

      expect(component.error()).toBeNull();
      expect(component.loading()).toBeFalse();
    });

    it('should load document when status is paid', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .flush(mockAppealResponse({ status: 'paid' }));

      const docReq = httpMock.expectOne(DOCUMENT_URL);
      expect(docReq.request.method).toBe('GET');
      docReq.flush(mockDocumentResponse());

      expect(component.document()).toBeTruthy();
      expect(component.loading()).toBeFalse();
    });

    it('should load document when status is downloaded', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .flush(mockAppealResponse({ status: 'downloaded' }));

      httpMock.expectOne(DOCUMENT_URL).flush(mockDocumentResponse());
      expect(component.document()).toBeTruthy();
    });

    it('should not load document when status is generated', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .flush(mockAppealResponse({ status: 'generated' }));

      httpMock.expectNone(DOCUMENT_URL);
      expect(component.loading()).toBeFalse();
    });

    it('should handle document load failure gracefully', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .flush(mockAppealResponse({ status: 'paid' }));

      httpMock
        .expectOne(DOCUMENT_URL)
        .error(new ProgressEvent('error'), { status: 500 });

      expect(component.document()).toBeNull();
      expect(component.loading()).toBeFalse();
    });
  });

  // ─── Computed values ───

  describe('computed values', () => {
    it('should compute status label for generated', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'generated' }));

      expect(component.statusLabel()).toBe('Gerado');
    });

    it('should compute status label for paid', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'paid' }));
      httpMock.expectOne(DOCUMENT_URL).flush(mockDocumentResponse());

      expect(component.statusLabel()).toBe('Pago');
    });

    it('should compute status label for draft', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'draft' }));

      expect(component.statusLabel()).toBe('Rascunho');
    });

    it('should compute status label for expired', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'expired' }));

      expect(component.statusLabel()).toBe('Expirado');
    });

    it('should compute status label for generation_failed', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'generation_failed' }));

      expect(component.statusLabel()).toBe('Falha na geração');
    });

    it('should compute appeal type label for first_instance', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ appealType: 'first_instance' }));

      expect(component.appealTypeLabel()).toBe('Recurso de 1ª Instância');
    });

    it('should compute appeal type label for jari', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ appealType: 'jari' }));

      expect(component.appealTypeLabel()).toBe('Recurso JARI');
    });

    it('should return empty string for unknown appeal type', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ appealType: 'unknown' }));

      expect(component.appealTypeLabel()).toBe('');
    });

    it('should compute timeline step index for draft', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'draft' }));

      expect(component.currentStepIndex()).toBe(0);
    });

    it('should compute timeline step index for generated', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'generated' }));

      expect(component.currentStepIndex()).toBe(1);
    });

    it('should compute timeline step index for awaiting_payment', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'awaiting_payment' }));

      expect(component.currentStepIndex()).toBe(2);
    });

    it('should compute timeline step index for paid', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'paid' }));
      httpMock.expectOne(DOCUMENT_URL).flush(mockDocumentResponse());

      expect(component.currentStepIndex()).toBe(3);
    });

    it('should identify terminal status for expired', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'expired' }));

      expect(component.isTerminalStatus()).toBeTrue();
    });

    it('should identify terminal status for generation_failed', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'generation_failed' }));

      expect(component.isTerminalStatus()).toBeTrue();
    });

    it('should not be terminal status for generated', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'generated' }));

      expect(component.isTerminalStatus()).toBeFalse();
    });

    it('should identify paid status', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'paid' }));
      httpMock.expectOne(DOCUMENT_URL).flush(mockDocumentResponse());

      expect(component.isPaid()).toBeTrue();
    });

    it('should identify downloaded as paid', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'downloaded' }));
      httpMock.expectOne(DOCUMENT_URL).flush(mockDocumentResponse());

      expect(component.isPaid()).toBeTrue();
    });

    it('should not identify draft as paid', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'draft' }));

      expect(component.isPaid()).toBeFalse();
    });

    it('should extract vehicle plate from formData', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());

      expect(component.vehiclePlate()).toBe('ABC1D23');
    });

    it('should extract vehicle description from formData', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());

      expect(component.vehicleDescription()).toContain('Fiat');
      expect(component.vehicleDescription()).toContain('Uno');
      expect(component.vehicleDescription()).toContain('2020');
    });

    it('should return empty vehicle description when no brand/model', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(
        mockAppealResponse({
          formData: { vehicle: { plate: 'XYZ9W87' } },
        }),
      );

      expect(component.vehicleDescription()).toBe('');
    });

    it('should extract infraction code from formData', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());

      expect(component.infractionCode()).toBe('746-10');
    });

    it('should extract infraction description from formData', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());

      expect(component.infractionDescription()).toBe('Dirigir sem cinto de segurança');
    });

    it('should extract auto number from formData', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());

      expect(component.autoNumber()).toBe('AIT-001');
    });

    it('should extract organ name from formData', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());

      expect(component.organName()).toBe('DETRAN-SP');
    });

    it('should show Proprietário when driver is owner', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());

      expect(component.driverName()).toBe('Proprietário');
    });

    it('should show driver name when not owner', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(
        mockAppealResponse({
          formData: {
            driver: {
              isOwner: false,
              driverName: 'João Silva',
              driverCnhCategory: 'B',
            },
          },
        }),
      );

      expect(component.driverName()).toBe('João Silva');
    });

    it('should extract defense reasons from formData', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());

      expect(component.defenseReasons().length).toBe(2);
      expect(component.defenseReasons()).toContain('Ausência de sinalização');
    });

    it('should truncate preview text to 500 chars', () => {
      const longContent = 'A'.repeat(1000);
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(
        mockAppealResponse({ generatedContent: longContent }),
      );

      expect(component.previewText().length).toBe(500);
    });

    it('should handle null formData gracefully', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(
        mockAppealResponse({ formData: null }),
      );

      expect(component.vehiclePlate()).toBe('');
      expect(component.vehicleDescription()).toBe('');
      expect(component.infractionCode()).toBe('');
      expect(component.driverName()).toBe('');
      expect(component.defenseReasons()).toEqual([]);
    });

    it('should compute formatted dates', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());

      expect(component.formattedCreatedAt()).toBeTruthy();
      expect(component.formattedUpdatedAt()).toBeTruthy();
    });
  });

  // ─── Actions ───

  describe('actions', () => {
    it('should toggle document expanded state', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'paid' }));
      httpMock.expectOne(DOCUMENT_URL).flush(mockDocumentResponse());

      expect(component.documentExpanded()).toBeTrue();
      component.toggleDocument();
      expect(component.documentExpanded()).toBeFalse();
      component.toggleDocument();
      expect(component.documentExpanded()).toBeTrue();
    });

    it('should navigate to paywall', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'generated' }));

      component.navigateToPaywall();
      expect(router.navigate).toHaveBeenCalledWith(['/payment', APPEAL_ID]);
    });

    it('should navigate to payment PIX', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(
        mockAppealResponse({ status: 'awaiting_payment' }),
      );

      component.navigateToPayment();
      expect(router.navigate).toHaveBeenCalledWith([
        '/payment',
        APPEAL_ID,
        'pix',
      ]);
    });

    it('should navigate to form to continue draft', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'draft' }));

      component.continueDraft();
      expect(router.navigate).toHaveBeenCalledWith(
        ['/appeals', 'new', 'form'],
        { queryParams: { appealId: APPEAL_ID } },
      );
    });

    it('should navigate back to history', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());

      component.navigateBack();
      expect(router.navigate).toHaveBeenCalledWith(['/history']);
    });

    it('should download PDF', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'paid' }));
      httpMock.expectOne(DOCUMENT_URL).flush(mockDocumentResponse());

      component.downloadPdf();
      expect(component.downloading()).toBeTrue();

      const pdfUrl = `${environment.apiUrl}${API_ROUTES.APPEALS.DOWNLOAD(APPEAL_ID)}?format=pdf`;
      const pdfReq = httpMock.expectOne(pdfUrl);
      expect(pdfReq.request.method).toBe('GET');
      expect(pdfReq.request.responseType).toBe('blob');
      pdfReq.flush(new Blob(['pdf-content'], { type: 'application/pdf' }));

      expect(component.downloading()).toBeFalse();
    });

    it('should handle PDF download failure', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'paid' }));
      httpMock.expectOne(DOCUMENT_URL).flush(mockDocumentResponse());

      component.downloadPdf();

      const pdfUrl = `${environment.apiUrl}${API_ROUTES.APPEALS.DOWNLOAD(APPEAL_ID)}?format=pdf`;
      httpMock
        .expectOne(pdfUrl)
        .error(new ProgressEvent('error'), { status: 500 });

      expect(component.downloading()).toBeFalse();
      expect(toastService.toasts().length).toBeGreaterThan(0);
    });

    it('should not start PDF download when already downloading', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse({ status: 'paid' }));
      httpMock.expectOne(DOCUMENT_URL).flush(mockDocumentResponse());

      component.downloadPdf();

      // Call again while still downloading
      component.downloadPdf();

      // Only one PDF request should be made
      const pdfUrl = `${environment.apiUrl}${API_ROUTES.APPEALS.DOWNLOAD(APPEAL_ID)}?format=pdf`;
      httpMock.expectOne(pdfUrl).flush(new Blob(['pdf']));
    });
  });

  // ─── Format date ───

  describe('formatDate', () => {
    it('should format a valid ISO date string', () => {
      setup();
      const result = component.formatDate('2025-07-01T10:00:00.000Z');
      expect(result).toBeTruthy();
      expect(result).toContain('07');
      expect(result).toContain('2025');
    });

    it('should return empty string for empty input', () => {
      setup();
      expect(component.formatDate('')).toBe('');
    });
  });

  // ─── Rendering ───

  describe('rendering', () => {
    it('should show skeleton loaders while loading', () => {
      setup();
      fixture.detectChanges();

      const skeletons =
        fixture.nativeElement.querySelectorAll('app-skeleton-loader');
      expect(skeletons.length).toBe(4);

      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());
    });

    it('should show error message with retry button on failure', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .error(new ProgressEvent('error'), { status: 500 });
      fixture.detectChanges();

      const errorText = fixture.nativeElement.textContent;
      expect(errorText).toContain('Não foi possível carregar');

      const retryButton = fixture.nativeElement.querySelector(
        'button[aria-label="Tentar carregar recurso novamente"]',
      );
      expect(retryButton).toBeTruthy();
    });

    it('should show status badge after loading', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('app-status-badge');
      expect(badge).toBeTruthy();
    });

    it('should show timeline for non-terminal statuses', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .flush(mockAppealResponse({ status: 'generated' }));
      fixture.detectChanges();

      const timeline = fixture.nativeElement.querySelector(
        '[role="progressbar"]',
      );
      expect(timeline).toBeTruthy();
    });

    it('should not show timeline for expired status', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .flush(mockAppealResponse({ status: 'expired' }));
      fixture.detectChanges();

      const timeline = fixture.nativeElement.querySelector(
        '[role="progressbar"]',
      );
      expect(timeline).toBeFalsy();
    });

    it('should show expired banner for expired status', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .flush(mockAppealResponse({ status: 'expired' }));
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Este recurso expirou');
    });

    it('should show generation failed banner', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .flush(mockAppealResponse({ status: 'generation_failed' }));
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('erro na geração');
    });

    it('should show vehicle info', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('ABC1D23');
      expect(text).toContain('Fiat');
    });

    it('should show infraction info', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('746-10');
      expect(text).toContain('Dirigir sem cinto de segurança');
    });

    it('should show defense reasons', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Ausência de sinalização');
      expect(text).toContain('Erro no enquadramento');
    });

    it('should show appeal type badge', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Recurso de 1ª Instância');
    });

    it('should show pay CTA for generated status', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .flush(mockAppealResponse({ status: 'generated' }));
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector(
        'button[aria-label="Pagar e acessar documento completo"]',
      );
      expect(button).toBeTruthy();
    });

    it('should show PIX CTA for awaiting_payment status', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .flush(mockAppealResponse({ status: 'awaiting_payment' }));
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector(
        'button[aria-label="Ver PIX e realizar pagamento"]',
      );
      expect(button).toBeTruthy();
    });

    it('should show continue form CTA for draft status', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .flush(mockAppealResponse({ status: 'draft' }));
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector(
        'button[aria-label="Continuar preenchendo o formulário"]',
      );
      expect(button).toBeTruthy();
    });

    it('should show download and copy buttons for paid status', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .flush(mockAppealResponse({ status: 'paid' }));
      httpMock.expectOne(DOCUMENT_URL).flush(mockDocumentResponse());
      fixture.detectChanges();

      const downloadBtn = fixture.nativeElement.querySelector(
        'button[aria-label="Baixar PDF"]',
      );
      const copyBtn = fixture.nativeElement.querySelector(
        'button[aria-label="Copiar texto"]',
      );
      expect(downloadBtn).toBeTruthy();
      expect(copyBtn).toBeTruthy();
    });

    it('should show preview section for generated status with content', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(
        mockAppealResponse({
          status: 'generated',
          generatedContent: 'Preview do recurso gerado...',
        }),
      );
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Pré-visualização do documento');
      expect(text).toContain('Preview do recurso gerado');
    });

    it('should show document section for paid with document', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(DETAIL_URL)
        .flush(mockAppealResponse({ status: 'paid' }));
      httpMock.expectOne(DOCUMENT_URL).flush(mockDocumentResponse());
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Documento completo');
      expect(text).toContain('Versão 1');
    });

    it('should show back button', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(DETAIL_URL).flush(mockAppealResponse());
      fixture.detectChanges();

      const backBtn = fixture.nativeElement.querySelector(
        'button[aria-label="Voltar para lista de recursos"]',
      );
      expect(backBtn).toBeTruthy();
    });
  });
});

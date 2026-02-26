import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { Component } from '@angular/core';

import {
  PaymentSuccessComponent,
  AppealDetailResponse,
  DocumentResponse,
} from './payment-success.component';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { API_ROUTES } from '../../../../core/constants/api-routes';

@Component({ standalone: true, template: '' })
class DummyComponent {}

const APPEAL_ID = 'test-appeal-xyz';
const APPEAL_URL = `${environment.apiUrl}${API_ROUTES.APPEALS.BY_ID(APPEAL_ID)}`;
const DOCUMENT_URL = `${environment.apiUrl}${API_ROUTES.APPEALS.DOWNLOAD(APPEAL_ID)}?format=json`;
const PDF_URL = `${environment.apiUrl}${API_ROUTES.APPEALS.DOWNLOAD(APPEAL_ID)}?format=pdf`;

function mockAppeal(overrides: Partial<AppealDetailResponse> = {}): AppealDetailResponse {
  return {
    id: APPEAL_ID,
    status: 'paid',
    appealType: 'Defesa de Autuação',
    formData: {
      infractionCode: '74550',
      infractionDescription: 'Estacionar em local proibido',
      vehiclePlate: 'ABC-1234',
      issuingAuthority: 'DETRAN-SP',
    },
    generatedContent: 'Conteúdo do recurso gerado...',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function mockDocument(overrides: Partial<DocumentResponse> = {}): DocumentResponse {
  return {
    documentId: 'doc-uuid-123',
    appealId: APPEAL_ID,
    content: 'Texto completo do recurso de multa...',
    version: 1,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('PaymentSuccessComponent', () => {
  let component: PaymentSuccessComponent;
  let fixture: ComponentFixture<PaymentSuccessComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let toastService: ToastService;

  function setup(
    params: Record<string, string> = { id: APPEAL_ID },
  ): void {
    TestBed.configureTestingModule({
      imports: [PaymentSuccessComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'payment/:id/success', component: DummyComponent },
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

    fixture = TestBed.createComponent(PaymentSuccessComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService);
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  function flushInitialRequests(
    appealData: AppealDetailResponse = mockAppeal(),
    documentData: DocumentResponse = mockDocument(),
  ): void {
    httpMock.expectOne(APPEAL_URL).flush(appealData);
    httpMock.expectOne(DOCUMENT_URL).flush(documentData);
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

  // ─── Data Loading ───

  describe('data loading', () => {
    it('should fetch appeal details on init', () => {
      setup();
      fixture.detectChanges();

      const req = httpMock.expectOne(APPEAL_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockAppeal());
      httpMock.expectOne(DOCUMENT_URL).flush(mockDocument());
    });

    it('should fetch document after appeal loads', () => {
      setup();
      fixture.detectChanges();

      httpMock.expectOne(APPEAL_URL).flush(mockAppeal());
      const docReq = httpMock.expectOne(DOCUMENT_URL);
      expect(docReq.request.method).toBe('GET');
      docReq.flush(mockDocument());
    });

    it('should set appeal and document data on success', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      expect(component.appeal()).toBeTruthy();
      expect(component.appeal()!.id).toBe(APPEAL_ID);
      expect(component.document()).toBeTruthy();
      expect(component.document()!.content).toContain('recurso de multa');
      expect(component.loading()).toBeFalse();
    });

    it('should show error when appeal fetch fails', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(APPEAL_URL).error(new ProgressEvent('error'), { status: 500 });

      expect(component.error()).toBeTruthy();
      expect(component.loading()).toBeFalse();
    });

    it('should still show page when document fetch fails', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(APPEAL_URL).flush(mockAppeal());
      httpMock.expectOne(DOCUMENT_URL).error(new ProgressEvent('error'), { status: 404 });

      expect(component.appeal()).toBeTruthy();
      expect(component.document()).toBeNull();
      expect(component.loading()).toBeFalse();
    });

    it('should reload data on retry', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(APPEAL_URL).error(new ProgressEvent('error'));

      component.loadData();
      flushInitialRequests();

      expect(component.appeal()).toBeTruthy();
      expect(component.loading()).toBeFalse();
    });
  });

  // ─── Computed Values ───

  describe('computed values', () => {
    it('should compute hasContent when document exists', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      expect(component.hasContent()).toBeTrue();
    });

    it('should compute hasContent from generatedContent as fallback', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(APPEAL_URL).flush(
        mockAppeal({ generatedContent: 'Some content' }),
      );
      httpMock.expectOne(DOCUMENT_URL).error(new ProgressEvent('error'));

      expect(component.hasContent()).toBeTrue();
    });

    it('should compute documentContent from document', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      expect(component.documentContent()).toContain('recurso de multa');
    });

    it('should compute documentContent from generatedContent fallback', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(APPEAL_URL).flush(
        mockAppeal({ generatedContent: 'Fallback content' }),
      );
      httpMock.expectOne(DOCUMENT_URL).error(new ProgressEvent('error'));

      expect(component.documentContent()).toBe('Fallback content');
    });
  });

  // ─── Document Toggle ───

  describe('document toggle', () => {
    it('should start with document expanded', () => {
      setup();
      expect(component.documentExpanded()).toBeTrue();
    });

    it('should toggle document expanded state', () => {
      setup();
      component.toggleDocument();
      expect(component.documentExpanded()).toBeFalse();
      component.toggleDocument();
      expect(component.documentExpanded()).toBeTrue();
    });
  });

  // ─── PDF Download ───

  describe('PDF download', () => {
    it('should download PDF on click', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      // Mock DOM APIs
      const mockUrl = 'blob:http://localhost/test';
      spyOn(URL, 'createObjectURL').and.returnValue(mockUrl);
      spyOn(URL, 'revokeObjectURL');
      const mockAnchor = { href: '', download: '', click: jasmine.createSpy('click') };
      spyOn(document, 'createElement').and.returnValue(mockAnchor as unknown as HTMLElement);

      component.downloadPdf();

      const req = httpMock.expectOne(PDF_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');

      req.flush(new Blob(['pdf-data'], { type: 'application/pdf' }));

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.download).toContain('recurso-');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
      expect(component.downloading()).toBeFalse();
    });

    it('should show toast on download success', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
      spyOn(URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.returnValue(
        { href: '', download: '', click: () => {} } as unknown as HTMLElement,
      );

      component.downloadPdf();
      httpMock.expectOne(PDF_URL).flush(new Blob(['data']));

      expect(toastService.toasts().some((t) => t.type === 'success')).toBeTrue();
    });

    it('should show error toast on download failure', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      component.downloadPdf();
      httpMock.expectOne(PDF_URL).error(new ProgressEvent('error'));

      expect(component.downloading()).toBeFalse();
      expect(toastService.toasts().some((t) => t.type === 'error')).toBeTrue();
    });

    it('should set downloading state during download', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      component.downloadPdf();
      expect(component.downloading()).toBeTrue();

      spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
      spyOn(URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.returnValue(
        { href: '', download: '', click: () => {} } as unknown as HTMLElement,
      );
      httpMock.expectOne(PDF_URL).flush(new Blob(['data']));

      expect(component.downloading()).toBeFalse();
    });

    it('should not download if already downloading', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      component.downloadPdf();
      component.downloadPdf(); // second call should be ignored

      // Only one PDF request should exist
      const requests = httpMock.match(PDF_URL);
      expect(requests.length).toBe(1);
      requests[0].flush(new Blob(['data']));
    });
  });

  // ─── Copy Text ───

  describe('copy text', () => {
    it('should copy document content to clipboard', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      spyOn(navigator.clipboard, 'writeText').and.resolveTo();
      component.copyText();
      tick(); // flush clipboard promise

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'Texto completo do recurso de multa...',
      );
      expect(component.copied()).toBeTrue();
    }));

    it('should reset copied after 3 seconds', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      spyOn(navigator.clipboard, 'writeText').and.resolveTo();
      component.copyText();
      tick(); // flush clipboard

      expect(component.copied()).toBeTrue();
      tick(3000);
      expect(component.copied()).toBeFalse();
    }));

    it('should show success toast on copy', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      spyOn(navigator.clipboard, 'writeText').and.resolveTo();
      component.copyText();
      tick();

      expect(toastService.toasts().some((t) => t.type === 'success')).toBeTrue();
    }));

    it('should show error toast on clipboard failure', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();

      spyOn(navigator.clipboard, 'writeText').and.rejectWith(new Error('Denied'));
      component.copyText();
      tick();

      expect(component.copied()).toBeFalse();
      expect(toastService.toasts().some((t) => t.type === 'error')).toBeTrue();
    }));

    it('should not copy when no content', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(APPEAL_URL).flush(mockAppeal({ generatedContent: null }));
      httpMock.expectOne(DOCUMENT_URL).error(new ProgressEvent('error'));

      spyOn(navigator.clipboard, 'writeText');
      component.copyText();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });

  // ─── WhatsApp Share ───

  describe('WhatsApp share', () => {
    it('should open WhatsApp share link', () => {
      setup();
      spyOn(window, 'open');
      component.shareWhatsApp();

      expect(window.open).toHaveBeenCalledWith(
        jasmine.stringContaining('https://wa.me/?text='),
        '_blank',
        'noopener',
      );
    });

    it('should include justifica.ai in share text', () => {
      setup();
      spyOn(window, 'open');
      component.shareWhatsApp();

      const url = (window.open as jasmine.Spy).calls.first().args[0] as string;
      expect(decodeURIComponent(url)).toContain('justifica.ai');
    });
  });

  // ─── Rating ───

  describe('rating', () => {
    it('should start with no rating selected', () => {
      setup();
      expect(component.selectedRating()).toBe(0);
      expect(component.hoveredRating()).toBe(0);
      expect(component.ratingSubmitted()).toBeFalse();
    });

    it('should select a rating', () => {
      setup();
      component.selectRating(4);
      expect(component.selectedRating()).toBe(4);
    });

    it('should update hover rating', () => {
      setup();
      component.hoveredRating.set(3);
      expect(component.hoveredRating()).toBe(3);
    });

    it('should update comment from input event', () => {
      setup();
      const event = { target: { value: 'Ótimo recurso!' } } as unknown as Event;
      component.onCommentInput(event);
      expect(component.ratingComment()).toBe('Ótimo recurso!');
    });

    it('should submit rating', () => {
      setup();
      component.selectRating(5);
      component.submitRating();

      expect(component.ratingSubmitted()).toBeTrue();
      expect(toastService.toasts().some((t) => t.type === 'success')).toBeTrue();
    });
  });

  // ─── Template Rendering ───

  describe('template rendering', () => {
    it('should show loading skeleton initially', () => {
      setup();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('app-skeleton-loader')).toBeTruthy();
      flushInitialRequests();
    });

    it('should show success header after loading', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Seu recurso está pronto');
    });

    it('should show appeal summary', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Defesa de Autuação');
      expect(el.textContent).toContain('74550');
      expect(el.textContent).toContain('ABC-1234');
      expect(el.textContent).toContain('DETRAN-SP');
    });

    it('should show document content when expanded', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('recurso de multa');
    });

    it('should hide document content when collapsed', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      component.toggleDocument();
      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector('#document-content');
      expect(content).toBeNull();
    });

    it('should show action buttons', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('button[aria-label="Baixar PDF"]')).toBeTruthy();
      expect(
        el.querySelector('button[aria-label="Copiar texto"]'),
      ).toBeTruthy();
      expect(
        el.querySelector('button[aria-label="Compartilhar via WhatsApp"]'),
      ).toBeTruthy();
    });

    it('should show protocol instructions', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      fixture.detectChanges();

      const instructions = fixture.nativeElement.querySelector(
        'ol[aria-label="Instruções para protocolar o recurso"]',
      ) as HTMLElement;
      expect(instructions).toBeTruthy();
      expect(instructions.querySelectorAll('li').length).toBe(4);
    });

    it('should show rating section', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Como você avalia');
      const stars = el.querySelectorAll('[role="radio"]');
      expect(stars.length).toBe(5);
    });

    it('should show thank you message after rating', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      component.selectRating(5);
      component.submitRating();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Obrigado pela sua avaliação');
    });

    it('should show error state with retry button', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(APPEAL_URL).error(new ProgressEvent('error'));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(
        el.querySelector('button[aria-label="Tentar novamente"]'),
      ).toBeTruthy();
    });

    it('should show textarea when rating is selected', () => {
      setup();
      fixture.detectChanges();
      flushInitialRequests();
      component.selectRating(4);
      fixture.detectChanges();

      const textarea = fixture.nativeElement.querySelector(
        'textarea[aria-label="Comentário sobre o documento"]',
      );
      expect(textarea).toBeTruthy();
    });
  });
});

import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { Component } from '@angular/core';

import { AppealPreviewComponent } from './appeal-preview.component';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { API_ROUTES } from '../../../../core/constants/api-routes';

@Component({ standalone: true, template: '' })
class DummyComponent {}

const APPEAL_ID = 'test-appeal-456';
const PREVIEW_URL = `${environment.apiUrl}${API_ROUTES.APPEALS.PREVIEW(APPEAL_ID)}`;

function mockPreviewResponse(overrides: Record<string, unknown> = {}): {
  data: Record<string, unknown>;
} {
  return {
    data: {
      preview: 'CABEÇALHO DO RECURSO\n\nQualificação do recorrente...\n\nDos fatos ocorridos...',
      totalLength: 5000,
      appealId: APPEAL_ID,
      documentId: 'doc-789',
      appealType: 'first_instance',
      infractionCode: '746-10',
      ...overrides,
    },
  };
}

describe('AppealPreviewComponent', () => {
  let component: AppealPreviewComponent;
  let fixture: ComponentFixture<AppealPreviewComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let toastService: ToastService;

  function setup(params: Record<string, string> = { id: APPEAL_ID }): void {
    TestBed.configureTestingModule({
      imports: [AppealPreviewComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'payment/:id', component: DummyComponent },
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

    fixture = TestBed.createComponent(AppealPreviewComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService);
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  afterEach(() => {
    httpMock?.verify();
  });

  describe('initialization', () => {
    it('should create the component', () => {
      setup();
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      setup();
      fixture.detectChanges();
      expect(component.loading()).toBeTrue();
      // Clean up pending request
      httpMock.expectOne(PREVIEW_URL).flush(mockPreviewResponse());
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

  describe('loading preview', () => {
    it('should call the preview API endpoint', () => {
      setup();
      fixture.detectChanges();
      const req = httpMock.expectOne(PREVIEW_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockPreviewResponse());
    });

    it('should set preview data on successful response', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(mockPreviewResponse());

      expect(component.preview()).toContain('CABEÇALHO DO RECURSO');
      expect(component.totalLength()).toBe(5000);
      expect(component.documentId()).toBe('doc-789');
      expect(component.infractionCode()).toBe('746-10');
      expect(component.appealType()).toBe('first_instance');
      expect(component.loading()).toBeFalse();
    });

    it('should set error on failed response', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(PREVIEW_URL)
        .error(new ProgressEvent('error'), { status: 500 });

      expect(component.error()).toBeTruthy();
      expect(component.loading()).toBeFalse();
    });

    it('should retry when loadPreview is called again', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(PREVIEW_URL)
        .error(new ProgressEvent('error'), { status: 500 });

      expect(component.error()).toBeTruthy();

      component.loadPreview();
      const req = httpMock.expectOne(PREVIEW_URL);
      req.flush(mockPreviewResponse());

      expect(component.error()).toBeNull();
      expect(component.loading()).toBeFalse();
      expect(component.preview()).toContain('CABEÇALHO');
    });
  });

  describe('computed values', () => {
    it('should split preview into paragraphs', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(mockPreviewResponse());

      expect(component.paragraphs().length).toBe(3);
      expect(component.paragraphs()[0]).toContain('CABEÇALHO DO RECURSO');
    });

    it('should filter empty lines in paragraphs', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(
        mockPreviewResponse({ preview: 'Line 1\n\n\n\nLine 2\n' }),
      );

      expect(component.paragraphs().length).toBe(2);
    });

    it('should map first_instance appeal type to label', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(
        mockPreviewResponse({ appealType: 'first_instance' }),
      );

      expect(component.appealTypeLabel()).toBe('Recurso de 1ª Instância');
    });

    it('should map second_instance appeal type to label', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(
        mockPreviewResponse({ appealType: 'second_instance' }),
      );

      expect(component.appealTypeLabel()).toBe('Recurso de 2ª Instância');
    });

    it('should map jari appeal type to label', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(
        mockPreviewResponse({ appealType: 'jari' }),
      );

      expect(component.appealTypeLabel()).toBe('Recurso JARI');
    });

    it('should return empty string for unknown appeal type', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(
        mockPreviewResponse({ appealType: 'unknown_type' }),
      );

      expect(component.appealTypeLabel()).toBe('');
    });
  });

  describe('navigation', () => {
    it('should navigate to paywall when CTA is clicked', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(mockPreviewResponse());

      component.navigateToPaywall();
      expect(router.navigate).toHaveBeenCalledWith(['/payment', APPEAL_ID]);
    });
  });

  describe('rendering', () => {
    it('should show skeleton loaders while loading', () => {
      setup();
      fixture.detectChanges();

      const skeletons = fixture.nativeElement.querySelectorAll('app-skeleton-loader');
      expect(skeletons.length).toBe(3);

      httpMock.expectOne(PREVIEW_URL).flush(mockPreviewResponse());
    });

    it('should show success badge after loading', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(mockPreviewResponse());
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('[role="status"]');
      expect(badge?.textContent).toContain('Seu recurso está pronto!');
    });

    it('should show watermark text', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(mockPreviewResponse());
      fixture.detectChanges();

      const watermark = fixture.nativeElement.textContent;
      expect(watermark).toContain('PREVIEW — NÃO PAGO');
    });

    it('should show infraction code badge', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(mockPreviewResponse());
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Infração: 746-10');
    });

    it('should show appeal type badge', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(mockPreviewResponse());
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Recurso de 1ª Instância');
    });

    it('should show CTA button', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(mockPreviewResponse());
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[aria-label="Pagar e acessar documento completo"]');
      expect(button).toBeTruthy();
      expect(button?.textContent).toContain('Pagar e acessar documento completo');
    });

    it('should have select-none on preview text', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(mockPreviewResponse());
      fixture.detectChanges();

      const previewDiv = fixture.nativeElement.querySelector('.preview-text');
      expect(previewDiv?.classList.contains('select-none')).toBeTrue();
    });

    it('should show error message with retry button on failure', () => {
      setup();
      fixture.detectChanges();
      httpMock
        .expectOne(PREVIEW_URL)
        .error(new ProgressEvent('error'), { status: 500 });
      fixture.detectChanges();

      const errorText = fixture.nativeElement.textContent;
      expect(errorText).toContain('Não foi possível carregar');

      const retryButton = fixture.nativeElement.querySelector(
        'button[aria-label="Tentar carregar pré-visualização novamente"]',
      );
      expect(retryButton).toBeTruthy();
    });

    it('should render paragraphs from preview text', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(PREVIEW_URL).flush(mockPreviewResponse());
      fixture.detectChanges();

      const paragraphs = fixture.nativeElement.querySelectorAll('.preview-text p');
      expect(paragraphs.length).toBe(3);
    });
  });
});

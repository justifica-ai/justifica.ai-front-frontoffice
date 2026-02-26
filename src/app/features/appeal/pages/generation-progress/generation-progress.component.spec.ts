import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { Component } from '@angular/core';

import { GenerationProgressComponent } from './generation-progress.component';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { API_ROUTES } from '../../../../core/constants/api-routes';

@Component({ standalone: true, template: '' })
class DummyComponent {}

const APPEAL_ID = 'test-appeal-123';
const POLL_URL = `${environment.apiUrl}${API_ROUTES.APPEALS.BY_ID(APPEAL_ID)}`;

function mockAppeal(status: string): { data: Record<string, unknown> } {
  return {
    data: {
      id: APPEAL_ID,
      userId: 'user-1',
      vehicleId: 'v-1',
      infractionCode: '746-10',
      infractionDate: '2024-01-01',
      autoNumber: 'AUTO123',
      organId: 'org-1',
      organName: 'DETRAN',
      status,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  };
}

describe('GenerationProgressComponent', () => {
  let component: GenerationProgressComponent;
  let fixture: ComponentFixture<GenerationProgressComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let toastService: ToastService;

  function setup(params: Record<string, string> = { id: APPEAL_ID }): void {
    TestBed.configureTestingModule({
      imports: [GenerationProgressComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'appeals/:id/preview', component: DummyComponent },
          { path: 'appeals/:id', component: DummyComponent },
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

    fixture = TestBed.createComponent(GenerationProgressComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService);
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  afterEach(() => {
    // Discard any remaining requests (cancelled by switchMap or still open)
    discardPendingRequests();
  });

  /** Flush non-cancelled requests, discard cancelled ones, then verify clean state */
  function discardPendingRequests(): void {
    const remaining = httpMock.match(() => true);
    for (const req of remaining) {
      if (!req.cancelled) {
        req.flush(mockAppeal('generating'));
      }
    }
    httpMock.verify();
  }

  /** Safely flush only non-cancelled poll requests */
  function flushPollRequests(): void {
    const reqs = httpMock.match(POLL_URL);
    for (const req of reqs) {
      if (!req.cancelled) {
        req.flush(mockAppeal('generating'));
      }
    }
  }

  /** Advance time in 3s chunks (matching poll interval), flushing requests each step */
  function advanceSeconds(seconds: number): void {
    for (let elapsed = 0; elapsed < seconds; elapsed += 3) {
      const step = Math.min(3, seconds - elapsed);
      tick(step * 1_000);
      flushPollRequests();
    }
  }

  describe('initialization', () => {
    it('should create the component', () => {
      setup();
      expect(component).toBeTruthy();
    });

    it('should start with the first message', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      expect(component.currentMessage()).toBe('Analisando sua infração...');
      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should start with 0 elapsed seconds', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      expect(component.elapsedSeconds()).toBe(0);
      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should redirect to home if no appeal id', fakeAsync(() => {
      setup({ id: '' });
      fixture.detectChanges();
      tick(100);
      expect(router.navigate).toHaveBeenCalledWith(['/']);
      expect(toastService.toasts().length).toBeGreaterThan(0);
    }));

    it('should redirect to home if id param is missing', fakeAsync(() => {
      setup({});
      fixture.detectChanges();
      tick(100);
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    }));
  });

  describe('message rotation', () => {
    it('should rotate messages every 4 seconds', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      expect(component.currentMessage()).toBe('Analisando sua infração...');

      tick(4_000);
      flushPollRequests();
      expect(component.currentMessage()).toBe('Consultando legislação...');

      tick(4_000);
      flushPollRequests();
      expect(component.currentMessage()).toBe('Redigindo seu recurso...');

      tick(4_000);
      flushPollRequests();
      expect(component.currentMessage()).toBe('Verificando fundamentação...');

      tick(4_000);
      flushPollRequests();
      expect(component.currentMessage()).toBe('Finalizando documento...');

      // Wraps around
      tick(4_000);
      flushPollRequests();
      expect(component.currentMessage()).toBe('Analisando sua infração...');

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));
  });

  describe('elapsed timer', () => {
    it('should increment elapsed seconds', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      tick(1_000);
      expect(component.elapsedSeconds()).toBe(1);

      tick(4_000);
      flushPollRequests();
      expect(component.elapsedSeconds()).toBe(5);

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should display seconds format under 60s', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      advanceSeconds(10);
      expect(component.elapsedDisplay()).toBe('10s');

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should display minutes format over 60s', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      component.elapsedSeconds.set(65);
      expect(component.elapsedDisplay()).toBe('1m 5s');

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));
  });

  describe('slow and timeout messages', () => {
    it('should not show slow message before 45s', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      advanceSeconds(44);
      expect(component.showSlowMessage()).toBeFalse();

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should show slow message at 45s', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      advanceSeconds(45);
      expect(component.showSlowMessage()).toBeTrue();
      expect(component.isTimedOut()).toBeFalse();

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should show timeout at 60s', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      advanceSeconds(60);
      expect(component.isTimedOut()).toBeTrue();
      expect(component.showSlowMessage()).toBeFalse();

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should navigate to home on timeout', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      advanceSeconds(60);
      // Timeout watcher fires at the next 1s tick after elapsedSeconds >= 60
      tick(1_000);
      flushPollRequests();

      expect(router.navigate).toHaveBeenCalledWith(['/']);

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));
  });

  describe('polling', () => {
    it('should poll the appeal endpoint every 3s', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      tick(3_000);
      const reqs = httpMock.match(POLL_URL);
      expect(reqs.length).toBeGreaterThan(0);
      const activeReq = reqs.find((r) => !r.cancelled);
      expect(activeReq).toBeTruthy();
      expect(activeReq!.request.method).toBe('GET');
      activeReq!.flush(mockAppeal('generating'));
      // Discard any cancelled ones
      flushPollRequests();

      tick(3_000);
      flushPollRequests();

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should navigate to preview when status is generated', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      tick(3_000);
      const reqs = httpMock.match(POLL_URL);
      for (const req of reqs) {
        if (!req.cancelled) {
          req.flush(mockAppeal('generated'));
        }
      }

      tick(100);
      expect(router.navigate).toHaveBeenCalledWith(['/appeals', APPEAL_ID, 'preview']);

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should navigate to appeal detail when status is failed', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      tick(3_000);
      const reqs = httpMock.match(POLL_URL);
      for (const req of reqs) {
        if (!req.cancelled) {
          req.flush(mockAppeal('failed'));
        }
      }

      tick(100);
      expect(router.navigate).toHaveBeenCalledWith(['/appeals', APPEAL_ID]);

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should show error toast when generation fails', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      spyOn(toastService, 'error');

      tick(3_000);
      const reqs = httpMock.match(POLL_URL);
      for (const req of reqs) {
        if (!req.cancelled) {
          req.flush(mockAppeal('failed'));
        }
      }

      tick(100);
      expect(toastService.error).toHaveBeenCalledWith(
        'Falha na geração',
        'Não foi possível gerar seu recurso. Tente novamente.',
      );

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should continue polling while status is generating', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      // First poll
      tick(3_000);
      flushPollRequests();

      // Second poll
      tick(3_000);
      flushPollRequests();

      // Third poll — now generated
      tick(3_000);
      const reqs = httpMock.match(POLL_URL);
      for (const req of reqs) {
        if (!req.cancelled) {
          req.flush(mockAppeal('generated'));
        }
      }

      tick(100);
      expect(router.navigate).toHaveBeenCalledWith(['/appeals', APPEAL_ID, 'preview']);

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should handle HTTP errors gracefully during polling', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      tick(3_000);
      const reqs = httpMock.match(POLL_URL);
      for (const req of reqs) {
        if (!req.cancelled) {
          req.error(new ProgressEvent('error'), { status: 500, statusText: 'Internal Server Error' });
        }
      }

      // Should not crash — continues polling
      tick(3_000);
      const reqs2 = httpMock.match(POLL_URL);
      const active = reqs2.filter((r) => !r.cancelled);
      expect(active.length).toBeGreaterThan(0);
      for (const req of active) {
        req.flush(mockAppeal('generating'));
      }

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));
  });

  describe('progress bar', () => {
    it('should start at 0%', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      expect(component.progressWidth()).toBe('0%');
      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should increase with elapsed time', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      advanceSeconds(30);
      expect(component.progressWidth()).toBe('50%');

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should cap at 95%', fakeAsync(() => {
      setup();
      fixture.detectChanges();

      component.elapsedSeconds.set(120);
      expect(component.progressWidth()).toBe('95%');

      component.ngOnDestroy();
      discardPeriodicTasks();
    }));
  });

  describe('rendering', () => {
    it('should display the spinner', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('[role="status"]');
      expect(spinner).toBeTruthy();
      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should display the current message', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      const messageEl = fixture.nativeElement.querySelector('[aria-live="polite"]');
      expect(messageEl?.textContent).toContain('Analisando sua infração...');
      component.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should display estimated time text initially', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Isso geralmente leva 15–30 segundos');
      component.ngOnDestroy();
      discardPeriodicTasks();
    }));
  });
});

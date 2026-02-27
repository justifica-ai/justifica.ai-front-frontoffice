import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppealListComponent } from './appeal-list.component';
import { AppealListService } from '../../services/appeal-list.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  AppealListItem,
  AppealListResponse,
  APPEAL_STATUS_TABS,
  APPEAL_LIST_STATUS_CONFIG,
} from '../../../../core/models/appeal.model';

describe('AppealListComponent', () => {
  let component: AppealListComponent;
  let fixture: ComponentFixture<AppealListComponent>;
  let serviceSpy: jasmine.SpyObj<AppealListService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  const createAppeal = (overrides: Partial<AppealListItem> = {}): AppealListItem => ({
    id: 'appeal-1',
    status: 'draft',
    appealType: 'prior_defense',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    vehiclePlate: 'ABC1D23',
    infractionCode: '74550',
    aitCode: 'AB12345678',
    infractionDate: '2026-01-15T00:00:00.000Z',
    infractionNature: 'Gravíssima',
    organName: 'DETRAN-SP',
    amountPaid: null,
    ...overrides,
  });

  const emptyResponse: AppealListResponse = { data: [], total: 0, page: 1, limit: 10 };

  const createResponse = (data: AppealListItem[], total?: number): AppealListResponse => ({
    data,
    total: total ?? data.length,
    page: 1,
    limit: 10,
  });

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('AppealListService', ['loadAppeals', 'deleteAppeal', 'downloadDocument']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    serviceSpy.loadAppeals.and.resolveTo(emptyResponse);

    await TestBed.configureTestingModule({
      imports: [AppealListComponent],
      providers: [
        { provide: AppealListService, useValue: serviceSpy },
        { provide: ToastService, useValue: toastSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppealListComponent);
    component = fixture.componentInstance;
  });

  describe('creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have empty initial state', () => {
      expect(component.appeals()).toEqual([]);
      expect(component.loading()).toBeFalse();
      expect(component.total()).toBe(0);
      expect(component.activeFilter()).toBeNull();
      expect(component.searchQuery()).toBe('');
      expect(component.deleting()).toBeNull();
      expect(component.downloading()).toBeNull();
    });

    it('should have status tabs', () => {
      expect(component.statusTabs).toEqual(APPEAL_STATUS_TABS);
    });
  });

  describe('loading', () => {
    it('should load appeals on init', fakeAsync(() => {
      const appeals = [createAppeal()];
      serviceSpy.loadAppeals.and.resolveTo(createResponse(appeals));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(serviceSpy.loadAppeals).toHaveBeenCalledWith({
        status: undefined,
        q: undefined,
        page: 1,
        limit: 10,
      });
      expect(component.appeals()).toEqual(appeals);
      expect(component.total()).toBe(1);
    }));

    it('should show loading skeletons while loading', fakeAsync(() => {
      serviceSpy.loadAppeals.and.returnValue(new Promise(() => { /* never resolves */ }));

      fixture.detectChanges();

      const skeletons = fixture.nativeElement.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);
    }));

    it('should show error toast on load failure', fakeAsync(() => {
      serviceSpy.loadAppeals.and.rejectWith(new Error('Network error'));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao carregar recursos', 'Tente novamente em instantes');
      expect(component.loading()).toBeFalse();
    }));
  });

  describe('empty state', () => {
    it('should show empty state when no appeals and no filters', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('h2');
      expect(emptyState.textContent).toContain('Você ainda não tem recursos');

      const ctaLink = fixture.nativeElement.querySelector('a[href="/appeals/new"]');
      expect(ctaLink).toBeTruthy();
    }));

    it('should show filtered empty state when filters active', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      serviceSpy.loadAppeals.and.resolveTo(emptyResponse);
      component.filterByStatus('draft');
      tick();
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('h2');
      expect(emptyState.textContent).toContain('Nenhum recurso encontrado');

      const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
      const clearBtn = buttons.find((b) => b.textContent?.includes('Limpar filtros'));
      expect(clearBtn).toBeTruthy();
    }));

    it('should clear filters when clicking clear button', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      serviceSpy.loadAppeals.calls.reset();
      serviceSpy.loadAppeals.and.resolveTo(emptyResponse);
      component.filterByStatus('draft');
      tick();
      fixture.detectChanges();

      serviceSpy.loadAppeals.calls.reset();
      const appeals = [createAppeal()];
      serviceSpy.loadAppeals.and.resolveTo(createResponse(appeals));

      component.clearFilters();
      tick();
      fixture.detectChanges();

      expect(component.activeFilter()).toBeNull();
      expect(component.searchQuery()).toBe('');
      expect(serviceSpy.loadAppeals).toHaveBeenCalledWith(jasmine.objectContaining({ status: undefined, q: undefined }));
    }));
  });

  describe('appeal cards', () => {
    it('should render appeal cards', fakeAsync(() => {
      const appeals = [createAppeal(), createAppeal({ id: 'appeal-2', status: 'paid', vehiclePlate: 'XYZ9Z99' })];
      serviceSpy.loadAppeals.and.resolveTo(createResponse(appeals, 2));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('[role="listitem"]');
      expect(cards.length).toBe(2);
    }));

    it('should display vehicle plate', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ vehiclePlate: 'DEF2E45' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('DEF2E45');
    }));

    it('should display dash for missing plate', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ vehiclePlate: null })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('[role="listitem"]');
      const plateValue = card.querySelectorAll('.font-semibold')[0];
      expect(plateValue.textContent.trim()).toBe('–');
    }));

    it('should display AIT code', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ aitCode: 'CD98765432' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('CD98765432');
    }));

    it('should display appeal type label', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ appealType: 'first_instance' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('1ª Instância');
    }));

    it('should display organ name', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ organName: 'DETRAN-MG' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('DETRAN-MG');
    }));

    it('should display amount paid', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ status: 'paid', amountPaid: '49.90' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('R$ 49.90');
    }));

    it('should show result count', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal()], 15));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Mostrando 1 de 15 recursos');
    }));

    it('should use singular for single result', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal()], 1));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('1 de 1 recurso');
    }));
  });

  describe('status badges', () => {
    it('should display correct status badge for draft', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ status: 'draft' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Rascunho');
    }));

    it('should display correct status badge for paid', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ status: 'paid' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Pago');
    }));

    it('should display expiration badge for drafts expiring within 7 days', fakeAsync(() => {
      const fiveDaysAgo = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString();
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ status: 'draft', createdAt: fiveDaysAgo })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('[data-testid="expiration-badge"]');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain('Expira em');
    }));

    it('should NOT show expiration badge for drafts not expiring soon', fakeAsync(() => {
      const recentDate = new Date().toISOString();
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ status: 'draft', createdAt: recentDate })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('[data-testid="expiration-badge"]');
      expect(badge).toBeNull();
    }));
  });

  describe('actions per status', () => {
    it('should show Continuar and Excluir for draft', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ status: 'draft' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('[role="listitem"]');
      expect(card.textContent).toContain('Continuar');
      expect(card.textContent).toContain('Excluir');
    }));

    it('should show Ver Preview for generated', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ status: 'generated' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Ver Preview');
    }));

    it('should show Pagar com PIX for awaiting_payment', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ status: 'awaiting_payment' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Pagar com PIX');
    }));

    it('should show Baixar PDF for paid', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ status: 'paid' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Baixar PDF');
    }));

    it('should show Baixar Novamente for downloaded', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ status: 'downloaded' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Baixar Novamente');
    }));

    it('should show Criar Novo for expired', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ status: 'expired' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Criar Novo');
    }));

    it('should show Tentar Novamente for generation_failed', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal({ status: 'generation_failed' })]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Tentar Novamente');
    }));
  });

  describe('filtering', () => {
    it('should filter by status when tab clicked', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      serviceSpy.loadAppeals.calls.reset();
      serviceSpy.loadAppeals.and.resolveTo(emptyResponse);

      component.filterByStatus('paid');
      tick();

      expect(component.activeFilter()).toBe('paid');
      expect(serviceSpy.loadAppeals).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'paid' }));
    }));

    it('should show all when Todos tab clicked', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterByStatus('draft');
      tick();

      serviceSpy.loadAppeals.calls.reset();
      serviceSpy.loadAppeals.and.resolveTo(emptyResponse);

      component.filterByStatus(null);
      tick();

      expect(component.activeFilter()).toBeNull();
      expect(serviceSpy.loadAppeals).toHaveBeenCalledWith(jasmine.objectContaining({ status: undefined }));
    }));

    it('should render all status tabs', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(APPEAL_STATUS_TABS.length);
    }));

    it('should set aria-selected on active tab', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterByStatus('draft');
      tick();
      fixture.detectChanges();

      const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
      const draftTab = Array.from(tabs).find((t) => (t as HTMLElement).textContent?.includes('Rascunhos')) as HTMLElement;
      expect(draftTab?.getAttribute('aria-selected')).toBe('true');
    }));
  });

  describe('search', () => {
    it('should debounce search input', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      serviceSpy.loadAppeals.calls.reset();
      serviceSpy.loadAppeals.and.resolveTo(emptyResponse);

      const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
      input.value = 'ABC';
      input.dispatchEvent(new Event('input'));

      expect(serviceSpy.loadAppeals).not.toHaveBeenCalled();

      tick(400);
      tick();

      expect(serviceSpy.loadAppeals).toHaveBeenCalledWith(jasmine.objectContaining({ q: 'ABC' }));
    }));

    it('should reset search from clearFilters', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.searchQuery.set('test');
      serviceSpy.loadAppeals.calls.reset();
      serviceSpy.loadAppeals.and.resolveTo(emptyResponse);

      component.clearFilters();
      tick();

      expect(component.searchQuery()).toBe('');
      expect(serviceSpy.loadAppeals).toHaveBeenCalledWith(jasmine.objectContaining({ q: undefined }));
    }));
  });

  describe('pagination', () => {
    it('should show load more button when hasMore', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal()], 15));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.hasMore()).toBeTrue();
      const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
      const loadMoreBtn = buttons.find((b) => b.textContent?.includes('Carregar mais'));
      expect(loadMoreBtn).toBeTruthy();
    }));

    it('should NOT show load more button when all loaded', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal()], 1));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.hasMore()).toBeFalse();
      const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
      const loadMoreBtn = buttons.find((b) => b.textContent?.includes('Carregar mais'));
      expect(loadMoreBtn).toBeFalsy();
    }));

    it('should load next page and append results', fakeAsync(() => {
      const firstPageAppeals = [createAppeal({ id: 'appeal-1' })];
      serviceSpy.loadAppeals.and.resolveTo(createResponse(firstPageAppeals, 2));

      fixture.detectChanges();
      tick();

      const secondPageAppeals = [createAppeal({ id: 'appeal-2' })];
      serviceSpy.loadAppeals.and.resolveTo({ data: secondPageAppeals, total: 2, page: 2, limit: 10 });

      component.loadMore();
      tick();

      expect(component.currentPage()).toBe(2);
      expect(component.appeals().length).toBe(2);
      expect(component.appeals()[0].id).toBe('appeal-1');
      expect(component.appeals()[1].id).toBe('appeal-2');
    }));
  });

  describe('delete', () => {
    it('should confirm and delete appeal', fakeAsync(() => {
      const appeal = createAppeal({ id: 'del-1', status: 'draft' });
      serviceSpy.loadAppeals.and.resolveTo(createResponse([appeal]));
      serviceSpy.deleteAppeal.and.resolveTo();
      spyOn(window, 'confirm').and.returnValue(true);

      fixture.detectChanges();
      tick();

      component.confirmDelete(appeal);
      tick();

      expect(window.confirm).toHaveBeenCalled();
      expect(serviceSpy.deleteAppeal).toHaveBeenCalledWith('del-1');
      expect(component.appeals().length).toBe(0);
      expect(component.total()).toBe(0);
      expect(toastSpy.success).toHaveBeenCalledWith('Rascunho excluído com sucesso');
    }));

    it('should not delete when user cancels confirmation', fakeAsync(() => {
      const appeal = createAppeal({ id: 'del-2', status: 'draft' });
      spyOn(window, 'confirm').and.returnValue(false);

      fixture.detectChanges();
      tick();

      component.confirmDelete(appeal);
      tick();

      expect(serviceSpy.deleteAppeal).not.toHaveBeenCalled();
    }));

    it('should show error toast on delete failure', fakeAsync(() => {
      const appeal = createAppeal({ id: 'del-3', status: 'draft' });
      serviceSpy.loadAppeals.and.resolveTo(createResponse([appeal]));
      serviceSpy.deleteAppeal.and.rejectWith(new Error('Delete failed'));
      spyOn(window, 'confirm').and.returnValue(true);

      fixture.detectChanges();
      tick();

      component.confirmDelete(appeal);
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao excluir rascunho', 'Tente novamente');
      expect(component.deleting()).toBeNull();
      expect(component.appeals().length).toBe(1);
    }));
  });

  describe('download', () => {
    it('should download document and trigger file save', fakeAsync(() => {
      const appeal = createAppeal({ id: 'dl-1', status: 'paid' });
      serviceSpy.loadAppeals.and.resolveTo(createResponse([appeal]));
      const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });
      serviceSpy.downloadDocument.and.resolveTo(mockBlob);
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(URL, 'revokeObjectURL');
      const mockAnchor = { href: '', download: '', click: jasmine.createSpy('click') } as unknown as HTMLAnchorElement;
      const originalCreateElement = document.createElement.bind(document);
      spyOn(document, 'createElement').and.callFake((tag: string) =>
        tag === 'a' ? mockAnchor : originalCreateElement(tag),
      );

      fixture.detectChanges();
      tick();

      component.onDownloadDocument('dl-1');
      tick();

      expect(serviceSpy.downloadDocument).toHaveBeenCalledWith('dl-1');
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockAnchor.href).toBe('blob:url');
      expect(mockAnchor.download).toBe('recurso-dl-1.pdf');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
      expect(toastSpy.success).toHaveBeenCalledWith('Download iniciado');
      expect(component.downloading()).toBeNull();
    }));

    it('should show error toast on download failure', fakeAsync(() => {
      serviceSpy.downloadDocument.and.rejectWith(new Error('Download failed'));

      fixture.detectChanges();
      tick();

      component.onDownloadDocument('dl-2');
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao baixar documento', 'Tente novamente');
      expect(component.downloading()).toBeNull();
    }));
  });

  describe('helper methods', () => {
    it('should return correct status config', () => {
      expect(component.getStatusConfig('draft')).toEqual(APPEAL_LIST_STATUS_CONFIG['draft']);
      expect(component.getStatusConfig('paid')).toEqual(APPEAL_LIST_STATUS_CONFIG['paid']);
      expect(component.getStatusConfig('generation_failed')).toEqual(APPEAL_LIST_STATUS_CONFIG['generation_failed']);
    });

    it('should return correct status badge classes', () => {
      const classes = component.getStatusBadgeClasses('draft');
      expect(classes).toContain('bg-gray-100');
      expect(classes).toContain('text-gray-700');
    });

    it('should return correct tab classes for active tab', () => {
      component.activeFilter.set('draft');
      const classes = component.getTabClasses('draft');
      expect(classes).toContain('bg-brand-600');
      expect(classes).toContain('text-white');
    });

    it('should return correct tab classes for inactive tab', () => {
      component.activeFilter.set(null);
      const classes = component.getTabClasses('draft');
      expect(classes).toContain('bg-gray-100');
      expect(classes).toContain('text-gray-600');
    });

    it('should return appeal type labels', () => {
      expect(component.getAppealTypeLabel('prior_defense')).toBe('Defesa Prévia');
      expect(component.getAppealTypeLabel('first_instance')).toBe('1ª Instância');
      expect(component.getAppealTypeLabel('second_instance')).toBe('2ª Instância');
    });

    it('should return dash for null appeal type', () => {
      expect(component.getAppealTypeLabel(null)).toBe('–');
    });

    it('should return unknown type as-is', () => {
      expect(component.getAppealTypeLabel('unknown_type')).toBe('unknown_type');
    });

    it('should format dates in pt-BR format', () => {
      const formatted = component.formatDate('2026-03-15T10:00:00.000Z');
      expect(formatted).toMatch(/15\/03\/2026/);
    });

    it('should return dash for invalid date', () => {
      expect(component.formatDate('invalid-date')).toBe('–');
    });

    it('should compute days until expiration for draft', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const appeal = createAppeal({ createdAt: tenDaysAgo });
      const days = component.getDaysUntilExpiration(appeal);
      expect(days).toBe(20);
    });

    it('should return 0 for expired drafts', () => {
      const longAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
      const appeal = createAppeal({ createdAt: longAgo });
      const days = component.getDaysUntilExpiration(appeal);
      expect(days).toBe(0);
    });

    it('should compute hasMore correctly', () => {
      component.appeals.set([createAppeal()]);
      component.total.set(15);
      expect(component.hasMore()).toBeTrue();

      component.total.set(1);
      expect(component.hasMore()).toBeFalse();
    });
  });

  describe('accessibility', () => {
    it('should have tablist role on filter bar', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
      expect(tablist).toBeTruthy();
      expect(tablist.getAttribute('aria-label')).toBe('Filtrar por status');
    }));

    it('should have search input with aria-label', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input[type="search"]');
      expect(input.getAttribute('aria-label')).toBeTruthy();
    }));

    it('should have list role on appeal cards container', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal()]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('[role="list"]');
      expect(list).toBeTruthy();
      expect(list.getAttribute('aria-label')).toBe('Lista de recursos');
    }));

    it('should have aria-live on result count', fakeAsync(() => {
      serviceSpy.loadAppeals.and.resolveTo(createResponse([createAppeal()]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
    }));
  });
});

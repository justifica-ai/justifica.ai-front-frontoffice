import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NotificationCenterComponent } from './notification-center.component';
import { NotificationService } from '../../../../core/services/notification.service';
import type { AppNotification } from '../../../../core/models/notification.model';

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-001',
    type: 'payment',
    title: 'Pagamento confirmado!',
    body: 'Seu pagamento foi recebido.',
    data: { transactionId: 'tx-001' },
    isRead: false,
    readAt: null,
    createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'n-002',
    type: 'info',
    title: 'Bem-vindo!',
    body: 'Seja bem-vindo ao Justifica.AI.',
    data: null,
    isRead: true,
    readAt: '2025-01-15T11:00:00.000Z',
    createdAt: '2025-01-14T10:00:00.000Z',
  },
  {
    id: 'n-003',
    type: 'warning',
    title: 'Rascunho expirando',
    body: 'Seu rascunho vai expirar em breve.',
    data: null,
    isRead: false,
    readAt: null,
    createdAt: '2025-01-13T10:00:00.000Z',
  },
];

describe('NotificationCenterComponent', () => {
  let component: NotificationCenterComponent;
  let fixture: ComponentFixture<NotificationCenterComponent>;
  let mockNotificationService: jasmine.SpyObj<NotificationService> & {
    notifications: ReturnType<typeof signal>;
    unreadCount: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>;
    total: ReturnType<typeof signal>;
    currentPage: ReturnType<typeof signal>;
    hasMore: ReturnType<typeof signal>;
  };

  beforeEach(async () => {
    mockNotificationService = {
      notifications: signal(MOCK_NOTIFICATIONS),
      unreadCount: signal(2),
      loading: signal(false),
      total: signal(3),
      currentPage: signal(1),
      hasMore: signal(false),
      loadNotifications: jasmine.createSpy('loadNotifications').and.returnValue(Promise.resolve()),
      loadMore: jasmine.createSpy('loadMore').and.returnValue(Promise.resolve()),
      fetchUnreadCount: jasmine.createSpy('fetchUnreadCount').and.returnValue(Promise.resolve()),
      markAsRead: jasmine.createSpy('markAsRead').and.returnValue(Promise.resolve()),
      markAllAsRead: jasmine.createSpy('markAllAsRead').and.returnValue(Promise.resolve()),
      subscribeRealtime: jasmine.createSpy('subscribeRealtime'),
      unsubscribeRealtime: jasmine.createSpy('unsubscribeRealtime'),
      resetState: jasmine.createSpy('resetState'),
      getRelativeTime: jasmine.createSpy('getRelativeTime').and.returnValue('5min atrás'),
      ngOnDestroy: jasmine.createSpy('ngOnDestroy'),
    } as unknown as typeof mockNotificationService;

    await TestBed.configureTestingModule({
      imports: [NotificationCenterComponent],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // =========================================================================
  // Creation & Initialization
  // =========================================================================
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load notifications on init', () => {
    expect(mockNotificationService.loadNotifications).toHaveBeenCalledWith(1, false);
  });

  it('should fetch unread count on init', () => {
    expect(mockNotificationService.fetchUnreadCount).toHaveBeenCalled();
  });

  // =========================================================================
  // Rendering
  // =========================================================================
  describe('Rendering', () => {
    it('should render page title', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Notificações');
    });

    it('should render subtitle', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Acompanhe todas as suas notificações');
    });

    it('should render notification items', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const items = compiled.querySelectorAll('[role="listitem"]');
      expect(items.length).toBe(3);
    });

    it('should show notification titles', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Pagamento confirmado!');
      expect(compiled.textContent).toContain('Bem-vindo!');
      expect(compiled.textContent).toContain('Rascunho expirando');
    });

    it('should show notification bodies', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Seu pagamento foi recebido.');
    });

    it('should show result count', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Mostrando 3 de 3 notificações');
    });

    it('should show singular "notificação" for 1 item', () => {
      (mockNotificationService.total as ReturnType<typeof signal<number>>).set(1);
      (mockNotificationService.notifications as ReturnType<typeof signal<AppNotification[]>>).set([MOCK_NOTIFICATIONS[0]]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('1 notificação');
    });
  });

  // =========================================================================
  // Mark All As Read button
  // =========================================================================
  describe('Mark All As Read', () => {
    it('should show button when unread > 0', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Marcar todas como lidas');
    });

    it('should not show button when unread is 0', () => {
      (mockNotificationService.unreadCount as ReturnType<typeof signal<number>>).set(0);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const markAllButton = compiled.querySelector('[aria-label="Marcar todas as notificações como lidas"]');
      expect(markAllButton).toBeFalsy();
    });

    it('should call markAllAsRead on click', async () => {
      await component.onMarkAllRead();
      expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Filter Tabs
  // =========================================================================
  describe('Filter Tabs', () => {
    it('should start with "Todas" selected', () => {
      expect(component.unreadOnly()).toBeFalse();
    });

    it('should switch to unread filter', () => {
      component.setFilter(true);
      expect(component.unreadOnly()).toBeTrue();
      expect(mockNotificationService.loadNotifications).toHaveBeenCalledWith(1, true);
    });

    it('should switch back to all filter', () => {
      component.setFilter(true);
      component.setFilter(false);
      expect(component.unreadOnly()).toBeFalse();
      expect(mockNotificationService.loadNotifications).toHaveBeenCalledWith(1, false);
    });

    it('should render filter tabs', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tabs = compiled.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(2);
    });

    it('should return active tab classes', () => {
      const classes = component.getTabClasses(false);
      expect(classes).toContain('bg-brand-600');
    });

    it('should return inactive tab classes', () => {
      const classes = component.getTabClasses(true);
      expect(classes).toContain('bg-gray-100');
    });

    it('should show unread count badge on tab', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const badge = compiled.querySelector('[role="tablist"] .bg-red-500');
      expect(badge?.textContent?.trim()).toBe('2');
    });
  });

  // =========================================================================
  // Empty State
  // =========================================================================
  describe('Empty State', () => {
    it('should show empty state when no notifications', () => {
      (mockNotificationService.notifications as ReturnType<typeof signal<AppNotification[]>>).set([]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Nenhuma notificação');
    });

    it('should show unread empty state when filtering', () => {
      component.setFilter(true);
      (mockNotificationService.notifications as ReturnType<typeof signal<AppNotification[]>>).set([]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Nenhuma notificação não lida');
    });
  });

  // =========================================================================
  // Loading
  // =========================================================================
  describe('Loading', () => {
    it('should show skeletons when loading with no data', () => {
      (mockNotificationService.loading as ReturnType<typeof signal<boolean>>).set(true);
      (mockNotificationService.notifications as ReturnType<typeof signal<AppNotification[]>>).set([]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const skeletons = compiled.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(5);
    });

    it('should not show skeletons when loading with existing data', () => {
      (mockNotificationService.loading as ReturnType<typeof signal<boolean>>).set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const skeletons = compiled.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(0);
    });
  });

  // =========================================================================
  // Load More
  // =========================================================================
  describe('Load More', () => {
    it('should show load more button when hasMore', () => {
      (mockNotificationService.hasMore as ReturnType<typeof signal<boolean>>).set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Carregar mais');
    });

    it('should not show load more button when no more', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button[disabled]');
      // hasMore is false, so button should not be visible
      expect(compiled.textContent).not.toContain('Carregar mais');
    });

    it('should call loadMore on click', () => {
      component.onLoadMore();
      expect(mockNotificationService.loadMore).toHaveBeenCalledWith(false);
    });

    it('should pass unread filter to loadMore', () => {
      component.setFilter(true);
      component.onLoadMore();
      expect(mockNotificationService.loadMore).toHaveBeenCalledWith(true);
    });
  });

  // =========================================================================
  // Actions
  // =========================================================================
  describe('Actions', () => {
    it('should call markAsRead for unread notification', async () => {
      await component.onNotificationClick('n-001', false);
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('n-001');
    });

    it('should not call markAsRead for read notification', async () => {
      await component.onNotificationClick('n-002', true);
      expect(mockNotificationService.markAsRead).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // getTypeConfig
  // =========================================================================
  describe('getTypeConfig', () => {
    it('should return config for known types', () => {
      const config = component.getTypeConfig('payment');
      expect(config.label).toBe('Pagamento');
    });

    it('should return info config for unknown type', () => {
      const config = component.getTypeConfig('unknown' as never);
      expect(config.label).toBe('Informação');
    });
  });

  // =========================================================================
  // Accessibility
  // =========================================================================
  describe('Accessibility', () => {
    it('should have tablist role on filters', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[role="tablist"]')).toBeTruthy();
    });

    it('should have list role on notifications', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[role="list"]')).toBeTruthy();
    });

    it('should have listitem role on each notification', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const items = compiled.querySelectorAll('[role="listitem"]');
      expect(items.length).toBe(3);
    });

    it('should have aria-live on result count', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const polite = compiled.querySelector('[aria-live="polite"]');
      expect(polite).toBeTruthy();
    });
  });
});

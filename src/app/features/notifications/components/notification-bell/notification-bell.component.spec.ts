import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { NotificationBellComponent } from './notification-bell.component';
import { NotificationService } from '../../../../core/services/notification.service';
import type { AppNotification } from '../../../../core/models/notification.model';

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-001',
    type: 'payment',
    title: 'Pagamento confirmado!',
    body: 'Seu pagamento foi recebido.',
    data: null,
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
];

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
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
      unreadCount: signal(3),
      loading: signal(false),
      total: signal(2),
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
      imports: [NotificationBellComponent],
      providers: [
        provideRouter([]),
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // =========================================================================
  // Creation & Initialization
  // =========================================================================
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch unread count on init', () => {
    expect(mockNotificationService.fetchUnreadCount).toHaveBeenCalled();
  });

  it('should load notifications on init', () => {
    expect(mockNotificationService.loadNotifications).toHaveBeenCalledWith(1);
  });

  it('should subscribe to realtime on init', () => {
    expect(mockNotificationService.subscribeRealtime).toHaveBeenCalled();
  });

  it('should unsubscribe from realtime on destroy', () => {
    component.ngOnDestroy();
    expect(mockNotificationService.unsubscribeRealtime).toHaveBeenCalled();
  });

  // =========================================================================
  // Badge
  // =========================================================================
  describe('Badge', () => {
    it('should show badge when unread count > 0', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const badge = compiled.querySelector('.bg-red-500');
      expect(badge).toBeTruthy();
      expect(badge?.textContent?.trim()).toBe('3');
    });

    it('should not show badge when unread count is 0', () => {
      (mockNotificationService.unreadCount as ReturnType<typeof signal<number>>).set(0);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const badge = compiled.querySelector('.bg-red-500');
      expect(badge).toBeFalsy();
    });

    it('should show 99+ when unread count > 99', () => {
      (mockNotificationService.unreadCount as ReturnType<typeof signal<number>>).set(150);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const badge = compiled.querySelector('.bg-red-500');
      expect(badge?.textContent?.trim()).toBe('99+');
    });
  });

  // =========================================================================
  // Dropdown
  // =========================================================================
  describe('Dropdown', () => {
    it('should start with dropdown closed', () => {
      expect(component.dropdownOpen()).toBeFalse();
    });

    it('should toggle dropdown on click', () => {
      component.toggleDropdown();
      expect(component.dropdownOpen()).toBeTrue();

      component.toggleDropdown();
      expect(component.dropdownOpen()).toBeFalse();
    });

    it('should close dropdown', () => {
      component.toggleDropdown();
      component.closeDropdown();
      expect(component.dropdownOpen()).toBeFalse();
    });

    it('should render dropdown content when open', () => {
      component.toggleDropdown();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[role="menu"]')).toBeTruthy();
    });

    it('should not render dropdown content when closed', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[role="menu"]')).toBeFalsy();
    });

    it('should show notification items in dropdown', () => {
      component.toggleDropdown();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const items = compiled.querySelectorAll('[role="menuitem"]');
      expect(items.length).toBe(2);
    });

    it('should show empty state when no notifications', () => {
      (mockNotificationService.notifications as ReturnType<typeof signal<AppNotification[]>>).set([]);
      component.toggleDropdown();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Nenhuma notificação');
    });

    it('should show "Marcar todas como lidas" when unread > 0', () => {
      component.toggleDropdown();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Marcar todas como lidas');
    });

    it('should not show "Marcar todas como lidas" when unread is 0', () => {
      (mockNotificationService.unreadCount as ReturnType<typeof signal<number>>).set(0);
      component.toggleDropdown();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const markAllButton = compiled.querySelector('[aria-label="Marcar todas como lidas"]');
      expect(markAllButton).toBeFalsy();
    });

    it('should show "Ver todas as notificações" link', () => {
      component.toggleDropdown();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Ver todas as notificações');
    });
  });

  // =========================================================================
  // Actions
  // =========================================================================
  describe('Actions', () => {
    it('should call markAsRead when clicking unread notification', async () => {
      await component.onNotificationClick('n-001', false);
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('n-001');
    });

    it('should not call markAsRead when clicking read notification', async () => {
      await component.onNotificationClick('n-002', true);
      expect(mockNotificationService.markAsRead).not.toHaveBeenCalled();
    });

    it('should call markAllAsRead', async () => {
      await component.onMarkAllRead();
      expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Click Outside / Escape
  // =========================================================================
  describe('Click Outside & Escape', () => {
    it('should close dropdown on escape key', () => {
      component.toggleDropdown();
      expect(component.dropdownOpen()).toBeTrue();

      component.onEscapeKey();
      expect(component.dropdownOpen()).toBeFalse();
    });

    it('should close dropdown on click outside', () => {
      component.toggleDropdown();
      expect(component.dropdownOpen()).toBeTrue();

      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      component.onDocumentClick({ target: outsideElement } as unknown as MouseEvent);

      expect(component.dropdownOpen()).toBeFalse();
      document.body.removeChild(outsideElement);
    });

    it('should not close dropdown on click inside', () => {
      component.toggleDropdown();
      expect(component.dropdownOpen()).toBeTrue();

      const insideElement = fixture.nativeElement.querySelector('button');
      component.onDocumentClick({ target: insideElement } as unknown as MouseEvent);

      expect(component.dropdownOpen()).toBeTrue();
    });
  });

  // =========================================================================
  // getTypeConfig
  // =========================================================================
  describe('getTypeConfig', () => {
    it('should return config for payment type', () => {
      const config = component.getTypeConfig('payment');
      expect(config.iconClass).toContain('emerald');
    });

    it('should return config for success type', () => {
      const config = component.getTypeConfig('success');
      expect(config.iconClass).toContain('green');
    });

    it('should return config for warning type', () => {
      const config = component.getTypeConfig('warning');
      expect(config.iconClass).toContain('amber');
    });

    it('should return config for error type', () => {
      const config = component.getTypeConfig('error');
      expect(config.iconClass).toContain('red');
    });

    it('should return config for appeal type', () => {
      const config = component.getTypeConfig('appeal');
      expect(config.iconClass).toContain('brand');
    });

    it('should return config for system type', () => {
      const config = component.getTypeConfig('system');
      expect(config.iconClass).toContain('gray');
    });

    it('should return info config for unknown type', () => {
      const config = component.getTypeConfig('unknown' as never);
      expect(config.iconClass).toContain('blue');
    });
  });

  // =========================================================================
  // Accessibility
  // =========================================================================
  describe('Accessibility', () => {
    it('should have aria-label on bell button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button[aria-haspopup]');
      expect(button?.getAttribute('aria-label')).toContain('Notificações');
    });

    it('should include unread count in aria-label', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button[aria-haspopup]');
      expect(button?.getAttribute('aria-label')).toContain('3 não lidas');
    });

    it('should have aria-expanded attribute', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button[aria-haspopup]');
      expect(button?.getAttribute('aria-expanded')).toBe('false');

      component.toggleDropdown();
      fixture.detectChanges();

      expect(button?.getAttribute('aria-expanded')).toBe('true');
    });
  });
});

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import type { NotificationListResponse, UnreadCountResponse, MarkReadResponse, AppNotification } from '../models/notification.model';

const MOCK_NOTIFICATION: AppNotification = {
  id: 'n-001',
  type: 'payment',
  title: 'Pagamento confirmado!',
  body: 'Seu pagamento foi recebido com sucesso.',
  data: { transactionId: 'tx-001' },
  isRead: false,
  readAt: null,
  createdAt: '2025-01-15T10:00:00.000Z',
};

const MOCK_READ_NOTIFICATION: AppNotification = {
  id: 'n-002',
  type: 'info',
  title: 'Bem-vindo!',
  body: 'Seja bem-vindo ao Justifica.AI.',
  data: null,
  isRead: true,
  readAt: '2025-01-15T11:00:00.000Z',
  createdAt: '2025-01-14T10:00:00.000Z',
};

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  const mockChannel: Record<string, jasmine.Spy> = {
    on: jasmine.createSpy('on'),
    subscribe: jasmine.createSpy('subscribe'),
    unsubscribe: jasmine.createSpy('unsubscribe'),
  };
  mockChannel['on'].and.returnValue(mockChannel);
  mockChannel['subscribe'].and.returnValue(mockChannel);

  const mockSupabase = {
    channel: jasmine.createSpy('channel').and.returnValue(mockChannel),
  };

  const mockAuthService = {
    user: signal({ id: 'user-001', email: 'test@example.com' } as unknown),
    session: signal({ access_token: 'token' } as unknown),
    isAuthenticated: signal(true),
    isLoading: signal(false),
    getSupabaseClient: jasmine.createSpy('getSupabaseClient').and.returnValue(mockSupabase),
    getAccessToken: jasmine.createSpy('getAccessToken').and.returnValue(Promise.resolve('token')),
    signOut: jasmine.createSpy('signOut').and.returnValue(Promise.resolve()),
  };

  beforeEach(() => {
    mockChannel['on'].calls.reset();
    mockChannel['subscribe'].calls.reset();
    mockChannel['unsubscribe'].calls.reset();
    mockChannel['on'].and.returnValue(mockChannel);
    mockChannel['subscribe'].and.returnValue(mockChannel);
    mockSupabase.channel.calls.reset();
    mockSupabase.channel.and.returnValue(mockChannel);
    mockAuthService.getSupabaseClient.calls.reset();
    mockAuthService.getSupabaseClient.and.returnValue(mockSupabase);
    mockAuthService.user.set({ id: 'user-001', email: 'test@example.com' });

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.ngOnDestroy();
  });

  // =========================================================================
  // Initial State
  // =========================================================================
  describe('Initial State', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have empty notifications initially', () => {
      expect(service.notifications()).toEqual([]);
    });

    it('should have unread count of 0', () => {
      expect(service.unreadCount()).toBe(0);
    });

    it('should not be loading initially', () => {
      expect(service.loading()).toBeFalse();
    });

    it('should have total of 0', () => {
      expect(service.total()).toBe(0);
    });

    it('should have currentPage of 1', () => {
      expect(service.currentPage()).toBe(1);
    });

    it('should not have more initially', () => {
      expect(service.hasMore()).toBeFalse();
    });
  });

  // =========================================================================
  // loadNotifications
  // =========================================================================
  describe('loadNotifications', () => {
    it('should load first page of notifications', async () => {
      const response: NotificationListResponse = {
        data: [MOCK_NOTIFICATION, MOCK_READ_NOTIFICATION],
        total: 2,
        page: 1,
        limit: 10,
      };

      const promise = service.loadNotifications(1);
      const req = httpMock.expectOne(
        `${environment.apiUrl}/notifications?page=1&limit=10`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(response);
      await promise;

      expect(service.notifications().length).toBe(2);
      expect(service.total()).toBe(2);
      expect(service.currentPage()).toBe(1);
      expect(service.loading()).toBeFalse();
    });

    it('should reset notifications on page 1', async () => {
      const response: NotificationListResponse = {
        data: [MOCK_NOTIFICATION],
        total: 1,
        page: 1,
        limit: 10,
      };

      const promise = service.loadNotifications(1);
      httpMock.expectOne(`${environment.apiUrl}/notifications?page=1&limit=10`).flush(response);
      await promise;

      expect(service.notifications()).toEqual([MOCK_NOTIFICATION]);
    });

    it('should append notifications on page > 1', async () => {
      // Load first page
      const page1: NotificationListResponse = {
        data: [MOCK_NOTIFICATION],
        total: 2,
        page: 1,
        limit: 10,
      };
      let promise = service.loadNotifications(1);
      httpMock.expectOne(`${environment.apiUrl}/notifications?page=1&limit=10`).flush(page1);
      await promise;

      // Load second page
      const page2: NotificationListResponse = {
        data: [MOCK_READ_NOTIFICATION],
        total: 2,
        page: 2,
        limit: 10,
      };
      promise = service.loadNotifications(2);
      httpMock.expectOne(`${environment.apiUrl}/notifications?page=2&limit=10`).flush(page2);
      await promise;

      expect(service.notifications().length).toBe(2);
      expect(service.currentPage()).toBe(2);
    });

    it('should add unread_only param when true', async () => {
      const response: NotificationListResponse = {
        data: [MOCK_NOTIFICATION],
        total: 1,
        page: 1,
        limit: 10,
      };

      const promise = service.loadNotifications(1, true);
      const req = httpMock.expectOne(
        `${environment.apiUrl}/notifications?page=1&limit=10&unread_only=true`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(response);
      await promise;

      expect(service.notifications()).toEqual([MOCK_NOTIFICATION]);
    });

    it('should set loading to false even on error', async () => {
      const promise = service.loadNotifications(1).catch(() => {/* ignore */});
      httpMock.expectOne(`${environment.apiUrl}/notifications?page=1&limit=10`)
        .error(new ProgressEvent('error'));
      await promise;

      expect(service.loading()).toBeFalse();
    });

    it('should compute hasMore correctly', async () => {
      const response: NotificationListResponse = {
        data: [MOCK_NOTIFICATION],
        total: 5,
        page: 1,
        limit: 10,
      };

      const promise = service.loadNotifications(1);
      httpMock.expectOne(`${environment.apiUrl}/notifications?page=1&limit=10`).flush(response);
      await promise;

      expect(service.hasMore()).toBeTrue();
    });
  });

  // =========================================================================
  // loadMore
  // =========================================================================
  describe('loadMore', () => {
    it('should load next page', async () => {
      // Load page 1 first
      const page1: NotificationListResponse = {
        data: [MOCK_NOTIFICATION],
        total: 2,
        page: 1,
        limit: 10,
      };
      let promise = service.loadNotifications(1);
      httpMock.expectOne(`${environment.apiUrl}/notifications?page=1&limit=10`).flush(page1);
      await promise;

      // Load more
      const page2: NotificationListResponse = {
        data: [MOCK_READ_NOTIFICATION],
        total: 2,
        page: 2,
        limit: 10,
      };
      promise = service.loadMore();
      httpMock.expectOne(`${environment.apiUrl}/notifications?page=2&limit=10`).flush(page2);
      await promise;

      expect(service.notifications().length).toBe(2);
      expect(service.currentPage()).toBe(2);
    });

    it('should pass unread_only filter to loadMore', async () => {
      const page1: NotificationListResponse = {
        data: [MOCK_NOTIFICATION],
        total: 2,
        page: 1,
        limit: 10,
      };
      let promise = service.loadNotifications(1);
      httpMock.expectOne(`${environment.apiUrl}/notifications?page=1&limit=10`).flush(page1);
      await promise;

      const page2: NotificationListResponse = {
        data: [],
        total: 2,
        page: 2,
        limit: 10,
      };
      promise = service.loadMore(true);
      httpMock.expectOne(`${environment.apiUrl}/notifications?page=2&limit=10&unread_only=true`).flush(page2);
      await promise;
    });
  });

  // =========================================================================
  // fetchUnreadCount
  // =========================================================================
  describe('fetchUnreadCount', () => {
    it('should fetch unread count from API', async () => {
      const response: UnreadCountResponse = { count: 5 };

      const promise = service.fetchUnreadCount();
      const req = httpMock.expectOne(`${environment.apiUrl}/notifications/count`);
      expect(req.request.method).toBe('GET');
      req.flush(response);
      await promise;

      expect(service.unreadCount()).toBe(5);
    });

    it('should update to 0 when no unread', async () => {
      const response: UnreadCountResponse = { count: 0 };

      const promise = service.fetchUnreadCount();
      httpMock.expectOne(`${environment.apiUrl}/notifications/count`).flush(response);
      await promise;

      expect(service.unreadCount()).toBe(0);
    });
  });

  // =========================================================================
  // markAsRead
  // =========================================================================
  describe('markAsRead', () => {
    beforeEach(async () => {
      const response: NotificationListResponse = {
        data: [MOCK_NOTIFICATION, MOCK_READ_NOTIFICATION],
        total: 2,
        page: 1,
        limit: 10,
      };
      const promise = service.loadNotifications(1);
      httpMock.expectOne(`${environment.apiUrl}/notifications?page=1&limit=10`).flush(response);
      await promise;
    });

    it('should mark notification as read', async () => {
      const response: MarkReadResponse = { success: true };

      const promise = service.markAsRead('n-001');
      const req = httpMock.expectOne(`${environment.apiUrl}/notifications/n-001/read`);
      expect(req.request.method).toBe('PATCH');
      req.flush(response);
      await promise;

      const updated = service.notifications().find((n) => n.id === 'n-001');
      expect(updated?.isRead).toBeTrue();
      expect(updated?.readAt).toBeTruthy();
    });

    it('should decrement unread count on mark read', async () => {
      // Set initial unread count
      const countPromise = service.fetchUnreadCount();
      httpMock.expectOne(`${environment.apiUrl}/notifications/count`).flush({ count: 3 });
      await countPromise;

      const response: MarkReadResponse = { success: true };
      const promise = service.markAsRead('n-001');
      httpMock.expectOne(`${environment.apiUrl}/notifications/n-001/read`).flush(response);
      await promise;

      expect(service.unreadCount()).toBe(2);
    });

    it('should not update on unsuccessful mark', async () => {
      const response: MarkReadResponse = { success: false };

      const promise = service.markAsRead('n-001');
      httpMock.expectOne(`${environment.apiUrl}/notifications/n-001/read`).flush(response);
      await promise;

      const notif = service.notifications().find((n) => n.id === 'n-001');
      expect(notif?.isRead).toBeFalse();
    });

    it('should not go below 0 for unread count', async () => {
      // unreadCount is already 0
      const response: MarkReadResponse = { success: true };
      const promise = service.markAsRead('n-001');
      httpMock.expectOne(`${environment.apiUrl}/notifications/n-001/read`).flush(response);
      await promise;

      expect(service.unreadCount()).toBe(0);
    });
  });

  // =========================================================================
  // markAllAsRead
  // =========================================================================
  describe('markAllAsRead', () => {
    beforeEach(async () => {
      const response: NotificationListResponse = {
        data: [MOCK_NOTIFICATION, MOCK_READ_NOTIFICATION],
        total: 2,
        page: 1,
        limit: 10,
      };
      const promise = service.loadNotifications(1);
      httpMock.expectOne(`${environment.apiUrl}/notifications?page=1&limit=10`).flush(response);
      await promise;

      const countPromise = service.fetchUnreadCount();
      httpMock.expectOne(`${environment.apiUrl}/notifications/count`).flush({ count: 3 });
      await countPromise;
    });

    it('should mark all as read', async () => {
      const response: MarkReadResponse = { success: true };

      const promise = service.markAllAsRead();
      const req = httpMock.expectOne(`${environment.apiUrl}/notifications/read-all`);
      expect(req.request.method).toBe('PATCH');
      req.flush(response);
      await promise;

      const allRead = service.notifications().every((n) => n.isRead);
      expect(allRead).toBeTrue();
      expect(service.unreadCount()).toBe(0);
    });

    it('should not update on unsuccessful markAll', async () => {
      const response: MarkReadResponse = { success: false };

      const promise = service.markAllAsRead();
      httpMock.expectOne(`${environment.apiUrl}/notifications/read-all`).flush(response);
      await promise;

      expect(service.unreadCount()).toBe(3);
    });

    it('should preserve existing readAt for already-read notifications', async () => {
      const response: MarkReadResponse = { success: true };

      const promise = service.markAllAsRead();
      httpMock.expectOne(`${environment.apiUrl}/notifications/read-all`).flush(response);
      await promise;

      const alreadyRead = service.notifications().find((n) => n.id === 'n-002');
      expect(alreadyRead?.readAt).toBe('2025-01-15T11:00:00.000Z');
    });
  });

  // =========================================================================
  // Realtime
  // =========================================================================
  describe('Realtime', () => {
    it('should subscribe to realtime channel', () => {
      service.subscribeRealtime();

      expect(mockSupabase.channel).toHaveBeenCalledWith('notifications-realtime');
      expect(mockChannel['on']).toHaveBeenCalledWith(
        'postgres_changes',
        jasmine.objectContaining({
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'user_id=eq.user-001',
        }),
        jasmine.any(Function),
      );
      expect(mockChannel['subscribe']).toHaveBeenCalled();
    });

    it('should unsubscribe from realtime channel', () => {
      service.subscribeRealtime();
      service.unsubscribeRealtime();

      expect(mockChannel['unsubscribe']).toHaveBeenCalled();
    });

    it('should add new notification on realtime insert', () => {
      service.subscribeRealtime();

      // Get the callback from the .on() call
      const callback = mockChannel['on'].calls.mostRecent().args[2];
      callback({
        new: {
          id: 'n-realtime',
          type: 'success',
          title: 'Realtime notification',
          body: 'Test body',
          data: null,
          is_read: false,
          read_at: null,
          created_at: '2025-01-16T10:00:00.000Z',
        },
      });

      expect(service.notifications().length).toBe(1);
      expect(service.notifications()[0].id).toBe('n-realtime');
      expect(service.unreadCount()).toBe(1);
      expect(service.total()).toBe(1);
    });

    it('should not subscribe when no user', () => {
      mockAuthService.user.set(null);
      service.subscribeRealtime();

      expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should not subscribe when no supabase client', () => {
      mockAuthService.getSupabaseClient.and.returnValue(null);
      service.subscribeRealtime();

      expect(mockSupabase.channel).not.toHaveBeenCalled();

      // Restore
      mockAuthService.getSupabaseClient.and.returnValue(mockSupabase);
      mockAuthService.user.set({ id: 'user-001', email: 'test@example.com' });
    });

    it('should unsubscribe previous channel before subscribing new one', () => {
      service.subscribeRealtime();
      service.subscribeRealtime();

      expect(mockChannel['unsubscribe']).toHaveBeenCalledTimes(1);
      expect(mockSupabase.channel).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // resetState
  // =========================================================================
  describe('resetState', () => {
    it('should reset all state', async () => {
      const response: NotificationListResponse = {
        data: [MOCK_NOTIFICATION],
        total: 1,
        page: 1,
        limit: 10,
      };
      const promise = service.loadNotifications(1);
      httpMock.expectOne(`${environment.apiUrl}/notifications?page=1&limit=10`).flush(response);
      await promise;

      service.resetState();

      expect(service.notifications()).toEqual([]);
      expect(service.unreadCount()).toBe(0);
      expect(service.loading()).toBeFalse();
      expect(service.total()).toBe(0);
      expect(service.currentPage()).toBe(1);
    });
  });

  // =========================================================================
  // getRelativeTime
  // =========================================================================
  describe('getRelativeTime', () => {
    it('should return "Agora" for recent timestamps', () => {
      const now = new Date().toISOString();
      expect(service.getRelativeTime(now)).toBe('Agora');
    });

    it('should return minutes for < 1 hour', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(service.getRelativeTime(date)).toBe('5min atrás');
    });

    it('should return hours for < 24 hours', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(service.getRelativeTime(date)).toBe('3h atrás');
    });

    it('should return days for < 7 days', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      expect(service.getRelativeTime(date)).toBe('2d atrás');
    });

    it('should return formatted date for >= 7 days', () => {
      const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const result = service.getRelativeTime(date);
      // Should be dd/mm/yyyy format
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });
  });

  // =========================================================================
  // ngOnDestroy
  // =========================================================================
  describe('ngOnDestroy', () => {
    it('should unsubscribe on destroy', () => {
      service.subscribeRealtime();
      service.ngOnDestroy();

      expect(mockChannel['unsubscribe']).toHaveBeenCalled();
    });

    it('should handle destroy without subscription', () => {
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });
});

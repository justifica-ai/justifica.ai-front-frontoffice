import {
  NOTIFICATION_TYPE_CONFIG,
  NotificationType,
} from './notification.model';
import type {
  AppNotification,
  NotificationListResponse,
  UnreadCountResponse,
  MarkReadResponse,
} from './notification.model';

describe('Notification Model', () => {
  // =========================================================================
  // NOTIFICATION_TYPE_CONFIG
  // =========================================================================
  describe('NOTIFICATION_TYPE_CONFIG', () => {
    const types: NotificationType[] = ['info', 'success', 'warning', 'error', 'payment', 'appeal', 'system'];

    types.forEach((type) => {
      it(`should have config for "${type}" type`, () => {
        const config = NOTIFICATION_TYPE_CONFIG[type];
        expect(config).toBeTruthy();
        expect(config.label).toBeTruthy();
        expect(config.iconClass).toBeTruthy();
        expect(config.bgClass).toBeTruthy();
        expect(config.textClass).toBeTruthy();
      });
    });

    it('should have 7 notification types', () => {
      expect(Object.keys(NOTIFICATION_TYPE_CONFIG).length).toBe(7);
    });

    it('should have correct label for payment', () => {
      expect(NOTIFICATION_TYPE_CONFIG['payment'].label).toBe('Pagamento');
    });

    it('should have correct label for appeal', () => {
      expect(NOTIFICATION_TYPE_CONFIG['appeal'].label).toBe('Recurso');
    });

    it('should have correct label for system', () => {
      expect(NOTIFICATION_TYPE_CONFIG['system'].label).toBe('Sistema');
    });

    it('should have correct label for info', () => {
      expect(NOTIFICATION_TYPE_CONFIG['info'].label).toBe('Informação');
    });

    it('should have correct label for success', () => {
      expect(NOTIFICATION_TYPE_CONFIG['success'].label).toBe('Sucesso');
    });

    it('should have correct label for warning', () => {
      expect(NOTIFICATION_TYPE_CONFIG['warning'].label).toBe('Atenção');
    });

    it('should have correct label for error', () => {
      expect(NOTIFICATION_TYPE_CONFIG['error'].label).toBe('Erro');
    });
  });

  // =========================================================================
  // Type assertions
  // =========================================================================
  describe('Type assertions', () => {
    it('should allow valid AppNotification', () => {
      const notification: AppNotification = {
        id: 'n-001',
        type: 'payment',
        title: 'Test',
        body: 'Test body',
        data: { key: 'value' },
        isRead: false,
        readAt: null,
        createdAt: '2025-01-15T10:00:00.000Z',
      };
      expect(notification.id).toBe('n-001');
    });

    it('should allow null data in AppNotification', () => {
      const notification: AppNotification = {
        id: 'n-002',
        type: 'info',
        title: 'Test',
        body: 'Test body',
        data: null,
        isRead: true,
        readAt: '2025-01-15T11:00:00.000Z',
        createdAt: '2025-01-15T10:00:00.000Z',
      };
      expect(notification.data).toBeNull();
    });

    it('should allow valid NotificationListResponse', () => {
      const response: NotificationListResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };
      expect(response.total).toBe(0);
    });

    it('should allow valid UnreadCountResponse', () => {
      const response: UnreadCountResponse = { count: 5 };
      expect(response.count).toBe(5);
    });

    it('should allow valid MarkReadResponse', () => {
      const response: MarkReadResponse = { success: true };
      expect(response.success).toBeTrue();
    });
  });
});

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type NotificationType =
  | 'payment_confirmed'
  | 'document_ready'
  | 'appeal_expired'
  | 'affiliate_conversion'
  | 'system';

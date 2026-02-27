export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'payment'
  | 'appeal'
  | 'system';

export interface NotificationListResponse {
  data: AppNotification[];
  total: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkReadResponse {
  success: boolean;
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, { label: string; iconClass: string; bgClass: string; textClass: string }> = {
  info: { label: 'Informação', iconClass: 'text-blue-500', bgClass: 'bg-blue-50', textClass: 'text-blue-700' },
  success: { label: 'Sucesso', iconClass: 'text-green-500', bgClass: 'bg-green-50', textClass: 'text-green-700' },
  warning: { label: 'Atenção', iconClass: 'text-amber-500', bgClass: 'bg-amber-50', textClass: 'text-amber-700' },
  error: { label: 'Erro', iconClass: 'text-red-500', bgClass: 'bg-red-50', textClass: 'text-red-700' },
  payment: { label: 'Pagamento', iconClass: 'text-emerald-500', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700' },
  appeal: { label: 'Recurso', iconClass: 'text-brand-500', bgClass: 'bg-brand-50', textClass: 'text-brand-700' },
  system: { label: 'Sistema', iconClass: 'text-gray-500', bgClass: 'bg-gray-50', textClass: 'text-gray-700' },
};

import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ROUTES } from '../constants/api-routes';
import { AuthService } from './auth.service';
import {
  AppNotification,
  NotificationListResponse,
  UnreadCountResponse,
  MarkReadResponse,
} from '../models/notification.model';
import type { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private realtimeChannel: RealtimeChannel | null = null;

  private readonly _notifications = signal<AppNotification[]>([]);
  private readonly _unreadCount = signal(0);
  private readonly _loading = signal(false);
  private readonly _total = signal(0);
  private readonly _currentPage = signal(1);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly total = this._total.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly hasMore = computed(() => this._notifications().length < this._total());

  ngOnDestroy(): void {
    this.unsubscribeRealtime();
  }

  async loadNotifications(page = 1, unreadOnly = false): Promise<void> {
    this._loading.set(true);
    try {
      let params = new HttpParams()
        .set('page', String(page))
        .set('limit', '10');

      if (unreadOnly) {
        params = params.set('unread_only', 'true');
      }

      const response = await firstValueFrom(
        this.http.get<NotificationListResponse>(
          `${environment.apiUrl}${API_ROUTES.NOTIFICATIONS.BASE}`,
          { params },
        ),
      );

      if (page === 1) {
        this._notifications.set(response.data);
      } else {
        this._notifications.update((current) => [...current, ...response.data]);
      }
      this._total.set(response.total);
      this._currentPage.set(page);
    } finally {
      this._loading.set(false);
    }
  }

  async loadMore(unreadOnly = false): Promise<void> {
    const nextPage = this._currentPage() + 1;
    await this.loadNotifications(nextPage, unreadOnly);
  }

  async fetchUnreadCount(): Promise<void> {
    const response = await firstValueFrom(
      this.http.get<UnreadCountResponse>(
        `${environment.apiUrl}${API_ROUTES.NOTIFICATIONS.COUNT}`,
      ),
    );
    this._unreadCount.set(response.count);
  }

  async markAsRead(id: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.patch<MarkReadResponse>(
        `${environment.apiUrl}${API_ROUTES.NOTIFICATIONS.MARK_READ(id)}`,
        {},
      ),
    );

    if (response.success) {
      this._notifications.update((list) =>
        list.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
        ),
      );
      this._unreadCount.update((c) => Math.max(0, c - 1));
    }
  }

  async markAllAsRead(): Promise<void> {
    const response = await firstValueFrom(
      this.http.patch<MarkReadResponse>(
        `${environment.apiUrl}${API_ROUTES.NOTIFICATIONS.MARK_ALL_READ}`,
        {},
      ),
    );

    if (response.success) {
      this._notifications.update((list) =>
        list.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })),
      );
      this._unreadCount.set(0);
    }
  }

  subscribeRealtime(): void {
    const supabase = this.auth.getSupabaseClient();
    const user = this.auth.user();
    if (!supabase || !user) return;

    this.unsubscribeRealtime();

    this.realtimeChannel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const record = payload.new as Record<string, unknown>;
          const notification: AppNotification = {
            id: record['id'] as string,
            type: record['type'] as AppNotification['type'],
            title: record['title'] as string,
            body: record['body'] as string,
            data: (record['data'] as Record<string, unknown>) ?? null,
            isRead: (record['is_read'] as boolean) ?? false,
            readAt: (record['read_at'] as string) ?? null,
            createdAt: record['created_at'] as string,
          };
          this._notifications.update((list) => [notification, ...list]);
          this._total.update((t) => t + 1);
          this._unreadCount.update((c) => c + 1);
        },
      )
      .subscribe();
  }

  unsubscribeRealtime(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
  }

  resetState(): void {
    this._notifications.set([]);
    this._unreadCount.set(0);
    this._loading.set(false);
    this._total.set(0);
    this._currentPage.set(1);
  }

  getRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'Agora';
    if (diffMinutes < 60) return `${diffMinutes}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}

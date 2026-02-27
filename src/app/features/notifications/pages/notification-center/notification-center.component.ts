import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { NOTIFICATION_TYPE_CONFIG, NotificationType } from '../../../../core/models/notification.model';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Notificações</h1>
          <p class="text-sm text-gray-500 mt-1">Acompanhe todas as suas notificações</p>
        </div>
        @if (notificationService.unreadCount() > 0) {
          <button
            (click)="onMarkAllRead()"
            class="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 font-medium rounded-xl hover:bg-brand-100 transition-colors text-sm"
            aria-label="Marcar todas as notificações como lidas">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Marcar todas como lidas
          </button>
        }
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-2 mb-6" role="tablist" aria-label="Filtrar notificações">
        <button
          role="tab"
          [attr.aria-selected]="!unreadOnly()"
          (click)="setFilter(false)"
          [class]="getTabClasses(false)">
          Todas
        </button>
        <button
          role="tab"
          [attr.aria-selected]="unreadOnly()"
          (click)="setFilter(true)"
          [class]="getTabClasses(true)">
          Não lidas
          @if (notificationService.unreadCount() > 0) {
            <span class="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
            </span>
          }
        </button>
      </div>

      <!-- Loading skeletons -->
      @if (notificationService.loading() && notificationService.notifications().length === 0) {
        <div class="space-y-3" aria-label="Carregando notificações" role="status">
          @for (i of skeletonItems; track i) {
            <div class="animate-pulse bg-white rounded-xl p-4 border border-gray-200 flex gap-3">
              <div class="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div class="flex-1">
                <div class="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty state -->
      @if (!notificationService.loading() && notificationService.notifications().length === 0) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
          </div>
          @if (unreadOnly()) {
            <h2 class="text-lg font-semibold text-gray-700 mb-2">Nenhuma notificação não lida</h2>
            <p class="text-gray-500">Você está em dia com todas as notificações!</p>
          } @else {
            <h2 class="text-lg font-semibold text-gray-700 mb-2">Nenhuma notificação</h2>
            <p class="text-gray-500">Quando houver novidades, elas aparecerão aqui</p>
          }
        </div>
      }

      <!-- Notification list -->
      @if (notificationService.notifications().length > 0) {
        <div class="space-y-3" role="list" aria-label="Lista de notificações">
          @for (notification of notificationService.notifications(); track notification.id) {
            <div
              class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer flex gap-3"
              [class.border-l-4]="!notification.isRead"
              [class.border-l-brand-500]="!notification.isRead"
              (click)="onNotificationClick(notification.id, notification.isRead)"
              (keydown.enter)="onNotificationClick(notification.id, notification.isRead)"
              role="listitem"
              tabindex="0">
              <!-- Type icon -->
              <div class="flex-shrink-0">
                <span [class]="'w-10 h-10 rounded-full flex items-center justify-center text-base ' + getTypeConfig(notification.type).bgClass + ' ' + getTypeConfig(notification.type).iconClass">
                  {{ getTypeEmoji(notification.type) }}
                </span>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <p class="text-sm text-gray-800" [class.font-semibold]="!notification.isRead" [class.font-medium]="notification.isRead">
                    {{ notification.title }}
                  </p>
                  <span class="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {{ notificationService.getRelativeTime(notification.createdAt) }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 mt-0.5 line-clamp-2">{{ notification.body }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <span [class]="'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ' + getTypeConfig(notification.type).bgClass + ' ' + getTypeConfig(notification.type).textClass">
                    {{ getTypeConfig(notification.type).label }}
                  </span>
                  @if (!notification.isRead) {
                    <span class="w-2 h-2 bg-brand-500 rounded-full" aria-label="Não lida"></span>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Load more -->
        @if (notificationService.hasMore()) {
          <div class="mt-6 text-center">
            <button
              (click)="onLoadMore()"
              [disabled]="notificationService.loading()"
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-50">
              @if (notificationService.loading()) { Carregando... } @else { Carregar mais }
            </button>
          </div>
        }

        <!-- Result count -->
        <p class="text-sm text-gray-500 text-center mt-4" aria-live="polite">
          Mostrando {{ notificationService.notifications().length }} de {{ notificationService.total() }}
          {{ notificationService.total() === 1 ? 'notificação' : 'notificações' }}
        </p>
      }
    </div>
  `,
})
export class NotificationCenterComponent implements OnInit {
  readonly notificationService = inject(NotificationService);

  readonly unreadOnly = signal(false);
  readonly skeletonItems = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    this.notificationService.loadNotifications(1, false);
    this.notificationService.fetchUnreadCount();
  }

  setFilter(unreadOnly: boolean): void {
    this.unreadOnly.set(unreadOnly);
    this.notificationService.loadNotifications(1, unreadOnly);
  }

  async onNotificationClick(id: string, isRead: boolean): Promise<void> {
    if (!isRead) {
      await this.notificationService.markAsRead(id);
    }
  }

  async onMarkAllRead(): Promise<void> {
    await this.notificationService.markAllAsRead();
  }

  onLoadMore(): void {
    this.notificationService.loadMore(this.unreadOnly());
  }

  getTabClasses(isUnreadOnly: boolean): string {
    const base = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors';
    const active = this.unreadOnly() === isUnreadOnly;
    return active
      ? `${base} bg-brand-600 text-white`
      : `${base} bg-gray-100 text-gray-600 hover:bg-gray-200`;
  }

  getTypeConfig(type: NotificationType): { label: string; iconClass: string; bgClass: string; textClass: string } {
    return NOTIFICATION_TYPE_CONFIG[type] ?? NOTIFICATION_TYPE_CONFIG['info'];
  }

  getTypeEmoji(type: NotificationType): string {
    const emojis: Record<string, string> = {
      payment: '$',
      appeal: '📄',
      success: '✓',
      warning: '⚠',
      error: '✕',
      info: 'ℹ',
      system: '⚙',
    };
    return emojis[type] ?? 'ℹ';
  }
}


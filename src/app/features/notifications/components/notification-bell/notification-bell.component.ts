import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { APP_ROUTES } from '../../../../core/constants/app-routes';
import { NOTIFICATION_TYPE_CONFIG, NotificationType } from '../../../../core/models/notification.model';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <button
        (click)="toggleDropdown()"
        class="relative p-2 text-gray-500 hover:text-brand-600 rounded-lg hover:bg-gray-100 transition-colors"
        [attr.aria-label]="'Notificações' + (notificationService.unreadCount() > 0 ? ', ' + notificationService.unreadCount() + ' não lidas' : '')"
        aria-haspopup="true"
        [attr.aria-expanded]="dropdownOpen()">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
        @if (notificationService.unreadCount() > 0) {
          <span class="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse"
                aria-hidden="true">
            {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
          </span>
        }
      </button>

      @if (dropdownOpen()) {
        <div class="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
             role="menu" aria-label="Notificações recentes">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-800">Notificações</h3>
            @if (notificationService.unreadCount() > 0) {
              <button
                (click)="onMarkAllRead()"
                class="text-xs text-brand-600 hover:text-brand-700 font-medium"
                aria-label="Marcar todas como lidas">
                Marcar todas como lidas
              </button>
            }
          </div>

          <!-- Notification list -->
          <div class="max-h-80 overflow-y-auto">
            @if (notificationService.notifications().length === 0) {
              <div class="px-4 py-8 text-center">
                <p class="text-sm text-gray-400">Nenhuma notificação</p>
              </div>
            } @else {
              @for (notification of notificationService.notifications().slice(0, 5); track notification.id) {
                <button
                  (click)="onNotificationClick(notification.id, notification.isRead)"
                  class="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 flex gap-3"
                  [class.bg-brand-50]="!notification.isRead"
                  role="menuitem">
                  <div class="flex-shrink-0 mt-0.5">
                    <span [class]="'w-8 h-8 rounded-full flex items-center justify-center text-sm ' + getTypeConfig(notification.type).bgClass + ' ' + getTypeConfig(notification.type).iconClass">
                      {{ getTypeEmoji(notification.type) }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate" [class.font-semibold]="!notification.isRead">
                      {{ notification.title }}
                    </p>
                    <p class="text-xs text-gray-500 truncate mt-0.5">{{ notification.body }}</p>
                    <p class="text-xs text-gray-400 mt-1">{{ notificationService.getRelativeTime(notification.createdAt) }}</p>
                  </div>
                  @if (!notification.isRead) {
                    <span class="flex-shrink-0 w-2 h-2 bg-brand-500 rounded-full mt-2" aria-label="Não lida"></span>
                  }
                </button>
              }
            }
          </div>

          <!-- Footer -->
          <div class="border-t border-gray-100 px-4 py-2.5">
            <a [routerLink]="[routes.APP.NOTIFICATIONS]"
               (click)="closeDropdown()"
               class="block text-center text-sm font-medium text-brand-600 hover:text-brand-700">
              Ver todas as notificações
            </a>
          </div>
        </div>
      }
    </div>
  `,
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  readonly notificationService = inject(NotificationService);
  private readonly elementRef = inject(ElementRef);

  readonly routes = APP_ROUTES;
  readonly dropdownOpen = signal(false);

  ngOnInit(): void {
    this.notificationService.fetchUnreadCount();
    this.notificationService.loadNotifications(1);
    this.notificationService.subscribeRealtime();
  }

  ngOnDestroy(): void {
    this.notificationService.unsubscribeRealtime();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeDropdown();
  }

  toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  async onNotificationClick(id: string, isRead: boolean): Promise<void> {
    if (!isRead) {
      await this.notificationService.markAsRead(id);
    }
  }

  async onMarkAllRead(): Promise<void> {
    await this.notificationService.markAllAsRead();
  }

  getTypeConfig(type: NotificationType): { iconClass: string; bgClass: string } {
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

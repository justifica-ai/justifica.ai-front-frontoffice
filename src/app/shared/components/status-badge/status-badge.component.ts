import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="badgeClasses()" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium">
      <span class="w-1.5 h-1.5 rounded-full" [class]="dotClass()"></span>
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  status = input.required<string>();
  label = input.required<string>();

  badgeClasses = computed(() => {
    switch (this.status()) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'pending_payment': return 'bg-amber-100 text-amber-700';
      case 'generating': return 'bg-brand-100 text-brand-700';
      case 'generated': return 'bg-accent-100 text-accent-700';
      case 'paid': return 'bg-accent-100 text-accent-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'expired': return 'bg-gray-100 text-gray-500';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'refunded': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  });

  dotClass = computed(() => {
    switch (this.status()) {
      case 'draft': return 'bg-gray-400';
      case 'pending_payment': return 'bg-amber-400';
      case 'generating': return 'bg-brand-400';
      case 'generated': return 'bg-accent-400';
      case 'paid': return 'bg-accent-400';
      case 'failed': return 'bg-red-400';
      case 'expired': return 'bg-gray-400';
      case 'pending': return 'bg-amber-400';
      case 'refunded': return 'bg-purple-400';
      default: return 'bg-gray-400';
    }
  });
}

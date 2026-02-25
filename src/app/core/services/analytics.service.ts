import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  trackEvent(_action: string, _category: string, _label?: string, _value?: number): void {
    if (!environment.production) {
      return;
    }
    // GA4 event tracking placeholder — enabled when GA is configured
  }

  trackPageView(_url: string): void {
    if (!environment.production) {
      return;
    }
    // GA4 page view tracking placeholder
  }
}

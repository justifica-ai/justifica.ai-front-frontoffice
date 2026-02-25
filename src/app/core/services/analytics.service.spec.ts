import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalyticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should track event without error', () => {
    expect(() => service.trackEvent('click', 'button', 'test')).not.toThrow();
  });

  it('should track event with value without error', () => {
    expect(() => service.trackEvent('purchase', 'payment', 'pix', 100)).not.toThrow();
  });

  it('should track page view without error', () => {
    expect(() => service.trackPageView('/home')).not.toThrow();
  });
});

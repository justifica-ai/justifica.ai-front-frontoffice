import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProfileService } from './profile.service';
import { environment } from '../../../../environments/environment';
import { API_ROUTES } from '../../../core/constants/api-routes';
import type { UserProfile } from '../../../core/models/user.model';

const MOCK_PROFILE: UserProfile = {
  id: 'u-001',
  email: 'test@example.com',
  fullName: 'Test User',
  phone: '11999999999',
  role: 'user',
  status: 'active',
  emailVerified: true,
  onboardingCompleted: false,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Initial State', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have null profile initially', () => {
      expect(service.profile()).toBeNull();
    });

    it('should not be loading initially', () => {
      expect(service.loading()).toBeFalse();
    });

    it('should have no error initially', () => {
      expect(service.error()).toBeNull();
    });

    it('should report onboarding as not completed initially', () => {
      expect(service.onboardingCompleted()).toBeFalse();
    });
  });

  describe('loadProfile', () => {
    it('should set loading to true during request', () => {
      service.loadProfile();
      expect(service.loading()).toBeTrue();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`).flush(MOCK_PROFILE);
    });

    it('should fetch profile from API', fakeAsync(() => {
      service.loadProfile();
      tick();
      const req = httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`);
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_PROFILE);
      tick();
    }));

    it('should cache profile in signal after loading', fakeAsync(() => {
      service.loadProfile();
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`).flush(MOCK_PROFILE);
      tick();
      expect(service.profile()).toEqual(MOCK_PROFILE);
    }));

    it('should set loading to false after success', fakeAsync(() => {
      service.loadProfile();
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`).flush(MOCK_PROFILE);
      tick();
      expect(service.loading()).toBeFalse();
    }));

    it('should compute onboardingCompleted from profile', fakeAsync(() => {
      const completedProfile = { ...MOCK_PROFILE, onboardingCompleted: true };
      service.loadProfile();
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`).flush(completedProfile);
      tick();
      expect(service.onboardingCompleted()).toBeTrue();
    }));

    it('should set error message on failure', fakeAsync(() => {
      service.loadProfile().catch(() => { /* expected rejection */ });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`)
        .flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();
      expect(service.error()).toBeTruthy();
    }));

    it('should set loading to false on failure', fakeAsync(() => {
      service.loadProfile().catch(() => { /* expected rejection */ });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`)
        .flush('Error', { status: 500, statusText: 'Server Error' });
      tick();
      expect(service.loading()).toBeFalse();
    }));

    it('should reject promise on failure', fakeAsync(() => {
      let rejected = false;
      service.loadProfile().catch(() => { rejected = true; });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`)
        .flush('Error', { status: 500, statusText: 'Server Error' });
      tick();
      expect(rejected).toBeTrue();
    }));
  });

  describe('updateProfile', () => {
    it('should send PATCH request with data', fakeAsync(() => {
      service.updateProfile({ onboardingCompleted: true });
      tick();
      const req = httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ onboardingCompleted: true });
      req.flush({ ...MOCK_PROFILE, onboardingCompleted: true });
      tick();
    }));

    it('should update cached profile signal after success', fakeAsync(() => {
      // First load profile
      service.loadProfile();
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`).flush(MOCK_PROFILE);
      tick();

      // Then update
      service.updateProfile({ onboardingCompleted: true });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`)
        .flush({ ...MOCK_PROFILE, onboardingCompleted: true });
      tick();

      expect(service.profile()?.onboardingCompleted).toBeTrue();
    }));

    it('should set error on failure', fakeAsync(() => {
      service.updateProfile({ fullName: 'New Name' }).catch(() => { /* expected rejection */ });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`)
        .flush('Error', { status: 400, statusText: 'Bad Request' });
      tick();
      expect(service.error()).toBeTruthy();
    }));

    it('should reject promise on failure', fakeAsync(() => {
      let rejected = false;
      service.updateProfile({ fullName: 'New Name' }).catch(() => { rejected = true; });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.BASE}`)
        .flush('Error', { status: 400, statusText: 'Bad Request' });
      tick();
      expect(rejected).toBeTrue();
    }));
  });

  describe('updatePreferences', () => {
    it('should send PATCH request with preferences', fakeAsync(() => {
      const prefs = { emailMarketing: true, whatsapp: false, sms: true };
      service.updatePreferences(prefs);
      tick();
      const req = httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.PREFERENCES}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(prefs);
      req.flush({});
      tick();
    }));

    it('should set error on failure', fakeAsync(() => {
      const prefs = { emailMarketing: false, whatsapp: false, sms: false };
      service.updatePreferences(prefs).catch(() => { /* expected rejection */ });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.PREFERENCES}`)
        .flush('Error', { status: 500, statusText: 'Server Error' });
      tick();
      expect(service.error()).toBeTruthy();
    }));

    it('should reject promise on failure', fakeAsync(() => {
      let rejected = false;
      const prefs = { emailMarketing: false, whatsapp: false, sms: false };
      service.updatePreferences(prefs).catch(() => { rejected = true; });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.PREFERENCES}`)
        .flush('Error', { status: 500, statusText: 'Server Error' });
      tick();
      expect(rejected).toBeTrue();
    }));
  });

  describe('changePassword', () => {
    it('should send PATCH request with password data', fakeAsync(() => {
      const input = { currentPassword: 'old', newPassword: 'new12345' };
      service.changePassword(input);
      tick();
      const req = httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.CHANGE_PASSWORD}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(input);
      req.flush({});
      tick();
    }));

    it('should set error on failure', fakeAsync(() => {
      const input = { currentPassword: 'old', newPassword: 'new12345' };
      service.changePassword(input).catch(() => { /* expected rejection */ });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.CHANGE_PASSWORD}`)
        .flush('Error', { status: 400, statusText: 'Bad Request' });
      tick();
      expect(service.error()).toBeTruthy();
    }));

    it('should reject promise on failure', fakeAsync(() => {
      let rejected = false;
      const input = { currentPassword: 'old', newPassword: 'new12345' };
      service.changePassword(input).catch(() => { rejected = true; });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.CHANGE_PASSWORD}`)
        .flush('Error', { status: 400, statusText: 'Bad Request' });
      tick();
      expect(rejected).toBeTrue();
    }));
  });

  describe('loadSessions', () => {
    it('should send GET request and return sessions', fakeAsync(() => {
      const mockSessions = [
        { id: 's1', device: 'Chrome', ipMasked: '10.*.1', lastAccessAt: '2025-01-01', isCurrent: true },
      ];
      let result: unknown;
      service.loadSessions().then((r) => { result = r; });
      tick();
      const req = httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.SESSIONS}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSessions);
      tick();
      expect(result).toEqual(mockSessions);
    }));

    it('should set error on failure', fakeAsync(() => {
      service.loadSessions().catch(() => { /* expected rejection */ });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.SESSIONS}`)
        .flush('Error', { status: 500, statusText: 'Server Error' });
      tick();
      expect(service.error()).toBeTruthy();
    }));

    it('should reject promise on failure', fakeAsync(() => {
      let rejected = false;
      service.loadSessions().catch(() => { rejected = true; });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.SESSIONS}`)
        .flush('Error', { status: 500, statusText: 'Server Error' });
      tick();
      expect(rejected).toBeTrue();
    }));
  });

  describe('endSession', () => {
    it('should send DELETE request with session id', fakeAsync(() => {
      service.endSession('s-123');
      tick();
      const req = httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.SESSION_BY_ID('s-123')}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
      tick();
    }));

    it('should set error on failure', fakeAsync(() => {
      service.endSession('s-123').catch(() => { /* expected rejection */ });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.SESSION_BY_ID('s-123')}`)
        .flush('Error', { status: 404, statusText: 'Not Found' });
      tick();
      expect(service.error()).toBeTruthy();
    }));

    it('should reject promise on failure', fakeAsync(() => {
      let rejected = false;
      service.endSession('s-123').catch(() => { rejected = true; });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.SESSION_BY_ID('s-123')}`)
        .flush('Error', { status: 404, statusText: 'Not Found' });
      tick();
      expect(rejected).toBeTrue();
    }));
  });

  describe('requestDataExport', () => {
    it('should send POST request to data export endpoint', fakeAsync(() => {
      let result: unknown;
      service.requestDataExport().then((r) => { result = r; });
      tick();
      const req = httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.DATA_EXPORT}`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Export started' });
      tick();
      expect(result).toEqual({ message: 'Export started' });
    }));

    it('should set error on failure', fakeAsync(() => {
      service.requestDataExport().catch(() => { /* expected rejection */ });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.DATA_EXPORT}`)
        .flush('Error', { status: 429, statusText: 'Too Many Requests' });
      tick();
      expect(service.error()).toBeTruthy();
    }));

    it('should reject promise on failure', fakeAsync(() => {
      let rejected = false;
      service.requestDataExport().catch(() => { rejected = true; });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.DATA_EXPORT}`)
        .flush('Error', { status: 429, statusText: 'Too Many Requests' });
      tick();
      expect(rejected).toBeTrue();
    }));
  });

  describe('downloadDataExport', () => {
    it('should send GET request with blob response', fakeAsync(() => {
      const mockBlob = new Blob(['{}'], { type: 'application/json' });
      let result: unknown;
      service.downloadDataExport().then((r) => { result = r; });
      tick();
      const req = httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.DATA_EXPORT_DOWNLOAD}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
      tick();
      expect(result).toBeTruthy();
    }));

    it('should set error on failure', fakeAsync(() => {
      service.downloadDataExport().catch(() => { /* expected rejection */ });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.DATA_EXPORT_DOWNLOAD}`)
        .error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });
      tick();
      expect(service.error()).toBeTruthy();
    }));

    it('should reject promise on failure', fakeAsync(() => {
      let rejected = false;
      service.downloadDataExport().catch(() => { rejected = true; });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.DATA_EXPORT_DOWNLOAD}`)
        .error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });
      tick();
      expect(rejected).toBeTrue();
    }));
  });

  describe('requestDeletion', () => {
    it('should send POST request with password', fakeAsync(() => {
      let result: unknown;
      service.requestDeletion('mypassword').then((r) => { result = r; });
      tick();
      const req = httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.DELETE_REQUEST}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ password: 'mypassword' });
      req.flush({ message: 'Deletion requested' });
      tick();
      expect(result).toEqual({ message: 'Deletion requested' });
    }));

    it('should set error on failure', fakeAsync(() => {
      service.requestDeletion('wrong').catch(() => { /* expected rejection */ });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.DELETE_REQUEST}`)
        .flush('Error', { status: 401, statusText: 'Unauthorized' });
      tick();
      expect(service.error()).toBeTruthy();
    }));

    it('should reject promise on failure', fakeAsync(() => {
      let rejected = false;
      service.requestDeletion('wrong').catch(() => { rejected = true; });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.DELETE_REQUEST}`)
        .flush('Error', { status: 401, statusText: 'Unauthorized' });
      tick();
      expect(rejected).toBeTrue();
    }));
  });

  describe('cancelDeletion', () => {
    it('should send DELETE request', fakeAsync(() => {
      let result: unknown;
      service.cancelDeletion().then((r) => { result = r; });
      tick();
      const req = httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.DELETE_REQUEST}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Deletion cancelled' });
      tick();
      expect(result).toEqual({ message: 'Deletion cancelled' });
    }));

    it('should set error on failure', fakeAsync(() => {
      service.cancelDeletion().catch(() => { /* expected rejection */ });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.DELETE_REQUEST}`)
        .flush('Error', { status: 409, statusText: 'Conflict' });
      tick();
      expect(service.error()).toBeTruthy();
    }));

    it('should reject promise on failure', fakeAsync(() => {
      let rejected = false;
      service.cancelDeletion().catch(() => { rejected = true; });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.DELETE_REQUEST}`)
        .flush('Error', { status: 409, statusText: 'Conflict' });
      tick();
      expect(rejected).toBeTrue();
    }));
  });

  describe('revokeConsent', () => {
    it('should send POST request with consent type', fakeAsync(() => {
      let result: unknown;
      service.revokeConsent('marketing_consent').then((r) => { result = r; });
      tick();
      const req = httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.REVOKE_CONSENT}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ consentType: 'marketing_consent' });
      req.flush({ message: 'Consent revoked' });
      tick();
      expect(result).toEqual({ message: 'Consent revoked' });
    }));

    it('should set error on failure', fakeAsync(() => {
      service.revokeConsent('marketing_consent').catch(() => { /* expected rejection */ });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.REVOKE_CONSENT}`)
        .flush('Error', { status: 400, statusText: 'Bad Request' });
      tick();
      expect(service.error()).toBeTruthy();
    }));

    it('should reject promise on failure', fakeAsync(() => {
      let rejected = false;
      service.revokeConsent('marketing_consent').catch(() => { rejected = true; });
      tick();
      httpMock.expectOne(`${environment.apiUrl}${API_ROUTES.PROFILE.REVOKE_CONSENT}`)
        .flush('Error', { status: 400, statusText: 'Bad Request' });
      tick();
      expect(rejected).toBeTrue();
    }));
  });
});

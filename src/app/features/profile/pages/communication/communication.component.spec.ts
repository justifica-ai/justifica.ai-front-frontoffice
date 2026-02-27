import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommunicationComponent } from './communication.component';
import { ProfileService } from '../../../onboarding/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { UserProfile } from '../../../../core/models/user.model';

const MOCK_PROFILE: UserProfile = {
  id: 'u-001',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'user',
  emailVerified: true,
  onboardingCompleted: true,
  communicationPreferences: { emailMarketing: true, whatsapp: false, sms: false },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('CommunicationComponent', () => {
  let fixture: ComponentFixture<CommunicationComponent>;
  let component: CommunicationComponent;
  let profileSpy: jasmine.SpyObj<ProfileService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    profileSpy = jasmine.createSpyObj('ProfileService', ['loadProfile', 'updatePreferences'], {
      profile: jasmine.createSpy('profile').and.returnValue(null),
    });
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [CommunicationComponent],
      providers: [
        { provide: ProfileService, useValue: profileSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommunicationComponent);
    component = fixture.componentInstance;
  });

  describe('Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      expect(component.loading()).toBe(true);
    });

    it('should have all toggles off by default', () => {
      const prefs = component.preferences();
      expect(prefs.emailMarketing).toBe(false);
      expect(prefs.whatsapp).toBe(false);
      expect(prefs.sms).toBe(false);
    });
  });

  describe('Loading', () => {
    it('should load preferences from profile', fakeAsync(() => {
      profileSpy.loadProfile.and.resolveTo(MOCK_PROFILE);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.loading()).toBe(false);
      expect(component.preferences().emailMarketing).toBe(true);
      expect(component.preferences().whatsapp).toBe(false);
    }));

    it('should use cached profile if available', fakeAsync(() => {
      (profileSpy.profile as jasmine.Spy).and.returnValue(MOCK_PROFILE);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(profileSpy.loadProfile).not.toHaveBeenCalled();
      expect(component.preferences().emailMarketing).toBe(true);
    }));

    it('should show error toast on load failure', fakeAsync(() => {
      profileSpy.loadProfile.and.rejectWith(new Error('Network'));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao carregar preferências.');
      expect(component.loading()).toBe(false);
    }));

    it('should show loading skeleton', () => {
      fixture.detectChanges();
      const skeleton = fixture.nativeElement.querySelector('.animate-pulse');
      expect(skeleton).toBeTruthy();
    });

    it('should keep defaults when profile has no preferences', fakeAsync(() => {
      const profileWithoutPrefs = { ...MOCK_PROFILE, communicationPreferences: undefined };
      profileSpy.loadProfile.and.resolveTo(profileWithoutPrefs);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.preferences().emailMarketing).toBe(false);
    }));
  });

  describe('Toggle Rendering', () => {
    beforeEach(fakeAsync(() => {
      profileSpy.loadProfile.and.resolveTo(MOCK_PROFILE);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should render 3 toggle checkboxes', () => {
      const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
      expect(checkboxes.length).toBe(3);
    });

    it('should show emailMarketing as checked', () => {
      const checkbox = fixture.nativeElement.querySelector('#emailMarketing') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should show whatsapp as unchecked', () => {
      const checkbox = fixture.nativeElement.querySelector('#whatsapp') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should show sms as unchecked', () => {
      const checkbox = fixture.nativeElement.querySelector('#sms') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should have descriptive text for each toggle', () => {
      const descriptions = fixture.nativeElement.querySelectorAll('.text-xs.text-gray-500') as NodeListOf<HTMLElement>;
      expect(descriptions.length).toBe(3);
    });

    it('should have group role for accessibility', () => {
      const group = fixture.nativeElement.querySelector('[role="group"]') as HTMLElement;
      expect(group).toBeTruthy();
      expect(group.getAttribute('aria-label')).toBe('Preferências de comunicação');
    });
  });

  describe('Toggle Actions', () => {
    beforeEach(fakeAsync(() => {
      profileSpy.loadProfile.and.resolveTo(MOCK_PROFILE);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should toggle whatsapp and save', fakeAsync(() => {
      profileSpy.updatePreferences.and.resolveTo();

      const event = { target: { checked: true } } as unknown as Event;
      component.onToggle('whatsapp', event);
      expect(component.saving()).toBe(true);
      expect(component.preferences().whatsapp).toBe(true);
      tick();

      expect(profileSpy.updatePreferences).toHaveBeenCalledWith({
        emailMarketing: true,
        whatsapp: true,
        sms: false,
      });
      expect(toastSpy.success).toHaveBeenCalledWith('Preferências atualizadas!');
      expect(component.saving()).toBe(false);
    }));

    it('should toggle emailMarketing off', fakeAsync(() => {
      profileSpy.updatePreferences.and.resolveTo();

      const event = { target: { checked: false } } as unknown as Event;
      component.onToggle('emailMarketing', event);
      tick();

      expect(profileSpy.updatePreferences).toHaveBeenCalledWith({
        emailMarketing: false,
        whatsapp: false,
        sms: false,
      });
    }));

    it('should revert toggle on save failure', fakeAsync(() => {
      profileSpy.updatePreferences.and.rejectWith(new Error('Fail'));

      const event = { target: { checked: true } } as unknown as Event;
      component.onToggle('sms', event);
      expect(component.preferences().sms).toBe(true);
      tick();

      expect(component.preferences().sms).toBe(false);
      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao atualizar preferências.');
    }));

    it('should toggle sms on', fakeAsync(() => {
      profileSpy.updatePreferences.and.resolveTo();

      const event = { target: { checked: true } } as unknown as Event;
      component.onToggle('sms', event);
      tick();

      expect(profileSpy.updatePreferences).toHaveBeenCalledWith({
        emailMarketing: true,
        whatsapp: false,
        sms: true,
      });
    }));
  });

  describe('Description text', () => {
    beforeEach(fakeAsync(() => {
      profileSpy.loadProfile.and.resolveTo(MOCK_PROFILE);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should show intro text', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Escolha como deseja receber');
    });
  });
});

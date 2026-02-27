import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EditProfileComponent } from './edit-profile.component';
import { ProfileService } from '../../../onboarding/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { UserProfile } from '../../../../core/models/user.model';

const MOCK_PROFILE: UserProfile = {
  id: 'u-001',
  email: 'test@example.com',
  fullName: 'Test User',
  phone: '11999999999',
  cpfHash: 'abc123hash',
  role: 'user',
  status: 'active',
  emailVerified: true,
  onboardingCompleted: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('EditProfileComponent', () => {
  let fixture: ComponentFixture<EditProfileComponent>;
  let component: EditProfileComponent;
  let profileSpy: jasmine.SpyObj<ProfileService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    profileSpy = jasmine.createSpyObj('ProfileService', ['loadProfile', 'updateProfile'], {
      profile: jasmine.createSpy('profile').and.returnValue(null),
    });
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [EditProfileComponent],
      providers: [
        { provide: ProfileService, useValue: profileSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditProfileComponent);
    component = fixture.componentInstance;
  });

  describe('Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      expect(component.loading()).toBe(true);
    });

    it('should not be saving initially', () => {
      expect(component.saving()).toBe(false);
    });

    it('should have default CPF mask', () => {
      expect(component.cpfMasked()).toBe('•••.•••.•••-••');
    });
  });

  describe('Profile Loading', () => {
    it('should load profile on init and populate form', fakeAsync(() => {
      profileSpy.loadProfile.and.resolveTo(MOCK_PROFILE);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(profileSpy.loadProfile).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
      expect(component.profileForm.controls.fullName.value).toBe('Test User');
      expect(component.profileForm.getRawValue().email).toBe('test@example.com');
    }));

    it('should use cached profile if available', fakeAsync(() => {
      (profileSpy.profile as jasmine.Spy).and.returnValue(MOCK_PROFILE);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(profileSpy.loadProfile).not.toHaveBeenCalled();
      expect(component.profileForm.controls.fullName.value).toBe('Test User');
    }));

    it('should show error toast on load failure', fakeAsync(() => {
      profileSpy.loadProfile.and.rejectWith(new Error('Network error'));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.loading()).toBe(false);
      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao carregar perfil.');
    }));

    it('should show loading skeleton while loading', () => {
      expect(component.loading()).toBe(true);
      fixture.detectChanges();
      const skeleton = fixture.nativeElement.querySelector('.animate-pulse');
      expect(skeleton).toBeTruthy();
    });

    it('should hide skeleton after loading', fakeAsync(() => {
      profileSpy.loadProfile.and.resolveTo(MOCK_PROFILE);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const skeleton = fixture.nativeElement.querySelector('.animate-pulse');
      expect(skeleton).toBeFalsy();
    }));
  });

  describe('Form Rendering', () => {
    beforeEach(fakeAsync(() => {
      profileSpy.loadProfile.and.resolveTo(MOCK_PROFILE);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should render fullName input', () => {
      const input = fixture.nativeElement.querySelector('#fullName') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.value).toBe('Test User');
    });

    it('should render email as readonly', () => {
      const input = fixture.nativeElement.querySelector('#email') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.classList.contains('cursor-not-allowed')).toBe(true);
    });

    it('should render CPF as readonly', () => {
      const input = fixture.nativeElement.querySelector('#cpf') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.readOnly).toBe(true);
      expect(input.value).toBe('•••.•••.•••-••');
    });

    it('should render phone input', () => {
      const input = fixture.nativeElement.querySelector('#phone') as HTMLInputElement;
      expect(input).toBeTruthy();
    });

    it('should have name label with required marker', () => {
      const label = fixture.nativeElement.querySelector('label[for="fullName"]') as HTMLElement;
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('*');
      expect(label.textContent).toContain('(obrigatório)');
    });

    it('should have lock icons for email and CPF', () => {
      const labels = fixture.nativeElement.querySelectorAll('label') as NodeListOf<HTMLElement>;
      const emailLabel = Array.from(labels).find((l) => l.textContent?.includes('E-mail'));
      const cpfLabel = Array.from(labels).find((l) => l.textContent?.includes('CPF'));
      expect(emailLabel?.textContent).toContain('🔒');
      expect(cpfLabel?.textContent).toContain('🔒');
    });
  });

  describe('Form Validation', () => {
    beforeEach(fakeAsync(() => {
      profileSpy.loadProfile.and.resolveTo(MOCK_PROFILE);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should require fullName', () => {
      component.profileForm.controls.fullName.setValue('');
      component.profileForm.controls.fullName.markAsTouched();
      fixture.detectChanges();

      const error = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
      expect(error).toBeTruthy();
      expect(error.textContent).toContain('Nome é obrigatório');
    });

    it('should show error via showError', () => {
      component.profileForm.controls.fullName.setValue('');
      component.profileForm.controls.fullName.markAsTouched();
      expect(component.showError('fullName')).toBe(true);
    });

    it('should not show error for untouched fields', () => {
      component.profileForm.controls.fullName.setValue('');
      expect(component.showError('fullName')).toBe(false);
    });

    it('should not show error for valid fields', () => {
      component.profileForm.controls.fullName.markAsTouched();
      expect(component.showError('fullName')).toBe(false);
    });

    it('should return false for non-existent field', () => {
      expect(component.showError('nonExistent')).toBe(false);
    });
  });

  describe('Phone Input Formatting', () => {
    it('should format phone number', () => {
      const input = document.createElement('input');
      input.value = '11999887766';
      const event = { target: input } as unknown as Event;
      component.onPhoneInput(event);
      expect(input.value).toBe('(11) 99988-7766');
    });

    it('should limit phone to 11 digits', () => {
      const input = document.createElement('input');
      input.value = '1199988776655';
      const event = { target: input } as unknown as Event;
      component.onPhoneInput(event);
      expect(input.value).toBe('(11) 99988-7766');
    });

    it('should handle partial phone input', () => {
      const input = document.createElement('input');
      input.value = '119';
      const event = { target: input } as unknown as Event;
      component.onPhoneInput(event);
      expect(input.value).toBe('(11) 9');
    });

    it('should handle two-digit input', () => {
      const input = document.createElement('input');
      input.value = '11';
      const event = { target: input } as unknown as Event;
      component.onPhoneInput(event);
      expect(input.value).toBe('(11');
    });
  });

  describe('Save Profile', () => {
    beforeEach(fakeAsync(() => {
      profileSpy.loadProfile.and.resolveTo(MOCK_PROFILE);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should save profile and show success toast', fakeAsync(() => {
      profileSpy.updateProfile.and.resolveTo();
      component.profileForm.controls.fullName.setValue('New Name');
      component.profileForm.markAsDirty();
      fixture.detectChanges();

      component.onSubmit();
      expect(component.saving()).toBe(true);
      tick();
      fixture.detectChanges();

      expect(profileSpy.updateProfile).toHaveBeenCalledWith({
        fullName: 'New Name',
        phone: '11999999999',
      });
      expect(toastSpy.success).toHaveBeenCalledWith('Perfil atualizado com sucesso!');
      expect(component.saving()).toBe(false);
    }));

    it('should include phone when provided', fakeAsync(() => {
      profileSpy.updateProfile.and.resolveTo();
      component.profileForm.controls.fullName.setValue('Test');
      component.profileForm.controls.phone.setValue('11999999999');
      component.profileForm.markAsDirty();

      component.onSubmit();
      tick();

      expect(profileSpy.updateProfile).toHaveBeenCalledWith({
        fullName: 'Test',
        phone: '11999999999',
      });
    }));

    it('should show error toast on save failure', fakeAsync(() => {
      profileSpy.updateProfile.and.rejectWith(new Error('Save failed'));
      component.profileForm.controls.fullName.setValue('New Name');
      component.profileForm.markAsDirty();

      component.onSubmit();
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao salvar perfil. Tente novamente.');
      expect(component.saving()).toBe(false);
    }));

    it('should not save invalid form', fakeAsync(() => {
      component.profileForm.controls.fullName.setValue('');
      component.onSubmit();
      tick();

      expect(profileSpy.updateProfile).not.toHaveBeenCalled();
    }));

    it('should disable button when form is pristine', fakeAsync(() => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    }));

    it('should enable button when form is dirty and valid', fakeAsync(() => {
      component.profileForm.controls.fullName.setValue('Modified');
      component.profileForm.markAsDirty();
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    }));

    it('should show saving text while saving', fakeAsync(() => {
      profileSpy.updateProfile.and.returnValue(new Promise(() => { /* pending */ }));
      component.profileForm.controls.fullName.setValue('Modified');
      component.profileForm.markAsDirty();
      fixture.detectChanges();

      component.onSubmit();
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.textContent?.trim()).toContain('Salvando...');
    }));
  });
});

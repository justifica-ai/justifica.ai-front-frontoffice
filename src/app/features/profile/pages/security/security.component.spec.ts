import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SecurityComponent } from './security.component';
import { ProfileService } from '../../../onboarding/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { UserSession } from '../../../../core/models/user.model';

const MOCK_SESSIONS: UserSession[] = [
  { id: 's-001', device: 'Chrome - Windows', ipMasked: '192.168.*.1', lastAccessAt: '2025-01-15 14:00', isCurrent: true },
  { id: 's-002', device: 'Firefox - Linux', ipMasked: '10.0.*.5', lastAccessAt: '2025-01-14 10:30', isCurrent: false },
];

describe('SecurityComponent', () => {
  let fixture: ComponentFixture<SecurityComponent>;
  let component: SecurityComponent;
  let profileSpy: jasmine.SpyObj<ProfileService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    profileSpy = jasmine.createSpyObj('ProfileService', [
      'changePassword',
      'loadSessions',
      'endSession',
    ]);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    profileSpy.loadSessions.and.resolveTo([...MOCK_SESSIONS]);

    await TestBed.configureTestingModule({
      imports: [SecurityComponent],
      providers: [
        { provide: ProfileService, useValue: profileSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityComponent);
    component = fixture.componentInstance;
  });

  describe('Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should start loading sessions', () => {
      expect(component.loadingSessions()).toBe(true);
    });

    it('should not be changing password initially', () => {
      expect(component.changingPassword()).toBe(false);
    });

    it('should have empty sessions initially', () => {
      expect(component.sessions().length).toBe(0);
    });
  });

  describe('Session Loading', () => {
    it('should load sessions on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(profileSpy.loadSessions).toHaveBeenCalled();
      expect(component.sessions().length).toBe(2);
      expect(component.loadingSessions()).toBe(false);
    }));

    it('should show loading skeleton while loading', () => {
      fixture.detectChanges();
      const skeleton = fixture.nativeElement.querySelector('.animate-pulse');
      expect(skeleton).toBeTruthy();
    });

    it('should display sessions after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const sessionItems = fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>;
      expect(sessionItems.length).toBe(2);
    }));

    it('should mark current session', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const currentBadge = fixture.nativeElement.querySelector('.text-brand-600') as HTMLElement;
      expect(currentBadge).toBeTruthy();
      expect(currentBadge.textContent).toContain('(sessão atual)');
    }));

    it('should not show end button for current session', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('li button') as NodeListOf<HTMLButtonElement>;
      expect(buttons.length).toBe(1);
    }));

    it('should show empty message when no sessions', fakeAsync(() => {
      profileSpy.loadSessions.and.resolveTo([]);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Nenhuma sessão ativa encontrada');
    }));

    it('should show error toast on load failure', fakeAsync(() => {
      profileSpy.loadSessions.and.rejectWith(new Error('Network'));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao carregar sessões.');
      expect(component.loadingSessions()).toBe(false);
    }));
  });

  describe('End Session', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should end session and remove from list', fakeAsync(() => {
      profileSpy.endSession.and.resolveTo();
      component.onEndSession('s-002');
      expect(component.endingSession()).toBe('s-002');
      tick();

      expect(profileSpy.endSession).toHaveBeenCalledWith('s-002');
      expect(component.sessions().length).toBe(1);
      expect(toastSpy.success).toHaveBeenCalledWith('Sessão encerrada com sucesso!');
      expect(component.endingSession()).toBeNull();
    }));

    it('should show error on end session failure', fakeAsync(() => {
      profileSpy.endSession.and.rejectWith(new Error('Fail'));
      component.onEndSession('s-002');
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao encerrar sessão.');
      expect(component.sessions().length).toBe(2);
      expect(component.endingSession()).toBeNull();
    }));

    it('should show "Encerrando..." while ending', fakeAsync(() => {
      profileSpy.endSession.and.returnValue(new Promise(() => { /* pending */ }));
      component.onEndSession('s-002');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('li button') as HTMLButtonElement;
      expect(button.textContent?.trim()).toContain('Encerrando...');
    }));
  });

  describe('Password Form', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should render password form with 3 fields', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
      expect(inputs.length).toBe(3);
    });

    it('should require current password', () => {
      component.passwordForm.controls.currentPassword.setValue('');
      component.passwordForm.controls.currentPassword.markAsTouched();
      expect(component.showPasswordError('currentPassword')).toBe(true);
    });

    it('should require new password', () => {
      component.passwordForm.controls.newPassword.setValue('');
      component.passwordForm.controls.newPassword.markAsTouched();
      expect(component.showPasswordError('newPassword')).toBe(true);
    });

    it('should require minimum 8 chars for new password', () => {
      component.passwordForm.controls.newPassword.setValue('short');
      component.passwordForm.controls.newPassword.markAsTouched();
      expect(component.showPasswordError('newPassword')).toBe(true);
      expect(component.passwordForm.controls.newPassword.hasError('minlength')).toBe(true);
    });

    it('should require confirm password', () => {
      component.passwordForm.controls.confirmPassword.setValue('');
      component.passwordForm.controls.confirmPassword.markAsTouched();
      expect(component.showPasswordError('confirmPassword')).toBe(true);
    });

    it('should detect password mismatch', () => {
      component.passwordForm.controls.newPassword.setValue('password123');
      component.passwordForm.controls.confirmPassword.setValue('different');
      component.passwordForm.controls.confirmPassword.markAsTouched();
      expect(component.showMismatchError()).toBe(true);
    });

    it('should not show mismatch when passwords match', () => {
      component.passwordForm.controls.newPassword.setValue('password123');
      component.passwordForm.controls.confirmPassword.setValue('password123');
      component.passwordForm.controls.confirmPassword.markAsTouched();
      expect(component.showMismatchError()).toBe(false);
    });

    it('should not show mismatch when confirm is empty (required error takes priority)', () => {
      component.passwordForm.controls.newPassword.setValue('password123');
      component.passwordForm.controls.confirmPassword.setValue('');
      component.passwordForm.controls.confirmPassword.markAsTouched();
      expect(component.showMismatchError()).toBe(false);
    });
  });

  describe('Change Password', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should not submit invalid form', fakeAsync(() => {
      component.onChangePassword();
      tick();
      expect(profileSpy.changePassword).not.toHaveBeenCalled();
    }));

    it('should change password successfully', fakeAsync(() => {
      profileSpy.changePassword.and.resolveTo();
      component.passwordForm.setValue({
        currentPassword: 'oldPass123',
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });

      component.onChangePassword();
      expect(component.changingPassword()).toBe(true);
      tick();

      expect(profileSpy.changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldPass123',
        newPassword: 'newPass123',
      });
      expect(toastSpy.success).toHaveBeenCalledWith('Senha alterada com sucesso!');
      expect(component.changingPassword()).toBe(false);
    }));

    it('should reset form after successful change', fakeAsync(() => {
      profileSpy.changePassword.and.resolveTo();
      component.passwordForm.setValue({
        currentPassword: 'old',
        newPassword: 'newPass12',
        confirmPassword: 'newPass12',
      });

      component.onChangePassword();
      tick();

      expect(component.passwordForm.controls.currentPassword.value).toBe('');
    }));

    it('should show error on change failure', fakeAsync(() => {
      profileSpy.changePassword.and.rejectWith(new Error('Fail'));
      component.passwordForm.setValue({
        currentPassword: 'old',
        newPassword: 'newPass12',
        confirmPassword: 'newPass12',
      });

      component.onChangePassword();
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao alterar senha. Verifique sua senha atual.');
      expect(component.changingPassword()).toBe(false);
    }));

    it('should render "Alterar senha" button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button[type="submit"]') as NodeListOf<HTMLButtonElement>;
      expect(buttons.length).toBe(1);
      expect(buttons[0].textContent?.trim()).toContain('Alterar senha');
    });

    it('should have required marker labels', () => {
      const labels = fixture.nativeElement.querySelectorAll('label') as NodeListOf<HTMLElement>;
      const requiredLabels = Array.from(labels).filter((l) => l.textContent?.includes('*'));
      expect(requiredLabels.length).toBe(3);
    });
  });

  describe('Accessibility', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have accessible session list', () => {
      const list = fixture.nativeElement.querySelector('[role="list"]') as HTMLElement;
      expect(list).toBeTruthy();
      expect(list.getAttribute('aria-label')).toContain('sessões ativas');
    });

    it('should have aria-label on end session buttons', () => {
      const button = fixture.nativeElement.querySelector('li button') as HTMLButtonElement;
      expect(button.getAttribute('aria-label')).toContain('Encerrar sessão');
    });

    it('should have autocomplete attributes on password fields', () => {
      const current = fixture.nativeElement.querySelector('#currentPassword') as HTMLInputElement;
      const newPass = fixture.nativeElement.querySelector('#newPassword') as HTMLInputElement;
      expect(current.autocomplete).toBe('current-password');
      expect(newPass.autocomplete).toBe('new-password');
    });
  });
});

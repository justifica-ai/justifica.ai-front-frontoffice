import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PrivacySettingsComponent } from './privacy-settings.component';
import { ProfileService } from '../../../onboarding/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { UserProfile } from '../../../../core/models/user.model';
import { type WritableSignal, signal } from '@angular/core';

const MOCK_PROFILE: UserProfile = {
  id: 'u-001',
  email: 'test@example.com',
  fullName: 'Test User',
  phone: '11999999999',
  role: 'user',
  status: 'active',
  emailVerified: true,
  onboardingCompleted: true,
  communicationPreferences: { emailMarketing: true, whatsapp: true, sms: false },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('PrivacySettingsComponent', () => {
  let fixture: ComponentFixture<PrivacySettingsComponent>;
  let component: PrivacySettingsComponent;
  let profileSpy: jasmine.SpyObj<ProfileService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let profileSignal: WritableSignal<UserProfile | null>;

  function createComponent(profileOverrides: Partial<UserProfile> = {}): void {
    const profile = { ...MOCK_PROFILE, ...profileOverrides };
    profileSignal.set(profile);
    fixture = TestBed.createComponent(PrivacySettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    profileSignal = signal<UserProfile | null>(MOCK_PROFILE);

    profileSpy = jasmine.createSpyObj('ProfileService', [
      'loadProfile',
      'requestDataExport',
      'downloadDataExport',
      'requestDeletion',
      'cancelDeletion',
      'revokeConsent',
    ], {
      profile: profileSignal,
    });

    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [PrivacySettingsComponent],
      providers: [
        provideRouter([]),
        { provide: ProfileService, useValue: profileSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();
  });

  describe('Creation & Init', () => {
    it('should create', fakeAsync(() => {
      createComponent();
      expect(component).toBeTruthy();
    }));

    it('should load profile on init when cached', fakeAsync(() => {
      createComponent();
      expect(component.loading()).toBe(false);
      expect(component.userStatus()).toBe('active');
    }));

    it('should call loadProfile when no cached profile', fakeAsync(() => {
      profileSignal.set(null);
      profileSpy.loadProfile.and.resolveTo(MOCK_PROFILE);

      fixture = TestBed.createComponent(PrivacySettingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(profileSpy.loadProfile).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    }));

    it('should handle init error gracefully', fakeAsync(() => {
      profileSignal.set(null);
      profileSpy.loadProfile.and.rejectWith(new Error('fail'));

      fixture = TestBed.createComponent(PrivacySettingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao carregar dados de privacidade.');
      expect(component.loading()).toBe(false);
    }));

    it('should detect marketing consent from preferences', fakeAsync(() => {
      createComponent({ communicationPreferences: { emailMarketing: false, whatsapp: true, sms: false } });
      expect(component.hasMarketingConsent()).toBe(true);
    }));

    it('should detect no marketing consent when all disabled', fakeAsync(() => {
      createComponent({ communicationPreferences: { emailMarketing: false, whatsapp: false, sms: false } });
      expect(component.hasMarketingConsent()).toBe(false);
    }));

    it('should detect pending deletion status', fakeAsync(() => {
      createComponent({ status: 'pending_deletion' });
      expect(component.isPendingDeletion()).toBe(true);
    }));

    it('should default to active when no status', fakeAsync(() => {
      const profile = { ...MOCK_PROFILE };
      delete (profile as Record<string, unknown>)['status'];
      profileSignal.set(profile);
      fixture = TestBed.createComponent(PrivacySettingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      expect(component.userStatus()).toBe('active');
    }));
  });

  describe('LGPD Info', () => {
    beforeEach(fakeAsync(() => {
      createComponent();
    }));

    it('should display LGPD rights section', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Seus direitos (LGPD)');
      expect(text).toContain('Lei Geral de Proteção de Dados');
    });

    it('should mention Lei 13.709/2018', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('13.709/2018');
    });
  });

  describe('Consent Management', () => {
    it('should show revoke button when marketing consent is active', fakeAsync(() => {
      createComponent();
      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const revokeBtn = Array.from(buttons).find((b) =>
        b.textContent?.includes('Revogar consentimento'),
      );
      expect(revokeBtn).toBeTruthy();
    }));

    it('should show no-consent message when marketing is disabled', fakeAsync(() => {
      createComponent({ communicationPreferences: { emailMarketing: false, whatsapp: false, sms: false } });
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Nenhum consentimento de marketing ativo');
    }));

    it('should revoke consent successfully', fakeAsync(() => {
      createComponent();
      profileSpy.revokeConsent.and.resolveTo({ message: 'ok' });

      component.onRevokeConsent();
      expect(component.revokingConsent()).toBe(true);
      tick();

      expect(profileSpy.revokeConsent).toHaveBeenCalledWith('marketing_consent');
      expect(component.hasMarketingConsent()).toBe(false);
      expect(toastSpy.success).toHaveBeenCalledWith('Consentimento de marketing revogado com sucesso.');
      expect(component.revokingConsent()).toBe(false);
    }));

    it('should handle revoke consent error', fakeAsync(() => {
      createComponent();
      profileSpy.revokeConsent.and.rejectWith(new Error('fail'));

      component.onRevokeConsent();
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao revogar consentimento. Tente novamente.');
      expect(component.revokingConsent()).toBe(false);
    }));

    it('should show "Revogando..." while revoking', fakeAsync(() => {
      createComponent();
      profileSpy.revokeConsent.and.returnValue(new Promise(() => { /* pending */ }));

      component.onRevokeConsent();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const revokeBtn = Array.from(buttons).find((b) =>
        b.textContent?.includes('Revogando...'),
      );
      expect(revokeBtn).toBeTruthy();
    }));

    it('should show loading skeleton on init', fakeAsync(() => {
      profileSignal.set(null);
      profileSpy.loadProfile.and.returnValue(new Promise(() => { /* pending */ }));

      fixture = TestBed.createComponent(PrivacySettingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const skeleton = fixture.nativeElement.querySelector('.animate-pulse');
      expect(skeleton).toBeTruthy();
    }));
  });

  describe('Export Data', () => {
    beforeEach(fakeAsync(() => {
      createComponent();
    }));

    it('should render export button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const exportBtn = Array.from(buttons).find((b) =>
        b.textContent?.includes('Exportar meus dados'),
      );
      expect(exportBtn).toBeTruthy();
    });

    it('should export data and trigger download', fakeAsync(() => {
      const mockBlob = new Blob(['{}'], { type: 'application/json' });
      profileSpy.requestDataExport.and.resolveTo({ message: 'ok' });
      profileSpy.downloadDataExport.and.resolveTo(mockBlob);

      spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
      spyOn(URL, 'revokeObjectURL');

      component.onExportData();
      expect(component.exporting()).toBe(true);
      tick();

      expect(profileSpy.requestDataExport).toHaveBeenCalled();
      expect(profileSpy.downloadDataExport).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
      expect(toastSpy.success).toHaveBeenCalledWith('Dados exportados com sucesso!');
      expect(component.exporting()).toBe(false);
    }));

    it('should show error on export failure', fakeAsync(() => {
      profileSpy.requestDataExport.and.rejectWith(new Error('Fail'));
      component.onExportData();
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao exportar dados. Tente novamente.');
      expect(component.exporting()).toBe(false);
    }));

    it('should show error on download failure', fakeAsync(() => {
      profileSpy.requestDataExport.and.resolveTo({ message: 'ok' });
      profileSpy.downloadDataExport.and.rejectWith(new Error('Fail'));
      component.onExportData();
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao exportar dados. Tente novamente.');
      expect(component.exporting()).toBe(false);
    }));

    it('should show "Exportando..." while exporting', fakeAsync(() => {
      profileSpy.requestDataExport.and.returnValue(new Promise(() => { /* pending */ }));
      component.onExportData();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const exportBtn = Array.from(buttons).find((b) =>
        b.textContent?.includes('Exportando...'),
      );
      expect(exportBtn).toBeTruthy();
    }));
  });

  describe('Delete Account — Normal State', () => {
    beforeEach(fakeAsync(() => {
      createComponent();
    }));

    it('should render initial delete button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const deleteBtn = Array.from(buttons).find((b) =>
        b.textContent?.includes('Solicitar exclusão'),
      );
      expect(deleteBtn).toBeTruthy();
    });

    it('should show password confirmation when clicking delete', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      const alertDialog = fixture.nativeElement.querySelector('[role="alertdialog"]') as HTMLElement;
      expect(alertDialog).toBeTruthy();
      expect(alertDialog.textContent).toContain('senha atual');
    });

    it('should have password input in confirmation dialog', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('#delete-password') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('password');
    });

    it('should have confirm and cancel buttons in confirmation', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('[role="alertdialog"] button') as NodeListOf<HTMLButtonElement>;
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent?.trim()).toContain('Confirmar exclusão');
      expect(buttons[1].textContent?.trim()).toContain('Cancelar');
    });

    it('should disable confirm button when password is empty', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('[role="alertdialog"] button') as NodeListOf<HTMLButtonElement>;
      expect(buttons[0].disabled).toBe(true);
    });

    it('should cancel deletion and hide confirmation', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      component.onCancelDeleteForm();
      fixture.detectChanges();

      const alertDialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
      expect(alertDialog).toBeFalsy();
      expect(component.passwordControl.value).toBe('');
    });

    it('should request deletion successfully', fakeAsync(() => {
      profileSpy.requestDeletion.and.resolveTo({ message: 'ok' });

      component.showDeleteConfirm.set(true);
      component.passwordControl.setValue('mypassword');
      component.onRequestDeletion();
      expect(component.deleting()).toBe(true);
      tick();

      expect(profileSpy.requestDeletion).toHaveBeenCalledWith('mypassword');
      expect(component.userStatus()).toBe('pending_deletion');
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.passwordControl.value).toBe('');
      expect(toastSpy.success).toHaveBeenCalledWith('Solicitação de exclusão registrada. Você tem 7 dias para cancelar.');
      expect(component.deleting()).toBe(false);
    }));

    it('should not request deletion when password is invalid', fakeAsync(() => {
      component.passwordControl.setValue('');
      component.onRequestDeletion();
      tick();

      expect(profileSpy.requestDeletion).not.toHaveBeenCalled();
    }));

    it('should show error on deletion request failure', fakeAsync(() => {
      profileSpy.requestDeletion.and.rejectWith(new Error('Fail'));

      component.passwordControl.setValue('wrong');
      component.onRequestDeletion();
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao solicitar exclusão. Verifique sua senha e tente novamente.');
      expect(component.deleting()).toBe(false);
    }));

    it('should show "Solicitando..." while requesting deletion', fakeAsync(() => {
      profileSpy.requestDeletion.and.returnValue(new Promise(() => { /* pending */ }));
      component.showDeleteConfirm.set(true);
      component.passwordControl.setValue('pass');
      fixture.detectChanges();

      component.onRequestDeletion();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('[role="alertdialog"] button') as NodeListOf<HTMLButtonElement>;
      expect(buttons[0].textContent?.trim()).toContain('Solicitando...');
    }));
  });

  describe('Delete Account — Pending Deletion State', () => {
    beforeEach(fakeAsync(() => {
      createComponent({ status: 'pending_deletion' });
    }));

    it('should show pending deletion alert', () => {
      const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('Exclusão de conta solicitada');
    });

    it('should show cancel deletion button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const cancelBtn = Array.from(buttons).find((b) =>
        b.textContent?.includes('Cancelar exclusão'),
      );
      expect(cancelBtn).toBeTruthy();
    });

    it('should not show initial delete button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const deleteBtn = Array.from(buttons).find((b) =>
        b.textContent?.includes('Solicitar exclusão'),
      );
      expect(deleteBtn).toBeFalsy();
    });

    it('should cancel deletion successfully', fakeAsync(() => {
      profileSpy.cancelDeletion.and.resolveTo({ message: 'ok' });

      component.onCancelDeletion();
      expect(component.cancelling()).toBe(true);
      tick();

      expect(profileSpy.cancelDeletion).toHaveBeenCalled();
      expect(component.userStatus()).toBe('active');
      expect(toastSpy.success).toHaveBeenCalledWith('Exclusão cancelada. Sua conta foi reativada.');
      expect(component.cancelling()).toBe(false);
    }));

    it('should show error on cancel deletion failure', fakeAsync(() => {
      profileSpy.cancelDeletion.and.rejectWith(new Error('fail'));

      component.onCancelDeletion();
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao cancelar exclusão. Tente novamente.');
      expect(component.cancelling()).toBe(false);
    }));

    it('should show "Cancelando..." while cancelling', fakeAsync(() => {
      profileSpy.cancelDeletion.and.returnValue(new Promise(() => { /* pending */ }));

      component.onCancelDeletion();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const cancelBtn = Array.from(buttons).find((b) =>
        b.textContent?.includes('Cancelando...'),
      );
      expect(cancelBtn).toBeTruthy();
    }));

    it('should mention 7-day period', () => {
      const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
      expect(alert.textContent).toContain('7 dias');
    });
  });

  describe('Section Headers', () => {
    beforeEach(fakeAsync(() => {
      createComponent();
    }));

    it('should have export section header', () => {
      const headings = fixture.nativeElement.querySelectorAll('h2') as NodeListOf<HTMLElement>;
      const exportHeading = Array.from(headings).find((h) =>
        h.textContent?.includes('Exportar'),
      );
      expect(exportHeading).toBeTruthy();
    });

    it('should have delete section header with error color', () => {
      const headings = fixture.nativeElement.querySelectorAll('h2') as NodeListOf<HTMLElement>;
      const deleteHeading = Array.from(headings).find((h) =>
        h.textContent?.includes('Excluir'),
      );
      expect(deleteHeading).toBeTruthy();
      expect(deleteHeading?.classList.contains('text-error-700')).toBe(true);
    });

    it('should have consent section header', () => {
      const headings = fixture.nativeElement.querySelectorAll('h2') as NodeListOf<HTMLElement>;
      const consentHeading = Array.from(headings).find((h) =>
        h.textContent?.includes('Consentimento'),
      );
      expect(consentHeading).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    beforeEach(fakeAsync(() => {
      createComponent();
    }));

    it('should have aria-label on delete dialog', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]') as HTMLElement;
      expect(dialog.getAttribute('aria-label')).toBe('Confirmar exclusão de conta');
    });

    it('should have label for password input', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('label[for="delete-password"]') as HTMLLabelElement;
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('Senha');
    });

    it('should have aria-describedby on password input', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('#delete-password') as HTMLInputElement;
      expect(input.getAttribute('aria-describedby')).toBe('delete-password-hint');
    });

    it('should have sr-only text for required field', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      const srOnly = fixture.nativeElement.querySelector('.sr-only') as HTMLElement;
      expect(srOnly.textContent).toContain('obrigatório');
    });
  });
});

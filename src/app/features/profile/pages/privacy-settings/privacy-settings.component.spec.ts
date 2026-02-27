import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { PrivacySettingsComponent } from './privacy-settings.component';
import { ProfileService } from '../../../onboarding/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';

describe('PrivacySettingsComponent', () => {
  let fixture: ComponentFixture<PrivacySettingsComponent>;
  let component: PrivacySettingsComponent;
  let profileSpy: jasmine.SpyObj<ProfileService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  beforeEach(async () => {
    profileSpy = jasmine.createSpyObj('ProfileService', ['exportData', 'deleteAccount']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [PrivacySettingsComponent],
      providers: [
        provideRouter([]),
        { provide: ProfileService, useValue: profileSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(PrivacySettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should not be exporting initially', () => {
      expect(component.exporting()).toBe(false);
    });

    it('should not be deleting initially', () => {
      expect(component.deleting()).toBe(false);
    });

    it('should not show delete confirmation initially', () => {
      expect(component.showDeleteConfirm()).toBe(false);
    });
  });

  describe('LGPD Info', () => {
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

  describe('Export Data', () => {
    it('should render export button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const exportBtn = Array.from(buttons).find((b) =>
        b.textContent?.includes('Exportar meus dados'),
      );
      expect(exportBtn).toBeTruthy();
    });

    it('should export data and trigger download', fakeAsync(() => {
      const mockBlob = new Blob(['{}'], { type: 'application/json' });
      profileSpy.exportData.and.resolveTo(mockBlob);

      spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
      spyOn(URL, 'revokeObjectURL');

      component.onExportData();
      expect(component.exporting()).toBe(true);
      tick();

      expect(profileSpy.exportData).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
      expect(toastSpy.success).toHaveBeenCalledWith('Dados exportados com sucesso!');
      expect(component.exporting()).toBe(false);
    }));

    it('should show error on export failure', fakeAsync(() => {
      profileSpy.exportData.and.rejectWith(new Error('Fail'));
      component.onExportData();
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao exportar dados. Tente novamente.');
      expect(component.exporting()).toBe(false);
    }));

    it('should show "Exportando..." while exporting', fakeAsync(() => {
      profileSpy.exportData.and.returnValue(new Promise(() => { /* pending */ }));
      component.onExportData();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const exportBtn = Array.from(buttons).find((b) =>
        b.textContent?.includes('Exportando...'),
      );
      expect(exportBtn).toBeTruthy();
    }));
  });

  describe('Delete Account', () => {
    it('should render initial delete button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const deleteBtn = Array.from(buttons).find((b) =>
        b.textContent?.includes('Solicitar exclusão'),
      );
      expect(deleteBtn).toBeTruthy();
    });

    it('should show confirmation when clicking delete', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      const alertDialog = fixture.nativeElement.querySelector('[role="alertdialog"]') as HTMLElement;
      expect(alertDialog).toBeTruthy();
      expect(alertDialog.textContent).toContain('Tem certeza');
    });

    it('should have confirm and cancel buttons in confirmation', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('[role="alertdialog"] button') as NodeListOf<HTMLButtonElement>;
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent?.trim()).toContain('Sim, excluir');
      expect(buttons[1].textContent?.trim()).toContain('Cancelar');
    });

    it('should cancel deletion and hide confirmation', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      component.showDeleteConfirm.set(false);
      fixture.detectChanges();

      const alertDialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
      expect(alertDialog).toBeFalsy();
    });

    it('should delete account successfully', fakeAsync(() => {
      profileSpy.deleteAccount.and.resolveTo();

      component.showDeleteConfirm.set(true);
      component.onDeleteAccount();
      expect(component.deleting()).toBe(true);
      tick();

      expect(profileSpy.deleteAccount).toHaveBeenCalled();
      expect(toastSpy.success).toHaveBeenCalledWith('Conta excluída. Você será redirecionado.');
      expect(router.navigate).toHaveBeenCalledWith(['/']);
      expect(component.deleting()).toBe(false);
    }));

    it('should show error on delete failure', fakeAsync(() => {
      profileSpy.deleteAccount.and.rejectWith(new Error('Fail'));
      component.onDeleteAccount();
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao excluir conta. Tente novamente.');
      expect(component.deleting()).toBe(false);
    }));

    it('should show "Excluindo..." while deleting', fakeAsync(() => {
      profileSpy.deleteAccount.and.returnValue(new Promise(() => { /* pending */ }));
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      component.onDeleteAccount();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('[role="alertdialog"] button') as NodeListOf<HTMLButtonElement>;
      expect(buttons[0].textContent?.trim()).toContain('Excluindo...');
    }));
  });

  describe('Section Headers', () => {
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
  });
});

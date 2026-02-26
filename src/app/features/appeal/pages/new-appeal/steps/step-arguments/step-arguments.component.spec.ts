import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StepArgumentsComponent } from './step-arguments.component';
import { AppealFormService } from '../../../../services/appeal-form.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { APPEAL_FORM_STORAGE_KEY } from '../../../../models/appeal-form.model';

describe('StepArgumentsComponent', () => {
  let component: StepArgumentsComponent;
  let fixture: ComponentFixture<StepArgumentsComponent>;
  let formService: AppealFormService;

  beforeEach(async () => {
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [StepArgumentsComponent],
      providers: [
        AppealFormService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    formService = TestBed.inject(AppealFormService);
    localStorage.removeItem(APPEAL_FORM_STORAGE_KEY);
    formService.initialize('first_instance');
    formService.goToStep(3);

    fixture = TestBed.createComponent(StepArgumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    formService.ngOnDestroy();
    localStorage.removeItem(APPEAL_FORM_STORAGE_KEY);
  });

  // =========================================================================
  // Creation
  // =========================================================================
  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should display the section title', () => {
      const h2 = fixture.nativeElement.querySelector('h2');
      expect(h2?.textContent).toContain('Argumentos de Defesa');
    });
  });

  // =========================================================================
  // Defense reason chips
  // =========================================================================
  describe('Defense reason chips', () => {
    it('should render 12 defense reason chips', () => {
      const chips = fixture.nativeElement.querySelectorAll('[aria-pressed]');
      expect(chips.length).toBe(12);
    });

    it('should toggle a reason on click', () => {
      const before = component.selectedReasons().length;
      component.toggleReason('D01');
      fixture.detectChanges();
      expect(component.selectedReasons().length).toBe(before + 1);
      expect(component.selectedReasons()).toContain('D01');
    });

    it('should deselect a reason on second click', () => {
      component.toggleReason('D01');
      component.toggleReason('D01');
      fixture.detectChanges();
      expect(component.selectedReasons()).not.toContain('D01');
    });

    it('should allow multiple selections', () => {
      const before = component.selectedReasons().length;
      component.toggleReason('D01');
      component.toggleReason('D03');
      component.toggleReason('D07');
      fixture.detectChanges();
      expect(component.selectedReasons().length).toBe(before + 3);
    });

    it('should sync selected reasons to service', () => {
      component.toggleReason('D02');
      component.toggleReason('D05');
      fixture.detectChanges();
      expect(formService.formState().arguments.defenseReasons).toContain('D02');
      expect(formService.formState().arguments.defenseReasons).toContain('D05');
    });
  });

  // =========================================================================
  // Validation
  // =========================================================================
  describe('Validation', () => {
    it('should require at least one defense reason to continue', () => {
      // Ensure no reasons selected
      component.selectedReasons.set([]);
      const stepBefore = formService.currentStep();
      component.onContinue();
      expect(component.submitted()).toBe(true);
      expect(formService.currentStep()).toBe(stepBefore);
    });

    it('should show error message when no reasons selected', () => {
      component.selectedReasons.set([]);
      component.onContinue();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('[role="alert"]');
      expect(error?.textContent).toContain('Selecione ao menos um motivo');
    });

    it('should navigate when at least one reason is selected', () => {
      const stepBefore = formService.currentStep();
      component.toggleReason('D01');
      fixture.detectChanges();
      component.onContinue();
      expect(formService.currentStep()).toBe(stepBefore + 1);
    });
  });

  // =========================================================================
  // Additional details
  // =========================================================================
  describe('Additional details', () => {
    it('should have textarea for additional details', () => {
      const textarea = fixture.nativeElement.querySelector('#additionalDetails');
      expect(textarea).toBeTruthy();
    });

    it('should sync additional details to service', () => {
      component.form.controls.additionalDetails.setValue('Teste de detalhes');
      expect(formService.formState().arguments.additionalDetails).toBe('Teste de detalhes');
    });
  });

  // =========================================================================
  // File upload area
  // =========================================================================
  describe('File upload area', () => {
    it('should have drag-and-drop area', () => {
      const dropzone = fixture.nativeElement.querySelector('[class*="border-dashed"]');
      expect(dropzone).toBeTruthy();
    });

    it('should have file select button', () => {
      const fileInput = fixture.nativeElement.querySelector('input[type="file"]');
      expect(fileInput).toBeTruthy();
    });

    it('should accept correct file types', () => {
      const fileInput = fixture.nativeElement.querySelector('input[type="file"]');
      expect(fileInput?.getAttribute('accept')).toContain('image/*');
      expect(fileInput?.getAttribute('accept')).toContain('.pdf');
    });

    it('should set isDragging on dragover', () => {
      const event = new DragEvent('dragover', { bubbles: true, cancelable: true });
      component.onDragOver(event);
      expect(component.isDragging()).toBe(true);
    });

    it('should reset isDragging on dragleave', () => {
      component.isDragging.set(true);
      const event = new DragEvent('dragleave', { bubbles: true, cancelable: true });
      component.onDragLeave(event);
      expect(component.isDragging()).toBe(false);
    });
  });

  // =========================================================================
  // File list
  // =========================================================================
  describe('File list', () => {
    it('should format file sizes correctly', () => {
      expect(component.formatFileSize(500)).toBe('500 B');
      expect(component.formatFileSize(2048)).toBe('2.0 KB');
      expect(component.formatFileSize(5242880)).toBe('5.0 MB');
    });

    it('should remove file from list', () => {
      formService.addUploadedFile({
        id: 'f1', name: 'test.pdf', size: 1024, type: 'application/pdf', progress: 100, status: 'done',
      });
      component.uploadedFiles.set([...formService.formState().uploadedFiles]);
      component.removeFile('f1');
      expect(component.uploadedFiles().length).toBe(0);
    });
  });

  // =========================================================================
  // Navigation
  // =========================================================================
  describe('Navigation', () => {
    it('should go back on onBack', () => {
      const stepBefore = formService.currentStep();
      component.onBack();
      expect(formService.currentStep()).toBe(stepBefore - 1);
    });

    it('should have Revisar recurso button text', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button[type="submit"]');
      const submitButton = buttons[0];
      expect(submitButton?.textContent).toContain('Revisar recurso');
    });
  });

  // =========================================================================
  // Pre-fill
  // =========================================================================
  describe('Pre-fill', () => {
    it('should restore selected reasons from service', () => {
      formService.updateArguments({ defenseReasons: ['D04', 'D06'] });

      fixture = TestBed.createComponent(StepArgumentsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.selectedReasons()).toContain('D04');
      expect(component.selectedReasons()).toContain('D06');
    });
  });

  // =========================================================================
  // Accessibility
  // =========================================================================
  describe('Accessibility', () => {
    it('should have aria-pressed on chips', () => {
      const chips = fixture.nativeElement.querySelectorAll('[aria-pressed]');
      expect(chips.length).toBe(12);
    });

    it('should have group role on chips container', () => {
      const group = fixture.nativeElement.querySelector('[role="group"]');
      expect(group).toBeTruthy();
      expect(group?.getAttribute('aria-label')).toBe('Motivos da defesa');
    });

    it('should have aria-label on file input', () => {
      const fileInput = fixture.nativeElement.querySelector('input[type="file"]');
      expect(fileInput?.getAttribute('aria-label')).toBeTruthy();
    });
  });
});

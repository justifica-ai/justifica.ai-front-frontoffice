import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StepDriverComponent } from './step-driver.component';
import { AppealFormService } from '../../../../services/appeal-form.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { APPEAL_FORM_STORAGE_KEY } from '../../../../models/appeal-form.model';

describe('StepDriverComponent', () => {
  let component: StepDriverComponent;
  let fixture: ComponentFixture<StepDriverComponent>;
  let formService: AppealFormService;

  beforeEach(async () => {
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [StepDriverComponent],
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
    formService.goToStep(2);

    fixture = TestBed.createComponent(StepDriverComponent);
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
      expect(h2?.textContent).toContain('Dados do Condutor');
    });
  });

  // =========================================================================
  // Owner toggle
  // =========================================================================
  describe('Owner toggle', () => {
    it('should have isOwner checked by default', () => {
      expect(formService.formState().driver.isOwner).toBe(true);
    });

    it('should hide driver name and CPF when isOwner is true', () => {
      expect(fixture.nativeElement.querySelector('#driverName')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('#driverCpf')).toBeFalsy();
    });

    it('should show driver name and CPF when isOwner is false', () => {
      component.form.controls.isOwner.setValue(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#driverName')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#driverCpf')).toBeTruthy();
    });
  });

  // =========================================================================
  // Conditional validation
  // =========================================================================
  describe('Conditional validation', () => {
    it('should not require driver name when isOwner', () => {
      component.onContinue();
      expect(formService.currentStep()).toBe(3);
    });

    it('should require driver name when NOT isOwner', () => {
      component.form.controls.isOwner.setValue(false);
      fixture.detectChanges();
      component.onContinue();
      expect(formService.currentStep()).toBe(2); // Stays on current step
    });

    it('should navigate when NOT isOwner but fields filled', () => {
      component.form.controls.isOwner.setValue(false);
      component.form.controls.driverName.setValue('João Silva');
      component.form.controls.driverCpf.setValue('529.982.247-25');
      fixture.detectChanges();
      component.onContinue();
      expect(formService.currentStep()).toBe(3);
    });
  });

  // =========================================================================
  // Form fields
  // =========================================================================
  describe('Form fields', () => {
    it('should have CNH input', () => {
      expect(fixture.nativeElement.querySelector('#driverCnh')).toBeTruthy();
    });

    it('should have CNH category select', () => {
      const select = fixture.nativeElement.querySelector('#driverCnhCategory');
      expect(select).toBeTruthy();
    });

    it('should have CNH expiry date input', () => {
      expect(fixture.nativeElement.querySelector('#driverCnhExpiry')).toBeTruthy();
    });

    it('should have back and continue buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const texts = Array.from(buttons as NodeListOf<HTMLButtonElement>).map(b => b.textContent?.trim());
      expect(texts).toContain('Voltar');
      expect(texts).toContain('Continuar');
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

    it('should sync data to service on continue', () => {
      component.form.controls.driverCnh.setValue('12345678901');
      component.form.controls.driverCnhCategory.setValue('B');
      component.onContinue();
      expect(formService.formState().driver.driverCnh).toBe('12345678901');
      expect(formService.formState().driver.driverCnhCategory).toBe('B');
    });
  });

  // =========================================================================
  // CPF formatting
  // =========================================================================
  describe('CPF formatting', () => {
    it('should format CPF on input', () => {
      component.form.controls.isOwner.setValue(false);
      fixture.detectChanges();
      component.form.controls.driverCpf.setValue('52998224725');
      component.onCpfInput();
      expect(component.form.controls.driverCpf.value).toBe('529.982.247-25');
    });
  });

  // =========================================================================
  // Accessibility
  // =========================================================================
  describe('Accessibility', () => {
    it('should have aria-label on toggle', () => {
      const toggle = fixture.nativeElement.querySelector('input[type="checkbox"]');
      expect(toggle?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have labels for all visible inputs', () => {
      const labels = fixture.nativeElement.querySelectorAll('label');
      expect(labels.length).toBeGreaterThanOrEqual(3);
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StepVehicleComponent } from './step-vehicle.component';
import { AppealFormService } from '../../../../services/appeal-form.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { APPEAL_FORM_STORAGE_KEY } from '../../../../models/appeal-form.model';

describe('StepVehicleComponent', () => {
  let component: StepVehicleComponent;
  let fixture: ComponentFixture<StepVehicleComponent>;
  let formService: AppealFormService;

  beforeEach(async () => {
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [StepVehicleComponent],
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

    fixture = TestBed.createComponent(StepVehicleComponent);
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
      expect(h2?.textContent).toContain('Dados do Veículo');
    });

    it('should have a form', () => {
      expect(component.form).toBeTruthy();
    });
  });

  // =========================================================================
  // Form fields
  // =========================================================================
  describe('Form fields', () => {
    it('should have plate input', () => {
      const input = fixture.nativeElement.querySelector('#plate');
      expect(input).toBeTruthy();
    });

    it('should have brand input', () => {
      const input = fixture.nativeElement.querySelector('#brand');
      expect(input).toBeTruthy();
    });

    it('should have model input', () => {
      const input = fixture.nativeElement.querySelector('#model');
      expect(input).toBeTruthy();
    });

    it('should have year input', () => {
      const input = fixture.nativeElement.querySelector('#year');
      expect(input).toBeTruthy();
    });

    it('should have renavam input', () => {
      const input = fixture.nativeElement.querySelector('#renavam');
      expect(input).toBeTruthy();
    });

    it('should have continue button', () => {
      const button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button?.textContent).toContain('Continuar');
    });
  });

  // =========================================================================
  // Validation
  // =========================================================================
  describe('Validation', () => {
    it('should require plate', () => {
      expect(component.form.controls.plate.valid).toBe(false);
    });

    it('should validate plate format', () => {
      component.form.controls.plate.setValue('ABC1D23');
      expect(component.form.controls.plate.valid).toBe(true);
    });

    it('should reject invalid plate format', () => {
      component.form.controls.plate.setValue('INVALID');
      expect(component.form.controls.plate.valid).toBe(false);
    });

    it('should show error after submit with invalid plate', () => {
      component.onContinue();
      fixture.detectChanges();
      expect(component.showFieldError('plate')).toBe(true);
    });

    it('should return correct error message for required field', () => {
      component.form.controls.plate.setValue('');
      component.form.controls.plate.markAsTouched();
      expect(component.getFieldError('plate')).toBe('Campo obrigatório');
    });

    it('should return correct error message for invalid plate pattern', () => {
      component.form.controls.plate.setValue('XX');
      component.form.controls.plate.markAsTouched();
      expect(component.getFieldError('plate')).toContain('Placa inválida');
    });
  });

  // =========================================================================
  // Plate formatting
  // =========================================================================
  describe('Plate formatting', () => {
    it('should uppercase plate input', () => {
      component.form.controls.plate.setValue('abc1d23');
      component.formatPlate();
      expect(component.form.controls.plate.value).toBe('ABC1D23');
    });

    it('should strip non-alphanumeric characters', () => {
      component.form.controls.plate.setValue('ABC-1D23');
      component.formatPlate();
      expect(component.form.controls.plate.value).toBe('ABC1D23');
    });
  });

  // =========================================================================
  // Service sync
  // =========================================================================
  describe('Service sync', () => {
    it('should sync values to service on continue', () => {
      component.form.controls.plate.setValue('ABC1D23');
      component.form.controls.brand.setValue('Toyota');
      component.onContinue();
      expect(formService.formState().vehicle.plate).toBe('ABC1D23');
      expect(formService.formState().vehicle.brand).toBe('Toyota');
    });

    it('should navigate to next step on valid submit', () => {
      const initialStep = formService.currentStep();
      component.form.controls.plate.setValue('ABC1D23');
      component.onContinue();
      expect(formService.currentStep()).toBe(initialStep + 1);
    });

    it('should NOT navigate to next step on invalid submit', () => {
      component.form.controls.plate.setValue('');
      const initialStep = formService.currentStep();
      component.onContinue();
      expect(formService.currentStep()).toBe(initialStep);
    });
  });

  // =========================================================================
  // Pre-fill from service
  // =========================================================================
  describe('Pre-fill', () => {
    it('should pre-fill from existing service state', () => {
      formService.updateVehicle({ plate: 'XYZ9A99', brand: 'Honda' });

      // Recreate component
      fixture = TestBed.createComponent(StepVehicleComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.form.controls.plate.value).toBe('XYZ9A99');
      expect(component.form.controls.brand.value).toBe('Honda');
    });
  });

  // =========================================================================
  // Accessibility
  // =========================================================================
  describe('Accessibility', () => {
    it('should have labels for all inputs', () => {
      const labels = fixture.nativeElement.querySelectorAll('label');
      expect(labels.length).toBeGreaterThanOrEqual(5);
    });

    it('should have aria-invalid on plate when error', () => {
      component.form.controls.plate.markAsTouched();
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('#plate');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });

    it('should show required indicator on plate label', () => {
      const label = fixture.nativeElement.querySelector('label[for="plate"]');
      expect(label?.textContent).toContain('*');
    });

    it('should have sr-only obrigatório text', () => {
      const srOnly = fixture.nativeElement.querySelector('.sr-only');
      expect(srOnly?.textContent).toContain('obrigatório');
    });
  });
});

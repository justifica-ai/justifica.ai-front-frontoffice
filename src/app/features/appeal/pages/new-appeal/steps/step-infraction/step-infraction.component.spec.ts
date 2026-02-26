import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StepInfractionComponent } from './step-infraction.component';
import { AppealFormService } from '../../../../services/appeal-form.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { APPEAL_FORM_STORAGE_KEY } from '../../../../models/appeal-form.model';

describe('StepInfractionComponent', () => {
  let component: StepInfractionComponent;
  let fixture: ComponentFixture<StepInfractionComponent>;
  let formService: AppealFormService;

  beforeEach(async () => {
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [StepInfractionComponent],
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
    formService.goToStep(1);

    fixture = TestBed.createComponent(StepInfractionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
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
      expect(h2?.textContent).toContain('Dados da Infração');
    });
  });

  // =========================================================================
  // Form fields
  // =========================================================================
  describe('Form fields', () => {
    it('should have autoNumber input', () => {
      expect(fixture.nativeElement.querySelector('#autoNumber')).toBeTruthy();
    });

    it('should have infractionDate input', () => {
      expect(fixture.nativeElement.querySelector('#infractionDate')).toBeTruthy();
    });

    it('should have infractionCode input with combobox role', () => {
      const input = fixture.nativeElement.querySelector('#infractionCode');
      expect(input?.getAttribute('role')).toBe('combobox');
    });

    it('should have back and continue buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const texts = Array.from(buttons as NodeListOf<HTMLButtonElement>).map(b => b.textContent?.trim());
      expect(texts).toContain('Voltar');
      expect(texts).toContain('Continuar');
    });
  });

  // =========================================================================
  // Validation
  // =========================================================================
  describe('Validation', () => {
    it('should require autoNumber', () => {
      expect(component.form.controls.autoNumber.valid).toBe(false);
    });

    it('should require infractionDate', () => {
      expect(component.form.controls.infractionDate.valid).toBe(false);
    });

    it('should require infractionCode', () => {
      expect(component.form.controls.infractionCode.valid).toBe(false);
    });

    it('should not require optional fields', () => {
      expect(component.form.controls.infractionTime.valid).toBe(true);
      expect(component.form.controls.location.valid).toBe(true);
      expect(component.form.controls.organName.valid).toBe(true);
    });
  });

  // =========================================================================
  // CTB Autocomplete
  // =========================================================================
  describe('CTB Autocomplete', () => {
    it('should not show suggestions initially', () => {
      expect(component.showSuggestions()).toBe(false);
    });

    it('should not be searching initially', () => {
      expect(component.isSearching()).toBe(false);
    });

    it('should set selected infraction', () => {
      component.selectInfraction({
        code: '74550', description: 'Excesso', article: '218',
        nature: 'grave', points: 5, baseValue: '195.23',
      });
      expect(component.selectedInfraction()?.code).toBe('74550');
      expect(component.form.controls.infractionCode.value).toBe('74550');
    });

    it('should auto-fill description on selection', () => {
      component.selectInfraction({
        code: '74550', description: 'Excesso de velocidade', article: '218',
        nature: 'grave', points: 5, baseValue: '195.23',
      });
      expect(component.form.controls.infractionDescription.value).toBe('Excesso de velocidade');
    });

    it('should close suggestions on selection', () => {
      component.showSuggestions.set(true);
      component.selectInfraction({
        code: '74550', description: 'Excesso', article: '218',
        nature: 'grave', points: 5, baseValue: '195.23',
      });
      expect(component.showSuggestions()).toBe(false);
    });
  });

  // =========================================================================
  // Navigation
  // =========================================================================
  describe('Navigation', () => {
    it('should navigate back on onBack', () => {
      formService.goToStep(1);
      component.onBack();
      expect(formService.currentStep()).toBe(0);
    });

    it('should navigate forward on valid submit', () => {
      component.form.patchValue({
        autoNumber: '12345',
        infractionDate: '2024-01-15',
        infractionCode: '74550',
      });
      component.onContinue();
      expect(formService.currentStep()).toBe(2);
    });

    it('should NOT navigate forward on invalid submit', () => {
      formService.goToStep(1);
      component.onContinue();
      expect(formService.currentStep()).toBe(1);
    });
  });

  // =========================================================================
  // Pre-fill
  // =========================================================================
  describe('Pre-fill', () => {
    it('should pre-fill from service state', () => {
      formService.updateInfraction({ autoNumber: 'AI-999' });

      fixture = TestBed.createComponent(StepInfractionComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.form.controls.autoNumber.value).toBe('AI-999');
    });
  });

  // =========================================================================
  // Accessibility
  // =========================================================================
  describe('Accessibility', () => {
    it('should have labels for required inputs', () => {
      const labels = fixture.nativeElement.querySelectorAll('label');
      expect(labels.length).toBeGreaterThanOrEqual(5);
    });

    it('should have aria-haspopup on code input', () => {
      const input = fixture.nativeElement.querySelector('#infractionCode');
      expect(input?.getAttribute('aria-haspopup')).toBe('listbox');
    });
  });
});

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { OnboardingStepperComponent, ONBOARDING_STEPS } from './onboarding-stepper.component';
import { VehicleService } from '../../../profile/services/vehicle.service';
import { ProfileService } from '../../services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { Vehicle } from '../../../../core/models/vehicle.model';

const MOCK_VEHICLE: Vehicle = {
  id: 'v-001',
  plate: 'ABC1D23',
  plateFormat: 'mercosul',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2023,
  color: null,
  hasRenavam: true,
  nickname: null,
  isDefault: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('OnboardingStepperComponent', () => {
  let component: OnboardingStepperComponent;
  let fixture: ComponentFixture<OnboardingStepperComponent>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let vehicleServiceSpy: jasmine.SpyObj<VehicleService>;
  let profileServiceSpy: jasmine.SpyObj<ProfileService>;
  let router: Router;

  beforeEach(async () => {
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);
    vehicleServiceSpy = jasmine.createSpyObj('VehicleService', ['createVehicle']);
    profileServiceSpy = jasmine.createSpyObj('ProfileService', [
      'loadProfile',
      'updateProfile',
      'updatePreferences',
    ]);

    vehicleServiceSpy.createVehicle.and.resolveTo(MOCK_VEHICLE);
    profileServiceSpy.loadProfile.and.resolveTo(undefined);
    profileServiceSpy.updateProfile.and.resolveTo(undefined);
    profileServiceSpy.updatePreferences.and.resolveTo(undefined);

    await TestBed.configureTestingModule({
      imports: [OnboardingStepperComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastSpy },
        { provide: VehicleService, useValue: vehicleServiceSpy },
        { provide: ProfileService, useValue: profileServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(OnboardingStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should export ONBOARDING_STEPS constant', () => {
      expect(ONBOARDING_STEPS).toBeDefined();
      expect(ONBOARDING_STEPS.length).toBe(4);
    });

    it('should start at step 0', () => {
      expect(component.currentStep()).toBe(0);
    });

    it('should load profile on init', () => {
      expect(profileServiceSpy.loadProfile).toHaveBeenCalled();
    });
  });

  describe('Step Progress Indicator', () => {
    it('should render 4 step indicators', () => {
      const el = fixture.nativeElement as HTMLElement;
      const circles = el.querySelectorAll('.rounded-full');
      expect(circles.length).toBe(4);
    });

    it('should highlight current step', () => {
      const el = fixture.nativeElement as HTMLElement;
      const circles = el.querySelectorAll('.rounded-full');
      expect(circles[0].classList.contains('bg-brand-600')).toBeTrue();
      expect(circles[1].classList.contains('bg-gray-200')).toBeTrue();
    });

    it('should show step labels on larger screens', () => {
      const el = fixture.nativeElement as HTMLElement;
      const labels = el.querySelectorAll('.rounded-full + span');
      expect(labels.length).toBeGreaterThanOrEqual(4);
    });

    it('should show checkmark for completed steps', () => {
      component.currentStep.set(2);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const svgs = el.querySelectorAll('.rounded-full svg');
      expect(svgs.length).toBe(2); // Steps 0 and 1 show checkmarks
    });

    it('should show mobile step counter', () => {
      const el = fixture.nativeElement as HTMLElement;
      const counter = el.querySelector('.sm\\:hidden');
      expect(counter?.textContent).toContain('Passo 1 de 4');
    });
  });

  describe('Step 1 — Welcome', () => {
    it('should show welcome heading', () => {
      const el = fixture.nativeElement as HTMLElement;
      const heading = el.querySelector('h2');
      expect(heading?.textContent).toContain('Bem-vindo ao Justifica.AI!');
    });

    it('should show legal disclaimer', () => {
      const el = fixture.nativeElement as HTMLElement;
      const disclaimer = el.querySelector('.bg-amber-50');
      expect(disclaimer?.textContent).toContain('Aviso legal');
    });

    it('should have "Entendi, continuar" button', () => {
      const el = fixture.nativeElement as HTMLElement;
      const buttons = el.querySelectorAll('button');
      const continueBtn = Array.from(buttons).find((b) => b.textContent?.includes('Entendi, continuar'));
      expect(continueBtn).toBeTruthy();
    });

    it('should have "Pular" button', () => {
      const el = fixture.nativeElement as HTMLElement;
      const buttons = el.querySelectorAll('button');
      const skipBtn = Array.from(buttons).find((b) => b.textContent?.includes('Pular'));
      expect(skipBtn).toBeTruthy();
    });

    it('should go to step 1 on "Entendi, continuar"', () => {
      const el = fixture.nativeElement as HTMLElement;
      const buttons = el.querySelectorAll('button');
      const continueBtn = Array.from(buttons).find((b) => b.textContent?.includes('Entendi, continuar'));
      continueBtn?.click();
      expect(component.currentStep()).toBe(1);
    });

    it('should go to step 1 on "Pular"', () => {
      const el = fixture.nativeElement as HTMLElement;
      const buttons = el.querySelectorAll('button');
      const skipBtn = Array.from(buttons).find((b) => b.textContent?.includes('Pular'));
      skipBtn?.click();
      expect(component.currentStep()).toBe(1);
    });
  });

  describe('Step 2 — Vehicle Registration', () => {
    beforeEach(() => {
      component.currentStep.set(1);
      fixture.detectChanges();
    });

    it('should show vehicle heading', () => {
      const el = fixture.nativeElement as HTMLElement;
      const heading = el.querySelector('h2');
      expect(heading?.textContent).toContain('Cadastre seu veículo');
    });

    it('should render plate input with required marker', () => {
      const el = fixture.nativeElement as HTMLElement;
      const plateInput = el.querySelector('#plate') as HTMLInputElement;
      expect(plateInput).toBeTruthy();
      const required = el.querySelector('.text-error-500');
      expect(required?.textContent).toContain('*');
    });

    it('should render brand and model inputs', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#brand')).toBeTruthy();
      expect(el.querySelector('#model')).toBeTruthy();
    });

    it('should render renavam input', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#renavam')).toBeTruthy();
    });

    it('should have "Salvar e continuar" button', () => {
      const el = fixture.nativeElement as HTMLElement;
      const buttons = el.querySelectorAll('button');
      const saveBtn = Array.from(buttons).find((b) => b.textContent?.includes('Salvar e continuar'));
      expect(saveBtn).toBeTruthy();
    });

    it('should have "Fazer depois" button', () => {
      const el = fixture.nativeElement as HTMLElement;
      const buttons = el.querySelectorAll('button');
      const skipBtn = Array.from(buttons).find((b) => b.textContent?.includes('Fazer depois'));
      expect(skipBtn).toBeTruthy();
    });

    it('should skip to step 2 on "Fazer depois"', () => {
      const el = fixture.nativeElement as HTMLElement;
      const buttons = el.querySelectorAll('button');
      const skipBtn = Array.from(buttons).find((b) => b.textContent?.includes('Fazer depois'));
      skipBtn?.click();
      expect(component.currentStep()).toBe(2);
    });

    it('should show plate error on empty submit', fakeAsync(() => {
      component.saveVehicle();
      tick();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const error = el.querySelector('#plate-error');
      expect(error?.textContent).toContain('Campo obrigatório');
    }));

    it('should validate invalid plate format', fakeAsync(() => {
      component.vehicleForm.controls.plate.setValue('1234567');
      component.vehicleForm.controls.plate.markAsTouched();
      component.saveVehicle();
      tick();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const error = el.querySelector('#plate-error');
      expect(error?.textContent).toContain('Formato de placa inválido');
    }));

    it('should accept valid Mercosul plate', () => {
      component.vehicleForm.controls.plate.setValue('ABC1D23');
      expect(component.vehicleForm.controls.plate.valid).toBeTrue();
    });

    it('should accept valid old format plate', () => {
      component.vehicleForm.controls.plate.setValue('ABC1234');
      expect(component.vehicleForm.controls.plate.valid).toBeTrue();
    });

    it('should validate RENAVAM with wrong length', () => {
      component.vehicleForm.controls.renavam.setValue('123');
      expect(component.vehicleForm.controls.renavam.hasError('invalidRenavam')).toBeTrue();
    });

    it('should save vehicle and advance to step 2', fakeAsync(() => {
      component.vehicleForm.controls.plate.setValue('ABC1D23');
      component.saveVehicle();
      tick();
      fixture.detectChanges();
      expect(vehicleServiceSpy.createVehicle).toHaveBeenCalledWith(jasmine.objectContaining({
        plate: 'ABC1D23',
        isDefault: true,
      }));
      expect(toastSpy.success).toHaveBeenCalledWith('Veículo cadastrado com sucesso!');
      expect(component.currentStep()).toBe(2);
    }));

    it('should show error toast on vehicle save failure', fakeAsync(() => {
      vehicleServiceSpy.createVehicle.and.rejectWith(new Error('API error'));
      component.vehicleForm.controls.plate.setValue('ABC1D23');
      component.saveVehicle();
      tick();
      fixture.detectChanges();
      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao cadastrar veículo. Tente novamente.');
      expect(component.currentStep()).toBe(1); // Should NOT advance
    }));

    it('should reset savingVehicle flag on success', fakeAsync(() => {
      component.vehicleForm.controls.plate.setValue('ABC1D23');
      component.saveVehicle();
      tick();
      expect(component.savingVehicle()).toBeFalse();
    }));

    it('should reset savingVehicle flag on error', fakeAsync(() => {
      vehicleServiceSpy.createVehicle.and.rejectWith(new Error('fail'));
      component.vehicleForm.controls.plate.setValue('ABC1D23');
      component.saveVehicle();
      tick();
      expect(component.savingVehicle()).toBeFalse();
    }));
  });

  describe('onPlateInput', () => {
    it('should convert input to uppercase', () => {
      component.currentStep.set(1);
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('#plate') as HTMLInputElement;
      input.value = 'abc1d23';
      input.dispatchEvent(new Event('input'));
      expect(input.value).toBe('ABC1D23');
    });

    it('should strip non-alphanumeric characters', () => {
      component.currentStep.set(1);
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('#plate') as HTMLInputElement;
      input.value = 'AB-C1!D2';
      input.dispatchEvent(new Event('input'));
      expect(input.value).toBe('ABC1D2');
    });

    it('should limit to 7 characters', () => {
      component.currentStep.set(1);
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('#plate') as HTMLInputElement;
      input.value = 'ABC1D2345';
      input.dispatchEvent(new Event('input'));
      expect(input.value).toBe('ABC1D23');
    });
  });

  describe('Step 3 — Communication Preferences', () => {
    beforeEach(() => {
      component.currentStep.set(2);
      fixture.detectChanges();
    });

    it('should show communication heading', () => {
      const el = fixture.nativeElement as HTMLElement;
      const heading = el.querySelector('h2');
      expect(heading?.textContent).toContain('Preferências de comunicação');
    });

    it('should render 3 checkboxes (email, whatsapp, sms)', () => {
      const el = fixture.nativeElement as HTMLElement;
      const checkboxes = el.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(3);
    });

    it('should have all checkboxes unchecked by default', () => {
      expect(component.emailMarketing()).toBeFalse();
      expect(component.whatsapp()).toBeFalse();
      expect(component.sms()).toBeFalse();
    });

    it('should toggle emailMarketing signal on checkbox change', () => {
      const el = fixture.nativeElement as HTMLElement;
      const checkboxes = el.querySelectorAll('input[type="checkbox"]');
      checkboxes[0].dispatchEvent(new Event('change'));
      expect(component.emailMarketing()).toBeTrue();
    });

    it('should toggle whatsapp signal on checkbox change', () => {
      const el = fixture.nativeElement as HTMLElement;
      const checkboxes = el.querySelectorAll('input[type="checkbox"]');
      checkboxes[1].dispatchEvent(new Event('change'));
      expect(component.whatsapp()).toBeTrue();
    });

    it('should toggle sms signal on checkbox change', () => {
      const el = fixture.nativeElement as HTMLElement;
      const checkboxes = el.querySelectorAll('input[type="checkbox"]');
      checkboxes[2].dispatchEvent(new Event('change'));
      expect(component.sms()).toBeTrue();
    });

    it('should have accessibility labels on checkboxes', () => {
      const el = fixture.nativeElement as HTMLElement;
      const checkboxes = el.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes[0].getAttribute('aria-label')).toBe('Ativar e-mail marketing');
      expect(checkboxes[1].getAttribute('aria-label')).toBe('Ativar WhatsApp');
      expect(checkboxes[2].getAttribute('aria-label')).toBe('Ativar SMS');
    });

    it('should save preferences and advance to step 3', fakeAsync(() => {
      component.emailMarketing.set(true);
      component.sms.set(true);
      component.savePreferences();
      tick();
      fixture.detectChanges();
      expect(profileServiceSpy.updatePreferences).toHaveBeenCalledWith({
        emailMarketing: true,
        whatsapp: false,
        sms: true,
      });
      expect(toastSpy.success).toHaveBeenCalledWith('Preferências salvas com sucesso!');
      expect(component.currentStep()).toBe(3);
    }));

    it('should show error toast on preferences save failure', fakeAsync(() => {
      profileServiceSpy.updatePreferences.and.rejectWith(new Error('fail'));
      component.savePreferences();
      tick();
      fixture.detectChanges();
      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao salvar preferências. Tente novamente.');
      expect(component.currentStep()).toBe(2); // Should NOT advance
    }));

    it('should reset savingPreferences flag after save', fakeAsync(() => {
      component.savePreferences();
      tick();
      expect(component.savingPreferences()).toBeFalse();
    }));

    it('should skip to step 3 on "Pular"', () => {
      const el = fixture.nativeElement as HTMLElement;
      const buttons = el.querySelectorAll('button');
      const skipBtn = Array.from(buttons).find((b) => b.textContent?.includes('Pular'));
      skipBtn?.click();
      expect(component.currentStep()).toBe(3);
    });
  });

  describe('Step 4 — Done', () => {
    beforeEach(() => {
      component.currentStep.set(3);
      fixture.detectChanges();
    });

    it('should show completion heading', () => {
      const el = fixture.nativeElement as HTMLElement;
      const heading = el.querySelector('h2');
      expect(heading?.textContent).toContain('Tudo pronto!');
    });

    it('should show success icon', () => {
      const el = fixture.nativeElement as HTMLElement;
      const icon = el.querySelector('.bg-accent-50 svg');
      expect(icon).toBeTruthy();
    });

    it('should have "Gerar meu primeiro recurso" button', () => {
      const el = fixture.nativeElement as HTMLElement;
      const buttons = el.querySelectorAll('button');
      const cta = Array.from(buttons).find((b) => b.textContent?.includes('Gerar meu primeiro recurso'));
      expect(cta).toBeTruthy();
    });

    it('should have "Explorar a plataforma" button', () => {
      const el = fixture.nativeElement as HTMLElement;
      const buttons = el.querySelectorAll('button');
      const explore = Array.from(buttons).find((b) => b.textContent?.includes('Explorar a plataforma'));
      expect(explore).toBeTruthy();
    });

    it('should complete onboarding and navigate to appeals/new', fakeAsync(() => {
      component.completeOnboarding('/appeals/new');
      tick();
      expect(profileServiceSpy.updateProfile).toHaveBeenCalledWith({ onboardingCompleted: true });
      expect(router.navigate).toHaveBeenCalledWith(['/appeals/new']);
    }));

    it('should complete onboarding and navigate to home', fakeAsync(() => {
      component.completeOnboarding('/');
      tick();
      expect(profileServiceSpy.updateProfile).toHaveBeenCalledWith({ onboardingCompleted: true });
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should show error toast on complete failure', fakeAsync(() => {
      profileServiceSpy.updateProfile.and.rejectWith(new Error('fail'));
      component.completeOnboarding('/');
      tick();
      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao finalizar. Tente novamente.');
    }));

    it('should reset completing flag after success', fakeAsync(() => {
      component.completeOnboarding('/');
      tick();
      expect(component.completing()).toBeFalse();
    }));

    it('should reset completing flag after failure', fakeAsync(() => {
      profileServiceSpy.updateProfile.and.rejectWith(new Error('fail'));
      component.completeOnboarding('/');
      tick();
      expect(component.completing()).toBeFalse();
    }));
  });

  describe('Navigation Logic', () => {
    it('should not go beyond last step', () => {
      component.currentStep.set(3);
      component.nextStep();
      expect(component.currentStep()).toBe(3);
    });

    it('should compute isLastStep correctly', () => {
      expect(component.isLastStep()).toBeFalse();
      component.currentStep.set(3);
      expect(component.isLastStep()).toBeTrue();
    });

    it('skipStep should advance same as nextStep', () => {
      component.skipStep();
      expect(component.currentStep()).toBe(1);
    });
  });

  describe('Vehicle Form Validation', () => {
    it('should require plate field', () => {
      expect(component.vehicleForm.controls.plate.hasError('required')).toBeTrue();
    });

    it('should require minimum 7 characters for plate', () => {
      component.vehicleForm.controls.plate.setValue('ABC');
      expect(component.vehicleForm.controls.plate.hasError('minlength')).toBeTrue();
    });

    it('should not show errors before interaction', () => {
      expect(component.showVehicleError('plate')).toBeFalse();
    });

    it('should show errors after touch', () => {
      component.vehicleForm.controls.plate.markAsTouched();
      expect(component.showVehicleError('plate')).toBeTrue();
    });

    it('should show errors after submit attempt', () => {
      component.submitted.set(true);
      expect(component.showVehicleError('plate')).toBeTrue();
    });

    it('should return correct error message for required', () => {
      component.vehicleForm.controls.plate.markAsTouched();
      expect(component.getVehicleError('plate')).toBe('Campo obrigatório');
    });

    it('should return correct error for invalid plate', () => {
      component.vehicleForm.controls.plate.setValue('INVALID');
      component.vehicleForm.controls.plate.markAsTouched();
      expect(component.getVehicleError('plate')).toBe('Formato de placa inválido (ex: ABC1D23 ou ABC1234)');
    });

    it('should return correct error for invalid renavam', () => {
      component.vehicleForm.controls.renavam.setValue('12345');
      component.vehicleForm.controls.renavam.markAsTouched();
      expect(component.getVehicleError('renavam')).toBe('RENAVAM inválido (11 dígitos)');
    });

    it('should return empty string for no errors', () => {
      component.vehicleForm.controls.plate.setValue('ABC1D23');
      expect(component.getVehicleError('plate')).toBe('');
    });

    it('should accept empty renavam (optional field)', () => {
      expect(component.vehicleForm.controls.renavam.valid).toBeTrue();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-current on active step indicator', () => {
      const el = fixture.nativeElement as HTMLElement;
      const activeStep = el.querySelector('[aria-current="step"]');
      expect(activeStep).toBeTruthy();
    });

    it('should have sr-only text for required fields', () => {
      component.currentStep.set(1);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const srOnly = el.querySelector('.sr-only');
      expect(srOnly?.textContent).toContain('obrigatório');
    });

    it('should have aria-describedby on plate input', () => {
      component.currentStep.set(1);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const plate = el.querySelector('#plate');
      expect(plate?.getAttribute('aria-describedby')).toBe('plate-error');
    });

    it('should have role=alert on error messages', fakeAsync(() => {
      component.currentStep.set(1);
      fixture.detectChanges();
      component.saveVehicle();
      tick();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const alert = el.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
    }));
  });
});

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { APP_ROUTES } from '../../../../core/constants/app-routes';
import {
  calculateStrength,
  cpfValidator,
  phoneValidator,
  formatCpf,
  formatPhone,
  passwordMatchValidator,
  passwordStrengthValidator,
} from '../../../../shared/utils/validators';
import { FormControl, FormGroup } from '@angular/forms';

// Valid CPF for tests (passes check digit validation): 529.982.247-25
const VALID_CPF_RAW = '52998224725';
const VALID_CPF_FORMATTED = '529.982.247-25';
const STRONG_PASSWORD = 'Abcd1234!';

function createMockAuthService(): jasmine.SpyObj<AuthService> {
  return jasmine.createSpyObj('AuthService', ['signUp']);
}

function setup() {
  TestBed.resetTestingModule();

  const authService = createMockAuthService();
  authService.signUp.and.resolveTo({ data: { user: {}, session: null }, error: null } as never);

  const toastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);

  TestBed.configureTestingModule({
    imports: [RegisterComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: authService },
      { provide: ToastService, useValue: toastService },
    ],
  });

  const fixture = TestBed.createComponent(RegisterComponent);
  const component = fixture.componentInstance;
  const router = TestBed.inject(Router);
  spyOn(router, 'navigate').and.resolveTo(true);
  fixture.detectChanges();

  return { fixture, component, authService, toastService, router };
}

function fillValidForm(component: RegisterComponent): void {
  component.registerForm.patchValue({
    fullName: 'João da Silva',
    email: 'joao@test.com',
    cpf: VALID_CPF_FORMATTED,
    phone: '(11) 99999-8888',
    password: STRONG_PASSWORD,
    confirmPassword: STRONG_PASSWORD,
    acceptTerms: true,
    acceptLGPD: true,
  });
  component.registerForm.markAllAsTouched();
}

// =============================================================================
// Pure function tests — shared validators
// =============================================================================

describe('Shared Validators — cpfValidator', () => {
  it('should return null for empty value', () => {
    const control = new FormControl('');
    expect(cpfValidator(control)).toBeNull();
  });

  it('should reject CPF with wrong length', () => {
    const control = new FormControl('1234567890');
    expect(cpfValidator(control)).toEqual({ cpf: true });
  });

  it('should reject CPF with all same digits', () => {
    const control = new FormControl('11111111111');
    expect(cpfValidator(control)).toEqual({ cpf: true });
  });

  it('should reject CPF with invalid check digits', () => {
    const control = new FormControl('12345678901');
    expect(cpfValidator(control)).toEqual({ cpf: true });
  });

  it('should accept valid CPF (raw digits)', () => {
    const control = new FormControl(VALID_CPF_RAW);
    expect(cpfValidator(control)).toBeNull();
  });

  it('should accept valid CPF with mask', () => {
    const control = new FormControl(VALID_CPF_FORMATTED);
    expect(cpfValidator(control)).toBeNull();
  });
});

describe('Shared Validators — phoneValidator', () => {
  it('should return null for empty value', () => {
    const control = new FormControl('');
    expect(phoneValidator(control)).toBeNull();
  });

  it('should reject phone with less than 10 digits', () => {
    const control = new FormControl('123456789');
    expect(phoneValidator(control)).toEqual({ phone: true });
  });

  it('should accept 10-digit phone (landline)', () => {
    const control = new FormControl('1134567890');
    expect(phoneValidator(control)).toBeNull();
  });

  it('should accept 11-digit phone (mobile)', () => {
    const control = new FormControl('11999998888');
    expect(phoneValidator(control)).toBeNull();
  });

  it('should reject phone with more than 11 digits', () => {
    const control = new FormControl('119999988881');
    expect(phoneValidator(control)).toEqual({ phone: true });
  });
});

describe('Shared Validators — formatCpf', () => {
  it('should format partial CPF', () => {
    expect(formatCpf('529')).toBe('529');
    expect(formatCpf('5299')).toBe('529.9');
    expect(formatCpf('5299822')).toBe('529.982.2');
    expect(formatCpf('529982247')).toBe('529.982.247');
    expect(formatCpf('52998224725')).toBe(VALID_CPF_FORMATTED);
  });

  it('should strip non-digit characters before formatting', () => {
    expect(formatCpf('529.982.247-25')).toBe(VALID_CPF_FORMATTED);
  });

  it('should limit to 11 digits', () => {
    expect(formatCpf('529982247251234')).toBe(VALID_CPF_FORMATTED);
  });
});

describe('Shared Validators — formatPhone', () => {
  it('should format partial phone', () => {
    expect(formatPhone('11')).toBe('(11');
    expect(formatPhone('119')).toBe('(11) 9');
    expect(formatPhone('11999')).toBe('(11) 999');
    expect(formatPhone('1199999')).toBe('(11) 99999');
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888');
  });

  it('should return empty for empty input', () => {
    expect(formatPhone('')).toBe('');
  });

  it('should format 10-digit landline', () => {
    expect(formatPhone('1134567890')).toBe('(11) 3456-7890');
  });
});

describe('Shared Validators — passwordMatchValidator', () => {
  it('should return null when passwords match using "password" field', () => {
    const group = new FormGroup({
      password: new FormControl('test123'),
      confirmPassword: new FormControl('test123'),
    });
    expect(passwordMatchValidator(group)).toBeNull();
  });

  it('should return mismatch error when passwords differ', () => {
    const group = new FormGroup({
      password: new FormControl('test123'),
      confirmPassword: new FormControl('test456'),
    });
    expect(passwordMatchValidator(group)).toEqual({ passwordMismatch: true });
  });

  it('should also support "newPassword" field name', () => {
    const group = new FormGroup({
      newPassword: new FormControl('test123'),
      confirmPassword: new FormControl('test456'),
    });
    expect(passwordMatchValidator(group)).toEqual({ passwordMismatch: true });
  });
});

describe('Shared Validators — passwordStrengthValidator', () => {
  it('should return null for empty value', () => {
    const control = new FormControl('');
    expect(passwordStrengthValidator(control)).toBeNull();
  });

  it('should reject weak password', () => {
    const control = new FormControl('abc');
    expect(passwordStrengthValidator(control)).toEqual({ passwordStrength: true });
  });

  it('should accept strong password', () => {
    const control = new FormControl(STRONG_PASSWORD);
    expect(passwordStrengthValidator(control)).toBeNull();
  });
});

describe('Shared Validators — calculateStrength', () => {
  it('should return weak for empty', () => {
    expect(calculateStrength('')).toEqual({ level: 'weak', percent: 0 });
  });

  it('should return weak for short password', () => {
    expect(calculateStrength('abc')).toEqual({ level: 'weak', percent: 25 });
  });

  it('should return medium for password with 3 criteria', () => {
    // Abcdefgh: length>=8 + uppercase + lowercase = 3
    expect(calculateStrength('Abcdefgh').level).toBe('medium');
  });

  it('should return strong for password with 4-5 criteria', () => {
    // Abcdef1! : length>=8 + upper + lower + number + special = 5
    expect(calculateStrength('Abcdef1!').level).toBe('strong');
  });

  it('should return very-strong for password with all criteria', () => {
    // Abcdefghij1! : length>=8 + length>=12 + upper + lower + number + special = 6
    expect(calculateStrength('Abcdefghij1!').level).toBe('very-strong');
  });
});

// =============================================================================
// RegisterComponent tests
// =============================================================================

describe('RegisterComponent', () => {
  describe('Creation & Rendering', () => {
    it('should create the component', () => {
      const { component } = setup();
      expect(component).toBeTruthy();
    });

    it('should render the heading', () => {
      const { fixture } = setup();
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1?.textContent).toContain('Criar conta');
    });

    it('should render the subtitle', () => {
      const { fixture } = setup();
      const p = fixture.nativeElement.querySelector('p');
      expect(p?.textContent).toContain('Cadastre-se para gerar seu recurso de multa');
    });

    it('should render login link', () => {
      const { fixture } = setup();
      const link = fixture.nativeElement.querySelector('a[href="/auth/login"]');
      expect(link?.textContent).toContain('Entrar');
    });

    it('should have all form fields', () => {
      const { fixture } = setup();
      const el = fixture.nativeElement;
      expect(el.querySelector('#reg-name')).toBeTruthy();
      expect(el.querySelector('#reg-email')).toBeTruthy();
      expect(el.querySelector('#reg-cpf')).toBeTruthy();
      expect(el.querySelector('#reg-phone')).toBeTruthy();
      expect(el.querySelector('#reg-password')).toBeTruthy();
      expect(el.querySelector('#reg-confirm')).toBeTruthy();
      expect(el.querySelector('#reg-terms')).toBeTruthy();
      expect(el.querySelector('#reg-lgpd')).toBeTruthy();
    });

    it('should have autofocus on fullName field', () => {
      const { fixture } = setup();
      const input = fixture.nativeElement.querySelector('#reg-name');
      expect(input?.hasAttribute('autofocus')).toBeTrue();
    });
  });

  describe('Form Validation — on blur', () => {
    it('should show error for empty fullName after blur', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.fullName.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-name-error');
      expect(error?.textContent).toContain('Nome completo é obrigatório');
    });

    it('should show error for short fullName', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.fullName.setValue('Ab');
      component.registerForm.controls.fullName.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-name-error');
      expect(error?.textContent).toContain('Nome deve ter no mínimo 3 caracteres');
    });

    it('should show error for empty email', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.email.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-email-error');
      expect(error?.textContent).toContain('E-mail é obrigatório');
    });

    it('should show error for invalid email format', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.email.setValue('not-email');
      component.registerForm.controls.email.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-email-error');
      expect(error?.textContent).toContain('E-mail inválido');
    });

    it('should show error for empty CPF', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.cpf.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-cpf-error');
      expect(error?.textContent).toContain('CPF é obrigatório');
    });

    it('should show error for invalid CPF', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.cpf.setValue('123.456.789-00');
      component.registerForm.controls.cpf.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-cpf-error');
      expect(error?.textContent).toContain('CPF inválido');
    });

    it('should NOT show error for valid CPF', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.cpf.setValue(VALID_CPF_FORMATTED);
      component.registerForm.controls.cpf.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-cpf-error');
      expect(error).toBeNull();
    });

    it('should show error for invalid phone', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.phone.setValue('1234');
      component.registerForm.controls.phone.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-phone-error');
      expect(error?.textContent).toContain('Telefone inválido');
    });

    it('should NOT show error when phone is empty (optional)', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.phone.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-phone-error');
      expect(error).toBeNull();
    });

    it('should show error for weak password', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.password.setValue('abc');
      component.registerForm.controls.password.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-password-error');
      expect(error?.textContent).toContain('A senha deve ter no mínimo 8 caracteres');
    });

    it('should show error for empty confirmPassword', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.confirmPassword.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-confirm-error');
      expect(error?.textContent).toContain('Confirmação de senha é obrigatória');
    });

    it('should show mismatch error when passwords differ', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.password.setValue(STRONG_PASSWORD);
      component.registerForm.controls.confirmPassword.setValue('Different1!');
      component.registerForm.controls.confirmPassword.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-mismatch-error');
      expect(error?.textContent).toContain('As senhas não coincidem');
    });

    it('should show terms error when not accepted', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.acceptTerms.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-terms-error');
      expect(error?.textContent).toContain('Você precisa aceitar os Termos de Uso');
    });

    it('should show LGPD error when not accepted', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.acceptLGPD.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('#reg-lgpd-error');
      expect(error?.textContent).toContain('Você precisa autorizar o tratamento de dados');
    });
  });

  describe('CPF & Phone Masks', () => {
    it('should format CPF on input', () => {
      const { component } = setup();
      const input = { target: { value: '52998224725' } } as unknown as Event;
      component.onCpfInput(input);
      expect((input.target as HTMLInputElement).value).toBe(VALID_CPF_FORMATTED);
      expect(component.registerForm.controls.cpf.value).toBe(VALID_CPF_FORMATTED);
    });

    it('should format phone on input', () => {
      const { component } = setup();
      const input = { target: { value: '11999998888' } } as unknown as Event;
      component.onPhoneInput(input);
      expect((input.target as HTMLInputElement).value).toBe('(11) 99999-8888');
      expect(component.registerForm.controls.phone.value).toBe('(11) 99999-8888');
    });
  });

  describe('Password Strength Indicator', () => {
    it('should show strength bars', () => {
      const { fixture } = setup();
      const bars = fixture.nativeElement.querySelectorAll('#reg-password-strength .rounded-full');
      expect(bars.length).toBe(4);
    });

    it('should not show strength label when password is empty', () => {
      const { fixture } = setup();
      const label = fixture.nativeElement.querySelector('#reg-password-strength p');
      expect(label).toBeNull();
    });

    it('should show weak strength for short password', fakeAsync(() => {
      const { fixture, component } = setup();
      component.registerForm.controls.password.setValue('ab');
      tick();
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector('#reg-password-strength p');
      expect(label?.textContent).toContain('Fraca');
    }));

    it('should show strong strength for strong password', fakeAsync(() => {
      const { fixture, component } = setup();
      component.registerForm.controls.password.setValue(STRONG_PASSWORD);
      tick();
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector('#reg-password-strength p');
      expect(label?.textContent).toContain('Forte');
    }));
  });

  describe('Password Toggle', () => {
    it('should toggle password visibility', () => {
      const { fixture, component } = setup();
      expect(component.showPassword()).toBeFalse();
      component.togglePasswordVisibility();
      expect(component.showPassword()).toBeTrue();
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('#reg-password');
      expect(input?.type).toBe('text');
    });

    it('should render toggle button with correct aria-label', () => {
      const { fixture, component } = setup();
      const btn = fixture.nativeElement.querySelector('button[type="button"]');
      expect(btn?.getAttribute('aria-label')).toBe('Mostrar senha');
      component.togglePasswordVisibility();
      fixture.detectChanges();
      expect(btn?.getAttribute('aria-label')).toBe('Ocultar senha');
    });
  });

  describe('Affiliate Code (collapsible)', () => {
    it('should not show affiliate field by default', () => {
      const { fixture } = setup();
      expect(fixture.nativeElement.querySelector('#reg-affiliate')).toBeNull();
    });

    it('should show toggle button text', () => {
      const { fixture } = setup();
      const btn = fixture.nativeElement.querySelector('button[aria-controls="affiliate-field"]');
      expect(btn?.textContent).toContain('Tem código de indicação?');
    });

    it('should show affiliate field when toggled', () => {
      const { fixture, component } = setup();
      component.showAffiliateField.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#reg-affiliate')).toBeTruthy();
    });

    it('should hide toggle button when affiliate field is shown', () => {
      const { fixture, component } = setup();
      component.showAffiliateField.set(true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button[aria-controls="affiliate-field"]');
      expect(btn).toBeNull();
    });
  });

  describe('Submit Button', () => {
    it('should be disabled when form is invalid', () => {
      const { fixture } = setup();
      const btn = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(btn?.disabled).toBeTrue();
    });

    it('should be enabled when form is valid', () => {
      const { fixture, component } = setup();
      fillValidForm(component);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(btn?.disabled).toBeFalse();
    });

    it('should show normal text when not submitting', () => {
      const { fixture } = setup();
      const btn = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(btn?.textContent?.trim()).toContain('Criar conta');
    });

    it('should show loading text during submission', () => {
      const { fixture, component } = setup();
      component.isSubmitting.set(true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(btn?.textContent).toContain('Criando conta...');
    });

    it('should have spinner during submission', () => {
      const { fixture, component } = setup();
      component.isSubmitting.set(true);
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('button[type="submit"] svg.animate-spin');
      expect(spinner).toBeTruthy();
    });
  });

  describe('Form Submission — Success', () => {
    it('should call authService.signUp with correct parameters', async () => {
      const { fixture, component, authService } = setup();
      fillValidForm(component);
      fixture.detectChanges();

      await component.onSubmit();

      expect(authService.signUp).toHaveBeenCalledWith(
        'joao@test.com',
        STRONG_PASSWORD,
        jasmine.objectContaining({
          full_name: 'João da Silva',
          cpf: VALID_CPF_RAW,
          phone: '11999998888',
        }),
      );
    });

    it('should include affiliate_code in metadata when provided', async () => {
      const { fixture, component, authService } = setup();
      fillValidForm(component);
      component.registerForm.controls.affiliateCode.setValue('PROMO2024');
      fixture.detectChanges();

      await component.onSubmit();

      expect(authService.signUp).toHaveBeenCalledWith(
        jasmine.any(String),
        jasmine.any(String),
        jasmine.objectContaining({ affiliate_code: 'PROMO2024' }),
      );
    });

    it('should NOT include phone in metadata when empty', async () => {
      const { fixture, component, authService } = setup();
      fillValidForm(component);
      component.registerForm.controls.phone.setValue('');
      fixture.detectChanges();

      await component.onSubmit();

      const metadata = authService.signUp.calls.mostRecent().args[2] as Record<string, unknown>;
      expect(metadata['phone']).toBeUndefined();
    });

    it('should show success toast', async () => {
      const { component, toastService } = setup();
      fillValidForm(component);

      await component.onSubmit();

      expect(toastService.success).toHaveBeenCalledWith(
        'Conta criada!',
        'Verifique seu e-mail para ativar sua conta.',
      );
    });

    it('should navigate to verify-email with email param', async () => {
      const { component, router } = setup();
      fillValidForm(component);

      await component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(
        [APP_ROUTES.AUTH.VERIFY_EMAIL],
        { queryParams: { email: 'joao@test.com' } },
      );
    });

    it('should set isSubmitting during request', async () => {
      const { component, authService } = setup();
      fillValidForm(component);

      let wasSubmitting = false;
      authService.signUp.and.callFake(async () => {
        wasSubmitting = component.isSubmitting();
        return { data: { user: {}, session: null }, error: null } as never;
      });

      await component.onSubmit();
      expect(wasSubmitting).toBeTrue();
      expect(component.isSubmitting()).toBeFalse();
    });
  });

  describe('Form Submission — Errors', () => {
    it('should not call signUp when form is invalid', async () => {
      const { component, authService } = setup();
      await component.onSubmit();
      expect(authService.signUp).not.toHaveBeenCalled();
    });

    it('should markAllAsTouched when form is invalid', async () => {
      const { component } = setup();
      await component.onSubmit();
      expect(component.registerForm.controls.fullName.touched).toBeTrue();
      expect(component.registerForm.controls.email.touched).toBeTrue();
    });

    it('should show toast for "already registered" error', async () => {
      const { component, authService, toastService } = setup();
      fillValidForm(component);
      authService.signUp.and.resolveTo({
        data: { user: null, session: null },
        error: { message: 'User already registered', status: 422 },
      } as never);

      await component.onSubmit();

      expect(toastService.error).toHaveBeenCalledWith(
        'E-mail já cadastrado',
        'Use outro e-mail ou faça login.',
      );
    });

    it('should show generic error toast for other API errors', async () => {
      const { component, authService, toastService } = setup();
      fillValidForm(component);
      authService.signUp.and.resolveTo({
        data: { user: null, session: null },
        error: { message: 'Something went wrong', status: 500 },
      } as never);

      await component.onSubmit();

      expect(toastService.error).toHaveBeenCalledWith(
        'Erro ao criar conta',
        'Something went wrong',
      );
    });

    it('should show unexpected error toast on exception', async () => {
      const { component, authService, toastService } = setup();
      fillValidForm(component);
      authService.signUp.and.rejectWith(new Error('Network error'));

      await component.onSubmit();

      expect(toastService.error).toHaveBeenCalledWith(
        'Erro inesperado',
        'Ocorreu um erro. Tente novamente.',
      );
    });

    it('should reset isSubmitting after error', async () => {
      const { component, authService } = setup();
      fillValidForm(component);
      authService.signUp.and.rejectWith(new Error('fail'));

      await component.onSubmit();

      expect(component.isSubmitting()).toBeFalse();
    });

    it('should not navigate on API error', async () => {
      const { component, authService, router } = setup();
      fillValidForm(component);
      authService.signUp.and.resolveTo({
        data: { user: null, session: null },
        error: { message: 'error', status: 400 },
      } as never);

      await component.onSubmit();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Terms & Privacy Links', () => {
    it('should have terms link opening in new tab', () => {
      const { fixture } = setup();
      const link = fixture.nativeElement.querySelector('a[href="https://justifica.ai/termos"]');
      expect(link).toBeTruthy();
      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')).toContain('noopener');
    });

    it('should have privacy link opening in new tab', () => {
      const { fixture } = setup();
      const link = fixture.nativeElement.querySelector('a[href="https://justifica.ai/privacidade"]');
      expect(link).toBeTruthy();
      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')).toContain('noopener');
    });
  });

  describe('Accessibility', () => {
    it('should have labels for all required fields', () => {
      const { fixture } = setup();
      const labels: NodeListOf<HTMLLabelElement> = fixture.nativeElement.querySelectorAll('label');
      const labelTexts = Array.from(labels).map((l) => l.textContent?.trim());
      expect(labelTexts.some((t: string | undefined) => t?.includes('Nome completo'))).toBeTrue();
      expect(labelTexts.some((t: string | undefined) => t?.includes('E-mail'))).toBeTrue();
      expect(labelTexts.some((t: string | undefined) => t?.includes('CPF'))).toBeTrue();
      expect(labelTexts.some((t: string | undefined) => t?.includes('Senha'))).toBeTrue();
    });

    it('should have sr-only "(obrigatório)" text for required fields', () => {
      const { fixture } = setup();
      const srOnlySpans: NodeListOf<HTMLSpanElement> = fixture.nativeElement.querySelectorAll('.sr-only');
      const texts = Array.from(srOnlySpans).map((s) => s.textContent?.trim());
      const obrigatorioCount = texts.filter((t: string | undefined) => t === '(obrigatório)').length;
      // fullName, email, cpf, password, confirmPassword, acceptTerms, acceptLGPD = 7
      expect(obrigatorioCount).toBeGreaterThanOrEqual(7);
    });

    it('should set aria-invalid on invalid touched fields', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.email.markAsTouched();
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('#reg-email');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });

    it('should set aria-describedby pointing to error paragraph', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.email.markAsTouched();
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('#reg-email');
      expect(input?.getAttribute('aria-describedby')).toBe('reg-email-error');
    });

    it('should have aria-label on submit button', () => {
      const { fixture } = setup();
      const btn = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(btn?.getAttribute('aria-label')).toBe('Criar conta');
    });

    it('should have role="alert" on error messages', () => {
      const { fixture, component } = setup();
      component.registerForm.controls.fullName.markAsTouched();
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector('#reg-name-error');
      expect(alert?.getAttribute('role')).toBe('alert');
    });

    it('should have inputmode="numeric" on CPF and phone fields', () => {
      const { fixture } = setup();
      const cpf = fixture.nativeElement.querySelector('#reg-cpf');
      const phone = fixture.nativeElement.querySelector('#reg-phone');
      expect(cpf?.getAttribute('inputmode')).toBe('numeric');
      expect(phone?.getAttribute('inputmode')).toBe('numeric');
    });
  });
});

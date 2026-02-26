import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { ResetPasswordComponent, calculateStrength, PasswordStrengthLevel } from './reset-password.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

function createMockAuthService(): jasmine.SpyObj<AuthService> & { getSupabaseClient: jasmine.Spy } {
  const spy = jasmine.createSpyObj('AuthService', [
    'updatePassword',
    'getSupabaseClient',
  ]);
  spy.updatePassword.and.resolveTo({ data: { user: {} }, error: null } as never);
  spy.getSupabaseClient.and.returnValue({
    auth: {
      setSession: jasmine.createSpy('setSession').and.resolveTo({ data: { session: {} }, error: null }),
    },
  });
  return spy;
}

function setup(opts: { fragment?: string | null; queryToken?: string | null } = {}) {
  TestBed.resetTestingModule();

  const authService = createMockAuthService();
  const toastService = jasmine.createSpyObj('ToastService', ['success', 'error']);

  const queryParamMap = {
    get: (key: string) => (key === 'token' ? (opts.queryToken ?? null) : null),
    has: (key: string) => key === 'token' && opts.queryToken != null,
    getAll: () => [],
    keys: [],
  };

  TestBed.configureTestingModule({
    imports: [ResetPasswordComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: authService },
      { provide: ToastService, useValue: toastService },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            fragment: opts.fragment ?? null,
            queryParamMap,
          },
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(ResetPasswordComponent);
  const component = fixture.componentInstance;
  const router = TestBed.inject(Router);
  spyOn(router, 'navigateByUrl').and.resolveTo(true);
  fixture.detectChanges();

  return { fixture, component, authService, toastService, router };
}

describe('ResetPasswordComponent', () => {
  describe('calculateStrength (pure function)', () => {
    it('should return weak for empty string', () => {
      expect(calculateStrength('')).toEqual({ level: 'weak', percent: 0 });
    });

    it('should return weak for short password', () => {
      const result = calculateStrength('ab');
      expect(result.level).toBe('weak');
      expect(result.percent).toBe(25);
    });

    it('should return medium for moderately complex password', () => {
      const result = calculateStrength('Abcdefgh');
      expect(result.level).toBe('medium');
    });

    it('should return strong for good password', () => {
      const result = calculateStrength('Abcdef1234');
      expect(result.level).toBe('strong');
    });

    it('should return very-strong for complex password', () => {
      const result = calculateStrength('Abcdefgh12!@#');
      expect(result.level).toBe('very-strong');
      expect(result.percent).toBe(100);
    });

    it('should award points for length >= 12', () => {
      const short = calculateStrength('Abcd1!');
      const long = calculateStrength('Abcdefghijkl1!');
      expect(long.percent).toBeGreaterThanOrEqual(short.percent);
    });
  });

  describe('token reading', () => {
    it('should read token from URL fragment', () => {
      const { component } = setup({ fragment: 'access_token=abc123&type=recovery' });
      expect(component.tokenError()).toBe('');
    });

    it('should read token from query param', () => {
      const { component } = setup({ queryToken: 'xyz789' });
      expect(component.tokenError()).toBe('');
    });

    it('should show error when no token in URL', () => {
      const { component, fixture } = setup();
      expect(component.tokenError()).toBe('Link de redefinição inválido.');

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
    });

    it('should ignore fragment without type=recovery', () => {
      const { component } = setup({ fragment: 'access_token=abc123&type=signup' });
      expect(component.tokenError()).toBe('Link de redefinição inválido.');
    });

    it('should show request new link when token invalid', () => {
      const { fixture } = setup();
      const link = fixture.nativeElement.querySelector('a[href="/auth/forgot-password"]');
      expect(link).toBeTruthy();
      expect(link?.textContent).toContain('Solicitar novo link');
    });
  });

  describe('with valid token', () => {
    let fixture: ComponentFixture<ResetPasswordComponent>;
    let component: ResetPasswordComponent;
    let authService: ReturnType<typeof createMockAuthService>;
    let toastService: jasmine.SpyObj<ToastService>;
    let router: Router;

    beforeEach(() => {
      ({ fixture, component, authService, toastService, router } = setup({
        fragment: 'access_token=valid-token&type=recovery',
      }));
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render heading', () => {
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1?.textContent).toContain('Redefinir senha');
    });

    it('should show form when token is valid', () => {
      expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
    });

    describe('form validation', () => {
      it('should start with invalid form', () => {
        expect(component.resetForm.valid).toBeFalse();
      });

      it('should require new password', () => {
        component.resetForm.controls.newPassword.markAsTouched();
        expect(component.showFieldError('newPassword')).toBeTrue();
      });

      it('should require confirm password', () => {
        component.resetForm.controls.confirmPassword.markAsTouched();
        expect(component.showFieldError('confirmPassword')).toBeTrue();
      });

      it('should reject weak password', () => {
        component.resetForm.controls.newPassword.setValue('abc');
        component.resetForm.controls.newPassword.markAsTouched();
        expect(component.resetForm.controls.newPassword.hasError('passwordStrength')).toBeTrue();
      });

      it('should accept strong password', () => {
        component.resetForm.controls.newPassword.setValue('MyStr0ng!Pass');
        expect(component.resetForm.controls.newPassword.hasError('passwordStrength')).toBeFalse();
      });

      it('should show mismatch when passwords differ', () => {
        component.resetForm.controls.newPassword.setValue('MyStr0ng!Pass');
        component.resetForm.controls.confirmPassword.setValue('Different!1');
        component.resetForm.controls.confirmPassword.markAsTouched();
        expect(component.resetForm.hasError('passwordMismatch')).toBeTrue();
      });

      it('should not mismatch when passwords match', () => {
        component.resetForm.controls.newPassword.setValue('MyStr0ng!Pass');
        component.resetForm.controls.confirmPassword.setValue('MyStr0ng!Pass');
        expect(component.resetForm.hasError('passwordMismatch')).toBeFalse();
      });

      it('should not submit when form is invalid', async () => {
        await component.onSubmit();
        const setSession = authService.getSupabaseClient().auth.setSession;
        expect(setSession).not.toHaveBeenCalled();
      });
    });

    describe('password strength indicator', () => {
      it('should show strength label for weak password', () => {
        component.resetForm.controls.newPassword.setValue('ab');
        fixture.detectChanges();
        expect(component.strengthLabel()).toBe('Fraca');
        expect(component.strengthBars()).toBe(1);
      });

      it('should show strength label for medium password', () => {
        component.resetForm.controls.newPassword.setValue('Abcdefgh');
        fixture.detectChanges();
        expect(component.strengthLabel()).toBe('Média');
        expect(component.strengthBars()).toBe(2);
      });

      it('should show strength label for strong password', () => {
        component.resetForm.controls.newPassword.setValue('Abcdef1234');
        fixture.detectChanges();
        expect(component.strengthLabel()).toBe('Forte');
        expect(component.strengthBars()).toBe(3);
      });

      it('should show strength label for very strong password', () => {
        component.resetForm.controls.newPassword.setValue('Abcdefgh12!@#');
        fixture.detectChanges();
        expect(component.strengthLabel()).toBe('Muito forte');
        expect(component.strengthBars()).toBe(4);
      });

      it('should render strength bars in DOM', () => {
        component.resetForm.controls.newPassword.setValue('Abcdefgh12!@#');
        fixture.detectChanges();
        const bars = fixture.nativeElement.querySelectorAll('#password-strength .rounded-full');
        expect(bars.length).toBe(4);
      });
    });

    describe('password toggle', () => {
      it('should toggle password visibility', () => {
        expect(component.showPassword()).toBeFalse();
        component.togglePasswordVisibility();
        expect(component.showPassword()).toBeTrue();
        component.togglePasswordVisibility();
        expect(component.showPassword()).toBeFalse();
      });

      it('should update input type in DOM', () => {
        const input = fixture.nativeElement.querySelector('#reset-password');
        expect(input?.type).toBe('password');

        component.togglePasswordVisibility();
        fixture.detectChanges();

        expect(input?.type).toBe('text');
      });

      it('should update toggle button aria-label', () => {
        const button = fixture.nativeElement.querySelector('button[type="button"]');
        expect(button?.getAttribute('aria-label')).toBe('Mostrar senha');

        component.togglePasswordVisibility();
        fixture.detectChanges();

        expect(button?.getAttribute('aria-label')).toBe('Ocultar senha');
      });
    });

    describe('submission', () => {
      beforeEach(() => {
        component.resetForm.controls.newPassword.setValue('MyStr0ng!Pass');
        component.resetForm.controls.confirmPassword.setValue('MyStr0ng!Pass');
      });

      it('should call setSession then updatePassword on submit', async () => {
        await component.onSubmit();

        const setSession = authService.getSupabaseClient().auth.setSession;
        expect(setSession).toHaveBeenCalledWith({
          access_token: 'valid-token',
          refresh_token: '',
        });
        expect(authService.updatePassword).toHaveBeenCalledWith('MyStr0ng!Pass');
      });

      it('should show toast and redirect on success', async () => {
        await component.onSubmit();
        expect(toastService.success).toHaveBeenCalledWith('Senha alterada!', jasmine.any(String));
        expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
      });

      it('should manage loading state during submission', async () => {
        const setSessionSpy = authService.getSupabaseClient().auth.setSession as jasmine.Spy;
        setSessionSpy.and.callFake(
          () => new Promise((resolve) => setTimeout(() => resolve({ data: { session: {} }, error: null }), 100)),
        );

        const promise = component.onSubmit();
        expect(component.isSubmitting()).toBeTrue();

        fixture.detectChanges();
        const button = fixture.nativeElement.querySelector('button[type="submit"]');
        expect(button?.disabled).toBeTrue();
        expect(button?.textContent).toContain('Redefinindo...');

        await promise;
        expect(component.isSubmitting()).toBeFalse();
      });

      it('should show token error when session expired', async () => {
        const setSessionSpy = authService.getSupabaseClient().auth.setSession as jasmine.Spy;
        setSessionSpy.and.resolveTo({
          data: { session: null },
          error: { message: 'Token has expired', status: 401 },
        });

        await component.onSubmit();
        expect(component.tokenError()).toContain('expirou');
      });

      it('should show token error when session invalid', async () => {
        const setSessionSpy = authService.getSupabaseClient().auth.setSession as jasmine.Spy;
        setSessionSpy.and.resolveTo({
          data: { session: null },
          error: { message: 'Invalid token', status: 401 },
        });

        await component.onSubmit();
        expect(component.tokenError()).toContain('inválido');
      });

      it('should show error when updatePassword fails', async () => {
        authService.updatePassword.and.resolveTo({
          data: { user: null },
          error: { message: 'Password already used' },
        } as never);

        await component.onSubmit();
        fixture.detectChanges();

        expect(component.errorMessage()).toBe('Password already used');
        expect(toastService.success).not.toHaveBeenCalled();
      });

      it('should show generic error on unexpected exception', async () => {
        const setSessionSpy = authService.getSupabaseClient().auth.setSession as jasmine.Spy;
        setSessionSpy.and.rejectWith(new Error('Network failure'));

        await component.onSubmit();
        fixture.detectChanges();

        expect(component.errorMessage()).toContain('erro inesperado');
      });
    });

    describe('accessibility', () => {
      it('should have autofocus on password field', () => {
        const input = fixture.nativeElement.querySelector('#reset-password');
        expect(input?.hasAttribute('autofocus')).toBeTrue();
      });

      it('should have labels for both fields', () => {
        expect(fixture.nativeElement.querySelector('label[for="reset-password"]')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('label[for="reset-confirm"]')).toBeTruthy();
      });

      it('should have sr-only required text', () => {
        const srTexts = fixture.nativeElement.querySelectorAll('.sr-only');
        const texts = Array.from(srTexts).map((el) => (el as HTMLElement).textContent);
        expect(texts.filter((t) => t === '(obrigatório)').length).toBe(2);
      });

      it('should have aria-label on submit button', () => {
        const button = fixture.nativeElement.querySelector('button[type="submit"]');
        expect(button?.getAttribute('aria-label')).toBe('Redefinir senha');
      });

      it('should have password-strength as live region', () => {
        const region = fixture.nativeElement.querySelector('#password-strength');
        expect(region?.getAttribute('role')).toBe('status');
        expect(region?.getAttribute('aria-live')).toBe('polite');
      });
    });
  });
});

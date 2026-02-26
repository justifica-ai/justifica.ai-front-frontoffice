import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;
  let toastService: jasmine.SpyObj<ToastService>;

  function createMockAuthService(): jasmine.SpyObj<AuthService> {
    return jasmine.createSpyObj('AuthService', [
      'signIn',
      'resendVerificationEmail',
    ]);
  }

  function setup(queryParams: Record<string, string> = {}): void {
    authService = createMockAuthService();
    authService.signIn.and.resolveTo({ data: { user: {}, session: {} }, error: null } as never);
    authService.resendVerificationEmail.and.resolveTo({ data: {}, error: null } as never);

    toastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ToastService, useValue: toastService },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => queryParams[key] ?? null,
              },
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();
  }

  beforeEach(() => {
    setup();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the login heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Entrar');
  });

  it('should have autofocus on email field', () => {
    const emailInput = fixture.nativeElement.querySelector('#login-email') as HTMLInputElement;
    expect(emailInput.hasAttribute('autofocus')).toBeTrue();
  });

  it('should have autocomplete email on email field', () => {
    const emailInput = fixture.nativeElement.querySelector('#login-email') as HTMLInputElement;
    expect(emailInput.getAttribute('autocomplete')).toBe('email');
  });

  it('should have autocomplete current-password on password field', () => {
    const passwordInput = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
    expect(passwordInput.getAttribute('autocomplete')).toBe('current-password');
  });

  describe('form validation', () => {
    it('should start with an invalid form', () => {
      expect(component.loginForm.valid).toBeFalse();
    });

    it('should require email', () => {
      component.loginForm.controls.email.markAsTouched();
      fixture.detectChanges();
      expect(component.showFieldError('email')).toBeTrue();
      expect(component.getFieldError('email')).toBe('E-mail é obrigatório.');
    });

    it('should require password', () => {
      component.loginForm.controls.password.markAsTouched();
      fixture.detectChanges();
      expect(component.showFieldError('password')).toBeTrue();
      expect(component.getFieldError('password')).toBe('Senha é obrigatória.');
    });

    it('should validate email format', () => {
      component.loginForm.controls.email.setValue('not-an-email');
      component.loginForm.controls.email.markAsTouched();
      fixture.detectChanges();
      expect(component.getFieldError('email')).toBe('Formato de e-mail inválido.');
    });

    it('should accept valid email', () => {
      component.loginForm.controls.email.setValue('user@example.com');
      component.loginForm.controls.email.markAsTouched();
      expect(component.showFieldError('email')).toBeFalse();
    });

    it('should not show errors before field is touched', () => {
      expect(component.showFieldError('email')).toBeFalse();
      expect(component.showFieldError('password')).toBeFalse();
    });

    it('should mark all controls as touched on invalid submit', async () => {
      await component.onSubmit();
      expect(component.loginForm.controls.email.touched).toBeTrue();
      expect(component.loginForm.controls.password.touched).toBeTrue();
    });
  });

  describe('password visibility toggle', () => {
    it('should start with password hidden', () => {
      expect(component.showPassword()).toBeFalse();
      const passwordInput = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
    });

    it('should toggle password visibility', () => {
      component.togglePasswordVisibility();
      expect(component.showPassword()).toBeTrue();

      fixture.detectChanges();
      const passwordInput = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
      expect(passwordInput.type).toBe('text');
    });

    it('should toggle back to hidden', () => {
      component.togglePasswordVisibility();
      component.togglePasswordVisibility();
      expect(component.showPassword()).toBeFalse();
    });

    it('should update aria-label on toggle button', () => {
      const toggleBtn = fixture.nativeElement.querySelector('[aria-label="Mostrar senha"]');
      expect(toggleBtn).toBeTruthy();

      component.togglePasswordVisibility();
      fixture.detectChanges();

      const hiddenBtn = fixture.nativeElement.querySelector('[aria-label="Ocultar senha"]');
      expect(hiddenBtn).toBeTruthy();
    });
  });

  describe('form submission', () => {
    function fillValidForm(): void {
      component.loginForm.controls.email.setValue('user@example.com');
      component.loginForm.controls.password.setValue('S3cure!Pass');
    }

    it('should call signIn with form values', async () => {
      fillValidForm();
      await component.onSubmit();
      expect(authService.signIn).toHaveBeenCalledWith('user@example.com', 'S3cure!Pass');
    });

    it('should navigate to root on successful login', async () => {
      fillValidForm();
      await component.onSubmit();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should navigate to returnUrl on successful login', async () => {
      setup({ returnUrl: '/appeals/new' });
      component.loginForm.controls.email.setValue('user@example.com');
      component.loginForm.controls.password.setValue('S3cure!Pass');
      await component.onSubmit();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/appeals/new');
    });

    it('should show loading state during submission', async () => {
      fillValidForm();
      // Use a slow response to check isSubmitting
      authService.signIn.and.callFake(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { user: {}, session: {} }, error: null } as never), 100)),
      );

      const submitPromise = component.onSubmit();
      expect(component.isSubmitting()).toBeTrue();

      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.disabled).toBeTrue();
      expect(button.textContent).toContain('Entrando...');

      await submitPromise;
      expect(component.isSubmitting()).toBeFalse();
    });

    it('should not call signIn if form is invalid', async () => {
      await component.onSubmit();
      expect(authService.signIn).not.toHaveBeenCalled();
    });

    it('should clear previous errors before submitting', async () => {
      fillValidForm();
      component['errorMessage'].set('Previous error');
      component['emailNotVerified'].set(true);
      component['accountSuspended'].set(true);

      await component.onSubmit();

      // After successful submit, these should be cleared
      expect(component.errorMessage()).toBe('');
      expect(component.emailNotVerified()).toBeFalse();
      expect(component.accountSuspended()).toBeFalse();
    });
  });

  describe('error handling', () => {
    function fillAndSubmitWithError(errorMessage: string, status?: number): Promise<void> {
      component.loginForm.controls.email.setValue('user@example.com');
      component.loginForm.controls.password.setValue('S3cure!Pass');
      authService.signIn.and.resolveTo({
        data: { user: null, session: null },
        error: { message: errorMessage, status: status ?? 400 },
      } as never);
      return component.onSubmit();
    }

    it('should show generic error for invalid credentials', async () => {
      await fillAndSubmitWithError('Invalid login credentials');
      expect(component.errorMessage()).toBe('E-mail ou senha incorretos.');
    });

    it('should show email not verified card', async () => {
      await fillAndSubmitWithError('Email not confirmed');
      fixture.detectChanges();
      expect(component.emailNotVerified()).toBeTrue();
      const card = fixture.nativeElement.querySelector('[role="alert"]');
      expect(card?.textContent).toContain('E-mail não verificado');
    });

    it('should show account suspended card', async () => {
      await fillAndSubmitWithError('User banned');
      fixture.detectChanges();
      expect(component.accountSuspended()).toBeTrue();
      const card = fixture.nativeElement.querySelector('[role="alert"]');
      expect(card?.textContent).toContain('Conta suspensa');
    });

    it('should show retry countdown on rate limit', fakeAsync(() => {
      component.loginForm.controls.email.setValue('user@example.com');
      component.loginForm.controls.password.setValue('S3cure!Pass');
      authService.signIn.and.resolveTo({
        data: { user: null, session: null },
        error: { message: 'Rate limit exceeded', status: 429 },
      } as never);

      component.onSubmit();
      tick();
      fixture.detectChanges();

      expect(component.retryAfter()).toBe(30);

      // Countdown decreases
      tick(1000);
      expect(component.retryAfter()).toBe(29);

      // Clean up remaining countdown
      tick(29000);
      expect(component.retryAfter()).toBe(0);
    }));

    it('should disable submit button during retry countdown', fakeAsync(() => {
      component.loginForm.controls.email.setValue('user@example.com');
      component.loginForm.controls.password.setValue('S3cure!Pass');
      authService.signIn.and.resolveTo({
        data: { user: null, session: null },
        error: { message: 'too many requests', status: 429 },
      } as never);

      component.onSubmit();
      tick();
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.disabled).toBeTrue();

      tick(30000);
    }));

    it('should show fallback error for unexpected errors', async () => {
      await fillAndSubmitWithError('Some unexpected error');
      expect(component.errorMessage()).toContain('erro ao fazer login');
    });

    it('should handle thrown exceptions gracefully', async () => {
      component.loginForm.controls.email.setValue('user@example.com');
      component.loginForm.controls.password.setValue('S3cure!Pass');
      authService.signIn.and.rejectWith(new Error('Network error'));

      await component.onSubmit();

      expect(component.errorMessage()).toContain('erro inesperado');
      expect(component.isSubmitting()).toBeFalse();
    });
  });

  describe('resend verification email', () => {
    it('should call resendVerificationEmail', async () => {
      component.loginForm.controls.email.setValue('user@example.com');
      await component.resendVerification();
      expect(authService.resendVerificationEmail).toHaveBeenCalledWith('user@example.com');
    });

    it('should show success toast on resend', async () => {
      await component.resendVerification();
      expect(toastService.success).toHaveBeenCalledWith('E-mail reenviado', jasmine.any(String));
    });

    it('should show error toast on resend failure', async () => {
      authService.resendVerificationEmail.and.resolveTo({ data: {}, error: { message: 'failed' } } as never);
      await component.resendVerification();
      expect(toastService.error).toHaveBeenCalled();
    });

    it('should manage resendingVerification signal', async () => {
      expect(component.resendingVerification()).toBeFalse();

      authService.resendVerificationEmail.and.callFake(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null } as never), 100)),
      );

      const promise = component.resendVerification();
      expect(component.resendingVerification()).toBeTrue();
      await promise;
      expect(component.resendingVerification()).toBeFalse();
    });
  });

  describe('deep linking', () => {
    it('should default returnUrl to root', () => {
      expect(component['returnUrl']).toBe('/');
    });

    it('should read returnUrl from query params', () => {
      setup({ returnUrl: '/profile' });
      expect(component['returnUrl']).toBe('/profile');
    });
  });

  describe('accessibility', () => {
    it('should have labels for all form fields', () => {
      const labels = fixture.nativeElement.querySelectorAll('label');
      expect(labels.length).toBeGreaterThanOrEqual(3); // email, password, remember me
    });

    it('should have aria-label on submit button', () => {
      const button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on password toggle', () => {
      const toggleBtn = fixture.nativeElement.querySelector('button[aria-label="Mostrar senha"]');
      expect(toggleBtn).toBeTruthy();
    });

    it('should have role="alert" on error messages', async () => {
      component.loginForm.controls.email.markAsTouched();
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
    });

    it('should link error to input via aria-describedby', () => {
      component.loginForm.controls.email.setValue('');
      component.loginForm.controls.email.markAsTouched();
      fixture.detectChanges();
      const emailInput = fixture.nativeElement.querySelector('#login-email');
      expect(emailInput.getAttribute('aria-describedby')).toBe('login-email-error');
    });

    it('should have sr-only text for required fields', () => {
      const srTexts = fixture.nativeElement.querySelectorAll('.sr-only');
      const texts = Array.from(srTexts).map((el) => (el as HTMLElement).textContent);
      expect(texts).toContain('(obrigatório)');
    });
  });

  describe('navigation links', () => {
    it('should have link to register page', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const link = compiled.querySelector('a[href="/auth/register"]');
      expect(link).toBeTruthy();
      expect(link?.textContent).toContain('Criar conta');
    });

    it('should have link to forgot password page', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const link = compiled.querySelector('a[href="/auth/forgot-password"]');
      expect(link).toBeTruthy();
      expect(link?.textContent).toContain('Esqueci minha senha');
    });
  });
});

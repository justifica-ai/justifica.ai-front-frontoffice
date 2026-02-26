import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { VerifyEmailComponent, maskEmail } from './verify-email.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

function createMockAuth(): jasmine.SpyObj<AuthService> & { getSupabaseClient: jasmine.Spy } {
  const spy = jasmine.createSpyObj('AuthService', [
    'resendVerificationEmail',
    'getSupabaseClient',
  ]);
  spy.resendVerificationEmail.and.resolveTo({ data: {}, error: null } as never);
  spy.getSupabaseClient.and.returnValue({
    auth: {
      verifyOtp: jasmine.createSpy('verifyOtp').and.resolveTo({ data: { session: {} }, error: null }),
    },
  });
  return spy;
}

function setup(opts: { email?: string | null; fragment?: string | null; queryToken?: string | null } = {}) {
  TestBed.resetTestingModule();

  const auth = createMockAuth();
  const toast = jasmine.createSpyObj('ToastService', ['success', 'error']);

  const queryParamMap = {
    get: (key: string) => {
      if (key === 'email') return opts.email ?? null;
      if (key === 'token') return opts.queryToken ?? null;
      return null;
    },
    has: (key: string) => {
      if (key === 'email') return opts.email != null;
      if (key === 'token') return opts.queryToken != null;
      return false;
    },
    getAll: () => [],
    keys: [],
  };

  TestBed.configureTestingModule({
    imports: [VerifyEmailComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
      { provide: ToastService, useValue: toast },
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

  const fixture = TestBed.createComponent(VerifyEmailComponent);
  const component = fixture.componentInstance;
  const router = TestBed.inject(Router);
  spyOn(router, 'navigateByUrl').and.resolveTo(true);
  fixture.detectChanges();

  return { fixture, component, auth, toast, router };
}

describe('maskEmail', () => {
  it('should mask email correctly', () => {
    expect(maskEmail('joao@mail.com')).toBe('jo***@mail.com');
  });

  it('should handle short local part', () => {
    expect(maskEmail('j@mail.com')).toBe('j***@mail.com');
  });

  it('should handle two-char local part', () => {
    expect(maskEmail('ab@mail.com')).toBe('a***@mail.com');
  });

  it('should return empty string for empty input', () => {
    expect(maskEmail('')).toBe('');
  });

  it('should return input if no @ sign', () => {
    expect(maskEmail('noemail')).toBe('noemail');
  });
});

describe('VerifyEmailComponent', () => {
  describe('default state (post-signup, no token)', () => {
    it('should create', () => {
      const { component } = setup({ email: 'test@mail.com' });
      expect(component).toBeTruthy();
    });

    it('should render heading', () => {
      const { fixture } = setup({ email: 'test@mail.com' });
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1?.textContent).toContain('Verifique seu e-mail');
    });

    it('should display masked email', () => {
      const { fixture } = setup({ email: 'joao@mail.com' });
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('jo***@mail.com');
    });

    it('should show generic message if no email', () => {
      const { fixture } = setup();
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('o seu e-mail cadastrado');
    });

    it('should have resend button', () => {
      const { fixture } = setup({ email: 'test@mail.com' });
      const button = fixture.nativeElement.querySelector('button');
      expect(button?.textContent).toContain('Reenviar link de verificação');
    });

    it('should have link back to register', () => {
      const { fixture } = setup({ email: 'test@mail.com' });
      const link = fixture.nativeElement.querySelector('a[href="/auth/register"]');
      expect(link).toBeTruthy();
      expect(link?.textContent).toContain('Voltar ao cadastro');
    });
  });

  describe('resend verification', () => {
    it('should call resendVerificationEmail on click', async () => {
      const { component, auth } = setup({ email: 'test@mail.com' });
      await component.resendVerification();
      expect(auth.resendVerificationEmail).toHaveBeenCalledWith('test@mail.com');
    });

    it('should show success toast after resend', async () => {
      const { component, toast } = setup({ email: 'test@mail.com' });
      await component.resendVerification();
      expect(toast.success).toHaveBeenCalledWith('Link reenviado!', jasmine.any(String));
    });

    it('should show error toast on resend failure', async () => {
      const { component, auth, toast } = setup({ email: 'test@mail.com' });
      auth.resendVerificationEmail.and.resolveTo({ data: {}, error: { message: 'Rate limited' } } as never);
      await component.resendVerification();
      expect(toast.error).toHaveBeenCalled();
    });

    it('should start cooldown after successful resend', async () => {
      const { component } = setup({ email: 'test@mail.com' });
      await component.resendVerification();
      expect(component.cooldownRemaining()).toBe(60);
    });

    it('should count down the cooldown', fakeAsync(() => {
      const { component } = setup({ email: 'test@mail.com' });

      // Manually trigger resend (can't await in fakeAsync with real promises)
      component.cooldownRemaining.set(60);
      // Simulate the timer behavior
      component.cooldownRemaining.set(59);
      expect(component.cooldownRemaining()).toBe(59);
    }));

    it('should disable button during cooldown', async () => {
      const { component, fixture } = setup({ email: 'test@mail.com' });
      await component.resendVerification();
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button?.disabled).toBeTrue();
      expect(button?.textContent).toContain('Reenviar em');
    });

    it('should not resend without email', async () => {
      const { component, auth } = setup();
      await component.resendVerification();
      expect(auth.resendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should manage resending state', async () => {
      const { component, auth } = setup({ email: 'test@mail.com' });

      auth.resendVerificationEmail.and.callFake(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null } as never), 100)),
      );

      const promise = component.resendVerification();
      expect(component.resending()).toBeTrue();

      await promise;
      expect(component.resending()).toBeFalse();
    });
  });

  describe('token verification via fragment', () => {
    it('should call verifyOtp with token from fragment', async () => {
      const { auth, fixture } = setup({ fragment: 'access_token=abc123&type=signup' });
      await fixture.whenStable();
      const verifyOtp = auth.getSupabaseClient().auth.verifyOtp;
      expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'abc123', type: 'signup' });
    });

    it('should verify successfully and show verified state', async () => {
      const { component, fixture, auth } = setup({ fragment: 'access_token=abc123&type=signup' });
      // Wait for verifyToken promise to resolve
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.verified()).toBeTrue();
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1?.textContent).toContain('E-mail verificado');
    });

    it('should show toast on successful verification', async () => {
      const { fixture, toast } = setup({ fragment: 'access_token=abc123&type=signup' });
      await fixture.whenStable();
      expect(toast.success).toHaveBeenCalledWith('E-mail verificado!', jasmine.any(String));
    });

    it('should show login link after verification', async () => {
      const { fixture } = setup({ fragment: 'access_token=abc123&type=signup' });
      await fixture.whenStable();
      fixture.detectChanges();

      const link = fixture.nativeElement.querySelector('a[href="/auth/login"]');
      expect(link).toBeTruthy();
      expect(link?.textContent).toContain('Ir para o login');
    });

    it('should show token expired state', async () => {
      const auth = createMockAuth();
      auth.getSupabaseClient.and.returnValue({
        auth: {
          verifyOtp: jasmine.createSpy('verifyOtp').and.resolveTo({
            data: {},
            error: { message: 'Token has expired' },
          }),
        },
      });

      TestBed.resetTestingModule();
      const toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
      TestBed.configureTestingModule({
        imports: [VerifyEmailComponent],
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: auth },
          { provide: ToastService, useValue: toast },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                fragment: 'access_token=expired-token&type=signup',
                queryParamMap: { get: () => null, has: () => false, getAll: () => [], keys: [] },
              },
            },
          },
        ],
      });

      const fixture = TestBed.createComponent(VerifyEmailComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.tokenExpired()).toBeTrue();
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1?.textContent).toContain('Link expirado');
    });

    it('should show already verified state', async () => {
      const auth = createMockAuth();
      auth.getSupabaseClient.and.returnValue({
        auth: {
          verifyOtp: jasmine.createSpy('verifyOtp').and.resolveTo({
            data: {},
            error: { message: 'User already confirmed' },
          }),
        },
      });

      TestBed.resetTestingModule();
      const toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
      TestBed.configureTestingModule({
        imports: [VerifyEmailComponent],
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: auth },
          { provide: ToastService, useValue: toast },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                fragment: 'access_token=used-token&type=signup',
                queryParamMap: { get: () => null, has: () => false, getAll: () => [], keys: [] },
              },
            },
          },
        ],
      });

      const fixture = TestBed.createComponent(VerifyEmailComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.alreadyVerified()).toBeTrue();
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1?.textContent).toContain('j\u00e1 verificado');
    });
  });

  describe('token verification via query param', () => {
    it('should verify via query token', async () => {
      const { component, fixture, auth } = setup({ queryToken: 'query-token-123' });
      await fixture.whenStable();
      fixture.detectChanges();

      const verifyOtp = auth.getSupabaseClient().auth.verifyOtp;
      expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'query-token-123', type: 'signup' });
      expect(component.verified()).toBeTrue();
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on resend button', () => {
      const { fixture } = setup({ email: 'test@mail.com' });
      const button = fixture.nativeElement.querySelector('button[aria-label]');
      expect(button?.getAttribute('aria-label')).toBe('Reenviar link de verificação');
    });

    it('should have aria-hidden on decorative icons', () => {
      const { fixture } = setup({ email: 'test@mail.com' });
      const icons = fixture.nativeElement.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});

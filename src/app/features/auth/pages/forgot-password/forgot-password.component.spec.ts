import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['resetPassword']);
    authService.resetPassword.and.resolveTo({ data: {}, error: null } as never);

    TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
      ],
    });

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent).toContain('Esqueci minha senha');
  });

  it('should show form initially, not success message', () => {
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeFalsy();
  });

  describe('form validation', () => {
    it('should start with an invalid form', () => {
      expect(component.forgotForm.valid).toBeFalse();
    });

    it('should require email', () => {
      component.forgotForm.controls.email.markAsTouched();
      expect(component.showFieldError()).toBeTrue();
      expect(component.getFieldError()).toBe('E-mail é obrigatório.');
    });

    it('should validate email format', () => {
      component.forgotForm.controls.email.setValue('bad-email');
      component.forgotForm.controls.email.markAsTouched();
      expect(component.getFieldError()).toBe('Formato de e-mail inválido.');
    });

    it('should accept valid email', () => {
      component.forgotForm.controls.email.setValue('user@example.com');
      expect(component.forgotForm.valid).toBeTrue();
    });

    it('should not submit when form is invalid', async () => {
      await component.onSubmit();
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });
  });

  describe('submission', () => {
    it('should call resetPassword on valid submit', async () => {
      component.forgotForm.controls.email.setValue('user@example.com');
      await component.onSubmit();
      expect(authService.resetPassword).toHaveBeenCalledWith('user@example.com');
    });

    it('should show success message after submission', async () => {
      component.forgotForm.controls.email.setValue('user@example.com');
      await component.onSubmit();
      fixture.detectChanges();

      expect(component.submitted()).toBeTrue();
      expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('form')).toBeFalsy();
    });

    it('should show anti-enumeration message', async () => {
      component.forgotForm.controls.email.setValue('user@example.com');
      await component.onSubmit();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Se este e-mail estiver cadastrado');
    });

    it('should show success even when auth throws', async () => {
      authService.resetPassword.and.rejectWith(new Error('Network error'));
      component.forgotForm.controls.email.setValue('user@example.com');
      await component.onSubmit();
      fixture.detectChanges();

      expect(component.submitted()).toBeTrue();
    });

    it('should manage loading state', async () => {
      component.forgotForm.controls.email.setValue('user@example.com');

      authService.resetPassword.and.callFake(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null } as never), 100)),
      );

      const promise = component.onSubmit();
      expect(component.isSubmitting()).toBeTrue();

      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button?.disabled).toBeTrue();
      expect(button?.textContent).toContain('Enviando...');

      await promise;
      expect(component.isSubmitting()).toBeFalse();
    });
  });

  describe('accessibility', () => {
    it('should have autofocus on email', () => {
      const input = fixture.nativeElement.querySelector('#forgot-email');
      expect(input?.hasAttribute('autofocus')).toBeTrue();
    });

    it('should have label for email field', () => {
      const label = fixture.nativeElement.querySelector('label[for="forgot-email"]');
      expect(label).toBeTruthy();
    });

    it('should have sr-only required text', () => {
      const srTexts = fixture.nativeElement.querySelectorAll('.sr-only');
      const texts = Array.from(srTexts).map((el) => (el as HTMLElement).textContent);
      expect(texts).toContain('(obrigatório)');
    });

    it('should have aria-label on submit button', () => {
      const button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button?.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('navigation', () => {
    it('should have link back to login', () => {
      const link = fixture.nativeElement.querySelector('a[href="/auth/login"]');
      expect(link).toBeTruthy();
      expect(link?.textContent).toContain('Voltar para o login');
    });
  });
});

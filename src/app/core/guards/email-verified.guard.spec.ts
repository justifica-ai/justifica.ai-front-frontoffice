import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { signal } from '@angular/core';
import { emailVerifiedGuard } from './email-verified.guard';
import { AuthService } from '../services/auth.service';

describe('emailVerifiedGuard', () => {
  let mockAuthService: { user: ReturnType<typeof signal> };
  let router: jasmine.SpyObj<Router>;
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/appeals/new' } as RouterStateSnapshot;

  beforeEach(() => {
    mockAuthService = {
      user: signal(null as unknown),
    };
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue({} as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('should redirect to login when no user', () => {
    mockAuthService.user.set(null);
    TestBed.runInInjectionContext(() => emailVerifiedGuard(mockRoute, mockState));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should allow access when email is verified', () => {
    mockAuthService.user.set({ email_confirmed_at: '2024-01-01T00:00:00Z' });
    const result = TestBed.runInInjectionContext(() => emailVerifiedGuard(mockRoute, mockState));
    expect(result).toBeTrue();
  });

  it('should redirect to verify-email when email not confirmed', () => {
    mockAuthService.user.set({ email_confirmed_at: null });
    TestBed.runInInjectionContext(() => emailVerifiedGuard(mockRoute, mockState));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/verify-email']);
  });

  it('should redirect to verify-email when email_confirmed_at is undefined', () => {
    mockAuthService.user.set({ email: 'test@example.com' });
    TestBed.runInInjectionContext(() => emailVerifiedGuard(mockRoute, mockState));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/verify-email']);
  });
});

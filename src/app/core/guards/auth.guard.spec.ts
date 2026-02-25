import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('authGuard', () => {
  let mockAuthService: {
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    isLoading: ReturnType<typeof signal<boolean>>;
  };
  let router: jasmine.SpyObj<Router>;
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/appeals/new' } as RouterStateSnapshot;

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: signal(false),
      isLoading: signal(false),
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

  it('should allow access when authenticated', () => {
    mockAuthService.isAuthenticated.set(true);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBeTrue();
  });

  it('should allow access when loading (auth initializing)', () => {
    mockAuthService.isLoading.set(true);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBeTrue();
  });

  it('should redirect to login when not authenticated and not loading', () => {
    mockAuthService.isAuthenticated.set(false);
    mockAuthService.isLoading.set(false);
    TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
  });
});

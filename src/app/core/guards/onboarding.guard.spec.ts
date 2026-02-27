import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { signal } from '@angular/core';
import { onboardingGuard } from './onboarding.guard';
import { ProfileService } from '../../features/onboarding/services/profile.service';
import { APP_ROUTES } from '../constants/app-routes';
import type { UserProfile } from '../models/user.model';

const MOCK_PROFILE: UserProfile = {
  id: 'u-001',
  email: 'test@example.com',
  fullName: 'Test User',
  phone: '11999999999',
  role: 'user',
  status: 'active',
  emailVerified: true,
  onboardingCompleted: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('onboardingGuard', () => {
  let mockProfileService: {
    profile: ReturnType<typeof signal<UserProfile | null>>;
    onboardingCompleted: ReturnType<typeof signal<boolean>>;
    loadProfile: jasmine.Spy;
  };
  let router: jasmine.SpyObj<Router>;
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/appeals' } as RouterStateSnapshot;

  beforeEach(() => {
    const profileSig = signal<UserProfile | null>(null);
    mockProfileService = {
      profile: profileSig,
      onboardingCompleted: signal(false),
      loadProfile: jasmine.createSpy('loadProfile').and.resolveTo(MOCK_PROFILE),
    };

    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue({} as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: ProfileService, useValue: mockProfileService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('should load profile if not cached', async () => {
    mockProfileService.onboardingCompleted.set(true);
    await TestBed.runInInjectionContext(() => onboardingGuard(mockRoute, mockState));
    expect(mockProfileService.loadProfile).toHaveBeenCalled();
  });

  it('should not reload profile if already cached', async () => {
    mockProfileService.profile.set(MOCK_PROFILE);
    mockProfileService.onboardingCompleted.set(true);
    await TestBed.runInInjectionContext(() => onboardingGuard(mockRoute, mockState));
    expect(mockProfileService.loadProfile).not.toHaveBeenCalled();
  });

  it('should allow access when onboarding is completed', async () => {
    mockProfileService.profile.set(MOCK_PROFILE);
    mockProfileService.onboardingCompleted.set(true);
    const result = await TestBed.runInInjectionContext(() => onboardingGuard(mockRoute, mockState));
    expect(result).toBeTrue();
  });

  it('should redirect to onboarding when not completed', async () => {
    mockProfileService.profile.set({ ...MOCK_PROFILE, onboardingCompleted: false });
    mockProfileService.onboardingCompleted.set(false);
    await TestBed.runInInjectionContext(() => onboardingGuard(mockRoute, mockState));
    expect(router.createUrlTree).toHaveBeenCalledWith([APP_ROUTES.ONBOARDING]);
  });

  it('should allow access if profile load fails', async () => {
    mockProfileService.loadProfile.and.rejectWith(new Error('Network error'));
    const result = await TestBed.runInInjectionContext(() => onboardingGuard(mockRoute, mockState));
    expect(result).toBeTrue();
  });

  it('should return UrlTree when redirecting', async () => {
    const urlTree = {} as UrlTree;
    router.createUrlTree.and.returnValue(urlTree);
    mockProfileService.profile.set({ ...MOCK_PROFILE, onboardingCompleted: false });
    mockProfileService.onboardingCompleted.set(false);
    const result = await TestBed.runInInjectionContext(() => onboardingGuard(mockRoute, mockState));
    expect(result).toBe(urlTree);
  });
});

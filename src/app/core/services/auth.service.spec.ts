import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have isAuthenticated as false initially', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should have isLoading as true initially', () => {
    // isLoading starts true until onAuthStateChange fires or getSession resolves
    expect(service.isLoading()).toBeTrue();
  });

  it('should have user as null initially', () => {
    expect(service.user()).toBeNull();
  });

  it('should have session as null initially', () => {
    expect(service.session()).toBeNull();
  });

  it('should have role as "user" by default', () => {
    expect(service.role()).toBe('user');
  });

  it('should expose getSupabaseClient', () => {
    expect(service.getSupabaseClient()).toBeTruthy();
  });

  it('should return null access token when no session', async () => {
    const token = await service.getAccessToken();
    expect(token).toBeNull();
  });
});

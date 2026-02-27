import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AppLayoutComponent } from './app-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

describe('AppLayoutComponent', () => {
  let component: AppLayoutComponent;
  let fixture: ComponentFixture<AppLayoutComponent>;

  const mockAuthService = {
    user: signal(null as unknown),
    session: signal(null as unknown),
    isAuthenticated: signal(false),
    isLoading: signal(false),
    signOut: jasmine.createSpy('signOut').and.returnValue(Promise.resolve()),
  };

  const mockNotificationService = {
    notifications: signal([] as unknown[]),
    unreadCount: signal(0),
    loading: signal(false),
    total: signal(0),
    currentPage: signal(1),
    hasMore: signal(false),
    fetchUnreadCount: jasmine.createSpy('fetchUnreadCount').and.returnValue(Promise.resolve()),
    loadNotifications: jasmine.createSpy('loadNotifications').and.returnValue(Promise.resolve()),
    loadMore: jasmine.createSpy('loadMore').and.returnValue(Promise.resolve()),
    markAsRead: jasmine.createSpy('markAsRead').and.returnValue(Promise.resolve()),
    markAllAsRead: jasmine.createSpy('markAllAsRead').and.returnValue(Promise.resolve()),
    subscribeRealtime: jasmine.createSpy('subscribeRealtime'),
    unsubscribeRealtime: jasmine.createSpy('unsubscribeRealtime'),
    getRelativeTime: jasmine.createSpy('getRelativeTime').and.returnValue('Agora'),
    resetState: jasmine.createSpy('resetState'),
    ngOnDestroy: jasmine.createSpy('ngOnDestroy'),
  };

  beforeEach(async () => {
    mockAuthService.signOut.calls.reset();

    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have navigation items', () => {
    expect(component.navItems.length).toBeGreaterThan(0);
  });

  it('should include "Novo Recurso" in navigation', () => {
    const labels = component.navItems.map((item) => item.label);
    expect(labels).toContain('Novo Recurso');
  });

  it('should include "Meus Recursos" in navigation', () => {
    const labels = component.navItems.map((item) => item.label);
    expect(labels).toContain('Meus Recursos');
  });

  it('should include "Meu Perfil" in navigation', () => {
    const labels = component.navItems.map((item) => item.label);
    expect(labels).toContain('Meu Perfil');
  });

  it('should start with mobile menu closed', () => {
    expect(component.mobileMenuOpen()).toBeFalse();
  });

  it('should toggle mobile menu open', () => {
    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBeTrue();
  });

  it('should toggle mobile menu closed', () => {
    component.toggleMobileMenu();
    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBeFalse();
  });

  it('should close mobile menu', () => {
    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBeTrue();
    component.closeMobileMenu();
    expect(component.mobileMenuOpen()).toBeFalse();
  });

  it('should render router-outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should render brand name "Justifica"', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Justifica');
  });

  it('should call signOut on onSignOut', async () => {
    await component.onSignOut();
    expect(mockAuthService.signOut).toHaveBeenCalled();
  });

  it('should have 5 navigation items', () => {
    expect(component.navItems.length).toBe(5);
  });

  it('should return "?" as user initial when no user', () => {
    mockAuthService.user.set(null);
    expect(component.userInitial()).toBe('?');
  });

  it('should return user initial from email', () => {
    mockAuthService.user.set({ email: 'maria@example.com' });
    expect(component.userInitial()).toBe('M');
  });
});

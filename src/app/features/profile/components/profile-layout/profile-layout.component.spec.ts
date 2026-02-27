import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProfileLayoutComponent, PROFILE_TABS } from './profile-layout.component';

describe('ProfileLayoutComponent', () => {
  let fixture: ComponentFixture<ProfileLayoutComponent>;
  let component: ProfileLayoutComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 5 tabs', () => {
    expect(component.tabs.length).toBe(5);
  });

  it('should render page title', () => {
    const heading = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(heading.textContent?.trim()).toBe('Meu Perfil');
  });

  describe('Desktop tabs', () => {
    it('should render desktop nav with all tab labels', () => {
      const nav = fixture.nativeElement.querySelector('nav[role="tablist"]') as HTMLElement;
      expect(nav).toBeTruthy();
      const links = nav.querySelectorAll('a[role="tab"]') as NodeListOf<HTMLAnchorElement>;
      expect(links.length).toBe(5);
      expect(links[0].textContent?.trim()).toBe('Dados Pessoais');
      expect(links[1].textContent?.trim()).toBe('Veículos');
      expect(links[2].textContent?.trim()).toBe('Segurança');
      expect(links[3].textContent?.trim()).toBe('Comunicação');
      expect(links[4].textContent?.trim()).toBe('Privacidade');
    });
  });

  describe('Mobile dropdown', () => {
    it('should start with mobile menu closed', () => {
      expect(component.mobileMenuOpen()).toBe(false);
    });

    it('should toggle mobile menu on button click', () => {
      const button = fixture.nativeElement.querySelector('button[aria-expanded]') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();
      expect(component.mobileMenuOpen()).toBe(true);
      expect(button.getAttribute('aria-expanded')).toBe('true');
    });

    it('should render mobile dropdown options when open', () => {
      component.mobileMenuOpen.set(true);
      fixture.detectChanges();
      const options = fixture.nativeElement.querySelectorAll('[role="option"]') as NodeListOf<HTMLElement>;
      expect(options.length).toBe(5);
    });

    it('should close mobile menu when option is clicked', () => {
      component.mobileMenuOpen.set(true);
      fixture.detectChanges();
      const option = fixture.nativeElement.querySelector('[role="option"]') as HTMLElement;
      option.click();
      fixture.detectChanges();
      expect(component.mobileMenuOpen()).toBe(false);
    });
  });

  describe('Tab configuration', () => {
    it('should have correct paths', () => {
      expect(PROFILE_TABS[0].path).toBe('/profile');
      expect(PROFILE_TABS[1].path).toBe('/profile/vehicles');
      expect(PROFILE_TABS[2].path).toBe('/profile/security');
      expect(PROFILE_TABS[3].path).toBe('/profile/communication');
      expect(PROFILE_TABS[4].path).toBe('/profile/privacy');
    });

    it('should have correct icons', () => {
      expect(PROFILE_TABS[0].icon).toBe('user');
      expect(PROFILE_TABS[1].icon).toBe('car');
      expect(PROFILE_TABS[2].icon).toBe('shield');
      expect(PROFILE_TABS[3].icon).toBe('bell');
      expect(PROFILE_TABS[4].icon).toBe('lock');
    });
  });

  it('should contain router-outlet', () => {
    const outlet = fixture.nativeElement.querySelector('router-outlet');
    expect(outlet).toBeTruthy();
  });

  it('should have accessible tab navigation', () => {
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    expect(nav.getAttribute('aria-label')).toBe('Abas do perfil');
  });

  it('should have accessible mobile dropdown label', () => {
    const label = fixture.nativeElement.querySelector('label[for="profile-tab-select"]') as HTMLElement;
    expect(label).toBeTruthy();
    expect(label.classList.contains('sr-only')).toBe(true);
  });
});

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AffiliateApplyComponent } from './affiliate-apply.component';
import { AffiliateService } from '../../services/affiliate.service';
import type { AffiliateApplyResponse } from '../../../../core/models/affiliate.model';

describe('AffiliateApplyComponent', () => {
  let component: AffiliateApplyComponent;
  let fixture: ComponentFixture<AffiliateApplyComponent>;
  let router: Router;

  let mockService: Record<string, unknown>;

  const mockApplyResponse: AffiliateApplyResponse = {
    id: 'aff-1',
    code: 'ABC12345',
    status: 'pending',
    message: 'Solicitação enviada com sucesso.',
  };

  beforeEach(async () => {
    mockService = {
      applyLoading: signal(false).asReadonly(),
      apply: jasmine.createSpy('apply').and.resolveTo(null),
    };

    await TestBed.configureTestingModule({
      imports: [AffiliateApplyComponent],
      providers: [
        { provide: AffiliateService, useValue: mockService },
        provideRouter([{ path: 'affiliate', children: [] }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AffiliateApplyComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render page title', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Tornar-se Afiliado');
  });

  it('should render benefits list', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Comissão de 20%');
    expect(el.textContent).toContain('Link exclusivo');
  });

  it('should render form fields', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#pixKeyType')).toBeTruthy();
    expect(el.querySelector('#pixKey')).toBeTruthy();
    expect(el.querySelector('#promotionMethod')).toBeTruthy();
    expect(el.querySelector('#website')).toBeTruthy();
  });

  it('should render back link', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('a[routerLink="/affiliate"]')).toBeTruthy();
  });

  describe('form validation', () => {
    it('should be invalid when empty', () => {
      fixture.detectChanges();
      expect(component.form.invalid).toBeTrue();
    });

    it('should be invalid when pixKeyType is empty', () => {
      fixture.detectChanges();
      component.form.patchValue({
        pixKey: 'test@email.com',
        promotionMethod: 'Redes sociais e YouTube com conteúdo',
      });
      expect(component.form.controls.pixKeyType.invalid).toBeTrue();
    });

    it('should be invalid when pixKey is empty', () => {
      fixture.detectChanges();
      component.form.patchValue({
        pixKeyType: 'email',
        promotionMethod: 'Redes sociais e YouTube com conteúdo',
      });
      expect(component.form.controls.pixKey.invalid).toBeTrue();
    });

    it('should be invalid when promotionMethod is too short', () => {
      fixture.detectChanges();
      component.form.patchValue({
        pixKeyType: 'email',
        pixKey: 'test@email.com',
        promotionMethod: 'short',
      });
      expect(component.form.controls.promotionMethod.errors?.['minlength']).toBeTruthy();
    });

    it('should be invalid when promotionMethod is too long', () => {
      fixture.detectChanges();
      component.form.patchValue({
        pixKeyType: 'email',
        pixKey: 'test@email.com',
        promotionMethod: 'a'.repeat(501),
      });
      expect(component.form.controls.promotionMethod.errors?.['maxlength']).toBeTruthy();
    });

    it('should be valid with correct data', () => {
      fixture.detectChanges();
      component.form.patchValue({
        pixKeyType: 'email',
        pixKey: 'test@email.com',
        promotionMethod: 'Redes sociais e YouTube com conteúdo sobre trânsito',
      });
      expect(component.form.valid).toBeTrue();
    });

    it('should accept optional website', () => {
      fixture.detectChanges();
      component.form.patchValue({
        pixKeyType: 'email',
        pixKey: 'test@email.com',
        promotionMethod: 'Redes sociais e YouTube com conteúdo sobre trânsito',
        website: 'https://example.com',
      });
      expect(component.form.valid).toBeTrue();
    });
  });

  describe('form submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.form.patchValue({
        pixKeyType: 'email',
        pixKey: 'test@email.com',
        promotionMethod: 'Redes sociais e YouTube com conteúdo sobre trânsito',
      });
    });

    it('should not submit when form is invalid', fakeAsync(() => {
      component.form.patchValue({ pixKey: '' });
      component.onSubmit();
      tick();
      expect(mockService['apply']).not.toHaveBeenCalled();
    }));

    it('should mark all fields as touched when invalid', fakeAsync(() => {
      component.form.patchValue({ pixKey: '' });
      component.onSubmit();
      tick();
      expect(component.form.controls.pixKey.touched).toBeTrue();
    }));

    it('should call service.apply with form data', fakeAsync(() => {
      (mockService['apply'] as jasmine.Spy).and.resolveTo(mockApplyResponse);
      component.onSubmit();
      tick();
      expect(mockService['apply']).toHaveBeenCalledWith({
        pixKeyType: 'email',
        pixKey: 'test@email.com',
        promotionMethod: 'Redes sociais e YouTube com conteúdo sobre trânsito',
      });
    }));

    it('should include website when provided', fakeAsync(() => {
      (mockService['apply'] as jasmine.Spy).and.resolveTo(mockApplyResponse);
      component.form.patchValue({ website: 'https://example.com' });
      component.onSubmit();
      tick();
      expect(mockService['apply']).toHaveBeenCalledWith(
        jasmine.objectContaining({ website: 'https://example.com' }),
      );
    }));

    it('should navigate to /affiliate on success', fakeAsync(() => {
      (mockService['apply'] as jasmine.Spy).and.resolveTo(mockApplyResponse);
      component.onSubmit();
      tick();
      expect(router.navigate).toHaveBeenCalledWith(['/affiliate']);
      expect(component.submitted()).toBeTrue();
    }));

    it('should not navigate on failure', fakeAsync(() => {
      (mockService['apply'] as jasmine.Spy).and.resolveTo(null);
      component.onSubmit();
      tick();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(component.submitted()).toBeFalse();
    }));
  });

  describe('PIX key types', () => {
    it('should render all PIX key type options', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const options = el.querySelectorAll('#pixKeyType option');
      // 4 types + 1 disabled placeholder
      expect(options.length).toBe(5);
    });
  });
});

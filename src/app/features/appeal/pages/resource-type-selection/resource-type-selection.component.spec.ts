import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ResourceTypeSelectionComponent } from './resource-type-selection.component';
import { AppealType } from '../../components/quiz-modal/quiz-modal.component';

describe('ResourceTypeSelectionComponent', () => {
  let component: ResourceTypeSelectionComponent;
  let fixture: ComponentFixture<ResourceTypeSelectionComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceTypeSelectionComponent],
      providers: [
        provideRouter([
          { path: 'appeals/new/form', component: ResourceTypeSelectionComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceTypeSelectionComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  // =========================================================================
  // Creation & Rendering
  // =========================================================================
  describe('Creation & Rendering', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should display the page title', () => {
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1?.textContent).toContain('Qual tipo de recurso você precisa?');
    });

    it('should render 3 type cards', () => {
      const cards = fixture.nativeElement.querySelectorAll('[role="radio"]');
      expect(cards.length).toBe(3);
    });

    it('should have a radiogroup container', () => {
      const radiogroup = fixture.nativeElement.querySelector('[role="radiogroup"]');
      expect(radiogroup).toBeTruthy();
      expect(radiogroup?.getAttribute('aria-label')).toBe('Tipo de recurso');
    });

    it('should render all 3 card titles', () => {
      const titles = fixture.nativeElement.querySelectorAll('h2');
      const texts = Array.from(titles as NodeListOf<HTMLElement>).map((t) =>
        t.textContent?.trim(),
      );
      expect(texts).toContain('Defesa Prévia');
      expect(texts).toContain('Recurso em 1ª Instância');
      expect(texts).toContain('Recurso em 2ª Instância');
    });

    it('should render emojis', () => {
      const emojis = fixture.nativeElement.querySelectorAll('[aria-hidden="true"]');
      const texts = Array.from(emojis as NodeListOf<HTMLElement>).map((e) =>
        e.textContent?.trim(),
      );
      expect(texts).toContain('📝');
      expect(texts).toContain('📄');
      expect(texts).toContain('📑');
    });

    it('should render deadline badges for all cards', () => {
      const badges = fixture.nativeElement.querySelectorAll('.bg-gray-100');
      expect(badges.length).toBe(3);
    });
  });

  // =========================================================================
  // "Mais comum" Badge
  // =========================================================================
  describe('Mais Comum Badge', () => {
    it('should display "Mais comum" badge on 1ª Instância card', () => {
      const badges = fixture.nativeElement.querySelectorAll('.bg-accent-500');
      expect(badges.length).toBe(1);
      expect(badges[0]?.textContent).toContain('Mais comum');
    });

    it('should not display "Mais comum" badge on other cards', () => {
      const allCards = fixture.nativeElement.querySelectorAll('[role="radio"]');
      const firstCard = allCards[0]; // Defesa Prévia
      const lastCard = allCards[2]; // 2ª Instância
      expect(firstCard?.querySelector('.bg-accent-500')).toBeNull();
      expect(lastCard?.querySelector('.bg-accent-500')).toBeNull();
    });
  });

  // =========================================================================
  // Card Selection
  // =========================================================================
  describe('Card Selection', () => {
    it('should have no selection initially', () => {
      expect(component.selectedType()).toBeNull();
      const checked = fixture.nativeElement.querySelectorAll(
        '[aria-checked="true"]',
      );
      expect(checked.length).toBe(0);
    });

    it('should select a card on click', () => {
      const cards = fixture.nativeElement.querySelectorAll('[role="radio"]');
      cards[0]?.click();
      fixture.detectChanges();

      expect(component.selectedType()).toBe('prior_defense');
      expect(cards[0]?.getAttribute('aria-checked')).toBe('true');
    });

    it('should deselect previous card when new one is selected', () => {
      const cards = fixture.nativeElement.querySelectorAll('[role="radio"]');
      cards[0]?.click();
      fixture.detectChanges();
      expect(cards[0]?.getAttribute('aria-checked')).toBe('true');

      cards[1]?.click();
      fixture.detectChanges();
      expect(component.selectedType()).toBe('first_instance');
      expect(cards[0]?.getAttribute('aria-checked')).toBe('false');
      expect(cards[1]?.getAttribute('aria-checked')).toBe('true');
    });

    it('should show visual selection indicator (check icon) on selected card', () => {
      const cards = fixture.nativeElement.querySelectorAll('[role="radio"]');
      cards[1]?.click();
      fixture.detectChanges();

      const checkIcon = cards[1]?.querySelector('.bg-brand-600');
      expect(checkIcon).toBeTruthy();
    });

    it('should apply brand border to selected card', () => {
      const cards = fixture.nativeElement.querySelectorAll('[role="radio"]');
      cards[2]?.click();
      fixture.detectChanges();

      expect(cards[2]?.classList.contains('border-brand-500')).toBeTrue();
      expect(cards[2]?.classList.contains('bg-brand-50')).toBeTrue();
    });
  });

  // =========================================================================
  // Continue Button
  // =========================================================================
  describe('Continue Button', () => {
    it('should render a continue button', () => {
      const btn = fixture.nativeElement.querySelector(
        'button[type="button"]:not([role="radio"]):not([aria-label])',
      );
      const continueBtn = Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.textContent?.includes('Continuar'));
      expect(continueBtn).toBeTruthy();
    });

    it('should be disabled when no type is selected', () => {
      const continueBtn = Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.textContent?.includes('Continuar'));
      expect(continueBtn?.disabled).toBeTrue();
    });

    it('should be enabled when a type is selected', () => {
      component.selectType('first_instance');
      fixture.detectChanges();

      const continueBtn = Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.textContent?.includes('Continuar'));
      expect(continueBtn?.disabled).toBeFalse();
    });

    it('should navigate to form with type on click', () => {
      component.selectType('prior_defense');
      fixture.detectChanges();

      const continueBtn = Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.textContent?.includes('Continuar'));
      continueBtn?.click();

      expect(router.navigate).toHaveBeenCalledWith(['/appeals/new/form'], {
        queryParams: { type: 'prior_defense' },
      });
    });

    it('should dispatch form_started analytics event on continue', () => {
      const events: CustomEvent[] = [];
      const listener = (e: Event) => events.push(e as CustomEvent);
      window.addEventListener('form_started', listener);

      component.selectType('second_instance');
      fixture.detectChanges();

      const continueBtn = Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.textContent?.includes('Continuar'));
      continueBtn?.click();

      expect(events.length).toBe(1);
      expect(events[0].detail.type).toBe('second_instance');
      expect(events[0].detail.usedQuiz).toBeFalse();

      window.removeEventListener('form_started', listener);
    });
  });

  // =========================================================================
  // Quiz Integration
  // =========================================================================
  describe('Quiz Integration', () => {
    it('should render "Não sei qual escolher" link', () => {
      const quizLink = Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.textContent?.includes('Não sei qual escolher'));
      expect(quizLink).toBeTruthy();
    });

    it('should not render quiz modal initially', () => {
      const modal = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(modal).toBeNull();
    });

    it('should open quiz modal when link is clicked', () => {
      const quizLink = Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.textContent?.includes('Não sei qual escolher'));
      quizLink?.click();
      fixture.detectChanges();

      expect(component.quizOpen()).toBeTrue();
      const modal = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(modal).toBeTruthy();
    });

    it('should close quiz modal on close event', () => {
      component.openQuiz();
      fixture.detectChanges();
      expect(component.quizOpen()).toBeTrue();

      component.closeQuiz();
      fixture.detectChanges();
      expect(component.quizOpen()).toBeFalse();
    });

    it('should select type and close modal on quiz result', () => {
      component.openQuiz();
      fixture.detectChanges();

      component.onQuizResult('prior_defense');
      fixture.detectChanges();

      expect(component.selectedType()).toBe('prior_defense');
      expect(component.quizOpen()).toBeFalse();
    });

    it('should track usedQuiz in analytics when quiz was used', () => {
      const events: CustomEvent[] = [];
      const listener = (e: Event) => events.push(e as CustomEvent);
      window.addEventListener('form_started', listener);

      component.onQuizResult('first_instance');
      fixture.detectChanges();

      const continueBtn = Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.textContent?.includes('Continuar'));
      continueBtn?.click();

      expect(events[0].detail.usedQuiz).toBeTrue();

      window.removeEventListener('form_started', listener);
    });
  });

  // =========================================================================
  // Responsive & Accessibility
  // =========================================================================
  describe('Accessibility', () => {
    it('should have aria-label on each card with title and description', () => {
      const cards = fixture.nativeElement.querySelectorAll('[role="radio"]');
      const firstLabel = cards[0]?.getAttribute('aria-label');
      expect(firstLabel).toContain('Defesa Prévia');
      expect(firstLabel).toContain('contestar ANTES');
    });

    it('should have aria-checked="false" on unselected cards', () => {
      const cards = fixture.nativeElement.querySelectorAll('[role="radio"]');
      Array.from(cards as NodeListOf<HTMLElement>).forEach((card) => {
        expect(card.getAttribute('aria-checked')).toBe('false');
      });
    });

    it('should use grid layout for responsive cards', () => {
      const grid = fixture.nativeElement.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
      expect(grid).toBeTruthy();
    });
  });
});

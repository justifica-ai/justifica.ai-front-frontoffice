import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { QuizModalComponent, AppealType } from './quiz-modal.component';

describe('QuizModalComponent', () => {
  let component: QuizModalComponent;
  let fixture: ComponentFixture<QuizModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizModalComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // =========================================================================
  // Creation & Rendering
  // =========================================================================
  describe('Creation & Rendering', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should render the modal title', () => {
      const title = fixture.nativeElement.querySelector('#quiz-title');
      expect(title?.textContent).toContain('Qual recurso é o certo para mim?');
    });

    it('should display the first question on init', () => {
      const questionEl = fixture.nativeElement.querySelector('p.text-base.font-semibold');
      expect(questionEl?.textContent).toContain(
        'Você já recebeu a notificação de penalidade',
      );
    });

    it('should render two answer buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.w-full.border-2',
      );
      expect(buttons.length).toBe(2);
    });

    it('should render progress indicators', () => {
      const bars = fixture.nativeElement.querySelectorAll('.h-1\\.5');
      expect(bars.length).toBe(3);
    });

    it('should display step counter', () => {
      const counter = fixture.nativeElement.querySelector('p.text-sm.text-gray-500.mb-1');
      expect(counter?.textContent).toContain('Pergunta 1 de 3');
    });

    it('should have a close button', () => {
      const closeBtn = fixture.nativeElement.querySelector(
        'button[aria-label="Fechar quiz"]',
      );
      expect(closeBtn).toBeTruthy();
    });
  });

  // =========================================================================
  // Quiz Decision Tree
  // =========================================================================
  describe('Quiz Decision Tree', () => {
    function answerYes(): void {
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.w-full.border-2',
      );
      buttons[0]?.click();
      fixture.detectChanges();
    }

    function answerNo(): void {
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.w-full.border-2',
      );
      buttons[1]?.click();
      fixture.detectChanges();
    }

    it('should recommend Defesa Prévia when user answers No on Q1', () => {
      answerNo(); // Q1: "Não" → Defesa Prévia
      expect(component.result()).toBe('prior_defense');
      const resultText = fixture.nativeElement.querySelector(
        'p.text-xl.font-bold',
      );
      expect(resultText?.textContent).toContain('Defesa Prévia');
    });

    it('should advance to Q2 when user answers Yes on Q1', () => {
      answerYes(); // Q1: "Sim" → go to Q2
      expect(component.currentStep()).toBe(1);
      expect(component.result()).toBeNull();
      const questionEl = fixture.nativeElement.querySelector('p.text-base.font-semibold');
      expect(questionEl?.textContent).toContain(
        'Defesa Prévia ou Recurso na JARI',
      );
    });

    it('should recommend 1ª Instância when Q1=Yes, Q2=No', () => {
      answerYes(); // Q1
      answerNo(); // Q2: "Não" → 1ª Instância
      expect(component.result()).toBe('first_instance');
      const resultText = fixture.nativeElement.querySelector(
        'p.text-xl.font-bold',
      );
      expect(resultText?.textContent).toContain('Recurso em 1ª Instância');
    });

    it('should advance to Q3 when Q1=Yes, Q2=Yes', () => {
      answerYes(); // Q1
      answerYes(); // Q2: "Sim" → go to Q3
      expect(component.currentStep()).toBe(2);
      expect(component.result()).toBeNull();
    });

    it('should recommend 2ª Instância when Q1=Yes, Q2=Yes, Q3=Yes', () => {
      answerYes(); // Q1
      answerYes(); // Q2
      answerYes(); // Q3: "Sim" → 2ª Instância
      expect(component.result()).toBe('second_instance');
      const resultText = fixture.nativeElement.querySelector(
        'p.text-xl.font-bold',
      );
      expect(resultText?.textContent).toContain('Recurso em 2ª Instância');
    });

    it('should show help screen when Q1=Yes, Q2=Yes, Q3=No (dont know)', () => {
      answerYes(); // Q1
      answerYes(); // Q2
      answerNo(); // Q3: "Não sei"
      expect(component.showDontKnowHelp()).toBeTrue();
      const helpText = fixture.nativeElement.querySelector(
        'p.text-base.font-semibold',
      );
      expect(helpText?.textContent).toContain('Sem problema');
    });

    it('should update progress bar as quiz advances', () => {
      const getBrandBars = (): number =>
        fixture.nativeElement.querySelectorAll('.bg-brand-500').length;

      expect(getBrandBars()).toBe(1); // Step 0

      answerYes();
      expect(getBrandBars()).toBe(2); // Step 1

      answerYes();
      expect(getBrandBars()).toBe(3); // Step 2
    });
  });

  // =========================================================================
  // Result Screen
  // =========================================================================
  describe('Result Screen', () => {
    beforeEach(() => {
      // Navigate to a result: Q1=No → Defesa Prévia
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.w-full.border-2',
      );
      buttons[1]?.click(); // "No"
      fixture.detectChanges();
    });

    it('should display the result label', () => {
      const label = fixture.nativeElement.querySelector('p.text-xl.font-bold');
      expect(label?.textContent).toContain('Defesa Prévia');
    });

    it('should display a description', () => {
      const desc = fixture.nativeElement.querySelectorAll('p.text-sm.text-gray-500');
      const found = Array.from(desc as NodeListOf<HTMLElement>).some((el) =>
        el.textContent?.includes('Conteste'),
      );
      expect(found).toBeTrue();
    });

    it('should have "Selecionar este tipo" button', () => {
      const btn = fixture.nativeElement.querySelector(
        'button.bg-brand-600',
      ) as HTMLButtonElement;
      expect(btn?.textContent).toContain('Selecionar este tipo');
    });

    it('should have "Refazer" button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const refazer = Array.from(buttons as NodeListOf<HTMLButtonElement>).find(
        (b) => b.textContent?.includes('Refazer'),
      );
      expect(refazer).toBeTruthy();
    });

    it('should emit selectType when "Selecionar este tipo" is clicked', () => {
      spyOn(component.selectType, 'emit');
      const btn = fixture.nativeElement.querySelector(
        'button.bg-brand-600',
      ) as HTMLButtonElement;
      btn.click();
      expect(component.selectType.emit).toHaveBeenCalledWith('prior_defense');
    });

    it('should restart quiz when "Refazer" is clicked', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const refazer = Array.from(buttons as NodeListOf<HTMLButtonElement>).find(
        (b) => b.textContent?.includes('Refazer'),
      );
      refazer?.click();
      fixture.detectChanges();

      expect(component.currentStep()).toBe(0);
      expect(component.result()).toBeNull();
      // Should show question again
      const questionEl = fixture.nativeElement.querySelector('p.text-base.font-semibold');
      expect(questionEl?.textContent).toContain('notificação de penalidade');
    });
  });

  // =========================================================================
  // "Não sei" Help Screen
  // =========================================================================
  describe('Dont Know Help Screen', () => {
    beforeEach(() => {
      // Navigate to "Não sei": Q1=Yes, Q2=Yes, Q3=No
      component.answer(true);  // Q1
      component.answer(true);  // Q2
      component.answer(false); // Q3
      fixture.detectChanges();
    });

    it('should show help message', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Sem problema');
      expect(text).toContain('Recurso em 1ª Instância');
    });

    it('should emit first_instance when "Usar 1ª Instância" is clicked', () => {
      spyOn(component.selectType, 'emit');
      const btn = fixture.nativeElement.querySelector(
        'button.bg-brand-600',
      ) as HTMLButtonElement;
      btn.click();
      expect(component.selectType.emit).toHaveBeenCalledWith('first_instance');
    });

    it('should restart when "Refazer quiz" is clicked', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const refazer = Array.from(buttons as NodeListOf<HTMLButtonElement>).find(
        (b) => b.textContent?.includes('Refazer quiz'),
      );
      refazer?.click();
      fixture.detectChanges();

      expect(component.currentStep()).toBe(0);
      expect(component.result()).toBeNull();
      expect(component.showDontKnowHelp()).toBeFalse();
    });
  });

  // =========================================================================
  // Events
  // =========================================================================
  describe('Events', () => {
    it('should emit close when backdrop is clicked', () => {
      spyOn(component.close, 'emit');
      const backdrop = fixture.nativeElement.querySelector('[role="presentation"]');
      backdrop?.click();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should emit close when close button is clicked', () => {
      spyOn(component.close, 'emit');
      const closeBtn = fixture.nativeElement.querySelector(
        'button[aria-label="Fechar quiz"]',
      );
      closeBtn?.click();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Accessibility
  // =========================================================================
  describe('Accessibility', () => {
    it('should have role="dialog" and aria-modal', () => {
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
      expect(dialog?.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-labelledby pointing to title', () => {
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('aria-labelledby')).toBe('quiz-title');
    });

    it('should have aria-label on close button', () => {
      const closeBtn = fixture.nativeElement.querySelector(
        'button[aria-label="Fechar quiz"]',
      );
      expect(closeBtn).toBeTruthy();
    });
  });
});

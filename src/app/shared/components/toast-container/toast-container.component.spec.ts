import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../../../core/services/toast.service';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render no toasts initially', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('[role="alert"]').length).toBe(0);
  });

  it('should render a toast when added', () => {
    toastService.success('Sucesso');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('[role="alert"]').length).toBe(1);
    expect(compiled.textContent).toContain('Sucesso');
  });

  it('should render multiple toasts', () => {
    toastService.success('First');
    toastService.error('Second');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('[role="alert"]').length).toBe(2);
  });

  it('should render toast message when provided', () => {
    toastService.success('Title', 'Detailed message');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Detailed message');
  });

  it('should return correct CSS classes for success type', () => {
    expect(component.getToastClasses('success')).toContain('bg-accent-50');
  });

  it('should return correct CSS classes for error type', () => {
    expect(component.getToastClasses('error')).toContain('bg-red-50');
  });

  it('should return correct CSS classes for warning type', () => {
    expect(component.getToastClasses('warning')).toContain('bg-amber-50');
  });

  it('should return correct CSS classes for info type', () => {
    expect(component.getToastClasses('info')).toContain('bg-brand-50');
  });

  it('should return default CSS classes for unknown type', () => {
    expect(component.getToastClasses('unknown')).toContain('bg-white');
  });

  it('should have aria-live region for accessibility', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const region = compiled.querySelector('[aria-live="polite"]');
    expect(region).toBeTruthy();
  });
});

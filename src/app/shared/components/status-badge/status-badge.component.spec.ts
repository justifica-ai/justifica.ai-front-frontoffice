import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('status', 'draft');
    fixture.componentRef.setInput('label', 'Rascunho');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the label', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Rascunho');
  });

  it('should return draft badge classes', () => {
    expect(component.badgeClasses()).toContain('bg-gray-100');
  });

  it('should return draft dot class', () => {
    expect(component.dotClass()).toContain('bg-gray-400');
  });

  it('should return pending_payment badge classes', () => {
    fixture.componentRef.setInput('status', 'pending_payment');
    fixture.detectChanges();
    expect(component.badgeClasses()).toContain('bg-amber-100');
    expect(component.dotClass()).toContain('bg-amber-400');
  });

  it('should return generating badge classes', () => {
    fixture.componentRef.setInput('status', 'generating');
    fixture.detectChanges();
    expect(component.badgeClasses()).toContain('bg-brand-100');
    expect(component.dotClass()).toContain('bg-brand-400');
  });

  it('should return generated badge classes', () => {
    fixture.componentRef.setInput('status', 'generated');
    fixture.detectChanges();
    expect(component.badgeClasses()).toContain('bg-accent-100');
    expect(component.dotClass()).toContain('bg-accent-400');
  });

  it('should return paid badge classes', () => {
    fixture.componentRef.setInput('status', 'paid');
    fixture.detectChanges();
    expect(component.badgeClasses()).toContain('bg-accent-100');
  });

  it('should return failed badge classes', () => {
    fixture.componentRef.setInput('status', 'failed');
    fixture.detectChanges();
    expect(component.badgeClasses()).toContain('bg-red-100');
    expect(component.dotClass()).toContain('bg-red-400');
  });

  it('should return expired badge classes', () => {
    fixture.componentRef.setInput('status', 'expired');
    fixture.detectChanges();
    expect(component.badgeClasses()).toContain('bg-gray-100');
  });

  it('should return refunded badge classes', () => {
    fixture.componentRef.setInput('status', 'refunded');
    fixture.detectChanges();
    expect(component.badgeClasses()).toContain('bg-purple-100');
    expect(component.dotClass()).toContain('bg-purple-400');
  });

  it('should return default classes for unknown status', () => {
    fixture.componentRef.setInput('status', 'unknown_status');
    fixture.detectChanges();
    expect(component.badgeClasses()).toContain('bg-gray-100');
    expect(component.dotClass()).toContain('bg-gray-400');
  });
});

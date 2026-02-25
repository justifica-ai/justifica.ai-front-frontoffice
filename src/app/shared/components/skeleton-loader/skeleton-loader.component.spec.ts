import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

describe('SkeletonLoaderComponent', () => {
  let component: SkeletonLoaderComponent;
  let fixture: ComponentFixture<SkeletonLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonLoaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default width of 100%', () => {
    expect(component.width()).toBe('100%');
  });

  it('should have default height of 1rem', () => {
    expect(component.height()).toBe('1rem');
  });

  it('should have empty className by default', () => {
    expect(component.className()).toBe('');
  });

  it('should render with role="status"', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="status"]')).toBeTruthy();
  });

  it('should render with aria-label for accessibility', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[aria-label="Carregando..."]')).toBeTruthy();
  });

  it('should apply custom width via input', () => {
    fixture.componentRef.setInput('width', '200px');
    fixture.detectChanges();
    expect(component.width()).toBe('200px');
  });

  it('should apply custom height via input', () => {
    fixture.componentRef.setInput('height', '3rem');
    fixture.detectChanges();
    expect(component.height()).toBe('3rem');
  });
});

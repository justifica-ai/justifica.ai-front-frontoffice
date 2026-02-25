import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty toasts', () => {
    expect(service.toasts().length).toBe(0);
  });

  it('should add a toast on success()', () => {
    service.success('Operação realizada');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].title).toBe('Operação realizada');
  });

  it('should add a toast on error()', () => {
    service.error('Erro encontrado');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('error');
    expect(service.toasts()[0].title).toBe('Erro encontrado');
  });

  it('should add a toast on warning()', () => {
    service.warning('Atenção');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('warning');
    expect(service.toasts()[0].title).toBe('Atenção');
  });

  it('should add a toast on info()', () => {
    service.info('Informação');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('info');
    expect(service.toasts()[0].title).toBe('Informação');
  });

  it('should add toast with title and message', () => {
    service.success('Título', 'Mensagem detalhada');
    expect(service.toasts()[0].title).toBe('Título');
    expect(service.toasts()[0].message).toBe('Mensagem detalhada');
  });

  it('should dismiss a toast by id', () => {
    service.success('Test');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });

  it('should handle multiple toasts', () => {
    service.success('One');
    service.error('Two');
    service.info('Three');
    expect(service.toasts().length).toBe(3);
  });

  it('should only dismiss the specified toast', () => {
    service.success('First');
    service.error('Second');
    const firstId = service.toasts()[0].id;
    service.dismiss(firstId);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].title).toBe('Second');
  });

  it('should generate unique ids for each toast', () => {
    service.success('A');
    service.success('B');
    const ids = service.toasts().map((t) => t.id);
    expect(ids[0]).not.toBe(ids[1]);
  });
});

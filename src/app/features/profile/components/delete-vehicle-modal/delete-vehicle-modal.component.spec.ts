import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DeleteVehicleModalComponent } from './delete-vehicle-modal.component';
import { VehicleService } from '../../services/vehicle.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import type { Vehicle } from '../../../../core/models/vehicle.model';

const MOCK_VEHICLE: Vehicle = {
  id: 'v-001',
  plate: 'ABC1D23',
  plateFormat: 'mercosul',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2023,
  color: 'Prata',
  hasRenavam: true,
  nickname: 'Meu Carro',
  isDefault: false,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

// Host to control required input
@Component({
  standalone: true,
  imports: [DeleteVehicleModalComponent],
  template: `
    <app-delete-vehicle-modal
      [vehicle]="vehicleInput()"
      (close)="closeCalled = true"
      (deleted)="deletedCalled = true"
    />
  `,
})
class TestHostComponent {
  vehicleInput = signal<Vehicle>(MOCK_VEHICLE);
  closeCalled = false;
  deletedCalled = false;
}

describe('DeleteVehicleModalComponent', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let httpMock: HttpTestingController;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        VehicleService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    hostFixture = TestBed.createComponent(TestHostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  // =========================================================================
  // Rendering
  // =========================================================================
  describe('Rendering', () => {
    it('should create the component', () => {
      expect(hostFixture.debugElement.children[0]).toBeTruthy();
    });

    it('should display "Remover veículo?" title', () => {
      const text = hostFixture.nativeElement.textContent;
      expect(text).toContain('Remover veículo?');
    });

    it('should display the vehicle plate', () => {
      const text = hostFixture.nativeElement.textContent;
      expect(text).toContain('ABC1D23');
    });

    it('should display the vehicle nickname when present', () => {
      const text = hostFixture.nativeElement.textContent;
      expect(text).toContain('Meu Carro');
    });

    it('should not display nickname section when empty', () => {
      host.vehicleInput.set({ ...MOCK_VEHICLE, nickname: null as unknown as string });
      hostFixture.detectChanges();

      // Should still have the plate but not the nickname wrapper
      const text = hostFixture.nativeElement.textContent;
      expect(text).toContain('ABC1D23');
    });

    it('should display "Esta ação não pode ser desfeita." warning', () => {
      const text = hostFixture.nativeElement.textContent;
      expect(text).toContain('Esta ação não pode ser desfeita.');
    });

    it('should have Cancel and Confirm buttons', () => {
      const buttons = hostFixture.nativeElement.querySelectorAll('button');
      const texts = Array.from(buttons).map((b: unknown) => (b as HTMLElement).textContent?.trim());
      expect(texts).toContain('Cancelar');
      expect(texts).toContain('Sim, remover');
    });
  });

  // =========================================================================
  // Close
  // =========================================================================
  describe('Close', () => {
    it('should emit close when Cancel button is clicked', () => {
      const cancelBtn = Array.from(hostFixture.nativeElement.querySelectorAll('button'))
        .find((b: unknown) => (b as HTMLElement).textContent?.trim() === 'Cancelar') as HTMLElement;
      cancelBtn.click();
      expect(host.closeCalled).toBeTrue();
    });

    it('should emit close when backdrop is clicked', () => {
      const backdrop = hostFixture.nativeElement.querySelector('[role="presentation"]') as HTMLElement;
      backdrop.click();
      expect(host.closeCalled).toBeTrue();
    });
  });

  // =========================================================================
  // Delete
  // =========================================================================
  describe('Delete', () => {
    it('should call deleteVehicle and emit deleted on success', fakeAsync(() => {
      const confirmBtn = Array.from(hostFixture.nativeElement.querySelectorAll('button'))
        .find((b: unknown) => (b as HTMLElement).textContent?.trim() === 'Sim, remover') as HTMLElement;
      confirmBtn.click();
      hostFixture.detectChanges();

      // Expect DELETE
      const deleteReq = httpMock.expectOne(`${environment.apiUrl}/vehicles/v-001`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush({ message: 'ok' });
      tick(); // drain microtask for firstValueFrom promise

      // loadVehicles reload
      const listReq = httpMock.expectOne(`${environment.apiUrl}/vehicles`);
      listReq.flush({ vehicles: [], total: 0 });
      tick(); // drain microtask for loadVehicles promise

      hostFixture.detectChanges();

      expect(host.deletedCalled).toBeTrue();
    }));

    it('should not emit deleted on failure', fakeAsync(() => {
      const confirmBtn = Array.from(hostFixture.nativeElement.querySelectorAll('button'))
        .find((b: unknown) => (b as HTMLElement).textContent?.trim() === 'Sim, remover') as HTMLElement;
      confirmBtn.click();
      hostFixture.detectChanges();

      httpMock.expectOne(`${environment.apiUrl}/vehicles/v-001`).error(new ProgressEvent('error'));
      tick(); // drain microtask for error handling

      hostFixture.detectChanges();

      expect(host.deletedCalled).toBeFalse();
    }));
  });

  // =========================================================================
  // Accessibility
  // =========================================================================
  describe('Accessibility', () => {
    it('should have role="dialog" and aria-modal', () => {
      const dialog = hostFixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-labelledby pointing to title', () => {
      const dialog = hostFixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog.getAttribute('aria-labelledby')).toBe('delete-vehicle-title');

      const title = hostFixture.nativeElement.querySelector('#delete-vehicle-title');
      expect(title).toBeTruthy();
    });
  });
});

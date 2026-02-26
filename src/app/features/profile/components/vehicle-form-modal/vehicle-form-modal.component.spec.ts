import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VehicleFormModalComponent } from './vehicle-form-modal.component';
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
  isDefault: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

// Host component to control inputs
@Component({
  standalone: true,
  imports: [VehicleFormModalComponent],
  template: `
    <app-vehicle-form-modal
      [vehicle]="vehicleInput()"
      (close)="closeCalled = true"
      (saved)="savedVehicle = $event"
    />
  `,
})
class TestHostComponent {
  vehicleInput = signal<Vehicle | null>(null);
  closeCalled = false;
  savedVehicle: Vehicle | null = null;
}

describe('VehicleFormModalComponent', () => {
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
      const modal = hostFixture.debugElement.children[0];
      expect(modal).toBeTruthy();
    });

    it('should show "Adicionar veículo" title in create mode', () => {
      const text = hostFixture.nativeElement.textContent;
      expect(text).toContain('Adicionar veículo');
    });

    it('should show "Editar veículo" title in edit mode', () => {
      host.vehicleInput.set(MOCK_VEHICLE);
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.componentInstance.vehicleInput.set(MOCK_VEHICLE);
      hostFixture.detectChanges();
      const text = hostFixture.nativeElement.textContent;
      expect(text).toContain('Editar veículo');
    });

    it('should have required plate field', () => {
      const plateInput = hostFixture.nativeElement.querySelector('#vehicle-plate') as HTMLInputElement;
      expect(plateInput).toBeTruthy();
    });

    it('should prefill form in edit mode', () => {
      host.vehicleInput.set(MOCK_VEHICLE);
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.componentInstance.vehicleInput.set(MOCK_VEHICLE);
      hostFixture.detectChanges();

      const plateInput = hostFixture.nativeElement.querySelector('#vehicle-plate') as HTMLInputElement;
      expect(plateInput.value).toBe('ABC1D23');
    });

    it('should have Cancel and Submit buttons', () => {
      const buttons = hostFixture.nativeElement.querySelectorAll('button');
      const buttonTexts = Array.from(buttons).map((b: unknown) => (b as HTMLElement).textContent?.trim());
      expect(buttonTexts).toContain('Cancelar');
    });
  });

  // =========================================================================
  // Plate Validation
  // =========================================================================
  describe('Plate Validation', () => {
    it('should show error for empty plate on submit', () => {
      const form = hostFixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      hostFixture.detectChanges();

      const errorEl = hostFixture.nativeElement.querySelector('#plate-error');
      expect(errorEl).toBeTruthy();
      expect(errorEl.textContent).toContain('obrigatório');
    });

    it('should accept valid Mercosul plate', () => {
      const plateInput = hostFixture.nativeElement.querySelector('#vehicle-plate') as HTMLInputElement;
      plateInput.value = 'ABC1D23';
      plateInput.dispatchEvent(new Event('input'));
      hostFixture.detectChanges();

      // Mark as touched
      plateInput.dispatchEvent(new Event('blur'));
      hostFixture.detectChanges();

      const errorEl = hostFixture.nativeElement.querySelector('#plate-error');
      expect(errorEl).toBeFalsy();
    });

    it('should accept valid old format plate', () => {
      const plateInput = hostFixture.nativeElement.querySelector('#vehicle-plate') as HTMLInputElement;
      plateInput.value = 'ABC1234';
      plateInput.dispatchEvent(new Event('input'));
      hostFixture.detectChanges();

      plateInput.dispatchEvent(new Event('blur'));
      hostFixture.detectChanges();

      const errorEl = hostFixture.nativeElement.querySelector('#plate-error');
      expect(errorEl).toBeFalsy();
    });

    it('should show error for invalid plate', () => {
      const plateInput = hostFixture.nativeElement.querySelector('#vehicle-plate') as HTMLInputElement;
      plateInput.value = '123';
      plateInput.dispatchEvent(new Event('input'));
      plateInput.dispatchEvent(new Event('blur'));
      hostFixture.detectChanges();

      // Submit to trigger submitted
      const form = hostFixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      hostFixture.detectChanges();

      const errorEl = hostFixture.nativeElement.querySelector('#plate-error');
      expect(errorEl).toBeTruthy();
    });
  });

  // =========================================================================
  // RENAVAM Validation
  // =========================================================================
  describe('RENAVAM Validation', () => {
    it('should accept valid RENAVAM', () => {
      const renavamInput = hostFixture.nativeElement.querySelector('#vehicle-renavam') as HTMLInputElement;
      renavamInput.value = '10000000008';
      renavamInput.dispatchEvent(new Event('input'));
      renavamInput.dispatchEvent(new Event('blur'));
      hostFixture.detectChanges();

      const errorEl = hostFixture.nativeElement.querySelector('#renavam-error');
      expect(errorEl).toBeFalsy();
    });

    it('should show error for invalid RENAVAM check digit', () => {
      const renavamInput = hostFixture.nativeElement.querySelector('#vehicle-renavam') as HTMLInputElement;
      renavamInput.value = '10000000009';
      renavamInput.dispatchEvent(new Event('input'));
      renavamInput.dispatchEvent(new Event('blur'));
      hostFixture.detectChanges();

      // Submit to trigger submitted flag
      const form = hostFixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      hostFixture.detectChanges();

      const errorEl = hostFixture.nativeElement.querySelector('#renavam-error');
      expect(errorEl).toBeTruthy();
    });

    it('should show error for RENAVAM with wrong length', () => {
      const renavamInput = hostFixture.nativeElement.querySelector('#vehicle-renavam') as HTMLInputElement;
      renavamInput.value = '12345';
      renavamInput.dispatchEvent(new Event('input'));
      renavamInput.dispatchEvent(new Event('blur'));
      hostFixture.detectChanges();

      const form = hostFixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      hostFixture.detectChanges();

      const errorEl = hostFixture.nativeElement.querySelector('#renavam-error');
      expect(errorEl).toBeTruthy();
      expect(errorEl.textContent).toContain('11 dígitos');
    });
  });

  // =========================================================================
  // Year Validation
  // =========================================================================
  describe('Year Validation', () => {
    it('should accept valid 4-digit year', () => {
      const yearInput = hostFixture.nativeElement.querySelector('#vehicle-year') as HTMLInputElement;
      yearInput.value = '2023';
      yearInput.dispatchEvent(new Event('input'));
      yearInput.dispatchEvent(new Event('blur'));
      hostFixture.detectChanges();

      const errorEl = hostFixture.nativeElement.querySelector('#year-error');
      expect(errorEl).toBeFalsy();
    });

    it('should show error for invalid year format', () => {
      const yearInput = hostFixture.nativeElement.querySelector('#vehicle-year') as HTMLInputElement;
      yearInput.value = '20';
      yearInput.dispatchEvent(new Event('input'));
      yearInput.dispatchEvent(new Event('blur'));
      hostFixture.detectChanges();

      const form = hostFixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      hostFixture.detectChanges();

      const errorEl = hostFixture.nativeElement.querySelector('#year-error');
      expect(errorEl).toBeTruthy();
      expect(errorEl.textContent).toContain('4 dígitos');
    });
  });

  // =========================================================================
  // Close
  // =========================================================================
  describe('Close', () => {
    it('should emit close when Cancel button is clicked', () => {
      const cancelBtn = Array.from(hostFixture.nativeElement.querySelectorAll('button'))
        .find((b: unknown) => (b as HTMLElement).textContent?.trim() === 'Cancelar') as HTMLElement;
      expect(cancelBtn).toBeTruthy();
      cancelBtn.click();
      expect(host.closeCalled).toBeTrue();
    });

    it('should emit close when X button is clicked', () => {
      const closeBtn = hostFixture.nativeElement.querySelector('[aria-label="Fechar formulário"]') as HTMLElement;
      expect(closeBtn).toBeTruthy();
      closeBtn.click();
      expect(host.closeCalled).toBeTrue();
    });

    it('should emit close when backdrop is clicked', () => {
      const backdrop = hostFixture.nativeElement.querySelector('[role="presentation"]') as HTMLElement;
      expect(backdrop).toBeTruthy();
      backdrop.click();
      expect(host.closeCalled).toBeTrue();
    });
  });

  // =========================================================================
  // Submit — Create Mode
  // =========================================================================
  describe('Submit Create', () => {
    it('should call createVehicle and emit saved on create', fakeAsync(() => {
      // Fill plate
      const plateInput = hostFixture.nativeElement.querySelector('#vehicle-plate') as HTMLInputElement;
      plateInput.value = 'DEF5G67';
      plateInput.dispatchEvent(new Event('input'));
      hostFixture.detectChanges();

      // Submit
      const form = hostFixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      hostFixture.detectChanges();

      // Expect create POST
      const createReq = httpMock.expectOne(`${environment.apiUrl}/vehicles`);
      expect(createReq.request.method).toBe('POST');
      createReq.flush(MOCK_VEHICLE);
      tick(); // drain microtask for firstValueFrom promise

      // loadVehicles reload
      const listReq = httpMock.expectOne(`${environment.apiUrl}/vehicles`);
      listReq.flush({ vehicles: [MOCK_VEHICLE], total: 1 });
      tick(); // drain microtask for loadVehicles promise

      hostFixture.detectChanges();

      expect(host.savedVehicle).toBeTruthy();
    }));

    it('should not submit when form is invalid', () => {
      const form = hostFixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      hostFixture.detectChanges();

      // No HTTP request should be made
      httpMock.expectNone(`${environment.apiUrl}/vehicles`);
    });
  });

  // =========================================================================
  // Submit — Edit Mode
  // =========================================================================
  describe('Submit Edit', () => {
    it('should call updateVehicle in edit mode', fakeAsync(() => {
      // Create fresh host with edit vehicle
      hostFixture = TestBed.createComponent(TestHostComponent);
      host = hostFixture.componentInstance;
      host.vehicleInput.set(MOCK_VEHICLE);
      hostFixture.detectChanges();

      // Change brand
      const brandInput = hostFixture.nativeElement.querySelector('#vehicle-brand') as HTMLInputElement;
      brandInput.value = 'Honda';
      brandInput.dispatchEvent(new Event('input'));
      hostFixture.detectChanges();

      // Submit form
      const form = hostFixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      hostFixture.detectChanges();

      // Expect PATCH
      const patchReq = httpMock.expectOne(`${environment.apiUrl}/vehicles/v-001`);
      expect(patchReq.request.method).toBe('PATCH');
      patchReq.flush({ ...MOCK_VEHICLE, brand: 'Honda' });
      tick(); // drain microtask for firstValueFrom promise

      // loadVehicles reload
      const listReq = httpMock.expectOne(`${environment.apiUrl}/vehicles`);
      listReq.flush({ vehicles: [{ ...MOCK_VEHICLE, brand: 'Honda' }], total: 1 });
      tick(); // drain microtask for loadVehicles promise

      hostFixture.detectChanges();

      expect(host.savedVehicle).toBeTruthy();
    }));
  });

  // =========================================================================
  // Error Messages
  // =========================================================================
  describe('Error Messages', () => {
    it('should display "Campo obrigatório" for required fields', () => {
      const form = hostFixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      hostFixture.detectChanges();

      const plateError = hostFixture.nativeElement.querySelector('#plate-error');
      expect(plateError?.textContent).toContain('obrigatório');
    });

    it('should display plate format hint for invalid plate', () => {
      const plateInput = hostFixture.nativeElement.querySelector('#vehicle-plate') as HTMLInputElement;
      plateInput.value = 'INVALID';
      plateInput.dispatchEvent(new Event('input'));
      hostFixture.detectChanges();

      const form = hostFixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      hostFixture.detectChanges();

      const plateError = hostFixture.nativeElement.querySelector('#plate-error');
      expect(plateError?.textContent).toContain('ABC1D23');
    });
  });

  // =========================================================================
  // Format Plate
  // =========================================================================
  describe('formatPlate', () => {
    it('should uppercase plate input', () => {
      const plateInput = hostFixture.nativeElement.querySelector('#vehicle-plate') as HTMLInputElement;
      plateInput.value = 'abc1d23';
      plateInput.dispatchEvent(new Event('input'));
      hostFixture.detectChanges();

      // The formatPlate method should uppercase
      expect(plateInput.value).toBe('ABC1D23');
    });
  });
});

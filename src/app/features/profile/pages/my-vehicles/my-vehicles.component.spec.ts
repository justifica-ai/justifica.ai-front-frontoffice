import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MyVehiclesComponent } from './my-vehicles.component';
import { VehicleService } from '../../services/vehicle.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import type { Vehicle, VehicleListResponse } from '../../../../core/models/vehicle.model';

const VEHICLES_URL = `${environment.apiUrl}/vehicles`;

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

const MOCK_VEHICLE_2: Vehicle = {
  id: 'v-002',
  plate: 'DEF5G67',
  plateFormat: 'mercosul',
  brand: 'Honda',
  model: 'Civic',
  year: 2024,
  color: 'Preto',
  hasRenavam: false,
  nickname: null as unknown as string,
  isDefault: false,
  createdAt: '2025-01-02T00:00:00.000Z',
  updatedAt: '2025-01-02T00:00:00.000Z',
};

describe('MyVehiclesComponent', () => {
  let fixture: ComponentFixture<MyVehiclesComponent>;
  let component: MyVehiclesComponent;
  let httpMock: HttpTestingController;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [MyVehiclesComponent],
      providers: [
        VehicleService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MyVehiclesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * Triggers ngOnInit (which calls loadVehicles) and flushes the initial GET request.
   * Uses tick() to drain microtasks so signal state is updated.
   */
  function initAndLoad(response?: VehicleListResponse): void {
    fixture.detectChanges(); // triggers ngOnInit → loadVehicles → GET
    httpMock.expectOne(VEHICLES_URL).flush(response ?? { vehicles: [], total: 0 });
    tick(); // drain microtask queue (firstValueFrom promise)
    fixture.detectChanges(); // update template with new signal values
  }

  // =========================================================================
  // Initialization
  // =========================================================================
  describe('Initialization', () => {
    it('should create the component', fakeAsync(() => {
      expect(component).toBeTruthy();
      initAndLoad();
    }));

    it('should load vehicles on init', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE], total: 1 });

      const service = TestBed.inject(VehicleService);
      expect(service.total()).toBe(1);
    }));
  });

  // =========================================================================
  // Loading State
  // =========================================================================
  describe('Loading State', () => {
    it('should show skeleton loaders while loading', fakeAsync(() => {
      fixture.detectChanges(); // triggers GET but not flushed yet
      // Before flushing, loading = true
      const skeletons = fixture.nativeElement.querySelectorAll('app-skeleton-loader');
      expect(skeletons.length).toBeGreaterThan(0);

      httpMock.expectOne(VEHICLES_URL).flush({ vehicles: [], total: 0 });
      tick();
      fixture.detectChanges();
    }));
  });

  // =========================================================================
  // Empty State
  // =========================================================================
  describe('Empty State', () => {
    it('should show empty state when no vehicles', fakeAsync(() => {
      initAndLoad({ vehicles: [], total: 0 });

      const emptyState = fixture.nativeElement.querySelector('app-empty-state');
      expect(emptyState).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain('Nenhum veículo cadastrado');
    }));

    it('should show "Adicionar veículo" button in empty state', fakeAsync(() => {
      initAndLoad({ vehicles: [], total: 0 });

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const texts = Array.from(buttons).map((b: unknown) => (b as HTMLElement).textContent?.trim());
      expect(texts.some((t: unknown) => (t as string).includes('Adicionar veículo'))).toBeTrue();
    }));
  });

  // =========================================================================
  // Error State
  // =========================================================================
  describe('Error State', () => {
    it('should show error message on load failure', fakeAsync(() => {
      fixture.detectChanges();
      httpMock.expectOne(VEHICLES_URL).error(new ProgressEvent('error'));
      tick();
      fixture.detectChanges();

      const errorAlert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(errorAlert).toBeTruthy();
    }));

    it('should have "Tentar novamente" retry button', fakeAsync(() => {
      fixture.detectChanges();
      httpMock.expectOne(VEHICLES_URL).error(new ProgressEvent('error'));
      tick();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Tentar novamente');
    }));
  });

  // =========================================================================
  // Vehicle List
  // =========================================================================
  describe('Vehicle List', () => {
    it('should display vehicle plates', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE, MOCK_VEHICLE_2], total: 2 });

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('ABC1D23');
      expect(text).toContain('DEF5G67');
    }));

    it('should display vehicle count', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE], total: 1 });

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('1 de 10 veículos cadastrados');
    }));

    it('should display "Padrão" badge for default vehicle', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE], total: 1 });

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Padrão');
    }));

    it('should show "Definir padrão" for non-default vehicles', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE_2], total: 1 });

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Definir padrão');
    }));
  });

  // =========================================================================
  // Header
  // =========================================================================
  describe('Header', () => {
    it('should display "Meus Veículos" title', fakeAsync(() => {
      initAndLoad();

      expect(fixture.nativeElement.textContent).toContain('Meus Veículos');
    }));

    it('should disable add button when limit reached', fakeAsync(() => {
      const vehicles = Array.from({ length: 10 }, (_, i) => ({
        ...MOCK_VEHICLE,
        id: `v-${i}`,
        plate: `AAA${i}A00`,
      }));

      initAndLoad({ vehicles, total: 10 });

      const addBtns = fixture.nativeElement.querySelectorAll('button[disabled]');
      expect(addBtns.length).toBeGreaterThan(0);
    }));
  });

  // =========================================================================
  // Modals
  // =========================================================================
  describe('Modals', () => {
    it('should open form modal on add click', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE], total: 1 });

      component.openCreateModal();
      fixture.detectChanges();

      const formModal = fixture.nativeElement.querySelector('app-vehicle-form-modal');
      expect(formModal).toBeTruthy();
    }));

    it('should open form modal with vehicle on edit click', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE], total: 1 });

      component.openEditModal(MOCK_VEHICLE);
      fixture.detectChanges();

      expect(component.editingVehicle()).toBe(MOCK_VEHICLE);
      expect(component.showFormModal()).toBeTrue();
    }));

    it('should close form modal', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE], total: 1 });

      component.openCreateModal();
      expect(component.showFormModal()).toBeTrue();

      component.closeFormModal();
      expect(component.showFormModal()).toBeFalse();
      expect(component.editingVehicle()).toBeNull();
    }));

    it('should open delete modal', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE], total: 1 });

      component.openDeleteModal(MOCK_VEHICLE);
      fixture.detectChanges();

      expect(component.showDeleteModal()).toBeTrue();
      expect(component.deletingVehicle()).toBe(MOCK_VEHICLE);
    }));

    it('should close delete modal', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE], total: 1 });

      component.openDeleteModal(MOCK_VEHICLE);
      component.closeDeleteModal();

      expect(component.showDeleteModal()).toBeFalse();
      expect(component.deletingVehicle()).toBeNull();
    }));

    it('should close form modal on saved event', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE], total: 1 });

      component.openCreateModal();
      expect(component.showFormModal()).toBeTrue();

      component.onVehicleSaved();
      expect(component.showFormModal()).toBeFalse();
    }));

    it('should close delete modal on deleted event', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE], total: 1 });

      component.openDeleteModal(MOCK_VEHICLE);
      expect(component.showDeleteModal()).toBeTrue();

      component.onVehicleDeleted();
      expect(component.showDeleteModal()).toBeFalse();
    }));
  });

  // =========================================================================
  // Set Default
  // =========================================================================
  describe('Set Default', () => {
    it('should call vehicleService.setDefaultVehicle', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE_2], total: 1 });

      component.onSetDefault(MOCK_VEHICLE_2);

      const patchReq = httpMock.expectOne(`${VEHICLES_URL}/v-002/default`);
      expect(patchReq.request.method).toBe('PATCH');
      patchReq.flush({ ...MOCK_VEHICLE_2, isDefault: true });
      tick();

      // loadVehicles reload
      const listReq = httpMock.expectOne(VEHICLES_URL);
      listReq.flush({ vehicles: [{ ...MOCK_VEHICLE_2, isDefault: true }], total: 1 });
      tick();

      fixture.detectChanges();
    }));
  });

  // =========================================================================
  // formatVehicleName
  // =========================================================================
  describe('formatVehicleName', () => {
    it('should join brand and model', fakeAsync(() => {
      initAndLoad();
      const result = component.formatVehicleName(MOCK_VEHICLE);
      expect(result).toBe('Toyota Corolla');
    }));

    it('should return only brand if model is null', fakeAsync(() => {
      initAndLoad();
      const v = { ...MOCK_VEHICLE, model: null as unknown as string };
      const result = component.formatVehicleName(v);
      expect(result).toBe('Toyota');
    }));

    it('should return only model if brand is null', fakeAsync(() => {
      initAndLoad();
      const v = { ...MOCK_VEHICLE, brand: null as unknown as string };
      const result = component.formatVehicleName(v);
      expect(result).toBe('Corolla');
    }));

    it('should return empty string if both null', fakeAsync(() => {
      initAndLoad();
      const v = { ...MOCK_VEHICLE, brand: null as unknown as string, model: null as unknown as string };
      const result = component.formatVehicleName(v);
      expect(result).toBe('');
    }));
  });

  // =========================================================================
  // Accessibility
  // =========================================================================
  describe('Accessibility', () => {
    it('should have page heading', fakeAsync(() => {
      initAndLoad();

      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1.textContent).toContain('Meus Veículos');
    }));

    it('should have aria-label on table', fakeAsync(() => {
      initAndLoad({ vehicles: [MOCK_VEHICLE], total: 1 });

      const table = fixture.nativeElement.querySelector('table');
      expect(table?.getAttribute('aria-label')).toBe('Lista de veículos');
    }));
  });
});

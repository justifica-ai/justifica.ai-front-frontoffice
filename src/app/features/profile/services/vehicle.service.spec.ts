import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VehicleService } from './vehicle.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';
import type { Vehicle, VehicleListResponse } from '../../../core/models/vehicle.model';

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

describe('VehicleService', () => {
  let service: VehicleService;
  let httpMock: HttpTestingController;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        VehicleService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastSpy },
      ],
    });

    service = TestBed.inject(VehicleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // =========================================================================
  // Initial State
  // =========================================================================
  describe('Initial State', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have empty vehicles initially', () => {
      expect(service.vehicles()).toEqual([]);
    });

    it('should not be loading initially', () => {
      expect(service.loading()).toBeFalse();
    });

    it('should have no error initially', () => {
      expect(service.error()).toBeNull();
    });

    it('should report total as 0', () => {
      expect(service.total()).toBe(0);
    });

    it('should not have reached limit', () => {
      expect(service.hasReachedLimit()).toBeFalse();
    });

    it('should not have a default vehicle', () => {
      expect(service.defaultVehicle()).toBeNull();
    });
  });

  // =========================================================================
  // loadVehicles
  // =========================================================================
  describe('loadVehicles', () => {
    it('should load vehicles from API', async () => {
      const response: VehicleListResponse = { vehicles: [MOCK_VEHICLE], total: 1 };

      const promise = service.loadVehicles();

      const req = httpMock.expectOne(`${environment.apiUrl}/vehicles`);
      expect(req.request.method).toBe('GET');
      req.flush(response);

      await promise;

      expect(service.vehicles()).toEqual([MOCK_VEHICLE]);
      expect(service.total()).toBe(1);
      expect(service.loading()).toBeFalse();
    });

    it('should set loading state during request', () => {
      service.loadVehicles();
      expect(service.loading()).toBeTrue();

      httpMock.expectOne(`${environment.apiUrl}/vehicles`).flush({ vehicles: [], total: 0 });
    });

    it('should set error on failure', async () => {
      const promise = service.loadVehicles();

      httpMock.expectOne(`${environment.apiUrl}/vehicles`).error(new ProgressEvent('error'));

      await promise;

      expect(service.error()).toBeTruthy();
      expect(toastSpy.error).toHaveBeenCalled();
      expect(service.loading()).toBeFalse();
    });

    it('should compute hasReachedLimit when 10 vehicles', async () => {
      const vehicles = Array.from({ length: 10 }, (_, i) => ({
        ...MOCK_VEHICLE,
        id: `v-${i}`,
      }));

      const promise = service.loadVehicles();
      httpMock.expectOne(`${environment.apiUrl}/vehicles`).flush({ vehicles, total: 10 });
      await promise;

      expect(service.hasReachedLimit()).toBeTrue();
    });

    it('should compute defaultVehicle correctly', async () => {
      const promise = service.loadVehicles();
      httpMock.expectOne(`${environment.apiUrl}/vehicles`).flush({
        vehicles: [MOCK_VEHICLE],
        total: 1,
      });
      await promise;

      expect(service.defaultVehicle()?.id).toBe('v-001');
    });
  });

  // =========================================================================
  // createVehicle
  // =========================================================================
  describe('createVehicle', () => {
    it('should create vehicle and reload list', fakeAsync(() => {
      const input = { plate: 'DEF5G67' };
      let result: unknown;

      service.createVehicle(input).then((r) => (result = r));

      const createReq = httpMock.expectOne(`${environment.apiUrl}/vehicles`);
      expect(createReq.request.method).toBe('POST');
      expect(createReq.request.body).toEqual(input);
      createReq.flush(MOCK_VEHICLE);
      tick(); // drain firstValueFrom promise

      // Reload triggered
      const listReq = httpMock.expectOne(`${environment.apiUrl}/vehicles`);
      listReq.flush({ vehicles: [MOCK_VEHICLE], total: 1 });
      tick(); // drain loadVehicles promise

      expect(result).toBeTruthy();
      expect(toastSpy.success).toHaveBeenCalled();
    }));

    it('should return null on error', async () => {
      const promise = service.createVehicle({ plate: 'DEF5G67' });

      httpMock.expectOne(`${environment.apiUrl}/vehicles`).error(new ProgressEvent('error'));

      const result = await promise;

      expect(result).toBeNull();
      expect(toastSpy.error).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // updateVehicle
  // =========================================================================
  describe('updateVehicle', () => {
    it('should update vehicle and reload list', fakeAsync(() => {
      let result: unknown;
      service.updateVehicle('v-001', { brand: 'Honda' }).then((r) => (result = r));

      const updateReq = httpMock.expectOne(`${environment.apiUrl}/vehicles/v-001`);
      expect(updateReq.request.method).toBe('PATCH');
      updateReq.flush(MOCK_VEHICLE);
      tick();

      const listReq = httpMock.expectOne(`${environment.apiUrl}/vehicles`);
      listReq.flush({ vehicles: [MOCK_VEHICLE], total: 1 });
      tick();

      expect(result).toBeTruthy();
      expect(toastSpy.success).toHaveBeenCalled();
    }));

    it('should return null on error', async () => {
      const promise = service.updateVehicle('v-001', { brand: 'Honda' });

      httpMock.expectOne(`${environment.apiUrl}/vehicles/v-001`).error(new ProgressEvent('error'));

      const result = await promise;

      expect(result).toBeNull();
      expect(toastSpy.error).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // deleteVehicle
  // =========================================================================
  describe('deleteVehicle', () => {
    it('should delete vehicle and reload list', fakeAsync(() => {
      let result: unknown;
      service.deleteVehicle('v-001').then((r) => (result = r));

      const deleteReq = httpMock.expectOne(`${environment.apiUrl}/vehicles/v-001`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush({ message: 'ok' });
      tick();

      const listReq = httpMock.expectOne(`${environment.apiUrl}/vehicles`);
      listReq.flush({ vehicles: [], total: 0 });
      tick();

      expect(result).toBeTrue();
      expect(toastSpy.success).toHaveBeenCalled();
    }));

    it('should return false on error', async () => {
      const promise = service.deleteVehicle('v-001');

      httpMock.expectOne(`${environment.apiUrl}/vehicles/v-001`).error(new ProgressEvent('error'));

      const result = await promise;

      expect(result).toBeFalse();
      expect(toastSpy.error).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // setDefaultVehicle
  // =========================================================================
  describe('setDefaultVehicle', () => {
    it('should set default vehicle and reload list', fakeAsync(() => {
      let result: unknown;
      service.setDefaultVehicle('v-001').then((r) => (result = r));

      const patchReq = httpMock.expectOne(`${environment.apiUrl}/vehicles/v-001/default`);
      expect(patchReq.request.method).toBe('PATCH');
      patchReq.flush(MOCK_VEHICLE);
      tick();

      const listReq = httpMock.expectOne(`${environment.apiUrl}/vehicles`);
      listReq.flush({ vehicles: [MOCK_VEHICLE], total: 1 });
      tick();

      expect(result).toBeTrue();
      expect(toastSpy.success).toHaveBeenCalled();
    }));

    it('should return false on error', async () => {
      const promise = service.setDefaultVehicle('v-001');

      httpMock.expectOne(`${environment.apiUrl}/vehicles/v-001/default`).error(new ProgressEvent('error'));

      const result = await promise;

      expect(result).toBeFalse();
      expect(toastSpy.error).toHaveBeenCalled();
    });
  });
});

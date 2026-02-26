import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AppealFormService } from './appeal-form.service';
import { ToastService } from '../../../core/services/toast.service';
import { APPEAL_FORM_STORAGE_KEY } from '../models/appeal-form.model';
import { environment } from '../../../../environments/environment';

describe('AppealFormService', () => {
  let service: AppealFormService;
  let httpMock: HttpTestingController;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        AppealFormService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastSpy },
      ],
    });

    service = TestBed.inject(AppealFormService);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.removeItem(APPEAL_FORM_STORAGE_KEY);
  });

  afterEach(() => {
    httpMock.verify();
    service.ngOnDestroy();
    localStorage.removeItem(APPEAL_FORM_STORAGE_KEY);
  });

  // =========================================================================
  // Creation
  // =========================================================================
  describe('Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with default state', () => {
      expect(service.formState().currentStep).toBe(0);
      expect(service.formState().appealId).toBeNull();
    });

    it('should have isSaving as false initially', () => {
      expect(service.isSaving()).toBe(false);
    });

    it('should have lastSavedAt as null initially', () => {
      expect(service.lastSavedAt()).toBeNull();
    });
  });

  // =========================================================================
  // Initialization
  // =========================================================================
  describe('initialize', () => {
    it('should set appeal type on initialize', () => {
      service.initialize('prior_defense');
      expect(service.formState().appealType).toBe('prior_defense');
    });

    it('should restore from localStorage if same type', () => {
      const savedState = {
        appealId: 'test-id',
        appealType: 'first_instance',
        currentStep: 2,
        vehicle: { plate: 'ABC1D23', brand: '', model: '', year: '', color: '', renavam: '', vehicleId: null },
        infraction: { autoNumber: '', infractionDate: '', infractionTime: '', infractionCode: '', infractionDescription: '', location: '', organName: '', notificationDate: '', speedMeasured: '', speedLimit: '' },
        driver: { isOwner: true, driverName: '', driverCpf: '', driverCnh: '', driverCnhCategory: '', driverCnhExpiry: '' },
        arguments: { defenseReasons: [], additionalDetails: '' },
        uploadedFiles: [],
        lastSavedAt: '2024-01-01T00:00:00Z',
      };
      localStorage.setItem(APPEAL_FORM_STORAGE_KEY, JSON.stringify(savedState));

      service.initialize('first_instance');
      expect(service.formState().vehicle.plate).toBe('ABC1D23');
      expect(service.formState().currentStep).toBe(2);
    });

    it('should NOT restore from localStorage if different type', () => {
      const savedState = {
        appealId: 'test-id',
        appealType: 'second_instance',
        currentStep: 2,
        vehicle: { plate: 'ABC1D23', brand: '', model: '', year: '', color: '', renavam: '', vehicleId: null },
        infraction: { autoNumber: '', infractionDate: '', infractionTime: '', infractionCode: '', infractionDescription: '', location: '', organName: '', notificationDate: '', speedMeasured: '', speedLimit: '' },
        driver: { isOwner: true, driverName: '', driverCpf: '', driverCnh: '', driverCnhCategory: '', driverCnhExpiry: '' },
        arguments: { defenseReasons: [], additionalDetails: '' },
        uploadedFiles: [],
        lastSavedAt: null,
      };
      localStorage.setItem(APPEAL_FORM_STORAGE_KEY, JSON.stringify(savedState));

      service.initialize('first_instance');
      expect(service.formState().vehicle.plate).toBe('');
      expect(service.formState().currentStep).toBe(0);
    });
  });

  // =========================================================================
  // Step navigation
  // =========================================================================
  describe('Step navigation', () => {
    beforeEach(() => service.initialize('first_instance'));

    it('should navigate to next step', () => {
      service.nextStep();
      expect(service.currentStep()).toBe(1);
    });

    it('should navigate to previous step', () => {
      service.nextStep();
      service.previousStep();
      expect(service.currentStep()).toBe(0);
    });

    it('should not go below step 0', () => {
      service.previousStep();
      expect(service.currentStep()).toBe(0);
    });

    it('should not go above step 4', () => {
      service.goToStep(4);
      service.nextStep();
      expect(service.currentStep()).toBe(4);
    });

    it('should navigate directly via goToStep', () => {
      service.goToStep(2);
      expect(service.currentStep()).toBe(2);
    });

    it('should ignore invalid step numbers', () => {
      service.goToStep(-1);
      expect(service.currentStep()).toBe(0);
      service.goToStep(5);
      expect(service.currentStep()).toBe(0);
    });
  });

  // =========================================================================
  // State updates
  // =========================================================================
  describe('State updates', () => {
    beforeEach(() => service.initialize('first_instance'));

    it('should update vehicle data', () => {
      service.updateVehicle({ plate: 'ABC1D23' });
      expect(service.formState().vehicle.plate).toBe('ABC1D23');
    });

    it('should merge vehicle data without overwriting other fields', () => {
      service.updateVehicle({ plate: 'ABC1D23' });
      service.updateVehicle({ brand: 'VW' });
      expect(service.formState().vehicle.plate).toBe('ABC1D23');
      expect(service.formState().vehicle.brand).toBe('VW');
    });

    it('should update infraction data', () => {
      service.updateInfraction({ autoNumber: '123456' });
      expect(service.formState().infraction.autoNumber).toBe('123456');
    });

    it('should update driver data', () => {
      service.updateDriver({ isOwner: false, driverName: 'João' });
      expect(service.formState().driver.isOwner).toBe(false);
      expect(service.formState().driver.driverName).toBe('João');
    });

    it('should update arguments data', () => {
      service.updateArguments({ defenseReasons: ['D01', 'D03'] });
      expect(service.formState().arguments.defenseReasons).toEqual(['D01', 'D03']);
    });

    it('should save to localStorage on every update', () => {
      service.updateVehicle({ plate: 'XYZ9999' });
      const saved = JSON.parse(localStorage.getItem(APPEAL_FORM_STORAGE_KEY)!);
      expect(saved.vehicle.plate).toBe('XYZ9999');
    });
  });

  // =========================================================================
  // File management
  // =========================================================================
  describe('File management', () => {
    beforeEach(() => service.initialize('first_instance'));

    it('should add uploaded file', () => {
      service.addUploadedFile({
        id: 'f1', name: 'test.pdf', size: 1024, type: 'application/pdf', progress: 0, status: 'uploading',
      });
      expect(service.formState().uploadedFiles.length).toBe(1);
    });

    it('should update uploaded file', () => {
      service.addUploadedFile({
        id: 'f1', name: 'test.pdf', size: 1024, type: 'application/pdf', progress: 0, status: 'uploading',
      });
      service.updateUploadedFile('f1', { progress: 100, status: 'done' });
      expect(service.formState().uploadedFiles[0].progress).toBe(100);
      expect(service.formState().uploadedFiles[0].status).toBe('done');
    });

    it('should remove uploaded file', () => {
      service.addUploadedFile({
        id: 'f1', name: 'test.pdf', size: 1024, type: 'application/pdf', progress: 0, status: 'uploading',
      });
      service.removeUploadedFile('f1');
      expect(service.formState().uploadedFiles.length).toBe(0);
    });
  });

  // =========================================================================
  // API: Create draft
  // =========================================================================
  describe('createDraft', () => {
    beforeEach(() => service.initialize('first_instance'));

    it('should POST to create appeal and store appealId', async () => {
      const promise = service.createDraft();

      const req = httpMock.expectOne(`${environment.apiUrl}/appeals`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.appealType).toBe('first_instance');
      req.flush({ id: 'new-appeal-id', status: 'draft', appealType: 'first_instance', createdAt: '2024-01-01' });

      const result = await promise;
      expect(result).toBe('new-appeal-id');
      expect(service.appealId()).toBe('new-appeal-id');
    });

    it('should return existing appealId if already created', async () => {
      // First create
      const promise1 = service.createDraft();
      const req = httpMock.expectOne(`${environment.apiUrl}/appeals`);
      req.flush({ id: 'existing-id', status: 'draft', appealType: 'first_instance', createdAt: '2024-01-01' });
      await promise1;

      // Second call should not make request
      const result = await service.createDraft();
      httpMock.expectNone(`${environment.apiUrl}/appeals`);
      expect(result).toBe('existing-id');
    });

    it('should show toast on error', async () => {
      const promise = service.createDraft();

      const req = httpMock.expectOne(`${environment.apiUrl}/appeals`);
      req.flush({ error: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

      const result = await promise;
      expect(result).toBeNull();
      expect(toastSpy.error).toHaveBeenCalledWith('Erro ao criar rascunho. Tente novamente.');
    });
  });

  // =========================================================================
  // API: Sync to API
  // =========================================================================
  describe('syncToApi', () => {
    beforeEach(() => {
      service.initialize('first_instance');
    });

    it('should create draft first if no appealId', async () => {
      service.updateVehicle({ plate: 'ABC1D23' });

      const promise = service.syncToApi();

      // First, creates the draft
      const createReq = httpMock.expectOne(`${environment.apiUrl}/appeals`);
      createReq.flush({ id: 'draft-id', status: 'draft', appealType: 'first_instance', createdAt: '2024-01-01' });

      // Yield microtask queue so createDraft's toPromise() resolves
      // and syncToApi proceeds to the PATCH call
      await Promise.resolve();
      await Promise.resolve();

      // Then, patches the form data
      const patchReq = httpMock.expectOne(`${environment.apiUrl}/appeals/draft-id`);
      expect(patchReq.request.method).toBe('PATCH');
      expect(patchReq.request.body.formData.vehicle.plate).toBe('ABC1D23');
      patchReq.flush({});

      const result = await promise;
      expect(result).toBe(true);
      expect(service.lastSavedAt()).toBeTruthy();
    });

    it('should set isSaving during sync', async () => {
      // Pre-set appealId
      const createPromise = service.createDraft();
      httpMock.expectOne(`${environment.apiUrl}/appeals`).flush({
        id: 'id-1', status: 'draft', appealType: 'first_instance', createdAt: '2024-01-01',
      });
      await createPromise;

      const promise = service.syncToApi();
      expect(service.isSaving()).toBe(true);

      httpMock.expectOne(`${environment.apiUrl}/appeals/id-1`).flush({});
      await promise;
      expect(service.isSaving()).toBe(false);
    });
  });

  // =========================================================================
  // localStorage
  // =========================================================================
  describe('localStorage', () => {
    it('should clear localStorage', () => {
      service.initialize('first_instance');
      service.updateVehicle({ plate: 'ABC1D23' });
      expect(localStorage.getItem(APPEAL_FORM_STORAGE_KEY)).toBeTruthy();

      service.clearLocalStorage();
      expect(localStorage.getItem(APPEAL_FORM_STORAGE_KEY)).toBeNull();
    });
  });
});

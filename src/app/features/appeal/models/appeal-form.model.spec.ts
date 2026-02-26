import {
  AppealFormState,
  AppealType,
  APPEAL_FORM_STORAGE_KEY,
  APPEAL_STEPS,
  createEmptyFormState,
  StepConfig,
  VehicleFormData,
  InfractionFormData,
  DriverFormData,
  ArgumentsFormData,
  UploadedFile,
} from './appeal-form.model';

describe('AppealFormModel', () => {
  // =========================================================================
  // APPEAL_STEPS
  // =========================================================================
  describe('APPEAL_STEPS', () => {
    it('should have 4 steps', () => {
      expect(APPEAL_STEPS.length).toBe(4);
    });

    it('should have sequential indices from 0 to 3', () => {
      const indices = APPEAL_STEPS.map((s: StepConfig) => s.index);
      expect(indices).toEqual([0, 1, 2, 3]);
    });

    it('should have correct labels', () => {
      const labels = APPEAL_STEPS.map((s: StepConfig) => s.label);
      expect(labels).toEqual(['Veículo', 'Infração', 'Condutor', 'Argumentos']);
    });

    it('should have icons for every step', () => {
      APPEAL_STEPS.forEach((step: StepConfig) => {
        expect(step.icon).toBeTruthy();
      });
    });

    it('should have descriptions for every step', () => {
      APPEAL_STEPS.forEach((step: StepConfig) => {
        expect(step.description).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // createEmptyFormState
  // =========================================================================
  describe('createEmptyFormState', () => {
    it('should create empty state for first_instance', () => {
      const state = createEmptyFormState('first_instance');
      expect(state.appealType).toBe('first_instance');
      expect(state.currentStep).toBe(0);
      expect(state.appealId).toBeNull();
      expect(state.lastSavedAt).toBeNull();
    });

    it('should create empty state for prior_defense', () => {
      const state = createEmptyFormState('prior_defense');
      expect(state.appealType).toBe('prior_defense');
    });

    it('should create empty state for second_instance', () => {
      const state = createEmptyFormState('second_instance');
      expect(state.appealType).toBe('second_instance');
    });

    it('should have empty vehicle data', () => {
      const state = createEmptyFormState('first_instance');
      expect(state.vehicle.plate).toBe('');
      expect(state.vehicle.brand).toBe('');
      expect(state.vehicle.model).toBe('');
      expect(state.vehicle.year).toBe('');
      expect(state.vehicle.color).toBe('');
      expect(state.vehicle.renavam).toBe('');
      expect(state.vehicle.vehicleId).toBeNull();
    });

    it('should have empty infraction data', () => {
      const state = createEmptyFormState('first_instance');
      expect(state.infraction.autoNumber).toBe('');
      expect(state.infraction.infractionDate).toBe('');
      expect(state.infraction.infractionTime).toBe('');
      expect(state.infraction.infractionCode).toBe('');
      expect(state.infraction.infractionDescription).toBe('');
      expect(state.infraction.location).toBe('');
      expect(state.infraction.organName).toBe('');
      expect(state.infraction.notificationDate).toBe('');
      expect(state.infraction.speedMeasured).toBe('');
      expect(state.infraction.speedLimit).toBe('');
    });

    it('should have default driver data with isOwner true', () => {
      const state = createEmptyFormState('first_instance');
      expect(state.driver.isOwner).toBe(true);
      expect(state.driver.driverName).toBe('');
      expect(state.driver.driverCpf).toBe('');
      expect(state.driver.driverCnh).toBe('');
      expect(state.driver.driverCnhCategory).toBe('');
      expect(state.driver.driverCnhExpiry).toBe('');
    });

    it('should have empty arguments data', () => {
      const state = createEmptyFormState('first_instance');
      expect(state.arguments.defenseReasons).toEqual([]);
      expect(state.arguments.additionalDetails).toBe('');
    });

    it('should have empty uploaded files array', () => {
      const state = createEmptyFormState('first_instance');
      expect(state.uploadedFiles).toEqual([]);
    });

    it('should create independent instances', () => {
      const state1 = createEmptyFormState('first_instance');
      const state2 = createEmptyFormState('first_instance');
      state1.vehicle.plate = 'ABC1234';
      expect(state2.vehicle.plate).toBe('');
    });
  });

  // =========================================================================
  // APPEAL_FORM_STORAGE_KEY
  // =========================================================================
  describe('APPEAL_FORM_STORAGE_KEY', () => {
    it('should be a non-empty string', () => {
      expect(APPEAL_FORM_STORAGE_KEY).toBeTruthy();
      expect(typeof APPEAL_FORM_STORAGE_KEY).toBe('string');
    });

    it('should start with justifica', () => {
      expect(APPEAL_FORM_STORAGE_KEY).toMatch(/^justifica/);
    });
  });

  // =========================================================================
  // Type shape validations
  // =========================================================================
  describe('Type shapes', () => {
    it('should allow all valid AppealType values', () => {
      const types: AppealType[] = ['prior_defense', 'first_instance', 'second_instance'];
      types.forEach((t) => {
        const state = createEmptyFormState(t);
        expect(state.appealType).toBe(t);
      });
    });

    it('should support UploadedFile with all statuses', () => {
      const statuses: UploadedFile['status'][] = ['uploading', 'done', 'error'];
      statuses.forEach((status) => {
        const file: UploadedFile = {
          id: '1',
          name: 'test.pdf',
          size: 1024,
          type: 'application/pdf',
          progress: 100,
          status,
        };
        expect(file.status).toBe(status);
      });
    });

    it('should support UploadedFile with optional r2Key', () => {
      const file: UploadedFile = {
        id: '1',
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        progress: 100,
        status: 'done',
        r2Key: 'uploads/file.pdf',
      };
      expect(file.r2Key).toBe('uploads/file.pdf');
    });
  });
});

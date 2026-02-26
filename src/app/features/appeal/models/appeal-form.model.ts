/**
 * Appeal Form Stepper — Domain Models
 *
 * Defines the shape of each step's form data, the overall form state,
 * and helpers consumed by the stepper container and child-step components.
 */

// ─── Appeal type (re-exported from quiz-modal for convenience) ───

export type AppealType =
  | 'prior_defense'
  | 'first_instance'
  | 'second_instance';

// ─── Step 1 — Vehicle ───

export interface VehicleFormData {
  plate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  renavam: string;
  vehicleId: string | null;
}

// ─── Step 2 — Infraction ───

export interface InfractionFormData {
  autoNumber: string;
  infractionDate: string;
  infractionTime: string;
  infractionCode: string;
  infractionDescription: string;
  location: string;
  organName: string;
  notificationDate: string;
  speedMeasured: string;
  speedLimit: string;
}

// ─── Step 3 — Driver ───

export interface DriverFormData {
  isOwner: boolean;
  driverName: string;
  driverCpf: string;
  driverCnh: string;
  driverCnhCategory: string;
  driverCnhExpiry: string;
}

// ─── Step 4 — Arguments ───

export interface ArgumentsFormData {
  defenseReasons: string[];
  additionalDetails: string;
}

// ─── Uploaded file reference ───

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  r2Key?: string;
}

// ─── Full form state persisted to localStorage / API ───

export interface AppealFormState {
  appealId: string | null;
  appealType: AppealType;
  currentStep: number;
  vehicle: VehicleFormData;
  infraction: InfractionFormData;
  driver: DriverFormData;
  arguments: ArgumentsFormData;
  uploadedFiles: UploadedFile[];
  lastSavedAt: string | null;
}

// ─── Stepper metadata ───

export interface StepConfig {
  index: number;
  label: string;
  icon: string;
  description: string;
}

export const APPEAL_STEPS: StepConfig[] = [
  { index: 0, label: 'Veículo', icon: '🚗', description: 'Dados do veículo' },
  { index: 1, label: 'Infração', icon: '📋', description: 'Dados da multa' },
  { index: 2, label: 'Condutor', icon: '👤', description: 'Dados do condutor' },
  { index: 3, label: 'Argumentos', icon: '💬', description: 'Defesa e evidências' },
];

// ─── Default empty state factory ───

export function createEmptyFormState(appealType: AppealType): AppealFormState {
  return {
    appealId: null,
    appealType,
    currentStep: 0,
    vehicle: {
      plate: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      renavam: '',
      vehicleId: null,
    },
    infraction: {
      autoNumber: '',
      infractionDate: '',
      infractionTime: '',
      infractionCode: '',
      infractionDescription: '',
      location: '',
      organName: '',
      notificationDate: '',
      speedMeasured: '',
      speedLimit: '',
    },
    driver: {
      isOwner: true,
      driverName: '',
      driverCpf: '',
      driverCnh: '',
      driverCnhCategory: '',
      driverCnhExpiry: '',
    },
    arguments: {
      defenseReasons: [],
      additionalDetails: '',
    },
    uploadedFiles: [],
    lastSavedAt: null,
  };
}

// ─── Local storage key ───

export const APPEAL_FORM_STORAGE_KEY = 'justifica_appeal_form_draft';

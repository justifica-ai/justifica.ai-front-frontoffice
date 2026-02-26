export interface Vehicle {
  id: string;
  plate: string;
  plateFormat: 'mercosul' | 'old' | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  hasRenavam: boolean;
  nickname: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleListResponse {
  vehicles: Vehicle[];
  total: number;
}

export interface CreateVehicleInput {
  plate: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  renavam?: string;
  nickname?: string;
  isDefault?: boolean;
}

export interface UpdateVehicleInput {
  plate?: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  renavam?: string | null;
  nickname?: string | null;
}

export const MAX_VEHICLES = 10;

export const MERCOSUL_PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
export const OLD_PLATE_REGEX = /^[A-Z]{3}-?[0-9]{4}$/;

export function detectPlateFormat(plate: string): 'mercosul' | 'old' {
  return MERCOSUL_PLATE_REGEX.test(plate) ? 'mercosul' : 'old';
}

export function validateRenavamCheckDigit(renavam: string): boolean {
  if (renavam.length !== 11 || !/^\d{11}$/.test(renavam)) return false;

  const digits = renavam.split('').map(Number);
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += digits[i] * weights[i];
  }

  const remainder = (sum * 10) % 11;
  const checkDigit = remainder >= 10 ? 0 : remainder;

  return checkDigit === digits[10];
}

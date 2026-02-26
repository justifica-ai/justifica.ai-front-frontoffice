import {
  detectPlateFormat,
  validateRenavamCheckDigit,
  MERCOSUL_PLATE_REGEX,
  OLD_PLATE_REGEX,
  MAX_VEHICLES,
} from './vehicle.model';

describe('vehicle.model', () => {
  describe('MERCOSUL_PLATE_REGEX', () => {
    it('should match valid Mercosul plates', () => {
      expect(MERCOSUL_PLATE_REGEX.test('ABC1D23')).toBeTrue();
      expect(MERCOSUL_PLATE_REGEX.test('XYZ9A00')).toBeTrue();
    });

    it('should not match old format plates', () => {
      expect(MERCOSUL_PLATE_REGEX.test('ABC1234')).toBeFalse();
    });

    it('should not match invalid plates', () => {
      expect(MERCOSUL_PLATE_REGEX.test('1234567')).toBeFalse();
      expect(MERCOSUL_PLATE_REGEX.test('')).toBeFalse();
    });
  });

  describe('OLD_PLATE_REGEX', () => {
    it('should match valid old format plates', () => {
      expect(OLD_PLATE_REGEX.test('ABC1234')).toBeTrue();
      expect(OLD_PLATE_REGEX.test('ABC-1234')).toBeTrue();
    });

    it('should not match Mercosul plates', () => {
      expect(OLD_PLATE_REGEX.test('ABC1D23')).toBeFalse();
    });
  });

  describe('detectPlateFormat', () => {
    it('should detect Mercosul format', () => {
      expect(detectPlateFormat('ABC1D23')).toBe('mercosul');
    });

    it('should detect old format', () => {
      expect(detectPlateFormat('ABC1234')).toBe('old');
    });

    it('should default to old for unrecognized', () => {
      expect(detectPlateFormat('1234567')).toBe('old');
    });
  });

  describe('validateRenavamCheckDigit', () => {
    it('should return true for valid RENAVAM 10000000008', () => {
      expect(validateRenavamCheckDigit('10000000008')).toBeTrue();
    });

    it('should return true for valid RENAVAM 12345678900', () => {
      expect(validateRenavamCheckDigit('12345678900')).toBeTrue();
    });

    it('should return true for all-zeros 00000000000', () => {
      expect(validateRenavamCheckDigit('00000000000')).toBeTrue();
    });

    it('should return true for RENAVAM where remainder >= 10 → checkDigit = 0', () => {
      // 40000000000: sum=12, (120)%11=10, checkDigit=0
      expect(validateRenavamCheckDigit('40000000000')).toBeTrue();
    });

    it('should return false for wrong check digit', () => {
      expect(validateRenavamCheckDigit('10000000009')).toBeFalse();
    });

    it('should return false for wrong length', () => {
      expect(validateRenavamCheckDigit('1234567890')).toBeFalse();
    });

    it('should return false for non-numeric', () => {
      expect(validateRenavamCheckDigit('1000000000A')).toBeFalse();
    });

    it('should return false for empty string', () => {
      expect(validateRenavamCheckDigit('')).toBeFalse();
    });
  });

  describe('MAX_VEHICLES', () => {
    it('should be 10', () => {
      expect(MAX_VEHICLES).toBe(10);
    });
  });
});

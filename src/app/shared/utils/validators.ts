import { AbstractControl, ValidationErrors } from '@angular/forms';

const PASSWORD_MIN_LENGTH = 8;

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong';

export function calculateStrength(password: string): { level: PasswordStrengthLevel; percent: number } {
  if (!password) return { level: 'weak', percent: 0 };

  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (score <= 2) return { level: 'weak', percent: 25 };
  if (score <= 3) return { level: 'medium', percent: 50 };
  if (score <= 5) return { level: 'strong', percent: 75 };
  return { level: 'very-strong', percent: 100 };
}

export function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;

  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  const hasMinLength = value.length >= PASSWORD_MIN_LENGTH;

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial || !hasMinLength) {
    return { passwordStrength: true };
  }
  return null;
}

export function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value as string ?? group.get('newPassword')?.value as string;
  const confirm = group.get('confirmPassword')?.value as string;
  if (password && confirm && password !== confirm) {
    return { passwordMismatch: true };
  }
  return null;
}

export function cpfValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string ?? '').replace(/\D/g, '');
  if (!value) return null;
  if (value.length !== 11) return { cpf: true };

  // Check for known invalid patterns
  if (/^(\d)\1{10}$/.test(value)) return { cpf: true };

  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(value.charAt(i), 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(value.charAt(9), 10)) return { cpf: true };

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(value.charAt(i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(value.charAt(10), 10)) return { cpf: true };

  return null;
}

export function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string ?? '').replace(/\D/g, '');
  if (!value) return null;
  // Brazilian phone: 10 or 11 digits (DDD + number)
  if (value.length < 10 || value.length > 11) return { phone: true };
  return null;
}

export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

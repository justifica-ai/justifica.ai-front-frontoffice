import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppealFormService } from '../../../../services/appeal-form.service';
import { formatCpf, cpfValidator } from '../../../../../../shared/utils/validators';

@Component({
  selector: 'app-step-driver',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-lg font-bold text-gray-800 mb-1">Dados do Condutor</h2>
        <p class="text-sm text-gray-500">
          Informe se você é o proprietário do veículo e os dados do condutor no momento da infração.
        </p>
      </div>

      <form [formGroup]="form" class="space-y-4" (ngSubmit)="onContinue()">
        <!-- Is Owner toggle -->
        <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              formControlName="isOwner"
              class="sr-only peer"
              aria-label="Eu sou o proprietário do veículo"
            />
            <div
              class="w-11 h-6 bg-gray-300 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"
            ></div>
          </label>
          <span class="text-sm font-medium text-gray-700">
            Eu sou o proprietário do veículo
          </span>
        </div>

        @if (!form.controls.isOwner.value) {
          <!-- Driver Name -->
          <div>
            <label for="driverName" class="block text-sm font-medium text-gray-700 mb-1">
              Nome completo do condutor <span class="text-error-500">*</span>
              <span class="sr-only">(obrigatório)</span>
            </label>
            <input
              id="driverName"
              formControlName="driverName"
              type="text"
              placeholder="Nome completo do condutor"
              class="w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              [class.border-red-500]="showFieldError('driverName')"
              [class.border-gray-300]="!showFieldError('driverName')"
              [attr.aria-invalid]="showFieldError('driverName')"
              [attr.aria-describedby]="showFieldError('driverName') ? 'driverName-error' : null"
            />
            @if (showFieldError('driverName')) {
              <p id="driverName-error" class="mt-1 text-xs text-red-500" role="alert">
                {{ getFieldError('driverName') }}
              </p>
            }
          </div>

          <!-- Driver CPF -->
          <div>
            <label for="driverCpf" class="block text-sm font-medium text-gray-700 mb-1">
              CPF do condutor <span class="text-error-500">*</span>
              <span class="sr-only">(obrigatório)</span>
            </label>
            <input
              id="driverCpf"
              formControlName="driverCpf"
              type="text"
              placeholder="000.000.000-00"
              maxlength="14"
              (input)="onCpfInput()"
              class="w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              [class.border-red-500]="showFieldError('driverCpf')"
              [class.border-gray-300]="!showFieldError('driverCpf')"
              [attr.aria-invalid]="showFieldError('driverCpf')"
              [attr.aria-describedby]="showFieldError('driverCpf') ? 'driverCpf-error' : null"
            />
            @if (showFieldError('driverCpf')) {
              <p id="driverCpf-error" class="mt-1 text-xs text-red-500" role="alert">
                {{ getFieldError('driverCpf') }}
              </p>
            }
          </div>
        }

        <!-- CNH Number -->
        <div>
          <label for="driverCnh" class="block text-sm font-medium text-gray-700 mb-1">
            Nº da CNH
          </label>
          <input
            id="driverCnh"
            formControlName="driverCnh"
            type="text"
            placeholder="Número da CNH"
            maxlength="11"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- CNH Category -->
          <div>
            <label for="driverCnhCategory" class="block text-sm font-medium text-gray-700 mb-1">
              Categoria da CNH
            </label>
            <select
              id="driverCnhCategory"
              formControlName="driverCnhCategory"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
            >
              <option value="">Selecione</option>
              <option value="A">A — Motocicletas</option>
              <option value="B">B — Automóveis</option>
              <option value="AB">AB — Moto + Auto</option>
              <option value="C">C — Caminhões</option>
              <option value="D">D — Ônibus</option>
              <option value="E">E — Combinados</option>
              <option value="ACC">ACC — Ciclomotor</option>
            </select>
          </div>

          <!-- CNH Expiry -->
          <div>
            <label for="driverCnhExpiry" class="block text-sm font-medium text-gray-700 mb-1">
              Validade da CNH
            </label>
            <input
              id="driverCnhExpiry"
              formControlName="driverCnhExpiry"
              type="date"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        <!-- Navigation buttons -->
        <div class="flex justify-between pt-4">
          <button
            type="button"
            (click)="onBack()"
            class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
          >
            Voltar
          </button>
          <button
            type="submit"
            class="px-8 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  `,
})
export class StepDriverComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly formService = inject(AppealFormService);

  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    isOwner: [true],
    driverName: [''],
    driverCpf: [''],
    driverCnh: [''],
    driverCnhCategory: [''],
    driverCnhExpiry: [''],
  });

  ngOnInit(): void {
    const state = this.formService.formState();
    this.form.patchValue({
      isOwner: state.driver.isOwner,
      driverName: state.driver.driverName,
      driverCpf: state.driver.driverCpf,
      driverCnh: state.driver.driverCnh,
      driverCnhCategory: state.driver.driverCnhCategory,
      driverCnhExpiry: state.driver.driverCnhExpiry,
    });

    this.form.valueChanges.subscribe(() => {
      this.updateConditionalValidators();
      this.syncToService();
    });

    this.updateConditionalValidators();
  }

  onCpfInput(): void {
    const control = this.form.controls.driverCpf;
    control.setValue(formatCpf(control.value), { emitEvent: true });
  }

  onContinue(): void {
    this.submitted.set(true);

    if (!this.form.controls.isOwner.value) {
      if (!this.form.controls.driverName.value.trim()) {
        this.form.controls.driverName.markAsTouched();
      }
      if (!this.form.controls.driverCpf.value.trim()) {
        this.form.controls.driverCpf.markAsTouched();
      }
    }

    if (this.hasValidationErrors()) {
      this.form.markAllAsTouched();
      return;
    }

    this.syncToService();
    this.formService.nextStep();
  }

  onBack(): void {
    this.syncToService();
    this.formService.previousStep();
  }

  showFieldError(field: string): boolean {
    const control = this.form.get(field);
    if (!control) return false;
    return control.invalid && (control.touched || this.submitted());
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors) return '';

    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['invalidCpf']) return 'CPF inválido';
    return 'Campo inválido';
  }

  private updateConditionalValidators(): void {
    const isOwner = this.form.controls.isOwner.value;

    if (isOwner) {
      this.form.controls.driverName.clearValidators();
      this.form.controls.driverCpf.clearValidators();
    } else {
      this.form.controls.driverName.setValidators([Validators.required]);
      this.form.controls.driverCpf.setValidators([Validators.required, cpfValidator]);
    }

    this.form.controls.driverName.updateValueAndValidity({ emitEvent: false });
    this.form.controls.driverCpf.updateValueAndValidity({ emitEvent: false });
  }

  private hasValidationErrors(): boolean {
    if (!this.form.controls.isOwner.value) {
      return !this.form.controls.driverName.value.trim() || this.form.controls.driverCpf.invalid;
    }
    return false;
  }

  private syncToService(): void {
    const values = this.form.getRawValue();
    this.formService.updateDriver(values);
  }
}

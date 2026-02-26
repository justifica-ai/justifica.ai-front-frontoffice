import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { VehicleService } from '../../services/vehicle.service';
import type { Vehicle, CreateVehicleInput, UpdateVehicleInput } from '../../../../core/models/vehicle.model';
import {
  MERCOSUL_PLATE_REGEX,
  OLD_PLATE_REGEX,
  validateRenavamCheckDigit,
} from '../../../../core/models/vehicle.model';

function plateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const normalized = control.value.toUpperCase().replace(/-/g, '');
  if (MERCOSUL_PLATE_REGEX.test(normalized) || OLD_PLATE_REGEX.test(normalized)) return null;
  return { invalidPlate: true };
}

function renavamValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const value = control.value.replace(/\D/g, '');
  if (value.length !== 11) return { invalidLength: true };
  if (!validateRenavamCheckDigit(value)) return { invalidCheckDigit: true };
  return null;
}

@Component({
  selector: 'app-vehicle-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-40 bg-black/50 transition-opacity"
      role="presentation"
      (click)="close.emit()"
      (keydown.escape)="close.emit()"
    ></div>

    <!-- Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vehicle-form-title"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 pb-4">
          <h2 id="vehicle-form-title" class="text-lg font-bold text-gray-800">
            {{ vehicle() ? 'Editar veículo' : 'Adicionar veículo' }}
          </h2>
          <button
            type="button"
            (click)="close.emit()"
            aria-label="Fechar formulário"
            class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="form" class="px-6 pb-6 space-y-4" (ngSubmit)="onSubmit()">
          <!-- Plate -->
          <div>
            <label for="vehicle-plate" class="block text-sm font-medium text-gray-700 mb-1">
              Placa do veículo <span class="text-error-500">*</span>
              <span class="sr-only">(obrigatório)</span>
            </label>
            <input
              id="vehicle-plate"
              formControlName="plate"
              type="text"
              placeholder="ABC1D23 ou ABC-1234"
              maxlength="8"
              (input)="formatPlate()"
              class="w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none uppercase"
              [class.border-error-500]="showError('plate')"
              [class.border-gray-300]="!showError('plate')"
              [attr.aria-invalid]="showError('plate')"
              [attr.aria-describedby]="showError('plate') ? 'plate-error' : null"
            />
            @if (showError('plate')) {
              <p id="plate-error" class="mt-1 text-xs text-error-500" role="alert">
                {{ getError('plate') }}
              </p>
            }
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Brand -->
            <div>
              <label for="vehicle-brand" class="block text-sm font-medium text-gray-700 mb-1">
                Marca
              </label>
              <input
                id="vehicle-brand"
                formControlName="brand"
                type="text"
                placeholder="Ex: Volkswagen"
                maxlength="50"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            <!-- Model -->
            <div>
              <label for="vehicle-model" class="block text-sm font-medium text-gray-700 mb-1">
                Modelo
              </label>
              <input
                id="vehicle-model"
                formControlName="model"
                type="text"
                placeholder="Ex: Gol 1.0"
                maxlength="50"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Year -->
            <div>
              <label for="vehicle-year" class="block text-sm font-medium text-gray-700 mb-1">
                Ano
              </label>
              <input
                id="vehicle-year"
                formControlName="year"
                type="text"
                placeholder="Ex: 2023"
                maxlength="4"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                [attr.aria-invalid]="showError('year')"
                [attr.aria-describedby]="showError('year') ? 'year-error' : null"
              />
              @if (showError('year')) {
                <p id="year-error" class="mt-1 text-xs text-error-500" role="alert">
                  {{ getError('year') }}
                </p>
              }
            </div>

            <!-- Color -->
            <div>
              <label for="vehicle-color" class="block text-sm font-medium text-gray-700 mb-1">
                Cor
              </label>
              <input
                id="vehicle-color"
                formControlName="color"
                type="text"
                placeholder="Ex: Prata"
                maxlength="30"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <!-- RENAVAM -->
          <div>
            <label for="vehicle-renavam" class="block text-sm font-medium text-gray-700 mb-1">
              RENAVAM
            </label>
            <input
              id="vehicle-renavam"
              formControlName="renavam"
              type="text"
              placeholder="Código RENAVAM (11 dígitos)"
              maxlength="11"
              class="w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              [class.border-error-500]="showError('renavam')"
              [class.border-gray-300]="!showError('renavam')"
              [attr.aria-invalid]="showError('renavam')"
              [attr.aria-describedby]="showError('renavam') ? 'renavam-error' : null"
            />
            @if (showError('renavam')) {
              <p id="renavam-error" class="mt-1 text-xs text-error-500" role="alert">
                {{ getError('renavam') }}
              </p>
            }
          </div>

          <!-- Nickname -->
          <div>
            <label for="vehicle-nickname" class="block text-sm font-medium text-gray-700 mb-1">
              Apelido
            </label>
            <input
              id="vehicle-nickname"
              formControlName="nickname"
              type="text"
              placeholder="Ex: Carro do trabalho"
              maxlength="50"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <!-- Actions -->
          <div class="flex gap-3 justify-end pt-2">
            <button
              type="button"
              (click)="close.emit()"
              class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="saving()"
              class="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              @if (saving()) {
                <span class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </span>
              } @else {
                {{ vehicle() ? 'Salvar alterações' : 'Adicionar veículo' }}
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class VehicleFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly vehicleService = inject(VehicleService);

  vehicle = input<Vehicle | null>(null);
  close = output<void>();
  saved = output<Vehicle>();

  readonly saving = signal(false);
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    plate: ['', [Validators.required, plateValidator]],
    brand: [''],
    model: [''],
    year: ['', [Validators.pattern(/^\d{4}$/)]],
    color: [''],
    renavam: ['', [renavamValidator]],
    nickname: [''],
  });

  ngOnInit(): void {
    const v = this.vehicle();
    if (v) {
      this.form.patchValue({
        plate: v.plate,
        brand: v.brand ?? '',
        model: v.model ?? '',
        year: v.year?.toString() ?? '',
        color: v.color ?? '',
        renavam: '',
        nickname: v.nickname ?? '',
      });
    }
  }

  formatPlate(): void {
    const control = this.form.controls.plate;
    const raw = control.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    control.setValue(raw, { emitEvent: true });
  }

  showError(field: string): boolean {
    const control = this.form.get(field);
    if (!control) return false;
    return control.invalid && (control.touched || this.submitted());
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors) return '';

    if (control.errors['required']) return 'Campo obrigatório.';
    if (control.errors['invalidPlate']) return 'Placa inválida. Use o formato ABC1D23 ou ABC-1234.';
    if (control.errors['pattern']) {
      if (field === 'year') return 'Informe um ano válido (4 dígitos).';
      return 'Formato inválido.';
    }
    if (control.errors['invalidLength']) return 'RENAVAM deve ter exatamente 11 dígitos.';
    if (control.errors['invalidCheckDigit']) return 'RENAVAM inválido. Dígito verificador incorreto.';

    return 'Campo inválido.';
  }

  async onSubmit(): Promise<void> {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    try {
      const values = this.form.getRawValue();
      const v = this.vehicle();

      if (v) {
        const updateInput: UpdateVehicleInput = {};
        if (values.plate !== v.plate) updateInput.plate = values.plate.toUpperCase().replace(/-/g, '');
        if (values.brand !== (v.brand ?? '')) updateInput.brand = values.brand || null;
        if (values.model !== (v.model ?? '')) updateInput.model = values.model || null;
        if (values.year !== (v.year?.toString() ?? '')) updateInput.year = values.year ? parseInt(values.year, 10) : null;
        if (values.color !== (v.color ?? '')) updateInput.color = values.color || null;
        if (values.renavam) updateInput.renavam = values.renavam;
        if (values.nickname !== (v.nickname ?? '')) updateInput.nickname = values.nickname || null;

        const result = await this.vehicleService.updateVehicle(v.id, updateInput);
        if (result) this.saved.emit(result);
      } else {
        const createInput: CreateVehicleInput = {
          plate: values.plate.toUpperCase().replace(/-/g, ''),
        };
        if (values.brand) createInput.brand = values.brand;
        if (values.model) createInput.model = values.model;
        if (values.year) createInput.year = parseInt(values.year, 10);
        if (values.color) createInput.color = values.color;
        if (values.renavam) createInput.renavam = values.renavam;
        if (values.nickname) createInput.nickname = values.nickname;

        const result = await this.vehicleService.createVehicle(createInput);
        if (result) this.saved.emit(result);
      }
    } finally {
      this.saving.set(false);
    }
  }
}

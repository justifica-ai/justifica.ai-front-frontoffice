import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppealFormService } from '../../../../services/appeal-form.service';

@Component({
  selector: 'app-step-vehicle',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-lg font-bold text-gray-800 mb-1">Dados do Veículo</h2>
        <p class="text-sm text-gray-500">
          Informe os dados do veículo que recebeu a multa.
        </p>
      </div>

      <form [formGroup]="form" class="space-y-4" (ngSubmit)="onContinue()">
        <!-- Plate -->
        <div>
          <label for="plate" class="block text-sm font-medium text-gray-700 mb-1">
            Placa do veículo <span class="text-error-500">*</span>
            <span class="sr-only">(obrigatório)</span>
          </label>
          <input
            id="plate"
            formControlName="plate"
            type="text"
            placeholder="ABC1D23 ou ABC-1234"
            maxlength="8"
            (input)="formatPlate()"
            class="w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            [class.border-red-500]="showFieldError('plate')"
            [class.border-gray-300]="!showFieldError('plate')"
            [attr.aria-invalid]="showFieldError('plate')"
            [attr.aria-describedby]="showFieldError('plate') ? 'plate-error' : null"
          />
          @if (showFieldError('plate')) {
            <p id="plate-error" class="mt-1 text-xs text-red-500" role="alert">
              {{ getFieldError('plate') }}
            </p>
          }
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Brand -->
          <div>
            <label for="brand" class="block text-sm font-medium text-gray-700 mb-1">
              Marca
            </label>
            <input
              id="brand"
              formControlName="brand"
              type="text"
              placeholder="Ex: Volkswagen"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <!-- Model -->
          <div>
            <label for="model" class="block text-sm font-medium text-gray-700 mb-1">
              Modelo
            </label>
            <input
              id="model"
              formControlName="model"
              type="text"
              placeholder="Ex: Gol 1.0"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Year -->
          <div>
            <label for="year" class="block text-sm font-medium text-gray-700 mb-1">
              Ano
            </label>
            <input
              id="year"
              formControlName="year"
              type="text"
              placeholder="Ex: 2023"
              maxlength="4"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <!-- Color -->
          <div>
            <label for="color" class="block text-sm font-medium text-gray-700 mb-1">
              Cor
            </label>
            <input
              id="color"
              formControlName="color"
              type="text"
              placeholder="Ex: Prata"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        <!-- RENAVAM -->
        <div>
          <label for="renavam" class="block text-sm font-medium text-gray-700 mb-1">
            RENAVAM
          </label>
          <input
            id="renavam"
            formControlName="renavam"
            type="text"
            placeholder="Código RENAVAM do veículo"
            maxlength="11"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>

        <!-- Continue button -->
        <div class="flex justify-end pt-4">
          <button
            type="submit"
            class="px-8 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            [disabled]="form.invalid"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  `,
})
export class StepVehicleComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly formService = inject(AppealFormService);

  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    plate: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}\d[A-Z0-9]\d{2}$/i)]],
    brand: [''],
    model: [''],
    year: ['', [Validators.pattern(/^\d{4}$/)]],
    color: [''],
    renavam: ['', [Validators.pattern(/^\d{0,11}$/)]],
  });

  ngOnInit(): void {
    const state = this.formService.formState();
    this.form.patchValue({
      plate: state.vehicle.plate,
      brand: state.vehicle.brand,
      model: state.vehicle.model,
      year: state.vehicle.year,
      color: state.vehicle.color,
      renavam: state.vehicle.renavam,
    });

    this.form.valueChanges.subscribe(() => {
      this.syncToService();
    });
  }

  formatPlate(): void {
    const control = this.form.controls.plate;
    const raw = control.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    control.setValue(raw, { emitEvent: true });
  }

  onContinue(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.syncToService();
    this.formService.nextStep();
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
    if (control.errors['pattern']) {
      if (field === 'plate') return 'Placa inválida. Use o formato ABC1D23';
      if (field === 'year') return 'Informe um ano válido (4 dígitos)';
      return 'Formato inválido';
    }

    return 'Campo inválido';
  }

  private syncToService(): void {
    const values = this.form.getRawValue();
    this.formService.updateVehicle({
      plate: values.plate,
      brand: values.brand,
      model: values.model,
      year: values.year,
      color: values.color,
      renavam: values.renavam,
    });
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, filter, switchMap } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
import { API_ROUTES } from '../../../../../../core/constants/api-routes';
import { AppealFormService } from '../../../../services/appeal-form.service';

interface CtbInfraction {
  code: string;
  description: string;
  article: string;
  nature: string;
  points: number;
  baseValue: string;
}

interface CtbSearchResponse {
  data: CtbInfraction[];
  total: number;
}

@Component({
  selector: 'app-step-infraction',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-lg font-bold text-gray-800 mb-1">Dados da Infração</h2>
        <p class="text-sm text-gray-500">
          Informe os dados da multa conforme a notificação recebida.
        </p>
      </div>

      <form [formGroup]="form" class="space-y-4" (ngSubmit)="onContinue()">
        <!-- Auto number -->
        <div>
          <label for="autoNumber" class="block text-sm font-medium text-gray-700 mb-1">
            Nº do Auto de Infração <span class="text-error-500">*</span>
            <span class="sr-only">(obrigatório)</span>
          </label>
          <input
            id="autoNumber"
            formControlName="autoNumber"
            type="text"
            placeholder="Número do auto de infração"
            class="w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            [class.border-red-500]="showFieldError('autoNumber')"
            [class.border-gray-300]="!showFieldError('autoNumber')"
            [attr.aria-invalid]="showFieldError('autoNumber')"
            [attr.aria-describedby]="showFieldError('autoNumber') ? 'autoNumber-error' : null"
          />
          @if (showFieldError('autoNumber')) {
            <p id="autoNumber-error" class="mt-1 text-xs text-red-500" role="alert">
              {{ getFieldError('autoNumber') }}
            </p>
          }
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Infraction date -->
          <div>
            <label for="infractionDate" class="block text-sm font-medium text-gray-700 mb-1">
              Data da infração <span class="text-error-500">*</span>
              <span class="sr-only">(obrigatório)</span>
            </label>
            <input
              id="infractionDate"
              formControlName="infractionDate"
              type="date"
              class="w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              [class.border-red-500]="showFieldError('infractionDate')"
              [class.border-gray-300]="!showFieldError('infractionDate')"
              [attr.aria-invalid]="showFieldError('infractionDate')"
              [attr.aria-describedby]="showFieldError('infractionDate') ? 'infractionDate-error' : null"
            />
            @if (showFieldError('infractionDate')) {
              <p id="infractionDate-error" class="mt-1 text-xs text-red-500" role="alert">
                {{ getFieldError('infractionDate') }}
              </p>
            }
          </div>

          <!-- Infraction time -->
          <div>
            <label for="infractionTime" class="block text-sm font-medium text-gray-700 mb-1">
              Hora da infração
            </label>
            <input
              id="infractionTime"
              formControlName="infractionTime"
              type="time"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        <!-- CTB code autocomplete -->
        <div class="relative">
          <label for="infractionCode" class="block text-sm font-medium text-gray-700 mb-1">
            Código da infração (CTB) <span class="text-error-500">*</span>
            <span class="sr-only">(obrigatório)</span>
          </label>
          <input
            id="infractionCode"
            formControlName="infractionCode"
            type="text"
            placeholder="Digite o código ou descrição da infração"
            autocomplete="off"
            (input)="onSearchInput()"
            (focus)="onSearchFocus()"
            (blur)="onSearchBlur()"
            class="w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            [class.border-red-500]="showFieldError('infractionCode')"
            [class.border-gray-300]="!showFieldError('infractionCode')"
            [attr.aria-invalid]="showFieldError('infractionCode')"
            [attr.aria-describedby]="showFieldError('infractionCode') ? 'infractionCode-error' : null"
            [attr.aria-expanded]="showSuggestions()"
            aria-haspopup="listbox"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="ctb-suggestions"
          />
          @if (showFieldError('infractionCode')) {
            <p id="infractionCode-error" class="mt-1 text-xs text-red-500" role="alert">
              {{ getFieldError('infractionCode') }}
            </p>
          }

          <!-- Suggestions dropdown -->
          @if (showSuggestions() && suggestions().length > 0) {
            <ul
              id="ctb-suggestions"
              role="listbox"
              class="absolute z-10 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-60 overflow-y-auto"
            >
              @for (item of suggestions(); track item.code) {
                <li
                  role="option"
                  [attr.aria-selected]="false"
                  (mousedown)="selectInfraction(item)"
                  class="px-4 py-3 cursor-pointer hover:bg-brand-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                      {{ item.code }}
                    </span>
                    <span
                      class="text-xs px-2 py-0.5 rounded-full font-medium"
                      [class.bg-yellow-100]="item.nature === 'leve'"
                      [class.text-yellow-800]="item.nature === 'leve'"
                      [class.bg-orange-100]="item.nature === 'media'"
                      [class.text-orange-800]="item.nature === 'media'"
                      [class.bg-red-100]="item.nature === 'grave'"
                      [class.text-red-800]="item.nature === 'grave'"
                      [class.bg-red-200]="item.nature === 'gravissima'"
                      [class.text-red-900]="item.nature === 'gravissima'"
                    >
                      {{ item.nature }} · {{ item.points }}pts
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mt-1 line-clamp-2">{{ item.description }}</p>
                </li>
              }
            </ul>
          }

          <!-- Loading indicator -->
          @if (isSearching()) {
            <div class="absolute right-3 top-9">
              <div class="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin"></div>
            </div>
          }
        </div>

        <!-- Selected infraction info -->
        @if (selectedInfraction()) {
          <div class="bg-brand-50 border border-brand-200 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-bold text-brand-700">{{ selectedInfraction()!.code }}</span>
              <span class="text-xs text-gray-500">Art. {{ selectedInfraction()!.article }}</span>
            </div>
            <p class="text-sm text-gray-700">{{ selectedInfraction()!.description }}</p>
            <div class="flex gap-4 mt-2 text-xs text-gray-500">
              <span>Natureza: <strong>{{ selectedInfraction()!.nature }}</strong></span>
              <span>Pontos: <strong>{{ selectedInfraction()!.points }}</strong></span>
              <span>Valor: <strong>R$ {{ selectedInfraction()!.baseValue }}</strong></span>
            </div>
          </div>
        }

        <!-- Infraction description (auto-filled or manual) -->
        <div>
          <label for="infractionDescription" class="block text-sm font-medium text-gray-700 mb-1">
            Descrição da infração
          </label>
          <textarea
            id="infractionDescription"
            formControlName="infractionDescription"
            rows="2"
            placeholder="Descrição conforme notificação"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
          ></textarea>
        </div>

        <!-- Location -->
        <div>
          <label for="location" class="block text-sm font-medium text-gray-700 mb-1">
            Local da infração
          </label>
          <input
            id="location"
            formControlName="location"
            type="text"
            placeholder="Rua, avenida ou rodovia onde ocorreu"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Organ name -->
          <div>
            <label for="organName" class="block text-sm font-medium text-gray-700 mb-1">
              Órgão autuador
            </label>
            <input
              id="organName"
              formControlName="organName"
              type="text"
              placeholder="Ex: DETRAN-SP, PRF"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <!-- Notification date -->
          <div>
            <label for="notificationDate" class="block text-sm font-medium text-gray-700 mb-1">
              Data da notificação
            </label>
            <input
              id="notificationDate"
              formControlName="notificationDate"
              type="date"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        <!-- Speed fields (conditional, for speed infractions) -->
        @if (selectedInfraction()?.nature === 'gravissima' || selectedInfraction()?.nature === 'grave') {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="speedMeasured" class="block text-sm font-medium text-gray-700 mb-1">
                Velocidade aferida (km/h)
              </label>
              <input
                id="speedMeasured"
                formControlName="speedMeasured"
                type="text"
                placeholder="Ex: 85"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label for="speedLimit" class="block text-sm font-medium text-gray-700 mb-1">
                Velocidade permitida (km/h)
              </label>
              <input
                id="speedLimit"
                formControlName="speedLimit"
                type="text"
                placeholder="Ex: 60"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>
        }

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
export class StepInfractionComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly formService = inject(AppealFormService);

  private readonly destroy$ = new Subject<void>();
  private readonly searchTerm$ = new Subject<string>();

  readonly submitted = signal(false);
  readonly suggestions = signal<CtbInfraction[]>([]);
  readonly showSuggestions = signal(false);
  readonly isSearching = signal(false);
  readonly selectedInfraction = signal<CtbInfraction | null>(null);

  readonly form = this.fb.nonNullable.group({
    autoNumber: ['', [Validators.required]],
    infractionDate: ['', [Validators.required]],
    infractionTime: [''],
    infractionCode: ['', [Validators.required]],
    infractionDescription: [''],
    location: [''],
    organName: [''],
    notificationDate: [''],
    speedMeasured: [''],
    speedLimit: [''],
  });

  ngOnInit(): void {
    const state = this.formService.formState();
    this.form.patchValue({
      autoNumber: state.infraction.autoNumber,
      infractionDate: state.infraction.infractionDate,
      infractionTime: state.infraction.infractionTime,
      infractionCode: state.infraction.infractionCode,
      infractionDescription: state.infraction.infractionDescription,
      location: state.infraction.location,
      organName: state.infraction.organName,
      notificationDate: state.infraction.notificationDate,
      speedMeasured: state.infraction.speedMeasured,
      speedLimit: state.infraction.speedLimit,
    });

    this.form.valueChanges.subscribe(() => {
      this.syncToService();
    });

    this.setupCtbSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(): void {
    const value = this.form.controls.infractionCode.value;
    this.searchTerm$.next(value);
  }

  onSearchFocus(): void {
    if (this.suggestions().length > 0) {
      this.showSuggestions.set(true);
    }
  }

  onSearchBlur(): void {
    // Delay to allow mousedown on suggestion to fire
    setTimeout(() => this.showSuggestions.set(false), 200);
  }

  selectInfraction(item: CtbInfraction): void {
    this.selectedInfraction.set(item);
    this.form.controls.infractionCode.setValue(item.code);
    this.form.controls.infractionDescription.setValue(item.description);
    this.showSuggestions.set(false);
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
    return 'Campo inválido';
  }

  private syncToService(): void {
    const values = this.form.getRawValue();
    this.formService.updateInfraction(values);
  }

  private setupCtbSearch(): void {
    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((term) => term.length >= 2),
        takeUntil(this.destroy$),
        switchMap((term) => {
          this.isSearching.set(true);
          return this.http.get<CtbSearchResponse>(
            `${environment.apiUrl}${API_ROUTES.CTB.SEARCH}`,
            { params: { q: term, limit: '8' } },
          );
        }),
      )
      .subscribe({
        next: (response) => {
          this.suggestions.set(response.data);
          this.showSuggestions.set(response.data.length > 0);
          this.isSearching.set(false);
        },
        error: () => {
          this.suggestions.set([]);
          this.isSearching.set(false);
        },
      });
  }
}

import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AffiliateService } from '../../services/affiliate.service';
import { PIX_KEY_TYPE_LABELS, type PixKeyType } from '../../../../core/models/affiliate.model';

@Component({
  selector: 'app-affiliate-apply',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-lg mx-auto">
      <a
        routerLink="/affiliate"
        class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-4 transition-colors"
        aria-label="Voltar para o dashboard de afiliados"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Voltar
      </a>

      <h1 class="text-2xl font-bold text-gray-800 mb-2">Tornar-se Afiliado</h1>
      <p class="text-sm text-gray-500 mb-6">Indique amigos e ganhe comissão em cada recurso gerado pela Justifica.AI</p>

      <!-- Benefits -->
      <div class="bg-brand-50 border border-brand-100 rounded-xl p-5 mb-6">
        <h2 class="text-sm font-semibold text-brand-800 mb-3">Vantagens do Programa</h2>
        <ul class="space-y-2" role="list">
          @for (benefit of benefits; track benefit) {
            <li class="flex items-start gap-2 text-sm text-brand-700" role="listitem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                   class="text-accent-500 mt-0.5 shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {{ benefit }}
            </li>
          }
        </ul>
      </div>

      <!-- Application Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <h2 class="text-sm font-semibold text-gray-700">Dados para Cadastro</h2>

        <!-- PIX Key Type -->
        <div>
          <label for="pixKeyType" class="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Chave PIX <span class="text-red-500" aria-hidden="true">*</span>
            <span class="sr-only">(obrigatório)</span>
          </label>
          <select
            id="pixKeyType"
            formControlName="pixKeyType"
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            aria-describedby="pixKeyType-error"
          >
            <option value="" disabled>Selecione o tipo</option>
            @for (type of pixKeyTypes; track type.value) {
              <option [value]="type.value">{{ type.label }}</option>
            }
          </select>
          @if (form.controls.pixKeyType.touched && form.controls.pixKeyType.errors) {
            <p id="pixKeyType-error" class="text-xs text-red-500 mt-1" role="alert">Selecione o tipo de chave PIX.</p>
          }
        </div>

        <!-- PIX Key -->
        <div>
          <label for="pixKey" class="block text-sm font-medium text-gray-700 mb-1">
            Chave PIX <span class="text-red-500" aria-hidden="true">*</span>
            <span class="sr-only">(obrigatório)</span>
          </label>
          <input
            id="pixKey"
            type="text"
            formControlName="pixKey"
            placeholder="Informe sua chave PIX"
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            aria-describedby="pixKey-error"
          />
          @if (form.controls.pixKey.touched && form.controls.pixKey.errors) {
            <p id="pixKey-error" class="text-xs text-red-500 mt-1" role="alert">Informe sua chave PIX.</p>
          }
        </div>

        <!-- Promotion Method -->
        <div>
          <label for="promotionMethod" class="block text-sm font-medium text-gray-700 mb-1">
            Como pretende divulgar? <span class="text-red-500" aria-hidden="true">*</span>
            <span class="sr-only">(obrigatório)</span>
          </label>
          <textarea
            id="promotionMethod"
            formControlName="promotionMethod"
            rows="3"
            placeholder="Descreva como você pretende divulgar a Justifica.AI (redes sociais, blog, YouTube, etc.)"
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
            aria-describedby="promotionMethod-hint promotionMethod-error"
          ></textarea>
          <p id="promotionMethod-hint" class="text-xs text-gray-400 mt-1">
            {{ form.controls.promotionMethod.value.length }}/500 caracteres (mínimo 20)
          </p>
          @if (form.controls.promotionMethod.touched && form.controls.promotionMethod.errors) {
            <p id="promotionMethod-error" class="text-xs text-red-500 mt-1" role="alert">
              @if (form.controls.promotionMethod.errors['required']) {
                Descreva como pretende divulgar.
              } @else if (form.controls.promotionMethod.errors['minlength']) {
                Mínimo de 20 caracteres.
              } @else if (form.controls.promotionMethod.errors['maxlength']) {
                Máximo de 500 caracteres.
              }
            </p>
          }
        </div>

        <!-- Website (optional) -->
        <div>
          <label for="website" class="block text-sm font-medium text-gray-700 mb-1">
            Website ou Rede Social
            <span class="text-xs text-gray-400 ml-1">(opcional)</span>
          </label>
          <input
            id="website"
            type="url"
            formControlName="website"
            placeholder="https://www.exemplo.com"
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            aria-describedby="website-error"
          />
          @if (form.controls.website.touched && form.controls.website.errors) {
            <p id="website-error" class="text-xs text-red-500 mt-1" role="alert">Informe uma URL válida.</p>
          }
        </div>

        <!-- Submit -->
        <button
          type="submit"
          [disabled]="form.invalid || service.applyLoading()"
          class="w-full px-4 py-3 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ service.applyLoading() ? 'Enviando solicitação...' : 'Solicitar Cadastro de Afiliado' }}
        </button>

        <p class="text-xs text-gray-400 text-center">
          Ao se cadastrar, você concorda com os
          <a href="https://justifica.ai/termos" target="_blank" rel="noopener" class="text-brand-600 hover:underline">termos do programa de afiliados</a>.
        </p>
      </form>
    </div>
  `,
})
export class AffiliateApplyComponent {
  readonly service = inject(AffiliateService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly submitted = signal(false);

  readonly benefits = [
    'Comissão de 20% em cada recurso gerado pela sua indicação',
    'Link exclusivo para rastreamento de indicações',
    'Dashboard com métricas em tempo real',
    'Saque disponível via PIX a partir de R$ 50,00',
    'Sem limite de indicações',
  ];

  readonly pixKeyTypes: Array<{ value: PixKeyType; label: string }> = [
    { value: 'cpf', label: PIX_KEY_TYPE_LABELS.cpf },
    { value: 'email', label: PIX_KEY_TYPE_LABELS.email },
    { value: 'phone', label: PIX_KEY_TYPE_LABELS.phone },
    { value: 'random', label: PIX_KEY_TYPE_LABELS.random },
  ];

  readonly form = this.fb.nonNullable.group({
    pixKeyType: ['', [Validators.required]],
    pixKey: ['', [Validators.required]],
    promotionMethod: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
    website: [''],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { pixKeyType, pixKey, promotionMethod, website } = this.form.getRawValue();

    const result = await this.service.apply({
      pixKeyType: pixKeyType as PixKeyType,
      pixKey,
      promotionMethod,
      ...(website ? { website } : {}),
    });

    if (result) {
      this.submitted.set(true);
      this.router.navigate(['/affiliate']);
    }
  }
}

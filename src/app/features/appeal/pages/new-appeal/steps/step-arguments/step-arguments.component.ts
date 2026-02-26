import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AppealFormService } from '../../../../services/appeal-form.service';
import { UploadedFile } from '../../../../models/appeal-form.model';

interface DefenseReason {
  code: string;
  label: string;
  description: string;
}

const DEFENSE_REASONS: DefenseReason[] = [
  { code: 'D01', label: 'Sinalização ausente/irregular', description: 'Sinalização de trânsito ausente, apagada, ilegível ou irregular no local' },
  { code: 'D02', label: 'Equipamento sem aferição', description: 'Equipamento medidor sem aferição/calibração dentro da validade' },
  { code: 'D03', label: 'Erro de identificação', description: 'Erro na identificação do veículo, condutor ou local da infração' },
  { code: 'D04', label: 'Estado de necessidade', description: 'Condutor atuou por estado de necessidade (emergência médica, fuga de perigo)' },
  { code: 'D05', label: 'Vício formal no auto', description: 'Auto de infração com vícios formais, campos em branco ou dados incorretos' },
  { code: 'D06', label: 'Prazo prescrito', description: 'Notificação enviada fora do prazo legal (30 dias da autuação)' },
  { code: 'D07', label: 'Semáforo com defeito', description: 'Semáforo com defeito ou com tempo de amarelo insuficiente' },
  { code: 'D08', label: 'Via em obra/obstrução', description: 'Via em condições adversas, obras, obstrução que forçou a irregularidade' },
  { code: 'D09', label: 'Condutor não identificado', description: 'Penalidade aplicada ao proprietário sem identificação obrigatória do condutor' },
  { code: 'D10', label: 'Dupla penalidade', description: 'Mesma conduta penalizada mais de uma vez (bis in idem)' },
  { code: 'D11', label: 'Força maior', description: 'Evento de força maior ou caso fortuito que impediu cumprimento da norma' },
  { code: 'D12', label: 'Cerceamento de defesa', description: 'Falta de notificação prévia ou cerceamento do direito de defesa' },
];

@Component({
  selector: 'app-step-arguments',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-lg font-bold text-gray-800 mb-1">Argumentos de Defesa</h2>
        <p class="text-sm text-gray-500">
          Selecione os motivos da sua defesa e anexe evidências, se houver.
        </p>
      </div>

      <form [formGroup]="form" class="space-y-6" (ngSubmit)="onContinue()">
        <!-- Defense reason chips -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Motivos da defesa <span class="text-error-500">*</span>
            <span class="sr-only">(obrigatório, selecione ao menos um)</span>
          </label>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Motivos da defesa">
            @for (reason of defenseReasons; track reason.code) {
              <button
                type="button"
                [attr.aria-pressed]="isReasonSelected(reason.code)"
                (click)="toggleReason(reason.code)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
                [class.bg-brand-100]="isReasonSelected(reason.code)"
                [class.text-brand-700]="isReasonSelected(reason.code)"
                [class.border-brand-300]="isReasonSelected(reason.code)"
                [class.bg-white]="!isReasonSelected(reason.code)"
                [class.text-gray-600]="!isReasonSelected(reason.code)"
                [class.border-gray-300]="!isReasonSelected(reason.code)"
                [class.hover:bg-gray-50]="!isReasonSelected(reason.code)"
                [class.hover:border-brand-300]="!isReasonSelected(reason.code)"
                [title]="reason.description"
              >
                @if (isReasonSelected(reason.code)) {
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                }
                {{ reason.label }}
              </button>
            }
          </div>
          @if (submitted() && selectedReasons().length === 0) {
            <p class="mt-2 text-xs text-red-500" role="alert">
              Selecione ao menos um motivo de defesa
            </p>
          }
        </div>

        <!-- Additional details -->
        <div>
          <label for="additionalDetails" class="block text-sm font-medium text-gray-700 mb-1">
            Detalhes adicionais
          </label>
          <p class="text-xs text-gray-400 mb-2">
            Descreva circunstâncias relevantes que possam fortalecer seu recurso.
          </p>
          <textarea
            id="additionalDetails"
            formControlName="additionalDetails"
            rows="4"
            placeholder="Descreva detalhes adicionais sobre a situação..."
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
          ></textarea>
        </div>

        <!-- File upload area -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Evidências (fotos, vídeos, documentos)
          </label>
          <div
            class="border-2 border-dashed rounded-xl p-6 text-center transition-colors"
            [class.border-brand-400]="isDragging()"
            [class.bg-brand-50]="isDragging()"
            [class.border-gray-300]="!isDragging()"
            [class.bg-gray-50]="!isDragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p class="text-sm font-medium text-gray-600 mb-1">
              Arraste e solte arquivos aqui
            </p>
            <p class="text-xs text-gray-400 mb-3">
              ou
            </p>
            <label
              class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                class="sr-only"
                (change)="onFileSelect($event)"
                aria-label="Selecionar arquivos para upload"
              />
              Selecionar arquivos
            </label>
            <p class="text-xs text-gray-400 mt-2">
              JPG, PNG, PDF, DOC — Máx. 10MB por arquivo
            </p>
          </div>
        </div>

        <!-- Uploaded files list -->
        @if (uploadedFiles().length > 0) {
          <div class="space-y-2">
            @for (file of uploadedFiles(); track file.id) {
              <div class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                <!-- File icon -->
                <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  @if (file.type.startsWith('image/')) {
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  }
                </div>

                <!-- File info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-700 truncate">{{ file.name }}</p>
                  <p class="text-xs text-gray-400">{{ formatFileSize(file.size) }}</p>
                </div>

                <!-- Progress / Status -->
                @if (file.status === 'uploading') {
                  <div class="w-20">
                    <div class="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        class="bg-brand-600 h-1.5 rounded-full transition-all"
                        [style.width.%]="file.progress"
                      ></div>
                    </div>
                    <p class="text-xs text-gray-400 mt-0.5 text-right">{{ file.progress }}%</p>
                  </div>
                } @else if (file.status === 'done') {
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-accent-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                } @else if (file.status === 'error') {
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-error-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }

                <!-- Remove button -->
                <button
                  type="button"
                  (click)="removeFile(file.id)"
                  class="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-lg focus-visible:ring-2 focus-visible:ring-brand-500"
                  [attr.aria-label]="'Remover arquivo ' + file.name"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            }
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
            [disabled]="selectedReasons().length === 0"
          >
            Revisar recurso
          </button>
        </div>
      </form>
    </div>
  `,
})
export class StepArgumentsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly formService = inject(AppealFormService);

  readonly defenseReasons = DEFENSE_REASONS;
  readonly submitted = signal(false);
  readonly selectedReasons = signal<string[]>([]);
  readonly isDragging = signal(false);
  readonly uploadedFiles = signal<UploadedFile[]>([]);

  readonly form = this.fb.nonNullable.group({
    additionalDetails: [''],
  });

  ngOnInit(): void {
    const state = this.formService.formState();
    this.selectedReasons.set([...state.arguments.defenseReasons]);
    this.uploadedFiles.set([...state.uploadedFiles]);
    this.form.patchValue({
      additionalDetails: state.arguments.additionalDetails,
    });

    this.form.valueChanges.subscribe(() => {
      this.syncToService();
    });
  }

  isReasonSelected(code: string): boolean {
    return this.selectedReasons().includes(code);
  }

  toggleReason(code: string): void {
    const current = this.selectedReasons();
    if (current.includes(code)) {
      this.selectedReasons.set(current.filter((c) => c !== code));
    } else {
      this.selectedReasons.set([...current, code]);
    }
    this.syncToService();
  }

  // ─── Drag-and-drop ───

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = '';
    }
  }

  removeFile(fileId: string): void {
    this.uploadedFiles.update((files) => files.filter((f) => f.id !== fileId));
    this.formService.removeUploadedFile(fileId);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  onContinue(): void {
    this.submitted.set(true);

    if (this.selectedReasons().length === 0) return;

    this.syncToService();
    this.formService.nextStep();
  }

  onBack(): void {
    this.syncToService();
    this.formService.previousStep();
  }

  // ─── Private ───

  private handleFiles(files: File[]): void {
    const maxSize = 10_485_760; // 10 MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) continue;
      if (file.size > maxSize) continue;

      const uploadedFile: UploadedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'uploading',
      };

      this.uploadedFiles.update((current) => [...current, uploadedFile]);
      this.formService.addUploadedFile(uploadedFile);

      this.uploadFile(file, uploadedFile.id);
    }
  }

  private async uploadFile(file: File, fileId: string): Promise<void> {
    try {
      const result = await this.formService.requestUpload(file);
      if (result) {
        this.uploadedFiles.update((files) =>
          files.map((f) =>
            f.id === fileId
              ? { ...f, progress: 100, status: 'done' as const, r2Key: result.r2Key }
              : f,
          ),
        );
        this.formService.updateUploadedFile(fileId, {
          progress: 100,
          status: 'done',
          r2Key: result.r2Key,
        });
      } else {
        this.markUploadError(fileId);
      }
    } catch {
      this.markUploadError(fileId);
    }
  }

  private markUploadError(fileId: string): void {
    this.uploadedFiles.update((files) =>
      files.map((f) =>
        f.id === fileId ? { ...f, status: 'error' as const } : f,
      ),
    );
    this.formService.updateUploadedFile(fileId, { status: 'error' });
  }

  private syncToService(): void {
    const values = this.form.getRawValue();
    this.formService.updateArguments({
      defenseReasons: this.selectedReasons(),
      additionalDetails: values.additionalDetails,
    });
  }
}

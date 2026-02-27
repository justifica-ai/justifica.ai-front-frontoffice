export interface Appeal {
  id: string;
  userId: string;
  vehicleId: string;
  infractionCode: string;
  infractionDate: string;
  autoNumber: string;
  organId: string;
  organName: string;
  status: AppealStatus;
  documentUrl?: string;
  previewText?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppealStatus =
  | 'draft'
  | 'pending_payment'
  | 'generating'
  | 'generated'
  | 'failed'
  | 'expired';

// ─── Appeal List API Types (aligned with backend schema) ───

export type AppealListStatus =
  | 'draft'
  | 'generated'
  | 'awaiting_payment'
  | 'paid'
  | 'downloaded'
  | 'expired'
  | 'generation_failed';

export interface AppealListItem {
  id: string;
  status: AppealListStatus;
  appealType: string | null;
  createdAt: string;
  updatedAt: string;
  vehiclePlate: string | null;
  infractionCode: string | null;
  aitCode: string | null;
  infractionDate: string | null;
  infractionNature: string | null;
  organName: string | null;
  amountPaid: string | null;
}

export interface AppealListResponse {
  data: AppealListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AppealListQuery {
  status?: AppealListStatus;
  q?: string;
  page?: number;
  limit?: number;
}

// ─── Status Display Configuration ───

export interface StatusDisplayConfig {
  label: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
}

export const APPEAL_LIST_STATUS_CONFIG: Record<AppealListStatus, StatusDisplayConfig> = {
  draft: { label: 'Rascunho', bgClass: 'bg-gray-100', textClass: 'text-gray-700', dotClass: 'bg-gray-500' },
  generated: { label: 'Gerado', bgClass: 'bg-blue-100', textClass: 'text-blue-700', dotClass: 'bg-blue-500' },
  awaiting_payment: { label: 'Aguardando Pgto', bgClass: 'bg-amber-100', textClass: 'text-amber-700', dotClass: 'bg-amber-500' },
  paid: { label: 'Pago', bgClass: 'bg-green-100', textClass: 'text-green-700', dotClass: 'bg-green-500' },
  downloaded: { label: 'Concluído', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700', dotClass: 'bg-emerald-500' },
  expired: { label: 'Expirado', bgClass: 'bg-red-100', textClass: 'text-red-700', dotClass: 'bg-red-500' },
  generation_failed: { label: 'Falha', bgClass: 'bg-red-100', textClass: 'text-red-700', dotClass: 'bg-red-500' },
};

export interface StatusFilterTab {
  status: AppealListStatus | null;
  label: string;
}

export const APPEAL_STATUS_TABS: StatusFilterTab[] = [
  { status: null, label: 'Todos' },
  { status: 'draft', label: 'Rascunhos' },
  { status: 'awaiting_payment', label: 'Aguardando' },
  { status: 'generated', label: 'Gerados' },
  { status: 'paid', label: 'Pagos' },
  { status: 'downloaded', label: 'Concluídos' },
  { status: 'expired', label: 'Expirados' },
  { status: 'generation_failed', label: 'Falhas' },
];

export const APPEAL_TYPE_LABELS: Record<string, string> = {
  prior_defense: 'Defesa Prévia',
  first_instance: '1ª Instância',
  second_instance: '2ª Instância',
};

export const DRAFT_EXPIRATION_DAYS = 30;

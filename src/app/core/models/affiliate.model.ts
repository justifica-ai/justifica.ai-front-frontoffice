export type AffiliateStatus = 'pending' | 'active' | 'suspended' | 'blocked';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';
export type PixKeyType = 'cpf' | 'email' | 'phone' | 'random';

export const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
  cpf: 'CPF',
  email: 'E-mail',
  phone: 'Celular',
  random: 'Chave aleatória',
};

export const AFFILIATE_STATUS_LABELS: Record<AffiliateStatus, string> = {
  pending: 'Pendente',
  active: 'Ativo',
  suspended: 'Suspenso',
  blocked: 'Bloqueado',
};

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  rejected: 'Rejeitado',
};

export interface AffiliateInfo {
  id: string;
  code: string;
  status: AffiliateStatus;
  commissionRate: string;
  totalEarnings: string;
  pendingBalance: string;
  availableBalance: string;
  pixKey: string | null;
  activatedAt: string | null;
  createdAt: string;
}

export interface AffiliateMetrics {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalEarnings: string;
  pendingBalance: string;
  availableBalance: string;
}

export interface AffiliateConversion {
  id: string;
  commissionAmount: string;
  isPaid: boolean;
  createdAt: string;
}

export interface AffiliateDashboardResponse {
  affiliate: AffiliateInfo;
  metrics: AffiliateMetrics;
  recentConversions: AffiliateConversion[];
}

export interface AffiliateLinkResponse {
  code: string;
  link: string;
}

export interface AffiliateApplyInput {
  pixKeyType: PixKeyType;
  pixKey: string;
  promotionMethod: string;
  website?: string;
}

export interface AffiliateApplyResponse {
  id: string;
  code: string;
  status: AffiliateStatus;
  message: string;
}

export interface WithdrawalRequestInput {
  pixKey: string;
}

export interface WithdrawalRequestResponse {
  id: string;
  amount: string;
  pixKey: string;
  status: WithdrawalStatus;
  message: string;
}

export interface AffiliateWithdrawal {
  id: string;
  amount: string;
  pixKey: string;
  status: WithdrawalStatus;
  processedAt: string | null;
  createdAt: string;
}

export interface WithdrawalsListResponse {
  data: AffiliateWithdrawal[];
  pagination: Pagination;
}

export interface ConversionsListResponse {
  data: AffiliateConversion[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ConversionsListQuery {
  page?: number;
  limit?: number;
}

export interface WithdrawalsListQuery {
  page?: number;
  limit?: number;
}

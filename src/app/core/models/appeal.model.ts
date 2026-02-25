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

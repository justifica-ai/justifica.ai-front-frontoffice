export interface Transaction {
  id: string;
  userId: string;
  appealId: string;
  amount: number;
  discount: number;
  finalAmount: number;
  status: TransactionStatus;
  pixTxId?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  couponCode?: string;
  paidAt?: string;
  expiresAt: string;
  createdAt: string;
}

export type TransactionStatus =
  | 'pending'
  | 'paid'
  | 'expired'
  | 'refunded'
  | 'cancelled';

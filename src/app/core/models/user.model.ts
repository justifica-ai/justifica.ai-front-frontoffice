export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  cpfHash?: string;
  emailVerified: boolean;
  role: UserRole;
  affiliateCode?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'user' | 'affiliate' | 'admin' | 'super_admin';

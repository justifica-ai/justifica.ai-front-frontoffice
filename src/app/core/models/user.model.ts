export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  cpfHash?: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  role: UserRole;
  affiliateCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationPreferences {
  emailMarketing: boolean;
  whatsapp: boolean;
  sms: boolean;
}

export type UserRole = 'user' | 'affiliate' | 'admin' | 'super_admin';

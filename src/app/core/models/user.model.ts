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
  communicationPreferences?: CommunicationPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationPreferences {
  emailMarketing: boolean;
  whatsapp: boolean;
  sms: boolean;
}

export interface UserSession {
  id: string;
  device: string;
  ipMasked: string;
  lastAccessAt: string;
  isCurrent: boolean;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export type UserRole = 'user' | 'affiliate' | 'admin' | 'super_admin';

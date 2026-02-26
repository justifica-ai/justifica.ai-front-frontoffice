export const API_ROUTES = {
  AUTH: {
    PROFILE: '/auth/profile',
  },
  APPEALS: {
    BASE: '/appeals',
    BY_ID: (id: string) => `/appeals/${id}` as const,
    GENERATE: (id: string) => `/appeals/${id}/generate` as const,
    PREVIEW: (id: string) => `/appeals/${id}/preview` as const,
    PRICING: (id: string) => `/appeals/${id}/pricing` as const,
    UPLOAD: (id: string) => `/appeals/${id}/upload` as const,
    PAY: (id: string) => `/appeals/${id}/pay` as const,
    PAYMENT_STATUS: (id: string) => `/appeals/${id}/payment-status` as const,
    DOWNLOAD: (id: string) => `/appeals/${id}/document` as const,
  },
  VEHICLES: {
    BASE: '/vehicles',
    BY_ID: (id: string) => `/vehicles/${id}` as const,
  },
  PAYMENTS: {
    BASE: '/payments',
    BY_ID: (id: string) => `/payments/${id}` as const,
    WEBHOOK: '/payments/webhook',
  },
  PROFILE: {
    BASE: '/profile',
    CHANGE_PASSWORD: '/profile/change-password',
    DELETE_ACCOUNT: '/profile/delete-account',
    CONSENT: '/profile/consent',
  },
  AFFILIATES: {
    BASE: '/affiliates',
    APPLY: '/affiliates/apply',
    CONVERSIONS: '/affiliates/conversions',
    WITHDRAWALS: '/affiliates/withdrawals',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read` as const,
    MARK_ALL_READ: '/notifications/read-all',
  },
  CTB: {
    INFRACTIONS: '/ctb/infractions',
    SEARCH: '/ctb/infractions/search',
  },
} as const;

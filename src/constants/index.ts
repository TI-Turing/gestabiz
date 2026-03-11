/**
 * Application Constants
 * Centralized configuration values and magic numbers
 */

// App Configuration
export const APP_CONFIG = {
  NAME: 'Gestabiz',
  VERSION: '0.0.1',
  DESCRIPTION: 'Sistema de Gestión de Citas',
  DEFAULT_LOCALE: 'es',
  DEFAULT_THEME: 'dark',
  DEFAULT_TIMEZONE: 'Europe/Madrid'
} as const

// Business Settings
export const BUSINESS_CONFIG = {
  DEFAULT_APPOINTMENT_DURATION: 60, // minutes
  DEFAULT_BUFFER_TIME: 15, // minutes
  MAX_ADVANCE_BOOKING_DAYS: 365,
  MIN_ADVANCE_BOOKING_HOURS: 2,
  DEFAULT_CANCELLATION_HOURS: 24,
  MAX_LOCATIONS_PER_BUSINESS: 10,
  MAX_EMPLOYEES_PER_BUSINESS: 50,
  MAX_SERVICES_PER_BUSINESS: 100
} as const

// UI Constants
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 280,
  MOBILE_BREAKPOINT: 768,
  TOAST_DURATION: 4000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200
} as const

// Date & Time Formats
export const DATE_FORMATS = {
  SHORT: 'DD/MM/YYYY',
  LONG: 'dddd, DD [de] MMMM [de] YYYY',
  DATETIME: 'DD/MM/YYYY HH:mm',
  TIME: 'HH:mm'
} as const

// Notification Settings
export const NOTIFICATION_CONFIG = {
  REMINDER_TIMES: [
    { label: '1 día antes', hours: 24 },
    { label: '1 hora antes', hours: 1 },
    { label: '15 minutos antes', minutes: 15 }
  ],
  MAX_RETRIES: 3
} as const

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  BASE_URL: import.meta.env.VITE_SUPABASE_URL || ''
} as const

// File Upload Limits
export const FILE_CONFIG = {
  MAX_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword']
} as const

// Status Colors for UI
export const STATUS_COLORS = {
  scheduled: 'blue',
  in_progress: 'yellow',
  completed: 'green',
  cancelled: 'red',
  rescheduled: 'orange'
} as const

export const PRIORITY_COLORS = {
  high: 'red',
  medium: 'yellow',
  low: 'green'
} as const

// Role Colors
export const ROLE_COLORS = {
  admin: 'purple',
  employee: 'blue',
  client: 'green'
} as const

export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
] as const

// Regular Expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[\d\s-()]{8,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  TIME_24H: /^([01]?\d|2[0-3]):[0-5]\d$/,
  POSTAL_CODE: /^\d{5}(-\d{4})?$/
} as const

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Formato de teléfono inválido',
  INVALID_TIME: 'Formato de hora inválido (HH:MM)',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
  VALIDATION_ERROR: 'Error de validación',
  NETWORK_ERROR: 'Error de conexión'
} as const

export const SUCCESS_MESSAGES = {
  APPOINTMENT_CREATED: 'Cita creada exitosamente',
  APPOINTMENT_UPDATED: 'Cita actualizada exitosamente',
  APPOINTMENT_DELETED: 'Cita cancelada exitosamente',
  BUSINESS_CREATED: 'Negocio registrado exitosamente',
  PROFILE_UPDATED: 'Perfil actualizado exitosamente'
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_THEME: 'appointment-pro-theme',
  USER_LANGUAGE: 'appointment-pro-language',
  USER_PREFERENCES: 'appointment-pro-preferences'
} as const

// Feature Flags
export const FEATURES = {
  GOOGLE_CALENDAR_SYNC: true,
  WHATSAPP_INTEGRATION: true,
  REPORTS_ANALYTICS: true,
  EMPLOYEE_MANAGEMENT: true,
  ONLINE_PAYMENTS: false,
  MULTI_LOCATION: true
} as const

// Country calling codes (minimal curated list for UI selectors)
export const COUNTRY_CODES = [
  { code: '+52', country: 'MX', label: '🇲🇽 +52 (México)' },
  { code: '+57', country: 'CO', label: '🇨🇴 +57 (Colombia)' },
  { code: '+1', country: 'US', label: '🇺🇸 +1 (EE. UU./Canadá)' },
  { code: '+34', country: 'ES', label: '🇪🇸 +34 (España)' },
  { code: '+55', country: 'BR', label: '🇧🇷 +55 (Brasil)' },
  { code: '+54', country: 'AR', label: '🇦🇷 +54 (Argentina)' },
  { code: '+56', country: 'CL', label: '🇨🇱 +56 (Chile)' },
  { code: '+51', country: 'PE', label: '🇵🇪 +51 (Perú)' },
  { code: '+593', country: 'EC', label: '🇪🇨 +593 (Ecuador)' },
  { code: '+502', country: 'GT', label: '🇬🇹 +502 (Guatemala)' }
] as const

// Local phone examples (only local part, without prefix) per country prefix
export const COUNTRY_PHONE_EXAMPLES: Record<string, string> = {
  '+52': '55 1234 5678',      // MX
  '+57': '300 123 4567',      // CO (mobile)
  '+1': '(555) 123-4567',     // US/CA
  '+34': '612 34 56 78',      // ES (mobile)
  '+55': '11 91234-5678',     // BR (São Paulo mobile)
  '+54': '11 2345-6789',      // AR (Buenos Aires)
  '+56': '9 6123 4567',       // CL (mobile)
  '+51': '912 345 678',       // PE (mobile)
  '+593': '099 123 4567',     // EC (mobile)
  '+502': '5123 4567'         // GT
}

// Bogotá Constants (single source of truth)
export const BOGOTA_REGION_ID = 'fc6cc79b-dfd1-42c9-b35d-3d0df51c1c83'
export const BOGOTA_CITY_ID = 'c5861b80-bd05-48a9-9e24-d8c93e0d1d6b'
export const BOGOTA_CITY_NAME = 'Bogotá'

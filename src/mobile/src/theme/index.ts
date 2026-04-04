// Sistema de tema dual — Gestabiz Mobile
// Primario: #6820F7 (purple), Secundario: #4DB8D9 (cyan), Acento: #FF9800 (naranja)

// ─── Colores base compartidos ──────────────────────────────────────────────

const baseColors = {
  primary: '#6820F7',
  primaryDark: '#5010D5',
  primaryLight: '#8B4FFF',
  primaryForeground: '#FFFFFF',

  secondary: '#4DB8D9',
  secondaryDark: '#2E9CB8',
  secondaryForeground: '#FFFFFF',

  accent: '#FF9800',
  accentDark: '#E65100',
  accentForeground: '#FFFFFF',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  destructive: '#EF4444',

  // Estado de citas
  scheduled: '#6820F7',
  confirmed: '#10B981',
  cancelled: '#EF4444',
  completed: '#888888',
  pending: '#F59E0B',
  no_show: '#F97316',
}

// ─── Colores tema claro ────────────────────────────────────────────────────

export const lightColors = {
  ...baseColors,
  background: '#F5F5F7',
  foreground: '#1F1F1F',
  card: '#FFFFFF',
  cardBorder: '#E5E5EA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F2F2F7',
  text: '#1F1F1F',
  textSecondary: '#6B6B72',
  textMuted: '#AEAEB2',
  textInverse: '#FFFFFF',
  border: '#E5E5EA',
  inputBg: '#FFFFFF',
  inputBorder: '#C7C7CC',
  inputFocusBorder: '#6820F7',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E5EA',
  modalOverlay: 'rgba(0,0,0,0.5)',
  skeleton: '#E5E5EA',
  skeletonHighlight: '#F2F2F7',
  statusBar: 'dark' as 'light' | 'dark',
}

// ─── Colores tema oscuro ───────────────────────────────────────────────────

export const darkColors = {
  ...baseColors,
  background: '#0D0D0F',
  foreground: '#F0F0F2',
  card: '#1A1A1E',
  cardBorder: '#2A2A30',
  surface: '#111114',
  surfaceSecondary: '#1F1F24',
  text: '#F0F0F2',
  textSecondary: '#8A8A93',
  textMuted: '#5A5A62',
  textInverse: '#1F1F1F',
  border: '#2A2A30',
  inputBg: '#1F1F24',
  inputBorder: '#3A3A42',
  inputFocusBorder: '#8B4FFF',
  tabBar: '#111114',
  tabBarBorder: '#222228',
  modalOverlay: 'rgba(0,0,0,0.7)',
  skeleton: '#1A1A1E',
  skeletonHighlight: '#252528',
  statusBar: 'light' as 'light' | 'dark',
}

export type ThemeColors = typeof lightColors
export type ColorScheme = 'light' | 'dark'

export function getTheme(mode: ColorScheme): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors
}

// Retrocompatibilidad: exportar `colors` como dark (igual que antes)
export { darkColors as colors }

export const typography = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  // Semantic TextStyle shortcuts
  small: { fontSize: 12, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyBold: { fontSize: 16, fontWeight: '600' as const },
  h4: { fontSize: 20, fontWeight: '600' as const },
  h3: { fontSize: 24, fontWeight: '600' as const },
  h2: { fontSize: 30, fontWeight: '700' as const },
  h1: { fontSize: 36, fontWeight: '700' as const },
}

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  // Backward-compat named aliases
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 40,
} as const

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const

export const shadows = {
  none: {},
  sm: {
    shadowColor: '#6820F7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#6820F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#6820F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
} as const

// Sistema de tema dual — Gestabiz Mobile
//
// Tokens alineados 1:1 con la app web (`src/index.css`, oklch → hex).
// Primario: #6820F7 (purple), Secundario: #5BB8C4 (cyan), Acento: #5BB89B (teal).
//
// REGLA: cualquier color/radio/sombra que se agregue acá DEBE tener un
// equivalente en `src/index.css` del web (mantener paridad visual mobile↔web).
// Ref: plan feat/mobile-client-parity-2026-04, Fase 1.1.

// ─── Colores base compartidos ──────────────────────────────────────────────

const baseColors = {
  primary: '#6820F7',           // oklch(0.55 0.28 285)
  primaryDark: '#5010D5',
  primaryLight: '#8B4FFF',
  primaryForeground: '#FAFAFB', // oklch(0.98 0.003 270)

  secondary: '#5BB8C4',         // oklch(0.70 0.15 195) — cyan web
  secondaryDark: '#3C9AA8',
  secondaryForeground: '#FAFAFB',

  accent: '#5BB89B',            // oklch(0.70 0.22 180) — teal web (antes era naranja)
  accentDark: '#3C9A7E',
  accentForeground: '#1A1A22',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#D63B3B',             // oklch(0.65 0.25 15) — destructive web
  info: '#3B82F6',
  destructive: '#D63B3B',

  // Estado de citas (alineados con StatusBadge web)
  scheduled: '#6820F7',         // primary purple
  confirmed: '#10B981',
  cancelled: '#D63B3B',
  completed: '#888888',
  pending: '#F59E0B',
  no_show: '#F97316',
}

// ─── Colores tema claro (oklch web → hex) ──────────────────────────────────

export const lightColors = {
  ...baseColors,
  background: '#F4F4F6',          // oklch(0.96 0.005 270)
  foreground: '#1A1A22',          // oklch(0.12 0.02 270)
  card: '#F9F9FB',                // oklch(0.98 0.003 270)
  cardForeground: '#1A1A22',
  cardBorder: '#D2D2DA',
  popover: '#FFFFFF',
  popoverForeground: '#1A1A22',
  muted: '#E6E6EC',               // oklch(0.92 0.01 270)
  mutedForeground: '#5C5C68',     // oklch(0.40 0.02 270)
  surface: '#FFFFFF',
  surfaceSecondary: '#F4F4F6',
  text: '#1A1A22',
  textSecondary: '#5C5C68',
  textMuted: '#9D9DAA',
  textInverse: '#FAFAFB',
  border: '#D2D2DA',              // oklch(0.85 0.02 270)
  input: '#D2D2DA',
  ring: '#6820F7',
  destructiveForeground: '#FAFAFB',
  inputBg: '#FFFFFF',
  inputBorder: '#D2D2DA',
  inputFocusBorder: '#6820F7',
  tabBar: '#FFFFFF',
  tabBarBorder: '#D2D2DA',
  modalOverlay: 'rgba(0,0,0,0.5)',
  skeleton: '#E6E6EC',
  skeletonHighlight: '#F4F4F6',
  statusBar: 'dark' as 'light' | 'dark',
}

// ─── Colores tema oscuro (oklch web → hex) ─────────────────────────────────

export const darkColors = {
  ...baseColors,
  background: '#0E0E12',          // oklch(0.10 0.015 270)
  foreground: '#F2F2F4',          // oklch(0.95 0.005 270)
  card: '#161620',                // oklch(0.12 0.020 270)
  cardForeground: '#F2F2F4',
  cardBorder: '#2D2D38',
  popover: '#0F0F18',             // oklch(0.08 0.020 270)
  popoverForeground: '#F2F2F4',
  muted: '#21212A',               // oklch(0.16 0.02 270)
  mutedForeground: '#9D9DAA',     // oklch(0.65 0.01 270)
  surface: '#161620',
  surfaceSecondary: '#21212A',
  text: '#F2F2F4',
  textSecondary: '#9D9DAA',
  textMuted: '#6B6B78',
  textInverse: '#1A1A22',
  border: '#2D2D38',              // oklch(0.22 0.03 270)
  input: '#2D2D38',
  ring: '#A35EFF',                // oklch(0.65 0.30 320) — ring dark más rosado
  destructiveForeground: '#F2F2F4',
  inputBg: '#21212A',
  inputBorder: '#3A3A48',
  inputFocusBorder: '#A35EFF',
  tabBar: '#0F0F18',
  tabBarBorder: '#2D2D38',
  modalOverlay: 'rgba(0,0,0,0.7)',
  skeleton: '#1A1A22',
  skeletonHighlight: '#21212A',
  statusBar: 'light' as 'light' | 'dark',
}

export type ThemeColors = typeof lightColors
export type ColorScheme = 'light' | 'dark'

export function getTheme(mode: ColorScheme): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors
}

// Retrocompatibilidad: exportar `colors` como dark (igual que antes)
export { darkColors as colors }

// ─── Tipografía (Outfit — misma fuente que web) ────────────────────────────
// Web: text-xs (12), text-sm (14), text-base (16), text-lg (18), text-xl (20),
// text-2xl (24), text-3xl (30), text-4xl (36)

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
  // Semantic TextStyle shortcuts (paridad con headings web)
  small: { fontSize: 12, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyBold: { fontSize: 16, fontWeight: '600' as const },
  h4: { fontSize: 20, fontWeight: '600' as const },
  h3: { fontSize: 24, fontWeight: '600' as const },
  h2: { fontSize: 30, fontWeight: '700' as const },
  h1: { fontSize: 36, fontWeight: '700' as const },
}

// ─── Spacing (paridad con web Tailwind p-1=4, p-2=8, ..., p-16=64) ─────────

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

// ─── Radios (alineados con web --radius=0.25rem=4px base) ──────────────────
// Web: --radius-sm = 2px, --radius-md = 4px, --radius-lg = 6px, --radius-xl = 8px,
//      --radius-2xl = 12px, --radius-full = 9999px
//
// IMPORTANTE: cambio breaking — antes radius.md=8, ahora radius.md=4.
// Componentes que necesiten redondeo más grande deben pasar a `radius.lg` (6) o `radius.xl` (8).

export const radius = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 6,
  xl: 8,
  '2xl': 12,
  '3xl': 16,
  full: 9999,
} as const

// ─── Sombras (paridad con --shadow-color: oklch(0.55 0.28 285) @ 0.25) ─────

export const shadows = {
  none: {},
  sm: {
    shadowColor: '#6820F7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#6820F7',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6820F7',
    shadowOffset: { width: 2, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowColor: '#6820F7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
} as const

// ─── Familias de fuente (Outfit — misma que la web) ───────────────────────────
// Cargadas en App.tsx con useFonts de @expo-google-fonts/outfit.
// Usar estas constantes en los estilos; NUNCA hardcodear el nombre.

export const fonts = {
  regular: 'Outfit_Regular',
  medium: 'Outfit_Medium',
  semibold: 'Outfit_SemiBold',
  bold: 'Outfit_Bold',
} as const

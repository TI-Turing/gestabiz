/**
 * Colores centralizados para gráficos (Recharts)
 *
 * Estos colores son intencionales en charts — NO deben usar variables CSS
 * porque Recharts SVG no interpreta CSS vars en algunos contextos.
 * Se mantienen aquí para garantizar consistencia entre todos los charts.
 *
 * Referencia de paleta: Tailwind v3 colors
 */

/** Verde — ingresos, éxito, positivo */
export const COLOR_INCOME = '#10b981' // emerald-500
/** Rojo — egresos, error, negativo */
export const COLOR_EXPENSE = '#ef4444' // red-500
/** Azul — info, primario */
export const COLOR_PRIMARY = '#3b82f6' // blue-500
/** Índigo — secundario */
export const COLOR_SECONDARY = '#6366f1' // indigo-500
/** Ámbar — advertencia, pendiente */
export const COLOR_WARNING = '#f59e0b' // amber-500
/** Violeta — gráficos pie por defecto */
export const COLOR_DEFAULT = '#8884d8'
/** Cyan */
export const COLOR_CYAN = '#06b6d4'    // cyan-500
/** Turquesa */
export const COLOR_TEAL = '#14b8a6'    // teal-500
/** Púrpura */
export const COLOR_PURPLE = '#8b5cf6'  // violet-500
/** Naranja */
export const COLOR_ORANGE = '#f97316'  // orange-500
/** Rosa */
export const COLOR_PINK = '#ec4899'    // pink-500

/**
 * Paleta de colores para gráficos de series múltiples (ej. por empleado, categoría)
 * Orden optimizado para máxima distinción visual
 */
export const CHART_COLORS_SERIES = [
  COLOR_INCOME,
  COLOR_PRIMARY,
  COLOR_CYAN,
  COLOR_PURPLE,
  COLOR_TEAL,
  COLOR_SECONDARY,
  COLOR_WARNING,
  COLOR_ORANGE,
  COLOR_PINK,
  COLOR_EXPENSE,
] as const

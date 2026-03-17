/**
 * _shared/html.ts
 * Utilidades HTML compartidas entre Edge Functions
 */

/**
 * Escapa caracteres HTML especiales para prevenir XSS en emails y templates.
 * Reemplaza &, <, >, ", ' con sus equivalentes HTML seguros.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

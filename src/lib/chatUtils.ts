import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea la fecha del separador de mensajes en el chat.
 * - "Hoy" si es el día actual
 * - "Ayer" si es el día anterior
 * - "lunes, 12 de enero de 2025" para fechas anteriores
 */
export function formatChatDate(date: Date): string {
  if (isToday(date)) return 'Hoy';
  if (isYesterday(date)) return 'Ayer';
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

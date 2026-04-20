import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';
import { format } from 'date-fns';

/**
 * Normaliza un timestamp string para que sea interpretado como UTC por `new Date()`.
 * PostgreSQL al serializar timestamptz→JSONB puede emitir "2026-04-20 14:30:00"
 * sin offset, que JS interpreta como hora local en vez de UTC.
 * Esta función asegura que siempre termine en 'Z'.
 */
function ensureUTC(ts: string): string {
  if (!ts) return ts;
  // Si ya tiene timezone info (Z, +00, -05, etc.), no tocar
  if (/[Zz]$/.test(ts) || /[+-]\d{2}(:\d{2})?$/.test(ts)) return ts;
  // Reemplazar espacio entre fecha y hora con 'T' y añadir 'Z'
  return ts.replace(' ', 'T') + 'Z';
}

function normalizeAppointmentTimestamps<T extends { start_time: string; end_time: string }>(
  appointments: T[],
): T[] {
  return appointments.map(apt => ({
    ...apt,
    start_time: ensureUTC(apt.start_time),
    end_time: ensureUTC(apt.end_time),
  }));
}

interface LocationSchedule {
  opens_at: string;
  closes_at: string;
}

interface EmployeeSchedule {
  lunch_break_start: string | null;
  lunch_break_end: string | null;
  has_lunch_break: boolean;
}

interface WorkSchedule {
  day_of_week: number;
  is_working: boolean;
}

interface AppointmentData {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  employee_id?: string;
  resource_id?: string;
}

interface Absence {
  id: string;
  start_date: string;
  end_date: string;
  absence_type: string;
  status: string;
}

interface EmployeeTransfer {
  location_id: string;
  transfer_status: string;
  transfer_effective_date: string;
  transfer_to_location_id: string;
}

interface DateTimeSelectionData {
  location_schedule: LocationSchedule;
  employee_schedule: EmployeeSchedule | null;
  work_schedules: WorkSchedule[];
  day_appointments: AppointmentData[];
  client_day_appointments: AppointmentData[] | null;
  month_appointments: AppointmentData[];
  month_absences: Absence[] | null;
  employee_transfer: EmployeeTransfer | null;
}

/**
 * Hook para obtener todos los datos de DateTimeSelection con una sola RPC
 * Consolida 9 queries separadas en 1 JSON
 * 
 * Usa 2 query keys separadas:
 * - day data: cache 1 minuto (FREQUENT) — cambia cuando se confirma cita
 * - month data: cache 5 minutos (STABLE) — más estable
 * 
 * El RPC retorna data para ambos, pero React Query deduplicará si se llama en la misma sesión
 */
export function useWizardDateTimeData(
  employeeId: string | null | undefined,
  resourceId: string | null | undefined,
  businessId: string | null | undefined,
  locationId: string | null | undefined,
  selectedDate: Date | null | undefined,
  clientId: string | null | undefined,
) {
  const effectiveDate = selectedDate ?? new Date();
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const monthStr = format(effectiveDate, 'yyyy-MM');

  // Query for day-specific data (appointments for selected day)
  const dayQuery = useQuery({
    queryKey: QUERY_CONFIG.KEYS.WIZARD_DATETIME_DAY(
      employeeId || resourceId || '',
      employeeId ? 'employee' : 'resource',
      dateStr || '',
    ),
    queryFn: async () => {
      if (!businessId || !locationId || !dateStr) return null;

      const { data, error } = await supabase.rpc('get_datetime_selection_data', {
        p_employee_id: employeeId,
        p_resource_id: resourceId,
        p_business_id: businessId,
        p_location_id: locationId,
        p_selected_date: dateStr,
        p_client_id: clientId,
      }) as { data: DateTimeSelectionData | null; error: any };

      if (error) throw new Error(`RPC error: ${error.message}`);
      if (!data) return null;

      return data as DateTimeSelectionData;
    },
    enabled: !!businessId && !!locationId && !!dateStr && (!!employeeId || !!resourceId),
    ...QUERY_CONFIG.FREQUENT,
  });

  // Query for month-specific data (for calendar disabled dates)
  const monthQuery = useQuery({
    queryKey: QUERY_CONFIG.KEYS.WIZARD_DATETIME_MONTH(
      employeeId || resourceId || '',
      employeeId ? 'employee' : 'resource',
      monthStr || '',
    ),
    queryFn: async () => {
      if (!businessId || !locationId) return null;

      // Use first day of month as reference
      const firstDayOfMonth = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), 1);
      const monthDateStr = format(firstDayOfMonth, 'yyyy-MM-dd');

      const { data, error } = await supabase.rpc('get_datetime_selection_data', {
        p_employee_id: employeeId,
        p_resource_id: resourceId,
        p_business_id: businessId,
        p_location_id: locationId,
        p_selected_date: monthDateStr,
        p_client_id: null, // Not needed for month view
      }) as { data: DateTimeSelectionData | null; error: any };

      if (error) throw new Error(`RPC error: ${error.message}`);
      if (!data) return null;

      return data as DateTimeSelectionData;
    },
    enabled: !!businessId && !!locationId && (!!employeeId || !!resourceId),
    ...QUERY_CONFIG.STABLE,
  });

  // Merge both queries' data
  const dayData = dayQuery.data;
  const monthData = monthQuery.data;

  return {
    day: {
      locationSchedule: dayData?.location_schedule || null,
      employeeSchedule: dayData?.employee_schedule || null,
      workSchedules: dayData?.work_schedules || monthData?.work_schedules || [],
      dayAppointments: normalizeAppointmentTimestamps(dayData?.day_appointments || []),
      clientDayAppointments: normalizeAppointmentTimestamps(dayData?.client_day_appointments || []),
      employeeTransfer: dayData?.employee_transfer || null,
      isLoading: dayQuery.isLoading,
      error: dayQuery.error instanceof Error ? dayQuery.error.message : null,
    },
    month: {
      monthAppointments: normalizeAppointmentTimestamps(monthData?.month_appointments || []),
      monthAbsences: monthData?.month_absences || [],
      isLoading: monthQuery.isLoading,
      error: monthQuery.error instanceof Error ? monthQuery.error.message : null,
    },
    isLoading: dayQuery.isLoading || monthQuery.isLoading,
    error: dayQuery.error || monthQuery.error,
  };
}

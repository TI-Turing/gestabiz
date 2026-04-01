import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';
import { format } from 'date-fns';

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
  employeeId: string | null,
  resourceId: string | null,
  businessId: string | null,
  locationId: string | null,
  selectedDate: Date | null,
  clientId: string | null,
) {
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const monthStr = selectedDate ? format(selectedDate, 'yyyy-MM') : null;

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
      if (!businessId || !locationId || !monthStr) return null;

      // Use first day of month as reference
      const firstDayOfMonth = new Date(selectedDate?.getFullYear() || 2026, selectedDate?.getMonth() || 0, 1);
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
    enabled: !!businessId && !!locationId && !!monthStr && (!!employeeId || !!resourceId),
    ...QUERY_CONFIG.STABLE,
  });

  // Merge both queries' data
  const dayData = dayQuery.data;
  const monthData = monthQuery.data;

  return {
    day: {
      locationSchedule: dayData?.location_schedule || null,
      employeeSchedule: dayData?.employee_schedule || null,
      workSchedules: dayData?.work_schedules || [],
      dayAppointments: dayData?.day_appointments || [],
      clientDayAppointments: dayData?.client_day_appointments || [],
      employeeTransfer: dayData?.employee_transfer || null,
      isLoading: dayQuery.isLoading,
      error: dayQuery.error instanceof Error ? dayQuery.error.message : null,
    },
    month: {
      monthAppointments: monthData?.month_appointments || [],
      monthAbsences: monthData?.month_absences || [],
      isLoading: monthQuery.isLoading,
      error: monthQuery.error instanceof Error ? monthQuery.error.message : null,
    },
    isLoading: dayQuery.isLoading || monthQuery.isLoading,
    error: dayQuery.error || monthQuery.error,
  };
}

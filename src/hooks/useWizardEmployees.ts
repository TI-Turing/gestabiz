import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';
import type { WizardEmployee } from '@/components/appointments/wizard-types';

interface EmployeeDataFromRPC {
  employee_id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  role: string;
  expertise_level: number | null;
  setup_completed: boolean;
  supervisor_name: string | null;
  avg_rating: number;
  review_count: number;
}

interface WorkScheduleData {
  employee_id: string;
}

/**
 * Hook para obtener empleados del wizard con React Query
 * Usa RPC consolidada get_wizard_employees_data para reducir requests
 * Retorna empleados que ofrecen el servicio especificado en la ubicación
 * 
 * Cache: 5 minutos (STABLE) — empleados no cambian frecuentemente
 */
export function useWizardEmployees(
  businessId: string | null,
  serviceId: string | null,
  locationId?: string | null,
) {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_CONFIG.KEYS.WIZARD_EMPLOYEES(businessId || '', serviceId || '', locationId || ''),
    queryFn: async () => {
      if (!businessId || !serviceId) return [];

      const { data: employees, error: rpcError } = await supabase.rpc(
        'get_wizard_employees_data',
        {
          p_business_id: businessId,
          p_service_id: serviceId,
          p_location_id: locationId || null,
        },
      );

      if (rpcError) throw new Error(`RPC error: ${rpcError.message}`);
      if (!employees) return [];

      const rawEmployees = employees as EmployeeDataFromRPC[];
      if (rawEmployees.length === 0) return [];

      // Regla de negocio: sin horario configurado no puede recibir citas.
      // Se exige al menos un día laboral activo en work_schedules.
      const employeeIds = rawEmployees.map((e) => e.employee_id);
      const { data: schedules, error: schedulesError } = await supabase
        .from('work_schedules')
        .select('employee_id')
        .in('employee_id', employeeIds)
        .eq('is_working', true);

      if (schedulesError) {
        throw new Error(`Work schedules error: ${schedulesError.message}`);
      }

      const eligibleEmployeeIds = new Set(
        (schedules as WorkScheduleData[] | null)?.map((s) => s.employee_id) ?? [],
      );

      // Transform RPC response to WizardEmployee format
      return rawEmployees
        .filter((e) => eligibleEmployeeIds.has(e.employee_id))
        .map(e => ({
        id: e.employee_id,
        full_name: e.full_name,
        avatar_url: e.avatar_url,
        email: e.email,
        role: e.role,
        expertise_level: Number(e.expertise_level) || undefined,
        setup_completed: e.setup_completed,
        supervisor_name: e.supervisor_name,
        avg_rating: Number(e.avg_rating) || 0,
        total_reviews: Number(e.review_count) || 0,
      })) as WizardEmployee[];
    },
    enabled: !!businessId && !!serviceId,
    ...QUERY_CONFIG.STABLE,
  });

  return {
    employees: data || [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}

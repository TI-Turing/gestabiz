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
  expertise_level: string;
  setup_completed: boolean;
  supervisor_name: string | null;
  avg_rating: number;
  review_count: number;
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

      // Transform RPC response to WizardEmployee format
      return (employees as EmployeeDataFromRPC[]).map(e => ({
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

import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { QUERY_CONFIG } from '@/lib/queryConfig';
import type { Location, Service } from '@/types/types';

interface WizardDataCache {
  locations: Location[] | null;
  services: Service[] | null;
  loading: boolean;
  error: string | null;
}

async function fetchWizardBusinessData(
  businessId: string,
): Promise<{ locations: Location[]; services: Service[] }> {
  // Intentar RPC combinada primero
  const { data, error } = await supabase.rpc('get_wizard_business_data', {
    p_business_id: businessId,
  });

  if (!error && data) {
    const payload = data as any;
    const rawLocations = (payload.locations as unknown[] | null) || [];
    const rawServices = (payload.services as unknown[] | null) || [];

    const normalizedServices: Service[] = rawServices.map((s: any) => ({
      ...s,
      duration: s?.duration ?? s?.duration_minutes ?? 0,
    }));

    return {
      locations: rawLocations as Location[],
      services: normalizedServices,
    };
  }

  // Fallback: realizar dos consultas paralelas si la RPC no existe o falla
  const [locationsResult, servicesResult] = await Promise.all([
    supabase
      .from('locations')
      .select('id, name, address, city, opens_at, closes_at, is_active, latitude, longitude')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('services')
      .select('id, name, description, price, duration_minutes, category, image_url, is_active')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name'),
  ]);

  if (locationsResult.error) throw new Error(`Locations: ${locationsResult.error.message}`);
  if (servicesResult.error) throw new Error(`Services: ${servicesResult.error.message}`);

  const rawServices = (servicesResult.data as unknown[] | null) || [];
  const normalizedServices: Service[] = rawServices.map((s: any) => ({
    ...s,
    duration: s?.duration ?? s?.duration_minutes ?? 0,
  }));

  return {
    locations: (locationsResult.data as Location[]) || [],
    services: normalizedServices,
  };
}

/**
 * Hook para pre-cargar datos del wizard (sedes y servicios) con React Query
 * RPC-first con fallback a queries paralelas
 * Cache: 5 minutos (STABLE)
 */
export function useWizardDataCache(businessId: string | null): WizardDataCache {
  const {
    data: wizardData,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: QUERY_CONFIG.KEYS.WIZARD_DATA(businessId || ''),
    queryFn: () => fetchWizardBusinessData(businessId!),
    enabled: !!businessId,
    ...QUERY_CONFIG.STABLE,
  });

  if (!businessId || !wizardData) {
    return {
      locations: null,
      services: null,
      loading,
      error: queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null,
    };
  }

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Error al cargar datos'
    : null;

  if (error) {
    void logger.error(
      'useWizardDataCache: query error',
      new Error(error),
      { component: 'useWizardDataCache', businessId },
    );
  }

  return {
    locations: wizardData.locations,
    services: wizardData.services,
    loading,
    error,
  };
}

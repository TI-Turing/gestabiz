/**
 * useBusinessClosedDays
 *
 * Obtiene los días específicos cerrados de un negocio (y/o sede) para un mes/año.
 * Un día queda bloqueado si:
 *   1. Hay un registro con location_id = null (aplica a todo el negocio), o
 *   2. Hay un registro con location_id = locationId (aplica solo a esa sede).
 *
 * Cache: STABLE (5 min) — los días cerrados no cambian frecuentemente.
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { toast } from 'sonner';
import type { BusinessClosedDay } from '@/types/types';

export interface UseBusinessClosedDaysResult {
  closedDays: BusinessClosedDay[];
  loading: boolean;
  error: Error | null;
  /** Retorna true si dateStr (YYYY-MM-DD) es un día cerrado para locationId (o para todo el negocio) */
  isClosedDay: (dateStr: string, locationId?: string | null) => boolean;
  /** Devuelve la razón del cierre (si existe) */
  getClosedDayReason: (dateStr: string, locationId?: string | null) => string | null;
  addClosedDay: (params: {
    closedDate: string;
    locationId?: string | null;
    reason?: string;
    createdBy?: string;
  }) => Promise<void>;
  removeClosedDay: (id: string) => Promise<void>;
}

/**
 * @param businessId    ID del negocio
 * @param locationId    (opcional) ID de sede para filtrado local en isClosedDay
 * @param baseDate      (opcional) Mes de referencia — por defecto el mes actual.
 *                      Se cargan también el mes anterior y el siguiente para navegación fluida.
 */
export function useBusinessClosedDays(
  businessId: string | null | undefined,
  locationId?: string | null,
  baseDate?: Date,
): UseBusinessClosedDaysResult {
  const qc = useQueryClient();
  const ref = baseDate || new Date();
  const monthStr = format(ref, 'yyyy-MM');

  // Rango: mes anterior, actual y siguiente (3 meses) para que el calendario sea fluido
  const start = format(startOfMonth(addMonths(ref, -1)), 'yyyy-MM-dd');
  const end = format(endOfMonth(addMonths(ref, 1)), 'yyyy-MM-dd');

  const { data: closedDays = [], isLoading: loading, error } = useQuery({
    queryKey: QUERY_CONFIG.KEYS.BUSINESS_CLOSED_DAYS(businessId ?? '', monthStr),
    queryFn: async () => {
      if (!businessId) return [];

      const { data, error: qe } = await supabase
        .from('business_closed_days')
        .select('*')
        .eq('business_id', businessId)
        .gte('closed_date', start)
        .lte('closed_date', end)
        .order('closed_date', { ascending: true });

      if (qe) throw new Error(qe.message);
      return (data ?? []) as BusinessClosedDay[];
    },
    enabled: !!businessId,
    ...QUERY_CONFIG.STABLE,
  });

  const isClosedDay = useCallback(
    (dateStr: string, lid?: string | null): boolean => {
      const effectiveLocation = lid ?? locationId;
      return closedDays.some(
        (d) =>
          d.closed_date === dateStr &&
          (d.location_id === null || d.location_id === effectiveLocation),
      );
    },
    [closedDays, locationId],
  );

  const getClosedDayReason = useCallback(
    (dateStr: string, lid?: string | null): string | null => {
      const effectiveLocation = lid ?? locationId;
      // Preferir el registro específico de la sede sobre el del negocio completo
      const specific = closedDays.find(
        (d) => d.closed_date === dateStr && d.location_id === effectiveLocation,
      );
      if (specific) return specific.reason ?? 'Día cerrado';
      const general = closedDays.find(
        (d) => d.closed_date === dateStr && d.location_id === null,
      );
      return general?.reason ?? null;
    },
    [closedDays, locationId],
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['business-closed-days', businessId ?? ''] });
  };

  const addMutation = useMutation({
    mutationFn: async ({
      closedDate,
      locationId: lid,
      reason,
      createdBy,
    }: {
      closedDate: string;
      locationId?: string | null;
      reason?: string;
      createdBy?: string;
    }) => {
      const { error: ie } = await supabase.from('business_closed_days').insert({
        business_id: businessId,
        location_id: lid ?? null,
        closed_date: closedDate,
        reason: reason?.trim() || null,
        created_by: createdBy ?? null,
      });
      if (ie) throw new Error(ie.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success('Día cerrado agregado');
    },
    onError: (err: Error) => {
      if (err.message.includes('uq_business_closed_day')) {
        toast.error('Ese día ya está marcado como cerrado para esta sede');
      } else {
        toast.error('Error al agregar el día cerrado');
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: de } = await supabase
        .from('business_closed_days')
        .delete()
        .eq('id', id);
      if (de) throw new Error(de.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success('Día cerrado eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar el día cerrado');
    },
  });

  return {
    closedDays,
    loading,
    error: error instanceof Error ? error : null,
    isClosedDay,
    getClosedDayReason,
    addClosedDay: (params) => addMutation.mutateAsync(params),
    removeClosedDay: (id) => removeMutation.mutateAsync(id),
  };
}

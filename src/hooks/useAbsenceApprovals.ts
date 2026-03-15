/**
 * Hook: useAbsenceApprovals
 *
 * Gestiona aprobaciones de ausencias desde la perspectiva del administrador.
 *
 * Features:
 * - Ver solicitudes pendientes
 * - Aprobar/rechazar solicitudes
 * - Ver historial de todas las ausencias
 * - Ver citas afectadas antes de aprobar
 * - Estadísticas de ausencias
 *
 * @example
 * const { pendingAbsences, approveAbsence, rejectAbsence } = useAbsenceApprovals(businessId);
 * await approveAbsence(absenceId, 'Aprobado, buen descanso');
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { QUERY_CONFIG } from '@/lib/queryConfig';

export interface AbsenceApproval {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  absenceType: 'vacation' | 'emergency' | 'sick_leave' | 'personal' | 'other';
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  employeeNotes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  affectedAppointmentsCount?: number;
}

export interface AbsenceStats {
  totalAbsences: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  vacationDaysUsed: number;
  emergencyAbsences: number;
}

/** Calcula días entre dos fechas (inclusive) */
function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

async function fetchAbsencesData(businessId: string): Promise<{ absences: AbsenceApproval[]; stats: AbsenceStats }> {
  const { data, error } = await supabase
    .from('employee_absences')
    .select(`
      *,
      employee:employee_id(full_name, email)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return { absences: [], stats: { totalAbsences: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0, vacationDaysUsed: 0, emergencyAbsences: 0 } };

  // Promise.allSettled — si falla UNA query de conteo no se pierde todo el resultado
  const countResults = await Promise.allSettled(
    data.map(async (absence) => {
      if (absence.status !== 'pending') return 0;
      const { count } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', absence.employee_id)
        .eq('business_id', businessId)
        .gte('start_time', absence.start_date)
        .lte('start_time', absence.end_date)
        .neq('status', 'cancelled');
      return count ?? 0;
    }),
  );

  const absences: AbsenceApproval[] = data.map((absence, i) => ({
    id: absence.id,
    employeeId: absence.employee_id,
    employeeName: (absence.employee as { full_name: string } | null)?.full_name ?? '',
    employeeEmail: (absence.employee as { email: string } | null)?.email ?? '',
    absenceType: absence.absence_type as AbsenceApproval['absenceType'],
    startDate: absence.start_date,
    endDate: absence.end_date,
    daysRequested: daysBetween(absence.start_date, absence.end_date),
    reason: absence.reason ?? '',
    employeeNotes: absence.employee_notes ?? undefined,
    status: absence.status as AbsenceApproval['status'],
    createdAt: absence.created_at,
    affectedAppointmentsCount:
      countResults[i].status === 'fulfilled' ? countResults[i].value : 0,
  }));

  const stats: AbsenceStats = {
    totalAbsences: data.length,
    pendingCount: data.filter((a) => a.status === 'pending').length,
    approvedCount: data.filter((a) => a.status === 'approved').length,
    rejectedCount: data.filter((a) => a.status === 'rejected').length,
    vacationDaysUsed: data
      .filter((a) => a.absence_type === 'vacation' && a.status === 'approved')
      .reduce((sum, a) => sum + daysBetween(a.start_date, a.end_date), 0),
    emergencyAbsences: data.filter((a) => a.absence_type === 'emergency').length,
  };

  return { absences, stats };
}

export function useAbsenceApprovals(businessId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = QUERY_CONFIG.KEYS.ABSENCE_APPROVALS(businessId);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchAbsencesData(businessId),
    enabled: Boolean(user && businessId),
    ...QUERY_CONFIG.FREQUENT,
  });

  const absences = data?.absences ?? [];
  const stats = data?.stats ?? null;

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    [queryClient, queryKey],
  );

  // Aprobar ausencia
  const approveMutation = useMutation({
    mutationFn: async ({ absenceId, adminNotes }: { absenceId: string; adminNotes?: string }) => {
      const { data: result, error } = await supabase.functions.invoke('approve-reject-absence', {
        body: { absenceId, action: 'approve', adminNotes },
      });
      if (error) throw error;
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      toast.success(result.message ?? `${result.absence?.cancelledAppointments ?? 0} citas canceladas`);
      void invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Rechazar ausencia
  const rejectMutation = useMutation({
    mutationFn: async ({ absenceId, adminNotes }: { absenceId: string; adminNotes?: string }) => {
      const { data: result, error } = await supabase.functions.invoke('approve-reject-absence', {
        body: { absenceId, action: 'reject', adminNotes },
      });
      if (error) throw error;
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      toast.success(result.message ?? 'La solicitud ha sido rechazada');
      void invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Ver citas afectadas (consulta bajo demanda, no cacheada)
  const getAffectedAppointments = useCallback(
    async (absenceId: string) => {
      const absence = absences.find((a) => a.id === absenceId);
      if (!absence || !businessId) return [];

      try {
        const { data: apts, error } = await supabase
          .from('appointments')
          .select(`
            id, start_time, end_time,
            service:service_id(service_name),
            client:client_id(full_name, email)
          `)
          .eq('employee_id', absence.employeeId)
          .eq('business_id', businessId)
          .gte('start_time', absence.startDate)
          .lte('start_time', absence.endDate)
          .neq('status', 'cancelled');

        if (error) throw error;
        return apts ?? [];
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        toast.error(`No se pudieron cargar las citas: ${message}`);
        return [];
      }
    },
    [absences, businessId],
  );

  return {
    absences,
    pendingAbsences: absences.filter((a) => a.status === 'pending'),
    approvedAbsences: absences.filter((a) => a.status === 'approved'),
    rejectedAbsences: absences.filter((a) => a.status === 'rejected'),
    stats,
    loading: isLoading,
    approveAbsence: (absenceId: string, adminNotes?: string) =>
      approveMutation.mutateAsync({ absenceId, adminNotes }),
    rejectAbsence: (absenceId: string, adminNotes?: string) =>
      rejectMutation.mutateAsync({ absenceId, adminNotes }),
    getAffectedAppointments,
    refresh: invalidate,
  };
}

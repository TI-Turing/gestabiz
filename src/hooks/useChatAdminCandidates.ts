/**
 * useChatAdminCandidates Hook
 *
 * Devuelve los usuarios que pueden actuar como administradores de chat
 * en un negocio: aquellos con hierarchy_level <= 1 (Owner=0, Admin=1)
 * en la tabla business_roles.
 *
 * @version 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ChatAdminCandidate {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  hierarchy_level: number;
  role_label: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleLabel(level: number): string {
  if (level === 0) return 'Propietario';
  if (level === 1) return 'Administrador';
  return 'Gerente';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChatAdminCandidates(businessId: string) {
  return useQuery<ChatAdminCandidate[]>({
    queryKey: ['chat-admin-candidates', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_roles')
        .select(
          `
          user_id,
          hierarchy_level,
          profiles:user_id (
            full_name,
            email,
            avatar_url
          )
        `
        )
        .eq('business_id', businessId)
        .lte('hierarchy_level', 1)
        .eq('is_active', true)
        .order('hierarchy_level');

      if (error) throw error;

      return (data ?? []).map((row) => {
        const profile = Array.isArray(row.profiles)
          ? row.profiles[0]
          : row.profiles;
        return {
          user_id: row.user_id,
          full_name: profile?.full_name ?? 'Sin nombre',
          email: profile?.email ?? '',
          avatar_url: profile?.avatar_url ?? null,
          hierarchy_level: row.hierarchy_level,
          role_label: getRoleLabel(row.hierarchy_level),
        };
      });
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });
}

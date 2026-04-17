/**
 * useBusinessChatConfig Hook
 *
 * Lee y actualiza la configuración de chat de un negocio:
 *   - allow_professional_chat (businesses): toggle global
 *   - chat_admin_id por sede (locations): admin designado de chat
 *
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LocationChatAdminProfile {
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export interface LocationChatConfig {
  location_id: string;
  location_name: string;
  chat_admin_id: string | null;
  chat_admin_profile: LocationChatAdminProfile | null;
}

export interface BusinessChatConfig {
  allow_professional_chat: boolean;
  locations: LocationChatConfig[];
}

// ─── Query key ────────────────────────────────────────────────────────────────

const chatConfigKey = (businessId: string) => ['business-chat-config', businessId];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBusinessChatConfig(businessId: string) {
  const queryClient = useQueryClient();

  // ── Leer configuración ──────────────────────────────────────────────────────
  const { data, isLoading, error } = useQuery<BusinessChatConfig>({
    queryKey: chatConfigKey(businessId),
    queryFn: async () => {
      const [businessRes, locationsRes] = await Promise.all([
        supabase
          .from('businesses')
          .select('allow_professional_chat')
          .eq('id', businessId)
          .single(),
        supabase
          .from('locations')
          .select(
            'id, name, chat_admin_id, chat_admin_profile:profiles!locations_chat_admin_id_fkey(full_name, email, avatar_url)'
          )
          .eq('business_id', businessId)
          .eq('is_active', true)
          .order('name'),
      ]);

      if (businessRes.error) throw businessRes.error;
      if (locationsRes.error) throw locationsRes.error;

      return {
        allow_professional_chat: businessRes.data?.allow_professional_chat ?? true,
        locations: (locationsRes.data ?? []).map((loc) => {
          const profile = Array.isArray(loc.chat_admin_profile)
            ? loc.chat_admin_profile[0] ?? null
            : (loc.chat_admin_profile as LocationChatAdminProfile | null);
          return {
            location_id: loc.id,
            location_name: loc.name,
            chat_admin_id: loc.chat_admin_id ?? null,
            chat_admin_profile: profile
              ? { full_name: profile.full_name, email: profile.email, avatar_url: profile.avatar_url }
              : null,
          };
        }),
      };
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Actualizar toggle global ─────────────────────────────────────────────────
  const updateProfessionalChat = useMutation({
    mutationFn: async (allow: boolean) => {
      const { error } = await supabase
        .from('businesses')
        .update({ allow_professional_chat: allow, updated_at: new Date().toISOString() })
        .eq('id', businessId);
      if (error) throw error;
    },
    onSuccess: (_, allow) => {
      queryClient.invalidateQueries({ queryKey: chatConfigKey(businessId) });
      toast.success(
        allow
          ? 'Clientes pueden chatear con profesionales'
          : 'Chat con profesionales desactivado'
      );
    },
    onError: () => toast.error('No se pudo actualizar la configuración de chat'),
  });

  // ── Actualizar admin de chat por sede ────────────────────────────────────────
  const updateLocationChatAdmin = useMutation({
    mutationFn: async ({
      locationId,
      adminId,
    }: {
      locationId: string;
      adminId: string | null;
    }) => {
      const { error } = await supabase
        .from('locations')
        .update({ chat_admin_id: adminId })
        .eq('id', locationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatConfigKey(businessId) });
      toast.success('Admin de chat actualizado');
    },
    onError: () => toast.error('No se pudo asignar el admin de chat'),
  });

  return {
    config: data ?? { allow_professional_chat: true, locations: [] },
    isLoading,
    error: error?.message ?? null,
    updateProfessionalChat: updateProfessionalChat.mutate,
    isPendingProfessionalChat: updateProfessionalChat.isPending,
    updateLocationChatAdmin: updateLocationChatAdmin.mutate,
    isPendingLocationAdmin: updateLocationChatAdmin.isPending,
  };
}

/**
 * RPC: get_conversations_with_participants
 *
 * Elimina el patrón N+1 en useChat.ts fetchConversations.
 * Antes: 1 query base + N queries (una por conversación directa) + 1 query de últimos senders.
 * Ahora: 1 sola query con LATERAL JOINs.
 *
 * Retorna por cada conversación:
 *   - Todos los campos de chat_conversations
 *   - Metadatos del participante (unread_count, is_pinned, is_muted)
 *   - other_user (para conversaciones directas): id, full_name, email, avatar_url
 *   - last_message_sender_id: sender del mensaje más reciente
 */

CREATE OR REPLACE FUNCTION get_conversations_with_participants(p_user_id UUID)
RETURNS TABLE (
  -- Campos de la conversación
  id                      UUID,
  type                    TEXT,
  title                   TEXT,
  created_by              UUID,
  business_id             UUID,
  last_message_at         TIMESTAMPTZ,
  last_message_preview    TEXT,
  created_at              TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ,
  is_archived             BOOLEAN,
  metadata                JSONB,
  -- Metadatos del participante actual
  unread_count            INT,
  is_pinned               BOOLEAN,
  is_muted                BOOLEAN,
  -- Otro usuario (solo para conversaciones directas)
  other_user_id           UUID,
  other_user_full_name    TEXT,
  other_user_email        TEXT,
  other_user_avatar_url   TEXT,
  -- Sender del último mensaje
  last_message_sender_id  UUID
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    c.id,
    c.type::TEXT,
    c.title,
    c.created_by,
    c.business_id,
    c.last_message_at,
    c.last_message_preview,
    c.created_at,
    c.updated_at,
    c.is_archived,
    c.metadata,
    my_p.unread_count,
    my_p.is_pinned,
    my_p.is_muted,
    -- Perfil del otro participante (solo en directas)
    other_p.user_id         AS other_user_id,
    prof.full_name          AS other_user_full_name,
    prof.email              AS other_user_email,
    prof.avatar_url         AS other_user_avatar_url,
    -- Sender del mensaje más reciente
    lm.sender_id            AS last_message_sender_id
  FROM chat_participants my_p
  JOIN chat_conversations c ON c.id = my_p.conversation_id
  -- Otro participante en conversaciones directas (LATERAL para evitar producto cartesiano)
  LEFT JOIN LATERAL (
    SELECT cp.user_id
    FROM chat_participants cp
    WHERE cp.conversation_id = c.id
      AND cp.user_id != p_user_id
      AND cp.left_at IS NULL
    LIMIT 1
  ) other_p ON c.type = 'direct'
  -- Perfil del otro usuario
  LEFT JOIN profiles prof ON prof.id = other_p.user_id
  -- Último mensaje no eliminado (LATERAL para eficiencia con índice)
  LEFT JOIN LATERAL (
    SELECT m.sender_id
    FROM chat_messages m
    WHERE m.conversation_id = c.id
      AND m.deleted_at IS NULL
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON TRUE
  WHERE my_p.user_id = p_user_id
    AND my_p.left_at IS NULL
  ORDER BY c.last_message_at DESC NULLS LAST;
$$;

-- Asegurar que solo usuarios autenticados puedan llamar la función
REVOKE ALL ON FUNCTION get_conversations_with_participants(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_conversations_with_participants(UUID) TO authenticated;

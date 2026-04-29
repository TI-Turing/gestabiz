-- RLS policies para el bucket chat-attachments
-- Usa SECURITY DEFINER para evitar recursión infinita:
-- storage.objects policy → conversation_members → conversation_members policy → loop

DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload attachments to their conversations" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;
DROP POLICY IF EXISTS chat_attachments_select ON storage.objects;
DROP POLICY IF EXISTS chat_attachments_insert ON storage.objects;
DROP POLICY IF EXISTS chat_attachments_update ON storage.objects;
DROP POLICY IF EXISTS chat_attachments_delete ON storage.objects;

-- Helper SECURITY DEFINER: bypasea RLS para evitar recursión infinita.
-- Verifica ambos schemas: conversation_members (FASE 2) y chat_participants (FASE 1 legacy)
-- para que el storage funcione mientras el frontend migra al nuevo schema.
CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id AND left_at IS NULL
  );
$$;

-- SELECT: participantes de la conversación pueden ver archivos
CREATE POLICY chat_attachments_select ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND public.is_conversation_member(path_tokens[1]::uuid, auth.uid())
);

-- INSERT: participantes pueden subir archivos a sus conversaciones
CREATE POLICY chat_attachments_insert ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND public.is_conversation_member(path_tokens[1]::uuid, auth.uid())
);

-- UPDATE y DELETE: solo el dueño del objeto (owner_id es text en storage.objects)
CREATE POLICY chat_attachments_update ON storage.objects FOR UPDATE
USING (bucket_id = 'chat-attachments' AND owner_id = auth.uid()::text);

CREATE POLICY chat_attachments_delete ON storage.objects FOR DELETE
USING (bucket_id = 'chat-attachments' AND owner_id = auth.uid()::text);

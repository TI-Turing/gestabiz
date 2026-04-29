-- RLS policies para el bucket chat-attachments
-- Usan path_tokens (columna generada en storage.objects) y conversation_members (esquema FASE 2)

DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload attachments to their conversations" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;
DROP POLICY IF EXISTS chat_attachments_select ON storage.objects;
DROP POLICY IF EXISTS chat_attachments_insert ON storage.objects;
DROP POLICY IF EXISTS chat_attachments_update ON storage.objects;
DROP POLICY IF EXISTS chat_attachments_delete ON storage.objects;

-- SELECT: participantes de la conversación pueden ver archivos
CREATE POLICY chat_attachments_select ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.user_id = auth.uid()
      AND cm.conversation_id::text = path_tokens[1]
  )
);

-- INSERT: participantes pueden subir archivos a sus conversaciones
CREATE POLICY chat_attachments_insert ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.user_id = auth.uid()
      AND cm.conversation_id::text = path_tokens[1]
  )
);

-- UPDATE y DELETE: solo el dueño del objeto
CREATE POLICY chat_attachments_update ON storage.objects FOR UPDATE
USING (bucket_id = 'chat-attachments' AND owner_id = auth.uid()::text);

CREATE POLICY chat_attachments_delete ON storage.objects FOR DELETE
USING (bucket_id = 'chat-attachments' AND owner_id = auth.uid()::text);

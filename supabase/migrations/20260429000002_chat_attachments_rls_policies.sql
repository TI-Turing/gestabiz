-- RLS policies para el bucket chat-attachments
-- Usan conversation_members (esquema FASE 2) en lugar de chat_participants

-- SELECT: participantes de la conversación pueden ver los archivos
CREATE POLICY "chat_attachments_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    WHERE cm.user_id = auth.uid()
      AND cm.conversation_id::text = (storage.foldername(name))[1]
  )
);

-- INSERT: participantes pueden subir archivos a sus conversaciones
CREATE POLICY "chat_attachments_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    WHERE cm.user_id = auth.uid()
      AND cm.conversation_id::text = (storage.foldername(name))[1]
  )
);

-- UPDATE y DELETE: solo el dueño del archivo
CREATE POLICY "chat_attachments_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
);

CREATE POLICY "chat_attachments_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
);

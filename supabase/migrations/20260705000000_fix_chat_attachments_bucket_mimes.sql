-- =====================================================
-- MIGRACIÓN: Fix MIME types del bucket chat-attachments
-- Fecha: 2026-07-05
-- Descripción:
--   Crea el bucket chat-attachments con soporte de audio/video
--   si no existe, o actualiza sus MIME types si ya existe.
--   Corrige el error 415 "mime type audio/webm is not supported"
--   al enviar mensajes de voz desde el chat.
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  52428800,  -- 50 MB
  ARRAY[
    -- Imágenes
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    -- Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed',
    -- Audio (mensajes de voz)
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    -- Video
    'video/mp4',
    'video/webm',
    'video/ogg'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit    = EXCLUDED.file_size_limit;

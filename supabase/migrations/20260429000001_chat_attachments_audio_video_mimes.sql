-- Agrega tipos MIME de audio y video al bucket chat-attachments
-- Necesario para notas de voz (audio/webm, audio/ogg, audio/mp4) y adjuntos de video

UPDATE storage.buckets
SET allowed_mime_types = array_cat(
  allowed_mime_types,
  ARRAY[
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/webm',
    'video/ogg'
  ]
)
WHERE id = 'chat-attachments'
  AND NOT (allowed_mime_types @> ARRAY['audio/webm']);

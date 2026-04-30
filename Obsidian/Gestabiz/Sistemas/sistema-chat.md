---
date: 2026-04-28
tags: [sistema, chat, mensajeria, realtime, webrtc, audio, emoji, produccion]
status: completado
---

# Sistema de Chat en Tiempo Real — v2 (Rediseño)

Chat moderno con llamadas de voz P2P, audios, emojis, multimedia comprimida, modelo de identidad por relación y semáforo de presencia.

## Descripción

Chat en tiempo real usando Supabase Realtime. Rediseñado en Abr 2026 para añadir modelo de relación explícito (client_business / business_collaborator / support), llamadas WebRTC P2P, mensajes de audio, emojis, compresión de imágenes, vault de marketing y presencia con horario laboral.

## Flujo Principal (v2)

1. Cliente o empleado abre chat desde `FloatingChatButton` o `ChatWithAdminModal`
2. Se crea/recupera la conversación con `relationship_type` correcto — el UNIQUE index evita duplicados
3. `ConversationList` agrupa por relación: "Como cliente" / "Mis negocios" / "Equipo" / "Soporte"
4. `ChatHeader` muestra avatar e identidad según `relationship_type` y quién está mirando
5. Mensajes en tiempo real; se puede enviar texto, imágenes (comprimidas), audio (hold-to-record), emojis y material del vault de marketing
6. Indicador de presencia 🟢🟡⚫ sobre avatares según `user_presence` + `employee_work_schedule`
7. Llamadas de voz P2P: signaling vía Supabase Realtime broadcast → `CallModal` full-screen

## Modelo de Relación

| `relationship_type` | `client_id` | `counterpart_user_id` | Header cliente | Header empleado/admin |
|---|---|---|---|---|
| `client_business` | cliente | admin/empleado | Logo negocio + nombre (± profesional) | Avatar cliente / "Cliente" |
| `business_collaborator` | null | cualquiera | Avatar contraparte | Avatar contraparte / "Profesional" o "Colaborador" |
| `support` | null | bot | Ícono robot / "Soporte Gestabiz" | — |
| `null` (legacy) | — | — | Nombre other_user (comportamiento anterior) | — |

UNIQUE index `uniq_chat_relationship` en `(business_id, relationship_type, LEAST(client_id, counterpart_user_id), GREATEST(...))` garantiza exactamente 1 chat por relación.

## Componentes Clave

| Componente | Función |
|-----------|---------|
| `ChatLayout` | Layout principal del chat |
| `ChatWindow` | Ventana de conversación + WebRTC + presencia |
| `ChatHeader` | Header inteligente por relationship_type con PresenceDot |
| `ChatInput` | Input con emoji, audio, adjuntos, vault de marketing |
| `ConversationList` | Lista agrupada por relación con PresenceDot por conversación |
| `PresenceDot` | Indicador 🟢🟡⚫ según presence + horario laboral |
| `AudioRecorder` | Hold-to-record con timer y waveform en vivo |
| `AudioMessage` | Reproductor de audio con barras de waveform clickeables |
| `EmojiPicker` | Selector de emojis lazy-loaded (emoji-picker-react) |
| `MediaPreview` | Vista previa de imagen/video antes de enviar |
| `MarketingVaultPicker` | Selector de archivos del bucket business-marketing-vault |
| `CallModal` | Modal de llamada full-screen con estados ringing/in-call/ended |
| `MessageBubble` | Burbuja con render por tipo: texto, audio, video, call_log, imagen |
| `FloatingChatButton` | Botón flotante para abrir chat |
| `ChatWithAdminModal` | Modal de selección de empleado |

## Tablas de Base de Datos

- `conversations` — +3 columnas: `relationship_type`, `client_id`, `counterpart_user_id`
- `messages` — +3 columnas: `duration_seconds`, `waveform JSONB`; tipos extendidos a `audio|video|call_log`
- `user_presence` — (user_id PK, status online/offline, last_seen_at)
- `employee_work_schedule` — (business_id, employee_id, day_of_week 0-6, start_time, end_time, is_active)
- `call_sessions` — Ciclo de vida de llamadas P2P (status: ringing/answered/rejected/missed/ended/failed)
- `businesses.allow_chat_with_professionals` — Toggle del negocio para mostrar nombre del profesional

## Migraciones SQL (7)

1. `20260428000001_chat_relationship_model.sql` — ALTER conversations + UNIQUE index + backfill
2. `20260428000002_chat_message_types.sql` — Nuevos tipos message + duration_seconds + waveform
3. `20260428000003_employee_work_schedule.sql` — Nueva tabla + RLS
4. `20260428000004_user_presence.sql` — Nueva tabla + RLS
5. `20260428000005_call_sessions.sql` — Nueva tabla + RLS
6. `20260428000006_marketing_vault_bucket.sql` — Bucket business-marketing-vault (private, 50MB)
7. `20260428000007_business_chat_settings.sql` — allow_chat_with_professionals en businesses

## Edge Functions

- `send-message` — Envío (extendido: acepta audio/video/call_log, duration_seconds, waveform)
- `start-call` — Inserta call_session, broadcast incoming_call al callee
- `end-call` — Cierra call_session con duración, inserta mensaje call_log
- `send-unread-chat-emails` — Notificación de mensajes no leídos (sin cambios)

## Storage Buckets

- `chat-attachments` (private) — Imágenes, videos, archivos del chat
- `business-marketing-vault` (private, 50MB) — Material de marketing del negocio; estructura `{business_id}/{carpeta}/{archivo}`

## Hooks

| Hook | Función |
|------|---------|
| `useChat(conversationId)` | Chat en una conversación |
| `useMessages(conversationId)` | Mensajes de una conversación |
| `useConversations(userId)` | Todas las conversaciones (con campos de relación) |
| `useUserPresence(userIds[])` | Presencia de múltiples usuarios + cálculo semáforo |
| `useEmployeeWorkSchedule(employeeId, businessId)` | CRUD de horario laboral |
| `useAudioRecorder()` | MediaRecorder con waveform 40 puntos |
| `useImageCompression()` | browser-image-compression: 1280px / 0.7 / max 1MB |
| `useWebRTCCall(currentUserId)` | Ciclo de llamada P2P (WebRTC + Supabase signaling) |
| `useMarketingVault(businessId)` | Lista carpetas/archivos del bucket vault |
| `useBusinessEmployeesForChat(businessId)` | Empleados con allow_client_messages = true |

## Semáforo de Presencia

- 🟢 **online**: `user_presence.status = 'online'`
- 🟡 **away**: offline + hora actual dentro de `employee_work_schedule` del usuario para hoy
- ⚫ **offline**: offline + fuera de horario o sin horario configurado

Actualización de presencia: Supabase Realtime Presence (heartbeat 30s + onbeforeunload). La tabla `user_presence` guarda el histórico para cron.

## Llamadas WebRTC P2P

- STUN servers: Google public (`stun:stun.l.google.com:19302`)
- Signaling: Supabase Realtime broadcast en canal `call:{callId}` (SDP/ICE no persistido)
- Persistencia: `call_sessions` con timestamps + inserción de `call_log` al terminar
- Limitación conocida v1: puede fallar con NAT estricto. TURN server en roadmap.

## Dependencias Nuevas

```json
"browser-image-compression": "^2.x",
"emoji-picker-react": "^4.x"
```

## Archivos Clave (rama feature/chat-redesign)

- `src/components/chat/` — 8 nuevos componentes + 5 modificados
- `src/hooks/useUserPresence.ts`, `useWebRTCCall.ts`, `useAudioRecorder.ts`, `useImageCompression.ts`, `useMarketingVault.ts`, `useEmployeeWorkSchedule.ts`
- `src/components/settings/EmployeeWorkScheduleEditor.tsx` — Editor horario en Settings
- `supabase/migrations/20260428000001-7` — 7 migraciones
- `supabase/functions/start-call/`, `supabase/functions/end-call/`

## Integración con Marketing Vault

El bucket `business-marketing-vault` está accesible desde el chat mediante `MarketingVaultPicker`:

- Al adjuntar desde vault, `ChatInput.handleVaultSelect` genera signed URL TTL **7 días** (no 1h) para garantizar que el destinatario pueda ver el archivo durante la conversación.
- Hook `useMarketingVault` ya usa `createSignedUrls` en batch (TTL 1h para thumbnails).
- Los archivos `.keep` (marcadores de carpetas vacías) son filtrados antes de mostrarlos.
- El campo `path: string` es obligatorio en `MarketingVaultFile` para poder generar signed URLs on-demand.

Ver spec completo del módulo de marketing: [[sistema-marketing]]

## Notas Relacionadas

- [[sistema-notificaciones]] — `send-unread-chat-emails` notifica mensajes no leídos
- [[sistema-configuraciones]] — Toggle `allow_client_messages` + `EmployeeWorkScheduleEditor` en settings de empleado
- [[sistema-billing]] — Plan determina si chat es solo con owner o multi-empleado
- [[sistema-perfiles-publicos]] — `ChatWithAdminModal` se abre desde BusinessProfile
- [[base-de-datos]] — Nuevas tablas: user_presence, employee_work_schedule, call_sessions

---
date: 2026-04-19
tags: [sistema, chat, mensajeria, realtime, produccion]
status: completado
---

# Sistema de Chat en Tiempo Real

Mensajería instantánea entre clientes, empleados y administradores con typing indicators, read receipts, adjuntos y notificación de no leídos.

## Descripción

Chat en tiempo real usando Supabase Realtime. Los clientes pueden chatear con empleados específicos (filtrados por `allow_client_messages`). Incluye `ChatWithAdminModal` v4.0.0 para selección de empleado desde el perfil del negocio.

## Flujo Principal

1. Cliente abre chat desde `FloatingChatButton` o `ChatWithAdminModal`
2. Si plan Gratuito → chat directo con owner
3. Si plan Básico/Pro → lista de empleados con `allow_client_messages = true`
4. Al seleccionar empleado → se crea/recupera conversación
5. Mensajes en tiempo real via Supabase Realtime
6. Si hay mensajes no leídos → Edge Function `send-unread-chat-emails`

## Componentes Clave

| Componente | Ubicación | Función |
|-----------|-----------|---------|
| `ChatLayout` | `src/components/chat/` | Layout principal del chat |
| `ChatWindow` | `src/components/chat/` | Ventana de conversación |
| `ChatInput` | `src/components/chat/` | Input con adjuntos |
| `ConversationList` | `src/components/chat/` | Lista de conversaciones |
| `FloatingChatButton` | `src/components/chat/` | Botón flotante para abrir chat |
| `ChatWithAdminModal` | `src/components/business/` | Modal de selección de empleado (v4.0.0) |
| `MessageBubble` | `src/components/chat/` | Burbuja de mensaje individual |
| `TypingIndicator` | `src/components/chat/` | Indicador "escribiendo..." |

## Tablas de Base de Datos

- `conversations` — Hilos de conversación
- `messages` — Mensajes (content, attachments, read_receipt)
- `chat_participants` — Participantes en conversaciones
- `business_employees.allow_client_messages` — Toggle por empleado

## Edge Functions

- `send-message` — Envío de mensajes
- `send-unread-chat-emails` — Notificación de mensajes no leídos

## Storage

- Bucket `chat-attachments` (private) — Archivos adjuntos del chat

## Preferencias de Mensajes para Empleados

Los empleados controlan si reciben mensajes de clientes via toggle en Settings:
- Columna: `business_employees.allow_client_messages` (BOOLEAN, DEFAULT true)
- Hook: `useBusinessEmployeesForChat` (96 líneas) — filtra a nivel de BD
- Índice optimizado: `idx_business_employees_allow_client_messages`
- Retrocompatible: DEFAULT true para empleados existentes
- Por negocio independiente

## Hooks

- `useChat(conversationId)` — Chat en una conversación
- `useMessages(conversationId)` — Mensajes de una conversación
- `useConversations(userId)` — Todas las conversaciones del usuario
- `useBusinessEmployeesForChat(businessId)` — Empleados con mensajes habilitados

## ChatWithAdminModal v4.0.0

- **Owner**: botón directo "Chatear"
- **Client**: lista de empleados con [Avatar] [Nombre] - [Sede]
- Muestra sede solo para empleados (no para managers/owners)
- Cierre automático de modales anidados (ChatModal → BusinessProfile)
- 2 queries optimizadas: empleados + ubicación

## Fix Crítico: Memory Leak

Corregido memory leak en Realtime subscriptions — 99.4% menos queries. La suscripción invalida cache de React Query en vez de hacer refetch continuo.

## Archivos Clave

- `src/components/chat/ChatLayout.tsx`
- `src/components/chat/ChatWindow.tsx`
- `src/components/business/ChatWithAdminModal.tsx`
- `src/hooks/useBusinessEmployeesForChat.ts`
- `supabase/functions/send-message/`

## Notas Relacionadas

- [[sistema-notificaciones]] — `send-unread-chat-emails` notifica mensajes no leídos
- [[sistema-configuraciones]] — Toggle `allow_client_messages` en settings de empleado
- [[sistema-billing]] — Plan determina si chat es solo con owner o multi-empleado
- [[sistema-perfiles-publicos]] — `ChatWithAdminModal` se abre desde BusinessProfile
- [[bug-session-disconnection-on-tab-switch]] — Bug conocido de desconexión

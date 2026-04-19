---
date: 2026-04-19
tags: [sistema, notificaciones, email, whatsapp, sms, produccion]
status: completado
---

# Sistema de Notificaciones Multicanal

Notificaciones por Email (Brevo), SMS (AWS SNS), WhatsApp Business API e In-App con recordatorios automáticos y fallback entre canales.

## Descripción

17 tipos de notificaciones que cubren citas, verificaciones, empleados, vacantes, ausencias y sistema. El sistema de recordatorios automáticos (`process-reminders`) ejecuta cada 5 minutos via cron. El hook `useInAppNotifications` usa una única query base con filtros locales (optimizado en Oct 2025: de 5 queries → 1).

## Flujo Principal

1. Evento dispara notificación (nueva cita, ausencia, etc.)
2. Edge Function determina canal(es) según configuración del negocio
3. Envío por canal prioritario → fallback automático si falla
4. Registro en `notification_log` con tracking
5. Notificación in-app insertada en `in_app_notifications`
6. Cliente ve badge en `NotificationBell` (conteo local, sin RPC)

## Canales Disponibles

| Canal | Servicio | Plan requerido | Variables |
|-------|---------|---------------|-----------|
| Email | Brevo (Sendinblue) | Gratuito | `BREVO_API_KEY`, `BREVO_SMTP_*` |
| In-App | Supabase Realtime | Gratuito | — |
| WhatsApp | WhatsApp Business API | Básico+ | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` |
| SMS | AWS SNS | Pro | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |

## Recordatorios Automáticos

| Momento | Canal | Plan |
|---------|-------|------|
| 24h antes | Email + In-app | Todos |
| 2h antes | WhatsApp + In-app | Básico+ |
| 15 min antes | In-app (push) | Todos |

## Componentes Clave

| Componente | Ubicación | Función |
|-----------|-----------|---------|
| `NotificationBell` | `src/components/notifications/` | Campanita con badge de no-leídas |
| `NotificationCenter` | `src/components/notifications/` | Panel/dropdown de notificaciones |
| `BusinessNotificationSettings` | `src/components/admin/` | Configuración de canales por negocio |

## Tablas de Base de Datos

- `in_app_notifications` — Notificaciones in-app (type, data JSONB, read, user_id, business_id)
- `business_notification_settings` — Configuración de canales y recordatorios por negocio
- `user_notification_preferences` — Preferencias por tipo y canal por usuario
- `notification_log` — Registro de envíos con tracking

## Edge Functions

- `send-notification` — Envío multi-canal (Email/SMS/WhatsApp)
- `process-reminders` — Procesador automático (cron cada 5 min)
- `schedule-reminders` — Programar recordatorios
- `send-email` / `send-email-reminder` — Emails via Brevo
- `send-sms-reminder` — SMS via AWS SNS
- `send-whatsapp` / `send-whatsapp-reminder` — WhatsApp Business API
- `send-notification-reminders` — Recordatorios de citas
- `send-unread-chat-emails` — Notificaciones de mensajes no leídos
- `send-notifications` — Batch notifications

## 17 Tipos de Notificación

Categorías: citas, verificaciones, empleados, vacantes, ausencias, sistema. Cada tipo tiene mapeo a rol requerido en `src/lib/notificationRoleMapping.ts` (363 líneas, 30+ mapeos).

## Navegación Inteligente con Cambio de Rol

Si una notificación pertenece a un rol diferente al activo (ej: notificación de empleado mientras el usuario está como cliente), el sistema:
1. Extrae el rol requerido de `notificationRoleMapping`
2. Cambia automáticamente de rol
3. Navega al componente correcto

## Hook Optimizado (Oct 2025)

`useInAppNotifications` — antes: 5 queries separadas (521 líneas), ahora: 1 query base limit=50 + filtros locales (205 líneas).
- UnreadCount calculado localmente (sin RPC extra)
- Realtime subscription invalida query, sin refetch continuo
- Filtros: status, type, businessId, excludeChatMessages

## Permisos Requeridos

- `notifications.manage` — Configurar notificaciones del negocio (proteger con [[sistema-permisos|PermissionGate]])

## Archivos Clave

- `src/components/notifications/NotificationBell.tsx`
- `src/components/notifications/NotificationCenter.tsx`
- `src/hooks/useInAppNotifications.ts`
- `src/lib/notificationRoleMapping.ts`
- `supabase/functions/send-notification/`
- `supabase/functions/process-reminders/`

## Notas Relacionadas

- [[sistema-citas]] — Notificaciones de confirmación/cancelación/reprogramación
- [[sistema-ausencias]] — Notificaciones a admins al solicitar ausencia
- [[sistema-vacantes]] — Notificaciones de aplicaciones y selección
- [[sistema-chat]] — `send-unread-chat-emails` para mensajes no leídos
- [[sistema-permisos]] — Permiso `notifications.manage`
- [[sistema-billing]] — Canales disponibles dependen del plan
- [[stack-tecnologico]] — Brevo, AWS SNS, WhatsApp Business API

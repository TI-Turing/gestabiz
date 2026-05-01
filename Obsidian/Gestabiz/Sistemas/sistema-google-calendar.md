---
date: 2026-04-25
tags: [google-calendar, oauth, sync, integraciones, citas]
status: completed
---

# Sistema de Google Calendar

Sincronización bidireccional entre las citas de Gestabiz y los calendarios de Google del usuario (admin, empleado o cliente). Permite ver citas en Google Calendar y reflejar bloqueos/eventos externos al validar disponibilidad.

## Feature flag

Controlado por `FEATURES.GOOGLE_CALENDAR_SYNC` en `src/constants/index.ts:138`. Se respeta en frontend (oculta UI) y backend (Edge Function rechaza requests).

## Tabla `calendar_sync_settings`

```sql
calendar_sync_settings (
  user_id uuid PK,
  provider text,            -- 'google' | 'outlook' (futuro)
  access_token text,        -- Encriptado at-rest
  refresh_token text,       -- Encriptado at-rest
  expires_at timestamptz,
  calendar_id text,         -- ID del calendario seleccionado
  sync_enabled boolean,
  last_sync_at timestamptz,
  UNIQUE(user_id, provider)
)
```

Acceso restringido: el usuario solo lee/escribe sus propios tokens (RLS por `auth.uid()`).

## Flujo OAuth

1. Usuario hace clic en "Conectar Google Calendar" en Settings.
2. Redirige a Google OAuth con scopes `calendar.events` + `calendar.readonly`.
3. Google redirige a `/auth/google/callback` (página `GoogleCalendarCallback.tsx`).
4. Frontend intercambia el `code` por `access_token` + `refresh_token` via `googleCalendarService.exchangeCode()`.
5. Persistencia en `calendar_sync_settings` con `upsert` y `onConflict: 'user_id,provider'` para sobreescribir tokens previos.
6. Sentry tagging: errores en este paso se capturan con tag `oauthExchange` para distinguirlos de errores de sync runtime.

## Hook `useGoogleCalendarSync`

Expone:
- `connect()` — inicia OAuth flow.
- `disconnect()` — revoca tokens y borra `calendar_sync_settings`.
- `syncNow()` — fuerza sync inmediato (push appointments → Google + pull bloqueos).
- `isConnected`, `isSyncing`, `lastSyncAt`, `selectedCalendar`.
- `selectCalendar(calendarId)` — usuario elige calendario destino.

## Edge Function `calendar-integration`

Server-side sync para evitar exponer tokens al cliente:

- **Push**: cuando se crea/actualiza/cancela una cita en Gestabiz, la function la propaga a Google Calendar como evento.
- **Pull**: cron periódico lee eventos del calendario seleccionado y los considera al calcular disponibilidad del empleado/admin (no se persisten, solo se incluyen en el cálculo de slots).
- Renueva `access_token` con `refresh_token` cuando expira (60 min de vida).

## Sentry tagging

Los errores se categorizan con tags:
- `oauthExchange` — fallos al intercambiar code por tokens.
- `tokenRefresh` — fallos al renovar access_token.
- `eventPush` / `eventPull` — fallos en sync runtime.

Permite filtrar y priorizar incidentes en el dashboard de Sentry.

## Limitaciones actuales

- Solo soporta cuentas Google personales y Workspace; no Outlook ni iCloud.
- No sincroniza notas o adjuntos, solo título, fecha y descripción del evento.
- Usuario debe tener `sync_enabled=true` y haber seleccionado un calendario; sin ello, no hay sync.

## Notas relacionadas

- [[sistema-citas]] — Citas que se sincronizan
- [[edge-functions]] — `calendar-integration`
- [[stack-tecnologico]] — Google APIs SDK
- [[base-de-datos]] — Tabla `calendar_sync_settings`

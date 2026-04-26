---
date: 2026-04-26
tags: [mobile, react-native, parity, expo, cliente]
---

# Sprint: Paridad Visual y de Datos App Móvil ↔ Web (Fases 2.1–3)

## Contexto

El usuario comparó la pantalla "Mis Citas" del cliente entre la app móvil (Expo RN) y la web responsive (Chrome DevTools, viewport ~412px, `dev.gestabiz.com`). La app móvil mostraba empty state mientras la web mostraba varias citas con badge "Pendiente".

Rama: `feat/mobile-client-parity-2026-04`

---

## Causa raíz del empty state

**Bug de filtro de estado en el query de upcoming:**

```ts
// ANTES (móvil) — excluía pending
.in('status', ['scheduled', 'confirmed'])

// WEB — incluye pending
['pending', 'confirmed', 'scheduled'].includes(apt.status)
```

Las citas recién creadas tienen `status = 'pending'` antes de que el negocio las confirme. El móvil no las mostraba.

---

## Cambios implementados (commits en orden)

### Fase 2.1 — Reseñas + Notificaciones (commits previos)
- `WriteReviewScreen`: formulario de reseña post-cita con selector negocio/empleado
- `PendingReviewsScreen`: lista de citas completadas sin reseña
- `SettingsScreen`: secciones NOTIFICACIONES (canales), RESÚMENES, PRIVACIDAD con prefs completas

### Fase 2.2 — Perfil de cliente
- `ClientProfileScreen`: cover hero, avatar upload, documento de identidad, accesos rápidos

### Fase 2.3 — Geolocalización en búsqueda
- `SearchScreen`: toggle "Cerca de mí", sort Haversine, badge de distancia, `useGeolocation` manual

### Fase 2.4 — Deep-links de cita
- `AppointmentConfirmationScreen` y `AppointmentCancellationScreen`
- Rutas en `linking.ts`: `confirmar-cita/:token`, `cancelar-cita/:token`

### Fase 2.5 — ChatWithEmployeeModal
- Migración de `colors` hardcoded → `useTheme`
- `ROLE_LABELS` para mostrar roles de empleados en español
- Avatar component + empty state mejorado

### Fase 3 — Paridad "Mis Citas" (este sprint)

**Commit `2464076`** — `ClientAppointmentsScreen` + `AppointmentCard`:
- Filtro: `.in('status', ['scheduled', 'confirmed', 'pending'])` (causa raíz)
- Cancel button en citas `pending` y `confirmed` además de `scheduled`
- Batch fetch `business_employees.role` → `employeeTitle` ("Profesional", "Manager", etc.)
- `locations.banner_url` como fallback de `serviceImageUrl` cuando el servicio no tiene imagen
- `heroCard.borderRadius`: `radius['2xl']` (20px) → `radius.lg` (12px) — paridad con `rounded-xl` web
- Shadow hero: `shadows.md` → `shadows.sm`

**Commit `1176230`** — `ClientDashboardScreen`, `BusinessProfileScreen`, `BookingScreen`:
- `ClientDashboardScreen`: misma corrección de filtro `pending` en el dashboard home
- `BusinessProfileScreen`: `AppHeader` con back button, "Reservar cita" pasa `preselectedBusinessId`
- `BookingScreen`: acepta `preselectedBusinessId` via `useRoute`, `useEffect` para preseleccionar el negocio y saltar al paso de servicio

**Commit `f8dafc0`** — `BookingScreen` `goBack`:
- Cuando viene de `BusinessProfileScreen` y toca "Atrás" en el paso 'service', regresa a `BusinessProfileScreen` (no al paso de negocio vacío)

---

## Estado de cada pantalla cliente al cierre del sprint

| Pantalla | Estado |
|----------|--------|
| `ClientDashboardScreen` | ✅ Paridad — filtro pending corregido |
| `ClientAppointmentsScreen` | ✅ Paridad — pending + employeeTitle + banner fallback |
| `AppointmentHistoryScreen` | ✅ Completo — stats card + filtros rango/status |
| `CalendarScreen` / `CalendarView` | ✅ Completo — ya tenía pending en DOT_COLORS |
| `SearchScreen` | ✅ Fase 2.3 — geo toggle, distancia, 3 tipos de búsqueda |
| `BusinessProfileScreen` | ✅ Paridad — back button, reservar con businessId |
| `BookingScreen` | ✅ Paridad — preselección de negocio desde BusinessProfile |
| `FavoritesScreen` | ✅ Completo — usa BusinessCard |
| `ClientProfileScreen` | ✅ Fase 2.2 — cover hero, avatar, doc identidad |
| `SettingsScreen` | ✅ Fase 2.1 — prefs completas (email, SMS, WhatsApp, DND, digests) |
| `WriteReviewScreen` | ✅ Fase 2.1 |
| `PendingReviewsScreen` | ✅ Fase 2.1 |

---

## Pendiente (fuera del alcance de este sprint)

- **Fase 4**: jest-expo smoke tests para las pantallas cliente
- **Fase 5**: Documentación CLAUDE.md / Obsidian completa del módulo móvil
- Pantallas admin y employee (fuera del scope de paridad cliente)

---

## Gotchas importantes

- `appointments` **NO** tiene columnas `client_name`, `service_name` — siempre two-step query
- `status = 'pending'` es el estado inicial de una cita recién creada (antes de confirmación). **Debe incluirse en todos los filtros de upcoming**.
- `business_employees.role` tiene valores: `manager`, `professional`, `receptionist`, `accountant`, `support_staff`. Usar `ROLE_LABELS` para traducir a español.
- `locations.banner_url` es el fallback de imagen de fondo cuando el servicio no tiene `image_url`.
- La nueva clave de Supabase móvil usa formato `sb_publishable_*` — los JWT legacy `eyJ...` están deshabilitados desde Abr 2026.

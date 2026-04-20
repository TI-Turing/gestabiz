---
date: 2026-04-19
tags: [sistema, recursos, modelo-flexible, hotel, restaurante, gimnasio]
status: backend-completo
---

# Sistema de Modelo de Negocio Flexible

Arquitectura dual que soporta negocios con empleados (salones, clínicas) Y/O recursos físicos (hoteles, restaurantes, gimnasios, coworkings). Backend completo, UI pendiente.

## Descripción

Gestabiz originalmente solo soportaba negocios donde se reservan profesionales (employee_id). Este sistema agrega `resource_id` como alternativa, permitiendo reservar habitaciones de hotel, mesas de restaurante, canchas deportivas, etc. La tabla `appointments` tiene un CHECK constraint: `employee_id IS NOT NULL OR resource_id IS NOT NULL`.

## Modelos de Negocio

| Modelo | resource_model | Ejemplo |
|--------|---------------|---------|
| Profesional (default) | `professional` | Salón de belleza, clínica, barbería |
| Recurso físico | `physical_resource` | Hotel, restaurante, bowling |
| Híbrido | `hybrid` | Spa (masajista + sala), gimnasio (entrenador + equipo) |
| Clase grupal | `group_class` | Yoga, spinning, crossfit |

## 15 Tipos de Recursos

room, table, court, desk, equipment, vehicle, space, lane, field, station, parking_spot, bed, studio, meeting_room, other

## Casos de Uso

| Vertical | Tipo recurso | Ejemplo |
|----------|-------------|---------|
| Hotel | room | Habitación standard, suite, deluxe |
| Restaurante | table | Mesa para 2/4/6/8 personas |
| Centro deportivo | court | Cancha tenis, fútbol, padel |
| Gimnasio | equipment | Caminadora, bicicleta, banco |
| Co-working | desk / meeting_room | Escritorio, sala de reuniones |
| Bowling | lane | Lane 1, 2, 3... |
| Parqueadero | parking_spot | Espacio de estacionamiento |
| Hospital | bed | Cama de hospitalización |

## Tablas de Base de Datos

- `business_resources` — Recursos (resource_type, capacity, hourly_rate, status, amenities JSONB, is_active)
- `resource_services` — Junction M:N con custom_price override
- `appointments.resource_id` — Nullable, alternativa a employee_id
- `businesses.resource_model` — ENUM que define el modelo del negocio
- Vista materializada: `resource_availability` (bookings, revenue)

## Funciones SQL

- `get_resource_stats(business_id)` — Estadísticas de uso
- `is_resource_available(resource_id, start, end)` — Validación de overlap
- `refresh_resource_availability()` — Refresco de vista materializada

## Servicio Backend

`src/lib/services/resources.ts` — 303 líneas, 15 métodos:
- CRUD: getByBusinessId, getByLocationId, getByType, getById, create, update, delete
- Disponibilidad: getAvailability, isAvailable (usa RPC)
- Servicios: assignServices, getServices (M:N junction)
- Stats: getStats, getAvailableForService

## Hooks

`src/hooks/useBusinessResources.ts` — 277 líneas:
- 8 queries: useBusinessResources, useLocationResources, useResourcesByType, useResourceDetail, useResourceAvailability, useResourceServices, useResourceStats, useResourcesForService
- 5 mutations: useCreateResource, useUpdateResource, useDeleteResource, useAssignServices, useRefreshResourceAvailability
- Cache: 5 min estables, 30 seg volátiles

## Hook de Disponibilidad Unificada

`src/hooks/useAssigneeAvailability.ts` — 230 líneas:
- Valida empleado OR recurso automáticamente
- 3 variantes: useAssigneeAvailability, useIsAssigneeAvailable, useValidateAssigneeSlot
- Retorna conflicts detallados (cliente, servicio, horario)

## Progreso

- ✅ Fase 1: Migraciones DB (2/2 aplicadas)
- ✅ Fase 2: Backend & Services (3 archivos, 810 líneas)
- ⏳ Fase 3: Componentes UI (pendiente)
- ⏳ Fase 4: Integración AppointmentWizard (pendiente)

**Retrocompatibilidad**: negocios existentes mantienen `resource_model = 'professional'`, sin cambios.

## Permisos Requeridos

- `resources.create` — Crear recursos (proteger con [[sistema-permisos|PermissionGate]])
- `resources.edit` — Editar recursos
- `resources.delete` — Eliminar recursos
- `resources.view` — Ver recursos

## Archivos Clave

- `src/lib/services/resources.ts`
- `src/hooks/useBusinessResources.ts`
- `src/hooks/useAssigneeAvailability.ts`
- `src/components/cards/ResourceCard.tsx`

## Notas Relacionadas

- [[sistema-citas]] — AppointmentWizard soportará resource_id (Fase 4 pendiente)
- [[sistema-permisos]] — Permisos `resources.*`
- [[base-de-datos]] — CHECK constraint, ENUM, vistas materializadas
- [[sistema-cards]] — ResourceCard self-fetch por ID
- [[sectores-y-casos-de-uso]] — Verticales atendidos por este sistema
- [[propuesta-de-valor]] — Diferencial competitivo vs otros SaaS de citas

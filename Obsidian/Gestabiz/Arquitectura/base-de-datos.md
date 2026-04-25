---
date: 2026-04-19
tags: [arquitectura, base-de-datos, supabase, postgresql, rls, triggers]
status: activo
---

# Base de Datos Supabase

40+ tablas PostgreSQL 15+ con RLS, triggers, vistas materializadas, RPCs y storage buckets.

> Para el flujo de trabajo con la instancia local de Supabase (Docker), ver [[supabase-local-workflow]].

## Proyectos

| Entorno | Project ID | Uso |
|---------|-----------|-----|
| **LOCAL** ⭐ | Docker (`localhost:54321`) | **Desarrollo diario** — espejo de DEV |
| DEV | `dkancockzvcqorqbwtyh` | Pruebas remotas / QA |
| PROD | `emknatoknbomvmyumqju` | Producción (limpio) |

## Extensiones PostgreSQL

- `uuid-ossp` — Generación de UUIDs
- `pg_trgm` — Búsqueda fuzzy (trigram) → ver [[sistema-busqueda]]
- `postgis` — Geolocalización

## Tablas Principales

### Core del Negocio
| Tabla | Campos clave | Notas |
|-------|-------------|-------|
| `businesses` | owner_id, resource_model, category_id, subcategory_ids[], slug | resource_model: ENUM |
| `locations` | opens_at, closes_at, address, lat/lng, city_id | Horarios de sede |
| `services` | price, duration, category, is_active | |
| `business_employees` | **employee_id** (NO user_id), role, employee_type, lunch_break, allow_client_messages, hire_date | ⚠️ SIEMPRE employee_id |
| `business_resources` | resource_type, capacity, hourly_rate, amenities (JSONB) | 15 tipos |
| `resource_services` | custom_price override | M:N |
| `location_services` | | Servicios por sede |
| `employee_services` | | Servicios por empleado |
| `business_roles` | role: admin/employee | Sincronizado con business_employees vía trigger |

### Citas
| Tabla | Campos clave |
|-------|-------------|
| `appointments` | start_time, end_time, status, employee_id OR resource_id, is_location_exception, service_id, client_id |

> **CHECK**: `employee_id IS NOT NULL OR resource_id IS NOT NULL`
> **GOTCHA**: NO tiene `client_name`, `client_email` — siempre two-step query

### Permisos
| Tabla | Campos |
|-------|--------|
| `user_permissions` | business_id, user_id, permission, granted_by, is_active — UNIQUE(business_id, user_id, permission) |
| `permission_templates` | JSONB arrays de permisos |
| `permission_audit_log` | Cambios de permisos |

### Ausencias
| Tabla | Descripción |
|-------|-------------|
| `employee_absences` | Solicitudes de ausencia |
| `absence_approval_requests` | Aprobaciones |
| `vacation_balance` | Balance automático |
| `public_holidays` | 54 festivos colombianos |

### Notificaciones
| Tabla | Descripción |
|-------|-------------|
| `in_app_notifications` | type, data JSONB, read, user_id |
| `business_notification_settings` | Canales, recordatorios |
| `user_notification_preferences` | Por tipo y canal |
| `notification_log` | Tracking de envíos |

### Billing
`subscriptions`, `billing_invoices`, `payment_methods`, `usage_metrics`

### Contabilidad
`transactions` (subtotal, tax_type, tax_rate, tax_amount, fiscal_period), `business_tax_config`, `recurring_expenses`

### Reclutamiento
`job_vacancies`, `job_applications`, `employee_profiles`

### Chat
`conversations`, `messages`, `chat_participants`

### Reviews
`reviews` (rating 1-5, review_type: 'business'|'employee')

### Otros
`profiles`, `business_categories`, `business_subcategories`, `bug_reports`, `error_logs`, `login_logs`

## Vistas Materializadas

- `business_ratings_stats` — Stats de ratings por negocio
- `employee_ratings_stats` — Stats de ratings por empleado
- `resource_availability` — Bookings y revenue por recurso

Refresco: cron cada 5 min con `CONCURRENTLY` (no bloquea queries).

## Funciones RPC

| Función | Uso |
|---------|-----|
| `search_businesses()` | Búsqueda con ts_rank |
| `search_services()` | Búsqueda servicios |
| `search_professionals()` | Búsqueda profesionales |
| `get_business_hierarchy()` | Árbol de empleados |
| `get_client_dashboard_data()` | Dashboard cliente con filtros geo |
| `get_matching_vacancies()` | Matching empleado-vacante |
| `is_resource_available()` | Validación overlap recursos |
| `get_resource_stats()` | Stats de recursos |
| `refresh_ratings_stats()` | Refresco vistas materializadas |

## Triggers Importantes

- `auto_insert_owner_to_business_employees` — Owner → manager al crear negocio
- `trg_auto_insert_admin_as_employee` — Admin en business_roles → manager en business_employees
- `sync_business_roles_from_business_employees` — Sincronía bidireccional
- `auto_assign_permissions_to_owners` — 79 permisos al crear negocio
- `auto_assign_permissions_to_admins` — Permisos al asignar rol admin

## Storage Buckets

| Bucket | Acceso | Uso |
|--------|--------|-----|
| `avatars` | public | Fotos de perfil |
| `cvs` | private | CVs de aplicantes |
| `chat-attachments` | private | Archivos de chat |
| `bug-report-evidences` | private | Screenshots de bugs |

## RLS (Row Level Security)

Todas las tablas tienen políticas. Regla crítica:
> **NUNCA** consultar la misma tabla dentro de la política RLS que la protege → recursión infinita.

## Migraciones

41+ migraciones aplicadas. Comando:
```bash
npx supabase db push --dns-resolver https --yes
```

> **NUNCA** aplicar directamente a PROD sin autorización explícita.

## Archivos Clave

- `supabase/migrations/` — Todas las migraciones SQL
- `src/lib/supabase.ts` — Cliente singleton
- `src/types/supabase.gen.ts` — Tipos generados

## Notas Relacionadas

- [[stack-tecnologico]] — PostgreSQL 15+ como backend
- [[edge-functions]] — Edge Functions sobre esta BD
- [[sistema-autenticacion]] — Tablas de auth y roles
- [[sistema-permisos]] — Tabla user_permissions
- [[sistema-busqueda]] — Índices trigram y full-text
- [[sistema-modelo-flexible]] — business_resources table
- [[sistema-festivos]] — public_holidays table
- [[sistema-ausencias]] — Tablas de ausencias

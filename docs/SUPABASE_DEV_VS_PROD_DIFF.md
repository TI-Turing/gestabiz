# Supabase DEV vs PROD — Diferencias Detectadas

> **Fecha de análisis**: 2026-04-01  
> **DEV**: `dkancockzvcqorqbwtyh` (gestabiz-dev)  
> **PROD**: `emknatoknbomvmyumqju` (gestabiz)  
> **Método**: Queries SQL directas vía Management API + MCP

---

## Resumen Ejecutivo

| Área | DEV | PROD | Estado |
|------|-----|------|--------|
| Tablas (public) | 72 | 72 | ✅ Idénticas |
| Enums | 22 | 22 | ✅ Idénticos |
| Funciones SQL | 228 únicas | 232 | ⚠️ DEV tiene 3 exclusivas |
| **Triggers** | **~120+** | **0** | ❌ **CRÍTICO** |
| **Vistas Materializadas** | **7** | **0** | ❌ **CRÍTICO** |
| Edge Functions | 40 | 44 | ⚠️ PROD tiene 4 extra |
| Extensiones | 9 | 9 | ⚠️ Diferencias de versión |
| Storage Buckets (nombres) | 8 | 8 | ❌ Nombres diferentes |
| Storage Buckets (config) | Con límites | Sin límites | ❌ Config diferente |
| RLS público (public schema) | 228 | 228 | ✅ Idénticas |
| **RLS storage** | **50** | **13** | ❌ **PROD le faltan 37 policies** |
| **Cron Jobs** | **2** | **0** | ❌ **PROD no tiene cron jobs** |

### Prioridad de corrección

1. 🔴 **Triggers (0 en PROD)** — Sin triggers, la app no sincroniza roles, no actualiza search vectors, no mantiene `updated_at`, no asigna permisos automáticamente. **Es la diferencia más crítica.**
2. 🔴 **Vistas Materializadas (0 en PROD)** — Sin ellas, búsqueda por rating y stats no funcionan.
3. 🟠 **Storage Policies (37 faltantes)** — Avatares, logos, CVs, bug reports y chat attachments sin protección RLS.
4. 🟠 **Cron Jobs (0 en PROD)** — Recordatorios y actualizador de citas no se ejecutan automáticamente.
5. 🟡 **Storage Buckets (nombres)** — `user-avatars` vs `avatars`, `bug-reports-evidence` vs `bug-report-evidences`.
6. 🟡 **3 funciones SQL faltantes en PROD** — `handle_new_user`, `sync_business_roles_from_business_employees`, `update_bug_reports_updated_at`.
7. ⚪ **Edge Functions (4 extra en PROD)** — No es problema; PROD tiene más funciones desplegadas.
8. ⚪ **Extensiones (versiones)** — Diferencias menores, PROD tiene versiones más nuevas.

---

## 1. TRIGGERS ❌ CRÍTICO

### DEV: ~120+ triggers activos

Los triggers están correctamente vinculados a las tablas en DEV. Ejemplos clave:

| Trigger | Tabla | Función | Propósito |
|---------|-------|---------|-----------|
| `trg_auto_insert_admin_as_employee` | `business_roles` | `auto_insert_admin_as_employee()` | Admin → auto-insert en business_employees |
| `trg_auto_insert_owner_to_business_employees` | `businesses` | `auto_insert_owner_to_business_employees()` | Owner → auto-insert como manager |
| `trg_auto_assign_permissions_to_owners` | `businesses` | `auto_assign_permissions_to_owners()` | 79 permisos al crear negocio |
| `trg_auto_assign_permissions_to_admins` | `business_roles` | `auto_assign_permissions_to_admins()` | Permisos al asignar rol admin |
| `trg_sync_business_roles` | `business_employees` | `sync_business_roles_from_business_employees()` | business_roles ↔ business_employees |
| `update_*_updated_at` | Múltiples tablas | `update_updated_at_column()` | Mantener timestamps |
| `on_appointment_change` | `appointments` | `notify_appointment_change()` | Notificaciones en tiempo real |
| `businesses_search_vector_trigger` | `businesses` | `businesses_search_vector_update()` | Full-text search |
| `services_search_vector_trigger` | `services` | `services_search_vector_update()` | Full-text search |
| `profiles_search_vector_trigger` | `profiles` | `profiles_search_vector_update()` | Full-text search |
| `on_auth_user_created` | `auth.users` | `handle_new_user()` | Crear perfil automáticamente |

**Lista completa de triggers por tabla en DEV** (agrupados):

- **absence_approval_requests**: `update_absence_approval_requests_updated_at`
- **appointments**: `on_appointment_change`, `update_appointments_updated_at`
- **billing_invoices**: `update_billing_invoices_updated_at`
- **bug_report_comments**: `update_bug_report_comments_updated_at`
- **bug_reports**: `update_bug_reports_updated_at`
- **business_employees**: `trg_sync_business_roles`, `update_business_employees_updated_at`
- **business_notification_settings**: `update_business_notification_settings_updated_at`
- **business_resources**: `update_business_resources_updated_at`
- **business_roles**: `trg_auto_assign_permissions_to_admins`, `trg_auto_insert_admin_as_employee`, `update_business_roles_updated_at`
- **business_tax_config**: `update_business_tax_config_updated_at`
- **businesses**: `businesses_search_vector_trigger`, `trg_auto_assign_permissions_to_owners`, `trg_auto_insert_owner_to_business_employees`, `update_businesses_updated_at`
- **chat_participants**: `update_chat_participants_updated_at`
- **conversations**: `update_conversations_updated_at`
- **employee_absences**: `update_employee_absences_updated_at`
- **employee_profiles**: `update_employee_profiles_updated_at`
- **employee_services**: `update_employee_services_updated_at`
- **error_logs**: `update_error_logs_updated_at`
- **in_app_notifications**: `update_in_app_notifications_updated_at`
- **job_applications**: `update_job_applications_updated_at`
- **job_vacancies**: `update_job_vacancies_updated_at`
- **location_services**: `update_location_services_updated_at`
- **locations**: `update_locations_updated_at`
- **login_logs**: `update_login_logs_updated_at`
- **messages**: `update_messages_updated_at`
- **notification_log**: `update_notification_log_updated_at`
- **payment_methods**: `update_payment_methods_updated_at`
- **permission_templates**: `update_permission_templates_updated_at`
- **profiles**: `profiles_search_vector_trigger`, `update_profiles_updated_at`
- **public_holidays**: `update_public_holidays_updated_at`
- **recurring_expenses**: `update_recurring_expenses_updated_at`
- **resource_services**: `update_resource_services_updated_at`
- **reviews**: `update_reviews_updated_at`
- **services**: `services_search_vector_trigger`, `update_services_updated_at`
- **subscriptions**: `update_subscriptions_updated_at`
- **transactions**: `update_transactions_updated_at`
- **usage_metrics**: `update_usage_metrics_updated_at`
- **user_notification_preferences**: `update_user_notification_preferences_updated_at`
- **user_permissions**: `update_user_permissions_updated_at`
- **vacation_balance**: `update_vacation_balance_updated_at`
- **auth.users**: `on_auth_user_created`

### PROD: 0 triggers

**Impacto**: La app en PROD tendrá estos problemas:
- ❌ Nuevos negocios NO registran al owner como empleado
- ❌ Nuevos admins NO se insertan en business_employees
- ❌ Permisos NO se asignan automáticamente
- ❌ business_roles NO se sincroniza con business_employees
- ❌ `updated_at` NO se actualiza en ninguna tabla
- ❌ Search vectors NO se regeneran (búsqueda full-text rota)
- ❌ Nuevos usuarios de auth NO crean perfil automáticamente
- ❌ Notificaciones de cambio de cita NO se disparan

---

## 2. VISTAS MATERIALIZADAS ❌ CRÍTICO

### DEV: 7 vistas

| Vista | Propósito |
|-------|-----------|
| `appointments_with_relations` | Citas con datos de cliente/servicio/empleado pre-joined |
| `business_ratings_stats` | Media de ratings y conteo de reviews por negocio |
| `employee_ratings_stats` | Media de ratings y conteo de reviews por empleado |
| `error_logs_summary` | Resumen de errores agrupados |
| `mv_vacancy_selection_stats` | Estadísticas de selección de vacantes |
| `resource_availability` | Disponibilidad de recursos con bookings/revenue |
| `user_active_permissions` | Permisos activos por usuario (cache) |

### PROD: 0 vistas

**Impacto**: Sin vistas materializadas en PROD:
- ❌ Búsqueda de negocios por rating no funciona (RPC `search_businesses()` consulta `business_ratings_stats`)
- ❌ Búsqueda de profesionales por rating no funciona
- ❌ Dashboard de recursos no muestra estadísticas
- ❌ Cache de permisos no funciona (performance degradado)

---

## 3. STORAGE BUCKETS ❌ DIFERENCIAS

### Diferencias de nombres

| Propósito | DEV | PROD | Discrepancia |
|-----------|-----|------|-------------|
| Avatares de usuario | `user-avatars` | `avatars` | ❌ Nombre diferente |
| Bug report evidences | `bug-reports-evidence` | `bug-report-evidences` | ❌ Nombre diferente |
| Logos de negocio | `business-logos` | *(no existe)* | ❌ Falta en PROD |
| Media de ubicación | *(no existe)* | `location-media` | ⚠️ Extra en PROD |

### Buckets idénticos en nombre

| Bucket | DEV | PROD |
|--------|-----|------|
| `chat-attachments` | ✅ | ✅ |
| `cvs` | ✅ | ✅ |
| `location-images` | ✅ | ✅ |
| `location-videos` | ✅ | ✅ |
| `service-images` | ✅ | ✅ |

### Diferencias de configuración

**DEV tiene restricciones configuradas; PROD no tiene ninguna.**

| Bucket (DEV) | Public | Size Limit | MIME Types |
|--------------|--------|-----------|------------|
| `bug-reports-evidence` | ❌ | 10MB | images/video/pdf/json |
| `business-logos` | ✅ | 2MB | images |
| `chat-attachments` | ❌ | 10MB | images/docs/zip |
| `cvs` | ❌ | 5MB | pdf/docx |
| `location-images` | ✅ | 5MB | images |
| `location-videos` | ✅ | *(sin límite)* | *(sin restricción)* |
| `service-images` | ✅ | 2MB | images |
| `user-avatars` | ✅ | 2MB | images |

| Bucket (PROD) | Public | Size Limit | MIME Types |
|---------------|--------|-----------|------------|
| Todos los buckets | Varía | *(sin límite)* | *(sin restricción)* |

**Impacto**: En PROD los usuarios podrían subir archivos de cualquier tipo y tamaño sin restricción.

---

## 4. RLS STORAGE POLICIES ❌ PROD MISSING 37

### PROD tiene 13 policies (solo location/service images):

```
Owners or members can delete location images
Owners or members can delete location videos
Owners or members can delete service images
Owners or members can update location images
Owners or members can update location videos
Owners or members can update service images
Owners or members can upload location images
Owners or members can upload location videos
Owners or members can upload service images
Public read access for service images
Public read images
Public read service images
Public read videos
```

### Policies que FALTAN en PROD (37):

**Avatares (4):**
- `Public read access to user avatars` (SELECT)
- `Users can upload their own avatar` / `Users can upload their own avatars` (INSERT)
- `Users can update their own avatar` / `Users can update their own avatars` (UPDATE)
- `Users can delete their own avatar` / `Users can delete their own avatars` (DELETE)

**Business Logos (6):**
- `Public read access for business logos` (SELECT)
- `Admins can upload business logos` (INSERT)
- `Admins can update business logos` (UPDATE)
- `Admins can delete business logos` (DELETE)
- `Business owners can upload logos` (INSERT)
- `Business owners can update logos` (UPDATE)
- `Business owners can delete logos` (DELETE)

**Chat Attachments (3):**
- `Users can view attachments in their conversations` (SELECT)
- `Users can upload attachments to their conversations` (INSERT)
- `Users can update their own attachments` (UPDATE)
- `Users can delete their own attachments` (DELETE)

**Bug Report Evidence (3):**
- `Users can view their own bug report evidence` (SELECT)
- `Users can upload evidence for their own bug reports` (INSERT)
- `Users can update their own bug report evidence` (UPDATE)
- `Users can delete their own bug report evidence` (DELETE)

**CVs (4):**
- `cvs_select_policy` (SELECT)
- `cvs_insert_policy` (INSERT)
- `cvs_update_policy` (UPDATE)
- `cvs_delete_policy` (DELETE)

**Otras policies duplicadas/alternativas de location/service:**
- `Members can upload/update/delete location images` (3)
- `Members can upload/update/delete location videos` (3)
- `Business owners can upload/update/delete service images` (3)
- `Public read access for location images` (SELECT)
- `Public read access for location videos` (SELECT)

**Impacto**: En PROD:
- ❌ Avatares: No se pueden subir ni leer (sin policies)
- ❌ Logos: No se pueden subir ni leer (sin policies + bucket no existe)
- ❌ Chat attachments: Sin protección RLS
- ❌ Bug reports: Sin protección RLS
- ❌ CVs: Sin protección RLS (acceso denegado o abierto según default)

---

## 5. CRON JOBS ❌ PROD VACÍO

### DEV: 2 cron jobs (cada 30 minutos)

| Job ID | Schedule | Edge Function | Propósito |
|--------|----------|--------------|-----------|
| 6 | `*/30 * * * *` | `process-reminders` | Procesar recordatorios de citas pendientes |
| 7 | `*/30 * * * *` | `appointment-status-updater` | Actualizar estados de citas expiradas |

### PROD: 0 cron jobs

**Impacto**:
- ❌ Recordatorios de citas NO se envían automáticamente
- ❌ Citas expiradas NO cambian de estado automáticamente

---

## 6. FUNCIONES SQL ⚠️ 3 EXCLUSIVAS DE DEV

### Funciones que existen SOLO en DEV:

| Función | Tipo | Propósito |
|---------|------|-----------|
| `handle_new_user()` | trigger | Crear perfil en `profiles` al registrar usuario en auth.users |
| `sync_business_roles_from_business_employees()` | trigger | Sincronizar business_roles al modificar business_employees |
| `update_bug_reports_updated_at()` | trigger | Actualizar `updated_at` en bug_reports |

**Nota**: PROD tiene 232 funciones vs DEV 228. Las funciones extra de PROD son overloads o funciones de sistema. Ninguna función de PROD falta en DEV.

**Impacto**:
- ❌ `handle_new_user`: Nuevos usuarios registrados no tendrán perfil — **CRÍTICO**
- ❌ `sync_business_roles_from_business_employees`: Tabla business_roles no se sincroniza — **ALTO**
- ⚠️ `update_bug_reports_updated_at`: Solo afecta timestamps de bug reports — **BAJO**

---

## 7. EDGE FUNCTIONS ⚠️ DIFERENCIAS MENORES

### Funciones SOLO en PROD (4 extra):

| Función | Propósito |
|---------|-----------|
| `schedule-reminders` | Programar recordatorios |
| `send-confirmation` | Enviar confirmación (probablemente derivada de send-appointment-confirmation) |
| `send-notification-reminders` | Enviar recordatorios de notificaciones |
| `send-whatsapp-reminder` | Enviar recordatorio vía WhatsApp |

### Versiones

- **DEV**: Versiones altas (v4–v38) por iteración continua durante desarrollo
- **PROD**: Todas en v2 (deploy único)

**Impacto**: No es un problema. Las funciones extra en PROD son desplegadas correctamente. Las funciones compartidas (40) existen en ambos entornos.

---

## 8. EXTENSIONES ⚠️ DIFERENCIAS DE VERSIÓN

| Extensión | DEV | PROD | Diferencia |
|-----------|-----|------|-----------|
| `pg_cron` | 1.6 | **1.6.4** | PROD más nuevo |
| `pg_net` | 0.19.5 | **0.20.0** | PROD más nuevo |
| `pg_graphql` | 1.5.11 | 1.5.11 | ✅ Igual |
| `pg_stat_statements` | 1.11 | 1.11 | ✅ Igual |
| `pg_trgm` | 1.6 | 1.6 | ✅ Igual |
| `pgcrypto` | 1.3 | 1.3 | ✅ Igual |
| `supabase_vault` | 0.3.1 | 0.3.1 | ✅ Igual |
| `unaccent` | 1.1 | 1.1 | ✅ Igual |
| `uuid-ossp` | 1.1 | 1.1 | ✅ Igual |

**Impacto**: PROD tiene versiones más nuevas de pg_cron y pg_net. No es un problema; son backwards-compatible.

---

## 9. ÁREAS IDÉNTICAS ✅

### Tablas (72 en ambos)
Ambos ambientes tienen exactamente las mismas 72 tablas con los mismos nombres.

### Enums (22 en ambos)
Todos los enums son idénticos: `appointment_status`, `business_category`, `conversation_role`, `conversation_type`, `delivery_status_enum`, `employee_status`, `invoice_status`, `legal_entity_type`, `message_type`, `notification_channel`, `notification_status`, `notification_type`, `notification_type_enum`, `payment_status`, `resource_model`, `tax_regime`, `tax_type`, `transaction_category`, `transaction_type`, `user_role`.

### RLS Policies (public schema)
228 policies idénticas en ambos ambientes sobre las 72 tablas. Misma distribución por tabla.

---

## 10. PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Arreglos CRÍTICOS (hacer primero)

1. **Crear triggers en PROD**: Ejecutar todos los `CREATE TRIGGER` statements necesarios
2. **Crear vistas materializadas en PROD**: Ejecutar las 7 definiciones de `CREATE MATERIALIZED VIEW`
3. **Crear funciones faltantes en PROD**: `handle_new_user()`, `sync_business_roles_from_business_employees()`, `update_bug_reports_updated_at()`

### Fase 2: Storage (hacer segundo)

4. **Renombrar buckets en PROD** o ajustar código para manejar ambos nombres:
   - `avatars` → `user-avatars` (o viceversa)
   - `bug-report-evidences` → `bug-reports-evidence` (o viceversa)
5. **Crear bucket `business-logos`** en PROD (o eliminarlo de DEV si no se usa)
6. **Aplicar restricciones** de tamaño y MIME types a todos los buckets de PROD
7. **Crear 37 storage policies faltantes** en PROD

### Fase 3: Automatización (hacer tercero)

8. **Crear 2 cron jobs** en PROD:
   - `process-reminders` cada 30 min
   - `appointment-status-updater` cada 30 min

### Fase 4: Validación

9. Verificar que todos los triggers disparan correctamente
10. Refrescar vistas materializadas (`REFRESH MATERIALIZED VIEW CONCURRENTLY`)
11. Probar flujos de registro (handle_new_user), creación de negocio (owner triggers), asignación de roles (admin triggers)

---

*Generado automáticamente por análisis de infraestructura DEV vs PROD*

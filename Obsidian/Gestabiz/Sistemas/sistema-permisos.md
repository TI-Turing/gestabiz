---
date: 2026-04-19
tags: [sistema, permisos, seguridad, permissiongate, produccion]
status: completado
---

# Sistema de Permisos Granulares

Control de acceso fino con 79 tipos de permisos, 1,919+ registros y componente `PermissionGate` para protección de acciones en 25 módulos.

## Descripción

Todo botón de acción en Gestabiz DEBE estar protegido con `PermissionGate`. Los owners tienen bypass total (0 queries adicionales, 99.4% más rápido). Los permisos se almacenan en `user_permissions` y se verifican via hook `usePermissions`.

## Flujo Principal

1. Usuario interactúa con botón protegido por `PermissionGate`
2. Hook `usePermissions(businessId, permission)` verifica:
   - ¿Es owner? → bypass total (sin query)
   - ¿Tiene permiso activo en `user_permissions`? → permitir/denegar
3. Según `mode`: hide (destruir), disable (grisear), show (fallback)

## Componentes Clave

| Componente | Ubicación | Función |
|-----------|-----------|---------|
| `PermissionGate` | `src/components/ui/PermissionGate.tsx` | Wrapper que oculta/deshabilita según permiso |
| `PermissionsManager` | `src/components/admin/` (lazy) | UI de gestión de permisos y templates |
| `UserPermissionsManager` | `src/components/admin/` | Asignar permisos a usuarios individuales |
| `PermissionTemplates` | `src/components/admin/` | Gestión de plantillas de permisos |

## Tablas de Base de Datos

- `user_permissions` — (business_id, user_id, permission, granted_by, is_active) UNIQUE
- `permission_templates` — Plantillas reutilizables (JSONB arrays)
- `permission_audit_log` — Auditoría de cambios

## 79 Tipos de Permisos (por categoría)

- `services.*`: create, edit, delete, view
- `resources.*`: create, edit, delete, view
- `locations.*`: create, edit, delete, view
- `employees.*`: create, edit, delete, view, edit_salary, edit_own_profile
- `appointments.*`: create, edit, delete, cancel, cancel_own, reschedule_own
- `recruitment.*`: create_vacancy, edit_vacancy, delete_vacancy, manage_applications
- `accounting.*`: create, edit, delete, view_reports
- `expenses.*`: create, delete
- `reviews.*`: create, moderate, respond
- `billing.*`: manage, view
- `notifications.*`: manage
- `settings.*`: edit, edit_business
- `permissions.*`: manage, view, assign
- `absences.*`: approve, request
- `favorites.*`: toggle
- `sales.*`: create

## 9 Templates Disponibles

1. Admin Completo (42 permisos)
2. Vendedor
3. Cajero
4. Manager de Sede
5. Recepcionista
6. Profesional
7. Contador
8. Gerente de Sede
9. Staff de Soporte

## Modos del PermissionGate

```tsx
// mode="hide" — Acciones destructivas (eliminar, cancelar)
<PermissionGate permission="services.delete" businessId={id} mode="hide">
  <Button>Eliminar</Button>
</PermissionGate>

// mode="disable" — Formularios y configuraciones
<PermissionGate permission="settings.edit" businessId={id} mode="disable">
  <Button type="submit">Guardar</Button>
</PermissionGate>

// mode="show" — Mostrar fallback alternativo
<PermissionGate permission="billing.manage" businessId={id} mode="show"
  fallback={<p>Sin acceso</p>}>
  <BillingPanel />
</PermissionGate>
```

## RPC Service

`src/lib/services/permissionRPC.ts` — `PermissionRPCService` con 5 métodos SECURITY DEFINER:
- `revoke(businessId, userId, permission)`
- `assign(businessId, userId, permission, grantedBy)`
- `applyTemplate(businessId, userId, templateId)`
- `bulkRevoke(businessId, userId, permissions[])`
- `bulkAssign(businessId, userId, permissions[], grantedBy)`

## Reglas de Negocio

- **businessId es REQUERIDO** — sin businessId no hay control de acceso
- **Owner bypass PRIMERO** — verificación sin queries (99.4% más rápido)
- **TODOS los botones protegidos** — regla #7 del proyecto
- `mode="hide"` para destructivas, `mode="disable"` para formularios
- Doble validación: UI (PermissionGate) + backend (antes de mutations)

## Gotchas

- **RLS recursión**: NUNCA consultar la misma tabla dentro de la política RLS
- **localStorage context**: validar que `businessId` exista antes de verificar permisos
- **React Query cache**: puede enmascarar bugs, invalidar tras cambios de BD
- **Audit triggers**: `auth.uid()` requiere JWT context, usar `set_config()` para SQL directo
- **JSONB templates**: expandir con `jsonb_array_elements_text()`
- **Bulk operations**: `ON CONFLICT DO UPDATE` para evitar duplicados

## Migraciones (9 aplicadas)

- `20251116110000` → 811 permisos (15 tipos)
- `20251116120000` → 162 permisos (3 tipos)
- `20251116130000` → 54 permisos (1 tipo)
- `20251116140000` → 162 permisos (3 tipos)
- `20251116150000` → 108 permisos (2 tipos)
- `20251116160000` → 162 permisos (3 tipos)
- `20251116170000` → 108 permisos (2 tipos)
- `20251116180000` → 108 permisos (2 tipos)
- `20251116190000` → 162 permisos (3 tipos)
- `20251119000000` → Auto-asignación 79 permisos a owners (trigger + backfill 55 negocios)

## Archivos Clave

- `src/components/ui/PermissionGate.tsx`
- `src/hooks/usePermissions.ts`
- `src/lib/services/permissionRPC.ts`
- `src/lib/permissions-v2.ts`

## Notas Relacionadas

- [[sistema-citas]] — Permisos `appointments.*` protegen wizard y acciones
- [[sistema-ausencias]] — Permiso `absences.approve` para aprobación de ausencias
- [[sistema-vacantes]] — Permisos `recruitment.*` para vacantes y aplicaciones
- [[sistema-contable]] — Permisos `accounting.*` para transacciones
- [[sistema-billing]] — Permisos `billing.*` para facturación
- [[sistema-ventas-rapidas]] — Permiso `sales.create` para ventas walk-in
- [[sistema-autenticacion]] — Roles dinámicos determinan permisos base
- [[google-oauth-separacion-entornos]] — Seguridad OAuth por entorno
- [[secretos-en-scripts-gitguardian]] — Seguridad de secrets

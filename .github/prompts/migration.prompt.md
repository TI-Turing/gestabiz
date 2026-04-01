---
mode: agent
description: Crea una migración SQL para Gestabiz siguiendo las convenciones del proyecto — idempotente, con RLS correcta, sin recursión, con manejo de triggers y vistas materializadas.
tools:
  - read_file
  - file_search
  - create_file
  - list_dir
---

Crea una migración SQL para Gestabiz.

## Antes de escribir

Leer las últimas 3 migraciones en `supabase/migrations/` para mantener el estilo y entender el schema actual.

## Reglas obligatorias

1. **Naming:** `YYYYMMDDHHMMSS_descripcion_corta.sql` — pedir la descripción si no se proporcionó
2. **Idempotente:** usar `IF NOT EXISTS` / `IF EXISTS` en TODAS las operaciones
3. **RLS sin recursión:** ninguna política puede hacer SELECT a la misma tabla que protege → crear función `SECURITY DEFINER` intermedia si es necesario
4. **Triggers críticos — NO romper:**
   - `auto_insert_owner_to_business_employees`: al crear negocio → owner como manager
   - `trg_auto_insert_admin_as_employee`: business_roles role='admin' → business_employees como manager
   - `sync_business_roles_from_business_employees`: sincronía bidireccional
   - `auto_assign_permissions_to_owners`: 79 permisos al crear negocio
   - Antes de cualquier DROP o ALTER, verificar que estos triggers no queden rotos
5. **Vistas materializadas:** si afecta `business_ratings_stats`, `employee_ratings_stats` o `resource_availability`, incluir al final: `REFRESH MATERIALIZED VIEW CONCURRENTLY <vista>;`
6. **Roles:** nunca agregar columna de rol a tablas de usuario — los roles se calculan en tiempo real
7. **Bulk operations:** usar `ON CONFLICT DO UPDATE` o `ON CONFLICT DO NOTHING` para inserciones masivas
8. **Audit triggers:** usar `set_config('app.current_user_id', auth.uid()::text, true)` en SQL directo para mantener contexto auth

## Entrega

- Archivo `.sql` completo listo para aplicar, guardado en `supabase/migrations/`
- Comentarios explicando cada sección no obvia
- Comando de aplicación: `npx supabase db push --dns-resolver https --yes`
- Nota de efectos secundarios: ¿qué triggers se dispararán? ¿qué vistas se invalidan?

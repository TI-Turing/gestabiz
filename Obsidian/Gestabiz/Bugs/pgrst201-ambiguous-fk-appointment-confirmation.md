# Bug: PGRST201 en send-appointment-confirmation

**Estado**: ✅ RESUELTO — v58, 19 Abr 2026  
**Commit**: `2533bad`  
**Función**: `send-appointment-confirmation`

---

## Síntoma

Edge Function devolvía siempre HTTP 500:
```json
{"success": false, "error": "Error: Appointment not found"}
```
…aunque el appointment existía en la BD con todos sus datos.

## Causa Raíz

La tabla `appointments` tiene **dos FK a `locations`**:
1. `appointments_location_id_fkey` → columna `location_id`
2. `appointments_original_location_id_fkey` → columna `original_location_id`

Al usar `location:locations(...)` sin hint, PostgREST no puede determinar cuál relación usar → devuelve `PGRST201` (HTTP 300 Multiple Choices). El `catch` externo lo convierte en `"Appointment not found"`.

## Fix

Agregar hints de FK en el `.select()`:

```typescript
// ANTES (ambiguo → PGRST201)
location:locations(id, name, address)

// DESPUÉS (hint explícito de columna)
location:locations!location_id(id, name, address)
```

Bloque completo corregido:
```typescript
service:services!appointments_service_id_fkey(id, name, duration_minutes, price),
location:locations!location_id(id, name, address),
business:businesses!appointments_business_id_fkey(id, name, email, phone)
```

## Patrón General

Cuando una tabla tiene **múltiples FKs al mismo target**, usar siempre hint `!column_name` o `!constraint_name` en PostgREST embedded resources.

```
tabla_origen:tabla_destino!nombre_columna_fk(campos...)
tabla_origen:tabla_destino!nombre_constraint_fk(campos...)
```

## Resultado

- HTTP 200 con soft-fail controlado  
- `"tokenSet": true` → token de confirmación guardado  
- `"emailError"` → Brevo 401 en test (esperado)  

## Relacionado

- [[send-appointment-confirmation]]
- Principio #14 CLAUDE.md: "Validar impacto en Edge Functions antes de alterar tablas"
- Mismo patrón aplica a cualquier tabla con FK duplicadas: `appointments` también tiene dos FK a `profiles` (`client_id`, `employee_id`) → ya resueltas con `profiles!client_id` y `profiles!employee_id`

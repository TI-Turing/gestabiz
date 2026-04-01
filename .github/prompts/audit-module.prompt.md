---
mode: agent
description: Audita un módulo de Gestabiz buscando violaciones de los patrones establecidos. Si no se especifica módulo, auditar los archivos con cambios recientes.
tools:
  - grep_search
  - read_file
  - semantic_search
  - get_errors
---

Audita un módulo de Gestabiz buscando violaciones de los patrones establecidos.

Si no se especifica módulo, auditar los archivos con cambios en git staging.

## Escanear en este orden

1. `useAuthSimple()` fuera de `src/hooks/auth` o `src/contexts/AuthContext.tsx` → debe ser `useAuth()`
2. `createClient(` fuera de `src/lib/supabase.ts` → cliente debe ser singleton
3. `appointment.client_name` / `appointment.client_email` / `appointment.service_name` → appointments no tiene columnas denormalizadas
4. `services!inner` en queries de calendarios o listados de citas → usar LEFT JOIN (`services (...)`)
5. `.eq('user_id'` en queries sobre `business_employees` → debe ser `employee_id`
6. En migraciones SQL: políticas RLS que hacen SELECT a la misma tabla que protegen
7. Columnas `role` / `user_role` en tablas de usuario → roles no se persisten en BD
8. Botones de acción sin `<PermissionGate>` → todos deben estar protegidos
9. `: any` o `as any` en TypeScript → cero `any` en el proyecto
10. Emojis en componentes UI → solo Phosphor Icons o Lucide React

## Para cada issue reportar

- Archivo y número de línea
- Código exacto problemático
- Fix concreto

## Formato de reporte

```
## Reporte QA — [módulo o scope]

### ✅ Sin issues / ⚠️ Issues encontrados: N

---

### Bug #1 — [Regla violada]
**Archivo:** `path/to/file.tsx:42`
**Código:** `[fragmento problemático]`
**Por qué es un bug:** [explicación]
**Fix:** `[código corregido]`

---

### Resumen
[conteo por categoría y veredicto]
```

Al final: veredicto — ✅ listo para commit / ⚠️ issues menores / ❌ bloqueante.

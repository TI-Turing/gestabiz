---
date: 2026-04-19
tags: [arquitectura, react-query, cache, performance, tanstack]
status: activo
---

# React Query Cache

Configuración centralizada de TanStack Query con 3 perfiles de cache (STABLE/FREQUENT/REALTIME) y query keys predefinidas para deduplication.

## Configuración Central

Archivo: `src/lib/queryConfig.ts`

### Perfiles de Cache

| Perfil | staleTime | gcTime | refetchOnWindowFocus | Uso |
|--------|-----------|--------|---------------------|-----|
| **STABLE** | 5 min | 24h | false | Negocios, servicios, categorías |
| **FREQUENT** | 1 min | 10 min | true | Citas, ausencias, permisos |
| **REALTIME** | 0 | 5 min | refetchInterval: 30s | Chat, notificaciones |

### Query Keys Predefinidas

```ts
QUERY_CONFIG.KEYS = {
  BUSINESS_EMPLOYEES(businessId),
  EMPLOYEE_ABSENCES(employeeId, businessId),
  VACATION_BALANCE(employeeId, businessId, year),
  PUBLIC_HOLIDAYS(country, year),
  IN_APP_NOTIFICATIONS(userId),
  EMPLOYEE_BUSINESSES(employeeId),
  COMPLETED_APPOINTMENTS(clientId),
  CLIENT_DASHBOARD(clientId, cityName, regionName),
}
```

## Deduplication

React Query deduplica queries con la misma key. Si 3 componentes usan `['service', serviceId]`, solo se hace 1 request.

## Patrón initialData

Cuando el padre ya tiene los datos (ej: de una lista), puede hidratar el cache del hijo:
```tsx
<ServiceCard serviceId={svc.id} initialData={svc} />
```
Esto evita re-fetch, pero React Query seguirá revalidando según el perfil.

## Optimizaciones Realizadas (Oct 2025)

| Hook refactorizado | Antes | Después | Ahorro |
|---------------------|-------|---------|--------|
| `useEmployeeBusinesses` | useState + useEffect (4+ duplicados) | useQuery (cache 5 min) | -3 a -4 requests |
| `useAdminBusinesses` | useState + useEffect (2-3 duplicados) | useQuery (cache 5 min) | -2 requests |
| `useInAppNotifications` | 5 queries separadas | 1 query base + filtros locales | -4 requests |

Resultado: sesión reducida de 150+ a 60-80 requests.

## Convenciones

- **Hooks**: Todos en `src/hooks/` con `useQuery`/`useMutation`
- **Keys**: Usar `QUERY_CONFIG.KEYS.*` predefinidas cuando existan
- **Invalidación**: `queryClient.invalidateQueries({ queryKey: [...] })` tras mutations
- **Prefetch**: Para datos que se necesitarán pronto (ej: `useBusinessTaxConfig` prefetches)

## GOTCHA

> React Query cache puede enmascarar bugs — siempre invalidar tras cambios de BD.
> En tests, verificar que invalidaciones funcionen correctamente.

## Archivos Clave

- `src/lib/queryConfig.ts` — Configuración central

## Notas Relacionadas

- [[stack-tecnologico]] — TanStack Query v5
- [[sistema-busqueda]] — RPCs con cache STABLE
- [[sistema-notificaciones]] — useInAppNotifications optimizado
- [[sistema-cards]] — Cards con self-fetch usando useQuery
- [[sistema-festivos]] — Cache 24h para festivos

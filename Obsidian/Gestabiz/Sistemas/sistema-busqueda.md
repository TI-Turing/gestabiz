---
date: 2026-04-19
tags: [sistema, busqueda, search, seo, postgresql, produccion]
status: completado
---

# Sistema de Búsqueda Avanzada

Full-text search con PostgreSQL, índices trigram GIN, 6 algoritmos de ordenamiento y geolocalización para descubrimiento de negocios, servicios y profesionales.

## Descripción

SearchBar en el header del cliente con debounce 300ms lanza búsquedas contra 3 RPCs de PostgreSQL optimizadas con full-text search (`tsvector`, `ts_rank`) e índices trigram GIN para búsqueda fuzzy tolerante a errores tipográficos. Rendimiento 40-60x más rápido que queries manuales.

## Flujo Principal

1. Cliente escribe en `SearchBar` (header) con debounce 300ms
2. Dropdown de tipo filtra: Negocios / Servicios / Profesionales
3. Queries RPC ejecutan búsqueda optimizada en PostgreSQL
4. `SearchResults` renderiza resultados con 6 algoritmos de ordenamiento
5. Click en resultado abre `BusinessProfile` (modal) o `UserProfile` (modal)

## 6 Algoritmos de Ordenamiento

| Algoritmo | Criterio | Uso |
|-----------|----------|-----|
| Relevancia | `ts_rank` de PostgreSQL full-text search | Búsquedas por texto |
| Rating | `average_rating` descendente | Mejores negocios |
| Proximidad | Distancia geográfica (haversine) | Negocios cercanos |
| Precio ↑ | Precio ascendente | Opciones económicas |
| Precio ↓ | Precio descendente | Servicios premium |
| Recientes | Fecha de creación | Negocios nuevos |

## Componentes Clave

| Componente | Ubicación | Función |
|-----------|-----------|---------|
| `SearchBar` | `src/components/client/` | Campo con debounce, dropdown de tipos |
| `SearchResults` | `src/components/client/` | Panel de resultados, 6 ordenamientos |
| `SearchResultCard` | `src/components/cards/` | Card de resultado individual |

## RPCs de PostgreSQL

- `search_businesses()` — Negocios con stats pre-calculados (average_rating, review_count, rank)
- `search_services()` — Servicios con ranking por relevancia
- `search_professionals()` — Profesionales con stats de `employee_ratings_stats`

## Índices de Base de Datos

- **Trigram GIN**: `gin(name gin_trgm_ops)` en businesses, services, profiles — búsqueda fuzzy
- **Full-text**: columnas `search_vector` con `tsvector`, índices GIN, triggers automáticos de actualización
- **Extensión**: `pg_trgm` habilitada en PostgreSQL

## Vistas Materializadas

- `business_ratings_stats` — Estadísticas de ratings por negocio
- `employee_ratings_stats` — Estadísticas de ratings por empleado
- Refresco: Edge Function `refresh-ratings-stats` ejecuta cada 5 min (cron) con CONCURRENTLY

## Hooks

- `useGeolocation()` — Solicitud de permisos de ubicación con manejo de errores
- `usePreferredCity(userId)` — Ciudad preferida persistida en localStorage

## Performance

- 40-60x más rápido que queries manuales
- Capacidad 10x mayor (100 → 1000 queries/seg)
- Migración: `20251012000000_search_optimization.sql` (362 líneas)
- Vistas materializadas pre-calculan stats (no se calculan on-the-fly)

## Archivos Clave

- `src/components/client/SearchBar.tsx`
- `src/components/client/SearchResults.tsx`
- `supabase/migrations/20251012000000_search_optimization.sql`
- `supabase/functions/refresh-ratings-stats/`

## Notas Relacionadas

- [[sistema-citas]] — Búsqueda alimenta paso 1 del AppointmentWizard
- [[sistema-perfiles-publicos]] — Perfiles públicos indexados complementan búsqueda interna
- [[sistema-reviews]] — Reviews alimentan ratings de vistas materializadas
- [[base-de-datos]] — Extensiones pg_trgm, índices GIN, vistas materializadas
- [[react-query-cache]] — Cache de resultados de búsqueda
- [[SEO-directorio-post-deploy]] — SEO y descubrimiento de negocios
- [[SEO-SEM-estrategia-2026]] — Estrategia SEO/SEM complementaria

---
date: 2026-04-25
tags: [catalogos, azure-functions, dotnet, infraestructura, ubicacion]
status: completed
---

# Catalog API (Azure Functions / .NET)

Gestabiz mantiene una **API auxiliar de catálogos** en .NET sobre Azure Functions, separada del backend principal de Supabase. Se encarga de servir datos estables y de lectura intensiva: países, regiones, ciudades, géneros, tipos de documento y EPS (Entidad Promotora de Salud, sistema colombiano).

## Por qué separada de Supabase

- **Cache CDN**: Azure Functions exponen los catálogos con headers de cache larga, sirviéndose desde el edge sin tocar la base de datos.
- **Aislamiento de carga**: el dropdown de "Selecciona tu ciudad" en el wizard de registro genera muchas requests; aislarlas evita saturar PostgreSQL.
- **Datos compartidos cross-app**: la misma API alimenta web, móvil y la extensión.

## Estructura del proyecto

`catalogs/` en la raíz del repo:

- `Entities/` — Clases C# de los modelos: `Pais`, `Region`, `Ciudad`, `Genero`, `TipoDocumento`, `EPS`.
- `Functions/` — HTTP-triggered Functions: `GetCountries`, `GetRegionsByCountry`, `GetCitiesByRegion`, `GetGenders`, `GetDocumentTypes`, `GetHealthInsurances`.
- `Seeds/` — JSON seed data inicial (catálogo colombiano completo: 32 departamentos, ~1100 municipios).

## Hooks del frontend

| Hook | Propósito |
|------|-----------|
| `useCatalogs()` | Carga inicial de catálogos generales con cache STABLE 24h |
| `useLocationNames(idsArray)` | Resuelve un batch de IDs (country_id, region_id, city_id) → nombres legibles. Usa un `nameCache` interno para evitar requests duplicadas |
| `useCountries()` / `useRegions(countryId)` / `useCities(regionId)` | Cascading dropdowns del wizard de registro y configuración |

## Default Bogotá

Por simplicidad de UX en el dashboard de cliente, **Bogotá está hardcodeada como ciudad default** en `src/constants/index.ts:174-178`:

```ts
DEFAULT_LOCATION: {
  COUNTRY_ID: 'co-uuid',
  REGION_ID: 'cundinamarca-uuid',
  CITY_ID: 'bogota-uuid',
  CITY_NAME: 'Bogotá',
}
```

Esto solo afecta el filtro inicial del dashboard; el usuario puede cambiar de ciudad y la preferencia se guarda en `usePreferredCity`.

## Endpoints

| Endpoint | Método | Cache |
|----------|--------|-------|
| `/api/catalogs/countries` | GET | 24h |
| `/api/catalogs/regions/{countryId}` | GET | 24h |
| `/api/catalogs/cities/{regionId}` | GET | 24h |
| `/api/catalogs/genders` | GET | 7d |
| `/api/catalogs/document-types/{countryId}` | GET | 7d |
| `/api/catalogs/health-insurances/{countryId}` | GET | 24h |

## Sincronización con Supabase

Los catálogos viven en Azure pero también hay una copia en Supabase (`countries`, `regions`, `cities`, etc.) para joins con `profiles`, `businesses`, `locations`. La sincronización es manual via `scripts/seed-prod-data.mjs` cuando se actualizan catálogos.

## Notas relacionadas

- [[stack-tecnologico]] — Azure Functions y .NET en el stack
- [[base-de-datos]] — Tablas de catálogo replicadas en Supabase
- [[sistema-citas]] — Wizard de registro usa catálogos

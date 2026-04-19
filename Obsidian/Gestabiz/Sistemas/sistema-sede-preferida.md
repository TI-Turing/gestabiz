---
date: 2026-04-19
tags: [sistema, sede-preferida, localstorage, produccion]
status: completado
---

# Sistema de Sede Preferida

Sede predeterminada por negocio almacenada en localStorage con pre-selección automática en múltiples módulos.

## Descripción

Hook `usePreferredLocation` permite al admin elegir una sede "administrada" que se pre-selecciona automáticamente en formularios de empleados, vacantes, ventas rápidas y reportes. NO se guarda en BD, solo en localStorage.

## Hook

`usePreferredLocation(businessId)` — 50 líneas:
- **Storage**: localStorage, key `preferred-location-${businessId}`
- **Retorna**: `{ preferredLocationId, setPreferredLocation, clearPreferred }`
- **Reset**: `value='all'` resetea a "Todas las sedes"

## Pre-selección Automática

| Módulo | Componente | Comportamiento |
|--------|-----------|---------------|
| Empleados | FiltersPanel | Filtra por sede preferida |
| Vacantes | CreateVacancy | Pre-selecciona solo en vacantes nuevas |
| Ventas Rápidas | QuickSaleForm | Doble cache (localStorage + React state) |
| Reportes | ReportsPage | Filtra reportes por sede |
| Configuraciones | CompleteUnifiedSettings | Campo "Sede Administrada" |

## Badge Visual

- `LocationsManager` muestra badge "Administrada" en la sede seleccionada
- Nombre de la sede aparece en header del admin

## Configuración

Se configura desde [[sistema-configuraciones|CompleteUnifiedSettings]] → tab "Preferencias del Negocio" → campo "Sede Administrada".

## Archivos Clave

- `src/hooks/usePreferredLocation.ts`

## Notas Relacionadas

- [[sistema-configuraciones]] — Configuración de sede administrada
- [[sistema-ventas-rapidas]] — Pre-selección con doble cache
- [[sistema-vacantes]] — Pre-selección en vacantes nuevas
- [[sistema-citas]] — Posible pre-selección en wizard

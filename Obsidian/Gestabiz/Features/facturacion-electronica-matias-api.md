---
date: 2026-04-12
tags: [feature, fase-2, facturación, integración, matias-api]
---

# Facturación Electrónica — Integración Matias API

## Resumen

En la **Fase 2** se integrará **Matias API** para permitir a los clientes de Gestabiz emitir facturas electrónicas directamente desde la plataforma.

## Contexto

- Esta funcionalidad no forma parte de la Beta actual (Fase 1 completada).
- Aplica al flujo de ventas y transacciones del negocio.
- Los clientes de Gestabiz (dueños de negocio) podrán facturar electrónicamente a sus propios clientes.

## Pendiente definir

- Alcance exacto: ¿facturación de citas, ventas rápidas, o ambas?
- Flujo de configuración: ¿el negocio ingresa sus credenciales de Matias API en Settings?
- Manejo de errores y reintentos de facturación
- Almacenamiento de facturas emitidas (nueva tabla o relación con `transactions`)
- Países soportados por Matias API (¿Colombia únicamente?)

## Archivos relevantes a futuro

- `src/components/admin/SalesHistoryPage.tsx` — punto de entrada probable
- `src/lib/services/` — agregar `invoicing.ts` como capa de servicio
- `src/components/settings/` — configuración de credenciales Matias API por negocio
- `supabase/functions/` — Edge Function para llamadas a Matias API (nunca exponer keys en frontend)

## Notas Relacionadas

- [[sistema-contable]] — Sistema contable actual (IVA/ICA/Retención)
- [[sistema-ventas-rapidas]] — Ventas rápidas (posible integración)
- [[edge-functions]] — Edge Functions de Supabase
- [[base-de-datos]] — Tablas de transacciones
- [[Fase 2 - Contabilidad, DIAN y App Móvil]] — Fase 2 incluye facturación
- [[analisis-competitivo-roadmap]] — Roadmap incluye facturación electrónica

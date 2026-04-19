---
date: 2026-04-19
tags: [sistema, contabilidad, impuestos, iva, ica, colombia, produccion]
status: completado
---

# Sistema Contable

Cálculo automático de IVA, ICA y Retención en la Fuente para Colombia con dashboard financiero, exportación PDF/CSV/Excel y charts interactivos.

## Descripción

Sistema contable completo orientado a PyMEs colombianas. Calcula automáticamente impuestos sobre transacciones, genera periodos fiscales y permite exportar reportes en múltiples formatos. Moneda: COP (pesos colombianos), formato miles: 1.000.000.

## Flujo Principal

1. Admin crea transacción (ingreso/egreso) en `EnhancedTransactionForm`
2. `useTaxCalculation` calcula automáticamente subtotal, IVA, ICA, Retención
3. Transacción guardada en `transactions` con campos fiscales
4. Dashboard financiero actualiza métricas en tiempo real
5. Admin exporta reportes a PDF/CSV/Excel

## Impuestos Automáticos

| Impuesto | Tasa típica | Tabla config |
|----------|-------------|-------------|
| IVA | 19% | `business_tax_config` |
| ICA | 0.414% - 1.104% | `business_tax_config` |
| Retención en la Fuente | 1% - 11% | `business_tax_config` |

## Componentes Clave

| Componente | Ubicación | Función |
|-----------|-----------|---------|
| `EnhancedFinancialDashboard` | `src/components/transactions/` | Dashboard con charts |
| `TransactionList` | `src/components/transactions/` | Lista de transacciones |
| `EnhancedTransactionForm` | `src/components/transactions/` | Formulario con impuestos auto |
| `TaxConfiguration` | `src/components/accounting/` | Config de impuestos del negocio |
| Charts (6) | `src/components/accounting/` | CategoryPie, EmployeeRevenue, IncomeVsExpense, LocationBar, MonthlyTrend, etc. |

## Tablas de Base de Datos

- `transactions` — Ingresos y egresos (type, category, amount, subtotal, tax_type, tax_rate, tax_amount, fiscal_period)
- `business_tax_config` — Config fiscal por negocio (IVA, ICA, Retención)
- `recurring_expenses` — Gastos recurrentes

## Hooks

- `useTransactions(businessId, filters)` — CRUD + filtros
- `useTaxCalculation(subtotal, taxConfig)` — Cálculo memoizado (78% menos código)
- `useBusinessTaxConfig(businessId)` — Cache React Query 1h TTL, prefetch
- `useFinancialReports(businessId, period)` — Reportes por periodo
- `useChartData(businessId)` — Datos para charts

## Exportación

- **PDF**: jspdf
- **CSV**: Export nativo
- **Excel**: xlsx (SheetJS)
- Toast notifications con sonner en 8 flujos

## Integración con Ventas Rápidas

Las ventas rápidas generan transacción automática:
- Tipo: `income`
- Categoría: `service_sale`
- Ver [[sistema-ventas-rapidas]]

## Permisos Requeridos

- `accounting.create` — Crear transacciones (proteger con [[sistema-permisos|PermissionGate]])
- `accounting.edit` — Editar transacciones
- `accounting.delete` — Eliminar transacciones
- `accounting.view_reports` — Ver reportes financieros
- `expenses.create` / `expenses.delete` — Gastos

## Performance

- 90% menos queries vs implementación original
- 60% carga más rápida con React Query cache 1h
- 80% menos cálculos innecesarios con useMemo

## Archivos Clave

- `src/components/transactions/EnhancedFinancialDashboard.tsx`
- `src/components/accounting/TaxConfiguration.tsx`
- `src/hooks/useTransactions.ts`
- `src/hooks/useTaxCalculation.ts`
- `src/hooks/useBusinessTaxConfig.ts`

## Notas Relacionadas

- [[sistema-ventas-rapidas]] — Ventas walk-in generan transacciones automáticas
- [[sistema-permisos]] — Permisos `accounting.*` y `expenses.*`
- [[sistema-billing]] — Facturación del SaaS (no confundir con contabilidad del negocio)
- [[Fase 2 - Contabilidad, DIAN y App Móvil]] — Roadmap facturación electrónica DIAN
- [[facturacion-electronica-matias-api]] — API de facturación electrónica

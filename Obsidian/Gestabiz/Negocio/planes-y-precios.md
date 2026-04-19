---
date: 2026-04-19
tags: [negocio, planes, precios, suscripcion, billing]
status: activo
---

# Planes y Precios

Modelo de suscripción freemium con 4 niveles. Actualmente solo Gratuito e Inicio están activos.

## Planes Disponibles

### Plan Gratuito — $0 COP/mes
**Límites**:
- 1 sede
- 1 empleado
- 3 citas/mes

**Funcionalidades incluidas**:
- Agenda básica de citas
- Perfil público del negocio (SEO)
- Notificaciones por email
- Chat con clientes
- Reviews y calificaciones
- Búsqueda en directorio

### Plan Inicio — $80.000 COP/mes ✅ Activo
**"Más Popular"** — El plan recomendado

**Incluye todo lo de Gratuito más**:
- Sedes ilimitadas
- Empleados ilimitados
- Citas ilimitadas
- Sistema de permisos granulares (ver [[sistema-permisos]])
- Sistema de ausencias y vacaciones (ver [[sistema-ausencias]])
- Ventas rápidas (ver [[sistema-ventas-rapidas]])
- Sistema contable con impuestos automáticos (ver [[sistema-contable]])
- Reclutamiento y vacantes (ver [[sistema-vacantes]])
- CRM de clientes (ver [[sistema-crm-clientes]])
- Reportes financieros
- Recordatorios multi-canal (Email + SMS + WhatsApp)
- Google Calendar sync
- Soporte prioritario

### Plan Profesional — Próximamente 🔒
*(Precio por definir)*

### Plan Empresarial — Próximamente 🔒
*(Precio por definir)*

## Moneda

Todos los precios en **COP (pesos colombianos)**. Formato: `$80.000` (separador de miles con punto).

## Gateways de Pago

| Gateway | Mercado | Estado |
|---------|---------|--------|
| Stripe | Global | ✅ Activo |
| PayU Latam | Colombia | ✅ Activo |
| MercadoPago | Argentina, Brasil, México, Chile | ✅ Activo |

Selección por variable: `VITE_PAYMENT_GATEWAY=stripe|payu|mercadopago`

## Implementación

- **Definición centralizada**: `src/lib/pricingPlans.ts`
- **Sistema completo**: ver [[sistema-billing]]
- **Edge Functions**: `create-checkout-session`, `manage-subscription`, webhooks por gateway

## Archivos Clave

- `src/lib/pricingPlans.ts` — Definición de planes
- `src/components/billing/` — UI de facturación

## Notas Relacionadas

- [[sistema-billing]] — Implementación técnica
- [[propuesta-de-valor]] — Pitch comercial
- [[comparativa-competidores]] — Ventaja competitiva
- [[sectores-y-casos-de-uso]] — Verticales atendidos

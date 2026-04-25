---
date: 2026-04-23
tags: [negocio, pricing, fase2, planes]
---

# Pricing Fase 2 — Planes por Sede y Empleado

> **Estado**: Pendiente para Fase 2. No implementar hasta tener 3+ clientes reales que validen la estructura.

## Modelo propuesto

Plan fijo mensual con cobro incremental por empleados/sedes adicionales. Sin comisión por cita (genera ansiedad y penaliza el crecimiento del cliente).

| Plan | Precio/mes (COP) | Sedes incluidas | Empleados incluidos |
|------|-----------------|-----------------|---------------------|
| Gratis | 0 | 1 | 2 |
| Básico | 80.000 | 1 | 3 |
| Pro | 220.000 | 3 | 10 |
| Enterprise | 400.000+ | Ilimitado | Ilimitado |

## Cobros incrementales

- Empleado adicional (Básico): +15.000 COP/mes
- Empleado adicional (Pro): +12.000 COP/mes
- Sede adicional (Pro): +40.000 COP/mes
- Enterprise: precio negociado directamente

## Por qué no comisión por cita

- Psicológicamente negativo: el cliente siente que paga más cuando le va bien
- Genera ansiedad y resentimiento
- Difícil de predecir para el cliente
- Fresha cobra % sobre pagos procesados (como datáfono), que es diferente — no aplica aquí

## Target por plan

- **Gratis**: barberías/negocios unipersonales que prueban la app → SEO + voz a voz
- **Básico**: barbería pequeña, 1 sede, 1-4 empleados
- **Pro**: cadenas de salones, clínicas, gimnasios, coworkings con 2-3 sedes
- **Enterprise**: franquicias, negocios grandes, precio negociado

## Infraestructura ya lista

- `PermissionGate` + `pricingPlans.ts` + 79 tipos de permisos ya soportan feature gating por plan
- Solo requiere redefinir qué features van en cada nivel — sin trabajo técnico mayor

## Próximo paso

Antes de implementar: validar con 2-3 clientes reales cuánto pagarían y qué features son innegociables para ellos.

---
*Relacionado*: [[sistema-billing]] | [[Índice]]

---
date: 2026-04-19
tags: [sistema, ventas, walk-in, admin, produccion]
status: completado
---

# Sistema de Ventas Rápidas

Registro de ventas walk-in (sin cita previa) con estadísticas en tiempo real e integración contable automática. Solo administradores.

## Descripción

Permite a administradores registrar ventas presenciales que no pasan por el flujo de citas. Los datos se guardan en `appointments` con un flag especial y generan una transacción contable automáticamente.

## Flujo Principal

1. Admin abre "Ventas Rápidas" desde sidebar
2. Llena formulario: cliente, servicio, sede (requerida), empleado (opcional), monto, método de pago
3. Sistema crea registro + transacción tipo `income`, categoría `service_sale`
4. Estadísticas se actualizan en tiempo real

## Componentes Clave

| Componente | Ubicación | Líneas | Función |
|-----------|-----------|--------|---------|
| `QuickSaleForm` | `src/components/sales/` | 410 | Formulario de venta rápida |
| `QuickSalesPage` | `src/pages/` | 304 | Layout con estadísticas |

## Datos Registrados

- Cliente: nombre, teléfono, documento, email
- Servicio seleccionado
- Sede (requerida, con cache de [[sistema-sede-preferida|sede preferida]])
- Empleado (opcional)
- Monto en COP
- Método de pago (efectivo, tarjeta, transferencia)
- Notas adicionales

## Estadísticas en Tiempo Real

- Ventas del día
- Ventas últimos 7 días
- Ventas últimos 30 días
- Formato: COP (pesos colombianos)
- Últimas 10 ventas registradas

## Integración Contable

Cada venta rápida genera automáticamente una transacción en el [[sistema-contable]]:
- `type: 'income'`
- `category: 'service_sale'`
- Campos fiscales calculados automáticamente

## Permisos Requeridos

- `sales.create` — Registrar ventas (proteger con [[sistema-permisos|PermissionGate]])

## Acceso

Solo administradores: AdminDashboard → sidebar `id: 'quickSales'`

## Archivos Clave

- `src/components/sales/QuickSaleForm.tsx`
- `src/pages/QuickSalesPage.tsx`

## Notas Relacionadas

- [[sistema-contable]] — Transacciones automáticas desde ventas
- [[sistema-sede-preferida]] — Sede preferida pre-seleccionada con doble cache
- [[sistema-permisos]] — Permiso `sales.create`
- [[crm-clientes]] — Clientes registrados en ventas rápidas aparecen en CRM

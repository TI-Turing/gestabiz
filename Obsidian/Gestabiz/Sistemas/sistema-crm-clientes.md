---
date: 2026-04-19
tags: [sistema, crm, clientes, admin, empleado, produccion]
status: completado
---

# CRM de Clientes

Vista centralizada de clientes del negocio con historial de citas, modal de perfil compartido y filtrado por nombre/email. Disponible para admin (todos los clientes) y empleado (mis clientes).

## Descripción

El CRM agrupa a los clientes que han tenido al menos una cita no cancelada en el negocio activo. Implementado en dos vistas: admin (ClientsManager) y empleado (EmployeeClientsPage), ambas compartiendo el componente `ClientProfileModal`.

## Flujo Principal (Admin)

1. Admin abre "Clientes" desde sidebar → `ClientsManager`
2. Query en dos pasos: `appointments` → `profiles`
3. Grid de cards con avatar, email, visitas, última visita
4. Buscar por nombre o email (filtro local)
5. Click en cliente → abre `ClientProfileModal`

## Flujo (Empleado)

1. Empleado abre "Mis Clientes" → `EmployeeClientsPage`
2. Filtra `employee_id = currentUser.id` en appointments
3. Mismo visual que admin pero acotado al empleado
4. Ordenado por cantidad de visitas completadas

## Componentes Clave

| Componente | Ubicación | Acceso |
|-----------|-----------|--------|
| `ClientsManager` | `src/components/admin/` | Sidebar admin `id: 'clients'` |
| `SalesHistoryPage` | `src/components/admin/` | Sidebar admin `id: 'sales'` |
| `EmployeeClientsPage` | `src/components/employee/` | Sidebar empleado `id: 'my-clients'` |
| `ClientProfileModal` | `src/components/admin/` | Compartido admin + empleado |

## ClientProfileModal

- **Props**: clientId, businessId, isOpen, onClose
- **Tabs**: "Información" (stats, primer/última visita) y "Historial (N)" (citas con servicio, fecha, estado, precio)
- **Datos**: profiles + appointments + services (two-step query)
- **Patrón**: Radix UI Dialog + Tabs

## Historial de Ventas (Admin)

`SalesHistoryPage` muestra citas con `status = 'completed'`:
- Filtro de rango: 7/30/90/365 días (default 30)
- Summary cards: total ventas, ingresos totales, promedio por cita
- Tabla: fecha, servicio, cliente (botón → ClientProfileModal), precio
- Click en cliente dentro de la tabla abre el modal

## GOTCHA CRÍTICO

> **`appointments` NO tiene columnas `client_name`, `client_email`** — siempre usar two-step query: fetch `client_id`/`service_id` → batch fetch `profiles`/`services`. Las columnas falsas solo existen en mock data.

## Tablas de Base de Datos

- `appointments` — client_id, employee_id, service_id, start_time, status, price
- `profiles` — full_name, email, avatar_url
- `services` — name, price (join separado vía service_id)

## Permisos Requeridos

- Acceso admin: cualquier admin del negocio
- Acceso empleado: solo sus propios clientes

## Archivos Clave

- `src/components/admin/ClientsManager.tsx`
- `src/components/admin/SalesHistoryPage.tsx`
- `src/components/admin/ClientProfileModal.tsx`
- `src/components/employee/EmployeeClientsPage.tsx`

## Notas Relacionadas

- [[sistema-citas]] — Citas son la fuente de datos del CRM
- [[sistema-ventas-rapidas]] — Ventas walk-in generan registros de clientes
- [[sistema-contable]] — Historial de ventas alimenta reportes financieros
- [[sistema-perfiles-publicos]] — Perfil público del negocio vs perfil privado del cliente

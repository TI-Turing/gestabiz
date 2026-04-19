---
date: 2026-04-19
tags: [sistema, configuraciones, settings, admin, empleado, cliente, produccion]
status: completado
---

# Configuraciones Unificadas

Componente único `CompleteUnifiedSettings` que agrupa TODAS las configuraciones de los 3 roles (Admin/Employee/Client) en un solo lugar con 4 pestañas.

## Descripción

En lugar de tener 3 páginas de configuración separadas, todo se unificó en `CompleteUnifiedSettings.tsx` (1,448 líneas). Las 3 primeras pestañas son comunes a todos los roles; la 4ta es específica.

## Estructura de Tabs

### Tabs comunes (todos los roles)
1. **Ajustes Generales** — Idioma, zona horaria, moneda
2. **Perfil** — Nombre, email, teléfono, avatar
3. **Notificaciones** — Canales activos, tipos de notificación

### Tab específico por rol

| Rol | Tab 4 | Contenido |
|-----|-------|-----------|
| Admin | Preferencias del Negocio | Info, contacto, dirección, legal, operaciones, sede administrada |
| Employee | Preferencias de Empleado | Horarios 7 días, salarios, especializaciones, toggle `allow_client_messages` |
| Client | Preferencias de Cliente | Anticipación, pago preferido, historial |

## Toggle de Mensajes (Employee)

El toggle `allow_client_messages` controla si el empleado acepta mensajes de clientes:
- Campo: `business_employees.allow_client_messages` (BOOLEAN, DEFAULT true)
- Impacto: Si desactivado, empleado NO aparece en [[sistema-chat|ChatWithAdminModal]]
- Hook de filtrado: `useBusinessEmployeesForChat`

## Sede Administrada (Admin)

Campo "Sede Administrada" permite al admin elegir su sede preferida:
- Usa hook `usePreferredLocation` — ver [[sistema-sede-preferida]]
- Badge "Administrada" en LocationsManager
- Opción "Todas las sedes" para resetear

## Componentes que lo usan

- `AdminDashboard` → settings
- `EmployeeDashboard` → settings
- `ClientDashboard` → settings

## Permisos Requeridos

- `settings.edit` — Editar configuraciones propias
- `settings.edit_business` — Editar configuraciones del negocio (solo admin)

## Archivos Clave

- `src/components/settings/CompleteUnifiedSettings.tsx` (1,448 líneas)

## Notas Relacionadas

- [[sistema-chat]] — Toggle allow_client_messages afecta visibilidad en chat
- [[sistema-sede-preferida]] — Sede administrada configurada aquí
- [[sistema-ausencias]] — Horarios de empleado configurados aquí
- [[sistema-permisos]] — Permisos `settings.*`
- [[sistema-notificaciones]] — Preferencias de canales configuradas aquí
- [[sistema-autenticacion]] — Perfil de usuario editado aquí

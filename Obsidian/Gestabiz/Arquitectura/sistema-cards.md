---
date: 2026-04-19
tags: [arquitectura, cards, componentes, reutilizable, self-fetch]
status: activo
---

# Sistema de Cards Reutilizables

Componentes de card self-fetch por ID ubicados en `src/components/cards/`. NUNCA renderizar cards inline con `<Card>` genérico.

## Regla Fundamental

> **TODOS los cards de entidades DEBEN ser componentes independientes en `src/components/cards/`.**
> **NUNCA** renderizar inline usando `<Card>` de Radix UI directamente para mostrar entidades.

## Patrón Self-Fetch

Cada card recibe **solo el ID** y consulta datos internamente:

```tsx
// ✅ CORRECTO
<ServiceCard serviceId="abc-123" readOnly />

// ❌ INCORRECTO — pasar data props
<ServiceCard service={{ id: 'abc-123', name: 'Corte' }} />

// ❌ PROHIBIDO — inline con <Card> genérico
<Card><CardContent>{service.name}</CardContent></Card>
```

## Cards Registrados

| Componente | Entidad | Prop | Tabla |
|-----------|---------|------|-------|
| `ServiceCard` | Servicio | `serviceId` | `services` |
| `EmployeeCard` | Empleado | `employeeId` | `profiles` + `business_employees` |
| `LocationCard` | Sede | `locationId` | `locations` |
| `BusinessCard` | Negocio | `businessId` | `businesses` |
| `ResourceCard` | Recurso físico | `resourceId` | `business_resources` |
| `AppointmentCard` | Cita | `appointmentId` | `appointments` |
| `ClientCard` | Cliente | `clientId` | `profiles` |
| `SearchResultCard` | Resultado búsqueda | props propias | — |

## Props Comunes

Todos los cards soportan:
- `readOnly?: boolean` — Solo lectura
- `isSelected?: boolean` — Estado visual de selección
- `onSelect?: (id: string) => void` — Callback de selección
- `onViewProfile?: (id: string) => void` — Abrir perfil/modal
- `isPreselected?: boolean` — Badge "Preseleccionado" (ver [[sistema-perfiles-publicos]])
- `className?: string` — Clases CSS adicionales
- `renderActions?: (id: string) => ReactNode` — Slot para inyectar botones (edit, delete)
- `initialData?: T` — Hidratar cache sin re-fetch (ver [[react-query-cache]])

## Implementación Interna (Patrón)

```tsx
export function ServiceCard({ serviceId, initialData, readOnly, renderActions }) {
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => fetchService(serviceId),
    initialData,
    staleTime: 5 * 60 * 1000,
    enabled: !!serviceId,
  });

  if (isLoading) return <ServiceCardSkeleton />;
  if (!service) return null;

  return (
    <div className="...">
      {/* Render */}
      {renderActions?.(serviceId)}
    </div>
  );
}
```

## Reglas de Implementación

1. **Antes de crear un card**: verificar si ya existe en `src/components/cards/`
2. **Self-fetch obligatorio**: useQuery con ID
3. **Cache**: staleTime 5 min (STABLE) para datos estables
4. **Loading**: Skeleton/shimmer (NO spinners)
5. **Error**: Fallback discreto si falla query
6. **Acciones**: Usar `renderActions` para inyectar botones sin modificar card
7. **Dedup**: Si padre tiene datos, usar `initialData` para evitar re-fetch

## Archivos Clave

- `src/components/cards/` — Todos los card components

## Notas Relacionadas

- [[react-query-cache]] — Cache con useQuery y initialData
- [[sistema-citas]] — AppointmentCard en wizard y calendarios
- [[sistema-crm-clientes]] — ClientCard en CRM
- [[sistema-modelo-flexible]] — ResourceCard para recursos físicos
- [[sistema-busqueda]] — SearchResultCard en resultados

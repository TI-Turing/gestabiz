# TL;DR - Filtrado de Servicios por Sede

## ¿Qué se arregló?

Cuando un administrador selecciona un profesional en el Calendario de Citas, ahora muestra **SOLO** los servicios que ese profesional ofrece en la **SEDE ESPECÍFICAMENTE SELECCIONADA**, no todos los que ofrece globalmente.

## ¿Cómo funciona?

### Antes (❌):
```
Profesional = "Juan" → Muestra TODOS sus servicios (10)
```

### Después (✅):
```
Profesional = "Juan" + Sede = "Aeropuerto" → Muestra SOLO sus servicios en Aeropuerto (3)
Profesional = "Juan" + Sede = "Centro" → Muestra SOLO sus servicios en Centro (5)
```

## ¿Qué cambió en el código?

**Archivo:** `src/components/admin/AppointmentsCalendar.tsx`

**3 cambios principales:**

1. **Línea 825-829**: Filtro empleado_servicios por `location_id`
```typescript
const selectedLocationId = filterLocation.length > 0 ? filterLocation[0] : null;
if (selectedLocationId) {
  employeeServicesQuery = employeeServicesQuery.eq('location_id', selectedLocationId);
}
```

2. **Línea 881-909**: Filtro servicios disponibles en la sede vía `location_services`
```typescript
const { data: locationServicesData } = await supabase
  .from('location_services')
  .select('service_id')
  .eq('location_id', selectedLocationId);

const availableServiceIds = locationServicesData.map(ls => ls.service_id);
servicesQuery = servicesQuery.in('id', availableServiceIds);
```

3. **Línea 925**: Actualizar dependencias del effect
```typescript
}, [user, propBusinessId, filterLocation]); // Agregado filterLocation
```

## ¿Cómo lo valido en el navegador?

1. Abre "Citas" (ya está abierto)
2. Abre el panel "Filtros"
3. Selecciona "Empleado Aplicante 1"
4. Selecciona "Sede Aeropuerto"
5. ✅ Deberías ver **3 servicios**: Habitación Doble, Ejecutiva, Sencilla
6. Cambia a "Sede Centro"
7. ✅ Deberías ver **0 servicios** (no ofrece servicios allí)

## ¿Qué tablas de Supabase usamos?

- `employee_services`: Relaciona empleado + servicio + **sede**
- `location_services`: Define servicios disponibles por sede

## ¿Hay riesgo de romper algo?

**NO**. El cambio es 100% compatible:
- Si no selecciona sede → Muestra todos los servicios (como antes)
- Si no selecciona profesional → Muestra servicios de la sede
- Todos los demás filtros funcionan igual

## Documentación completa

Ver: `docs/RESUMEN_FINAL_FILTRADO_SERVICIOS_POR_SEDE.md`
Ver: `docs/EXPLICACION_RELACION_SERVICIOS_SEDE.md`

---

**Estado:** ✅ IMPLEMENTADO Y VALIDADO

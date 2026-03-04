# Explicación: Relación entre Servicios, Profesionales y Sedes

## Problema Original

Cuando un administrador selecciona un profesional (empleado) en el Calendario de Citas, se mostraban **TODOS los servicios que ese profesional ofrece en el negocio**, sin importar la sede seleccionada.

**Esperado**: Mostrar solo los servicios que el profesional ofrece **en la sede específicamente seleccionada**.

---

## Estructura de Datos en Supabase

### Tabla: `services`
```
id         | name              | business_id | price
-----------|-------------------|-------------|-------
uuid-1     | Yoga Yin          | negocio-A   | 50000
uuid-2     | Mesa VIP 4 Pers.  | negocio-A   | 200000
uuid-3     | Suite Presidencial| negocio-A   | 300000
```

### Tabla: `locations` (Sedes)
```
id         | name              | business_id
-----------|-------------------|------------
sede-aero  | Sede Aeropuerto   | negocio-A
sede-centro| Sede Centro       | negocio-A
```

### Tabla: `location_services` (Servicios por Sede)
⚠️ **ESTA ES LA CLAVE** - Define qué servicios están disponibles en cada sede.

```
id       | location_id | service_id
---------|-------------|----------
link-1   | sede-aero   | uuid-1    (Yoga Yin en Aeropuerto)
link-2   | sede-aero   | uuid-2    (Mesa VIP en Aeropuerto)
link-3   | sede-centro | uuid-1    (Yoga Yin en Centro)
link-4   | sede-centro | uuid-3    (Suite en Centro)
```

### Tabla: `employee_services` (Servicios por Profesional)
⚠️ **ANTES DEL FIX**: No filtraba por `location_id`
⚠️ **DESPUÉS DEL FIX**: Ahora tiene `location_id` para filtrar por sede

```
id       | employee_id | service_id | business_id | location_id
---------|-------------|------------|-------------|-------------
emp-1    | prof-A      | uuid-1     | negocio-A   | sede-aero
emp-2    | prof-A      | uuid-2     | negocio-A   | sede-aero
emp-3    | prof-A      | uuid-3     | negocio-A   | sede-centro
```

---

## Relaciones Complejas

### Escenario: "Mostrar servicios del Prof-A en Sede Aeropuerto"

**ANTES (❌ INCORRECTO)**:
```typescript
// Carga TODOS los servicios del profesional en el negocio
SELECT service_id FROM employee_services 
WHERE employee_id = 'prof-A' AND business_id = 'negocio-A'

// Resultado: uuid-1, uuid-2, uuid-3 (TODOS los servicios)
```

**DESPUÉS (✅ CORRECTO)**:
```typescript
// Carga SOLO los servicios del profesional EN ESA SEDE
SELECT service_id FROM employee_services 
WHERE employee_id = 'prof-A' 
  AND business_id = 'negocio-A'
  AND location_id = 'sede-aero'

// Resultado: uuid-1, uuid-2 (solo servicios en Aeropuerto)
```

---

## Implementación en AppointmentsCalendar.tsx

### 1. Obtener servicios del profesional (FILTRADO POR SEDE)

```typescript
// Lines 825-835
const selectedLocationId = filterLocation.length > 0 ? filterLocation[0] : null;

let employeeServicesQuery = supabase
  .from('employee_services')
  .select('employee_id, service_id, services(name)');

if (employeeIds.length > 0) {
  employeeServicesQuery = employeeServicesQuery.in('employee_id', employeeIds);
  
  // 🔑 NUEVO: Filtrar por location_id si se selecciona una sede
  if (selectedLocationId) {
    employeeServicesQuery = employeeServicesQuery.eq('location_id', selectedLocationId);
  }
}

const { data: employeeServicesData } = await employeeServicesQuery;
```

### 2. Obtener servicios disponibles en la SEDE

```typescript
// Lines 879-899
// Si se selecciona sede, filtrar servicios disponibles en esa sede
if (selectedLocationId) {
  const { data: locationServicesData } = await supabase
    .from('location_services')
    .select('service_id')
    .eq('location_id', selectedLocationId);

  const availableServiceIds = (locationServicesData || [])
    .map(ls => ls.service_id);
  
  // Solo mostrar servicios disponibles en esa sede
  if (availableServiceIds.length > 0) {
    servicesQuery = servicesQuery.in('id', availableServiceIds);
  } else {
    setServices([]);
    return;
  }
}
```

### 3. Actualizar dependencias del Effect

```typescript
// Line 925 - Cuando cambia filterLocation, se recarga todo
useEffect(() => {
  fetchData();
}, [user, propBusinessId, filterLocation]); // ✅ Agregado filterLocation
```

---

## Casos de Uso

### Caso 1: Sin sede seleccionada
- Mostrar TODOS los servicios del profesional en el negocio
- `filterLocation = []` → `selectedLocationId = null` → Sin filtro

### Caso 2: Una sede seleccionada (Ej: Aeropuerto)
- Mostrar SOLO servicios del profesional en Aeropuerto
- `filterLocation = ['sede-aero']` → Filtrar `employee_services` donde `location_id = 'sede-aero'`

### Caso 3: Múltiples sedes (futuro)
- Actualmente solo soporta una sede
- `filterLocation = ['sede-aero', 'sede-centro']` → Usar `in()` para múltiples IDs

---

## Testing

Para verificar que funciona correctamente:

1. **Abre Calendario de Citas** (Admin → Citas)
2. **Selecciona un profesional** (Ej: "Empleado Aplicante 11")
   - Verás TODOS sus servicios (18 en el ejemplo)
3. **Selecciona una sede** (Ej: "Sede Aeropuerto")
   - Los servicios deben actualizarse automáticamente
   - Deberías ver SOLO los servicios que ofrece en esa sede
4. **Cambia de sede**
   - Los servicios se actualizan en tiempo real
5. **Limpia el filtro de sede**
   - Vuelven a aparecer TODOS los servicios

---

## Ventajas de este Approach

✅ **Consistente con la BD**: Usa `location_services` que es la fuente de verdad  
✅ **Performance**: Filtra a nivel SQL, no en JavaScript  
✅ **Escalable**: Funciona con cualquier número de sedes  
✅ **Real-time**: Reacciona automáticamente a cambios de sede  
✅ **Seguro**: No muestra servicios no disponibles en la sede

---

## Relación Visual

```
┌─────────────────────────────────────────────────────┐
│ NEGOCIO: Hotel Boutique                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  SEDE AEROPUERTO              SEDE CENTRO          │
│  ├─ Yoga Yin                  ├─ Yoga Yin         │
│  ├─ Mesa VIP 4 Pers.          └─ Suite Presid.    │
│  └─ Habitación Doble                              │
│                                                     │
│  PROFESIONAL A (Empleado Aplicante 11)             │
│  ├─ Ofrece en Aeropuerto:                          │
│  │  ├─ Yoga Yin                                    │
│  │  └─ Mesa VIP 4 Pers.                            │
│  └─ Ofrece en Centro:                              │
│     ├─ Yoga Yin                                    │
│     └─ Suite Presidencial                          │
│                                                     │
└─────────────────────────────────────────────────────┘

✅ CUANDO SELECCIONA AEROPUERTO:
   Muestra: Yoga Yin, Mesa VIP 4 Pers.
   Oculta: Suite Presidencial

✅ CUANDO SELECCIONA CENTRO:
   Muestra: Yoga Yin, Suite Presidencial
   Oculta: Mesa VIP 4 Pers.
```

---

## Conclusión

La relación correcta es:
1. **Profesional** (employee) → Ofrece múltiples servicios
2. **Sede** (location) → Tiene múltiples servicios disponibles
3. **employee_services** → Relaciona profesional + servicio + **SEDE**
4. **location_services** → Define qué servicios están en qué sede

El filtro debe considerar **la intersección** de:
- Servicios que el profesional ofrece EN ESA SEDE (employee_services + location_id)
- Servicios disponibles EN ESA SEDE (location_services)

De esta forma se garantiza que el profesional pueda ofrecer el servicio en esa ubicación específica.

# Pruebas E2E Funcionales - Marzo 2026

> **Fecha de ejecución**: 7-8 de marzo de 2026  
> **Método**: Pruebas funcionales a través de la UI usando Chrome DevTools MCP  
> **Ambiente**: localhost:5173 (Vite dev server)  
> **Estado**: 11/11 flujos ejecutados + gaps completados (8 mar)  
> **Hallazgos**: 18 bugs documentados (6 corregidos, 12 pendientes)

---

## 1. Usuarios de Prueba

| # | Rol | Nombre | Email | Contraseña | UUID |
|---|-----|--------|-------|-----------|------|
| 1 | Owner 1 | Carlos Dueño Múltiple | e2e.owner1@test.gestabiz.com | E2eOwner1Pass!2026 | a9e74e37-9c08-4068-926d-bd7ec7fed4a3 |
| 2 | Owner 2 | María Empresaria García | e2e.owner2@test.gestabiz.com | E2eOwner2Pass!2026 | 8c2aaa47-d641-4dbe-98de-c67a758711e0 |
| 3 | Employee 1 | Juan Estilista López | e2e.employee1@test.gestabiz.com | E2eEmpl1Pass!2026 | 964a9927-0650-4019-a2ab-aa15a96567b0 |
| 4 | Employee 2 | Ana Terapeuta Pérez | e2e.employee2@test.gestabiz.com | E2eEmpl2Pass!2026 | 0fcc7099-1b98-4a03-b209-c98c0cfd41c7 |
| 5 | Employee 3 | Diego Entrenador Ruiz | e2e.employee3@test.gestabiz.com | E2eEmpl3Pass!2026 | ac3eb616-3743-4c65-9a07-4d9318b9d3a8 |
| 6 | Client 1 | Laura Cliente Martínez | e2e.client1@test.gestabiz.com | E2eClient1Pass!2026 | — |
| 7 | Client 2 | Pedro Cliente Sánchez | e2e.client2@test.gestabiz.com | E2eClient2Pass!2026 | — |
| 8 | Client 3 | Sofía Cliente Rodríguez | e2e.client3@test.gestabiz.com | E2eClient3Pass!2026 | — |

---

## 2. Negocios Creados

| # | Nombre | Categoría | Modelo | Ciudad | Owner | Sede | UUID Negocio | UUID Sede |
|---|--------|-----------|--------|--------|-------|------|-------------|-----------|
| 1 | Belleza Total E2E | Belleza y Estética | professional | Bogotá | Carlos | Sede Principal Bogotá | 42e3a0f4-ab8d-443c-86af-b7e1fc34893c | 47f55465-de7c-46ad-ae83-8e6dc0584609 |
| 2 | DeporteMax E2E | Deportes y Fitness | hybrid | Medellín | Carlos | Sede Medellín | 6f106654-bfea-4e23-ae64-da60be000bbb | 9264628b-15bb-4ba6-a76e-f9c37ffc63a6 |
| 3 | Sonrisa Perfecta E2E | Odontología | professional | Cali | María | Sede Cali Centro | da3429f9-ae52-4983-8838-636bbda66d8c | 4991f080-72cd-4b72-b551-199a8e8ee4fb |
| 4 | WorkHub E2E | Co-working | hybrid | Barranquilla | María | Sede Barranquilla | b526f0ae-a0ca-4b54-838b-3af5836c514a | 23cd540d-75e1-4b17-a995-57a0cc4fe206 |

### Servicios por Negocio

| Negocio | Servicio | Precio (COP) | Duración |
|---------|----------|-------------|----------|
| Belleza Total E2E | Corte de Cabello | $35,000 | 45 min |
| Belleza Total E2E | Manicure Completa | $25,000 | 60 min |
| Belleza Total E2E | Tinte y Color | $80,000 | 90 min |
| DeporteMax E2E | Alquiler Cancha Fútbol | $120,000 | 60 min |
| DeporteMax E2E | Cancha de Tenis | $80,000 | 60 min |
| Sonrisa Perfecta E2E | Limpieza Dental | $50,000 | 45 min |
| Sonrisa Perfecta E2E | Blanqueamiento Dental | $180,000 | 90 min |
| WorkHub E2E | Escritorio Compartido | — | — |
| WorkHub E2E | Sala de Reuniones | — | — |

### Asignación Empleados

| Empleado | Negocio | Sede | Servicios Asignados | Supervisor |
|----------|---------|------|---------------------|------------|
| Juan Estilista López | Belleza Total E2E | Sede Principal Bogotá | Corte, Manicure, Tinte | Carlos (Owner) |
| Ana Terapeuta Pérez | Sonrisa Perfecta E2E | Sede Cali Centro | Limpieza Dental, Blanqueamiento | María (Owner) |
| Diego Entrenador Ruiz | DeporteMax E2E | Sede Medellín | Cancha Fútbol, Cancha Tenis | Carlos (Owner) |

---

## 3. Ejecución de Flujos

### Flujo 1: Creación de Negocios con Servicios y Sedes ✅ COMPLETADO

- [x] Crear 4 negocios de diferentes tipos
- [x] Agregar sedes/ubicaciones a cada negocio
- [x] Agregar servicios con precios y duraciones
- [x] Verificar `is_configured = true` en 3 negocios (WorkHub queda sin empleado asignado → `is_configured = false`)

**Resultado**: 4 negocios creados exitosamente. 3/4 con `is_configured = true`.

### Flujo 2: Vacantes Laborales ✅ COMPLETADO

- [x] Abrir vacantes en Belleza Total, DeporteMax y Sonrisa Perfecta
- [x] Verificar que aparezcan en marketplace de vacantes

**Resultado**: 3 vacantes creadas y visibles. Se encontraron H-E2E-002 (UUID en cards) y H-E2E-003 (infinite render loop).

### Flujo 3: Aplicaciones a Vacantes ✅ COMPLETADO

- [x] Juan aplica a Belleza Total → Aceptado
- [x] Ana aplica a Sonrisa Perfecta → Aceptada
- [x] Diego aplica a DeporteMax → Aceptado
- [x] Empleados configurados con supervisores, sedes y servicios
- [x] **(8 mar)** Juan aplica a WorkHub E2E "Recepcionista Co-working" → $1,700,000, disponibilidad 01/04/2026
- [x] **(8 mar)** María rechaza aplicación de Juan en WorkHub E2E → Rechazo SIN razón: exitoso. Rechazo CON razón: **FALLA SILENCIOSAMENTE** (H-E2E-016)

**Resultado**: 3 empleados contratados + 1 aplicación rechazada. Se encontraron H-E2E-004, H-E2E-005, H-E2E-016 (rechazo con razón falla por columna inexistente).

### Flujo 4: Citas ✅ COMPLETADO (+ gaps 8 mar)

| Cliente | Negocio | Servicio | Profesional | Fecha | Hora | Precio | Estado |
|---------|---------|----------|-------------|-------|------|--------|--------|
| Laura | Belleza Total E2E | Corte de Cabello | Juan | 9 Mar 2026 (Lun) | 10:00–10:45 | $35,000 | Completada |
| Pedro | DeporteMax E2E | Cancha Fútbol | Diego | 10 Mar 2026 (Mar) | 14:00–15:00 | $120,000 | Completada |
| Sofía | Sonrisa Perfecta E2E | Limpieza Dental | Ana | 11 Mar 2026 (Mié) | 11:00–11:45 | $50,000 | Completada |
| Laura | Sonrisa Perfecta E2E | Blanqueamiento Dental | Ana | 12 Mar 2026 (Jue) | 14:00–15:30 | $180,000 | **CANCELADA** (8 mar) |
| Laura | Sonrisa Perfecta E2E | Limpieza Dental | Ana | 20 Mar 2026 (Vie) | 10:00–10:45 | $50,000 | Pendiente (8 mar) |

#### Cancelación de Cita (8 mar) ✅
- Laura creó cita de Blanqueamiento Dental → $180,000 → 12 Mar 14:00
- Abrió detalle → "Cancelar Cita" → `window.confirm` → Cita cancelada exitosamente
- Verificado en BD: `status = 'cancelled'`

#### Modificación/Reprogramación de Cita (8 mar) ❌ NO EXISTE
- El detalle de cita solo muestra: "Chatear con el profesional", "Cancelar Cita", "Cerrar"
- **No hay botón de "Modificar" ni "Reprogramar"** → Documentado como H-E2E-018

**Resultado**: 3 citas iniciales + 1 cancelada + 1 nueva. Se encontraron H-E2E-007, H-E2E-009, H-E2E-018 (sin UI para modificar citas).

### Flujo 5: Validar Ingresos en Reportes ✅ COMPLETADO

| Negocio | Servicio Completado | Precio Base | IVA 19% | Ingreso Total |
|---------|-------------------|-------------|---------|---------------|
| Belleza Total E2E | Corte de Cabello | $35,000 | $6,650 | **$41,650** |
| DeporteMax E2E | Cancha Fútbol | $120,000 | $22,800 | **$142,800** |
| Sonrisa Perfecta E2E | Limpieza Dental | $50,000 | $9,500 | **$59,500** |

**Flujo por negocio**: Calendario → Clic en cita → Confirmar → Marcar Completada → Verificar en Reportes.

**Resultado**: Todas las citas completadas generaron transacciones correctas con IVA 19%.

### Flujo 6: Ventas Rápidas ✅ COMPLETADO

**Negocio**: Sonrisa Perfecta E2E (como María, admin)

| Campo | Valor |
|-------|-------|
| Cliente | Carmen Walk-in Test |
| Teléfono | 3001234567 |
| Servicio | Blanqueamiento Dental |
| Monto | $180,000 |
| Sede | Sede Cali Centro |
| Empleado | Ana Terapeuta Pérez |
| Método de pago | Efectivo |

**Resultado**: Toast "Venta registrada exitosamente - Carmen Walk-in Test - $180,000". Estadísticas actualizadas: Ventas Hoy/7 Días/30 Días = $180,000. Reportes actualizados: Ingresos $239,500, Ganancia Neta $239,500, Margen 100%.

### Flujo 7: Terminación de Empleo ❌ NO POSIBLE

**Negocio**: Sonrisa Perfecta E2E

- [x] Navegar a Empleados → 2 empleados visibles (María como manager, Ana como subordinada)
- [x] Expandir árbol jerárquico → Ana visible
- [x] Abrir menú contextual (tres puntos) de Ana
- [ ] ~~Buscar opción "Terminar empleo" o "Desactivar"~~ **NO EXISTE**

**Opciones disponibles en menú contextual**: "Ver Perfil", "Editar", "Asignar Supervisor"  
**Opciones en dropdown de rol**: Owner, Admin, Manager, Lead, Staff (solo cambia nivel jerárquico)

**Resultado**: No existe UI para terminar/desactivar empleados. Documentado como H-E2E-010.

### Flujo 8: Chat ⚠️ PARCIAL → ⚠️ BUG CRÍTICO (actualizado 8 mar)

- [x] Abrir panel de chat (botón "Abrir chat") → Funcional, muestra "No hay conversaciones"
- [x] Clic en botón nuevo chat → El panel se cierra/togglea
- [x] Verificar como rol Client → Panel accesible pero vacío
- [x] **(8 mar)** Enviar mensaje desde detalle de cita → "Chatear con el profesional" → Chat con Ana abierto
- [x] **(8 mar)** Mensaje enviado: "Hola Ana, confirmo mi cita de Limpieza Dental del 20 de marzo a las 10 AM. Gracias!"
- [x] **(8 mar)** Mensaje visible en UI ✅
- [ ] **(8 mar)** Mensaje **NO PERSISTIDO** en BD → **H-E2E-017** ❌

**Verificación BD (8 mar)**:
- `conversations` tabla: **0 registros** (vacía)
- `messages` tabla: **0 registros** (vacía)
- `chat_participants` tabla: **20 registros huérfanos** (apuntan a conversation IDs inexistentes)

**Resultado**: La UI muestra mensajes en la sesión, pero al verificar en BD **no hay datos persistidos**. Los mensajes solo existen en memoria React y se pierden al refrescar. Bug crítico: H-E2E-017.

### Flujo 9: Editar Información de Usuario ✅ COMPLETADO

**Usuario**: María Empresaria García (Owner 2)

- [x] Menú avatar → "Configuración" → 5 tabs visibles (General, Perfil, Notificaciones, Preferencias del Negocio, Zona de Peligro)
- [x] Tab "Perfil" → Campos editables: Nombre Completo, Nombre de Usuario, Teléfono, Correo
- [x] Agregar teléfono: 3009876543
- [x] Clic "Guardar Cambios" → Toast "Perfil actualizado exitosamente"

**Resultado**: Perfil editado correctamente. Cambios persistidos.

### Flujo 10: Gastos (Egresos) ✅ COMPLETADO

**Negocio**: Sonrisa Perfecta E2E (como María, admin)

| Campo | Valor |
|-------|-------|
| Categoría | Suministros |
| Monto | $75,000 |
| Sede | Sede Cali Centro |
| Descripción | Compra de materiales dentales E2E test |
| Método de pago | Transferencia |

**Resultado**: Toast "Egreso registrado exitosamente". Estadísticas Hoy/7 Días/Este Mes = $75,000. Reportes: Ingresos $239,500 | **Gastos $75,000** | Ganancia Neta $164,500 | **Margen 68.7%**.

### Flujo 11: Ausencias y Vacaciones ⚠️ PARCIAL (Solicitud OK, Aprobación/Rechazo FALLA, Slot Blocking OK)

#### 11a. Solicitud de Ausencia (como Ana, Employee 2) ✅

- [x] Login como Ana → Mis Ausencias → Balance: 15 días totales, 0 usados, 0 pendientes, 15 disponibles
- [x] Clic "Solicitar Ausencia" → Modal abierto con formulario
- [x] Tipo: Vacaciones (preseleccionado)
- [x] Fecha inicio: 16 de marzo de 2026 (lunes)
- [x] Fecha fin: 18 de marzo de 2026 (miércoles)
- [x] Razón: "Vacaciones programadas - Prueba E2E ausencia empleado"
- [x] Submit → Modal se cierra, solicitud visible en tab "Pendientes (1)"

**Verificación post-envío**:
- Tab "Pendientes (1)" ✅
- Tipo: Vacaciones ✅
- Fechas mostradas: 16 marzo 2026 - 18 marzo 2026 ✅
- Duración: 3 días ✅
- Razón visible ✅

**Hallazgos en modal de solicitud**:
- Múltiples claves i18n sin traducir (absences.vacationBalance, absences.daysAvailable, absences.absenceType, absences.startDate, absences.endDate, absences.labels.reasonRequired, absences.labels.notesLabel, absences.labels.cancelButton, absences.labels.submitButton, absences.types.vacation)
- **"NaN"** visible en el balance dentro del modal
- **"Días Inválidos"** warning mostrado con claves i18n sin traducir (absences.invalidDays.message, absences.invalidDays.instruction) — NO bloquea el envío
- El formulario muestra "absences.daysRequested: **2**" pero la solicitud registrada dice **3 días** (inconsistencia en cálculo)
- Balance "Días Pendientes" permanece en 0 después de enviar solicitud (no se actualiza)

#### 11b. Aprobación de Ausencia (como María, Admin) ❌ FALLA

- [x] Login como María → Cambiar a Sonrisa Perfecta E2E → Ausencias
- [x] Vista: Tab "Pendientes (1)" con solicitud de Ana
- [x] Card muestra:
  - Empleado: Ana Terapeuta Pérez
  - Tipo: Vacaciones
  - Fechas: **15 de marzo - 17 de marzo, 2026** (⚠️ -1 día respecto a vista empleado)
  - 3 días
  - Razón correcta
  - Botones: "Agregar Nota", "Aprobar", "Rechazar"
- [ ] Clic "Aprobar" → **SIN EFECTO** (múltiples intentos)
  - No hay toast de confirmación
  - No hay cambio en UI
  - No se registra llamada de red a Edge Function `approve-reject-absence`
  - Solo errores 400 pre-existentes de `employee_requests` (bug no relacionado)

**Resultado**: Solicitud se envía correctamente desde empleado. **Aprobación/rechazo NO funciona** — el botón no ejecuta ninguna acción backend.

#### 11c. Rechazo de Ausencia (8 mar) ❌ FALLA (mismo bug que 11b)

- [x] Login como María → Sonrisa Perfecta E2E → Ausencias
- [x] Pendientes (1): Ana Terapeuta Pérez, Vacaciones, 15-17 marzo (offset -1d)
- [x] Clic "Rechazar" → **SIN EFECTO**
  - Contenido desaparece momentáneamente y reaparece
  - HTTP 400 en consola
  - Status sigue `pending` en BD
- [x] **Confirmación**: H-E2E-014 aplica TANTO a "Aprobar" como a "Rechazar" — ambos fallan con 400

#### 11d. Bloqueo de Slots por Ausencia Aprobada (8 mar) ✅ FUNCIONAL

**Procedimiento**: Se aprobó la ausencia directamente en BD para verificar bloqueo de slots en wizard.

- [x] UPDATE `employee_absences` SET `status = 'approved'` (ausencia 16-18 mar)
- [x] Login como María (rol Cliente) → Nueva Cita → Sonrisa Perfecta → Limpieza Dental → Ana
- [x] Calendario muestra:
  - **15 marzo**: `description="Vacaciones"` → **DISABLED** (offset -1 día = 16 mar real)
  - **16 marzo**: `description="Vacaciones"` → **DISABLED** (= 17 mar real)
  - **17 marzo**: `description="Vacaciones"` → **DISABLED** (= 18 mar real)
  - **18 marzo**: Habilitado (fuera del rango de ausencia)
- [x] Reverted: UPDATE `employee_absences` SET `status = 'pending'` (para no alterar estado de pruebas)

**Resultado**: El bloqueo de slots por ausencias aprobadas **FUNCIONA CORRECTAMENTE** ✅. Las fechas de ausencia aparecen deshabilitadas con tooltip "Vacaciones". El offset de -1 día (H-E2E-013) afecta las fechas mostradas pero el bloqueo es consistente.

---

## 4. Resumen Financiero Final

| Negocio | Ingresos Citas | Ventas Rápidas | Total Ingresos | Egresos | Ganancia Neta | Margen |
|---------|---------------|----------------|----------------|---------|--------------|--------|
| Belleza Total E2E | $41,650 | $0 | $41,650 | $0 | $41,650 | 100% |
| DeporteMax E2E | $142,800 | $0 | $142,800 | $0 | $142,800 | 100% |
| Sonrisa Perfecta E2E | $59,500 | $180,000 | $239,500 | $75,000 | $164,500 | 68.7% |
| **TOTAL** | **$243,950** | **$180,000** | **$423,950** | **$75,000** | **$348,950** | **82.3%** |

---

## 5. Registro de Hallazgos

| ID | Severidad | Módulo | Descripción | Estado |
|----|-----------|--------|-------------|--------|
| H-E2E-001 | Media | PermissionGate | Race condition: muestra "Sin permisos" por ~1 segundo después de crear negocio hasta que los permisos se propagan | Documentado |
| H-E2E-002 | Media | Vacantes (cards) | UUID de sede se muestra en lugar del nombre legible en las tarjetas de vacantes | **CORREGIDO** ✅ |
| H-E2E-003 | Crítica | CreateVacancy | "Maximum update depth exceeded" — loop infinito de renders al abrir formulario de crear vacante | **CORREGIDO** ✅ |
| H-E2E-004 | Media | Marketplace | Búsqueda de vacantes pasa searchQuery como filtro de ciudad, devuelve 0 resultados | **CORREGIDO** ✅ |
| H-E2E-005 | Media | ApplicationFormModal | UUID del negocio se muestra en el diálogo de confirmación de aplicación en vez del nombre | **CORREGIDO** ✅ |
| H-E2E-006 | Alta | Mis Empleos | "Mis Empleos" muestra 0 empleos a pesar de que el empleado fue contratado y tiene servicios asignados | **CORREGIDO** ✅ |
| H-E2E-007 | Alta | AppointmentWizard | Negocios E2E invisibles en wizard de citas — requirió configurar `preferred-city` en localStorage para resolver | Resuelto (workaround) |
| H-E2E-008 | Media | Direcciones | Direcciones de sedes muestran UUIDs en campos de ciudad/departamento en lugar de nombres legibles | Documentado |
| H-E2E-009 | Media-Alta | Calendario Admin | Filtros de servicio y sede vacíos ocultan TODAS las citas del calendario (lógica invertida: vacío = ocultar todo) | **CORREGIDO** ✅ |
| H-E2E-010 | Media | Empleados | No existe UI para terminar/desactivar empleados. El campo `is_active` existe en BD pero no hay botón para cambiarlo | Documentado (feature faltante) |
| H-E2E-011 | Alta | Ausencias (Modal) | Múltiples claves i18n sin traducir en formulario de solicitud de ausencia (~15 claves visibles como `absences.absenceType`, `absences.labels.*`, `absences.types.*`, etc.) | Documentado |
| H-E2E-012 | Media | Ausencias (Modal) | "NaN" se muestra en el balance de vacaciones dentro del modal de solicitud | Documentado |
| H-E2E-013 | Alta | Ausencias (Fechas) | Offset de -1 día entre vista empleado (16-18 mar) y vista admin (15-17 mar). Posible bug de timezone (UTC vs America/Bogota). Nota: 15 de marzo es domingo → fecha inválida | Documentado |
| H-E2E-014 | Crítica | Ausencias (Aprobación/Rechazo) | Botones "Aprobar" Y "Rechazar" en vista admin retornan HTTP 400 de edge function `approve-reject-absence`. No cambian estado. Ambos inoperativos. | Documentado |
| H-E2E-015 | Baja | Ausencias (Balance) | Balance de "Días Pendientes" no se actualiza tras enviar solicitud (permanece en 0 aunque haya 1 solicitud pendiente de 3 días) | Documentado |
| H-E2E-016 | Alta | Vacantes (Rechazo) | Rechazar aplicación CON razón falla silenciosamente. Código intenta setear `rejection_reason` en `job_applications` pero esa columna NO EXISTE (debería ser `decision_notes`). Sin razón, funciona. | Documentado (8 mar) |
| H-E2E-017 | Crítica | Chat (Persistencia) | Mensajes NO se persisten en BD. Tabla `conversations` vacía, `messages` vacía, `chat_participants` tiene 20 registros huérfanos. Mensajes solo existen en memoria React — se pierden al refrescar. | Documentado (8 mar) |
| H-E2E-018 | Media | Citas (Modificar) | No existe botón "Modificar" ni "Reprogramar" en detalle de cita del cliente. Solo opciones: "Chatear con el profesional", "Cancelar Cita", "Cerrar". Feature faltante. | Documentado (8 mar) |

### Hallazgos adicionales (sin numerar)

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| Supervisor Combobox | Combobox de supervisores vacío cuando empleados tienen `location_id = null` | **CORREGIDO** ✅ |
| Console Error | `profiles_1.name does not exist` en useEmployeeRequests.ts — error 400 continuos en cada carga de página | Documentado |
| DeporteMax modelo | `physical_resource` incompatible con configuración de solo empleados (sin recursos físicos) | **CORREGIDO** (cambiado a `hybrid`) |

---

## 6. Resumen Ejecutivo

### Estadísticas Generales
- **Flujos ejecutados**: 11/11 (100%) + gaps completados (8 mar)
- **Flujos completados exitosamente**: 8/11 (73%)
- **Flujos con fallas parciales**: 2/11 (Chat, Ausencias)
- **Flujos imposibles por feature faltante**: 1/11 (Terminación de empleo)
- **Hallazgos totales**: 18 numerados + 3 adicionales
- **Bugs corregidos durante testing**: 6
- **Bugs pendientes de corrección**: 12

### Clasificación de Bugs Pendientes

**Críticos (acción inmediata requerida)**:
- **H-E2E-014**: Botones "Aprobar" Y "Rechazar" ausencia retornan HTTP 400 — rompe por completo el flujo de gestión de ausencias
- **H-E2E-017**: Mensajes de chat NO se persisten en BD — datos se pierden al refrescar. Tabla `messages` y `conversations` vacías

**Altos (importantes para experiencia de usuario)**:
- **H-E2E-011**: Claves i18n sin traducir en módulo de ausencias — módulo inutilizable en español
- **H-E2E-013**: Fechas desfasadas -1 día entre vistas (timezone bug)
- **H-E2E-016**: Rechazo de aplicación con razón falla silenciosamente (columna `rejection_reason` no existe, debería ser `decision_notes`)

**Medios (afectan funcionalidad o estética)**:
- **H-E2E-001**: PermissionGate race condition
- **H-E2E-008**: UUIDs en direcciones
- **H-E2E-010**: Sin UI para desactivar empleados
- **H-E2E-012**: NaN en balance de vacaciones del modal
- **H-E2E-018**: Sin UI para modificar/reprogramar citas (feature faltante)
- Console error: `profiles_1.name does not exist`

**Bajos**:
- **H-E2E-015**: Balance "Días Pendientes" no se actualiza en tiempo real

### Módulos Estables (sin bugs detectados)
- Creación de negocios
- Creación de servicios y sedes
- Ventas Rápidas
- Egresos / Gastos
- Reportes financieros
- Configuración de perfil de usuario
- Completar citas y generación de transacciones con IVA
- **Cancelación de citas** ✅ (verificado 8 mar)
- **Bloqueo de slots por ausencias aprobadas** ✅ (verificado 8 mar, funciona con offset)

### Notas para el Equipo
1. El módulo de **Ausencias** necesita trabajo significativo antes de producción: i18n, timezone, aprobación/rechazo rotos (HTTP 400 de edge function)
2. La búsqueda de negocios en **rol cliente** tiene dependencia fuerte de `preferred-city` en localStorage
3. El **Chat** tiene bug crítico: mensajes no se persisten en BD. Tablas `conversations` y `messages` vacías, solo `chat_participants` tiene datos (20 registros huérfanos)
4. Los **UUIDs expuestos** en direcciones (H-E2E-008) son un problema cosmético de CitySelect que almacena `city.id` en vez de `city.name`
5. **(8 mar)** El rechazo de aplicaciones funciona SIN razón pero FALLA CON razón — verificar que `useJobApplications.ts` use `decision_notes` en vez de `rejection_reason`
6. **(8 mar)** No existe funcionalidad para **modificar/reprogramar citas** — el cliente solo puede cancelar y crear nueva

# PARTE 4: ROL ADMIN — PLAN BÁSICO (INICIO)

> Análisis exhaustivo. Generado por Claude Code — 2026-04-18.
> Para merge en Manual_Usuario_Gestabiz - copilot.docx y Propuesta_Valor_Gestabiz - copilot.docx.

---

## RESUMEN EJECUTIVO — Plan Básico

**Precio**: $89.900 COP/mes (o $899.000 anual = 10 meses pagando, 2 gratis)
**Para quién**: PyMEs en crecimiento con equipos pequeños, multi-sede inicial.
**Incluye todo lo del Plan Gratuito más:**
- Hasta 3 sedes (vs 1 en Gratuito)
- Hasta 6 empleados (vs 1 en Gratuito)
- Servicios, clientes y citas **ilimitados**
- Recordatorios por WhatsApp
- Sincronización con Google Calendar
- Ventas rápidas (walk-ins, cobro inmediato)
- Gestión de ausencias con aprobación
- Reportes visualizables (sin exportación)
- Contabilidad básica (ingresos/egresos automáticos por cita)
- Plantillas de permisos (Admin / Manager / Employee)

> [HIPERVÍNCULO AL DETALLE: Sección "Rol Admin Plan Básico — Detalle"]

---

## DETALLE EXHAUSTIVO — Plan Básico

### 1. Límites exactos del plan

| Recurso | Plan Gratuito | Plan Básico |
|---------|---------------|-------------|
| Sedes | 1 | **3** |
| Empleados (sin contar owner) | 0–1 | **6** |
| Citas/mes | 50 | **Ilimitado** |
| Clientes | 50 visibles | **Ilimitado** |
| Servicios | 15 | **Ilimitado** |
| WhatsApp recordatorios | ❌ | **✅** |
| Google Calendar sync | ❌ | **✅** |
| Ventas rápidas | ❌ | **✅** |
| Exportación de reportes | ❌ | ❌ (solo Pro) |
| Contabilidad fiscal (IVA/ICA) | ❌ | ❌ (solo Pro) |
| Recursos físicos | ❌ | ❌ (solo Pro) |
| Reclutamiento | ❌ | ❌ (solo Pro) |
| Permisos granulares (79) | ❌ | ❌ (solo Pro) |

### 2. Módulos del sidebar Admin — Plan Básico

| ID | Label | Icono | Descripción breve |
|----|-------|-------|-------------------|
| `overview` | Resumen | LayoutDashboard | KPIs + Health Checklist |
| `appointments` | Citas | Calendar | Calendario y gestión de citas |
| `absences` | Ausencias | CalendarOff | Aprobar/rechazar ausencias |
| `locations` | Sedes | MapPin | Hasta 3 sedes |
| `services` | Servicios | Briefcase | Servicios ilimitados |
| `employees` | Empleados | Users | Hasta 6 empleados |
| `clients` | Clientes | UserCheck | CRM ilimitado |
| `sales` | Ventas | BarChart3 | Historial de citas completadas |
| `quickSales` | Ventas Rápidas | ShoppingCart | Cobros walk-in |
| `reports` | Reportes | FileText | Visualización (sin export) |
| `billing` | Facturación | CreditCard | Plan, uso, pagos |
| `permissions` | Permisos | Shield | Plantillas predefinidas |

**Módulos BLOQUEADOS en Básico** (solo Pro): `expenses`, `recruitment`, `resources`.

### 3. Overview (Resumen)

**[SCREENSHOT: Admin Overview con KPI cards y Health Checklist]**

**KPI Cards:**
- Citas hoy / Citas del mes / Próximas / Completadas / Canceladas
- Total de sedes, servicios, empleados
- Ingresos del mes (suma de citas completadas)
- Valor promedio por cita

**Health Checklist** (hasta 5 alertas accionables):
- ⚠️ Servicios no asignados a sedes
- ⚠️ Servicios sin empleados asignados
- ⚠️ Empleados sin horario laboral
- ⚠️ Sedes sin servicios
- ⚠️ Empleados sin supervisor (solo si jerarquía activa)

Click en cada alerta → navega directamente al módulo correspondiente.

**Acciones rápidas:**
- **Ver perfil público** — preview de `/negocio/:slug`
- **Ver QR del negocio** — modal con QR para compartir

### 4. Citas (AppointmentsCalendar)

**[SCREENSHOT: Calendario admin con citas del día]**

**Vistas**: Mensual (default) · Semanal · Diaria.
**Filtros**: Sede (si hay >1), Empleado, Servicio, Estado.

**Por cita, modal de detalles con acciones:**
1. **Completar** — abre input opcional de propina → crea transacción de ingreso
2. **Cancelar** — requiere confirmación → status `cancelled`, envía email al cliente
3. **Marcar No Show** — status `no_show`
4. **Reenviar confirmación** — reenvía email con token
5. **Chat con cliente** — abre chat flotante (si cliente tiene perfil)

**Reglas de negocio críticas:**
- No permite crear cita en hora de almuerzo del empleado
- No permite crear cita en ausencia aprobada del empleado
- No permite crear cita en festivo si sede no atiende festivos
- La hora de almuerzo NO se aplica a fechas pasadas (evita ocultar históricas)
- Servicios eliminados → LEFT JOIN (no INNER), se siguen viendo en calendario

### 5. Sedes (LocationsManager)

**[SCREENSHOT: Listado de sedes con badge "Primaria"]**

**Límite**: 3 sedes. Al llegar al límite: banner "Has llegado al límite. Actualiza a Plan Pro para agregar más" con botón **Actualizar Plan**.

**Formulario de sede:**
- Nombre, dirección, ciudad (CitySelect), departamento, país
- Código postal, teléfono, email, descripción
- **Horarios por día** (opens_at / closes_at por cada día de la semana, toggle "Cerrado")
- **Atiende festivos**: toggle
- **Sede primaria**: solo una puede serlo (auto-switch)
- **Multimedia**: banner, galería, videos (YouTube URLs o upload)
- Coordenadas (lat/lng) auto-resueltas

**Validaciones:**
- No se puede eliminar si es la única sede
- Eliminar una sede con citas futuras → cancela las citas y notifica clientes
- Editar horarios con citas futuras fuera del nuevo rango → warning

### 6. Servicios (ServicesManager)

**Formulario:**
- Nombre, descripción, categoría, imagen
- Duración (min 15 minutos, default 60)
- Precio en COP (con formato de miles)
- **Comisión del empleado** (0–100%, opcional, solo visible si hay >1 empleado)
- **Asignación a sedes** (multi-select, mínimo 1)
- **Asignación a empleados** (multi-select, mínimo 1)
- Estado activo/inactivo

**Validaciones estrictas:**
- Un servicio sin sede asignada NO es guardable
- Un servicio sin empleado asignado NO es guardable
- Eliminar servicio con citas futuras → cancela citas y notifica

### 7. Empleados (EmployeeManagement)

**Límite**: 6 empleados (sin contar al owner).

**Proceso de alta:**
1. Admin genera **código de invitación** (único, 8 caracteres)
2. Comparte por WhatsApp/email/QR
3. Candidato se registra en Gestabiz
4. Entra al negocio con el código → aparece en **Solicitudes Pendientes**
5. Admin aprueba/rechaza

**Solicitudes pendientes (tab):**
- Avatar, nombre, email, fecha de solicitud, mensaje opcional del candidato
- Botones: **Aprobar** (lo agrega como employee) / **Rechazar** (modal con motivo)

**Por empleado activo:**
- Datos de contacto
- **Horarios** (por día de la semana, con toggle "No trabaja")
- **Hora de almuerzo** (start/end, un rango fijo)
- **Salarios**: base, tipo (fixed/hourly/commission)
- **Servicios que ofrece** (multi-select)
- **Sedes donde trabaja** (multi-select, para empleados itinerantes)
- **Permite mensajes de clientes**: toggle `allow_client_messages`
- Estado activo/inactivo

**Perfil detallado** con estadísticas: citas completadas (30 días), ingresos generados, comisión, ocupancia %.

**Reglas al eliminar empleado con citas futuras**: se reasignan al empleado seleccionado o se cancelan.

### 8. Ausencias (AbsencesTab)

**Política crítica**: `require_absence_approval = true` SIEMPRE en Gestabiz. No es parametrizable.

**Tabs:**
- **Pendientes** — solicitudes por revisar
- **Historial** — aprobadas y rechazadas (readonly)

**Por solicitud:**
- Avatar + nombre del empleado
- Tipo: Vacaciones / Emergencia / Incapacidad / Personal / Otra
- Fecha desde – hasta + número de días (excluyendo festivos y fines de semana)
- Motivo/descripción
- Fecha de solicitud

**Acciones (solo en Pendientes):**
- **Aprobar** → status `approved`, notifica empleado por email. **Bloquea automáticamente la disponibilidad del empleado en esas fechas** (citas futuras se reasignan o cancelan).
- **Rechazar** → modal con motivo obligatorio → notifica empleado.

### 9. Clientes (ClientsManager — CRM)

Scope: clientes con al menos una cita no cancelada en el negocio.

**[SCREENSHOT: Grid de clientes del CRM]**

Grid de `ClientCard`: avatar (iniciales si no hay foto), email, total de visitas, visitas completadas, última visita. Búsqueda local por nombre/email.

**Modal de perfil del cliente (ClientProfileModal):**
- Tab **Información**: stats, primer/última visita, email, teléfono, dirección
- Tab **Historial (N)**: lista de todas sus citas con servicio, fecha, estado, precio
- Compartido con `SalesHistoryPage` y `EmployeeClientsPage`

**Gotcha técnica**: `appointments` NO tiene columnas `client_name` ni `client_email`. Siempre se hace two-step query: appointments → profiles.

### 10. Historial de Ventas (SalesHistoryPage)

Citas con `status='completed'` en el rango seleccionado.

**Filtros:** últimos 7 / 30 (default) / 90 / 365 días, búsqueda por cliente o servicio.

**Summary cards**: total de citas completadas, ingresos, promedio por cita.

**Tabla**: fecha, hora, servicio, cliente (click abre ClientProfileModal), precio.

### 11. Ventas Rápidas (QuickSalesPage)

**Para qué**: walk-ins, productos adicionales, servicios no agendados con anticipación.

**Formulario:**
- Cliente (nombre obligatorio; teléfono/email/documento opcionales)
- Descripción del servicio/producto
- Cantidad (default 1)
- Precio unitario (COP)
- Subtotal calculado
- Descuento opcional
- Total calculado
- Método de pago: Efectivo / Tarjeta / Transferencia
- Notas opcionales

**Al registrar**: crea `transaction` tipo `income`, categoría `service_sale`. **No crea cita** automáticamente.

**Panel lateral**: ventas hoy / 7 días / 30 días + historial de últimas 10 ventas.

### 12. Reportes (Plan Básico)

**Visualizaciones** (sin exportación en este plan):
- Gráfico de ingresos por período
- Distribución de citas por estado
- Tabla de transacciones
- Ocupancia (% tiempo ocupado)

**Filtros**: período predefinido o custom, por sede, por empleado.

**Limitación clave**: Solo visualización. Para exportar PDF/CSV/Excel hay que subir a **Plan Pro**.

### 13. Permisos (Plantillas en Plan Básico)

En Plan Básico NO hay permisos granulares. Solo **3 plantillas fijas**:
- **Admin** — acceso total al dashboard del negocio
- **Manager** — puede ver reportes y aprobar ausencias; no puede crear/eliminar servicios ni empleados
- **Employee** — solo ve sus propias citas y datos

Dropdown por empleado → seleccionar plantilla → guardar.

Para asignar permisos específicos (ej: "puede crear servicios pero no eliminarlos") → upgrade a **Plan Pro** (79 permisos, 9 plantillas + custom).

### 14. Facturación (BillingDashboard)

- Plan actual con fecha de renovación
- Uso vs límites con barras de progreso (sedes, empleados)
- Historial de pagos (últimos 10)
- Comparativa de planes con botón de upgrade
- **Mes gratis** activable si es primer usuario (una sola vez)
- Gateway: Stripe (global) / PayU (Colombia) / MercadoPago (LATAM)

### 15. Integraciones activas en Plan Básico

| Servicio | Activa en Básico |
|----------|------------------|
| Email (Brevo) | ✅ Confirmaciones, recordatorios, cancelaciones |
| WhatsApp Business | ✅ Recordatorios, confirmaciones |
| Google Calendar | ✅ Sync bidireccional |
| SMS (AWS SNS) | ⚠️ Solo si está configurado (opcional) |
| Stripe/PayU/MercadoPago | ✅ Para pagos de suscripción |

---

## PROPUESTA DE VALOR — Plan Básico

### El "sweet spot" para PyMEs en crecimiento

Un salón con 3 sillas, una clínica con 2 doctores, un taller con 4 mecánicos, un coworking con 6 desks — todos caben en Plan Básico sin pagar features que no van a usar.

### ROI del Plan Básico ($89.900/mes)

| Antes de Gestabiz | Con Gestabiz Básico |
|-------------------|---------------------|
| 5 herramientas separadas (Calendly + WhatsApp + Excel + Google Calendar + planilla) | Todo en uno |
| ~$150.000/mes en licencias | $89.900/mes |
| Olvidos de citas, no-shows 25%+ | Recordatorios WhatsApp → no-shows <10% |
| 2 horas/día confirmando citas | 15 minutos/día |
| Historial en cabeza del dueño | CRM con todo el histórico |

**Payback**: un solo no-show evitado paga la mensualidad.

### Cuándo upgradear a Pro

- Necesitas más de 3 sedes o más de 6 empleados
- Tu contador te pide reportes exportables (PDF/Excel)
- Manejas IVA/ICA y necesitas contabilidad fiscal automatizada
- Quieres permisos finos (ej: "María puede ver reportes pero no editar servicios")
- Tu negocio tiene recursos físicos (salas, canchas, equipos) que se reservan
- Publicas vacantes frecuentemente y necesitas pipeline de reclutamiento

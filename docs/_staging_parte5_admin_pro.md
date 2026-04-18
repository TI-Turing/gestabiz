# PARTE 5: ROL ADMIN — PLAN PRO

> Análisis exhaustivo. Generado por Claude Code — 2026-04-18.
> Para merge en Manual_Usuario_Gestabiz - copilot.docx y Propuesta_Valor_Gestabiz - copilot.docx.

---

## RESUMEN EJECUTIVO — Plan Pro

**Precio**: $159.900 COP/mes (o $1.599.000 anual = 10 meses, 2 gratis)
**Para quién**: negocios profesionalizados, multi-sede, con equipo mediano, con contabilidad fiscal, o con activos físicos que se reservan.
**Incluye todo lo del Plan Básico más:**
- Hasta 10 sedes (vs 3) y 15 empleados (vs 6)
- **Recursos físicos** (15 tipos: salas, canchas, camas, mesas, vehículos, etc.)
- **Sistema de Reclutamiento** con vacantes, matching inteligente, reviews obligatorios
- **Jerarquía multi-nivel** de empleados con mapa visual
- **79 permisos granulares** + 9 plantillas predefinidas + plantillas custom
- **Contabilidad fiscal avanzada** (IVA 19/5/0%, ICA por ciudad, Retención en la Fuente)
- **Exportación de reportes** (PDF / CSV / Excel con gráficos)
- **Gestión de gastos** (fijos, recurrentes, por sede)
- **Transferencia de sedes** con preview de impacto en citas
- **Ausencias avanzadas** (balance vacacional, festivos colombianos 2025–2027, range highlighting)

> [HIPERVÍNCULO AL DETALLE: Sección "Rol Admin Plan Pro — Detalle"]

---

## DETALLE EXHAUSTIVO — Plan Pro

### 1. Módulos EXCLUSIVOS del Plan Pro

| Módulo | ID | Estado en otros planes |
|--------|-----|------------------------|
| Recursos Físicos | `resources` | Bloqueado en Gratuito y Básico |
| Reclutamiento | `recruitment` | Bloqueado en Gratuito y Básico |
| Gastos | `expenses` | Bloqueado en Gratuito y Básico |
| Jerarquía visual | (dentro de employees) | Solo lista plana en otros planes |
| Editor de permisos granulares | (dentro de permissions) | Solo plantillas en otros planes |
| Contabilidad fiscal | (dentro de reports) | Básico no tiene |

### 2. Recursos Físicos (ResourcesManager)

**[SCREENSHOT: Listado de recursos físicos con filtros por tipo]**

Para negocios donde el servicio ocurre en un **activo** (sala, cancha, mesa, etc.) además o en lugar de con un profesional.

**15 tipos soportados:**
room, table, court, studio, meeting_room, desk, equipment, vehicle, space, lane, field, station, parking_spot, bed, other.

**Modos del negocio** (`resource_model`):
- `professional` — solo empleado atiende (default)
- `physical_resource` — solo recurso se reserva
- `hybrid` — empleado + recurso juntos
- `group_class` — clase grupal (múltiples clientes, 1 recurso/empleado)

**Formulario de recurso:**
- Nombre, tipo (select 15 opciones), sede, capacidad máxima
- Tarifa por hora (COP, opcional)
- Descripción (útil para SEO)
- Amenities (lista separada por comas: "WiFi, A/C, Proyector, Sonido")
- Estado activo/inactivo

**Relación M:N con servicios**: `resource_services` con `custom_price` override por recurso.

**Casos de uso reales:**
- Estudio de yoga: 3 salas → tarifa por hora
- Cancha de fútbol 5: 2 canchas + kits de balones
- Coworking: 20 desks + 4 salas de reunión
- Hotel: 30 habitaciones + 5 parkings
- Restaurante: 15 mesas + 2 terrazas
- Escuela de boliche: 8 lanes

**Validación**: `appointments.resource_id IS NOT NULL OR employee_id IS NOT NULL` (CHECK constraint).

**Hook**: `useAssigneeAvailability` valida empleado O recurso automáticamente.

### 3. Reclutamiento (RecruitmentDashboard)

**[SCREENSHOT: Dashboard de reclutamiento con vacantes y candidatos]**

Flujo completo: publicar → recibir aplicaciones → evaluar → contratar → review.

**Estados de vacante**: draft / open / active / closed / filled.
**Estados de aplicación**: pending / reviewing / in_selection_process / interview / accepted / rejected / withdrawn.

**Formulario de vacante:**
- Título, descripción, requisitos, responsabilidades, beneficios
- Tipo: full_time / part_time / freelance / temporary
- Experiencia requerida: entry / mid / senior
- Salario mínimo/máximo, moneda (default COP)
- Basada en comisión (toggle)
- Sede asociada
- Remoto permitido (toggle)
- Estado inicial (draft / open)

**Matching inteligente** (`useMatchingVacancies`): algoritmo sugiere candidatos según:
- Servicios ofrecidos vs requeridos
- Experiencia vs nivel requerido
- Ubicación preferida vs sede de vacante
- Puntuación 0–100%

**Detección de conflictos de horario** (`useScheduleConflicts`): si el candidato ya trabaja en otro negocio, detecta solapes.

**Reviews obligatorios** (`MandatoryReviewModal`):
- Al **contratar**: admin califica al candidato (rating + comentario + "¿recomendarías?")
- Al **finalizar contrato**: ambos se califican

**Pipeline completo**: vacante → 15 aplicaciones → admin marca 5 para entrevista → 3 entrevistas → 1 contratación → review obligatoria → empleado activo con permisos.

### 4. Jerarquía de Empleados (EmployeeManagementHierarchy)

**[SCREENSHOT: Mapa visual de jerarquía de empleados]**

6 niveles (0 = Owner, 5 = Support Staff). Cada empleado tiene `reports_to` (supervisor directo) y `hierarchy_level`.

**Vista Lista** (`EmployeeListView`):
- Tabla con: nombre, rol, nivel, supervisor, sede, servicios, subordinados directos, total bajo supervisión, ocupancia %, rating
- Filtros: nivel, tipo (service_provider/support_staff), departamento, sede
- Sección "Pendientes de setup" (empleados sin supervisor o sin `setup_completed`)

**Vista Mapa** (`HierarchyMapView`):
- Árbol organizacional visual
- Nodos con avatar, nombre, rol, contador de subordinados
- Líneas de conexión supervisor ↔ subordinados
- Color por nivel
- Click en nodo → abre perfil

**Asignación de supervisor**:
- Dropdown filtra empleados de nivel válido (superior)
- Al guardar: actualiza `business_roles.reports_to` y `hierarchy_level`, marca `setup_completed = true`

**RPC**: `get_business_hierarchy()` consulta árbol completo. Edge Function: `update-hierarchy`.

### 5. Permisos Granulares (PermissionsManager + PermissionEditor)

**79 permisos** organizados en 12 categorías:
business.*, locations.*, services.*, resources.*, employees.*, appointments.*, clients.*, accounting.*, reports.*, permissions.*, notifications.*, settings.*.

**9 plantillas del sistema** (inmutables):
1. **Admin Completo** — 42 permisos (todo menos delete destructivo)
2. **Vendedor** — 18 permisos (citas + clientes, sin empleados/contabilidad)
3. **Cajero** — 12 permisos (citas completadas + cobros)
4. **Manager de Sede** — 25 permisos (solo su sede)
5. **Recepcionista** — 10 permisos (citas + clientes)
6. **Profesional** — 8 permisos (solo sus citas + disponibilidad)
7. **Contador** — 15 permisos (contabilidad completa)
8. **Gerente de Sede** — 20 permisos
9. **Staff de Soporte** — 5 permisos

**Plantillas custom**: admin puede crear las suyas (guardadas en `permission_templates` con `is_system = false`).

**Editor de permisos** (`PermissionEditor`):
- Acordeón con 12 categorías
- Checkbox por permiso con descripción en español
- Toggle "seleccionar toda la categoría"
- Botón "Calcular cambios" muestra diff: ✅ a otorgar / ❌ a revocar
- Guardado con confirmación

**Owner bypass**: el dueño (`businesses.owner_id`) tiene permisos totales sin consultar `user_permissions` (99.4% más rápido).

**Componente PermissionGate** (usado en toda la app):
```tsx
<PermissionGate permission="services.delete" businessId={id} mode="hide">
  <Button>Eliminar</Button>
</PermissionGate>
```
Modos: `hide` (destruye), `disable` (formularios), `show` (con fallback).

### 6. Contabilidad Fiscal Avanzada

**Configuración fiscal (TaxConfiguration):**
- **Régimen**: simple / common / special
- **Responsable de IVA**: toggle + tasa default (0/5/19%)
- **Responsable de ICA**: toggle + tasa por ciudad (0.5%–1.6% según municipio, lista de 1122+ ciudades CO)
- **Agente de retención**: toggle + tasa
- **Código DIAN/NIT**

**Cálculo automático en cada transacción:**
- Subtotal + IVA (19% típico para servicios) = Total
- ICA acumulado mensual
- Retención en la fuente por tipo (servicios 4%, comisiones 10%, honorarios 11%)

**Tipos de transacción:**
- **Ingresos**: appointment_payment, product_sale, service_sale, membership
- **Egresos**: salary, commission, rent, utilities, supplies, equipment, marketing, maintenance, tax

### 7. Dashboard Financiero Avanzado

**[SCREENSHOT: Dashboard financiero con 5 gráficos]**

**5 gráficos Recharts:**
1. **Income vs Expense** (líneas) — ingresos y egresos por mes
2. **Category Pie** — distribución % por categoría
3. **Monthly Trend** (área) — tendencia de utilidad neta
4. **Location Bar** — ingresos por sede
5. **Employee Revenue Bar** — ingresos generados por empleado

**Métricas principales**: ingresos totales, egresos totales, utilidad neta, margen %, IVA cobrado vs pagado vs neto a pagar, ICA acumulado.

**Filtros**: período (1m / 3m / 6m / 1y / custom), multi-empleado, multi-categoría, por sede.

**Reporte P&L** (Profit & Loss) con comparación período a período.

### 8. Exportación de Reportes

**Formatos:**
- **PDF** — reportes formateados con gráficos (jsPDF)
- **CSV** — datos crudos
- **Excel** — con gráficos y tablas (xlsx)

**Reportes disponibles:**
- Operacional (citas, no-shows, clientes únicos, recurrentes)
- Financiero (P&L completo)
- Desempeño por empleado (citas, ingresos, rating, comisiones)
- Clientes (segmentación activos/riesgo/perdidos, LTV)

### 9. Gastos (ExpensesManagementPage)

- Registro manual de egresos
- **Gastos recurrentes** (alquiler, servicios, suscripciones) con frecuencia mensual/semanal
- **Gastos por sede** (pestaña en cada sede, solo Pro)
- Categorización y reportes

### 10. Transferencia de Sedes (LocationTransferModal)

- Modal para mover empleado de sede A → sede B
- Slider: días hasta efectividad (7–30)
- **Preview de impacto**: citas a mantener (antes de fecha efectiva) vs citas a cancelar (después)
- Checkbox confirmación
- Edge Functions: `cancel-future-appointments-on-transfer`, `process-pending-transfers`
- Badge `TransferStatusBadge` en perfil del empleado

### 11. Ausencias Avanzadas

- **Balance vacacional** automático (15 días/año estándar CO, acumulable)
- **Festivos colombianos** 2025–2027 integrados (54 festivos)
- **Range highlighting** en calendarios (visualización de rangos)
- 5 tipos: vacation, emergency, sick_leave, personal, other
- Cancelación automática de citas al aprobar ausencia de emergencia (Edge Function `cancel-appointments-on-emergency-absence`)

### 12. Google Calendar Sync

- Bidireccional: cita en Gestabiz → Google Calendar del empleado
- Cambio en Google Calendar → refleja en Gestabiz
- Hook: `useGoogleCalendarSync`

### 13. Integración fiscal colombiana (diferenciador único)

| Feature | Competidor típico | Gestabiz Pro |
|---------|-------------------|--------------|
| IVA (0/5/19%) | ❌ Manual | ✅ Auto por servicio |
| ICA por ciudad (1122+ municipios) | ❌ | ✅ Auto según DANE code |
| Retención en la fuente | ❌ | ✅ Por tipo de ingreso |
| Reporte DIAN compliant | ❌ | ✅ |
| Provisiones parafiscales (salarios) | ❌ | ✅ |

---

## PROPUESTA DE VALOR — Plan Pro

### Para quién es el Plan Pro

- Negocios con **>6 empleados** o **>3 sedes**
- Cualquier vertical donde se reserven **recursos físicos** (hoteles, canchas, coworkings, restaurantes, estudios, talleres, parqueaderos)
- Empresas con **contabilidad formalizada** que necesitan IVA/ICA/Retenciones automáticas
- Negocios con **alta rotación** que necesitan pipeline de reclutamiento
- Organizaciones con **jerarquía compleja** (dueño → gerentes → managers de sede → equipo)

### Diferenciadores vs competidores (Plan Pro)

| Feature | Gestabiz Pro | Booksy Business | Fresha | Calendly Teams | Agenda Pro CO |
|---------|:------------:|:---------------:|:------:|:--------------:|:-------------:|
| Recursos físicos 15 tipos | ✅ | Parcial | Parcial | ❌ | ❌ |
| Reclutamiento integrado | ✅ | ❌ | ❌ | ❌ | ❌ |
| Jerarquía multi-nivel visual | ✅ | ❌ | ✅ básica | ❌ | ❌ |
| 79 permisos granulares | ✅ | ~20 | ~30 | ❌ | ~10 |
| IVA/ICA/Retención CO auto | ✅ | ❌ | ❌ | ❌ | Parcial |
| Festivos CO 2025–2027 | ✅ | ❌ | ❌ | ❌ | ✅ |
| Multi-gateway (Stripe+PayU+MP) | ✅ | ❌ | ✅ | ❌ | ❌ |
| Horizontal (15 categorías) | ✅ | ❌ Estética | ❌ Estética | ✅ Genérico | ✅ |
| Exportación PDF/CSV/Excel | ✅ | ✅ | ✅ | ❌ | Parcial |
| Precio/mes (COP) | $159.900 | ~$280k | ~$250k | ~$120k | ~$180k |

### ROI del Plan Pro ($159.900/mes)

Un estudio de yoga con 3 sedes y 10 profesores factura típicamente $40M–$60M/mes. La diferencia entre Básico y Pro ($70.000/mes) se recupera con:

- **1 hora menos** de admin haciendo reportes por mes
- **1 no-show evitado** gracias a recordatorios WhatsApp
- **1 empleado mejor contratado** gracias al pipeline de reclutamiento
- **1 reporte DIAN automático** vs pagar al contador

### Mensaje clave

> **"Pro no es más features por más plata. Pro es el plan donde tu negocio deja de depender de ti. Permisos finos para que delegues sin miedo, jerarquía para que escale, contabilidad automática para que tu contador te ame, y reclutamiento para que sigas creciendo."**

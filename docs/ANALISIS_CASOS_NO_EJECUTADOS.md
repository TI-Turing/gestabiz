# Análisis de Casos NO Ejecutados — Cross-reference Planes vs Reporte

> **Fecha**: Marzo 2026  
> **Fuente**: 6 planes de prueba vs `REPORTE_PRUEBAS_FUNCIONALES.md` (20 sesiones, 202 casos, 70 bugs)  
> **Método**: Chrome DevTools MCP (automatización de browser UI)

---

## RESUMEN EJECUTIVO

| Categoría | Cantidad |
|-----------|:--------:|
| **Casos ejecutados (reporte)** | 202 |
| **Casos testables vía UI pendientes** | ~95 |
| **Casos NO testables vía UI** | ~120 |
| **Total en planes** | ~420+ |

---

## 1. CASOS TESTABLES VÍA BROWSER UI (PENDIENTES)

Estos casos **SÍ se pueden ejecutar** con Chrome DevTools MCP (clicks, formularios, navegación) pero **NO fueron probados** en las 20 sesiones del reporte.

---

### 1.1 Plan Administrador (`PLAN_PRUEBAS_ROL_ADMINISTRADOR.md`)

| ID | Descripción | Razón no ejecutado |
|----|------------|-------------------|
| **NEG-04** | Cambiar modelo de negocio (professional→hybrid→physical_resource) | No es parte del tracking table; casos extra del plan detallado |
| **NEG-05** | Configurar subcategorías del negocio (máx 3) | No es parte del tracking table |
| **NEG-06** | Validación campos obligatorios formulario crear negocio | No es parte del tracking table |
| **LOC-05** | Asignar servicios a sede (junction table location_services) | Solo LOC-01 a LOC-04 fueron testeados |
| **LOC-06** | Asignar egresos recurrentes a sede | Solo LOC-01 a LOC-04 fueron testeados |
| **LOC-07** | Sede con zona horaria / configuración avanzada | Solo LOC-01 a LOC-04 fueron testeados |
| **SER-04** | Categorizar servicio (asignar categoría) | SER-01 a SER-03 probados; SER-04+ no |
| **SER-05** | Asociar servicio a empleados (employee_services junction) | No ejecutado |
| **SER-06** | Servicio con precio por comisión | No ejecutado |
| **SER-07** | Validación de datos obligatorios de servicio | No ejecutado |
| **RES-01** | Crear recurso físico (formulario completo) | Solo RES-02 (editar) fue probado; RES-01 encontró bug i18n pero no CRUD completo |
| **RES-03** | Eliminar recurso | No ejecutado |
| **RES-04** | Asignar servicios a recurso (resource_services junction) | No ejecutado |
| **RES-05** | Verificar disponibilidad de recurso (is_resource_available RPC) | No ejecutado via UI |
| **RES-06** | Estadísticas de recurso (resource_availability view) | No ejecutado |
| **RES-07** | Filtrar recursos por tipo/ubicación | No ejecutado |
| **QS-02** | Venta rápida sin permiso `sales.create` (PermissionGate bloqueo) | Marcado ❌ "No probado" en tracking table, nunca ejecutado |

**Subtotal Admin pendientes testables via UI: 17 casos**

> **Nota**: ADM-SHELL-01 a -09 aparecen como "Probado" en el tracking table (bugs de performance/code review como BUG-SHELL-04/07/08/09 se encontraron, no son casos UI pendientes). NEG-01/02/03 fueron probados en Sesiones 16/19. ACC-01 fue probado en Sesión 16.

---

### 1.2 Plan Cliente (`PLAN_PRUEBAS_ROL_CLIENTE.md`)

| ID | Descripción | Razón no ejecutado |
|----|------------|-------------------|
| **C2** | Cambio Cliente→Empleado con validaciones | C1 ✅ probado, pero C2 (detalles de validación) no explícito |
| **C3** | Cambio Cliente→Admin con onboarding | C1 ✅ cubre cross-rol pero C3 específico no documentado |
| **H4** | Historial con paginación masiva (>50 citas) | No hay suficientes datos E2E (Laura solo tiene 4 citas) |
| **B5** | Búsqueda con filtros avanzados (precio, distancia, rating) | BUG-B4-01: Panel filtros no implementado; depende de fix |
| **W2** | Wizard con negocio preseleccionado desde URL params | No probado explícitamente |
| **W9** | Wizard cancellation/abandono tracking (GA4) | Requiere verificar GA4 events; parcialmente observable |
| **W11** | Wizard con recurso físico (resource_id en vez de employee_id) | FitZone no tiene employee_services configurados; datos E2E insuficientes |
| **R3** | Editar reseña existente | BUG-R2-01 bloquea creación de reseñas; nunca se llegó a editar |
| **R4** | Eliminar reseña propia | Mismo bloqueo que R3 |
| **R5** | Reseña con rating diferente (1-5 estrellas) | Mismo bloqueo que R3 |
| **CH2** | Chat desde detalle de cita pendiente | Intentado S14: Laura tiene 0 citas pendientes; no testable sin datos |
| **CH3** | Chat con múltiples empleados del negocio | No ejecutado explícitamente |
| **CH4** | Chat envío de adjuntos (archivos, imágenes) | No ejecutado |
| **G4** | Geolocalización con negocios cercanos (distancia real) | BUG-G1-01: geolocalización no invocada por búsqueda |
| **MOB1** | Responsive mobile (viewport test) | Requiere emulación mobile; posible con MCP pero no ejecutado |
| **P1** | Perfil público de negocio (/negocio/:slug) sin autenticación | Ruta pública; no probada explícitamente |
| **P2** | SEO meta tags y structured data en perfil público | No verificado |

**Subtotal Cliente pendientes testables via UI: 17 casos**

> **Nota**: Muchos casos de cliente SÍ fueron probados extensamente (D1-D4 ✅, CAL1-CAL3 ✅, A1-A4 ✅, S1-S3 ✅, F1-F2 ✅, H1-H3 ✅, B1-B3 ✅, W1/W3-W6/W10 ✅, R1-R2 ✅, CH1/CH5 ✅, SET1-SET4 ✅, G1-G3 ✅, N1-N2 ✅). Casos como F3 y R2 se intentaron pero fallaron por bugs.

---

### 1.3 Plan Empleado (`PLAN_PRUEBAS_ROL_EMPLEADO.md`) — **Mayor gap**

El plan define **186 casos** pero solo ~16 fueron ejecutados (Sesiones 3 y 17). Esto representa el **91% de gap**.

**Casos ejecutados (mapeados a plan):**
- EMP-ACC-01 (Cambio rol) ✅ S17
- EMP-EMP-01 (Mis Empleos dashboard) ✅ S17
- EMP-EMP-02 (Detalle empleo 6 tabs) ✅ S17
- EMP-EMP-03 (Menú Más opciones) ✅ S17
- EMP-VAC-01 (Buscar vacantes) ✅ S3/S17
- EMP-ABS-01 (Mis Ausencias widget) ✅ S17
- EMP-ABS-02 (Modal solicitar ausencia) ✅ S17
- EMP-APT-01 (Mis Citas empleado) ✅ S3/S17
- EMP-HOR-01 (Horario page - stub) ⚠️ S17
- EMP-NOT-01 (Notificaciones empleado) ✅ S17
- EMP-NOT-02 (Chat empleado) ✅ S17

**Casos UI testables NO ejecutados:**

#### 4.1 Acceso al Rol (5 pendientes)

| ID | Descripción | Razón |
|----|------------|-------|
| **EMP-ACC-02** | Login directo con rol empleado activo | Solo cambio de rol probado, no login directo |
| **EMP-ACC-03** | Empleado sin teléfono → onboarding requerido | Probado indirectamente con Laura (S14) pero no como caso formal de empleado |
| **EMP-ACC-04** | Empleado desactivado (is_active=false) → acceso bloqueado | Sin datos E2E para empleado desactivado |
| **EMP-ACC-05** | Empleado multi-negocio → selector visible | Juan solo pertenece a 1 negocio |
| **EMP-ACC-06** | URL directa a módulo empleado | No ejecutado |

#### 4.2 Shell Empleado (7 pendientes)

| ID | Descripción | Razón |
|----|------------|-------|
| **EMP-SHELL-02** | URL sync con hash en sidebar | No probado explícitamente |
| **EMP-SHELL-03** | Responsive mobile sidebar | No probado |
| **EMP-SHELL-04** | Loading states / Suspense | No verificado formalmente |
| **EMP-SHELL-05** | Error boundary (ErrorBoundary funcional) | No provocable vía MCP fácilmente |
| **EMP-SHELL-06** | FloatingChatButton en empleado | Presente ✅ (observado en S17) pero sin caso formal |
| **EMP-SHELL-07** | Botón "Reportar Problema" visible | No verificado formalmente |
| **EMP-SHELL-08** | Lazy loading componentes empleado | No verificado formalmente |

#### 4.3 Mis Empleos (4 pendientes)

| ID | Descripción | Razón |
|----|------------|-------|
| **EMP-EMP-04** | Solicitar traslado de sede | Botón "Programar Traslado" visible en S17 pero no ejecutado |
| **EMP-EMP-05** | Unirse a negocio nuevo (código o búsqueda) | No ejecutado |
| **EMP-EMP-06** | Desvincularse de negocio | No ejecutado |
| **EMP-EMP-07** | Estado vacío sin empleos | Solo NoBiz user mostró esto parcialmente |

#### 4.4 Onboarding Empleado (6 pendientes)

| ID | Descripción | Razón |
|----|------------|-------|
| **EMP-ONB-01** | Primer acceso → configurar teléfono | Laura vio onboarding como cambio de rol, no como empleado formal |
| **EMP-ONB-02** | Completar perfil profesional (skills, certificaciones) | No ejecutado |
| **EMP-ONB-03** | Conectar con negocio existente | No ejecutado |
| **EMP-ONB-04** | Configurar horarios iniciales | No ejecutado |
| **EMP-ONB-05** | Configurar servicios que ofrece | No ejecutado |
| **EMP-ONB-06** | Validación campos obligatorios onboarding | No ejecutado |

#### 4.5 Vacantes (7 pendientes)

| ID | Descripción | Razón |
|----|------------|-------|
| **EMP-VAC-02** | Filtrar vacantes (ubicación, tipo, salario) | S17 mostró 21 resultados pero sin filtros |
| **EMP-VAC-03** | Ver detalle de vacante (descripción, requisitos) | No ejecutado (solo lista) |
| **EMP-VAC-04** | Aplicar a vacante (formulario CV + notas) | No ejecutado |
| **EMP-VAC-05** | Cancelar aplicación a vacante | No ejecutado |
| **EMP-VAC-06** | Estado de aplicaciones (pendiente/aceptada/rechazada) | No ejecutado |
| **EMP-VAC-07** | Vacante de negocio propio (conflicto) | No ejecutado |
| **EMP-VAC-08** | Matching score % detalle | Sort "Mejor Match" visible pero no verificado detalle |

#### 4.6 Citas (7 pendientes)

| ID | Descripción | Razón |
|----|------------|-------|
| **EMP-APT-02** | Ver detalle de cita asignada | Solo vista lista probada |
| **EMP-APT-03** | Confirmar cita pendiente | No ejecutado |
| **EMP-APT-04** | Rechazar/cancelar cita | No ejecutado |
| **EMP-APT-05** | Marcar cita como completada | No ejecutado |
| **EMP-APT-06** | Vista calendario empleado | No verificado (solo lista) |
| **EMP-APT-07** | Citas con overlap (validación) | No ejecutado |
| **EMP-APT-08** | Citas fuera de horario laboral | No ejecutado |

#### 4.7 Ausencias (8 pendientes)

| ID | Descripción | Razón |
|----|------------|-------|
| **EMP-ABS-03** | Solicitud de ausencia urgencia (emergencia) | Solo tipo "Vacaciones" probado |
| **EMP-ABS-04** | Solicitud de tipo "sick_leave" | No ejecutado |
| **EMP-ABS-05** | Cancelar solicitud pendiente | No ejecutado |
| **EMP-ABS-06** | Ver estado de solicitudes (aprobada/rechazada) | Widget visible pero sin solicitudes reales |
| **EMP-ABS-07** | Balance de vacaciones actualizado después de aprobación | No ejecutado flujo completo |
| **EMP-ABS-08** | Ausencia en fecha con citas → cancelación automática | No ejecutado |
| **EMP-ABS-09** | Festivo incluido en rango de ausencia | No ejecutado |
| **EMP-ABS-10** | Solicitud más allá del límite (>90 días) | No ejecutado |

#### 4.8 Horarios (8 todos pendientes)

| ID | Descripción | Razón |
|----|------------|-------|
| **EMP-HOR-01** | Página Horario dedicada | Probado ⚠️ pero es STUB "Próximamente" |
| **EMP-HOR-02** | Editar horario desde modal empleo | Visible en S17 pero no editado |
| **EMP-HOR-03** | Configurar almuerzo (lunch_break) | Visible pero no editado |
| **EMP-HOR-04** | Horario diferente por día | No ejecutado |
| **EMP-HOR-05** | Desactivar día completo (toggle OFF) | No ejecutado |
| **EMP-HOR-06** | Validación horarios superpuestos con citas | No ejecutado |
| **EMP-HOR-07** | Horario para múltiples sedes | Juan solo tiene 1 sede |
| **EMP-HOR-08** | Persistencia de cambios de horario | No ejecutado |

#### 4.9 Configuraciones (8 todos pendientes)

| ID | Descripción | Razón |
|----|------------|-------|
| **EMP-SET-01** | Tab General (tema, idioma, cuenta) | Solo Client Settings probados extensamente |
| **EMP-SET-02** | Tab Perfil empleado (nombre, teléfono, avatar) | No probado como empleado |
| **EMP-SET-03** | Tab Notificaciones empleado | No probado |
| **EMP-SET-04** | Tab Preferencias Empleado (horarios, servicios, salario) | No probado desde Settings |
| **EMP-SET-05** | Zona de Peligro | No probado |
| **EMP-SET-06** | Toggle allow_client_messages | No probado desde Settings del empleado |
| **EMP-SET-07** | Cambio de idioma (EN↔ES) | Solo probado en rol Cliente |
| **EMP-SET-08** | Persistencia de preferencias | No verificado |

#### 4.10 Notificaciones/Chat Empleado (6 pendientes)

| ID | Descripción | Razón |
|----|------------|-------|
| **EMP-NOT-03** | Click notificación → navegar a cita/ausencia | Solo badge verificado |
| **EMP-NOT-04** | Marcar como leída individualmente | No ejecutado |
| **EMP-NOT-05** | Archivar notificación | No ejecutado |
| **EMP-NOT-06** | Chat: responder a mensaje de cliente | Chat visible pero no se envió mensaje |
| **EMP-NOT-07** | Chat: enviar adjunto (imagen/archivo) | No ejecutado |
| **EMP-NOT-08** | Chat: estado de última conexión | No verificado |

#### 4.11 Integración Cross (6 todos pendientes)

| ID | Descripción | Razón |
|----|------------|-------|
| **EMP-INT-01** | Cita asignada → notificación → click → detalle | Notificación vista, pero click→detalle no verificado |
| **EMP-INT-02** | Ausencia aprobada → citas canceladas | No ejecutado flujo completo |
| **EMP-INT-03** | Cambio horario → slots actualizados | No verificado |
| **EMP-INT-04** | Nuevo servicio asignado → visible en perfil | No verificado |
| **EMP-INT-05** | Review recibida → notificación | No ejecutado |
| **EMP-INT-06** | Vacante aceptada → nuevo empleo visible | No ejecutado flujo completo |

**Subtotal Empleado pendientes testables via UI: ~60 casos**

---

### 1.4 Plan Permisos (`PLAN_PRUEBAS_PERMISOS.md`)

El plan define escenarios y matrices por template. Sesión 18 cubrió 9 casos (PERM-01 a PERM-09).

| ID | Descripción | Razón |
|----|------------|-------|
| **3.1** | Escenario: Owner crea negocio → auto-asignación permisos | Parcialmente (owner bypass verificado S18) |
| **3.2** | Escenario: Admin asigna template a empleado | PERM-09 NO TESTABLE (sin usuarios con template) |
| **3.3** | Escenario: Empleado sin permisos ve botones deshabilitados | Parcialmente verificado (Juan 0 permisos en S18) |
| **3.4** | Escenario: Revocar permisos individuales | No ejecutado |
| **4.1-matrix** | Template Admin Completo (42 permisos) → verificar acceso a cada módulo | No ejecutado matrix completo |
| **4.2-matrix** | Template Gerente de Sede (16 permisos) → acceso limitado | Sin usuario con template |
| **4.3-matrix** | Template Contador (14 permisos) → solo contabilidad | Sin usuario con template |
| **4.4-matrix** | Template Recepcionista (10 permisos) → solo citas/clientes | Sin usuario con template |
| **4.5-matrix** | Template Profesional (6 permisos) → solo sus datos | Sin usuario con template |

**Subtotal Permisos pendientes testables: ~7 casos** (matrices requieren datos E2E)

---

### 1.5 Plan Permisos Fase 5 (`PLAN_PRUEBAS_PERMISOS_FASE_5.md`)

~65 escenarios de los cuales solo ~9 fueron cubiertos en S18.

| Rango IDs | Descripción | Razón |
|-----------|------------|-------|
| **2.1-2.2** | Infraestructura: RPC functions, audit log | Parcialmente validado en testing previo (Nov 2025) |
| **3.1-3.5** | PermissionGate en módulos Admin (Servicios, Sedes, Empleados, Reclutamiento, Contabilidad) | PERM-01 cubrió parcialmente; falta verificación granular botón por botón |
| **3.6-3.10** | PermissionGate en módulos Admin (Egresos, Reviews, Billing, Notificaciones, Permisos) | Parcialmente cubierto en S18 (stubs en tabs) |
| **3.11-3.13** | PermissionGate en módulos Empleado | No ejecutado |
| **3.14-3.16** | PermissionGate en módulos Cliente (Wizard, Favoritos, Reviews) | Parcialmente cubierto (BUG-R2-01 encontrado) |
| **4.1-4.3** | Templates: aplicar, verificar, revocar | No ejecutado (sin datos) |
| **5.1-5.4** | Bulk operations: asignar/revocar masivo | No ejecutado |
| **6.1-6.3** | Audit: log de cambios, historial | Tabs de historial son STUB |

**Subtotal Permisos F5 pendientes testables: ~15 casos** (requieren datos de templates)

---

## 2. CASOS NO TESTABLES VÍA BROWSER UI (MCP)

Estos casos requieren herramientas específicas y **NO pueden ejecutarse** mediante Chrome DevTools MCP.

### 2.1 Performance (Plan Cliente + Plan Empleado)

| Rango IDs | Origen | Descripción | Requiere |
|-----------|--------|------------|----------|
| PERF-D1 a D5 | Cliente | Performance dashboard (TTI, memory, re-renders) | React DevTools Profiler |
| PERF-F1 a F3 | Cliente | Performance favoritos (toggle speed, list render) | React DevTools |
| PERF-R1/R2 | Cliente | Performance reviews (form submit, list load) | Network + Profiler |
| PERF-H1/H2 | Cliente | Performance historial (paginación, filtros) | Lighthouse |
| PERF-S1/S2 | Cliente | Performance sugerencias (render time) | Profiler |
| PERF-W1/W2 | Cliente | Performance wizard (step transition) | Profiler |
| PERF-RR1 a RR3 | Cliente | React rendering performance | React DevTools Profiler |
| PERF-RQ1 a RQ3 | Cliente | React Query cache/deduplication | React Query DevTools |
| PERF-B1/B2 | Cliente | Lighthouse score + Bundle analysis | Lighthouse CLI + webpack-analyzer |
| PERF-N1/N2 | Cliente | Performance notificaciones | Profiler |
| PERF1/PERF2 | Cliente | Performance general app | Lighthouse |
| PERF-EMP-01 a 05 | Empleado Avanz. | Performance hooks, renders, queries empleado | React DevTools |
| EMP-PERF-01 a 08 | Empleado | Performance base de módulos empleado | Profiler |
| EMP-PERF-ADV-01 a 30 | Empleado | Performance avanzado (30 sub-tests) | Profiler + Network |

**Total Performance: ~70 casos**

### 2.2 Seguridad (Plan Cliente + Empleado)

| IDs | Origen | Descripción | Requiere |
|-----|--------|------------|----------|
| SEC1/SEC2 | Cliente | SQL injection, XSS, CSRF | Interceptación de requests, modificación de payloads |
| EMP-SEC-01 a 06 | Empleado | Seguridad: JWT manipulation, RLS bypass, API directo | Herramientas de pentesting |

**Total Seguridad: ~8 casos**

### 2.3 Error Handling (Plan Cliente + Empleado)

| IDs | Origen | Descripción | Requiere |
|-----|--------|------------|----------|
| ERR-N1/N2 | Cliente | Error en notificaciones (network offline) | Inyección de errores de red |
| ERR-E1/E2 | Cliente | Error states generales | Provocar errores 500/timeout |
| ERR-EMP-01 a 20 | Empleado Avanz. | Error handling empleado (20 sub-tests) | Inyección de errores |

**Total Error Handling: ~24 casos**

### 2.4 Edge Cases (Plan Cliente + Empleado)

| IDs | Origen | Descripción | Requiere |
|-----|--------|------------|----------|
| EDGE-F1/F2 | Cliente | Favoritos masivos (50+ negocios) | Datos bulk en BD |
| EDGE-R1/R2 | Cliente | Reviews edge (doble envío, sin texto) | Parcialmente testable |
| EDGE-W1 a W3 | Cliente | Wizard abandono, back/forward, timeout | Parcialmente testable |
| EDGE-D1 | Cliente | Dashboard sin conexión | Offline mode |
| EDGE-N1/N2 | Cliente | Notificaciones masivas, rate limiting | Datos bulk |
| EDGE-EMP-01 a 30 | Empleado Avanz. | Edge cases empleado (30 sub-tests) | Datos especiales + condiciones edge |
| EMP-INT-EDGE | Empleado | Sesiones concurrentes, race conditions | 2+ navegadores simultáneos |

**Total Edge Cases: ~40 casos**

---

## 3. YA EJECUTADOS — RESUMEN POR PLAN

### 3.1 Plan Administrador

| Sección | Total Plan | Ejecutados | Pendientes | % Cubierto |
|---------|:---------:|:----------:|:----------:|:----------:|
| Acceso (ADM-01 a 05) | 5 | 5 | 0 | 100% |
| Shell (SHELL-01 a 12) | 12 | 12 | 0 | 100% |
| Negocios (NEG-01 a 06) | 6 | 2 | 4 | 33% |
| Sedes (LOC-01 a 07) | 7 | 4 | 3 | 57% |
| Servicios (SER-01 a 07) | 7 | 3 | 4 | 43% |
| Recursos (RES-01 a 07) | 7 | 2 | 5 | 29% |
| Empleados (EMP-01 a 04) | 4 | 4 | 0 | 100% |
| Reclutamiento (REC-01/02) | 2 | 2 | 0 | 100% |
| Ventas Rápidas (QS-01/02) | 2 | 1 | 1 | 50% |
| Egresos + Contabilidad | 2 | 2 | 0 | 100% |
| Reportes + Billing | 2 | 2 | 0 | 100% |
| Ausencias + Citas | 2 | 2 | 0 | 100% |
| Permisos + Settings | 2 | 2 | 0 | 100% |
| **TOTAL ADMIN** | **60** | **43** | **17** | **72%** |

### 3.2 Plan Cliente

| Sección | Total Plan | Ejecutados | Pendientes | % Cubierto |
|---------|:---------:|:----------:|:----------:|:----------:|
| Cambio de rol (C1-C3) | 3 | 1 | 2 | 33% |
| Dashboard (D1-D4) | 4 | 4 | 0 | 100% |
| Calendario (CAL1-CAL3) | 3 | 3 | 0 | 100% |
| Acciones cita (A1-A4) | 4 | 4 | 0 | 100% |
| Sugerencias (S1-S3) | 3 | 3 | 0 | 100% |
| Favoritos (F1-F3) | 3 | 3 | 0 | 100% |
| Historial (H1-H4) | 4 | 3 | 1 | 75% |
| Búsqueda (B1-B5) | 5 | 4 | 1 | 80% |
| Wizard (W1-W11) | 11 | 7 | 4 | 64% |
| Reviews (R1-R5) | 5 | 2 | 3 | 40% |
| Chat (CH1-CH5) | 5 | 2 | 3 | 40% |
| Settings (SET1-SET4) | 4 | 4 | 0 | 100% |
| Geolocalización (G1-G4) | 4 | 3 | 1 | 75% |
| Notificaciones (N1-N2) | 2 | 2 | 0 | 100% |
| Perfil público (P1-P2) | 2 | 0 | 2 | 0% |
| Mobile (MOB1) | 1 | 0 | 1 | 0% |
| **TOTAL CLIENTE (funcional)** | **63** | **45** | **18** | **71%** |
| PERF-* | ~30 | 0 | 30 | 0% (NO TESTABLE) |
| EDGE-* | ~10 | 1 | 9 | 10% |
| ERR-* | ~4 | 0 | 4 | 0% (NO TESTABLE) |
| SEC-* | ~2 | 0 | 2 | 0% (NO TESTABLE) |

### 3.3 Plan Empleado

| Sección | Total Plan | Ejecutados | Pendientes UI | % Cubierto |
|---------|:---------:|:----------:|:----------:|:----------:|
| 4.1 Acceso (6) | 6 | 1 | 5 | 17% |
| 4.2 Shell (8) | 8 | 1 | 7 | 13% |
| 4.3 Mis Empleos (7) | 7 | 3 | 4 | 43% |
| 4.4 Onboarding (6) | 6 | 0 | 6 | 0% |
| 4.5 Vacantes (8) | 8 | 1 | 7 | 13% |
| 4.6 Citas (8) | 8 | 1 | 7 | 13% |
| 4.7 Ausencias (10) | 10 | 2 | 8 | 20% |
| 4.8 Horarios (8) | 8 | 1 | 7 | 13% |
| 4.9 Configuraciones (8) | 8 | 0 | 8 | 0% |
| 4.10 Notificaciones/Chat (8) | 8 | 2 | 6 | 25% |
| 4.11 Integración (6) | 6 | 0 | 6 | 0% |
| 4.12 Seguridad (6) | 6 | 0 | 0 | — (NO TESTABLE) |
| 4.13 Perf Base (8) | 8 | 0 | 0 | — (NO TESTABLE) |
| **TOTAL EMPLEADO (funcional)** | **97** | **12** | **71** | **12%** |
| 4.19 Perf Avanzado (30) | 30 | 0 | 0 | — (NO TESTABLE) |
| 4.20 Edge Cases (30) | 30 | 0 | ~10 testable | — |
| 4.21 Error Handling (20) | 20 | 0 | 0 | — (NO TESTABLE) |
| 4.22 Integration (15) | 15 | 0 | ~5 testable | — |

### 3.4 Plan Permisos (ambos archivos)

| Plan | Total | Ejecutados | Pendientes | % |
|------|:-----:|:----------:|:----------:|:-:|
| PLAN_PRUEBAS_PERMISOS.md | ~25 | ~5 | ~7 testable | 20% |
| PLAN_PRUEBAS_PERMISOS_FASE_5.md | ~65 | ~9 | ~15 testable | 14% |

---

## 4. PRIORIZACIÓN RECOMENDADA

### Sprint 1 — Alto impacto, fácil de ejecutar (UI simple)

| # | ID | Plan | Descripción | Prereq |
|---|-----|------|------------|--------|
| 1 | EMP-APT-02 a 05 | Empleado | CRUD citas desde perspectiva empleado | Juan con citas E2E |
| 2 | EMP-VAC-03/04 | Empleado | Detalle + Aplicar a vacante | Solo UI clicks |
| 3 | EMP-ABS-03 a 05 | Empleado | Ausencias: tipos diferentes + cancelar | Solo UI clicks |
| 4 | EMP-HOR-02 a 05 | Empleado | Editar horarios reales | Modal ya visible |
| 5 | RES-03 | Admin | Eliminar recurso | Recurso E2E existe |
| 6 | SER-05 | Admin | Asociar servicio a empleado | UI disponible |
| 7 | P1/P2 | Cliente | Perfil público /negocio/:slug | URL pública |
| 8 | MOB1 | Cliente | Viewport mobile emulation | MCP emulate |

### Sprint 2 — Requiere datos E2E adicionales

| # | ID | Plan | Descripción | Dato necesario |
|---|-----|------|------------|---------------|
| 1 | 4.1-4.5 matrix | Permisos | Templates por rol | Crear usuarios con templates |
| 2 | W11 | Cliente | Wizard con resources | FitZone necesita employee_services |
| 3 | CH2 | Cliente | Chat desde cita pendiente | Crear nueva cita para Laura |
| 4 | H4 | Cliente | Paginación masiva historial | Crear 50+ citas históricas |
| 5 | EMP-ACC-04 | Empleado | Empleado desactivado | Desactivar empleado E2E |
| 6 | EMP-ACC-05 | Empleado | Multi-negocio empleado | Vincular Juan a 2+ negocios |

### Sprint 3 — Bloqueados por bugs conocidos

| # | ID | Plan | Descripción | Bug bloqueante |
|---|-----|------|------------|---------------|
| 1 | R3/R4/R5 | Cliente | CRUD reviews | BUG-R2-01 (PermissionGate) |
| 2 | B5 | Cliente | Filtros de búsqueda | BUG-B4-01 (panel no implementado) |
| 3 | G4 | Cliente | Geolocalización real | BUG-G1-01 (geo no invocada) |
| 4 | F3 (re-test) | Cliente | Toggle favoritos | BUG-F3-01 (UI no actualiza) |

---

## 5. ESTADÍSTICAS FINALES

| Métrica | Valor |
|---------|:-----:|
| **Total casos en 6 planes** | ~420 |
| **Ejecutados (reporte 20 sesiones)** | 202 (48%) |
| **Pendientes testables UI** | ~95 (23%) |
| **No testables (PERF/SEC/ERR)** | ~120 (29%) |
| **Mayor gap**: Rol Empleado | 71 de 97 funcionales (73% sin probar) |
| **Mejor cobertura**: Rol Cliente | 45 de 63 funcionales (71% cubierto) |
| **Bugs documentados** | 70 |

---

*Generado por análisis automatizado de 6 planes de prueba vs reporte de 20 sesiones (202 casos)*

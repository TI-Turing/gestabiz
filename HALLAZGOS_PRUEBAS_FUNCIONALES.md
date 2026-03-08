# Hallazgos de Pruebas Funcionales - Gestabiz

> **Fecha inicio**: 7 de marzo de 2026  
> **Estado**: En ejecución  
> **Regla**: Solo documentar, NO corregir

---

## Resumen de Hallazgos

| Severidad | Cantidad |
|-----------|----------|
| 🔴 Crítico (bloquea funcionalidad) | 4 |
| 🟠 Alto (funcionalidad degradada) | 3 |
| 🟡 Medio (UX/UI incorrecto) | 12 |
| 🔵 Bajo (cosmético/menor) | 19 |
| ❓ Dudas/Incoherencias | 2 |

---

## Hallazgos

### H-001 🔵 Copyright año desactualizado en Landing Page
- **Componente**: LandingPage (footer)
- **Severidad**: Bajo
- **Descripción**: El footer muestra "© 2025 Gestabiz" pero estamos en 2026
- **Ubicación**: Footer de la landing page
- **Esperado**: "© 2026 Gestabiz" o mejor, año dinámico

### H-002 🟡 Testimonio menciona "AppointSync" en vez de "Gestabiz"
- **Componente**: LandingPage (testimonios)
- **Severidad**: Medio
- **Descripción**: El testimonio del Dr. Carlos Ramírez dice "AppointSync me devolvió 10 horas a la semana" en vez de mencionar "Gestabiz"
- **Ubicación**: Sección Testimonios, segundo testimonio
- **Impacto**: Inconsistencia de marca, parece un rename incompleto

### H-003 🟡 Links del footer llevan a rutas inexistentes
- **Componente**: LandingPage (footer)
- **Severidad**: Medio
- **Descripción**: Los links del footer (Blog, Ayuda, Tutoriales, Contacto, Integraciones, API, Términos, Privacidad, Cookies, Licencias) apuntan a rutas `/blog`, `/help`, `/tutorials`, `/contact`, `/integrations`, `/api`, `/terms`, `/privacy`, `/cookies`, `/licenses` que no existen como rutas en el router. Al hacer clic, el catch-all del router redirige a la landing page en vez de mostrar una 404 o la página correcta.
- **Rutas afectadas**: /blog, /help, /tutorials, /contact, /integrations, /api, /terms, /privacy, /cookies, /licenses
- **Esperado**: Páginas de contenido real o al menos una página 404 informativa

### H-004 🔵 Emojis usados en el footer de la Landing Page
- **Componente**: LandingPage (footer)  
- **Severidad**: Bajo
- **Descripción**: El footer dice "Hecho con ❤️ en Colombia 🇨🇴" usando emojis. Según las convenciones del proyecto ("NUNCA usar emojis en componentes UI - SIEMPRE usar iconos profesionales"), debería usar iconos de Phosphor Icons o Lucide React.
- **Nota**: Sin embargo esto es la landing pública, así que la regla puede ser flexible aquí.

### H-005 🔵 Logs de debug excesivos en consola
- **Componente**: MainApp.tsx, ClientDashboard.tsx, NotificationContext
- **Severidad**: Bajo
- **Descripción**: La consola muestra múltiples mensajes de debug repetidos:
  - `[ClientDashboard] MOUNT - user object:` se repite 4+ veces
  - `🔍 DEBUG MainApp - employeeBusinesses:` aparece en cada render
  - `🔥🔥🔥 [NotificationContext]` con emojis de fuego
- **Impacto**: Ruido en console, posible indicador de re-renders excesivos

### H-006 ❓ URL muestra `/app/client/appointments` pero contenido es Admin Dashboard
- **Componente**: MainApp.tsx / Routing
- **Severidad**: Duda/Incoherencia
- **Descripción**: Al tomar snapshot, la URL era `/app/client/appointments` pero el contenido renderizado era el Admin Dashboard completo con menú lateral de admin (Resumen, Citas, Sedes, Servicios, Empleados, etc.). La URL no corresponde con el contenido visible.
- **Posible causa**: El routing usa la URL para la ruta pero el renderizado depende del `activeRole` que está en estado/localStorage, no en la URL. Si el `activeRole` es 'admin', se muestra Admin Dashboard sin importar la URL.
- **Impacto**: URL no sirve como referencia confiable del estado actual de la app

### H-007 ❓ Navegación a `/` como usuario autenticado no muestra Landing Page
- **Componente**: App.tsx routing
- **Severidad**: Duda/Incoherencia  
- **Descripción**: Al navegar a `/` estando autenticado, el primer render mostró el Client Dashboard en vez de la Landing Page. Según el código del router, `/` debería mostrar LandingPage sin verificar auth. Puede que haya un redirect automático que no está claro.
- **Nota**: Después de logout, la landing se muestra correctamente.

### H-008 🟡 Nombre inconsistente del producto en Landing
- **Componente**: LandingPage
- **Severidad**: Medio
- **Descripción**: El producto se llama "Gestabiz" pero en la calculadora de ROI se menciona "AppointSync" ($79.900 costo). El nombre "AppointSync" aparece en al menos 2 lugares de la landing (sección beneficios/ROI y testimonio).
- **Ubicación**: Sección "Beneficios Reales" - "Costo de AppointSync: -$79.900"

### H-009 🔵 Stats del Hero son ficticios y hardcodeados  
- **Componente**: LandingPage (Hero)
- **Severidad**: Bajo
- **Descripción**: Los stats "800+ Negocios Activos", "50K+ Citas Agendadas", "98% Satisfacción" están hardcodeados. El dashboard demo muestra "24 Citas Hoy" y "$2.4M Ingresos Mensuales" también ficticios. No es un bug per se, pero los valores son muy ambiciosos para un producto en beta.

---

### H-010 🔴 CRÍTICO: Error 500 al crear negocio - stack depth limit exceeded
- **Componente**: BusinessRegistration.tsx (línea 135)
- **Severidad**: Crítico (BLOQUEANTE)
- **Descripción**: Al intentar crear un nuevo negocio enviando POST a `/rest/v1/businesses?select=*`, Supabase retorna **HTTP 500** con error PostgreSQL `54001`:
  ```json
  {
    "code": "54001",
    "hint": "Increase the configuration parameter \"max_stack_depth\" (currently 2048kB)",
    "message": "stack depth limit exceeded"
  }
  ```
- **Causa probable**: Recursión infinita en triggers o RLS policies de la tabla `businesses`. Algún trigger (ej: auto_insert_owner_to_business_employees, auto_assign_permissions_to_owners) o política RLS ejecuta código que vuelve a consultar la misma tabla, causando un bucle sin fin que excede el stack de PostgreSQL.
- **Consola**: Error 500 en red + "Uncaught (in promise)" en BusinessRegistration.tsx:135
- **Impacto**: **Ningún usuario nuevo puede crear un negocio**. Esto bloquea TODA la funcionalidad de Admin. Sin negocio no se pueden probar sedes, servicios, empleados, citas, etc.
- **Toast mostrado**: "Error al crear el negocio" (genérico, no muestra detalles)
- **Datos enviados correctamente**: name, slug, category_id, owner_id, phone, email, country_id, region_id, city_id, settings - todo correcto en el request body

### H-011 🟡 Botón "common.cancel" muestra clave i18n sin traducir
- **Componente**: BusinessRegistration.tsx 
- **Severidad**: Medio
- **Descripción**: El botón de cancelar en el formulario de creación de negocio muestra el texto literal "common.cancel" en vez del texto traducido "Cancelar".
- **Ubicación**: Parte inferior del formulario de registro de negocio
- **Causa probable**: La clave `common.cancel` no existe en el diccionario de traducciones o la función `t()` no está procesando correctamente la clave.

### H-012 🔵 Placeholder del campo Descripción repite el subtítulo de la página
- **Componente**: BusinessRegistration.tsx
- **Severidad**: Bajo
- **Descripción**: El campo textarea de descripción del negocio tiene como placeholder "Crea el perfil de tu negocio para comenzar a gestionar citas", que es exactamente el mismo texto que el subtítulo de la página. Debería tener un placeholder descriptivo como "Describe tu negocio, los servicios que ofreces y lo que te hace especial..."
- **Ubicación**: Campo "Descripción" en sección Información Básica

### H-013 🔵 Emojis de banderas en selector de código telefónico
- **Componente**: BusinessRegistration.tsx / PhoneInput
- **Severidad**: Bajo
- **Descripción**: El selector de código de país para teléfono muestra "🇨🇴 +57" usando emojis de banderas. Según la convención del proyecto de no usar emojis en UI, debería usar iconos SVG de banderas o solo el código ISO.
- **Ubicación**: Campo "Teléfono" en sección Información de Contacto

### H-014 🟡 Header badge "Sin categoría" no se actualiza al seleccionar categoría
- **Componente**: AdminDashboard header / BusinessRegistration
- **Severidad**: Medio
- **Descripción**: El header del Admin Dashboard muestra "Crear tu Negocio" con badge "Sin categoría" (verde). Aunque el usuario ya seleccionó "Belleza y Estética" en el formulario de registro, el badge del header no se actualiza para reflejar la categoría elegida.
- **Ubicación**: Banner superior del layout

### H-015 🟠 React setState during render en CountrySelect
- **Componente**: BusinessRegistration.tsx / CountrySelect
- **Severidad**: Alto
- **Descripción**: Error de React en consola: "Cannot update a component (BusinessRegistration) while rendering a different component (CountrySelect)". Este es un anti-patrón de React que indica un `setState()` llamado durante la fase de render de otro componente. Puede causar comportamiento impredecible y re-renders infinitos.
- **Consola**: `Cannot update a component (%s) while rendering a different component (%s)` con BusinessRegistration + CountrySelect
- **Impacto**: Potencial degradación de performance y comportamiento impredecible en formularios de ubicación

### H-016 🔵 Texto de descripción se duplica al usar fill + type_text
- **Componente**: BusinessRegistration.tsx / textarea
- **Severidad**: Bajo (solo afecta testing automatizado)
- **Descripción**: El campo textarea de descripción no responde correctamente al evento `fill` (timeout 5.5s), obligando a usar `click` + `type_text` como fallback, lo cual puede resultar en texto duplicado. Esto indica que el textarea tiene un binding complejo que dificulta la interacción programática.
- **Nota**: Podría afectar también a tests E2E automatizados

---

## Hallazgos del Admin Dashboard (sesión 2)

### H-017 🟡 Filtro PROFESIONAL en Citas: error gramatical "1 seleccionados"
- **Componente**: Admin Dashboard → Citas → Filtros PROFESIONAL
- **Severidad**: Medio (UX/i18n)
- **Descripción**: Al seleccionar 1 profesional, el badge muestra "1 seleccionados" (plural) cuando debería mostrar "1 seleccionado" (singular). Falta lógica de pluralización en el componente de filtro.
- **Reproducción**: Citas → Filtros → PROFESIONAL → Seleccionar un profesional → Badge muestra "1 seleccionados"

### H-018 🟠 Inconsistencia de datos entre módulos (Empleados)
- **Componente**: AdminDashboard (Resumen), Empleados, Permisos, Citas
- **Severidad**: Alto (datos inconsistentes confunden al usuario)
- **Descripción**: El conteo de empleados varía según el módulo consultado:
  - Dashboard Resumen: muestra "Empleados: 1"  
  - Página Empleados: muestra "Total de Empleados: 0"
  - Permisos → Usuarios tab: muestra "Empleados: 0"
  - Citas → Filtro PROFESIONAL: lista "Owner Usuario 1"
  
  El owner registrado como employee (via trigger `auto_insert_owner_to_business_employees`) aparece en Citas pero NO en la gestión general de Empleados ni en Permisos. Cada módulo consulta/filtra la tabla `business_employees` de forma diferente.

### H-019 🔴 CRÍTICO: "Nueva Vacante" (Reclutamiento) crashea toda la página
- **Componente**: Reclutamiento → Botón "Nueva Vacante" → CreateVacancy modal
- **Severidad**: Crítico (Error Boundary activado, página inutilizable)
- **Descripción**: Al hacer clic en "Nueva Vacante", se produce un crash completo de la página con Error Boundary mostrando "Oops! Algo salió mal" (Error ID: mmgu58823wk8qd238uk). El error de causa raíz es:
  - **"Maximum update depth exceeded"** en un componente `<button>` (Radix UI Popper/Popover)
  - **49 errores de clave React duplicada**: "Encountered two children with the same key, COP" en consola
  
  Parece ser un selector de moneda/currency en el formulario de creación de vacante que genera claves duplicadas "COP", causando un loop infinito de re-renders. Bloquea completamente la creación de vacantes.
- **Reproducción**: Admin → Reclutamiento → "Nueva Vacante" → Crash inmediato
- **Consola**: 49x `Warning: Encountered two children with the same key, COP` + `Maximum update depth exceeded`

### H-020 🔵 Facturación: sin título de página
- **Componente**: Admin Dashboard → Facturación
- **Severidad**: Bajo (cosmético)
- **Descripción**: La página de Facturación no tiene heading/título propio. Al cargar, va directamente a la card del "Plan Gratuito" sin un encabezado "Facturación" o "Mi Suscripción". Las demás secciones del admin sí tienen título (ej: "Gestión de Permisos", "Reportes Financieros", etc.).

### H-021 🔵 Inconsistencia en nombres: "Ubicaciones" vs "Sedes"
- **Componente**: Business Registration (onboarding) vs Admin Dashboard sidebar
- **Severidad**: Bajo (confusión conceptual)
- **Descripción**: El formulario de onboarding (Business Registration) usa el término "Ubicaciones", mientras el sidebar del Admin Dashboard usa "Sedes". Ambos se refieren a la misma entidad (`locations`). Se debería unificar el término.

### H-022 🔵 Emojis en badges de UI (⭐ en Administrada y Calificación)
- **Componente**: Sedes cards (badge "Administrada"), Empleados (Calificación Promedio)
- **Severidad**: Bajo (viola la regla "NUNCA usar emojis en componentes UI")
- **Descripción**: Se usan emojis ⭐ en badges (ej: "⭐ Administrada" en tarjetas de Sedes, "⭐ Sin calificaciones" en tarjetas de empleados). Según las instrucciones del proyecto, se deben usar SIEMPRE iconos profesionales (Phosphor Icons o Lucide React) en lugar de emojis.

### H-023 🔵 Emoji 🔴 en badge "No disponible al público"
- **Componente**: Admin Dashboard → Resumen (banner de estado del negocio)
- **Severidad**: Bajo (viola regla de NO emojis en UI)
- **Descripción**: En el dashboard, el badge de estado del negocio muestra un emoji 🔴 junto al texto "No disponible al público". Debería usar un icono SVG profesional.

### H-024 🔵 Botones de edición/eliminar en Sedes sin labels accesibles
- **Componente**: Admin → Sedes → Cards de ubicación (botones edit/delete)
- **Severidad**: Bajo (accesibilidad, a11y)
- **Descripción**: Los botones de edición y eliminación en las tarjetas de Sedes no tienen atributos `aria-label` ni texto visible, lo que dificulta la accesibilidad para lectores de pantalla. Solo muestran iconos sin contexto textual.

### H-025 🔵 Botón "Comenzar Gratis" lleva a Login en vez de Registro
- **Componente**: Landing Page → Hero → Botón CTA principal
- **Severidad**: Bajo (UX subóptima)
- **Descripción**: El botón principal "Comenzar Gratis" del hero de la Landing Page dirige al usuario a la página de Login (/login) cuando lo esperable sería que dirija a Registro (/register), ya que está orientado a nuevos usuarios.

### H-026 🔵 Info de modo DEV visible en pantallas de auth
- **Componente**: AuthScreen (Login / Register)
- **Severidad**: Bajo (cosmético, solo visible en desarrollo)
- **Descripción**: En las pantallas de autenticación se muestran elementos de desarrollo: badge "Modo DEV", y botón "DEV ONLY - Magic Link". Estos elementos deberían estar condicionados a `import.meta.env.DEV` o similar para no aparecer en producción.

### H-027 🔵 Docs mencionan 5 planes de billing pero UI muestra 4
- **Componente**: Facturación → Planes y Precios
- **Severidad**: Bajo (inconsistencia documentación vs implementación)
- **Descripción**: La documentación (copilot-instructions.md) menciona 5 planes: Gratuito, Inicio, Profesional, Empresarial, **Corporativo**. Sin embargo la UI solo muestra 4 planes (sin Corporativo). Los planes Profesional y Empresarial están marcados como "Próximamente".

### H-028 🟡 3 de 4 tabs en Permisos son placeholders "en desarrollo"
- **Componente**: Admin → Permisos (tabs: Permisos, Plantillas, Historial)
- **Severidad**: Medio (funcionalidad incompleta vs documentación)
- **Descripción**: Solo el tab "Usuarios" en la sección Permisos tiene implementación funcional. Los otros 3 tabs muestran mensajes placeholder:
  - "Permisos": "Componente PermissionEditor en desarrollo..."
  - "Plantillas": "Componente PermissionTemplates en desarrollo..."
  - "Historial": "Componente AuditLog en desarrollo..."
  
  La documentación (copilot-instructions.md) indica "Fase 5 COMPLETADA" con "79 tipos de permisos", "25 módulos protegidos", templates funcionales, etc. Hay una discrepancia significativa entre lo documentado como completado y la implementación visible en UI.

### H-029 🟡 Botón "Asignar Rol" en Permisos no tiene efecto visible
- **Componente**: Admin → Gestión de Permisos → Botón "Asignar Rol"
- **Severidad**: Medio (botón visible sin funcionalidad)
- **Descripción**: El botón "Asignar Rol" en la esquina superior derecha de la página de Permisos no produce ninguna acción visible al hacer clic (no abre modal, no navega, no muestra error). Podría estar sin implementar o tener un error silencioso.

### H-030 🟠 Navegación del sidebar en Employee Dashboard no funciona
- **Componente**: Employee Dashboard → Sidebar completo
- **Severidad**: Alto (toda la navegación del rol Empleado está rota)
- **Descripción**: Los 5 botones del sidebar del Employee Dashboard (Mis Empleos, Buscar Vacantes, Mis Ausencias, Mis Citas, Horario) **todos muestran exactamente la misma vista "Mis Empleos"**. Al hacer clic en cualquiera de los otros 4 ítems, el contenido no cambia. La vista de "Buscar Vacantes", "Mis Ausencias", "Mis Citas" y "Horario" nunca se cargan. Esto impide que un empleado acceda a funcionalidades básicas como ver sus citas o solicitar ausencias desde este rol.
- **Reproducción**: Login → Cambiar rol a "Empleado" → Clic en cualquier item de sidebar → Siempre muestra "Mis Empleos"

### H-031 🟡 Error toast "Error al cargar solicitudes" en Employee Dashboard
- **Componente**: Employee Dashboard (al cargar initial)
- **Severidad**: Medio (UX degradada)
- **Descripción**: Al cambiar al rol Empleado, aparece brevemente un toast de error rojo en la esquina inferior derecha: "Error al cargar solicitudes". Indica un fallo en una query (posiblemente de ausencias o solicitudes de empleo) que no está manejado silenciosamente.

### H-032 🟡 AppointmentWizard: textos en inglés mientras app está en español
- **Componente**: Client Dashboard → Nueva Cita → AppointmentWizard
- **Severidad**: Medio (i18n incompleta)
- **Descripción**: El wizard de creación de citas muestra textos en inglés cuando el idioma del sistema está en español:
  - "Select a Business" (debería ser "Selecciona un Negocio")
  - "Choose the business where you want to book your appointment"
  - "Business Selection" (nombre del paso)
  - "← Back" / "Next Step →" (botones de navegación)
  - "Step 1 of 6", "0 of 6 steps completed", "17% Complete"
  - "Preferred location: Bogotá D.C."
  - "Buscar negocios..." (este SÍ está en español - inconsistente)

### H-033 🔵 Emoji de bandera en selector de idioma (Configuración)
- **Componente**: Configuraciones → Configuración General → Idioma
- **Severidad**: Bajo (viola regla NO emojis en UI)
- **Descripción**: El selector de idioma muestra "🇪🇸 Español" con emoji de bandera. Debería usar un icono o texto plano "ES" como prefijo en lugar del emoji, siguiendo la regla del proyecto.

### H-034 🔵 URL no refleja la navegación por rol
- **Componente**: URL router (todos los roles)
- **Severidad**: Bajo (UX)
- **Descripción**: Al cambiar entre roles (Admin → Empleado → Cliente), la URL del navegador sigue mostrando la ruta anterior (ej: `/app/admin/settings`), pero el contenido cambia al dashboard del rol seleccionado. Esto puede causar confusión y problemas con bookmarks/compartir URLs.

### H-035 🔴 CRÍTICO: Error 500 al crear negocio bloquea registro de nuevos owners
- **Componente**: Business Registration → Submit
- **Severidad**: Crítico (duplicado reforzado de H-010)
- **Descripción**: Reconfirmado durante esta sesión: el error de PostgreSQL "stack depth limit exceeded" (54001) al intentar crear un negocio con el formulario BusinessRegistration sigue activo. Esto bloquea:
  - Registro de nuevos propietarios de negocios
  - Onboarding completo de nuevos usuarios que quieran ser admins
  - Toda la cadena de datos derivados (locations, services, employees, etc.)
  
  La causa sigue siendo triggers/RLS recursivos en la tabla `businesses`. Este es el bug más crítico del sistema ya que impide el flujo fundamental de adquisición de nuevos clientes.

---

## Hallazgos Adicionales del testing global

### Resumen de módulos probados (Admin Dashboard)

| Módulo | Estado | Notas |
|--------|--------|-------|
| Resumen | ✅ Funcional | Stats, "Falta configuración" banner |
| Sedes | ✅ Funcional | 1 sede, edit modal con tabs completo |
| Servicios | ✅ Funcional | 3 servicios cargados correctamente |
| Empleados | ⚠️ Parcial | Muestra 0 empleados (owner no aparece como employee) |
| Citas | ✅ Funcional | Calendario, filtros, profersion filter funciona |
| Ausencias | ✅ Funcional | 2 tabs (Pendientes/Historial), estados vacíos OK |
| Reclutamiento | 🔴 Crash | "Nueva Vacante" crashea la página completamente |
| Ventas Rápidas | ✅ Funcional | Formulario completo, stats, historial |
| Egresos | ✅ Funcional | 3 tabs funcionales con estados vacíos |
| Reportes | ✅ Funcional | Dashboard financiero con gráficos y exportación |
| Facturación | ✅ Funcional | Plan Gratuito + página de planes (4 de 5 documentados) |
| Permisos | ⚠️ Parcial | Solo tab Usuarios funcional, 3/4 tabs son placeholders |
| Notificaciones | ✅ Funcional | Panel desplegable con 3 tabs |
| Chat | ✅ Funcional | Panel lateral, estado vacío correcto |
| Configuración | ✅ Funcional | 5 tabs completas (Tema, Perfil, Notif, Negocio, Zona Peligro) |
| Reportar problema | ✅ Funcional | Modal completo con formulario profesional |

### Resumen de módulos probados (Employee Dashboard)

| Módulo | Estado | Notas |
|--------|--------|-------|
| Mis Empleos | ✅ Funcional | Stats de vínculos, tarjeta de negocio |
| Buscar Vacantes | 🔴 No navega | Muestra vista de "Mis Empleos" |
| Mis Ausencias | 🔴 No navega | Muestra vista de "Mis Empleos" |
| Mis Citas | 🔴 No navega | Muestra vista de "Mis Empleos" |
| Horario | 🔴 No navega | Muestra vista de "Mis Empleos" |

### Resumen de módulos probados (Client Dashboard)

| Módulo | Estado | Notas |
|--------|--------|-------|
| Mis Citas | ✅ Funcional | Lista/Calendario toggle, "Nueva Cita" abre wizard |
| Favoritos | ✅ Funcional | Estado vacío con tip instructivo |
| Historial | ✅ Funcional | Stats completas, filtros avanzados (7 filtros) |
| Nueva Cita (wizard) | 🔴 Bloqueado | Dialog se cierra en Step 4 (DateTimeSelection) — no permite completar cita |
| Calendario (Día) | ✅ Funcional | Vista diaria con slots horarios |
| Calendario (Semana) | ✅ Funcional | Vista semanal Mon-Sun, "Sin citas" por día |
| Calendario (Mes) | ✅ Funcional | Vista mensual, día actual resaltado |

---

## Hallazgos del AppointmentWizard (Sesión 2 - 7 Mar 2026)

### H-036 🔴 CRÍTICO: Wizard se cierra al interactuar con Step 4 (DateTimeSelection)
- **Componente**: AppointmentWizard → DateTimeSelection (Step 4)
- **Severidad**: Crítico (bloquea creación de citas)
- **Descripción**: Al llegar al Step 4 "Date & Time" del wizard, hacer clic en un botón de fecha (calendario) o un slot de hora causa que el diálogo se cierre inesperadamente, retornando al Client Dashboard sin crear la cita. Reproducido 3 veces consecutivas:
  1. Intento 1: Fecha seleccionada OK → clic en slot "10:00 AM" → wizard cerrado
  2. Intento 2: Clic en fecha "10 Marzo" → wizard cerrado inmediatamente
  3. Intento 3: Clic en fecha "10 Marzo" → wizard cerrado inmediatamente
- **Causa raíz identificada**: Race condition entre framer-motion `AnimatePresence mode="wait"` y Radix Dialog. Los botones de fecha son `motion.button` — al hacer clic, framer-motion remueve el nodo del DOM durante la animación. Radix Dialog detecta que el pointer ya no está sobre un elemento dentro de `DialogContent` e interpreta esto como "click outside" → llama `onOpenChange(false)` → cierra el dialog.
- **Archivos involucrados**: 
  - `src/components/ui/calendar.tsx` (motion.button + AnimatePresence mode="wait")
  - `src/components/appointments/AppointmentWizard.tsx` (Dialog sin protección onInteractOutside)
  - `src/components/ui/dialog.tsx` (DialogContent sin override de dismiss)
- **Impacto**: **Bloquea completamente la creación de citas** — el flujo principal de la aplicación para clientes no puede completarse. Steps 1-3 funcionan correctamente; Steps 4-5 son inaccesibles.
- **Solución sugerida**: Agregar `onInteractOutside={(e) => e.preventDefault()}` y `onPointerDownOutside={(e) => e.preventDefault()}` al `DialogContent` del wizard.

### H-037 🟡 Contador de pasos incorrecto en Step 2 (Location Selection)
- **Componente**: AppointmentWizard → ProgressBar (Step 2)
- **Severidad**: Medio
- **Descripción**: Al avanzar al Step 2 "Selecciona una Sede", el contador muestra **"Step 0 of 5"** y **"0% Complete"** en lugar de "Step 2 of 5" y "40% Complete". El label de "Business Selection" también desaparece. Los steps indicators (1-5 circles) no reflejan el paso actual correctamente.
- **Reproducción**: Seleccionar negocio con 1 sede → Next → Observar "Step 0 of 5" / "0% Complete"

### H-038 🟡 i18n inconsistente entre pasos del wizard
- **Componente**: AppointmentWizard (todos los steps)
- **Severidad**: Medio
- **Descripción**: Los textos del wizard alternan entre inglés y español de forma inconsistente:
  - **Step 1**: Todo en inglés — "Select a Business", "Business Selection", "Choose the business...", "Next Step →", "← Back"
  - **Step 2**: En español — "Selecciona una Sede", "Elige la ubicación donde deseas tu cita"
  - **Step 3 header**: "Employee Selection" (inglés), contenido "Selecciona un Profesional" (español)
  - **Step 4 header**: "Select Date & Time" (inglés), "Selected service:" (inglés), pero días del calendario en español
  - **Step 4 slots**: "Available on March 9, 2026" (inglés) junto a "Fecha seleccionada: lunes, 9 de marzo de 2026" (español)
  - **Step footer**: "Please select a date to see available time slots" (inglés)
  - **Botones de navegación**: Siempre en inglés ("Next Step →", "← Back")
- **Nota**: El idioma del usuario está configurado como `"language": "es"`. Los textos del wizard deberían estar todos en español.

### H-039 🔵 Emojis en log de business cards del wizard
- **Componente**: AppointmentWizard → BusinessSelection cards
- **Severidad**: Bajo (violación de convención)
- **Descripción**: Las tarjetas de negocios en Step 1 muestran "⭐ 0.0 · 0 reseñas" usando un emoji de estrella en lugar de un icono SVG de Phosphor/Lucide. Viola la convención del proyecto: "NUNCA usar emojis en componentes UI — SIEMPRE usar iconos profesionales".

### H-040 🔵 Negocio duplicado "Alimentación Premium Bogotá" en wizard
- **Componente**: AppointmentWizard → BusinessSelection (Step 1)
- **Severidad**: Bajo (posible dato duplicado en BD)
- **Descripción**: En la lista de negocios del Step 1 aparecen DOS entradas de "Alimentación Premium Bogotá" — una con 10 sedes y otra con 6 sedes. Ambas con la misma imagen, misma descripción genérica y mismo teléfono (3001234567). Posible duplicación en la tabla `businesses` de los seed data.

# Plan de Pruebas Rol Cliente

> **REGLA**: SOLO se documentan bugs. NO se toca código ni se intentan solucionar. La corrección se hará en fase posterior.

## 1. Objetivo y Alcance
- Validar de forma integral todos los flujos disponibles para usuarios con rol Cliente dentro de la plataforma web Gestabiz (React 18 + Supabase + Vite).
- Cubrir escenarios funcionales, negativos, permisos, integraciones con Supabase/edge functions, experiencia responsive y consideraciones mobile (WebView Expo).
- Asegurar que los agregados recientes (useClientDashboard, BusinessSuggestions v2, MandatoryReviewModal refactor, geolocalizacion, permiso granular) no introducen regresiones.

## 2. Preparacion del Entorno
- Ambiente: branch principal conectado a Supabase Cloud (misma instancia usada en produzione).
- Variables obligatorias: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GA_MEASUREMENT_ID`, `VITE_PAYMENT_GATEWAY`, llaves de chat y notificaciones activas.
- Deshabilitar caches del navegador al ejecutar pruebas manuales para validar React Query first-load.
- Dataset consistente con al menos 3 negocios activos, 5 servicios, 4 ubicaciones, empleados con y sin disponibilidad, recursos fisicos (para flujo flexible), citas en todos los estados (`pending`, `confirmed`, `completed`, `cancelled`, `no_show`).
- Asegurarse de que la edge function `get-client-dashboard-data` y RPC `search_*` esten desplegadas (comprobar via `npx supabase functions list`).

### 2.1 Cuentas de Prueba
| Usuario | Rol Principal | Escenarios | Notas |
|---------|---------------|-----------|-------|
| client_owner@gestabiz.com | Owner + acceso Cliente | Validar bypass permisos propietarios | Asociado a negocio A/B |
| client_standard@gestabiz.com | Cliente puro (sin permisos especiales) | Escenarios negativos de PermissionGate | Debe tener citas historicas |
| client_restricted@gestabiz.com | Cliente con permisos revocados (`appointments.cancel_own`, `appointments.reschedule_own`) | Validar ocultamiento de acciones | Actualizar tabla `user_permissions` antes de iniciar |
| admin_multi@gestabiz.com | Admin/Empleado/Cliente | Validar cambios de rol y navegacion cruzada | Usar para pruebas con notificaciones |

### 2.2 Datos Base
- Negocio A (modelo professional): 2 sedes, 3 empleados, horarios configurados con almuerzo y un dia festivo bloqueado.
- Negocio B (modelo hybrid): 1 recurso fisico (sala) ligado a servicios.
- Negocio C (sin favoritos previos) para validar estados vacios.
- Citas de prueba:
  - 2 futuras confirmadas, 1 pendiente dentro de 90 minutos, 1 pendiente fuera de 90 minutos, 1 completada sin review, 1 completada con review, 1 cancelada y 1 no_show.
- Reviews: al menos una cita completada sin review para disparar MandatoryReviewModal y otra con review para validar filtrado.
- Notificaciones: cargar notificaciones tipo `appointment_confirmed`, `chat_message`, `system_announcement` asociadas a cliente bajo prueba.

## 3. Inventario Funcional
| Area | Componentes clave | Dependencias Supabase/otros |
|------|-------------------|-----------------------------|
| Layout & Shell | `UnifiedLayout`, `SearchBar`, `SearchResults`, `NotificationCenter`, `usePendingNavigation` | tablas `in_app_notifications`, `chat_*`, `user_permissions`, storage local/session |
| Dashboard Mis Citas | `ClientDashboard`, `ClientCalendarView`, `useClientDashboard`, `BusinessSuggestions`, `usePreferredCity` | Edge `get-client-dashboard-data`, tablas `appointments`, `businesses`, `services`, `locations`, `reviews` |
| Historial | `ClientHistory` | tablas `appointments`, `businesses`, `locations`, `services`, `profiles` |
| Favoritos | `FavoritesList`, `useFavorites` | tablas `business_favorites`, `businesses` |
| Busqueda | `SearchBar`, `SearchResults`, RPC `search_*` | funciones RPC `search_businesses`, `search_services`, `search_professionals`, localStorage `last-search` |
| Wizard de Citas | `AppointmentWizard` + subflows (servicio, recurso, fecha/horario, confirmacion) | tablas `appointments`, `employee_absences`, `public_holidays`, `business_resources`, edge function `appointment-actions` |
| Reviews | `MandatoryReviewModal`, `useMandatoryReviews` | tablas `appointments`, `reviews`, localStorage `appointsync_remind_later_reviews` |
| Chat | `useChat`, chat modal en `UnifiedLayout` | tablas `chat_conversations`, `chat_messages`, RPC `get_or_create_direct_conversation` |
| Ajustes Cliente | `CompleteUnifiedSettings` (tab cliente) | tablas `profiles`, `notification_preferences`, `user_settings` |
| Geolocalizacion/Sugerencias | `useGeolocation`, `BusinessSuggestions` | API navegador, storage `preferred-city`, Edge data consolidada |

## 4. Escenarios de Prueba

### 4.1 Acceso y Cambio de Rol
- **Caso C1 – Cambio manual de rol a Cliente**
  - **Objetivo**: confirmar que `UnifiedLayout` muestra sidebar de cliente y carga `useClientDashboard` una sola vez.
  - **Precondiciones**: Sesion iniciada con usuario multi-rol.
  - **Pasos**: 1) Cambiar rol desde selector, 2) Abrir consola de red y refrescar, 3) Verificar request a `functions/v1/get-client-dashboard-data`.
  - **Resultado esperado**: Sidebar con items `Mis Citas`, `Favoritos`, `Historial`; sin solicitudes duplicadas; React Query key `client-dashboard` poblada.

- **Caso C2 – Navegacion pendiente por notificacion**
  - **Precondiciones**: Guardar objeto `pending-navigation` en `sessionStorage` (`{"page":"appointments","timestamp":Date.now()}`).
  - **Pasos**: 1) Cambiar a rol Cliente, 2) Observar redireccion automatica.
  - **Resultado esperado**: `usePendingNavigation` limpia storage y navega a `/app/client/appointments` dentro de 5s.

- **Caso C3 – Notificacion in-app que requiere cambio de rol**
  - **Pasos**: 1) Desde rol Admin abrir notificacion `appointment_confirmed`, 2) Confirmar cambio a rol Cliente.
  - **Resultado esperado**: `NotificationRoleMapping` solicita rol Cliente, crea entrada en sessionStorage, `UnifiedLayout` ejecuta navegacion y elimina entrada.

### 4.2 Dashboard Mis Citas (vista lista)
- **Caso D1 – Render con citas futuras**
  - Asegurar que tarjeta muestra estado, servicio, negocio, sede, horario formateado 12h, precio, imagen de servicio y fallback de banner.
- **Caso D2 – Estado sin citas**
  - Eliminar citas futuras; visualizar card vacia con CTA.
- **Caso D3 – Imagenes servicio/sede**
  - Confirmar fetch de media (storage `business-media`), fallback a icono y manejo de errores.
- **Caso D4 – Boton Nueva Cita**
  - Debe abrir `AppointmentWizard` con `businessId` nulo, sin warning en consola.

### 4.3 Dashboard vista calendario
- **Caso CAL1 – Navegacion dia/semana/mes**
  - Validar cambio de rango, resaltado de fecha actual y conteo de citas por rango.
- **Caso CAL2 – Restriccion 90 minutos**
  - Seleccionar dia actual y hora < 90 minutos; boton crear cita debe ocultarse.
- **Caso CAL3 – Crear cita desde calendario**
  - Click en hora valida; wizard abre con fecha/hora preseleccionadas.

### 4.4 Detalle de cita
- **Caso A1 – Modal con acciones habilitadas**
  - Seleccionar cita futura; botones `Reprogramar`, `Cancelar`, `Chatear` visibles cuando permisos existen.
- **Caso A2 – PermissionGate ocultando acciones**
  - Usar usuario `client_restricted`; confirmar que botones destructivos no se renderizan.
- **Caso A3 – Cancelacion exitosa**
  - Ejecutar `handleCancelAppointment`; verificar update en Supabase, toast de exito, refetch de dashboard.
- **Caso A4 – Inicio de chat**
  - Boton `Chatear` crea conversacion (RPC) y `chatConversationId` cambia (sidebar abre chat).

### 4.5 BusinessSuggestions v2
- **Caso S1 – Mezcla de frecuentes + recomendados**
  - Datos con citas completadas; validar badges `Tus negocios frecuentes` y contador visitas.
- **Caso S2 – Estado vacio y loading**
  - Sin sugerencias; mostrar mensaje contextual (segun ciudad) y skeleton durante carga.
- **Caso S3 – Seleccion negocio**
  - Click en tarjeta -> abre `BusinessProfile`, cierre preserva estado `isOpen`.

### 4.6 Favoritos
- **Caso F1 – Lista con negocios**
  - Confirmar datos (rating, ubicacion) y boton `Reservar` abre modal.
- **Caso F2 – Estado vacio**
  - Usuario sin favoritos -> mostrar CTA e info tip.
- **Caso F3 – Sincronizacion desde BusinessProfile**
  - Marcar/Desmarcar favorito en modal y refrescar pagina; lista debe reflejar cambio (verificar invalidacion React Query o refetch manual).

### 4.7 Historial
- **Caso H1 – Filtros combinados**
  - Aplicar filtros multiples (estado + negocio + servicio + rango precio) y validar conteo/paginacion.
- **Caso H2 – Busqueda texto**
  - Buscar por nombre de profesional; resultados se actualizan dinamicamente.
- **Caso H3 – Estadisticas**
  - Validar calculos (total, asistidas, canceladas, no show, total pagado) frente a dataset preparado.
- **Caso H4 – Paginacion**
  - Cambiar paginas, mantener filtros y posicion.

### 4.8 Busqueda Global y Resultados
- **Caso B1 – Autocompletado (>=2 caracteres)**
  - Verificar debounce 300 ms, skeleton, y tipos de iconos correctos.
- **Caso B2 – Cambiar tipo de busqueda**
  - Seleccionar `usuarios`; resultados deben incluir negocio asociado.
- **Caso B3 – Ver mas**
  - Abrir modal; probar sort `distance`, `rating`, `balanced`; validar que datos provienen de RPC/edge.
- **Caso B4 – Filtros modal**
  - Aplicar filtros (cuando esten disponibles segun tipo) y verificar recarga.
- **Caso B5 – Errores**
  - Forzar fallo (desconectar red) y validar manejo silencioso (logs en consola, UI sin bloqueo).

### 4.9 AppointmentWizard
- **Caso W1 – Flujo base con empleado**
  - Paso negocio -> servicio -> empleado -> fecha/hora -> resumen -> exito. Validar GA events (`booking_started`, `booking_step_completed`, `purchase`).
- **Caso W2 – Flujo con recurso fisico**
  - Negocio modelo `physical_resource`; seleccionar recurso y confirmar cita.
- **Caso W3 – Preseleccion desde perfil publico**
  - Simular `initialBookingContext` (parametros en URL); wizard inicia en paso correcto con datos preseleccionados.
- **Caso W4 – Validacion horario de sede**
  - Intentar horario fuera de apertura/cierre -> slot bloqueado con tooltip.
- **Caso W5 – Almuerzo profesional**
  - Intervalo dentro de `lunch_break` -> tooltip "Hora de almuerzo".
- **Caso W6 – Sobreposicion cita existente**
  - Slot ocupado -> mensaje "Ocupado".
- **Caso W7 – Ausencia aprobada**
  - Registrar ausencia en `employee_absences`; slot debe bloquearse.
- **Caso W8 – Festivo publico**
  - Fecha en `public_holidays`; wizard debe bloquear dia completo.
- **Caso W9 – Permiso faltante**
  - Revocar `appointments.create` y verificar boton confirmar deshabilitado (PermissionGate modo disable + validacion server).
- **Caso W10 – Reschedule**
  - Abrir wizard via `handleRescheduleAppointment`; validar que `appointmentToEdit` se refleja (update en lugar de insert).
- **Caso W11 – Errores de edge function**
  - Forzar respuesta con error (modificar payload) y verificar toast de fallo + rollback estado loading.

### 4.10 MandatoryReviewModal
- **Caso R1 – Disparador automatico**
  - Cita completada sin review -> modal aparece al cargar dashboard.
- **Caso R2 – Remind later**
  - Seleccionar "Recordar luego"; verificar `localStorage` con timestamp y bloqueo de modal por 5 minutos.
- **Caso R3 – Multiples reviews**
  - Lista >1; tras enviar primera review, modal avanza a siguiente.
- **Caso R4 – Validaciones**
  - Intentar enviar sin rating -> mensaje "Debes calificar".
- **Caso R5 – Error Supabase**
  - Forzar error (revocar internet) -> toast "Error al enviar review" y sin duplicados.

### 4.11 Chat
- **Caso CH1 – Listar conversaciones**
  - Cambiar a tab chat en UnifiedLayout; validar carga de conversaciones, orden por `last_message_at`.
- **Caso CH2 – Nuevo chat desde detalle de cita**
  - Escenario A4 (confirmar conversacion creada si no existia).
- **Caso CH3 – Sincronizacion unread**
  - Marcar mensajes como leidos (scroll); verificar RPC `mark_conversation_as_read` ejecutado (timeout debounced).
- **Caso CH4 – Tiping indicators**
  - Simular typing desde otro usuario; `useChat` actualiza lista `typingUsers`.
- **Caso CH5 – Permisos**
  - Usuario sin `allow_client_messages` no debe aparecer en lista inicial (hook `useBusinessEmployeesForChat`).

### 4.12 Ajustes Cliente
- **Caso SET1 – Guardar datos basicos**
  - Modificar nombre/telefono, guardar y validar update en `profiles`.
- **Caso SET2 – Preferencias notificacion**
  - Cambiar toggles, forzar recarga y comprobar persistencia.
- **Caso SET3 – Validacion i18n**
  - Cambiar idioma (via `LanguageContext`), verificar textos actualizados inmediatamente.

### 4.13 Geolocalizacion y Ciudad Preferida
- **Caso G1 – Permiso geolocalizacion concedido**
  - Aceptar solicitud -> `BusinessSuggestions` usa coordenadas, `SearchResults` muestra distancia.
- **Caso G2 – Permiso denegado**
  - Rechazar -> app debe mostrar fallback sin errores (distancias undefined).
- **Caso G3 – Cambio ciudad preferida**
  - Modificar en header; validar almacenamiento en `localStorage` y disparo de evento `preferred-city-changed`.
- **Caso G4 – Estado inicial por defecto**
  - Borrar storage, recargar -> valores por defecto de Bogota guardados automaticamente.

### 4.14 Favoritos y sincronizacion movil
- **Caso MOB1 – Hybrid WebView**
  - Probar flujos principales dentro de WebView Expo (segun doc `IMPLEMENTACION_HYBRID_WEBVIEW_COMPLETADA.md`), asegurando que busqueda y wizard funcionan sin bloqueos.

### 4.15 Notificaciones
- **Caso N1 – Ver listado**
  - Abrir centro de notificaciones, validar filtro local (sin RPC extra) y conteo unread.
- **Caso N2 – Chat notification**
  - Click en notificacion `chat_message` -> deberia abrir conversacion en chat y mantener rol cliente.

### 4.16 Permisos
- **Caso P1 – Revocar `appointments.cancel_own`**
  - Confirmar que boton cancelar desaparece en detalle y en wizard aparece alerta de permisos.
- **Caso P2 – Owner bypass**
  - Usuario owner debe ver acciones aunque no existan entradas en `user_permissions`.

### 4.17 Rendimiento
- **Caso PERF1 – Contar requests**
  - Cargar dashboard con cache limpio; verificar que total solicitudes <= 100 (objetivo post optimizaciones).
- **Caso PERF2 – React Query cache**
  - Navegar a Favoritos e Historial y de vuelta; no deberia dispararse refetch salvo invalidacion manual.

### 4.18 Seguridad/Datos
- **Caso SEC1 – RLS cumplimiento**
  - Intentar mutar cita de otro cliente (modificar id en network) -> responder 401/403.
- **Caso SEC2 – XSS en descricion**
  - Crear comentario con script y confirmar sanitizacion al renderizar.

## 5. Requisitos de Automatizacion
- Scripts E2E (Playwright) deben cubrir al menos: login, cambio de rol, creacion de cita completa, cancelacion, review, busqueda, favoritos, historial filtros.
- Tests unitarios sugeridos: `useClientDashboard` (mock edge function fallback), `useMandatoryReviews` (logica localStorage), `BusinessSuggestions` (render condicional), `ClientHistory` filtros helpers.

### 4.19 Performance y Optimización de Requests ⚡ CRÍTICO

#### 4.19.1 Validación de Consolidación useClientDashboard
- **Caso PERF-D1 – Request único en dashboard**
  - **Objetivo**: Confirmar que `useClientDashboard` ejecuta UN solo request a edge function.
  - **Precondiciones**: Cache React Query limpio (DevTools > Clear cache).
  - **Pasos**: 
    1. Login como cliente
    2. Abrir DevTools > Network (filtrar por `get-client-dashboard-data`)
    3. Navegar a `/app/client/appointments`
    4. Contar requests totales
  - **Resultado esperado**: 
    - ✅ 1 request a `functions/v1/get-client-dashboard-data`
    - ❌ 0 requests directos a `from('appointments')`, `from('reviews')`, `from('business_favorites')`
    - React Query DevTools muestra query key `['client-dashboard', userId]` con status `success`

- **Caso PERF-D2 – Cache hit en navegación**
  - **Pasos**: 
    1. Cargar dashboard (primer load)
    2. Navegar a Historial
    3. Volver a Dashboard dentro de 5 minutos
  - **Resultado esperado**: 
    - NO se ejecuta nuevo request (cache hit)
    - React Query DevTools muestra `stale: false` y `isFetching: false`

- **Caso PERF-D3 – Invalidación tras crear cita**
  - **Pasos**: 
    1. Crear cita exitosamente vía wizard
    2. Observar callback `onSuccess` en Network
  - **Resultado esperado**: 
    - `queryClient.invalidateQueries(['client-dashboard'])` ejecutado
    - Nuevo request automático a edge function
    - Dashboard actualiza sin F5 manual

- **Caso PERF-D4 – Invalidación tras cancelar cita**
  - **Pasos**: Cancelar cita desde detalle, verificar refetch automático
  - **Resultado esperado**: Toast + nuevo request + UI actualizada

- **Caso PERF-D5 – Invalidación tras toggle favorito**
  - **Pasos**: 
    1. Marcar negocio como favorito desde BusinessProfile
    2. Cerrar modal y observar lista de favoritos
  - **Resultado esperado**: 
    - `useFavorites` invalida query propia
    - Dashboard NO invalida (favoritos y dashboard son queries independientes)
    - Lista de favoritos actualiza vía su propio refetch

#### 4.19.2 Optimización useFavorites
- **Caso PERF-F1 – Redundancia en checkIsFavorite**
  - **Objetivo**: Validar si `checkIsFavorite` (async DB call) se usa innecesariamente.
  - **Análisis**: 
    - Hook tiene `isFavorite` (Set local rápido) Y `checkIsFavorite` (RPC a DB)
    - **Pregunta**: ¿Cuándo se llama `checkIsFavorite`? ¿Es necesario o puede eliminarse?
  - **Pasos de validación**:
    1. Buscar usos de `checkIsFavorite` en código (`grep_search`)
    2. Si solo se usa en componentes internos, reemplazar con `isFavorite`
    3. Medir requests antes/después

- **Caso PERF-F2 – Refetch tras toggle optimista**
  - **Problema detectado**: `toggleFavorite` hace optimistic update PERO luego llama `refetch()`
  - **Análisis**: 
    - Optimistic update ya actualiza Set local
    - Refetch adicional puede ser redundante si realtime subscription existe
  - **Pasos de validación**:
    1. Deshabilitar `refetch()` en `toggleFavorite`
    2. Probar toggle múltiple rápido
    3. Verificar que realtime subscription sincroniza correctamente
    4. Si funciona, eliminar `refetch()` innecesario

- **Caso PERF-F3 – Realtime subscription vs polling**
  - **Análisis**: 
    - Hook tiene realtime subscription que invalida query en cada cambio
    - Subscription + invalidate + refetch automático puede causar requests extras
  - **Pasos**:
    1. Toggle favorito desde otro navegador/sesión
    2. Contar requests en ventana principal
  - **Resultado esperado**: 
    - 1 request por evento de realtime (aceptable)
    - NO loops infinitos de refetch

#### 4.19.3 Optimización MandatoryReviewModal
- **Caso PERF-R1 – Queries secuenciales en useEffect**
  - **Problema detectado**: Modal ejecuta 3+ queries separadas:
    - Fetch appointments completadas sin review
    - Fetch existing reviews para deduplicar
    - Fetch previous ratings para pre-popular
  - **Propuesta**: Consolidar en 1 RPC function `get_pending_reviews_with_context`
  - **Pasos de validación**:
    1. Contar requests actuales (Network tab)
    2. Crear RPC que retorne todo en 1 query
    3. Comparar tiempo de carga antes/después

- **Caso PERF-R2 – loadPreviousRatings loop**
  - **Análisis**: Loop `for` ejecutando query por cada review
  - **Optimización**: Batch query con `IN (reviewIds[])`
  - **Resultado esperado**: N queries → 1 query

#### 4.19.4 Optimización ClientHistory
- **Caso PERF-H1 – Consolidación de useEffect exitosa**
  - **Validación**: 
    - Antes: 5 useEffect separados extrayendo businesses, locations, services, etc.
    - Después: 1 useMemo `filterEntities`
  - **Pasos**:
    1. Abrir ClientHistory con 100+ appointments
    2. Activar React DevTools Profiler
    3. Medir renders al cambiar filtro
  - **Resultado esperado**: 
    - 1 render por cambio de filtro (no 5)
    - `filterEntities` ejecuta 1 vez (memoización efectiva)

- **Caso PERF-H2 – matchesFilters memoización**
  - **Análisis**: Callbacks `matchesStatus`, `matchesFilters`, etc. usan `useCallback`
  - **Validación**: 
    - Verificar que dependencias son correctas
    - NO re-creates en cada render
  - **Pasos**: React DevTools > Components > Hooks > ver referencias

#### 4.19.5 Optimización SearchResults
- **Caso PERF-S1 – Secondary fetches**
  - **Problema**: Tras ejecutar RPC `search_businesses`, componente hace queries adicionales:
    - Fetch business info (si no viene en RPC)
    - Fetch locations para distance calc
    - Fetch categories
  - **Propuesta**: Ampliar RPC para incluir joined data
  - **Pasos de validación**: Contar requests totales en modal

- **Caso PERF-S2 – Debounce efectivo**
  - **Validación**: 
    - Escribir "salon de belleza" rápido (< 300ms por carácter)
    - Verificar que solo 1 request se dispara al final
  - **Resultado esperado**: NO requests intermedios

#### 4.19.6 Optimización AppointmentWizard
- **Caso PERF-W1 – Queries por paso**
  - **Análisis**: Cada paso puede disparar queries:
    - Paso 1: Fetch businesses
    - Paso 2: Fetch services
    - Paso 3: Fetch employees/resources
    - Paso 4: Fetch availability slots
  - **Optimización actual**: React Query cache 5min
  - **Validación**: 
    1. Abrir wizard 2 veces en 5 min
    2. Verificar cache hits (NO requests duplicados)

- **Caso PERF-W2 – Validaciones cliente-side**
  - **Análisis**: 
    - Overlap detection ejecuta en cliente
    - Ausencias, festivos, lunch break se validan localmente
  - **Riesgo**: Múltiples queries por cada slot calculado
  - **Validación**: 
    - Abrir calendario semanal (50+ slots)
    - Contar queries de validación
  - **Resultado esperado**: 
    - Queries batch (1 por empleado/día, no 1 por slot)

#### 4.19.7 Detección de Re-renders Innecesarios
- **Caso PERF-RR1 – ClientDashboard useEffect dependencies**
  - **Problema potencial**: 6 useEffect hooks con dependencias complejas
  - **Análisis**: 
    - Avatar update listener: depende de `user.id`
    - User prop sync: depende de `user` (objeto completo, puede causar re-renders)
    - Image loading: depende de `appointments` (array reference puede cambiar)
  - **Pasos de validación**:
    1. Activar React DevTools Profiler
    2. Navegar entre tabs sin cambiar datos
    3. Contar renders de `ClientDashboard`
  - **Resultado esperado**: 
    - ≤2 renders por navegación (mount + data fetch)
    - NO renders continuos por cambios de referencia

- **Caso PERF-RR2 – BusinessSuggestions props**
  - **Análisis**: Recibe `suggestions` array de `useClientDashboard`
  - **Riesgo**: Si array reference cambia sin cambios reales, re-render innecesario
  - **Validación**: 
    - Verificar que hook usa `useMemo` para `suggestions`
    - Profiler muestra 1 render al cargar, 0 renders extras

- **Caso PERF-RR3 – useCallback en handlers**
  - **Checklist**: Verificar que handlers pasados como props usan `useCallback`:
    - `handleCancelAppointment`
    - `handleRescheduleAppointment`
    - `handleToggleFavorite`
  - **Resultado esperado**: Dependencies correctas, NO re-creates

#### 4.19.8 Validación React Query DevTools
- **Caso PERF-RQ1 – Query keys consistencia**
  - **Análisis**: Verificar que todas las queries usan `QUERY_CONFIG.KEYS` centralizado
  - **Pasos**: 
    1. Abrir React Query DevTools
    2. Listar todas las queries activas
    3. Buscar keys no estandarizadas
  - **Resultado esperado**: Todas las keys con prefijos consistentes (`client-dashboard`, `notifications`, `favorites`, etc.)

- **Caso PERF-RQ2 – Stale time configuración**
  - **Validación**: 
    - Dashboard: 5 min (`QUERY_CONFIG.STABLE`)
    - Notifications: 1 min (`QUERY_CONFIG.FREQUENT`)
    - Availability: 30 seg (`QUERY_CONFIG.VOLATILE`)
  - **Verificar**: Que valores se respetan en DevTools

- **Caso PERF-RQ3 – Garbage collection**
  - **Análisis**: Queries no usadas deben eliminarse tras `gcTime` (10 min default)
  - **Pasos**: 
    1. Cargar dashboard
    2. Navegar a otras secciones por >10 min
    3. Verificar que query `client-dashboard` se elimina si no se usa
  - **Resultado esperado**: Memory cleanup efectivo

#### 4.19.9 Análisis de Bundle Size y Code Splitting
- **Caso PERF-B1 – Lazy loading componentes pesados**
  - **Análisis**: Verificar que componentes grandes usan `React.lazy`:
    - `AppointmentWizard`
    - `ClientHistory`
    - `SearchResults`
  - **Pasos**: 
    1. Build de producción (`npm run build`)
    2. Analizar `dist/assets/*.js` sizes
    3. Verificar chunks separados
  - **Resultado esperado**: 
    - Chunk principal < 500 KB
    - Componentes lazy en chunks separados

- **Caso PERF-B2 – Tree shaking bibliotecas**
  - **Análisis**: Imports de Phosphor Icons, Radix UI deben ser específicos
  - **Ejemplo correcto**: `import { Heart } from 'phosphor-react'`
  - **Ejemplo incorrecto**: `import * as Icons from 'phosphor-react'`
  - **Validación**: Buscar imports incorrectos con grep

#### 4.19.10 Network Waterfall Analysis
- **Caso PERF-N1 – Requests bloqueantes**
  - **Análisis**: Verificar que requests críticos NO bloquean UI
  - **Pasos**: 
    1. Abrir DevTools > Network > Throttling Fast 3G
    2. Cargar dashboard
    3. Verificar que UI muestra skeletons mientras carga
  - **Resultado esperado**: NO bloqueo total, render progresivo

- **Caso PERF-N2 – Paralelización**
  - **Análisis**: Requests independientes deben ejecutarse en paralelo
  - **Ejemplo**: 
    - ✅ `Promise.all([fetchAppointments(), fetchFavorites()])`
    - ❌ `await fetchAppointments(); await fetchFavorites()`
  - **Validación**: Waterfall muestra requests simultáneos

### 4.20 Flujos Redundantes y Edge Cases 🔍

#### 4.20.1 Favoritos - Concurrencia
- **Caso EDGE-F1 – Toggle rápido múltiple**
  - **Escenario**: Usuario hace click múltiple en favorito antes de completar request
  - **Pasos**: 
    1. Click favorito
    2. Click nuevamente antes de toast de éxito
    3. Repetir 3 veces rápido
  - **Resultado esperado**: 
    - Optimistic updates manejan estado intermedio
    - Request final refleja estado correcto
    - NO inconsistencias tras sync

- **Caso EDGE-F2 – Toggle desde múltiples componentes**
  - **Escenario**: 
    - Marcar favorito desde `BusinessProfile`
    - Inmediatamente marcar desde `SearchResults` del mismo negocio
  - **Resultado esperado**: Ambos componentes sincronizan vía React Query invalidation

#### 4.20.2 Reviews - Estados intermedios
- **Caso EDGE-R1 – Modal múltiple apertura**
  - **Escenario**: 
    1. Abrir `MandatoryReviewModal`
    2. Click "Remind later"
    3. Cambiar hora del sistema a 5 min después
    4. Recargar
  - **Resultado esperado**: Modal NO aparece hasta 5 min reales

- **Caso EDGE-R2 – Review concurrente**
  - **Escenario**: Usuario deja tab abierto, completa cita en otro dispositivo
  - **Pasos**: 
    1. Completar cita en sesión A
    2. Enviar review en sesión B
    3. Intentar enviar review duplicada en sesión A
  - **Resultado esperado**: Validación server-side rechaza duplicado

#### 4.20.3 Wizard - Navegación compleja
- **Caso EDGE-W1 – Paso atrás con datos cambiados**
  - **Escenario**: 
    1. Seleccionar servicio A (60 min)
    2. Avanzar a selección de hora
    3. Regresar y cambiar a servicio B (90 min)
    4. Avanzar nuevamente
  - **Resultado esperado**: 
    - Slots recalculados para nueva duración
    - Hora previamente seleccionada se limpia si ya no es válida

- **Caso EDGE-W2 – Cierre modal con datos parciales**
  - **Escenario**: Usuario cierra wizard en paso 4/7
  - **Resultado esperado**: 
    - Estado interno se limpia (`resetWizard()`)
    - Próxima apertura inicia desde paso 1
    - NO data leakage entre sesiones

- **Caso EDGE-W3 – Preselección con datos inválidos**
  - **Escenario**: URL tiene `serviceId` de servicio deshabilitado
  - **Resultado esperado**: 
    - Wizard ignora preselección inválida
    - Muestra lista completa de servicios activos
    - Log warning en consola

#### 4.20.4 Dashboard - Cambio de rol durante carga
- **Caso EDGE-D1 – Role switch mid-flight**
  - **Escenario**: 
    1. Iniciar carga como Cliente (request a edge function en vuelo)
    2. Cambiar a Admin antes de completar
  - **Resultado esperado**: 
    - Request en vuelo se cancela (AbortController)
    - Nueva query para Admin inicia
    - NO renderiza datos de Cliente en dashboard Admin

#### 4.20.5 Notificaciones - Navegación recursiva
- **Caso EDGE-N1 – Click notificación de rol diferente**
  - **Escenario**: 
    1. Rol Cliente activo
    2. Click notificación `vacancy_application_received` (requiere Admin)
    3. Confirmar cambio a Admin
  - **Resultado esperado**: 
    - `NotificationRoleMapping` ejecuta cambio de rol
    - Navega a `/app/admin/recruitment`
    - Notification se marca como leída

- **Caso EDGE-N2 – Spam de clicks en notificación**
  - **Escenario**: Click múltiple rápido en misma notificación
  - **Resultado esperado**: 
    - Navegación ejecuta 1 sola vez (debounce o flag)
    - NO múltiples cambios de rol

### 4.21 Escenarios de Error y Recuperación 🛡️

#### 4.21.1 Offline/Network failures
- **Caso ERR-N1 – Dashboard offline**
  - **Pasos**: 
    1. Desactivar red (DevTools > Offline)
    2. Intentar cargar dashboard
  - **Resultado esperado**: 
    - Toast "Error de conexión"
    - Skeleton permanece visible
    - Botón "Reintentar" disponible

- **Caso ERR-N2 – Wizard offline mid-flow**
  - **Pasos**: 
    1. Iniciar wizard
    2. Desconectar red en paso 4
    3. Intentar confirmar cita
  - **Resultado esperado**: 
    - Toast "Sin conexión"
    - Botón Confirmar deshabilitado
    - Datos del formulario preservados

#### 4.21.2 Edge Function errors
- **Caso ERR-E1 – get-client-dashboard-data timeout**
  - **Simulación**: Modificar edge function para delay 30s
  - **Resultado esperado**: 
    - React Query timeout tras 30s (configurable)
    - Mensaje de error amigable
    - NO crash de app

- **Caso ERR-E2 – appointment-actions malformed response**
  - **Simulación**: Edge function retorna JSON inválido
  - **Resultado esperado**: 
    - Try-catch captura error parsing
    - Toast "Error inesperado"
    - Wizard mantiene estado sin crash

#### 4.21.3 RLS Policy violations
- **Caso ERR-RLS1 – Intento de modificar cita ajena**
  - **Pasos**: 
    1. Interceptar request en DevTools
    2. Cambiar `appointment_id` a cita de otro usuario
    3. Enviar request
  - **Resultado esperado**: 
    - Supabase retorna 403 Forbidden
    - UI muestra toast "No autorizado"
    - NO cambios en BD

## 6. Criterios de Aceptacion
- Todas las pruebas criticas (W1-W11, A1-A4, H1-H4, B1-B5, R1-R5, **PERF-D1 a PERF-N2**, **EDGE-F1 a ERR-RLS1**) deben pasar sin issues bloqueantes.
- Errores menores permitidos solo si existen workarounds documentados y sin impacto en conversion de citas.
- **Solicitudes totales en dashboard ≤ 5** (objetivo post consolidación: 1 edge function + 2-3 assets)
- Tiempo medio de carga inicial < 2.5s en red rapida, < 5s en 3G.
- Ninguna accion protegida visible cuando permiso correspondiente esta revocado.
- **React DevTools Profiler**: ≤3 renders por componente en navegación normal
- **Lighthouse Score**: Performance ≥85, Accessibility ≥95
- **Bundle Size**: Chunk principal < 500 KB gzipped

## 7. Matriz de Riesgos y Mitigacion
| Riesgo | Impacto | Probabilidad | Mitigacion |
|--------|---------|--------------|------------|
| Edge `get-client-dashboard-data` fuera de linea | Alto - Sin datos en dashboard | Media | Implementar fallback con queries RPC individuales + mensaje de degradación |
| Cambios en RLS Supabase | Crítico - Acciones bloqueadas | Baja | Verificar logs y revisar politicas antes de ejecucion; tests E2E con DB remota |
| Caches React Query ocultando fallos | Alto - Resultados inconsistentes | Alta | Ejecutar pruebas clave con cache limpio (`Clear all` en DevTools), modo incognito, y validar invalidación manual |
| Dependencias externas (GA, geolocalizacion) | Medio - Bloqueo de flujos | Media | Simular entornos offline para verificar degradacion; GA no debe bloquear render |
| Re-renders excesivos | Medio - Performance degradada | Alta | React DevTools Profiler obligatorio; límite 3 renders por navegación |
| Requests duplicados tras optimización | Alto - Regresión de performance | Media | Network waterfall obligatorio en todas las pruebas PERF; comparar con baseline |
| Memory leaks en realtime subscriptions | Crítico - App crash tras uso prolongado | Media | Validar cleanup en `useEffect` returns; pruebas de >30 min de sesión activa |
| Race conditions en optimistic updates | Alto - Datos inconsistentes | Media | Tests de concurrencia obligatorios (EDGE-F1, EDGE-R2); logs de requests en orden |
| Bundle size excesivo | Medio - Carga lenta | Baja | Análisis Lighthouse obligatorio; lazy loading verificado con chunks |

## 8. Evidencias Esperadas
- Capturas o grabaciones de cada caso critico **CON timestamps visibles**
- Logs de red/export de consola con tiempos de carga **ANTES Y DESPUÉS de optimizaciones**
- Resultados de queries SQL que preparan dataset **con row counts**
- Registro de toasts/alertas vistos durante pruebas **con screenshots**
- **React Query DevTools exports** mostrando query keys, cache times, fetch counts
- **React DevTools Profiler flamegraphs** de componentes críticos
- **Lighthouse reports** (JSON export) con scores de Performance/Accessibility
- **Bundle analyzer reports** mostrando chunk sizes y tree shaking
- **Network waterfall screenshots** de escenarios PERF-D1, PERF-S1, PERF-W1

## 9. Checklist Pre-Ejecución ✅

### 9.1 Preparación de Ambiente
- [ ] Branch `main` actualizado con último commit de producción
- [ ] Variables de entorno validadas (`VITE_SUPABASE_URL`, `VITE_GA_MEASUREMENT_ID`, etc.)
- [ ] Edge functions desplegadas y funcionales (`npx supabase functions list` muestra status `active`)
- [ ] RPC functions verificadas en Supabase Dashboard > Database > Functions
- [ ] Dataset de prueba cargado (script SQL ejecutado, 3+ negocios activos)
- [ ] Cuentas de prueba creadas con permisos configurados (tabla `user_permissions`)

### 9.2 Herramientas de Testing
- [ ] React Query DevTools instalado (`@tanstack/react-query-devtools`)
- [ ] React DevTools Profiler habilitado en navegador
- [ ] Network throttling configurado (Presets: Fast 3G, Slow 3G, Offline)
- [ ] Lighthouse CLI instalado (`npm i -g lighthouse`)
- [ ] Bundle analyzer configurado (`vite-plugin-bundle-analyzer`)
- [ ] Playwright E2E framework configurado (si aplica)

### 9.3 Documentación de Baseline
- [ ] Request count actual documentado (antes de optimizaciones): **___ requests**
- [ ] Tiempo de carga actual medido (Network tab > DOMContentLoaded): **___ ms**
- [ ] Bundle size actual registrado (dist/assets/*.js total): **___ KB**
- [ ] Lighthouse score actual: Performance **___**/100, Accessibility **___**/100

## 10. Plan de Ejecución por Fases 📅

### Fase 1: Validación Funcional Crítica (Día 1)
**Objetivo**: Confirmar que flujos principales funcionan sin errores bloqueantes
- Ejecutar casos: C1-C3, D1-D4, CAL1-CAL3, A1-A4, W1-W11, R1-R5
- **Criterio de paso**: 0 errores críticos, ≤3 errores menores documentados
- **Duración estimada**: 4-6 horas
- **Responsable**: QA Lead + Dev Frontend

### Fase 2: Validación de Performance (Día 2)
**Objetivo**: Cuantificar optimizaciones y detectar regresiones
- Ejecutar casos: PERF-D1 a PERF-N2 (30+ casos)
- **Métricas clave**: 
  - Reducción requests: Baseline → Target ≤5
  - Reducción renders: Baseline → Target ≤3 por navegación
  - Bundle size: Baseline → Target <500 KB
- **Duración estimada**: 6-8 horas
- **Responsable**: Dev Frontend + Performance Engineer

### Fase 3: Edge Cases y Concurrencia (Día 3)
**Objetivo**: Validar estabilidad en escenarios extremos
- Ejecutar casos: EDGE-F1 a EDGE-N2 (15+ casos)
- **Criterio de paso**: NO crashes, NO data loss, recovery automático en ≤2s
- **Duración estimada**: 3-4 horas
- **Responsable**: QA Senior

### Fase 4: Error Handling y Seguridad (Día 4)
**Objetivo**: Confirmar degradación controlada y protección RLS
- Ejecutar casos: ERR-N1 a ERR-RLS1 (10+ casos)
- **Criterio de paso**: 0 crashes, mensajes de error amigables, rollback exitoso
- **Duración estimada**: 2-3 horas
- **Responsable**: QA Security + Dev Backend

### Fase 5: Regresión Completa (Día 5)
**Objetivo**: Re-ejecutar todos los casos críticos tras fixes
- Re-ejecutar casos con issues encontrados
- Ejecutar suite E2E automatizada (si disponible)
- **Criterio de paso**: 100% de casos críticos aprobados
- **Duración estimada**: 4-6 horas
- **Responsable**: QA Team completo

## 11. Métricas de Éxito 📊

### 11.1 Performance Targets (Obligatorios)
| Métrica | Baseline Actual | Target Post-Optimización | Método de Medición |
|---------|-----------------|--------------------------|-------------------|
| Requests en dashboard | ~15-20 | **≤5** | DevTools Network tab (cache limpio) |
| Tiempo de carga (Fast WiFi) | ~3-4s | **<2.5s** | DevTools Performance > DOMContentLoaded |
| Tiempo de carga (Fast 3G) | ~8-10s | **<5s** | DevTools Throttling |
| Renders de ClientDashboard | ~5-7 | **≤3** | React DevTools Profiler |
| Bundle principal gzipped | ~600-700 KB | **<500 KB** | `npm run build` + gzip analysis |
| Lighthouse Performance | 60-70 | **≥85** | `lighthouse --view` |
| React Query cache hit rate | 40-50% | **≥70%** | DevTools > Query Observer |

### 11.2 Funcionalidad Targets (Obligatorios)
| Métrica | Target | Método de Medición |
|---------|--------|-------------------|
| Casos críticos aprobados | **100%** | Manual validation + checklist |
| Casos de performance aprobados | **≥90%** | Automated scripts + manual |
| Casos de edge cases aprobados | **≥85%** | Manual validation (difíciles de automatizar) |
| Casos de error handling aprobados | **100%** | Manual + unit tests |
| Cobertura de código (cliente components) | **≥70%** | Vitest coverage report |

### 11.3 Calidad Targets (Recomendados)
| Métrica | Target | Método de Medición |
|---------|--------|-------------------|
| Errores en consola (warnings) | **0** | DevTools Console > filter errors |
| Accessibility issues (Lighthouse) | **0 critical** | Lighthouse Accessibility audit |
| Best Practices score | **≥90** | Lighthouse Best Practices |
| SEO score | **≥80** | Lighthouse SEO (para páginas públicas) |

## 12. Troubleshooting Guide 🔧

### Problema: "Dashboard muestra datos antiguos"
**Síntomas**: Cita cancelada sigue apareciendo
**Diagnóstico**: 
1. Abrir React Query DevTools
2. Buscar query `['client-dashboard', userId]`
3. Verificar `dataUpdatedAt` timestamp
**Solución**: 
- Si `isFetching: false` y data antigua → forzar invalidación manual
- Si `staleTime` muy largo → reducir a 3 min para testing

### Problema: "Network tab muestra 100+ requests"
**Síntomas**: Performance degradada, requests duplicados
**Diagnóstico**: 
1. Filtrar requests por tipo: `fetch/xhr`
2. Buscar patrones repetidos (mismo endpoint múltiple)
3. Revisar stack traces en "Initiator" column
**Solución**: 
- Si queries individuales en lugar de edge function → verificar que componente usa `useClientDashboard`
- Si realtime loops → revisar subscription cleanup

### Problema: "Componente re-renderiza constantemente"
**Síntomas**: UI laggy, Profiler muestra 10+ renders
**Diagnóstico**: 
1. React DevTools Profiler > Record
2. Navegar entre tabs
3. Identificar componente con más renders
4. Ver "Reasons" tab (qué props cambiaron)
**Solución**: 
- Si props son objetos → verificar `useMemo` en padre
- Si handlers → verificar `useCallback` con dependencies correctas
- Si arrays → comparar referencias, NO contenido

### Problema: "Tests PERF fallan por 1-2 requests extra"
**Síntomas**: Esperado 5, obtenido 7
**Diagnóstico**: 
1. Revisar requests "extra" en Network tab
2. Filtrar por dominio (Supabase, GA, otros)
**Solución**: 
- Si son assets (fonts, icons) → excluir del conteo
- Si son requests Supabase legítimos (auth refresh) → ajustar target
- Si son analytics → validar que `VITE_GA_MEASUREMENT_ID` NO bloquea render

## 13. Automatización Recomendada 🤖

### 13.1 Playwright E2E Tests (Prioridad Alta)
```typescript
// tests/e2e/client/dashboard.spec.ts
test('PERF-D1: Dashboard ejecuta un solo request', async ({ page }) => {
  await page.route('**/functions/v1/**', route => {
    console.log('Edge function called:', route.request().url());
    route.continue();
  });
  
  let edgeFunctionCalls = 0;
  page.on('request', req => {
    if (req.url().includes('get-client-dashboard-data')) {
      edgeFunctionCalls++;
    }
  });

  await page.goto('/app/client/appointments');
  await page.waitForLoadState('networkidle');

  expect(edgeFunctionCalls).toBe(1);
});
```

### 13.2 Performance Budgets (package.json)
```json
{
  "performance": {
    "budgets": [
      {
        "path": "dist/assets/*.js",
        "maxSize": "500 KB"
      },
      {
        "path": "dist/index.html",
        "maxSize": "50 KB"
      }
    ]
  }
}
```

### 13.3 CI/CD Integration
- **Pre-commit hook**: Lint + type-check
- **Pre-push hook**: Unit tests (`npm run test`)
- **CI Pipeline**: 
  - Stage 1: Build + bundle size check
  - Stage 2: E2E tests críticos (C1, D1, W1, PERF-D1)
  - Stage 3: Lighthouse CI (performance threshold 85)
  - Stage 4: Deploy to staging

## 14. Apéndices 📎

### Apéndice A: Scripts de Utilidad
```bash
# Limpiar cache React Query (manual)
# En consola del navegador:
queryClient.clear()

# Contar requests en Network tab (automático)
# Filtrar por: `fetch/xhr`, excluir `wss://` (websockets)

# Medir bundle size
npm run build
npx vite-bundle-visualizer dist/stats.html

# Ejecutar Lighthouse (headless)
lighthouse http://localhost:5173/app/client/appointments \
  --output=json \
  --output-path=./lighthouse-report.json \
  --chrome-flags="--headless"
```

### Apéndice B: Dataset SQL
```sql
-- Crear usuarios de prueba (ejecutar en Supabase SQL Editor)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at)
VALUES 
  ('client-std-001', 'client_standard@gestabiz.com', crypt('Test1234!', gen_salt('bf')), NOW(), NOW()),
  ('client-res-001', 'client_restricted@gestabiz.com', crypt('Test1234!', gen_salt('bf')), NOW(), NOW());

-- Crear permisos revocados para client_restricted
INSERT INTO user_permissions (business_id, user_id, permission, is_active)
SELECT b.id, 'client-res-001', 'appointments.cancel_own', false
FROM businesses b
WHERE b.is_active = true
LIMIT 1;

-- Crear citas de prueba
INSERT INTO appointments (client_id, business_id, service_id, employee_id, location_id, start_time, end_time, status)
VALUES 
  ('client-std-001', 'business-a', 'service-1', 'employee-1', 'location-1', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 1 hour', 'confirmed'),
  ('client-std-001', 'business-a', 'service-2', 'employee-2', 'location-1', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days 1 hour', 'completed');
```

### Apéndice C: Checklist de Issues Conocidos
- [ ] **KNOWN-001**: useFavorites refetch redundante tras toggle optimista → Pendiente optimización
- [ ] **KNOWN-002**: MandatoryReviewModal loadPreviousRatings N+1 queries → Pendiente consolidación RPC
- [ ] **KNOWN-003**: SearchResults secondary fetches → Pendiente ampliar RPC search_*
- [ ] **KNOWN-004**: ClientDashboard 6 useEffect → Analizar consolidación (bajo impacto actual)

---

**Última actualización**: {{FECHA_ACTUAL}}  
**Responsable**: QA Team + Frontend Dev  
**Próxima revisión**: Después de deployment de optimizaciones PERF



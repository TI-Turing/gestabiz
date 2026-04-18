# PARTE 1: ROL CLIENTE — Contenido para Manual y Propuesta

> Análisis exhaustivo del rol Cliente en Gestabiz.
> Generado por Claude Code (Sonnet 4.6 → Opus 4.7) — 2026-04-18
> Para merge en: Manual_Usuario_Gestabiz - copilot.docx y Propuesta_Valor_Gestabiz - copilot.docx

---

## RESUMEN EJECUTIVO (Parte 1 — Cliente)

Gestabiz ofrece a los clientes finales una experiencia de reserva y seguimiento de citas de nivel premium, con funcionalidades que superan a Calendly, Booksy y Fresha:

- **Reserva inteligente** desde perfiles públicos indexados en Google (`/negocio/:slug`)
- **Wizard multi-paso** con validación en tiempo real de disponibilidad (horarios de sede, almuerzo, ausencias, festivos colombianos, overlap)
- **Gestión completa** de citas: ver, reprogramar, cancelar, chatear
- **Chat en tiempo real** con el profesional (diferenciador clave)
- **Confirmación por email** con un clic (token único)
- **Multi-negocio**: un solo perfil de cliente sirve para todos los negocios de Gestabiz
- **Favoritos, historial** con filtros avanzados, reseñas
- **Experiencia uniforme** sin importar el plan del negocio (Gratuito/Básico/Pro)

> [HIPERVÍNCULO AL DETALLE: Ver sección "Rol Cliente — Detalle Exhaustivo"]

---

## DETALLE EXHAUSTIVO (Parte 1 — Cliente)

### 1. Identidad del rol

Un Cliente es un usuario autenticado que reserva y gestiona citas con negocios y profesionales. Está basado en la tabla `profiles` de Supabase. No tiene permisos administrativos. Puede ser simultáneamente cliente de N negocios.

### 2. Rutas de acceso

**Públicas (sin autenticación):**
- `/` — Landing page
- `/login`, `/register` — Autenticación
- `/negocio/:slug` — Perfil público del negocio (SEO, Google-indexable)
- `/confirmar-cita/:token` — Confirmar cita desde email
- `/cancelar-cita/:token` — Cancelar cita desde email
- `/reprogramar-cita/:token` — Reprogramar desde email

**Autenticadas (rol cliente activo):**
- `/app/client/appointments` — **Mis Citas** (página principal)
- `/app/client/favorites` — Favoritos
- `/app/client/history` — Historial
- `/app/client/profile` — Mi Perfil
- `/app/client/settings` — Configuración

### 3. Validación crítica: teléfono requerido

Si el cliente no tiene teléfono registrado, el componente `PhoneRequiredModal` **bloquea totalmente el acceso** al dashboard hasta que agregue uno válido (7–20 dígitos). Tras guardarlo, el dashboard recarga automáticamente.

> **⚠️ Advertencia**: Sin teléfono, el profesional no puede contactar al cliente ante imprevistos. Por eso la validación es obligatoria.

### 4. Página "Mis Citas"

**[SCREENSHOT: Dashboard principal del cliente — vista Mis Citas]**

**Header sticky**:
- Título: "Mis Citas"
- Botón primario: **+ Agendar Cita** → abre `AppointmentWizard`
- Toggle: Vista Lista / Vista Calendario

**Vista Lista (por defecto)**:
Grid responsivo (1 col móvil, 2–3 cols desktop) de tarjetas. Cada tarjeta muestra:
- Imagen del servicio o banner de la sede
- Nombre del negocio
- Nombre del servicio
- Fecha (formato: "Lunes 18 de Marzo") y hora (12h, AM/PM)
- Nombre del profesional
- Badge de estado coloreado

**Estados visibles aquí**: `pending`, `confirmed`, `in_progress`, `scheduled` (citas futuras).

**Vista Calendario**: calendario mensual interactivo. Click en día con cita → abre detalles.

### 5. Modal "Detalles de la Cita"

**[SCREENSHOT: Modal Detalles de Cita completo]**

**Contenido (scroll vertical)**:
- Badge de estado
- Nombre del negocio
- Imagen del servicio
- Servicio: nombre, descripción, duración, precio
- Fecha completa y hora (inicio–fin)
- Avatar del profesional + nombre + email + teléfono
- Sede: nombre, dirección, **enlace a Google Maps** (`https://www.google.com/maps?q=...`)
- Notas de la cita (si existen)
- Valor total en COP

**Botones de acción (footer fijo):**

1. **💬 Chatear con el profesional**
   - Crea u obtiene conversación vía `useChat.createOrGetConversation()`
   - Abre el chat flotante en la esquina inferior derecha
   - Disponible siempre que haya `employee_id`

2. **📅 Reprogramar**
   - Abre `AppointmentWizard` con todos los datos preseleccionados
   - El cliente puede cambiar cualquier valor (servicio, sede, profesional, fecha)
   - **Solo visible si** `status ∉ {completed, cancelled, no_show}`

3. **❌ Cancelar Cita**
   - Solicita confirmación: "¿Estás seguro de cancelar esta cita?"
   - Actualiza: `status='cancelled'`, `cancelled_by=user.id`
   - Toast: "Cita cancelada exitosamente"
   - Modal cierra y dashboard refetch
   - **Solo visible si** `status ∉ {completed, cancelled, no_show}`

4. **Cerrar** — cierra modal sin cambios.

### 6. Estados de cita

| Estado | Badge | Visible en | Descripción |
|--------|-------|------------|-------------|
| `pending` | Amarillo | Mis Citas | Esperando confirmación del profesional |
| `confirmed` | Verde | Mis Citas | Confirmada por el profesional |
| `in_progress` | Verde | Mis Citas | En curso ahora |
| `completed` | Gris | Historial | Completada |
| `cancelled` | Rojo | Historial | Cancelada (por cliente o profesional) |
| `no_show` | Rojo | Historial | Cliente no asistió |

### 7. Agendar cita: Wizard multi-paso

**[SCREENSHOT: AppointmentWizard — Paso 4 Selección de Fecha y Hora con calendario]**

El `AppointmentWizard` es un modal con 7 pasos. Los pasos con datos preseleccionados **se saltan automáticamente**.

#### Paso 0: Seleccionar Negocio
- Se muestra **solo si** no hay `businessId` preseleccionado
- Grid de tarjetas con: banner, nombre, rating, reviews, distancia (si geolocalización activa)
- Filtro de búsqueda, filtro por categoría

#### Paso 1: Seleccionar Servicio
- Header: nombre del negocio
- Grid de `ServiceCard`: imagen, nombre, descripción, duración, precio
- Filtros: categoría, rango de precio

#### Paso 2: Seleccionar Ubicación (Sede)
- Header: negocio + servicio
- Grid de `LocationCard`: banner, nombre, dirección completa, distancia
- Solo muestra sedes donde se ofrece el servicio

#### Paso 3: Seleccionar Profesional
- Header: negocio + servicio + sede
- Grid de `EmployeeCard`: avatar, nombre, especialidad, rating
- Opción especial: **"Cualquier profesional disponible"** (asigna automáticamente)
- Solo muestra profesionales que ofrecen ese servicio en esa sede

#### Paso 4: Seleccionar Fecha y Hora
- Header: negocio + servicio + sede + profesional
- Calendario interactivo (fecha) + selector de hora
- **Validaciones en tiempo real:**
  - Solo muestra slots disponibles
  - Respeta horarios de operación de la sede
  - Bloquea la hora de almuerzo del empleado
  - Bloquea ausencias aprobadas del empleado
  - Bloquea festivos colombianos (54 festivos 2025–2027)
  - Bloquea overlap con otras citas: `slotStart < aptEnd && slotEnd > aptStart`
- Si el negocio no trabaja festivos → día bloqueado
- No permite fechas pasadas

#### Paso 5: Confirmación y Notas
- Resumen readonly de toda la selección
- Campo de notas opcional (textarea, max 500 caracteres)
  - Placeholder: "Ej: Tengo alergia a ciertos productos..."
- Botones: **Atrás** / **Confirmar cita**

#### Paso 6: Pantalla de Éxito
- ✅ Cita agendada
- Número de confirmación (#APT-XXXXXX)
- Resumen de la cita
- Mensaje: "Recibirás un email con los detalles. Te enviaremos un recordatorio 24 horas antes."
- Botones: **Agendar Otra** / **Ir a Inicio**

> **💡 Tip**: Si llegaste al wizard desde un perfil público del negocio o desde el botón "Reprogramar", varios pasos estarán pre-llenados. Solo tendrás que revisar y confirmar.

#### Flujo crítico: primera cita sin autenticación

1. Usuario visita `/negocio/:slug` (sin login)
2. Presiona **Agendar Cita** → la app redirige a `/login?redirect=/negocio/:slug?serviceId=...&employeeId=...`
3. Usuario inicia sesión o se registra
4. Al volver al perfil, la app detecta los parámetros en la URL
5. Abre automáticamente el wizard con preselecciones
6. Cliente completa Paso 4 (fecha) y Paso 5 (confirmar)

### 8. Validaciones y mensajes de error del wizard

| Situación | Mensaje |
|-----------|---------|
| Sin teléfono registrado | "Debes agregar tu número de teléfono antes de agendar" (PhoneRequiredModal) |
| Slot no disponible | "El profesional no tiene disponibilidad en ese horario" |
| Conflicto con festivo | "La sede no atiende los días festivos" |
| Error al crear cita | "Error al agendar cita. Intenta de nuevo." (toast rojo, log a Sentry) |
| Servicio eliminado | "El servicio ya no está disponible" |
| Notas > 500 chars | "Las notas no pueden superar 500 caracteres" |

### 9. Favoritos

**[SCREENSHOT: Página de favoritos]**

Grid responsivo de `BusinessCard` con los negocios guardados. Cada tarjeta muestra:
- Banner o logo
- Nombre del negocio
- Rating + número de reseñas
- Ciudad
- Distancia (si geolocalización activa)

**Acciones por tarjeta:**
- **❤️ Corazón rojo lleno**: quita de favoritos (toast "Removido de favoritos")
- **Reservar**: abre el perfil del negocio → desde ahí puede agendar

**Empty state**: "No hay favoritos aún — Explora negocios y guárdalos para acceso rápido" + botón **Explorar Negocios**.

### 10. Historial de citas

**[SCREENSHOT: Historial con panel de filtros avanzados expandido]**

Muestra citas con status `completed`, `cancelled`, `no_show`. Ordenadas por fecha descendente. Paginación: 5 citas por página.

**Filtros avanzados (panel desplegable):**
1. Estado (checkbox múltiple): Completada / Cancelada / No asistió
2. Negocio (typeahead con autocomplete)
3. Ubicación (typeahead)
4. Servicio (typeahead)
5. Categoría (multi-select)
6. Profesional (typeahead)
7. Rango de precio (min–max COP)
8. Rango de fechas (from–to)
9. Búsqueda libre

Botón **Limpiar filtros** resetea todo.

### 11. Búsqueda global

Barra de búsqueda en el navbar, visible desde cualquier página. Usa la RPC `search_businesses()` con `ts_rank` y búsqueda fuzzy via índices trigram GIN.

**Búsqueda por tipo** (tabs):
- 🏢 Negocios
- 💼 Profesionales
- 🛠️ Servicios
- 📍 Ubicaciones

**Autocomplete**: debounce 300ms. Muestra top 3–5 resultados por categoría con enlace "Ver más".

**Algoritmos de ordenamiento** disponibles en resultados:
- Por rating
- Por distancia (si geolocalización)
- Por popularidad
- Por precio
- Por relevancia (ts_rank)
- Más recientes

### 12. Perfiles públicos

**[SCREENSHOT: Perfil público del negocio — `/negocio/:slug`]**

Ruta: `/negocio/:slug` — 100% indexable por Google con meta tags, Open Graph, Twitter Card y JSON-LD Schema.

**Tabs:**
1. **Info**: descripción, horarios, información de contacto
2. **Servicios**: grid de `ServiceCard`
3. **Sedes**: grid de `LocationCard`
4. **Profesionales**: grid de `EmployeeCard` (click → perfil público del profesional)
5. **Reseñas**: `ReviewList` paginado

**Botón "Agendar Cita"** (CTA prominente):
- Usuario no autenticado → `/login?redirect=...`
- Cliente autenticado → abre wizard con `businessId` preseleccionado
- Admin/employee de **otro** negocio → botón deshabilitado con tooltip: "No disponible para tu rol actual"

**Perfil público del profesional** (`/profesional/:employeeId`): similar, con biografía, servicios ofrecidos, horarios disponibles esta semana, reseñas.

### 13. Notificaciones

El cliente recibe estas notificaciones (in-app, email, y opcionalmente WhatsApp/SMS si el negocio lo tiene configurado):

| Evento | Canal |
|--------|-------|
| Cita confirmada por el profesional | In-app + Email |
| Recordatorio 24h antes | Email + WhatsApp (si configurado) |
| Cita cancelada por el profesional | In-app + Email |
| Nuevo mensaje en el chat | In-app (con badge en `NotificationBell`) |
| Respuesta a tu reseña | In-app |
| Solicitud de reseña (post-cita) | In-app modal (`MandatoryReviewModal`) |

Click en notificación → navega a la cita/pantalla relevante. Se marca como leída automáticamente.

### 14. Chat en tiempo real

**[SCREENSHOT: Chat flotante con profesional]**

Componente `FloatingChatButton` + `ChatWindow` (esquina inferior derecha).

**Cómo abrirlo:**
- Desde el modal de detalles de cita → botón "💬 Chatear con el profesional"
- Desde `ChatWithAdminModal` en el perfil público (si el negocio permite chat pre-venta)

**Funcionalidades:**
- Mensajes de texto en tiempo real (Supabase Realtime)
- Adjuntar imágenes/archivos (`FileUpload` → bucket `chat-attachments`)
- Read receipts (✓✓)
- Typing indicator ("Está escribiendo...")
- Persistencia en tablas `conversations` y `messages`
- Notificación por email si el destinatario no conecta en X minutos (`send-unread-chat-emails`)

### 15. Reseñas

**Cuándo puede dejar reseña:**
- Solo clientes con **al menos una cita completada** con ese negocio/profesional
- Sin reseña previa para esa misma cita (`useCompletedAppointments` + validación)

**Modal obligatorio** (`MandatoryReviewModal`):
- Se dispara automáticamente tras completar una cita si el usuario no ha dejado reseña
- Puede posponerse ("Más tarde") pero reaparece

**Contenido de una reseña:**
- Rating 1–5 estrellas
- Comentario (textarea)
- Tipo: `business` (al negocio) o `employee` (al profesional)
- Opción: anónima

**Restricciones:**
- No se puede editar una reseña después de 24h
- El profesional puede responder (no editar la tuya)
- El admin puede ocultar reseñas inapropiadas (no borrarlas)

### 16. Mi Perfil

Ruta: `/app/client/profile`

**Secciones:**
1. **Avatar y nombre** — foto editable, QR personal para compartir
2. **Contacto** — email (readonly), teléfono (editable, requerido)
3. **Datos personales** — fecha de nacimiento, género, documento (todos opcionales)
4. **Direcciones guardadas** — múltiples, con Google Maps picker, marca de "principal"
5. **Preferencias de ubicación** — ciudad preferida, radio de búsqueda (km)
6. **Métodos de pago** — (fase futura)

### 17. Configuración

Ruta: `/app/client/settings` — componente `CompleteUnifiedSettings` (rol = client).

**Tabs:**

1. **General**
   - Tema: ☀️ Claro / 🌙 Oscuro / 🖥️ Sistema
   - Idioma: Español / English (aplicación inmediata)

2. **Notificaciones** — toggles por tipo:
   - Recordatorios de cita (24h antes)
   - Confirmaciones
   - Mensajes en chat
   - Cambios en cita

3. **Privacidad**
   - Perfil visible en búsquedas
   - Mostrar historial de reseñas (con nombre o anónimas)
   - Recopilar datos de ubicación (GDPR-compliant)

4. **Preferencias de búsqueda**
   - Ciudad preferida (persistida en `usePreferredCity`)
   - Radio de búsqueda (km)
   - Ordenamiento por defecto (Rating / Distancia / Reciente)

5. **Zona de peligro**
   - **Desactivar cuenta** — irreversible, requiere contraseña, toast "Entiendo que perderé acceso a mis citas"
   - **Solicitar eliminación GDPR** — anonimiza todos los datos personales

### 18. Flujos por email (token único, sin autenticación)

#### Confirmar cita (`/confirmar-cita/:token`)
1. Cliente recibe email con enlace único generado al crear la cita
2. Abre enlace → valida token en BD: `status='pending'` y token coincide
3. Muestra detalles readonly de la cita
4. Presiona **Confirmar cita**
5. Status cambia: `pending → confirmed`
6. Toast de éxito + redirige a `/login` o a dashboard

**Errores manejados:**
- Token expirado: "El plazo para confirmar ha expirado. Contacta al negocio."
- Token inválido: "Enlace no válido o modificado."
- Ya confirmada: "Esta cita ya fue confirmada anteriormente."

#### Cancelar cita (`/cancelar-cita/:token`)
Similar, cambia `status='cancelled'`, `cancel_reason='Cancelada por el cliente vía email'`.

#### Reprogramar cita (`/reprogramar-cita/:token`)
Valida token → si no autenticado redirige a login con redirect → luego abre wizard.

### 19. Restricciones importantes

- **Sin permisos granulares**: el cliente no tiene entradas en `user_permissions`. Sus capacidades están garantizadas por **RLS de Supabase**.
- **Aislamiento por RLS**: solo ve `appointments` donde `client_id = auth.uid()`.
- **Sin acceso a dashboards de negocios**: aunque un cliente pueda ser admin/empleado de otros negocios, esos flujos están fuera del alcance del rol cliente.
- **Plan del negocio irrelevante**: la experiencia del cliente es idéntica sin importar si el negocio es Gratuito, Básico o Pro. Lo único que cambia son las funcionalidades que el negocio ofrece internamente (chat pre-venta, recordatorios WhatsApp, etc.).

### 20. Integraciones externas visibles al cliente

| Servicio | Uso |
|----------|-----|
| Google Maps | Link desde dirección de sede en modal de cita |
| Google OAuth | Login social |
| GitHub OAuth | Login social |
| Magic Link | Login sin contraseña |
| Brevo (Sendinblue) | Emails transaccionales (confirmación, recordatorios, cancelaciones) |
| WhatsApp Business | Recordatorios y confirmaciones (si el negocio lo tiene activo) |
| Google Analytics 4 | Analytics GDPR-compliant (consent required) |

---

## PROPUESTA DE VALOR — Sección Cliente

### Ventaja competitiva: la experiencia del cliente

El cliente final nunca paga por Gestabiz — pero **es quien decide** si vuelve a reservar. Una experiencia fluida se traduce directamente en:
- Más reservas repetidas
- Menos cancelaciones de último minuto
- Mejor NPS y reseñas orgánicas
- Reducción del tiempo del profesional atendiendo llamadas

### Por qué Gestabiz gana vs la competencia

| Feature | Gestabiz | Calendly | Booksy | Fresha | Agenda Pro (CO) |
|---------|----------|----------|--------|--------|-----------------|
| App móvil para clientes | ✅ Web + móvil | ❌ | ✅ | ✅ | ❌ |
| Chat con el profesional | ✅ Tiempo real | ❌ | ❌ | ❌ | ❌ |
| Multi-negocio (un perfil, N negocios) | ✅ | ❌ | ❌ | Parcial | ❌ |
| Confirmación email con 1 clic | ✅ Token único | ❌ | ✅ | ✅ | ✅ |
| Perfil público SEO (Google-indexable) | ✅ JSON-LD | ❌ | ✅ | ✅ | ❌ |
| Historial completo con filtros avanzados | ✅ 9 filtros | ❌ | Básico | Básico | ❌ |
| Favoritos entre negocios | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reseñas con validación (solo citas completadas) | ✅ | ❌ | ✅ | ✅ | ✅ |
| Reprogramación sin llamar | ✅ | ✅ | ✅ | ✅ | ✅ |
| Soporte horizontal (cualquier vertical) | ✅ 15 categorías | ✅ | ❌ Solo estética | ❌ Solo estética | ✅ |

### Mensaje clave para el dueño de negocio

> **"Tus clientes tienen una app tan buena que van a querer usarla. Chat directo, reserva en 30 segundos, recordatorios automáticos, historial en su bolsillo. Eso se traduce en más reservas, más lealtad, y menos cancelaciones de último minuto."**

### ROI esperado para el negocio (lado cliente)

- **-40% no-shows** — recordatorio 24h + chat directo reducen el olvido
- **+25% reservas repetidas** — historial + favoritos facilitan volver
- **+15% reservas orgánicas** — perfiles SEO traen tráfico de Google
- **-60% llamadas telefónicas** — cliente autónomo reprograma y confirma solo

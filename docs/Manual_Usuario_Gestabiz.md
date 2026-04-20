**GESTABIZ**
**Manual de Usuario**
*Guia funcional exhaustiva de la plataforma*
**Versión Completa: Experiencia del Cliente**
Version del producto: 1.0.3   |   Abril 2026
*Fase Beta completada   |   Listo para produccion*

Desarrollado por **Ti Turing**
*https://github.com/TI-Turing   |   contacto@gestabiz.com*

**Indice**
Este documento cubre de manera exhaustiva la experiencia del rol Cliente en Gestabiz. Cada entrada del indice es un hipervinculo a la seccion correspondiente. Este es el primero de cinco volumenes que componen el Manual completo.
**Parte 1 — Resumen Ejecutivo**
1.1  Que es Gestabiz para el cliente?
1.2  Como acceder por primera vez
1.3  Pantallas y areas del cliente
1.4  Flujos principales resumidos
1.5  Resumen de permisos y limitaciones por plan
**Parte 2 — Detalle Exhaustivo**
2.1  Autenticacion y onboarding del cliente
2.2  Dashboard del cliente (ClientDashboard)
2.3  Sidebar y navegacion
2.4  Header interactivo
2.5  Vista de Citas (appointments)
2.6  Vista de Favoritos
2.7  Vista de Historial de Citas
2.8  Wizard de Reserva (AppointmentWizard)
2.9  Perfil Publico del Negocio (BusinessProfile)
2.10  Sistema de Busqueda
2.11  Confirmacion de cita por email
2.12  Cancelacion de cita por email
2.13  Chat con el negocio
2.14  Notificaciones
2.15  Resenas y calificaciones
2.16  Perfil personal y configuracion
2.17  Verificacion de telefono
2.18  Cambio de ciudad preferida
2.19  Landing Page publica
2.20  Cookie Consent y privacidad
2.21  Componentes Card usados en el rol cliente
2.22  Estados de carga y error
2.23  Modales y dialogos completos
2.24  Glosario

**Parte 1 — Resumen Ejecutivo**
**1.1  Que es Gestabiz para el cliente?**
Gestabiz ofrece al cliente final (la persona que reserva citas) una experiencia completa, fluida y moderna para descubrir negocios de servicios, reservar citas online las 24 horas del dia con validacion en tiempo real, gestionar su agenda personal, chatear con los negocios, dejar resenas y recibir recordatorios automaticos por email y WhatsApp.
El cliente no necesita instalar nada: accede desde cualquier navegador web o desde la app movil (Expo/React Native). Su cuenta le permite interactuar con multiples negocios simultaneamente, cada uno con su propio historial, favoritos y conversaciones de chat.

| Dato clave El rol de cliente esta disponible para TODOS los usuarios autenticados de Gestabiz, sin importar si tambien son administradores o empleados en otros negocios. Los roles se calculan dinamicamente y nunca se persisten en la base de datos. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Vista general del ClientDashboard con citas proximas y favoritos. |


**1.2  Como acceder por primera vez**
Existen tres formas de llegar a Gestabiz como cliente:
- Registro directo: El usuario visita gestabiz.com, pulsa 'Empezar gratis' y crea una cuenta con correo electronico + contrasena, o con Google OAuth, o con GitHub OAuth, o via Magic Link.
- Reserva desde perfil publico (deep-link): El usuario llega a /negocio/<slug> desde una busqueda en Google o un enlace compartido. Pulsa 'Reservar', se le pide iniciar sesion (o registrarse), y al autenticarse el Wizard de Reserva se abre automaticamente con el negocio, servicio y empleado preseleccionados.
- Invitacion directa: Un negocio comparte su URL publica por WhatsApp, Instagram o email. El cliente llega al perfil y sigue el mismo flujo que el punto 2.
Tras la autenticacion, si el usuario no tiene ningun negocio creado ni esta vinculado como empleado a ninguno, Gestabiz lo dirige automaticamente al rol Cliente y muestra el ClientDashboard.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Pantalla de registro con opciones de email, Google y Magic Link. |


**1.3  Pantallas y areas del cliente**
El cliente tiene acceso a las siguientes pantallas principales dentro de /app:

| Pantalla | Ruta | Descripcion |
| --- | --- | --- |
| ClientDashboard | /app (rol cliente) | Hub central con widgets de proximas citas, favoritos, descubrimiento por ciudad. |
| Citas | /app (activePage=appointments) | Lista y calendario de citas activas con acciones de reprogramar/cancelar. |
| Favoritos | /app (activePage=favorites) | Negocios marcados como favoritos con acceso rapido a reservar. |
| Historial | /app (activePage=history) | Registro historico de todas las citas pasadas con filtros avanzados. |
| Buscar | Header + SearchBar | Busqueda global de negocios, servicios y profesionales. |
| Perfil | /app (activePage=profile) | Datos personales, foto, telefono, documento. |
| Configuracion | /app (activePage=settings) | Preferencias de notificaciones, idioma, tema, privacidad. |


Ademas, el cliente interactua con estas rutas publicas (sin necesidad de autenticacion):

| Pantalla | Ruta | Descripcion |
| --- | --- | --- |
| Landing Page | / | Pagina de aterrizaje con informacion general de Gestabiz. |
| Perfil publico | /negocio/<slug> | Perfil del negocio indexable en Google con servicios, sedes, resenas. |
| Confirmar cita | /confirmar-cita/<token> | Pagina para confirmar una cita desde un link de email. |
| Cancelar cita | /cancelar-cita/<token> | Pagina para cancelar una cita desde un link de email. |
| Login / Registro | /login, /register | Pantalla de autenticacion con multiples proveedores. |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Mapa de navegacion del cliente — sidebar, header y areas principales. |


**1.4  Flujos principales resumidos**
El cliente puede realizar 12 flujos principales dentro de la plataforma:

| # | Flujo | Pasos clave | Resultado |
| --- | --- | --- | --- |
| 1 | Reservar cita desde dashboard | Buscar > Negocio > Servicio > Sede > Profesional > Fecha > Confirmar | Cita creada con status pending + email |
| 2 | Reservar desde perfil publico sin cuenta | Perfil > Reservar > Login > Wizard preseleccionado | Cita con datos preseleccionados |
| 3 | Reprogramar cita | Mis Citas > Detalle > Reprogramar > Nuevo horario > Confirmar | Cita actualizada (UPDATE, no INSERT) |
| 4 | Reprogramar desde notificacion | Notificacion > Click > Cambio de rol automatico > Wizard | Navegacion contextual |
| 5 | Cancelar cita in-app | Mis Citas > Detalle > Cancelar > Motivo > Confirmar | Status cancelled + notificacion |
| 6 | Cancelar cita por email | Email > Link /cancelar-cita/<token> > Confirmar | Cancelacion sin login |
| 7 | Confirmar cita por email | Email > Link /confirmar-cita/<token> > Confirmar | Status confirmed sin login |
| 8 | Chat con negocio | Perfil o FloatingChat > Elegir empleado > Enviar mensaje | Conversacion en tiempo real |
| 9 | Agregar/quitar favorito | Perfil negocio o lista > Toggle corazon | Favorito con actualizacion optimista |
| 10 | Dejar resena | Post-cita o MandatoryReviewModal > 5 estrellas > Comentario | Review publicada |
| 11 | Verificar telefono | Modal obligatorio al detectar telefono no verificado | Telefono verificado via SMS |
| 12 | Cambiar ciudad preferida | Header > CitySelector > Elegir ciudad | Dashboard filtrado por ciudad |


**1.5  Resumen de permisos y limitaciones por plan**
El rol de cliente no depende del plan del negocio: cualquier usuario puede ser cliente en cualquier negocio. Sin embargo, el plan del negocio donde el cliente reserva afecta la experiencia:

| Funcionalidad del cliente | Negocio Gratuito | Negocio Basico | Negocio Pro |
| --- | --- | --- | --- |
| Reservar citas | Si (max 30/mes) | Si (ilimitadas) | Si (ilimitadas) |
| Recibir recordatorios email | Si | Si | Si |
| Recibir recordatorios WhatsApp | No | Si | Si |
| Recibir recordatorios SMS | No | No | Si |
| Chat con owner | Si | Si | Si |
| Chat con empleados | No | Si (multi-empleado) | Si (multi-empleado) |
| Elegir empleado en wizard | No (solo owner) | Si | Si |
| Dejar resenas | Si | Si | Si |
| Confirmar/cancelar por email | Si | Si | Si |
| Ver recursos fisicos | No | No | Si |


**Parte 2 — Detalle Exhaustivo**
A continuacion se describe cada pantalla, componente, flujo, validacion, excepcion y caso limite que experimenta un usuario con rol Cliente en Gestabiz.
**2.1  Autenticacion y onboarding del cliente**
**2.1.1  Pantalla de autenticacion (AuthScreen)**
El componente AuthScreen renderiza en las rutas /login y /register. Es una pantalla unica con dos modos intercambiables mediante un tab superior.
**Campos de registro**
- Correo electronico (obligatorio, validado con Zod: formato email valido).
- Contrasena (obligatorio, minimo 8 caracteres con al menos una letra y un numero).
- Nombre completo (obligatorio).
- Pais (obligatorio, dropdown con bandera).
- Telefono con prefijo internacional (opcional en registro, pero puede requerirse despues).
- Checkbox 'Acepto terminos y condiciones y politica de privacidad' (obligatorio).
**Metodos de autenticacion**
- Email + contrasena: formulario clasico. Al registrar, Supabase envia correo de verificacion con token valido 24 horas.
- Google OAuth: boton 'Continuar con Google'. Redirige a accounts.google.com con el client_id del entorno (DEV o PROD son clientes OAuth distintos). Al aceptar, retorna a /auth/callback y Gestabiz crea el profile si no existe.
- GitHub OAuth: boton 'Continuar con GitHub'. Flujo identico al de Google pero para perfiles tecnicos.
- Magic Link: boton 'Recibir link magico'. Envia un email con un link de un solo uso que autentica sin contrasena. El link expira en 1 hora.
**Flujo de deep-link (reserva sin cuenta)**
Cuando el cliente llega desde /negocio/<slug> y pulsa 'Reservar', el sistema preserva los parametros en la URL (business_id, service_id, employee_id, location_id). AuthScreen detecta estos parametros y muestra un toast informativo: 'Inicia sesion para completar tu reserva'. Tras autenticarse, useWizardDataCache hidrata el wizard con los datos preseleccionados y navega al paso correcto automaticamente.
**Validaciones y excepciones**
- Excepcion — Si el correo ya existe: mensaje 'Este correo ya tiene cuenta' con boton directo al modo login.
- Excepcion — Si Google devuelve scope insuficiente: mensaje 'Necesitamos permisos de correo para continuar'.
- Excepcion — Magic Link vencido (>1 hora): mensaje 'Enlace vencido, solicita uno nuevo'.
- Excepcion — Tras 5 intentos fallidos: Supabase aplica rate-limit temporal (mensaje 'Demasiados intentos').
- Nota — Banner 'Verifica tu correo' visible en toda la app hasta que el usuario confirme su email.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: AuthScreen con tabs Login/Registro, botones OAuth y campo de Magic Link. |


**2.1.2  Verificacion de correo electronico**
Tras registrarse con email, el usuario recibe un correo con un link unico que redirige a /app/verify. Al pulsar el link:
- El navegador abre la ruta /app/verify con el token en la URL.
- Supabase valida el token (vigencia de 24 horas).
- Si es valido: el usuario queda autenticado automaticamente y se le redirige al dashboard.
- Si el token expiro: se muestra una pagina con boton 'Reenviar verificacion'.
**2.1.3  Primer aterrizaje post-registro**
Tras la primera autenticacion exitosa, el sistema detecta que el usuario no tiene negocios creados ni esta vinculado a ninguno como empleado. Por tanto:
- Se le presenta la pantalla de decision: 'Vengo a reservar' (rol Cliente) o 'Quiero ofrecer servicios' (crear negocio).
- Si elige 'Reservar': se activa el rol Cliente y se muestra el ClientDashboard con el catalogo de negocios disponibles.
- Si elige 'Ofrecer servicios': se inicia el wizard de creacion de negocio (cubierto en Parte 3: Admin).

**2.2  Dashboard del cliente (ClientDashboard)**
El ClientDashboard es el hub central del cliente. Se renderiza en /app cuando el rol activo es 'client'. Internamente usa un estado activePage que determina que vista se muestra en el area principal.
**2.2.1  Estructura visual**
El layout esta compuesto por tres zonas:
- Sidebar — Sidebar izquierdo (UnifiedLayout): navegacion principal con 3 items - Citas, Favoritos, Historial. En la parte inferior, acceso a Perfil y Configuracion via el menu de usuario.
- Header — Header superior: logo Gestabiz (click lleva al dashboard), CitySelector (dropdown de ciudad), SearchBar (busqueda global con debounce 300ms), NotificationBell (campanita con badge de no-leidas), Avatar con dropdown (Perfil, Configuracion, Cambiar Rol, Cerrar Sesion).
- Contenido — Area principal: contenido dinamico segun activePage. Por defecto muestra el overview con widgets.
**2.2.2  Widgets del overview**
El overview del ClientDashboard consume la RPC get_client_dashboard_data(client_id, city_name, region_name) y muestra:
- Proxima cita: card con negocio, servicio, fecha/hora, empleado y boton 'Ver detalles'.
- Citas pasadas: resumen numerico de citas completadas y canceladas.
- Favoritos: grid horizontal scrollable de negocios marcados como favoritos (BusinessCard miniatura).
- Descubre negocios en tu ciudad: lista de negocios populares filtrados por la ciudad actual del cliente (useGeolocation sugiere la ciudad, usePreferredCity la persiste).
**Detalle de la RPC get_client_dashboard_data**
Esta funcion server-side recibe el client_id y opcionalmente city_name y region_name para filtrar negocios cercanos. Retorna:
- upcoming_appointments: array de las proximas 5 citas con status pending o confirmed.
- past_appointments_count: numero total de citas completadas.
- favorite_businesses: array de negocios favoritados con rating y slug.
- discover_businesses: negocios populares en la ciudad del cliente, ordenados por rating descendente.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: ClientDashboard overview con widget de proxima cita, favoritos y descubrimiento. |


**2.3  Sidebar y navegacion**
El sidebar del cliente se renderiza como parte del UnifiedLayout. Es un panel lateral fijo en desktop (collapsable) y un drawer en mobile.
**2.3.1  Items del sidebar**

| Item | Icono | activePage | Descripcion |
| --- | --- | --- | --- |
| Citas | Calendar | appointments | Lista de citas activas y calendario. |
| Favoritos | Heart | favorites | Negocios marcados como favoritos. |
| Historial | Clock | history | Registro de citas pasadas con filtros. |


**2.3.2  Menu de usuario (Avatar dropdown)**
Al hacer click en el avatar del header, se despliega un dropdown con:
- Mi Perfil: navega a la vista de perfil personal.
- Configuracion: navega a CompleteUnifiedSettings en modo cliente.
- Cambiar Rol: permite alternar a Admin o Empleado si el usuario tiene esos roles disponibles en algun negocio. Los roles se calculan en tiempo real consultando businesses.owner_id y business_employees.employee_id.
- Cerrar Sesion: cierra la sesion en el dispositivo actual.
**2.3.3  Navegacion mobile**
En pantallas menores a 768px (breakpoint md), el sidebar se transforma en un drawer que se abre con un boton hamburguesa en el header. La navegacion inferior (tab bar) no se usa en web mobile — toda la navegacion es via el drawer.

**2.4  Header interactivo**
**2.4.1  Logo Gestabiz**
Click en el logo navega de vuelta al ClientDashboard overview. Si el usuario esta en otra vista (favoritos, historial, etc.), lo devuelve al hub central.
**2.4.2  CitySelector**
Dropdown que permite al cliente elegir su ciudad preferida. La seleccion se persiste en localStorage via usePreferredCity y filtra los negocios del widget 'Descubre en tu ciudad'. Al primer acceso, useGeolocation intenta detectar la ciudad por geolocalizacion del navegador. Si el usuario rechaza el permiso, el selector muestra 'Todas las ciudades'.
**2.4.3  SearchBar**
Campo de texto con debounce de 300ms. Al escribir, lanza busquedas en tiempo real contra las RPCs search_businesses(), search_services() y search_professionals(). El dropdown de resultados (SearchResults) muestra cards con 6 algoritmos de ordenamiento: relevancia, rating, proximidad geografica, precio ascendente, precio descendente y recien agregados.
Cada resultado se renderiza como un SearchResultCard. Click en un resultado de tipo negocio abre el BusinessProfile modal. Click en un servicio navega al perfil del negocio en el tab de servicios. Click en un profesional abre el UserProfile modal.
**2.4.4  NotificationBell**
Campanita con badge numerico de notificaciones no leidas. Al hacer click abre el NotificationCenter (dropdown o panel lateral segun breakpoint). El hook useInAppNotifications realiza una unica query base (limit=50) y aplica filtros locales por status, tipo, businessId. El conteo de no-leidas se calcula localmente sin RPC adicional.
Si una notificacion pertenece a un rol diferente al activo (por ejemplo, una notificacion de empleado mientras el usuario esta en rol cliente), al hacer click el sistema cambia automaticamente de rol via notificationRoleMapping antes de navegar.
**2.4.5  Avatar y dropdown de usuario**
Muestra la foto del usuario (del bucket avatars) o las iniciales si no tiene foto. El dropdown incluye nombre, email, plan del negocio activo (si aplica), y las opciones de navegacion descritas en la seccion 2.3.2.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Header del cliente con CitySelector, SearchBar, NotificationBell y Avatar dropdown. |


**2.5  Vista de Citas (appointments)**
Al seleccionar 'Citas' en el sidebar, el area principal muestra la vista de citas del cliente. Esta vista tiene dos modos intercambiables: lista y calendario.
**2.5.1  Modo lista**
Lista vertical de AppointmentCard ordenadas por fecha descendente (proximas primero). Cada card muestra:
- Nombre del negocio y logo.
- Nombre del servicio y duracion.
- Fecha y hora (formato dd/mm/yyyy HH:mm).
- Nombre del profesional asignado (si aplica).
- Sede donde se realizara la cita.
- Badge de estado con color: Pendiente (amarillo), Confirmada (verde), Completada (azul), Cancelada (gris).
- Precio del servicio.
**2.5.2  Modo calendario**
Vista de calendario interactivo con seleccion de dia/semana/mes. Cada cita aparece como un bloque de color segun su estado. Click en un bloque abre el dialogo de detalle.
**2.5.3  Boton 'Nueva Cita'**
Boton prominente en la parte superior de la vista que abre el AppointmentWizard desde el paso 1 (seleccion de negocio).
**2.5.4  Dialogo de detalle de cita**
Al hacer click en un AppointmentCard (en lista o calendario), se abre un dialogo modal con la informacion completa de la cita:
- Informacion del negocio: nombre, logo, slug, categoria.
- Servicio: nombre, descripcion, duracion, precio.
- Profesional: nombre, foto, especialidad.
- Sede: nombre, direccion completa, enlace a Google Maps (abre en nueva pestana).
- Fecha y hora con zona horaria.
- Estado actual con badge de color.
- Notas del cliente (si se agregaron en la reserva).
**Acciones disponibles en el dialogo**

| Accion | Condicion | Efecto |
| --- | --- | --- |
| Chatear | Negocio tiene chat habilitado | Abre ChatWithAdminModal o chat directo |
| Reprogramar | Status = pending o confirmed | Abre AppointmentWizard en modo edicion |
| Cancelar | Status = pending o confirmed | Abre modal de cancelacion con motivo |
| Ver en mapa | Sede tiene coordenadas | Abre Google Maps en nueva pestana |


**Flujo de reprogramacion desde el dialogo**
- Cliente pulsa 'Reprogramar' en el dialogo de detalle.
- Se abre el AppointmentWizard en modo edicion. Los pasos ya decididos (negocio, servicio, sede, empleado) estan preseleccionados y se pueden modificar.
- El paso critico es DateTimeSelection, donde el sistema excluye la cita actual del calculo de overlap para permitir reprogramar al mismo horario o uno cercano.
- Al confirmar, la funcion createAppointment ejecuta un UPDATE (no INSERT) sobre la cita existente.
- El negocio y el empleado reciben notificacion de reprogramacion.
**Flujo de cancelacion desde el dialogo**
- Cliente pulsa 'Cancelar' en el dialogo de detalle.
- Se abre un modal que solicita motivo de cancelacion (minimo 10 caracteres).
- Al confirmar, el status cambia a 'cancelled' y se libera el slot horario.
- El negocio recibe notificacion in-app + email. Si el plan lo permite, tambien WhatsApp.
**Validaciones y excepciones**
- Regla — Una cita con status 'completed' o 'cancelled' NO puede reprogramarse ni cancelarse: los botones correspondientes no aparecen.
- Excepcion — Si el servicio fue eliminado por el negocio, la cita se muestra con servicio 'N/A' (LEFT JOIN, no INNER JOIN).
- Caso limite — Si la cita esta en el pasado pero aun tiene status 'pending', se puede cancelar pero no reprogramar.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Vista de Citas en modo lista con AppointmentCards y dialogo de detalle abierto. |


**2.6  Vista de Favoritos**
**2.6.1  Listado de favoritos**
La vista de favoritos muestra un grid de BusinessCard para cada negocio que el cliente ha marcado como favorito. Cada card incluye:
- Logo y nombre del negocio.
- Categoria principal.
- Rating promedio (estrellas + numero).
- Ciudad y direccion resumida.
- Boton corazon (Heart) para toggle de favorito.
- Boton 'Reservar' que abre el Wizard con el negocio preseleccionado.
**2.6.2  Toggle de favorito**
El toggle de favorito funciona con actualizacion optimista: al pulsar el corazon, la UI se actualiza inmediatamente (sin esperar la respuesta del servidor). Si la operacion falla en Supabase, la UI revierte al estado anterior y muestra un toast de error.
Internamente, el toggle opera sobre la tabla favorites con las columnas user_id y business_id. La operacion es un INSERT o DELETE segun el estado actual.
**Validaciones**
- Regla — Requiere sesion activa: si el usuario no esta autenticado, el boton corazon no se renderiza o redirige al login.
- Sin limite — Un usuario puede favoritear un numero ilimitado de negocios.
- UX — Al desfavoritear, el negocio desaparece de la lista inmediatamente (optimistic update).

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Vista de Favoritos con grid de BusinessCards y corazones activos. |


**2.7  Vista de Historial de Citas**
**2.7.1  Interfaz principal**
La vista de Historial (ClientHistory) muestra todas las citas pasadas del cliente, sin importar el negocio. Es una lista con busqueda y filtros avanzados.
**2.7.2  Barra de busqueda**
Campo de texto en la parte superior que filtra localmente por nombre del negocio, nombre del servicio o nombre del profesional. Usa debounce de 300ms para performance.
**2.7.3  Filtros colapsables**
Un panel de filtros avanzados que se expande/colapsa al pulsar 'Filtros'. Incluye:
- Estado: Todas, Completadas, Canceladas, Pendientes, Confirmadas.
- Rango de fechas: fecha inicio y fecha fin con date picker.
- Negocio: dropdown con los negocios donde el cliente ha tenido citas.
- Servicio: dropdown que se filtra segun el negocio seleccionado.
**2.7.4  Paginacion**
Las citas se muestran en bloques de 5 por pagina con controles de paginacion en la parte inferior (Anterior / Siguiente / numero de pagina).
**2.7.5  Cada cita en el historial muestra**
- Fecha y hora de la cita.
- Nombre del negocio.
- Nombre del servicio.
- Profesional asignado.
- Precio.
- Badge de estado (Completada/Cancelada/etc.).
- Boton para ver detalle (abre el dialogo de detalle de la seccion 2.5.4).

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Historial de citas con filtros colapsados, busqueda activa y paginacion. |


**2.8  Wizard de Reserva (AppointmentWizard)**
El AppointmentWizard es el componente central de la experiencia del cliente. Es un asistente multi-paso con validacion en tiempo real que guia desde la seleccion del negocio hasta la confirmacion de la cita.
**2.8.1  Pasos del Wizard**
El wizard tiene entre 6 y 8 pasos dependiendo del contexto:

| # | Paso | Componente | Condicional? | Descripcion |
| --- | --- | --- | --- | --- |
| 1 | Seleccion de negocio | BusinessSelection | No | Grid de negocios con busqueda. Si viene de deep-link, se salta. |
| 2 | Seleccion de negocio del empleado | EmployeeBusinessSelection | Si | Solo si el profesional trabaja en multiples negocios. |
| 3 | Seleccion de servicio | ServiceSelection | No | Grid de ServiceCards del negocio. Muestra precio y duracion. |
| 4 | Seleccion de sede | LocationSelection | No | Grid de LocationCards. Si el negocio tiene 1 sede, se auto-selecciona. |
| 5 | Seleccion de profesional | EmployeeSelection | No | Grid de EmployeeCards filtrados por servicio y sede. Badge 'Preseleccionado' si viene de deep-link. |
| 6 | Seleccion de fecha y hora | DateTimeSelection | No | Calendario + grid de slots horarios con validacion en tiempo real. |
| 7 | Confirmacion | ConfirmationStep | No | Resumen completo de la reserva con boton 'Confirmar Cita'. |
| 8 | Exito | SuccessStep | No | Mensaje de exito con botones 'Agregar a Google Calendar' y 'Ver mis citas'. |


**2.8.2  Indicador de progreso (Stepper)**
Una barra de progreso horizontal en desktop (compacta en mobile) muestra los pasos con:
- Check mark verde en pasos completados.
- Circulo morado con numero en el paso actual.
- Circulos grises para pasos pendientes.
- Contador textual: 'Paso 3 de 7'.
**2.8.3  Cache entre pasos (useWizardDataCache)**
El hook useWizardDataCache persiste las selecciones del wizard en localStorage durante 1 hora. Si el cliente cierra la pestana y vuelve dentro de ese plazo, el wizard se reabre en el paso exacto donde quedo con todas las selecciones previas intactas.
**2.8.4  Paso 6: DateTimeSelection — El mas critico**
Este paso es el corazon del sistema de reservas. Ejecuta 3 queries en paralelo para validar la disponibilidad:
- Query 1 — Horario de la sede: locations.opens_at y closes_at para el dia seleccionado.
- Query 2 — Horario del empleado: business_employees.lunch_break_start/end y horario semanal.
- Query 3 — Citas existentes: todas las citas del empleado en el dia seleccionado (excepto la cita en edicion si es reprogramacion).
**10 validaciones en tiempo real**

| # | Validacion | Efecto si falla |
| --- | --- | --- |
| 1 | Horario de apertura/cierre de la sede | Slot deshabilitado, tooltip 'Fuera de horario' |
| 2 | Hora de almuerzo del profesional | Slot deshabilitado, tooltip 'Hora de almuerzo' |
| 3 | Overlap con citas del mismo profesional | Slot deshabilitado, tooltip 'Ocupado' |
| 4 | Overlap con citas del cliente en otros negocios | Slot deshabilitado, tooltip 'Tienes otra cita' |
| 5 | Festivos publicos colombianos | Dia completo deshabilitado, tooltip 'Festivo: [nombre]' |
| 6 | Ausencias aprobadas del profesional | Dia/rango deshabilitado, tooltip 'Profesional ausente' |
| 7 | Duracion minima del servicio | Solo muestra slots con tiempo suficiente antes del cierre |
| 8 | Anticipacion minima del negocio | No permite reservar con menos de X horas de anticipacion |
| 9 | Buffer de 90 minutos | No permite reservar en los proximos 90 minutos |
| 10 | Maximo de citas activas del cliente | Bloqueo total si alcanza el limite (5 por negocio default) |


**Algoritmo de overlap**
El algoritmo de deteccion de overlap usa la formula: slotStart < appointmentEnd AND slotEnd > appointmentStart. Si el wizard esta en modo edicion (reprogramacion), la cita actual se excluye del calculo para permitir reprogramar al mismo horario o uno cercano.
**Exclusion de cita en edicion**
Cuando el wizard opera en modo UPDATE (reprogramacion), el prop appointmentToEdit contiene el ID de la cita que se esta editando. DateTimeSelection excluye esta cita de la lista de citas existentes para que su slot original aparezca como disponible.
**Feedback visual de slots**
Cada slot horario se renderiza como un boton que puede estar:
- Habilitado (clickable): fondo blanco con borde morado.
- Seleccionado: fondo morado con texto blanco.
- Deshabilitado: fondo gris con tooltip que explica el motivo.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: DateTimeSelection con calendario, slots horarios y tooltips de validacion. |


**2.8.5  Paso 7: ConfirmationStep**
Muestra un resumen completo de la reserva antes de confirmar:
- Negocio: nombre y logo.
- Servicio: nombre, duracion, precio.
- Sede: nombre y direccion.
- Profesional: nombre y foto.
- Fecha y hora seleccionadas.
- Campo opcional de notas para el negocio.
- Boton 'Confirmar Cita' que ejecuta createAppointment().
**Que sucede al confirmar**
- createAppointment() determina si es INSERT (nueva cita) o UPDATE (reprogramacion).
- Inserta/actualiza en la tabla appointments con status='pending'.
- Dispara notificaciones: in-app al negocio + email de confirmacion al cliente con link /confirmar-cita/<token>.
- Si el plan lo permite: notificacion WhatsApp al negocio.
- Tracking GA4: evento 'purchase' con revenue = precio del servicio.
**2.8.6  Paso 8: SuccessStep**
Pantalla de exito con confetti animation y dos botones:
- 'Agregar a Google Calendar': genera un evento ICS/Google Calendar con los datos de la cita.
- 'Ver mis citas': navega a la vista de Citas del cliente.
**2.8.7  Preseleccion inteligente desde deep-link**
Cuando el cliente llega al wizard desde un perfil publico o notificacion con datos preseleccionados:
- Los pasos ya decididos se saltan automaticamente.
- Los items preseleccionados muestran un badge verde 'Preseleccionado' con ring highlight.
- El wizard calcula dinamicamente el paso inicial correcto.
- Se valida la compatibilidad empleado-servicio con query a employee_services.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Wizard con pasos preseleccionados y badges verdes 'Preseleccionado'. |


**2.9  Perfil Publico del Negocio (BusinessProfile)**
El componente BusinessProfile se muestra como modal en la app autenticada (click desde busqueda o favoritos) y como pagina completa en la ruta publica /negocio/<slug> (PublicBusinessProfile). Ambas versiones comparten la misma estructura.
**2.9.1  Encabezado del perfil**
- Banner del negocio (si existe) como imagen de fondo.
- Logo del negocio (redondo, sobre el banner).
- Nombre del negocio.
- Categoria y subcategorias.
- Rating promedio (estrellas + numero + total de resenas).
- Ciudad y direccion.
- Boton corazon para toggle de favorito.
**2.9.2  Tabs del perfil (4 pestanas)**

| Tab | Contenido | Acciones del cliente |
| --- | --- | --- |
| Servicios | Grid de ServiceCards con nombre, precio, duracion, imagen, descripcion | Boton 'Reservar' por servicio (abre wizard con servicio preseleccionado) |
| Ubicaciones | Grid de LocationCards con mapa (si hay coordenadas), direccion, horario semanal | Boton 'Como llegar' (Google Maps en nueva pestana) |
| Resenas | ReviewList con distribucion de ratings (5 barras), filtros, lista ordenada por fecha | Dejar resena si tiene cita completada sin review previa |
| Acerca de | Descripcion del negocio, categorias, redes sociales, informacion legal | Links a redes sociales del negocio |


**2.9.3  Boton 'Reservar' en el perfil**
El boton 'Reservar' aparece en la cabecera del perfil (reserva general) y en cada ServiceCard (reserva con servicio preseleccionado). Al pulsar:
- Si el usuario esta autenticado: abre el AppointmentWizard con el negocio (y opcionalmente servicio) preseleccionado.
- Si el usuario NO esta autenticado (ruta publica /negocio/<slug>): guarda los parametros en la URL y redirige a /login con toast 'Inicia sesion para completar tu reserva'.
**2.9.4  Boton 'Chatear'**
Abre el ChatWithAdminModal v4.0.0. El comportamiento depende del tipo de usuario y del plan del negocio:
- Plan Gratuito: solo se puede chatear con el owner. Se muestra un boton directo 'Chatear con [nombre]'.
- Plan Basico/Pro: se muestra una lista de empleados disponibles (filtra allow_client_messages=true). Cada empleado muestra nombre, foto, rol y sede. El cliente elige con quien chatear.
- Si es el mismo owner mirando su perfil: boton directo 'Chatear' sin intermediarios.
**2.9.5  SEO y datos estructurados (ruta publica)**
La ruta publica /negocio/<slug> incluye:
- Meta tags dinamicos: title, description basados en el negocio.
- Open Graph tags: og:title, og:description, og:image (logo del negocio).
- Twitter Card tags.
- JSON-LD structured data tipo LocalBusiness/Service para indexacion en Google.
- Sitemap.xml generado via npm run generate-sitemap.
- robots.txt: permite /negocio/*, bloquea /app/* y /admin/*.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Perfil publico /negocio/<slug> con tabs, mapa, servicios y boton Reservar. |


**2.10  Sistema de Busqueda**
**2.10.1  SearchBar**
Campo de busqueda global ubicado en el header del cliente. Caracteristicas:
- Debounce de 300ms: no ejecuta queries hasta que el usuario deja de escribir durante 300 milisegundos.
- Dropdown de tipo: permite filtrar por 'Negocios', 'Servicios' o 'Profesionales' antes de buscar.
- Busqueda fuzzy: usa indices trigram (GIN) en PostgreSQL para encontrar resultados con errores tipograficos.
- Full-text search: usa tsvector con ts_rank para ordenar por relevancia.
**2.10.2  SearchResults**
Panel de resultados que se despliega debajo del SearchBar con los resultados agrupados por tipo. Cada resultado se renderiza como SearchResultCard.
**6 algoritmos de ordenamiento**

| Algoritmo | Criterio | Cuando usar |
| --- | --- | --- |
| Relevancia | ts_rank de PostgreSQL full-text search | Busquedas generales por texto |
| Rating | average_rating descendente | Encontrar los mejores negocios |
| Proximidad | Distancia geografica al cliente (haversine) | Encontrar negocios cercanos |
| Precio ascendente | Precio del servicio de menor a mayor | Buscar opciones economicas |
| Precio descendente | Precio del servicio de mayor a menor | Buscar servicios premium |
| Recien agregados | created_at descendente | Descubrir negocios nuevos |


**2.10.3  Interaccion con resultados**
- Click en negocio: abre BusinessProfile como modal.
- Click en servicio: abre BusinessProfile en el tab Servicios con el servicio destacado.
- Click en profesional: abre UserProfile modal con tabs Servicios, Experiencia y Resenas.
- Click en 'Reservar' desde un resultado: abre el wizard con el negocio y servicio preseleccionados.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: SearchBar con dropdown de resultados mostrando negocios y servicios. |


**2.11  Confirmacion de cita por email**
Tras crear una cita, el cliente recibe un email automatico con un link de confirmacion. Este flujo permite confirmar la cita sin necesidad de iniciar sesion.
**2.11.1  Contenido del email**
- Asunto: 'Confirma tu cita en [nombre del negocio]'.
- Cuerpo: datos de la cita (servicio, fecha, hora, sede, profesional).
- Boton 'Confirmar cita' con link a /confirmar-cita/<token>.
- Texto alternativo: 'Si no puedes confirmar, cancela aqui' con link a /cancelar-cita/<token>.
**2.11.2  Pagina /confirmar-cita/<token>**
Es una pagina publica que no requiere autenticacion. Al acceder:
- El sistema valida el token (vigencia de 24 horas).
- Si es valido: muestra los datos de la cita y un boton 'Confirmar'.
- Al pulsar: actualiza status a 'confirmed' y notifica al negocio.
- Si el token expiro: muestra 'Enlace vencido - contacta al negocio' con link al perfil publico.
- Si la cita ya fue confirmada: muestra 'Esta cita ya fue confirmada'.
- Si la cita fue cancelada: muestra 'Esta cita fue cancelada'.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Pagina de confirmacion de cita con datos resumidos y boton Confirmar. |


**2.12  Cancelacion de cita por email**
El mismo email de confirmacion incluye un enlace secundario para cancelar. Tambien puede enviarse un email dedicado de cancelacion.
**2.12.1  Pagina /cancelar-cita/<token>**
Pagina publica sin requerir autenticacion:
- Valida el token (24 horas de vigencia).
- Muestra los datos de la cita y solicita motivo de cancelacion.
- Al confirmar: actualiza status a 'cancelled', libera el slot y notifica al negocio.
- Token expirado: mismo mensaje que en confirmacion.
- Cita ya cancelada: muestra 'Esta cita ya fue cancelada'.

**2.13  Chat con el negocio**
Gestabiz incluye un sistema de chat en tiempo real que permite al cliente comunicarse directamente con el negocio. El chat opera sobre tablas de Supabase (conversations, messages, chat_participants) con suscripciones Realtime.
**2.13.1  Puntos de entrada al chat**
- Boton 'Chatear' en el BusinessProfile (modal o publico).
- Boton 'Chatear' en el dialogo de detalle de cita.
- FloatingChatButton (boton flotante en la esquina inferior derecha).
- Notificacion de tipo chat_message (click abre la conversacion).
**2.13.2  ChatWithAdminModal v4.0.0**
Modal que se abre al iniciar un chat desde el perfil del negocio. Tiene 3 flujos segun el contexto:

| Contexto | Comportamiento |
| --- | --- |
| Plan Gratuito | Muestra boton directo 'Chatear con [owner]' sin lista de empleados. |
| Plan Basico/Pro | Lista de empleados con allow_client_messages=true. Cada uno con avatar, nombre, rol, sede. Click en 'Chatear' abre la conversacion. |
| Owner viendo su perfil | Boton directo sin intermediarios. |


Al iniciar la conversacion, el modal cierra automaticamente el BusinessProfile padre (prop onCloseParent) y navega al chat.
**2.13.3  FloatingChatButton**
Boton flotante circular en la esquina inferior derecha del dashboard. Muestra un badge con el numero de mensajes no leidos. Al hacer click, despliega un panel lateral con la lista de conversaciones activas (SimpleChatLayout). Click en una conversacion abre la ventana de chat.
**2.13.4  Funcionalidades del chat**
- Mensajes de texto en tiempo real (Realtime subscription invalida cache de React Query).
- Adjuntos: imagenes y PDFs hasta 10 MB (bucket chat-attachments).
- Typing indicator: muestra '[nombre] esta escribiendo...' en tiempo real.
- Read receipts: doble check cuando el mensaje fue leido.
- MessageBubble con estados: enviado, entregado, leido.
- Email de no-leidos: edge function send-unread-chat-emails envia resumen diario de mensajes no leidos.
**Validaciones del chat**
- Filtro — Empleado con allow_client_messages=false NO aparece en la lista de ChatWithAdminModal.
- Restriccion — Negocio con allow_professional_chat=false (si existe la config) bloquea el chat multi-empleado.
- Limite — Archivos mayores a 10 MB son rechazados con mensaje 'Archivo demasiado grande (max 10 MB)'.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Chat en tiempo real con MessageBubble, typing indicator y adjuntos. |


**2.14  Notificaciones**
**2.14.1  NotificationBell (campanita)**
La campanita en el header muestra un badge numerico con las notificaciones no leidas. Al hacer click abre el NotificationCenter.
**2.14.2  NotificationCenter**
Panel desplegable (dropdown en desktop, panel full en mobile) con pestanas para filtrar notificaciones:
- Todas: listado cronologico de las ultimas 50 notificaciones.
- No leidas: solo las no marcadas como read.
- Por tipo: filtro por categoria (citas, chat, sistema).
**2.14.3  Tipos de notificaciones del cliente**

| Tipo | Trigger | Canales | Accion al click |
| --- | --- | --- | --- |
| appointment_created | Cita creada exitosamente | In-app + Email | Navega a detalle de la cita |
| appointment_confirmed | Cita confirmada por el negocio | In-app + Email | Navega a detalle de la cita |
| appointment_cancelled | Cita cancelada por el negocio | In-app + Email + WhatsApp* | Navega a detalle de la cita |
| appointment_rescheduled | Cita reprogramada por el negocio | In-app + Email | Navega a detalle de la cita |
| reminder_24h | 24 horas antes de la cita | In-app + Email | Navega a detalle de la cita |
| reminder_1h | 1 hora antes de la cita | In-app + Email + WhatsApp* | Navega a detalle de la cita |
| reminder_15m | 15 minutos antes de la cita | In-app | Navega a detalle de la cita |
| chat_message | Nuevo mensaje de chat | In-app + Email (diario) | Abre la conversacion de chat |
| employee_request_approved | Solicitud de empleo aceptada | In-app + Email | Navega a 'Mis empleos' |
| employee_request_rejected | Solicitud de empleo rechazada | In-app + Email | Navega a 'Mis empleos' |
| system_announcement | Anuncio del sistema Gestabiz | In-app | Abre el anuncio |
| appointment_reminder | Recordatorio generico de cita | In-app + Email | Navega a detalle de la cita |


** WhatsApp solo disponible si el negocio tiene plan Basico o superior.*
**2.14.4  Cambio automatico de rol**
Si una notificacion pertenece a un rol diferente al activo (por ejemplo, el usuario esta en rol cliente pero recibe notificacion de empleado), al hacer click el sistema conmuta automaticamente al rol requerido via notificationRoleMapping antes de navegar al destino.
**2.14.5  Preferencias de notificacion**
En Configuracion > Notificaciones, el cliente puede activar/desactivar cada tipo de notificacion por canal (in-app, email, WhatsApp, SMS). Las preferencias se guardan en user_notification_preferences.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: NotificationCenter con pestanas y lista de notificaciones recientes. |


**2.15  Resenas y calificaciones**
**2.15.1  Cuando puede dejar una resena el cliente?**
El cliente puede dejar una resena cuando cumple AMBAS condiciones:
- Tiene al menos una cita completada (status='completed') en el negocio.
- No ha dejado una resena previa para esa cita especifica.
El hook useCompletedAppointments verifica estas condiciones. Si no se cumplen, el boton 'Dejar resena' no se renderiza.
**2.15.2  MandatoryReviewModal**
En ciertos flujos (ej: al completarse un proceso de reclutamiento donde el cliente fue contratado), aparece un MandatoryReviewModal que obliga al usuario a dejar una resena antes de continuar. Este modal:
- No tiene boton de cierre (X) — es obligatorio.
- Contiene 5 estrellas clickeables (rating minimo 1 estrella).
- Campo de comentario con maximo 500 caracteres.
- Boton 'Enviar resena' que cierra el modal tras la operacion exitosa.
**2.15.3  ReviewForm (voluntario)**
Formulario de resena que aparece en el tab Resenas del BusinessProfile cuando el cliente tiene citas completadas sin review previa:
- 5 estrellas clickeables (obligatorio, minimo 1).
- Campo de comentario opcional (maximo 500 caracteres).
- Checkbox 'Enviar como anonimo' — oculta el nombre del cliente en la resena.
- Boton 'Publicar resena'.
**2.15.4  Tipos de resena**
Existen dos tipos de resena en la tabla reviews:
- review_type='business': calificacion general del negocio.
- review_type='employee': calificacion de un empleado especifico.
Un cliente puede dejar una resena de negocio Y una de empleado por cada cita completada.
**2.15.5  Vistas materializadas de ratings**
Las resenas alimentan las vistas materializadas business_ratings_stats y employee_ratings_stats, que se refrescan cada 5 minutos via la edge function refresh-ratings-stats. Esto asegura que los ratings mostrados en busqueda y perfiles sean consistentes y performantes.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: ReviewForm con estrellas clickeables y ReviewList con distribucion de ratings. |


**2.16  Perfil personal y configuracion**
**2.16.1  MyProfilePage**
Pagina de perfil personal del cliente (accesible desde el avatar dropdown > Mi Perfil). Incluye:
- Foto de perfil (editable, sube a bucket avatars).
- Nombre completo (editable).
- Correo electronico (no editable — es el identificador de la cuenta).
- Telefono con prefijo internacional (editable, puede requerir verificacion).
- Tipo y numero de documento (cedula, pasaporte, etc.).
- Genero (opcional).
- Fecha de nacimiento (opcional).
**2.16.2  CompleteUnifiedSettings (modo cliente)**
Las configuraciones del cliente se acceden desde el avatar dropdown > Configuracion. El componente CompleteUnifiedSettings detecta el rol activo y muestra 4 pestanas:

| Pestana | Contenido |
| --- | --- |
| Ajustes Generales | Idioma (ES/EN), tema (claro/oscuro/automatico), zona horaria. |
| Perfil | Mismos campos que MyProfilePage (nombre, telefono, documento, foto). |
| Notificaciones | Toggle por tipo y canal: email, in-app, WhatsApp, SMS. Recordatorios 24h/2h/15m. |
| Preferencias de Cliente | Anticipacion minima para reservar, metodo de pago preferido, visibilidad del historial, ciudad preferida. |


**2.16.3  Acciones de cuenta**
- Cambiar contrasena: solicita contrasena actual y nueva contrasena (minimo 8 caracteres).
- Cerrar sesion global: cierra la sesion en todos los dispositivos.
- Eliminar cuenta: requiere confirmacion doble (escribir 'ELIMINAR' + confirmar en modal). Marca is_active=false en profiles; los datos se retienen para cumplimiento legal pero el acceso queda bloqueado.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: CompleteUnifiedSettings en modo cliente con pestana de Notificaciones. |


**2.17  Verificacion de telefono**
En ciertos contextos, Gestabiz requiere que el cliente tenga un numero de telefono verificado. Cuando se detecta que el telefono no esta verificado:
**2.17.1  PhoneRequiredModal**
Modal bloqueante (sin boton de cierre X) que obliga al cliente a ingresar y verificar su telefono antes de continuar:
- El modal muestra un campo de telefono con selector de prefijo internacional.
- Al ingresar el numero, se envia un codigo de verificacion por SMS.
- El cliente ingresa el codigo de 6 digitos.
- Si es correcto: el telefono se guarda como verificado y el modal se cierra.
- Si es incorrecto: mensaje 'Codigo incorrecto, intenta de nuevo'.
- Si el codigo expira: boton 'Reenviar codigo'.
**2.17.2  Cuando se activa**
- Si el negocio requiere telefono verificado para reservar (configuracion del negocio).
- Si el usuario intenta chatear por WhatsApp sin telefono.
- Si el admin del negocio marca telefono como obligatorio para ciertos servicios.

| Impacto en el flujo El PhoneRequiredModal bloquea completamente el dashboard del cliente hasta que se complete la verificacion. No se puede cerrar ni navegar a otra pantalla hasta verificar el telefono. |
| --- |


**2.18  Cambio de ciudad preferida**
El CitySelector en el header permite al cliente cambiar su ciudad preferida. Este cambio afecta:
- Widget 'Descubre negocios en tu ciudad' en el ClientDashboard: se refiltra con la nueva ciudad.
- Resultados de busqueda: los negocios de la ciudad seleccionada aparecen primero en el algoritmo de proximidad.
- Persistencia: la seleccion se guarda en localStorage via usePreferredCity y sobrevive al recargar la pagina.
**2.18.1  Auto-deteccion de ciudad**
Al primer acceso, useGeolocation solicita permiso de geolocalizacion al navegador. Si el usuario acepta, detecta su ciudad automaticamente. Si rechaza, el selector muestra 'Todas las ciudades' y los resultados no se filtran por ubicacion.

**2.19  Landing Page publica**
La ruta / (raiz) muestra la Landing Page publica de Gestabiz, accesible sin autenticacion. Es la puerta de entrada principal para nuevos usuarios.
**2.19.1  Secciones de la Landing**

| Seccion | Contenido |
| --- | --- |
| Hero | Titulo principal con propuesta de valor, subtitulo, botones 'Empezar gratis' y 'Ver planes'. Imagen/ilustracion de la app. |
| Beneficios | Grid 3x2 con los 6 beneficios principales: agenda 24/7, recordatorios, perfil SEO, contabilidad, multi-sede, multi-canal. |
| Como funciona | 3 pasos ilustrados: Crea tu negocio, Publica servicios, Recibe reservas. |
| Testimonios | Carousel de testimonios de usuarios reales con nombre, negocio, foto y cita textual. |
| Planes | 3 columnas con los planes (Gratuito, Basico, Pro), precios, features y botones de accion. |
| CTA final | Banner con 'Empieza gratis hoy' y boton de registro. |
| Footer | Links legales (Terminos, Privacidad, Contacto), redes sociales, logo Ti Turing. |


**2.19.2  Navegacion**
Header fijo con logo, links de navegacion (Inicio, Funcionalidades, Precios, Contacto), selector de idioma (ES/EN), toggle de tema claro/oscuro, y botones 'Iniciar sesion' (-> /login) y 'Empezar gratis' (-> /register).
Si el usuario ya tiene sesion activa, el header reemplaza los botones de login por 'Ir a mi panel' que navega directamente a /app.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Landing Page hero section con propuesta de valor y botones de accion. |


**2.20  Cookie Consent y privacidad**
Gestabiz cumple con GDPR (General Data Protection Regulation) mediante un banner de consentimiento de cookies que aparece en la primera visita del usuario.
**2.20.1  Componente CookieConsent**
- Banner fijo en la parte inferior de la pantalla.
- Texto: 'Usamos cookies para mejorar tu experiencia. Puedes aceptar o rechazar las cookies de seguimiento.'
- Dos botones: 'Aceptar' (activa GA4 con consent mode) y 'Rechazar' (GA4 NO se activa).
- La decision se persiste en localStorage y no vuelve a mostrarse el banner.
**2.20.2  Google Analytics 4**
GA4 solo se activa si el usuario acepta cookies. Cuando esta activo, Gestabiz trackea los siguientes eventos del cliente:
- page_view: cada cambio de pagina.
- profile_view: al visitar un perfil publico de negocio.
- click_reserve_button: al pulsar 'Reservar' en cualquier contexto.
- click_contact: al pulsar 'Chatear' o un link de contacto.
- booking_started: al iniciar el wizard de reserva.
- booking_step_completed: por cada paso completado del wizard.
- booking_abandoned: si el usuario sale del wizard sin completar.
- purchase: al confirmar la cita (revenue = precio del servicio).
- login: al iniciar sesion (con metodo: email, google, github, magic_link).
- sign_up: al registrarse exitosamente.

**2.21  Componentes Card usados en el rol cliente**
El rol Cliente interactua con los siguientes componentes Card, todos ubicados en src/components/cards/ y siguiendo el patron self-fetch (reciben solo el ID y consultan datos internamente):

| Card | Donde aparece | Datos que muestra | Acciones |
| --- | --- | --- | --- |
| AppointmentCard | Vista Citas, Historial | Servicio, fecha, hora, profesional, sede, precio, status badge | Click abre dialogo de detalle |
| BusinessCard | Favoritos, Busqueda, Dashboard discover | Logo, nombre, categoria, rating, ciudad | Click abre BusinessProfile, corazon toggle, boton Reservar |
| ServiceCard | BusinessProfile > Tab Servicios, Wizard paso 3 | Nombre, precio, duracion, imagen, descripcion | Click selecciona en wizard, boton Reservar en perfil |
| LocationCard | BusinessProfile > Tab Ubicaciones, Wizard paso 4 | Nombre, direccion, mapa, horario semanal | Click selecciona en wizard, 'Como llegar' en perfil |
| EmployeeCard | Wizard paso 5, BusinessProfile | Foto, nombre, especialidad, rating, servicios | Click selecciona en wizard |
| SearchResultCard | SearchResults panel | Tipo (negocio/servicio/profesional), nombre, rating, preview | Click abre perfil o navega a detalle |


**Patron self-fetch**
Cada card recibe unicamente el ID de la entidad (ej: serviceId) y se encarga de consultar sus datos via useQuery de React Query. Esto permite cache inteligente (staleTime: 5 minutos) y evita re-fetch innecesarios. Si el componente padre ya tiene los datos, puede pasar un prop initialData para hidratar el cache sin hacer request adicional.

**2.22  Estados de carga y error**
Cada componente del cliente maneja sus estados de carga y error de forma consistente:

| Componente | Loading state | Error state |
| --- | --- | --- |
| ClientDashboard | Skeleton placeholders para cada widget | Banner 'Error al cargar datos' con boton Reintentar |
| AppointmentCard | Card skeleton con lineas pulsantes | Card minimo con texto 'Error al cargar cita' |
| BusinessCard | Card skeleton con avatar circular pulsante | Card con icono de error y retry |
| ServiceCard | Card skeleton con imagen placeholder | null (no renderiza) |
| SearchResults | Spinner centrado | Mensaje 'No se encontraron resultados' |
| NotificationCenter | Skeleton list items | Mensaje 'Error al cargar notificaciones' |
| ChatWindow | Spinner + 'Cargando mensajes...' | Banner 'Error de conexion' con retry |
| DateTimeSelection | Spinner sobre el calendario | Toast 'Error al verificar disponibilidad' |
| ConfirmationStep | Boton 'Confirmar' con spinner (ButtonSpinner) | Toast 'Error al crear cita' con detalles |
| ReviewForm | Boton 'Publicar' con spinner | Toast 'Error al enviar resena' |


**2.23  Modales y dialogos completos**
El rol cliente interactua con los siguientes 14 modales y dialogos a lo largo de toda su experiencia:

| Modal/Dialogo | Trigger | Puede cerrarse? | Proposito |
| --- | --- | --- | --- |
| AppointmentWizard | Boton 'Nueva Cita' o 'Reservar' | Si (X o Escape) | Asistente de reserva multi-paso |
| Dialogo detalle de cita | Click en AppointmentCard | Si | Ver y actuar sobre una cita |
| BusinessProfile | Click en BusinessCard o SearchResult | Si | Ver perfil completo del negocio |
| ChatWithAdminModal | Boton 'Chatear' en perfil | Si | Elegir empleado para chatear |
| SearchResults | Escribir en SearchBar | Si (click fuera) | Resultados de busqueda |
| MandatoryReviewModal | Post-reclutamiento | NO (obligatorio) | Resena obligatoria |
| PhoneRequiredModal | Telefono no verificado | NO (bloqueante) | Verificacion de telefono |
| NotificationCenter | Click en campanita | Si (click fuera) | Listado de notificaciones |
| SimpleChatLayout | FloatingChatButton | Si | Panel de conversaciones |
| ImageLightbox | Click en imagen adjunta | Si (click fuera o X) | Ver imagen en tamano completo |
| LocationProfileModal | Click en LocationCard | Si | Detalle de sede con mapa |
| ServiceProfileModal | Click en ServiceCard | Si | Detalle de servicio completo |
| UserProfile | Click en EmployeeCard | Si | Perfil del profesional |
| CookieConsent | Primera visita | Si (Aceptar o Rechazar) | Banner GDPR |


**2.24  Glosario**

| Termino | Significado |
| --- | --- |
| Slug | Identificador unico de URL del negocio (ej: 'salon-belleza-medellin'). |
| Wizard | Asistente paso a paso con validacion en cada paso. |
| Overlap | Solape horario entre dos citas del mismo profesional/recurso. |
| Deep-link | URL que lleva directamente a un punto especifico de la app con parametros. |
| Optimistic update | Actualizacion de UI inmediata sin esperar respuesta del servidor. |
| Debounce | Tecnica que retrasa la ejecucion de una funcion hasta que pase un tiempo sin actividad. |
| Self-fetch | Patron donde un componente consulta sus propios datos a partir de un ID. |
| Toast | Notificacion temporal que aparece brevemente en la pantalla. |
| Skeleton | Placeholder pulsante que indica que los datos estan cargando. |
| Badge | Etiqueta visual de color que indica un estado (ej: Confirmada, Pendiente). |
| Token | Cadena unica y temporal usada para confirmar o cancelar citas por email. |
| RPC | Remote Procedure Call: funcion ejecutada en el servidor de base de datos. |
| Realtime | Conexion persistente con el servidor que notifica cambios al instante. |
| Cache | Almacenamiento temporal de datos para evitar consultas repetitivas. |


**Nota sobre este documento**
Este es el Volumen 1 de 5 del Manual de Usuario de Gestabiz, cubriendo exclusivamente la experiencia del rol Cliente. Los volumenes siguientes cubriran:
- Parte 2: Experiencia del Empleado.
- Parte 3: Experiencia del Administrador — Plan Gratuito.
- Parte 4: Experiencia del Administrador — Plan Basico.
- Parte 5: Experiencia del Administrador — Plan Pro.
*Version del producto: 1.0.3  |  Abril 2026  |  Fase Beta completada*

**GESTABIZ**
**Manual de Usuario**
*Guia funcional exhaustiva de la plataforma*
**Parte 2 de 5: Experiencia del Empleado**
Version del producto: 1.0.3   |   Abril 2026
*Fase Beta completada   |   Listo para produccion*

Desarrollado por **Ti Turing**
*https://github.com/TI-Turing   |   contacto@gestabiz.com*

**Indice — Parte 2: Rol Empleado**
Este documento cubre de manera exhaustiva la experiencia del rol Empleado en Gestabiz. Cada entrada es un hipervinculo a la seccion correspondiente. Este es el segundo de cinco volumenes que componen el Manual completo.
Parte 1 — Resumen Ejecutivo del Rol Empleado
1. Acceso y Primer Inicio de Sesion
2. Verificacion de Telefono Obligatoria
3. Dashboard del Empleado: Vision General
4. Barra Lateral y Navegacion
5. Selector de Negocio
6. Mis Empleos — Lista de Negocios
7. Tarjeta de Empleo y Detalle
8. Unirse a un Negocio
9. Onboarding con Codigo de Invitacion
10. Mis Citas — Vista Lista
11. Mis Citas — Vista Calendario
12. Detalle de una Cita
13. Mis Clientes
14. Ausencias y Vacaciones
15. Solicitar una Ausencia
16. Solicitud Rapida de Ausencia desde Tarjeta de Empleo
17. Widget de Balance de Vacaciones
18. Historial de Ausencias (Tabs)
19. Festivos Publicos y Validacion
20. Configuracion de Horario de Trabajo
21. Gestion de Servicios Ofrecidos
22. Sedes y Selector de Ubicacion
23. Traslado de Sede
24. Marketplace de Vacantes
25. Aplicar a una Vacante
26. Mis Aplicaciones
27. Deteccion de Conflictos de Horario
28. Chat en Tiempo Real
29. Notificaciones
30. Configuraciones del Empleado
31. Perfil Profesional Publico
32. Certificaciones, Idiomas y Especializaciones
33. Preferencias de Mensajes de Clientes
34. Finalizar Empleo
35. Permisos del Empleado
36. Modales y Dialogos del Empleado
37. Estados de Carga, Error y Vacio
38. Limitaciones por Plan
39. Glosario de Terminos del Empleado

**Parte 1 — Resumen Ejecutivo del Rol Empleado**
El rol Empleado en Gestabiz esta disenado para profesionales de servicios — peluqueros, esteticistas, medicos, terapeutas, entrenadores y cualquier persona que ofrece servicios personales a traves de un negocio. Este rol proporciona un espacio de trabajo completo donde el empleado puede gestionar su agenda, sus clientes, sus ausencias y su perfil profesional de forma autonoma, sin depender constantemente del administrador.
**Que puede hacer un Empleado en Gestabiz?**
- Agenda — Ver y gestionar sus citas asignadas en vista lista o calendario.
- Mis Clientes — Consultar y gestionar la lista de clientes que ha atendido.
- Ausencias — Solicitar vacaciones, licencias de enfermedad, emergencias y ausencias personales con aprobacion obligatoria.
- Horario — Configurar su horario semanal de trabajo y hora de almuerzo.
- Servicios — Seleccionar que servicios del negocio ofrece, con nivel de experiencia y comision.
- Vacantes — Explorar vacantes laborales de otros negocios y aplicar con CV y carta de presentacion.
- Chat — Chatear en tiempo real con clientes y colegas.
- Notificaciones — Recibir notificaciones in-app y por email sobre citas, ausencias y solicitudes.
- Perfil Profesional — Mantener un perfil profesional publico con certificaciones, idiomas y especializaciones.
- Multi-negocio — Trabajar en multiples negocios simultaneamente con selector de negocio.
- Traslado de Sede — Solicitar traslado de sede dentro del mismo negocio con gestion de citas afectadas.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Dashboard del Empleado — Vista general |


**Pantallas y Secciones del Empleado**

| Seccion | Descripcion | Acceso |
| --- | --- | --- |
| Mis Empleos | Lista de negocios donde trabaja con tarjetas enriquecidas | Sidebar: Mis Empleos |
| Buscar Vacantes | Marketplace de vacantes con filtros avanzados | Sidebar: Buscar Vacantes |
| Mis Ausencias | Balance de vacaciones, historial y formulario de solicitud | Sidebar: Mis Ausencias |
| Mis Citas | Lista y calendario de citas asignadas con filtros | Sidebar: Mis Citas |
| Horario | Editor visual de horario semanal + almuerzo | Sidebar: Horario |
| Mis Clientes | Clientes atendidos con historial y perfil | Sidebar: Mis Clientes |
| Unirse a Negocio | Busqueda y solicitud de vinculacion | Boton en Mis Empleos |
| Onboarding | Ingreso con codigo de invitacion o QR | Boton en Mis Empleos |
| Configuraciones | Perfil profesional, mensajes, horario, certificaciones | Menu de usuario |
| Chat | Conversaciones en tiempo real | Boton flotante / Notificaciones |


**Flujos principales del Empleado**

| Flujo | Pasos | Resultado |
| --- | --- | --- |
| Unirse a negocio | Buscar negocio o ingresar codigo -> Enviar solicitud -> Admin aprueba | Vinculado como empleado |
| Ver citas del dia | Abrir Mis Citas -> Filtrar por hoy -> Ver lista o calendario | Agenda actualizada |
| Solicitar ausencia | Abrir Mis Ausencias -> Llenar formulario -> Enviar -> Admin aprueba | Ausencia registrada, citas afectadas canceladas |
| Aplicar a vacante | Buscar Vacantes -> Ver detalle -> Llenar formulario -> Enviar | Aplicacion registrada |
| Configurar horario | Abrir Horario -> Activar/desactivar dias -> Guardar | Horario actualizado |
| Seleccionar servicios | Abrir Servicios -> Marcar servicios -> Nivel + comision -> Guardar | Servicios actualizados |
| Solicitar traslado | Abrir Sedes -> Elegir sede -> Preaviso -> Confirmar | Traslado programado |
| Finalizar empleo | Tarjeta de empleo -> Finalizar -> Confirmar | Empleo desactivado |


| Disponible en todos los planes Las funcionalidades del rol Empleado estan disponibles en los planes Gratuito, Basico y Pro. No existen limitaciones por plan para el empleado individual; las restricciones de cantidad de empleados aplican al administrador del negocio. |
| --- |


**Parte 2 — Detalle Exhaustivo**
A continuacion se documenta cada seccion, boton, validacion, flujo normal y flujo alterno de la experiencia del Empleado en Gestabiz.
**1. Acceso y Primer Inicio de Sesion**
Para acceder como empleado, el usuario debe tener al menos un registro activo en la tabla business_employees. Este registro se crea cuando un administrador acepta la solicitud de vinculacion del empleado o cuando el empleado reclama un codigo de invitacion. Si el usuario no tiene ningun registro de empleado, el rol Empleado no aparecera en el selector de roles.
**Flujo de primer acceso**
- El usuario se registra en Gestabiz (email + contrasena o Google/GitHub).
- Navega al Dashboard y ve el selector de roles. Si aun no esta vinculado a ningun negocio, solo vera los roles Cliente y Admin.
- Hace clic en el rol Empleado (si esta disponible) o navega a Mis Empleos y hace clic en Unirse a un nuevo negocio.
- Completa el flujo de vinculacion (ver seccion 8).
- Al ser aprobado, el rol Empleado se activa y aparece en el selector.

| Importante: Roles dinamicos Los roles en Gestabiz se calculan en tiempo real. No se almacenan en la base de datos. Si un empleado es desvinculado (is_active = false), el rol Empleado desaparece automaticamente del selector de roles. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Selector de roles mostrando Empleado activo |


**2. Verificacion de Telefono Obligatoria**
Al ingresar al Dashboard del Empleado, el sistema verifica si el usuario tiene un numero de telefono registrado en su perfil. Si no lo tiene, se muestra un modal bloqueante (PhoneRequiredModal) que impide el acceso hasta verificar el telefono via SMS OTP.
**Flujo de verificacion**
- Se muestra el modal con titulo 'Telefono requerido' y descripcion explicativa.
- El usuario ingresa su numero de telefono con prefijo internacional.
- El sistema envia un codigo OTP via SMS.
- El usuario ingresa el codigo de 6 digitos.
- Si el codigo es correcto, el telefono se guarda en el perfil y la pagina se recarga.
**Flujos alternos**
- Si el codigo OTP es incorrecto, se muestra un error y el usuario puede reintentar.
- Si el SMS no llega, el usuario puede solicitar un reenvio despues de 60 segundos.
- El modal NO se puede cerrar sin verificar (es bloqueante).

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Modal de verificacion de telefono |


**3. Dashboard del Empleado: Vision General**
El EmployeeDashboard es el componente principal del rol Empleado. Es un layout con barra lateral izquierda y area de contenido principal. El contenido cambia segun la seccion seleccionada en la barra lateral.
**Componentes del Dashboard**
- Header — Header con nombre del empleado, boton de notificaciones (NotificationBell), menu de usuario.
- Sidebar — Barra lateral con 6 items de navegacion + icono, ademas de links programaticos a Unirse, Onboarding, Perfil y Configuraciones.
- Business Selector — Selector de negocio en la parte superior (visible si el empleado trabaja en multiples negocios).
- Content Area — Area de contenido principal que renderiza el componente correspondiente a la seccion activa.
- Chat — Boton flotante de chat (FloatingChatButton) en la esquina inferior derecha.
La URL sigue el patron /app/employee/{seccion}. Si el usuario navega a /app sin seccion, se redirige automaticamente a /app/employee/employments (Mis Empleos).

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Dashboard del Empleado completo |


**4. Barra Lateral y Navegacion**

| Icono | Etiqueta | ID de ruta | Descripcion |
| --- | --- | --- | --- |
| Briefcase | Mis Empleos | employments | Lista de negocios donde trabaja |
| Search | Buscar Vacantes | vacancies | Marketplace de oportunidades laborales |
| CalendarOff | Mis Ausencias | absences | Balance de vacaciones, solicitudes e historial |
| Calendar | Mis Citas | appointments | Lista y calendario de citas asignadas |
| Clock | Horario | schedule | Editor visual de horario semanal |
| Users | Mis Clientes | my-clients | Clientes atendidos por el empleado |


Ademas de estos 6 items del sidebar, existen paginas accesibles programaticamente: Unirse a Negocio (join-business), Onboarding (onboarding), Perfil (profile) y Configuraciones (settings).

| Navegacion responsiva En pantallas moviles, la barra lateral se colapsa en un menu hamburguesa. El contenido se muestra a pantalla completa con navegacion inferior simplificada. |
| --- |


**5. Selector de Negocio**
En la parte superior del dashboard hay un dropdown que muestra todos los negocios donde el empleado esta vinculado activamente. Al cambiar de negocio, todo el contexto del dashboard cambia: citas, ausencias, clientes, horario y servicios se filtran por el negocio seleccionado.
**Comportamiento**
- Si el empleado trabaja en un solo negocio, el selector se muestra pero con un unico item.
- La seleccion se persiste en localStorage con la clave gestabiz-employee-business-{userId}.
- Al cambiar de negocio, se establece un effectiveBusinessId que se usa como scope para todas las queries.
- Si el negocio guardado en localStorage ya no existe o el empleado fue desvinculado, se selecciona automaticamente el primer negocio disponible.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Selector de negocio con multiples negocios |


**6. Mis Empleos — Lista de Negocios**
La seccion Mis Empleos muestra todos los negocios donde el usuario esta registrado como empleado. Utiliza el componente MyEmploymentsEnhanced que ejecuta 4 queries paralelas por negocio para enriquecer la tarjeta.
**Informacion mostrada por negocio**
- Identidad — Logo y nombre del negocio.
- Rating — Rating promedio del negocio (estrellas).
- Rol — Rol del empleado en ese negocio (Propietario, Manager, Profesional, Recepcionista, etc.).
- Servicios — Cantidad de servicios que ofrece en ese negocio.
- Ubicacion — Sede asignada con nombre y direccion.
- Salario — Salario base si esta configurado.
**Estadisticas resumen**
- Total de negocios activos.
- Cantidad como Propietario.
- Cantidad como Empleado.
**Acciones disponibles**
- Click en tarjeta: abre EmploymentDetailModal con 6 tabs de informacion detallada.
- Menu contextual (tres puntos): 5 opciones de solicitar ausencia (vacaciones, enfermedad, personal, emergencia, otros) + Marcar como Finalizado.
- Boton 'Unirse a un nuevo negocio': navega al flujo de vinculacion.

| Nota sobre Propietarios Si el usuario es el owner (dueno) de un negocio, aparece como Propietario en la tarjeta. La opcion 'Marcar como Finalizado' esta deshabilitada para propietarios — no puede autodesvincularse de su propio negocio. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Mis Empleos con multiples negocios |


**7. Tarjeta de Empleo y Detalle**
Al hacer clic en cualquier tarjeta de empleo se abre el EmploymentDetailModal, un dialogo completo con 6 pestanas que muestran toda la informacion del empleo del profesional en ese negocio.
**Pestanas del Detalle de Empleo**

| Pestana | Contenido |
| --- | --- |
| Info | Datos generales: nombre del negocio, rol asignado, tipo de empleado, fecha de contratacion, estado activo, negocio activo o inactivo. |
| Sedes | Sedes del negocio con horarios de apertura/cierre por dia, direccion, telefono, email, hasta 6 fotos por sede. |
| Servicios | Lista de servicios que el empleado ofrece en ese negocio con nombre, precio, duracion, nivel de experiencia (estrellas). |
| Horario | Horario semanal del empleado en ese negocio: 7 dias con hora de inicio y fin, indicador de dia activo/inactivo. |
| Salario | Salario base mensual con desglose de beneficios colombianos: Seguridad Social (10%), Salud (5%), Pension (5%), Total neto = salario x 1.20. Formato COP colombiano. |
| Stats | Metricas de rendimiento: ocupacion, rating promedio, ingresos generados, citas completadas. |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: EmploymentDetailModal — Pestana Info |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: EmploymentDetailModal — Pestana Salario con desglose |


**8. Unirse a un Negocio**
El componente JoinBusiness permite al empleado vincularse a un nuevo negocio. Tiene dos mecanismos de vinculacion en pestanas separadas.
**Pestana 1: Buscar Negocio**
- El empleado escribe el nombre del negocio en el campo de busqueda.
- El sistema busca con ILIKE (case-insensitive) en negocios activos, limitado a 12 resultados.
- Se muestran tarjetas con nombre, logo y categoria del negocio.
- El empleado hace clic en 'Solicitar Acceso' en la tarjeta deseada.
- Se crea un registro en employee_join_requests con status 'pending'.
- El administrador del negocio recibe una notificacion y puede aprobar o rechazar.
**Pestana 2: Codigo de Invitacion**
- El empleado ingresa un codigo alfanumerico de 6 caracteres proporcionado por el administrador.
- El sistema valida el codigo via RPC claim_invite_code (SECURITY DEFINER).
- Si el codigo es valido y no ha expirado (24 horas), se vincula al empleado automaticamente.
- Se notifica al propietario del negocio via Edge Function send-notification.
**Solicitudes existentes**
En la parte superior de JoinBusiness se muestra una seccion con las solicitudes existentes del empleado, indicando el estado de cada una: pendiente (amarillo), aprobada (verde) o rechazada (rojo).
**Validaciones**
- No se puede enviar una solicitud duplicada si ya existe una pendiente para el mismo negocio.
- El codigo de invitacion expira despues de 24 horas.
- Si el empleado ya esta vinculado al negocio, no puede solicitar nuevamente.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: JoinBusiness — Busqueda de negocios |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: JoinBusiness — Codigo de invitacion |


**9. Onboarding con Codigo de Invitacion**
El EmployeeOnboarding es un flujo simplificado que permite al empleado unirse directamente ingresando un codigo o escaneando un QR.
**Flujo**
- Se muestra un campo de texto para ingresar el codigo de 6 caracteres.
- Alternativa: boton para escanear QR que abre la camara del dispositivo.
- Al enviar, se llama al RPC claim_invite_code.
- Si es exitoso, se notifica al propietario y se redirige al dashboard.
**Diferencia con JoinBusiness**
EmployeeOnboarding es mas simple y directo — solo maneja codigos, no tiene busqueda de negocios. Se usa tipicamente cuando el administrador comparte un enlace o QR con el codigo pre-cargado.
**10. Mis Citas — Vista Lista**
La pagina de citas del empleado muestra todas las citas asignadas a el en el negocio seleccionado. Ofrece dos vistas: lista y calendario, con un toggle para alternar entre ellas.
**Estadisticas superiores**

| Metrica | Descripcion |
| --- | --- |
| Citas Hoy | Cantidad de citas para el dia actual |
| Programadas | Citas con status 'scheduled' pendientes |
| Confirmadas | Citas con status 'confirmed' |
| Completadas | Citas con status 'completed' (historicas) |


**Filtros disponibles**
- Busqueda — Busqueda por nombre del cliente (filtrado local).
- Estado — Filtro por estado: Todos, Programada, Confirmada, Completada, Cancelada, No asistio.
- Servicio — Filtro por servicio (dropdown con servicios del negocio).
**Agrupacion**
Las citas se agrupan por fecha. Cada grupo muestra una etiqueta: 'Hoy', 'Manana', o la fecha en formato largo en espanol (ej: 'Lunes 21 Abril 2026'). Dentro de cada grupo, las citas se ordenan por hora de inicio ascendente. La zona horaria es America/Bogota.
**Componente de cada cita**
Cada cita se renderiza como un AppointmentCard (componente reutilizable de src/components/cards/) con initialData del padre. Muestra: hora, nombre del cliente, servicio, estado (badge de color), sede. Al hacer clic, se abre un dialogo con el detalle completo.
**Tiempo real**
Las citas se actualizan en tiempo real via suscripcion a Supabase Realtime (postgres_changes en tabla appointments, filtrando por employee_id). Cualquier INSERT, UPDATE o DELETE dispara un refetch automatico sin necesidad de recargar la pagina.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Mis Citas — Vista lista con filtros |


**11. Mis Citas — Vista Calendario**
La vista calendario del empleado permite visualizar las citas de forma grafica con 3 modos de vista.
**Modos de vista**

| Vista | Descripcion |
| --- | --- |
| Dia | Bloques horarios de una sola jornada. Cada cita ocupa su slot de tiempo. |
| Semana | Grilla de 7 columnas (Lunes-Domingo). Cada celda muestra las citas del dia. |
| Mes | Calendario mensual clasico. Cada dia muestra el numero de citas. |


**Codificacion por colores**

| Color | Estado |
| --- | --- |
| Amarillo | Programada / Reprogramada |
| Verde | Confirmada |
| Azul | Completada |
| Rojo | Cancelada |
| Morado | En progreso |


**Navegacion**
- Botones Anterior / Siguiente para navegar entre periodos.
- Boton 'Hoy' para volver rapidamente al periodo actual.
- El dia actual tiene un resaltado visual (ring-2).
- Selector de vista: Dia / Semana / Mes.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Vista calendario — Modo semana |


**12. Detalle de una Cita**
Al hacer clic en una cita (en lista o calendario), se abre EmployeeAppointmentModal, un dialogo de solo lectura que muestra toda la informacion de la cita.
**Informacion mostrada**
- Badge de estado con color correspondiente (scheduled, confirmed, completed, cancelled, no_show, rescheduled, in_progress).
- Nombre completo del cliente.
- Servicio reservado.
- Fecha y hora en zona horaria Colombia (America/Bogota).
- Ubicacion (sede) donde se realizara la cita.
- Notas adicionales del cliente (si las hay).
**Limitaciones**
El modal de cita del empleado es de solo lectura. El empleado NO puede modificar, cancelar ni reprogramar citas desde este modal. Esas acciones son exclusivas del administrador o del cliente.

| Solo lectura para empleados A diferencia del cliente (que puede cancelar o reprogramar) y del administrador (que tiene control total), el empleado solo puede visualizar los detalles de sus citas. Esta restriccion es una decision de diseno para evitar conflictos de agenda. |
| --- |


**13. Mis Clientes**
La pagina Mis Clientes muestra todos los clientes que el empleado ha atendido en el negocio seleccionado. Se construye mediante un two-step query: primero se consultan las citas del empleado, luego se extraen los IDs unicos de clientes y se consultan sus perfiles.
**Datos por cliente**
- Avatar con iniciales del nombre (color generado a partir del nombre).
- Nombre completo y email.
- Total de visitas (todas las citas).
- Visitas completadas (solo citas con status 'completed').
- Fecha de ultima visita.
**Busqueda**
Campo de busqueda que filtra localmente por nombre o email del cliente.
**Ordenamiento**
Los clientes se ordenan por cantidad de visitas completadas, mostrando primero los clientes mas frecuentes.
**Accion: Ver Perfil del Cliente**
Al hacer clic en una tarjeta de cliente se abre ClientProfileModal (componente compartido con el administrador). El modal tiene 2 tabs: 'Informacion' (estadisticas, fecha de primera y ultima visita) e 'Historial' (lista de citas con servicio, fecha, estado y precio). Las citas mostradas se filtran al contexto del negocio y empleado seleccionado.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Mis Clientes — Grid de tarjetas |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: ClientProfileModal — Tab Historial |


**14. Ausencias y Vacaciones**
El sistema de ausencias permite al empleado solicitar tiempo libre que debe ser aprobado obligatoriamente por un administrador. No existe la opcion de auto-aprobacion; esta politica es una regla de negocio no negociable.
**Tipos de ausencia**

| Tipo | Etiqueta | Observacion |
| --- | --- | --- |
| vacation | Vacaciones | Descuenta del balance de vacaciones. 15 dias por ano. |
| sick_leave | Licencia por Enfermedad | Si excede 3 dias puede requerir certificado medico. |
| personal | Personal | Ausencia personal generica. |
| emergency | Emergencia | Requiere justificacion. Cancela citas automaticamente. |
| other | Otros | Cualquier otro tipo de ausencia no categorizada. |


| Aprobacion SIEMPRE obligatoria La configuracion require_absence_approval esta forzada a TRUE en todos los negocios, siempre. Ningun empleado puede tomar ausencias sin autorizacion previa de un administrador o manager. |
| --- |


**15. Solicitar una Ausencia**
El AbsenceRequestModal es el formulario principal para solicitar ausencias. Es un modal avanzado con calendarios visuales y multiples validaciones.
**Campos del formulario**
- Tipo — Tipo de ausencia (selector con 5 opciones).
- Desde — Fecha de inicio (calendario visual, no input de texto).
- Hasta — Fecha de fin (calendario visual, no input de texto).
- Razon — Razon (campo de texto libre, requerido).
- Notas — Notas adicionales (opcional).
**Validaciones en tiempo real**
- Dias laborales: se identifican automaticamente los dias de fin de semana en el rango seleccionado y se muestran con alerta roja.
- Festivos publicos: se cruza el rango con la tabla public_holidays (54 festivos colombianos 2025-2027) y se muestran con alerta naranja.
- Citas afectadas: se cuenta cuantas citas tiene el empleado en el rango seleccionado y se muestran con alerta amarilla.
- Balance de vacaciones: se verifica que el empleado tenga dias disponibles suficientes (solo para tipo 'vacation').
- Los calendarios muestran range highlighting: el dia de inicio y fin con marcador solido, los dias intermedios con marcador suave (20% opacidad).
**Flujo de envio**
- El empleado llena todos los campos requeridos.
- Hace clic en 'Enviar Solicitud'.
- Se crea un registro en employee_absences con status 'pending'.
- TODOS los administradores y managers del negocio reciben notificacion in-app y email.
- El administrador aprueba o rechaza desde su dashboard (ver Parte 3: Rol Admin).
- El empleado recibe notificacion del resultado.
**Flujo alterno: Ausencia de Emergencia**
Cuando una ausencia de tipo 'emergency' es aprobada, el sistema automaticamente cancela todas las citas del empleado en el rango de la ausencia via Edge Function cancel-appointments-on-emergency-absence. Los clientes afectados reciben notificacion de la cancelacion.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: AbsenceRequestModal con calendarios y alertas |


**16. Solicitud Rapida de Ausencia desde Tarjeta de Empleo**
Desde la tarjeta de empleo (BusinessEmploymentCard), el menu contextual permite solicitar una ausencia directamente sin navegar a la seccion de Ausencias. Al seleccionar un tipo de ausencia, se abre el TimeOffRequestModal.
**Campos del formulario rapido**
- Tipo de ausencia (preseleccionado segun la opcion elegida del menu).
- Fecha de inicio (CustomDateInput, minimo = hoy).
- Calculo automatico de dias.
- Notas (textarea).
**Alertas contextuales**
- Licencia por enfermedad > 3 dias: 'Se puede requerir un certificado medico para licencias superiores a 3 dias.'
- Emergencia: 'Las ausencias por emergencia requieren justificacion y pueden necesitar aprobacion inmediata.'
**Permiso requerido**
Este formulario esta protegido con PermissionGate usando el permiso employees.request_time_off. Si el empleado no tiene este permiso asignado, el boton no aparece.
**17. Widget de Balance de Vacaciones**
El VacationDaysWidget es un componente visual que muestra el estado actual del balance de vacaciones del empleado en el negocio seleccionado.
**Informacion mostrada**
- Dias Restantes — Numero grande con los dias restantes disponibles.
- Barra de Progreso — Barra de progreso tricolor: verde (dias usados), amarillo (dias pendientes de aprobacion), azul (dias restantes).
- Stats — Tres cajas de estadisticas: Total asignados, Usados, Pendientes.
**Calculo del balance**
El balance se obtiene de la tabla vacation_balance que tiene campos: year, total_days, used_days, pending_days, remaining_days. El calculo es: remaining = total - used - pending. Los defaults del negocio son 15 dias de vacaciones por ano.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: VacationDaysWidget con barra de progreso |


**18. Historial de Ausencias (Tabs)**
El componente EmployeeAbsencesTab organiza el historial de ausencias en 3 pestanas con contadores.
**Pestanas**

| Pestana | Contenido | Acciones |
| --- | --- | --- |
| Pendientes | Ausencias con status 'pending' esperando aprobacion | Boton 'Cancelar' (con dialogo de confirmacion) |
| Aprobadas | Ausencias con status 'approved' | Solo lectura |
| Rechazadas | Ausencias con status 'rejected' | Solo lectura, muestra notas del admin |


**Informacion por ausencia**
- Tipo de ausencia con badge de color (verde=vacaciones, rojo=emergencia, azul=enfermedad, gris=personal).
- Rango de fechas (inicio - fin).
- Cantidad de dias.
- Razon proporcionada por el empleado.
- Notas del administrador (solo en rechazadas o aprobadas con comentarios).
**Cancelar una solicitud pendiente**
El empleado puede cancelar una solicitud que aun esta en estado 'pending'. Al hacer clic en Cancelar, se muestra un AlertDialog de confirmacion. Si acepta, el status cambia a 'cancelled' en la tabla employee_absences.
**19. Festivos Publicos y Validacion**
El sistema mantiene una tabla public_holidays con 54 festivos colombianos precargados para los anos 2025 a 2027. Estos festivos se validan automaticamente en los formularios de ausencia y en la seleccion de citas.
**Tipos de festivos**
- 13 festivos fijos por ano: Ano Nuevo, Dia del Trabajo, Independencia, Navidad, etc.
- 5 festivos moviles por ano: basados en la fecha de Pascua (Carnaval, Semana Santa, Corpus Christi, etc.).
**Hook usePublicHolidays**
El hook consulta la tabla public_holidays filtrando por pais y ano actual. Los datos se cachean durante 24 horas (staleTime) y 7 dias (gcTime). Expone dos helpers: isHoliday(date) que retorna true/false, y getHolidayName(date) que retorna el nombre del festivo.
**20. Configuracion de Horario de Trabajo**
El WorkScheduleEditor permite al empleado configurar su horario semanal de trabajo y su hora de almuerzo. Cada dia de la semana tiene un control independiente.
**Elementos por dia**
- Switch de activacion: activo/inactivo (verde/gris).
- Input de hora inicio (ej: 09:00).
- Input de hora fin (ej: 18:00).
**Valores por defecto**

| Dia | Activo | Inicio | Fin |
| --- | --- | --- | --- |
| Lunes | Si | 09:00 | 18:00 |
| Martes | Si | 09:00 | 18:00 |
| Miercoles | Si | 09:00 | 18:00 |
| Jueves | Si | 09:00 | 18:00 |
| Viernes | Si | 09:00 | 18:00 |
| Sabado | No | 09:00 | 14:00 |
| Domingo | No | 09:00 | 14:00 |


**Seccion de almuerzo**
- Toggle global para activar/desactivar hora de almuerzo.
- Si esta activo: inputs de hora inicio y fin del almuerzo (default 12:00 - 13:00).
- La hora de almuerzo se aplica a todos los dias activos y se guarda en business_employees (campos lunch_break_start y lunch_break_end).
**Persistencia**
El horario semanal se guarda en la tabla work_schedules con upsert por employee_id + day_of_week. Los datos de almuerzo se guardan directamente en business_employees.
**Validaciones**
- La hora de inicio debe ser menor que la hora de fin para cada dia activo.
- La hora de inicio del almuerzo debe ser menor que la hora de fin.
- Permiso employees.edit_own_schedule requerido (pero se bypasea automaticamente si el empleado edita su propio horario).

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: WorkScheduleEditor — 7 dias + almuerzo |


**21. Gestion de Servicios Ofrecidos**
El ServiceSelector permite al empleado seleccionar cuales de los servicios del negocio ofrece, con nivel de experiencia y porcentaje de comision por cada servicio.
**Elementos por servicio**
- Checkbox: toggle para activar/desactivar el servicio.
- Nivel de experiencia: estrellas 1-5 (expertise_level).
- Porcentaje de comision: slider 0-100% (commission_percentage).
**Flujo de guardado**
- El empleado marca/desmarca servicios y ajusta niveles y comisiones.
- Hace clic en Guardar.
- El sistema calcula el diff entre el estado original y el actual: servicios a agregar, a eliminar y a actualizar.
- Se insertan nuevos registros en employee_services, se desactivan los eliminados (soft delete: is_active = false), y se actualizan los modificados.
**Requisitos**
Se requiere que el empleado tenga una sede asignada (currentLocationId) para guardar los servicios.
**Deteccion de cambios**
El boton Guardar solo se habilita si hay cambios (hasChanges se computa comparando el estado original con el estado actual). Si no hay cambios, el boton permanece deshabilitado.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: ServiceSelector — Servicios con estrellas y comision |


**22. Sedes y Selector de Ubicacion**
El LocationSelector muestra todas las sedes activas del negocio y permite al empleado seleccionar o cambiar su sede de trabajo.
**Informacion por sede**
- Nombre de la sede.
- Badge 'Tu Sede' si es la sede actual del empleado.
- Badge 'Primaria' si es la sede principal del negocio.
- Direccion completa.
- Contacto: email y telefono.
- Horarios de apertura y cierre por dia de la semana (7 dias, formato en espanol).
- Hasta 6 fotos de la sede.
**Acciones**
- Si el empleado NO tiene sede asignada: boton 'Seleccionar esta sede' que actualiza directamente business_employees.location_id.
- Si el empleado YA tiene sede: boton 'Programar traslado' que abre LocationTransferModal.
**Estado de traslado**
Si el empleado tiene un traslado pendiente, se muestra el TransferStatusBadge con: icono MapPin, texto 'Traslado programado', nombre de la sede destino y fecha efectiva del traslado.
**23. Traslado de Sede**
El LocationTransferModal permite programar un traslado de una sede a otra dentro del mismo negocio, con manejo de citas afectadas.
**Flujo completo**
- El empleado selecciona la sede destino.
- Configura el periodo de preaviso con un slider de 1 a 30 dias.
- El sistema calcula la fecha efectiva: hoy + dias de preaviso.
- Se ejecuta getTransferImpact que calcula: citas que se mantienen (antes de la fecha efectiva) vs citas que se cancelaran (despues).
- Si hay citas que se cancelaran, se muestra un warning con checkbox de confirmacion obligatorio.
- Al confirmar, se actualizan los campos transfer_* en business_employees.
- Se invoca la Edge Function cancel-future-appointments-on-transfer que cancela las citas afectadas y notifica a los clientes.
**Cancelar un traslado pendiente**
Si el empleado tiene un traslado con status 'pending', puede cancelarlo. La cancelacion limpia todos los campos transfer_* y cambia el status a 'cancelled'.
**Campos almacenados**

| Campo | Descripcion |
| --- | --- |
| transfer_from_location_id | ID de la sede de origen |
| transfer_to_location_id | ID de la sede destino |
| transfer_effective_date | Fecha en que se hace efectivo el traslado |
| transfer_notice_period_days | Dias de preaviso configurados (1-30) |
| transfer_scheduled_at | Fecha/hora en que se programo el traslado |
| transfer_scheduled_by | ID del usuario que programo el traslado |
| transfer_status | Estado: pending, completed, cancelled |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: LocationTransferModal — Slider de preaviso y citas afectadas |


**24. Marketplace de Vacantes**
El AvailableVacanciesMarketplace es la pagina donde los empleados exploran oportunidades laborales publicadas por otros negocios en la plataforma. Es un marketplace completo con filtros avanzados y sistema de matching.
**Barra de busqueda**
Campo de texto que filtra en tiempo real (client-side) por titulo del cargo, nombre de la empresa o descripcion de la vacante.
**Panel de filtros (colapsable)**

| Filtro | Tipo | Descripcion |
| --- | --- | --- |
| Pais | Fijo | Colombia (preseleccionado, no modificable) |
| Departamento | Select | RegionSelect — lista de departamentos colombianos |
| Ciudad | Select | CitySelect — cascada del departamento seleccionado |
| Tipo de Posicion | Select | 4 opciones: tiempo completo, medio tiempo, freelance, otro |
| Nivel de Experiencia | Select | 3 niveles: junior, intermedio, senior |
| Salario Minimo | Input | Valor en COP |
| Salario Maximo | Input | Valor en COP |
| Solo Remoto | Switch | Toggle para filtrar solo vacantes remotas |


**Ordenamiento**

| Criterio | Descripcion |
| --- | --- |
| match_score | Puntaje de matching con el perfil del empleado (default) |
| salary | Por salario (mayor a menor) |
| published_at | Por fecha de publicacion (mas recientes primero) |
| applications_count | Por cantidad de aplicaciones recibidas |


**Tarjeta de vacante (VacancyCard)**
Cada vacante se muestra como una tarjeta con: titulo del cargo, nombre del negocio, ubicacion, rango salarial (formato COP), tipo de posicion, nivel de experiencia, fecha de publicacion, numero de aplicaciones. Dos botones: 'Ver Detalles' (abre modal) y 'Aplicar' (abre formulario de aplicacion).
**Boton Mis Aplicaciones**
En la parte superior de la pagina hay un boton que abre MyApplicationsModal con el historial de todas las aplicaciones enviadas por el empleado.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Marketplace de Vacantes con filtros expandidos |


**25. Aplicar a una Vacante**
El ApplicationFormModal es el formulario para aplicar a una vacante seleccionada.
**Campos del formulario**
- Carta — Carta de presentacion (textarea, minimo 50 caracteres).
- Salario — Salario esperado (input numerico, en COP, opcional pero validado).
- Disponibilidad — Fecha de disponibilidad (CustomDateInput, minimo = hoy, requerido).
- CV — CV (archivo adjunto, se sube al bucket 'cvs' de Supabase Storage).
**Validaciones**
- La carta de presentacion debe tener al menos 50 caracteres.
- El salario esperado debe ser positivo.
- El salario esperado no puede exceder el maximo de la vacante (si esta definido).
- La fecha de disponibilidad es obligatoria y no puede ser en el pasado.
**Verificacion de conflictos de horario**
Al abrir el modal, si la vacante tiene un work_schedule definido, el sistema automaticamente verifica conflictos con los empleos actuales del empleado. Si se detectan solapamientos, se muestra ScheduleConflictAlert con los detalles del conflicto. Esto es informativo, no bloquea la aplicacion.
**Flujo de envio**
- El empleado completa todos los campos requeridos.
- Hace clic en Enviar.
- Se sube el CV al storage (si existe).
- Se crea un registro en job_applications con status 'pending'.
- El administrador del negocio recibe notificacion.
- La pagina se recarga para actualizar la lista de vacantes.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: ApplicationFormModal con alerta de conflicto de horario |


**26. Mis Aplicaciones**
El MyApplicationsModal muestra el historial de todas las aplicaciones enviadas por el empleado.
**Pestanas por estado**

| Estado | Etiqueta | Color | Icono |
| --- | --- | --- | --- |
| all | Todas | — | — |
| pending | Pendiente | Amarillo | Clock |
| reviewing | En revision | Azul | AlertCircle |
| in_selection_process | En Proceso de Seleccion | Morado | AlertCircle |
| accepted | Aceptada | Verde | CheckCircle |
| rejected | Rechazada | Rojo | XCircle |
| withdrawn | Retirada | Gris | XCircle |
| completed | Completada | Esmeralda | CheckCircle |


**Informacion por aplicacion**
- Titulo de la vacante y nombre del negocio.
- Estado con badge de color y icono.
- Fecha de aplicacion.
- Salario esperado (formato COP).
- Fecha de disponibilidad.
- Boton para descargar el CV adjunto (desde Supabase Storage).
**Contadores**
Cada pestana muestra un contador con la cantidad de aplicaciones en ese estado. La pestana 'Todas' muestra el total.
**27. Deteccion de Conflictos de Horario**
Cuando un empleado aplica a una vacante que tiene horario definido, el sistema verifica automaticamente si hay solapamientos con sus empleos actuales.
**Como funciona**
- Al abrir ApplicationFormModal, se obtiene el work_schedule de la vacante.
- Se convierte al formato WorkSchedule: objeto con dias como claves, cada uno con enabled, start_time, end_time.
- Se llama a checkConflict() del hook useScheduleConflicts.
- El hook compara el horario de la vacante con los horarios de los empleos actuales del empleado.
- Si hay solapamiento, retorna un array de ScheduleConflict con detalles: dia, rango en conflicto, nombre del negocio conflictivo.
**ScheduleConflictAlert**
Si existen conflictos, se renderiza ScheduleConflictAlert que muestra un Alert de tipo warning con la lista de conflictos. El empleado puede proceder con la aplicacion a pesar de los conflictos (es informativo, no bloqueante).

| Los conflictos no bloquean la aplicacion El sistema informa al empleado sobre posibles conflictos de horario, pero no impide que aplique. Es responsabilidad del empleado y del administrador resolver los conflictos si se concreta la contratacion. |
| --- |


**28. Chat en Tiempo Real**
El empleado tiene acceso al sistema de chat para comunicarse con clientes y colegas del negocio.
**Acceso al chat**
- Boton Flotante — Boton flotante de chat (FloatingChatButton) en la esquina inferior derecha del dashboard.
- Notificaciones — A traves de notificaciones de mensajes nuevos en NotificationBell.
**Componentes del chat**
- ConversationList — Lista de conversaciones con ultimo mensaje, hora, indicador de no leidos.
- ChatWindow — Ventana de mensajes con burbujas de texto, indicador de escritura, confirmacion de lectura.
- ChatInput — Campo de texto con soporte para adjuntos de archivos (bucket chat-attachments).
**Funcionalidades**
- Envio y recepcion de mensajes en tiempo real via Supabase Realtime.
- Adjuntos de archivos (imagenes, documentos).
- Indicadores de escritura (typing indicators).
- Confirmacion de lectura (read receipts).
- Notificaciones por email de mensajes no leidos (Edge Function send-unread-chat-emails).
**Preferencia de mensajes**
El empleado puede activar o desactivar la recepcion de mensajes de clientes desde Configuraciones -> Preferencias de Mensajes. Si esta desactivado, el empleado NO aparecera en la lista de empleados disponibles para chatear en el BusinessProfile del cliente.
**29. Notificaciones**
El empleado recibe notificaciones in-app y por email sobre eventos relevantes a su trabajo.
**Tipos de notificacion que recibe un empleado**

| Tipo | Descripcion | Accion al clic |
| --- | --- | --- |
| appointment_new | Nueva cita asignada | Navega a Mis Citas |
| appointment_confirmed | Cita confirmada por cliente | Navega a Mis Citas |
| appointment_cancelled | Cita cancelada | Navega a Mis Citas |
| appointment_rescheduled | Cita reprogramada | Navega a Mis Citas |
| appointment_reminder | Recordatorio de cita proxima | Navega a Mis Citas |
| absence_approved | Solicitud de ausencia aprobada | Navega a Mis Ausencias |
| absence_rejected | Solicitud de ausencia rechazada | Navega a Mis Ausencias |
| chat_message | Nuevo mensaje de chat | Abre la conversacion |
| employee_request_approved | Solicitud de vinculacion aprobada | Navega a Mis Empleos |
| employee_request_rejected | Solicitud de vinculacion rechazada | Navega a Mis Empleos |
| vacancy_application_accepted | Aplicacion a vacante aceptada | Navega a Mis Aplicaciones |
| vacancy_application_rejected | Aplicacion a vacante rechazada | Navega a Mis Aplicaciones |


**Campana de notificaciones**
En el header del dashboard se muestra NotificationBell con un contador de notificaciones no leidas. Al hacer clic se abre NotificationCenter con la lista completa de notificaciones, ordenadas por fecha descendente. Cada notificacion se puede marcar como leida individualmente o todas a la vez.
**Cambio automatico de rol**
Si el empleado recibe una notificacion que requiere otro rol (ej: una notificacion de cita como cliente), el sistema cambia automaticamente el rol activo antes de navegar. Esto se gestiona por notificationRoleMapping.ts que mapea 30+ tipos de notificacion al rol requerido.
**30. Configuraciones del Empleado**
Las configuraciones del empleado se acceden desde el menu de usuario en el header. Se muestran dentro de CompleteUnifiedSettings con la pestana 'Preferencias de Empleado' activa.
**Secciones de configuracion**

| Seccion | Descripcion |
| --- | --- |
| Perfil publico compartible | URL unica del perfil profesional con botones de copiar y abrir |
| Disponibilidad y horarios | Toggle de disponibilidad, notificaciones, recordatorios, horario visual 7 dias |
| Preferencias de mensajes | Toggle para recibir/rechazar mensajes de clientes (por negocio) |
| Informacion profesional | Resumen profesional (min 50 chars), anos de experiencia, tipo de trabajo |
| Expectativas salariales | Salario minimo y maximo esperado en COP |
| Especializaciones | Badges dinamicos con add/remove |
| Idiomas | Badges dinamicos con add/remove |
| Certificaciones | CRUD completo: nombre, emisor, fechas, credencial ID/URL |
| Enlaces externos | Portfolio, LinkedIn, GitHub |


**31. Perfil Profesional Publico**
El empleado tiene un perfil profesional publico accesible en /profesional/{userId}. Este perfil es visible para cualquier persona sin necesidad de autenticacion y puede ser compartido como enlace directo.
**Informacion del perfil**
- Nombre completo y avatar.
- Resumen profesional.
- Anos de experiencia.
- Especializaciones y habilidades.
- Certificaciones con detalle.
- Idiomas.
- Rating promedio y numero de resenas.
- Enlaces a portfolio, LinkedIn y GitHub.
**Compartir**
Desde Configuraciones, el empleado puede copiar la URL de su perfil publico o abrirla directamente en una nueva pestana para previsualizar como se ve.
**32. Certificaciones, Idiomas y Especializaciones**
**Certificaciones**
Sistema CRUD completo para certificaciones profesionales. Cada certificacion tiene: nombre de la certificacion, nombre del emisor, fecha de emision, fecha de expiracion (opcional), ID de credencial (opcional), URL de credencial (opcional).
**Idiomas y Especializaciones**
Sistema de badges dinamicos. El empleado puede agregar nuevos idiomas o especializaciones escribiendo el nombre y presionando Enter o haciendo clic en el boton de agregar. Para eliminar, hace clic en la X del badge. Los cambios se guardan al presionar el boton Guardar de la seccion correspondiente.
Estos datos se almacenan en la tabla employee_profiles como arrays JSONB.
**33. Preferencias de Mensajes de Clientes**
El empleado puede controlar si recibe mensajes de clientes a traves de un toggle en la seccion de Configuraciones. Esta preferencia es independiente por negocio — un empleado puede tener el toggle activo en un negocio y desactivo en otro.
**Comportamiento**
- Si allow_client_messages = true: el empleado aparece en la lista de empleados disponibles para chatear en el BusinessProfile.
- Si allow_client_messages = false: el empleado NO aparece en esa lista. Los clientes no pueden iniciar conversaciones con el.
- El valor por defecto es true (todos los empleados reciben mensajes a menos que lo desactiven).
El filtrado se hace a nivel de base de datos mediante el hook useBusinessEmployeesForChat, que consulta solo empleados con allow_client_messages = true.
**34. Finalizar Empleo**
El empleado puede finalizar su vinculacion con un negocio desde la tarjeta de empleo. Esta accion es irreversible sin la intervencion de un administrador.
**Flujo**
- Desde la tarjeta de empleo, el empleado hace clic en el menu contextual y selecciona 'Marcar como Finalizado'.
- Se abre ConfirmEndEmploymentDialog que muestra 4 consecuencias.
- El empleado debe activar un checkbox de confirmacion obligatorio.
- Al hacer clic en Confirmar: business_employees.is_active = false, termination_date = ahora.
- Se desactivan automaticamente todos los employee_services del empleado en ese negocio.
- La pagina se recarga.
**Consecuencias mostradas**
- No recibiras mas citas en este negocio.
- Tus servicios seran desactivados.
- Necesitas un administrador para reactivar tu vinculacion.
- Tu historial de citas y datos se conservan.
**Restriccion para propietarios**
La opcion 'Marcar como Finalizado' esta deshabilitada si el empleado es el propietario (owner) del negocio. Un propietario no puede autodesvincularse de su propio negocio.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: ConfirmEndEmploymentDialog con checkbox de confirmacion |


**35. Permisos del Empleado**
Los permisos del empleado son asignados por el administrador del negocio usando templates o asignacion individual. El empleado no puede modificar sus propios permisos.
**Permisos relevantes para el empleado**

| Permiso | Descripcion | Donde se usa |
| --- | --- | --- |
| employees.edit_own_schedule | Editar su propio horario de trabajo | WorkScheduleEditor |
| employees.edit_own_profile | Editar su perfil de empleado | CompleteUnifiedSettings |
| employees.request_time_off | Solicitar ausencias y vacaciones | TimeOffRequestModal |
| appointments.view | Ver sus citas asignadas | EmployeeAppointmentsPage |


El administrador puede asignar permisos adicionales al empleado, como ver reportes, gestionar servicios, etc. Los permisos se verifican via PermissionGate y el hook usePermissions.
**36. Modales y Dialogos del Empleado**

| Modal | Disparador | Proposito |
| --- | --- | --- |
| PhoneRequiredModal | Automatico al entrar al dashboard sin telefono | Verificar telefono via SMS OTP |
| EmploymentDetailModal | Click en tarjeta de empleo | 6 tabs con detalles completos del empleo |
| ConfirmEndEmploymentDialog | Menu > Marcar como Finalizado | Confirmar desvinculacion del negocio |
| TimeOffRequestModal | Menu > Solicitar ausencia (por tipo) | Formulario rapido de ausencia |
| AbsenceRequestModal | Boton en seccion Mis Ausencias | Formulario avanzado con calendarios |
| LocationTransferModal | Boton 'Programar traslado' en sede | Programar cambio de sede |
| ApplicationFormModal | Boton 'Aplicar' en vacante | Formulario de aplicacion a vacante |
| MyApplicationsModal | Boton 'Mis Aplicaciones' | Historial de aplicaciones enviadas |
| ClientProfileModal | Click en tarjeta de cliente | Perfil y historial del cliente |
| EmployeeAppointmentModal | Click en cita (lista o calendario) | Detalle de cita (solo lectura) |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Ejemplo de modal — AbsenceRequestModal abierto |


**37. Estados de Carga, Error y Vacio**

| Componente | Loading | Error | Vacio |
| --- | --- | --- | --- |
| Mis Empleos | Skeleton cards | Alert con mensaje | Mensaje invitando a unirse a un negocio |
| Mis Citas | Spinner central | Toast de error | Mensaje 'No tienes citas' con icono Calendar |
| Mis Clientes | Skeleton grid | Alert con retry | Mensaje 'Aun no has atendido clientes' |
| Mis Ausencias | Spinner | Toast error | Mensaje por pestana vacia |
| Marketplace Vacantes | Skeleton cards | Alert | Mensaje 'No hay vacantes disponibles' |
| Chat | Skeleton conversaciones | Reconnect button | Mensaje 'No hay conversaciones' |
| Horario | Spinner | Toast | Se muestran valores por defecto |
| Servicios | Spinner | Alert | Mensaje 'No hay servicios disponibles' |


**38. Limitaciones por Plan**
Las funcionalidades del rol Empleado estan disponibles en todos los planes. Las restricciones de plan aplican al negocio (administrador), no al empleado individual.

| Restriccion del Negocio | Gratis | Basico | Pro |
| --- | --- | --- | --- |
| Empleados permitidos | 1 | 10 | Ilimitados |
| Sedes | 1 | 3 | Ilimitadas |
| Servicios | 5 | 50 | Ilimitados |
| Citas/mes | 30 | 500 | Ilimitadas |


Si el negocio esta en plan Gratuito con maximo 1 empleado, solo el propietario puede operar como empleado. Al actualizar al plan Basico, se pueden agregar hasta 10 empleados adicionales.

| El empleado no paga Los empleados no tienen costos asociados en Gestabiz. El plan es una responsabilidad del administrador del negocio. Todas las funcionalidades de empleado estan disponibles independientemente del plan del negocio, salvo que el cupo de empleados se haya agotado. |
| --- |


**39. Glosario de Terminos del Empleado**

| Termino | Definicion |
| --- | --- |
| business_employees | Tabla que vincula un usuario con un negocio como empleado. Contiene rol, sede, horario, salario, estado. |
| employee_services | Relacion muchos a muchos entre empleado y servicios del negocio. Incluye nivel de experiencia y comision. |
| work_schedules | Horario semanal del empleado: 7 registros (uno por dia) con dia, hora inicio, hora fin, activo/inactivo. |
| employee_absences | Solicitudes de ausencia del empleado con tipo, fechas, razon, estado (pending/approved/rejected/cancelled). |
| vacation_balance | Balance anual de vacaciones: total, usados, pendientes, restantes. |
| employee_profiles | Perfil profesional extendido: resumen, experiencia, certificaciones, idiomas, especializaciones. |
| employee_join_requests | Solicitudes de vinculacion a negocios. Estados: pending, approved, rejected. |
| job_applications | Aplicaciones a vacantes laborales. Estados: pending, reviewing, in_selection_process, accepted, rejected, withdrawn, completed. |
| PermissionGate | Componente React que envuelve botones y verifica permisos antes de renderizar o habilitar la accion. |
| effectiveBusinessId | ID del negocio seleccionado actualmente en el dashboard del empleado. Scopa todas las queries. |
| transfer_status | Estado de un traslado de sede: pending (en espera), completed (ejecutado), cancelled (anulado). |
| allow_client_messages | Flag booleano en business_employees que controla si el empleado recibe mensajes de clientes. |
| lunch_break_start/end | Hora de inicio y fin del almuerzo del empleado. Bloquea slots de citas en ese rango. |
| expertise_level | Nivel de experiencia del empleado en un servicio (1-5 estrellas). |
| commission_percentage | Porcentaje de comision que recibe el empleado por cada servicio realizado (0-100%). |


**GESTABIZ**
**Manual de Usuario — Gestabiz**
*Guia funcional completa del sistema de gestion de citas y negocios*
**Parte 3 de 5: Administrador — Plan Gratuito**
Version del producto: 1.0.3   |   Abril 2026
*Fase Beta completada   |   Listo para produccion*

**Desarrollado por Ti Turing**
*https://github.com/TI-Turing*

**INDICE DE CONTENIDOS**
*A continuacion se listan todas las secciones cubiertas en esta parte. Haga clic en cualquier titulo para navegar directamente al detalle.*
1. Resumen Ejecutivo — Administrador Plan Gratuito
2. Acceso al Panel de Administracion
3. Registro de un Nuevo Negocio
4. Asistente de Configuracion Inicial (Onboarding)
5. Dashboard — Pestana Resumen
6. Tarjetas de Estadisticas
7. Tarjeta de Informacion del Negocio
8. Generacion de Codigo QR
9. Vista de Perfil Publico del Negocio
10. Panel de Salud Operacional
11. Barra Lateral (Sidebar) y Navegacion
12. Gestion de Servicios
13. Crear un Servicio
14. Editar un Servicio
15. Eliminar un Servicio
16. Reactivar un Servicio
17. Asignaciones de Servicios (Sedes y Empleados)
18. Gestion de Sedes
19. Crear una Sede
20. Editar una Sede
21. Eliminar una Sede
22. Multimedia de Sedes (Imagenes y Videos)
23. Sede Principal — Reglas
24. Calendario de Citas
25. Navegacion del Calendario
26. Filtros del Calendario
27. Codificacion de Colores por Estado de Cita
28. Modal de Detalle de Cita
29. Flujo Completar Cita (Calculo Fiscal)
30. Acciones sobre una Cita
31. Citas Pendientes y En Proceso
32. Gestion de Clientes (CRM Basico)
33. Modal de Perfil de Cliente
34. Facturacion y Planes
35. Vista de Plan Gratuito
36. Prueba Gratuita (Free Trial)
37. Pagina de Precios y Comparativa
38. Configuraciones del Negocio
39. Informacion del Negocio
40. Logo y Banner (Branding)
41. Configuracion de Notificaciones
42. Tracking de Notificaciones
43. Dias Cerrados
44. Configuracion del Chat
45. Configuracion General (Tema e Idioma)
46. Edicion de Perfil Personal
47. Zona de Peligro — Desactivar Cuenta
48. Limites del Plan Gratuito — Resumen
49. Modulos Bloqueados y Pantalla de Upgrade
50. Banner de Limite Alcanzado
51. Permisos del Administrador (PermissionGate)
52. Gestion de Multiples Negocios
53. Cambio de Rol (Admin / Empleado / Cliente)
54. Estados de Carga, Error y Vacios
55. Glosario de Terminos

**PARTE 1 — RESUMEN EJECUTIVO**
**1. Resumen Ejecutivo — Administrador Plan Gratuito**
El rol de Administrador en Gestabiz es el centro de operaciones de un negocio. Desde el panel de administracion, el dueno o administrador de un negocio puede gestionar cada aspecto de su operacion: servicios, sedes, citas, clientes y configuraciones. El Plan Gratuito ofrece una experiencia completa para negocios que inician, con limites razonables que permiten validar la plataforma sin ningun costo.

| Ideal para emprendedores El Plan Gratuito esta disenado para negocios que recien comienzan o quieren probar Gestabiz sin compromiso. Incluye todas las herramientas fundamentales: gestion de citas, servicios, una sede, un catalogo de clientes y un perfil publico visible en Google. |
| --- |


**Lo que incluye el Plan Gratuito**

| Recurso | Limite | Descripcion |
| --- | --- | --- |
| Sedes | 1 | Una ubicacion fisica del negocio |
| Empleados | 1 | El propio dueno del negocio |
| Citas por mes | 50 | Hasta 50 citas mensuales agendadas |
| Clientes visibles | 50 | Hasta 50 clientes en el catalogo CRM |
| Servicios | 15 | Hasta 15 servicios ofrecidos |
| Perfil publico | Incluido | Pagina indexable en Google con SEO completo |
| QR del negocio | Incluido | Codigo QR descargable para compartir |
| Dashboard de resumen | Incluido | Estadisticas basicas del negocio |
| Facturacion y planes | Incluido | Gestion de suscripcion y upgrades |
| Configuraciones | Incluido | Logo, banner, notificaciones, chat, dias cerrados |
| Recordatorios por email | Incluido | Recordatorios automaticos a clientes |


**Modulos no disponibles en el Plan Gratuito**
Los siguientes modulos requieren un plan superior. Al intentar acceder, el sistema mostrara una pantalla informativa con opcion de actualizar el plan.

| Modulo | Plan requerido |
| --- | --- |
| Gestion de Empleados | Basico |
| Ausencias y Vacaciones | Basico |
| Historial de Ventas | Basico |
| Ventas Rapidas | Basico |
| Reportes | Basico |
| Permisos Granulares | Basico |
| Gastos y Egresos | Pro |
| Portal de Reclutamiento | Pro |
| Recursos Fisicos | Pro |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Panel de administracion — Plan Gratuito con modulos bloqueados |


**PARTE 2 — DETALLE EXHAUSTIVO**
**2. Acceso al Panel de Administracion**
Para acceder al panel de administracion, el usuario debe haber iniciado sesion y tener al menos un negocio registrado como propietario (owner) o haber sido asignado como administrador de un negocio existente.
**Requisitos de acceso**
- Cuenta activa con email verificado.
- Ser propietario del negocio (owner_id en tabla businesses) o tener rol admin en business_roles.
- Los roles se calculan automaticamente — no se almacenan en la base de datos.
**Flujo de acceso**
- El usuario inicia sesion con email/contrasena o Google.
- El sistema calcula los roles disponibles: si el usuario es owner de algun negocio, el rol Admin estara disponible.
- Si el usuario tiene multiples roles disponibles (Admin, Empleado, Cliente), puede cambiar entre ellos desde el selector de roles en el encabezado.
- Al seleccionar el rol Admin, el sistema carga el AdminDashboard con el negocio correspondiente.
- Si el usuario administra varios negocios, puede cambiar entre ellos desde el dropdown del encabezado.

| Roles dinamicos Los roles en Gestabiz NO se guardan en la base de datos. Se calculan en tiempo real a partir de la relacion del usuario con los negocios. Un mismo usuario puede ser Admin en un negocio, Empleado en otro y Cliente en cualquiera. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Selector de roles en el encabezado del dashboard |


**3. Registro de un Nuevo Negocio**
Cuando un usuario accede al rol Admin sin tener ningun negocio registrado, el sistema muestra automaticamente el formulario de registro de negocio. Tambien es posible crear un nuevo negocio desde el dropdown del encabezado con la opcion 'Crear nuevo negocio'.
**Campos del formulario**

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| Nombre del negocio | Texto | Si | Nombre comercial del negocio |
| Categoria | Selector con busqueda | Si | 15 categorias principales (Salud, Belleza, etc.) |
| Subcategorias | 3 campos de texto | No | Hasta 3 subcategorias libres |
| Tipo de entidad | Radio: Individual / Empresa | Si | Determina campos adicionales |
| Razon social | Texto | Solo si es empresa | Nombre legal de la empresa |
| NIT / RUT | Texto | No | Identificacion fiscal |
| Numero de registro | Texto | Solo si es empresa | Registro mercantil |
| Modelo de negocio | Radio grid (4 opciones) | Si | Define tipo de operacion |
| Descripcion | Texto area | No | Descripcion del negocio |
| Telefono | Telefono con prefijo | No | Telefono de contacto |
| Email | Email | No | Correo electronico del negocio |
| Sitio web | URL | No | Pagina web del negocio |
| Pais | Selector (default: Colombia) | Si | Pais de operacion |
| Region / Departamento | Selector cascada | Si | Region dentro del pais |
| Ciudad | Selector cascada | Si | Ciudad dentro de la region |


**Modelo de negocio — 4 opciones**

| Opcion | Descripcion | Ejemplo |
| --- | --- | --- |
| Profesionales | El negocio asigna profesionales a citas | Salon de belleza, clinica |
| Recursos Fisicos | El negocio reserva recursos como salas o mesas | Hotel, restaurante |
| Hibrido | Combinacion de profesionales y recursos | Spa con masajistas y salas |
| Clases Grupales | El negocio ofrece clases o actividades en grupo | Gimnasio, academia |


| Nota importante Despues de crear el negocio, se abrira automaticamente el asistente de configuracion inicial para guiarle en la configuracion de servicios, sedes y empleados. |
| --- |


**Botones disponibles**
- Crear Negocio — Crear Negocio — envia el formulario y crea el negocio en la base de datos. El boton cambia a 'Creando...' mientras se procesa.
- Cancelar — Cancelar — cierra el formulario sin guardar. Solo visible si ya hay otro negocio registrado.
**Flujo post-registro**
- El negocio se crea con resource_model seleccionado y is_configured = false.
- El owner es registrado automaticamente como empleado tipo 'manager' mediante un trigger.
- Se asignan automaticamente los 79 permisos del sistema al owner.
- Se muestra el asistente de configuracion inicial (Setup Checklist).

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Formulario de registro de nuevo negocio |


**4. Asistente de Configuracion Inicial (Onboarding)**
El asistente de configuracion (Setup Checklist) aparece en la pestana Resumen del dashboard cuando el negocio aun no esta completamente configurado. Muestra una barra de progreso y una lista de pasos requeridos y opcionales.
**Pasos del asistente**

| # | Paso | Requerido | Accion |
| --- | --- | --- | --- |
| 1 | Crear al menos una sede | Si | Navega a Sedes |
| 2 | Configurar servicios | Si | Navega a Servicios |
| 3 | Asignar profesionales o recursos | Si | Navega a Empleados |
| 4 | Subir logo del negocio | No | Navega a Configuraciones |
| 5 | Escribir descripcion del negocio | No | Navega a Configuraciones |
| 6 | Agregar telefono de contacto | No | Navega a Configuraciones |


Cada paso muestra un icono de verificacion cuando esta completado. La barra de progreso se actualiza en tiempo real. Cuando todos los pasos requeridos estan completos, el negocio cambia a estado 'Publico' (badge verde) y se vuelve visible en busquedas y en el perfil publico.
**Condicion de negocio completamente configurado**
- El campo is_configured del negocio es verdadero.
- Tiene al menos 1 sede activa.
- Tiene al menos 1 servicio activo.
- Las sedes tienen servicios asignados.
- Los empleados tienen servicios asignados.
- No hay problemas operacionales detectados (sin alertas en el panel de salud).

| Badge de visibilidad Cuando el negocio esta completamente configurado, aparece un badge 'Publico' verde en la parte superior del dashboard. Si falta algun paso, el badge dira 'No publico' en rojo y el negocio no sera visible para los clientes en las busquedas. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Asistente de configuracion inicial con barra de progreso |


**5. Dashboard — Pestana Resumen**
La pestana Resumen es la primera vista que ve el administrador al entrar al panel. Proporciona una vision general del negocio con estadisticas en tiempo real, accesos rapidos y el estado de configuracion del negocio.
**Secciones de la pestana Resumen**
- Setup Checklist (si el negocio no esta completamente configurado).
- Panel de Salud Operacional (si hay problemas detectados).
- Grid de 9 tarjetas de estadisticas en 3 filas.
- Tarjeta de Informacion del Negocio.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Vista general del dashboard — Pestana Resumen |


**6. Tarjetas de Estadisticas**
El dashboard muestra 9 tarjetas de estadisticas organizadas en 3 filas. Cada tarjeta muestra un valor numerico con icono y descripcion.

| Fila | Tarjeta | Descripcion | Clickeable |
| --- | --- | --- | --- |
| 1 | Citas Hoy | Numero de citas programadas para el dia actual | Si — abre calendario |
| 1 | Proximas Citas | Conteo de citas futuras confirmadas | No |
| 1 | Citas Completadas | Citas completadas en el mes actual | No |
| 2 | Citas Canceladas | Citas canceladas en el mes actual | No |
| 2 | Empleados | Miembros activos del equipo (excluye owner) | No |
| 2 | Sedes | Total de ubicaciones del negocio | No |
| 2 | Servicios | Servicios activos configurados | No |
| 3 | Ingresos del Mes | Ingresos COP del mes (citas completadas) | No |
| 3 | Valor Promedio por Cita | Promedio COP por cita completada | No |


| Tarjeta interactiva La tarjeta 'Citas Hoy' es la unica clickeable. Al hacer clic, navega directamente al calendario de citas con los filtros guardados en el almacenamiento local del navegador. |
| --- |


**Estado de carga**
Mientras se cargan las estadisticas, se muestra un grid de 6 tarjetas con efecto skeleton (placeholders animados) para mantener la estructura visual.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Grid de estadisticas del dashboard |


**7. Tarjeta de Informacion del Negocio**
Esta tarjeta muestra la informacion principal del negocio y ofrece acciones rapidas.
**Informacion mostrada**
- Logo del negocio (o iniciales como fallback).
- Nombre del negocio.
- Categoria y subcategorias.
- Descripcion del negocio.
- Telefono y email de contacto.
**Acciones disponibles**

| Boton | Accion | Resultado |
| --- | --- | --- |
| Copiar enlace | Copia la URL del perfil publico al portapapeles | Toast de confirmacion |
| Abrir perfil publico | Abre el perfil en una nueva pestana | Navega a /negocio/{slug} |
| Generar QR | Abre el modal de generacion de QR | Ver seccion 8 |
| Ver perfil / Ocultar perfil | Embebe el perfil publico dentro del dashboard | Toggle inline |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Tarjeta de informacion del negocio con acciones rapidas |


**8. Generacion de Codigo QR**
El modal de generacion de QR permite crear un codigo QR descargable que los clientes pueden escanear para acceder al perfil del negocio o iniciar una reserva directamente.
**Opciones del QR**

| Modo | URL generada | Uso recomendado |
| --- | --- | --- |
| Perfil publico (default) | https://gestabiz.com/negocio/{slug} | Tarjetas de visita, flyers |
| Reservas directas | https://gestabiz.com/negocio/{slug}?book=true | Punto de venta, mostrador |


**Flujo de uso**
- Abrir el modal desde la tarjeta de informacion del negocio (boton 'Generar QR').
- Seleccionar el modo: perfil publico o reservas directas (checkbox toggle).
- El QR se genera automaticamente con el logo de Gestabiz centrado.
- Hacer clic en 'Descargar PNG' para guardar la imagen.
- Cerrar el modal con el boton X o haciendo clic fuera.

| QR con reserva directa Cuando el cliente escanea el QR en modo 'Reservas directas', se abre automaticamente el perfil del negocio con el wizard de reserva listo para comenzar. Esto reduce la friccion en un 57% comparado con el flujo normal. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Modal de generacion de codigo QR |


**9. Vista de Perfil Publico del Negocio**
El administrador puede visualizar como se ve su negocio para los clientes sin salir del dashboard. El boton 'Ver perfil' embebe el perfil publico completo de forma inline.
- El perfil incluye 4 pestanas: Servicios, Ubicaciones, Resenas, Acerca de.
- Muestra informacion real del negocio: logo, banner, servicios con precios, sedes con mapa.
- Las resenas son anonimas y muestran calificacion de 1 a 5 estrellas.
- El boton 'Abrir perfil publico' abre la misma pagina en una pestana nueva.

| SEO integrado Cada perfil publico tiene una URL amigable (/negocio/{slug}), meta tags dinamicos, Open Graph, Twitter Card y datos estructurados JSON-LD. El negocio aparece automaticamente en Google una vez que esta completamente configurado. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Perfil publico del negocio embebido en el dashboard |


**10. Panel de Salud Operacional**
El Panel de Salud Operacional (AssignmentHealthPanel) aparece automaticamente en la pestana Resumen cuando el sistema detecta problemas que afectan la operacion del negocio.
**Problemas detectados**
- Servicios sin asignar — Servicios sin empleados asignados — ningun profesional puede atender ese servicio.
- Sedes sin servicios — Sedes sin servicios asignados — la sede no ofrece ningun servicio a los clientes.
- Sin supervisor — Empleados sin supervisor — el empleado no tiene un jefe directo asignado.
- Sin horario — Empleados sin horario — el empleado no tiene dias/horas de trabajo configurados.
- Sin servicios — Empleados sin servicios — el profesional no tiene servicios que pueda ofrecer.
Cada problema se muestra como una alerta con icono y descripcion, junto con un enlace al modulo correspondiente para resolverlo.

| Visibilidad condicional El Panel de Salud solo aparece cuando hay problemas reales. Si todo esta correctamente configurado, esta seccion se oculta automaticamente. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Panel de salud operacional con alertas activas |


**11. Barra Lateral (Sidebar) y Navegacion**
La barra lateral izquierda del panel de administracion muestra todos los modulos disponibles. Los modulos desbloqueados aparecen primero; los bloqueados se muestran al final con un icono de candado y un badge indicando el plan requerido.
**Modulos accesibles en Plan Gratuito**

| Icono | Modulo | Descripcion |
| --- | --- | --- |
| LayoutDashboard | Resumen | Vista general con estadisticas y configuracion |
| Calendar | Citas | Calendario visual con gestion completa de citas |
| Briefcase | Servicios | CRUD de servicios con asignaciones |
| UserCheck | Clientes | Catalogo CRM con historial de visitas |
| CreditCard | Facturacion | Gestion de plan, pagos y upgrades |
| MapPin | Sedes | Gestion de ubicaciones fisicas del negocio |


**Modulos bloqueados (con icono de candado)**

| Modulo | Plan requerido | Badge mostrado |
| --- | --- | --- |
| Empleados | Basico | Basico |
| Ausencias | Basico | Basico |
| Ventas | Basico | Basico |
| Ventas Rapidas | Basico | Basico |
| Reportes | Basico | Basico |
| Permisos | Basico | Basico |
| Gastos | Pro | Pro |
| Reclutamiento | Pro | Pro |
| Recursos | Pro | Pro |


Al hacer clic en un modulo bloqueado, se muestra una pantalla con icono de candado, el nombre del modulo, el plan requerido y un boton 'Ver planes y precios' que navega directamente a la seccion de facturacion.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Sidebar con modulos desbloqueados y bloqueados |


**12. Gestion de Servicios**
El modulo de Servicios permite al administrador crear, editar, eliminar y reactivar los servicios que ofrece su negocio. Cada servicio tiene precio, duracion, descripcion y puede tener una imagen asociada.
**Limite del Plan Gratuito**

| Maximo 15 servicios visibles En el Plan Gratuito, se muestran hasta 15 servicios. Si se crean mas, los excedentes se almacenan en la base de datos pero no son visibles. Un banner informativo indica cuantos servicios adicionales estan ocultos y ofrece actualizar el plan. |
| --- |


**Vista de la lista de servicios**
- Grid responsive: 1 columna (movil), 2 columnas (tablet), 3 columnas (escritorio).
- Cada tarjeta muestra: imagen de fondo con gradiente, nombre, descripcion (2 lineas), precio en COP, duracion en minutos.
- Badges de alerta: 'Sin sedes' (si el servicio no esta asignado a ninguna sede), 'Sin empleados' (si no tiene profesionales asignados).
- Badge 'Inactivo' para servicios desactivados (solo visibles con el toggle activo).
- Toggle 'Mostrar inactivos' para incluir servicios desactivados en la lista.
- Click en la tarjeta abre el modal de perfil del servicio.
**Boton de accion principal**
El boton 'Nuevo Servicio' (icono +) esta protegido por el sistema de permisos (PermissionGate). Si el administrador no tiene el permiso 'services.create', el boton no se mostrara.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Lista de servicios con tarjetas |


**13. Crear un Servicio**
Al hacer clic en 'Nuevo Servicio', se abre un formulario en un dialogo modal.
**Campos del formulario**

| Campo | Tipo | Requerido | Validacion |
| --- | --- | --- | --- |
| Nombre | Texto | Si | No vacio, se limpia espacios (trim) |
| Descripcion | Texto area | No | Maximo 500 caracteres con contador |
| Duracion (minutos) | Numero | Si | Mayor a 0 |
| Precio | Numero (COP) | Si | Mayor o igual a 0, separadores de miles |
| Categoria | Selector | No | De la lista de categorias |
| Comision % | Numero | No | Oculto si el negocio tiene 1 o menos empleados |
| Imagen | Carga de archivo | No | Upload diferido a bucket de Supabase |
| Activo | Toggle | No | Default: activado |


**Flujo de creacion**
- Llenar los campos requeridos (nombre, duracion, precio).
- Opcionalmente subir una imagen y agregar descripcion.
- Hacer clic en 'Crear Servicio'.
- Si la creacion es exitosa, se abre automaticamente el dialogo de asignaciones.
- Seleccionar las sedes y empleados que ofreceran este servicio (checkboxes).
- Guardar las asignaciones.
- Toast de confirmacion: 'Servicio creado exitosamente'.

| Proteccion contra doble clic El boton de guardar se deshabilita automaticamente mientras se procesa la solicitud para evitar la creacion duplicada de servicios. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Formulario de creacion de servicio |


**14. Editar un Servicio**
Para editar un servicio existente, el administrador hace clic en el boton de edicion (icono de lapiz) en la tarjeta del servicio. Se abre el mismo formulario pre-llenado con los datos actuales del servicio.
- Todos los campos son editables, incluyendo la imagen.
- Si se cambia la imagen, la anterior se elimina del almacenamiento si es una URL de Supabase.
- Las asignaciones de sedes y empleados se cargan automaticamente.
- El boton de guardar esta protegido por el permiso 'services.edit'.
- Si se guarda con imagen nueva, se aplica cache-bust para que el navegador muestre la imagen actualizada.
**15. Eliminar un Servicio**
La eliminacion de un servicio es una operacion critica que tiene efectos sobre las citas programadas.
**Flujo de eliminacion**
- Hacer clic en el boton de eliminacion (icono de papelera) en la tarjeta del servicio.
- El sistema muestra una ventana de confirmacion indicando cuantas citas pendientes hay.
- Si el administrador confirma:
- a) Se cancelan todas las citas pendientes asociadas al servicio.
- b) Se envia notificacion de cancelacion por email a cada cliente afectado.
- c) Se eliminan las asignaciones del servicio (location_services y employee_services).
- d) El servicio se desactiva (soft-delete: is_active = false).
- Toast de confirmacion con el numero de citas canceladas.

| Soft-delete Los servicios eliminados no se borran permanentemente. Se marcan como inactivos (is_active = false) y pueden reactivarse posteriormente. Esto preserva el historial de citas y transacciones. |
| --- |


**16. Reactivar un Servicio**
Los servicios desactivados pueden reactivarse desde la lista de servicios.
- Activar el toggle 'Mostrar inactivos' en la parte superior de la lista.
- Localizar el servicio con badge 'Inactivo'.
- Hacer clic en el boton de reactivacion (icono de flecha circular).
- El servicio se reactiva (is_active = true) y se abre el editor para reasignar sedes y empleados.
- Toast: 'Selecciona las sedes para este servicio'.
**17. Asignaciones de Servicios (Sedes y Empleados)**
Cada servicio debe estar asignado a al menos una sede y un empleado para ser reservable. Las asignaciones se gestionan desde un dialogo con checkboxes.
**Dialogo de asignaciones**
- Lista de sedes del negocio con checkboxes.
- Lista de empleados con checkboxes.
- Opcion de comision personalizada por combinacion sede-empleado.
- Al guardar: se eliminan todas las asignaciones anteriores y se crean las nuevas.

| Sin asignaciones = sin reservas Si un servicio no tiene sedes o empleados asignados, los clientes NO podran reservar citas para ese servicio. El sistema mostrara badges de alerta amarillos ('Sin sedes', 'Sin empleados') en la tarjeta del servicio para advertir al administrador. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Dialogo de asignaciones de servicio con checkboxes |


**18. Gestion de Sedes**
El modulo de Sedes permite al administrador gestionar las ubicaciones fisicas de su negocio. En el Plan Gratuito, el limite es de 1 sede.

| Limite del Plan Gratuito: 1 sede Solo se puede crear y visualizar una sede. El boton 'Agregar Sede' se deshabilita cuando el limite se alcanza, mostrando un tooltip explicativo. Si por alguna razon existen mas sedes en la base de datos, solo la primera sera visible y un banner informativo indicara cuantas estan ocultas. |
| --- |


**Vista de la lista de sedes**
- Grid responsive: 1/2/3 columnas segun el tamano de pantalla.
- Cada tarjeta muestra: banner como fondo completo con gradiente, nombre, direccion, telefono, email, horarios.
- Badges: 'Principal' (sede principal del negocio), 'Administrada' (sede preferida del admin), 'Sin servicios asignados' (alerta amarilla), 'Inactiva'.
- Conteo de imagenes asociadas a la sede.
- Click en la tarjeta abre el modal de perfil de la sede.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Tarjeta de sede con banner e informacion |


**19. Crear una Sede**
Si el negocio no tiene sedes (primera configuracion) o si no ha alcanzado el limite del plan, el boton 'Agregar Sede' estara disponible.
**Campos del formulario**

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| Nombre | Texto | Si | Nombre de la sede (ej: 'Sede Norte') |
| Direccion | Texto | No | Direccion completa |
| Ciudad | Selector cascada | No | Ciudad de la sede |
| Estado / Region | Selector cascada | No | Departamento o estado |
| Pais | Selector | No | Default: Colombia |
| Codigo postal | Texto | No | Codigo postal de la zona |
| Telefono | Telefono con prefijo | No | Telefono de la sede |
| Email | Email | No | Correo de la sede |
| Descripcion | Texto area | No | Descripcion de la sede |
| Horarios de negocio | Selector de horas | No | Horario de apertura y cierre por dia |
| Imagenes | Carga multiple | No | Fotos de la sede |
| Activa | Toggle | No | Default: activada |
| Sede principal | Toggle | No | La primera sede se marca automaticamente |
| Atender en festivos | Toggle | No | Si la sede opera en dias festivos |


**Regla de primera sede**
La primera sede creada en el negocio se marca automaticamente como sede principal (is_primary = true). Esta regla no se puede modificar hasta que exista una segunda sede.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Formulario de creacion de sede |


**20. Editar una Sede**
Al editar una sede, se abre un dialogo con dos pestanas: 'Informacion' y 'Gastos' (LocationExpenseConfig).
- Todos los campos del formulario de creacion estan disponibles para edicion.
- Si se cambia la direccion de la sede, el sistema detecta una reubicacion y notifica automaticamente a los clientes con citas pendientes en esa sede.
- La notificacion de reubicacion se envia por email mediante la Edge Function 'send-notification' con tipo 'appointment_location_update'.

| Deteccion de reubicacion Gestabiz detecta automaticamente si la direccion de la sede cambio. Si hay clientes con citas pendientes en esa sede, cada uno recibe un email informativo sobre el cambio de ubicacion. |
| --- |


**21. Eliminar una Sede**
**Flujo de eliminacion**
- Hacer clic en el boton de eliminacion (icono de papelera) en la tarjeta de la sede.
- El sistema muestra una ventana de confirmacion con el conteo de citas activas.
- Si el administrador confirma:
- a) Se cancelan todas las citas activas en la sede.
- b) Se envia notificacion de cancelacion por email a cada cliente afectado.
- c) La sede se elimina de la base de datos.
- Toast con el conteo de citas canceladas.

| Sugerencia del sistema Si la eliminacion es por reubicacion, el sistema sugiere editar la direccion en lugar de eliminar la sede: 'Si es una reubicacion, considera editar la direccion.' |
| --- |


**22. Multimedia de Sedes (Imagenes y Videos)**
Cada sede puede tener multiples imagenes y videos asociados, gestionados desde el editor de la sede.
- Subida de imagenes y videos mediante el componente MediaUploader.
- Seleccion de imagen como banner de la sede con herramienta de recorte (BannerCropper).
- Toggle de video principal para destacar un video sobre los demas.
- Edicion de descripciones de media inline con guardado individual.
- Upload diferido: los archivos se cargan al hacer clic en guardar, no al seleccionarlos.
**23. Sede Principal — Reglas**
Solo una sede puede ser la sede principal del negocio. Las reglas son:
- Solo una sede puede tener is_primary = true a la vez.
- Al desmarcar la sede principal, el sistema obliga a seleccionar una nueva sede principal desde un selector.
- Al marcar una nueva sede como principal, se desmarca automaticamente la anterior.
- La primera sede creada se marca como principal automaticamente.

**24. Calendario de Citas**
El calendario de citas es el modulo central del administrador. Muestra una cuadricula diaria de 24 horas con columnas para cada empleado, donde se posicionan las citas como bloques de color segun su estado.
**Estructura del calendario**
- Columna izquierda fija: horas del dia (00:00 a 23:00).
- N columnas de empleados: una por cada profesional activo.
- Cada columna tiene un color pastel alternado (8 colores disponibles: azul, purpura, rosa, verde, amarillo, indigo, rojo, teal).
- Header de empleados: avatar, nombre y opcionalmente badges de servicios que ofrece.
- Horas fuera del horario operativo: fondo semitransparente oscuro.
- Hora de almuerzo: fondo gris, cursor 'no permitido', texto 'Almuerzo' centrado en italica.
- Linea de hora actual: linea azul horizontal visible solo si es el dia actual.

| Zona horaria El calendario opera en zona horaria de Colombia (America/Bogota, GMT-5). Todas las horas se muestran y calculan en esta zona, independientemente de la ubicacion del usuario. |
| --- |


**Modo maximizado**
El calendario puede expandirse a pantalla completa presionando el boton de maximizar. En este modo, ocupa toda la ventana del navegador. Se puede volver al tamano normal con el boton de minimizar o presionando la tecla Escape.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Calendario de citas con columnas de empleados |


**25. Navegacion del Calendario**

| Boton | Accion | Descripcion |
| --- | --- | --- |
| Flecha izquierda | Dia anterior | Retrocede un dia en el calendario |
| Flecha derecha | Dia siguiente | Avanza un dia en el calendario |
| Hoy | Ir al dia actual | Boton primario que regresa al dia de hoy |
| Icono de calendario | Selector de fecha | Abre un mini-calendario flotante para elegir fecha |


**Mini-calendario flotante**
- Navegacion mensual con flechas izquierda/derecha.
- Grid 7x6 con inicio de semana en lunes.
- Dias del mes actual resaltados; dias de otros meses con opacidad reducida.
- Dia actual: fondo con tinte del color primario y texto en negrita.
- Dia seleccionado: fondo color primario con texto blanco.
- Boton 'Ir a hoy' en la parte inferior.
- Se cierra automaticamente al seleccionar un dia o al hacer clic fuera.
**Auto-scroll inteligente**
Al cargar el calendario, se desplaza automaticamente a la posicion mas relevante:
- Si es hoy: se centra en la hora actual.
- Si hay horario operativo: se posiciona al inicio del horario laboral.
- Si no hay horario definido: se mantiene en la parte superior.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Mini-calendario flotante para seleccion de fecha |


**26. Filtros del Calendario**
El calendario tiene un panel colapsable de filtros con 3 selectores multi-opcion.

| Filtro | Opciones | Default | Comportamiento vacio |
| --- | --- | --- | --- |
| Estado | Pendiente, Confirmada, Completada, En progreso, Cancelada, No asistio | Confirmada + Pendiente | No muestra nada |
| Servicio | Todos los servicios activos del negocio | Todos | Muestra todos |
| Profesional | Todos los empleados activos | Todos | Muestra todos |


**Caracteristicas de los filtros**
- Cada selector muestra 'N seleccionado(s)' o 'Todos'/'Ninguno'.
- Opciones con checkboxes individuales y un boton 'Seleccionar Todos'.
- Los filtros se guardan automaticamente en el almacenamiento local del navegador.
- Boton 'Limpiar' para resetear todos los filtros a sus valores por defecto.
- Panel colapsable con animacion del icono chevron.
**Filtro de sede preferida**
Si el administrador tiene una sede preferida configurada, el calendario filtra automaticamente las citas de esa sede. Este filtro se aplica de forma transparente sin ser visible en el panel.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Panel de filtros del calendario |


**27. Codificacion de Colores por Estado de Cita**

| Estado | Color tema claro | Color tema oscuro | Efecto adicional |
| --- | --- | --- | --- |
| Pendiente | Amarillo suave con borde amarillo | Amarillo oscuro/30 con borde oscuro | — |
| Confirmada | Azul suave con borde azul | Azul oscuro/30 con borde azul | — |
| Completada | Verde suave con borde verde | Verde oscuro/30 con borde verde | — |
| En progreso | Purpura suave con borde purpura | Purpura oscuro/30 con borde purpura | — |
| No asistio | Gris atenuado | Gris con opacidad 50% | — |
| Cancelada | Rojo suave con borde rojo | Rojo oscuro/20 con borde rojo | Texto tachado, opacidad 60% |


Adicionalmente, si una cita tiene estado 'Pendiente' pero el cliente ya confirmo por email, se muestra un badge verde adicional 'Cliente confirmo'.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Calendario con citas de diferentes colores por estado |


**28. Modal de Detalle de Cita**
Al hacer clic en cualquier bloque de cita en el calendario, se abre un modal con la informacion completa de la cita y botones de accion.
**Informacion mostrada**
- Nombre del cliente.
- Nombre del servicio.
- Horario de inicio y fin (formato Colombia).
- Precio del servicio en COP.
- Empleado asignado.
- Notas de la cita (si existen).
- Badge de estado con codificacion de colores.
- Si la cita esta completada y pagada: desglose financiero (ingreso bruto, comision, otras deducciones, neto).
- Campo de propina opcional (input numerico, paso 1000, minimo 0).

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Modal de detalle de cita con informacion completa |


**29. Flujo Completar Cita (Calculo Fiscal)**
Completar una cita es una operacion importante que genera transacciones fiscales automaticamente. El sistema calcula impuestos, comisiones y registra todo en el sistema contable.
**Flujo paso a paso**
- El administrador hace clic en 'Completar' en el modal de detalle de la cita.
- El sistema verifica que la cita tenga un servicio asociado (validacion obligatoria).
- Se obtiene el porcentaje de comision del servicio desde la base de datos.
- Se calculan los montos: ingreso bruto = precio del servicio, comision = bruto x comision%, neto = bruto - comision - deducciones.
- Se actualiza la cita con estado 'completada', estado de pago 'pagado' y los montos calculados.
- Se calculan los impuestos incluidos segun la configuracion fiscal del negocio:
- IVA 5%: subtotal = monto / 1.05
- IVA 19%: subtotal = monto / 1.19
- Sin impuesto: subtotal = monto
- Se crean hasta 3 transacciones en el sistema contable:
- Ingreso: ingreso bruto del servicio (con desglose fiscal).
- Egreso (si hay comision): comision del empleado.
- Ingreso (si hay propina): propina registrada.
- Toast con detalle: 'Ingreso bruto: X COP, Comision: Y COP, Neto: Z COP'.

| Automatizacion contable Al completar una cita, Gestabiz genera automaticamente todas las transacciones fiscales necesarias. El administrador no necesita registrar ingresos manualmente — el sistema lo hace. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Toast con detalle fiscal al completar cita |


**30. Acciones sobre una Cita**
El modal de detalle de cita ofrece 5 acciones disponibles cuando la cita NO esta completada ni cancelada:

| Accion | Color | Efecto | Notificacion |
| --- | --- | --- | --- |
| Confirmar Cita | Primario | Cambia estado a 'confirmada', registra fecha de confirmacion | Toast exito |
| Reenviar Email | Contorno | Reenvia email de confirmacion al cliente via Edge Function | Toast exito |
| Completar | Verde | Ver seccion 29 — genera transacciones fiscales | Toast con detalle COP |
| No Asistio | Ambar | Cambia estado a 'no_show', agrega nota 'Cliente no se presento' | Toast advertencia |
| Cancelar | Rojo | Cambia estado a 'cancelada' | Toast exito |


Todos los botones se deshabilitan automaticamente mientras se procesa una accion (indicador de procesamiento) para evitar acciones duplicadas.

| Solo citas activas Los botones de accion solo aparecen si la cita NO tiene estado 'completada' o 'cancelada'. Para citas ya finalizadas, el modal es de solo lectura. |
| --- |


**31. Citas Pendientes y En Proceso**
Debajo del grid del calendario, pueden aparecer dos secciones adicionales:
**En Proceso**
- Muestra citas confirmadas cuyo rango de horario incluye el momento actual.
- Badge azul con el conteo de citas en proceso.
- Boton 'Gestionar' que abre el modal de detalle.
**Pendientes de Confirmar**
- Muestra citas confirmadas cuya hora de fin ya paso (overdueAppointments).
- Badge naranja con el conteo de citas vencidas.
- Botones rapidos: 'Completada' (verde) y 'Sin Asistencia' (ambar) sin abrir el modal.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Secciones de citas pendientes y en proceso debajo del calendario |


**32. Gestion de Clientes (CRM Basico)**
El modulo de Clientes ofrece una vista centralizada de todos los clientes que han tenido al menos una cita no cancelada en el negocio.

| Limite del Plan Gratuito: 50 clientes visibles En el Plan Gratuito se muestran hasta 50 clientes. Los datos de todos los clientes se almacenan en la base de datos, pero solo los primeros 50 son visibles. Un banner indica cuantos estan ocultos. |
| --- |


**Datos mostrados por cliente**
- Avatar (imagen de perfil o iniciales como fallback).
- Nombre completo.
- Email de contacto.
- Total de citas realizadas (conteo).
- Fecha de la ultima visita.
**Funcionalidades**
- Busqueda local por nombre o email (campo de texto con filtrado en tiempo real).
- Grid responsive: 1/2/3 columnas segun pantalla.
- Ordenamiento: por total de visitas descendente (los clientes mas frecuentes primero).
- Click en un cliente abre el Modal de Perfil de Cliente (seccion 33).
**Consulta de datos (patron two-step)**
Los datos de clientes se obtienen en dos pasos por limitaciones de la estructura de la base de datos:
- Se consultan las citas no canceladas del negocio (hasta 1000 registros).
- Se agrupan por client_id, calculando: total de visitas, visitas completadas, ultima visita.
- Se consultan los perfiles de los clientes unicos en lote (batch fetch).
- Se combinan los datos de citas con los perfiles para generar el listado final.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Lista de clientes con tarjetas de resumen |


**33. Modal de Perfil de Cliente**
El modal de perfil de cliente muestra informacion detallada de un cliente especifico, incluyendo estadisticas y un historial completo de citas.
**Tarjetas de estadisticas (3)**

| Estadistica | Descripcion |
| --- | --- |
| Visitas | Numero total de citas completadas |
| Total citas | Numero total de citas (todos los estados) |
| Ingresos | Total COP generado por citas completadas |


**Informacion de contacto**
- Email del cliente.
- Telefono (si esta registrado).
- Mensaje 'Sin informacion de contacto' si no hay datos.
**Pestanas**
- Informacion — Informacion: fecha de primera y ultima visita.
- Historial — Historial (N): lista cronologica de citas con servicio, fecha, hora, estado y precio.
**Estados de cita con badges de color**

| Estado | Etiqueta | Estilo |
| --- | --- | --- |
| scheduled | Programada | Contorno |
| confirmed | Confirmada | Secundario |
| completed | Completada | Default (primario) |
| cancelled | Cancelada | Destructivo (rojo) |
| in_progress | En progreso | Contorno |
| no_show | No asistio | Destructivo (rojo) |
| rescheduled | Reprogramada | Contorno |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Modal de perfil de cliente con historial de citas |


**34. Facturacion y Planes**
El modulo de Facturacion es el centro de gestion de suscripciones del negocio. Desde aqui el administrador puede ver su plan actual, activar pruebas gratuitas, comparar planes y gestionar pagos.
**35. Vista de Plan Gratuito**
Cuando el negocio esta en el Plan Gratuito, la pantalla de facturacion muestra:
- Banner de prueba gratuita (si es elegible para el mes gratis del Plan Basico).
- Tarjeta con las caracteristicas incluidas en el plan gratuito (con iconos de verificacion).
- Comparativa de 2 columnas: Plan Basico ($89,900/mes, badge 'Mas Popular') y Plan Pro ($159,900/mes).
- Cada plan muestra hasta 6 caracteristicas principales y un boton de activacion.
**Comparativa de planes**

| Caracteristica | Gratuito | Basico ($89,900) | Pro ($159,900) |
| --- | --- | --- | --- |
| Sedes | 1 | 3 | 10 |
| Empleados | 1 | 6 | 15 |
| Citas/mes | 50 | Ilimitadas | Ilimitadas |
| Clientes | 50 | Ilimitados | Ilimitados |
| Servicios | 15 | Ilimitados | Ilimitados |
| Chat | No | Si | Si |
| Ventas rapidas | No | Si | Si |
| Sistema contable | No | No | Si |
| Reclutamiento | No | No | Si |
| Recursos fisicos | No | No | Si |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Pantalla de facturacion — vista Plan Gratuito |


**36. Prueba Gratuita (Free Trial)**
Los negocios nuevos pueden acceder a un mes gratuito del Plan Basico.
**Reglas de la prueba gratuita**
- Solo se puede activar UNA VEZ por negocio.
- Al hacer clic en 'Activar Mes Gratis', se muestra una ventana de confirmacion con advertencia en rojo.
- Texto de advertencia: 'Solo puedes utilizar el mes gratis una sola vez'.
- Boton de confirmacion explicito: 'Si, activar prueba'.
- Una vez activada, el negocio tiene acceso completo al Plan Basico durante 30 dias.
- Al finalizar la prueba, el negocio regresa al Plan Gratuito automaticamente si no se activa un plan de pago.

| Sin compromiso La prueba gratuita no requiere metodo de pago y no genera cargos automaticos. Al finalizar, el negocio simplemente regresa al Plan Gratuito sin perder datos. |
| --- |


**37. Pagina de Precios y Comparativa**
La pagina de precios se muestra al hacer clic en 'Activar plan' desde las comparativas o al navegar a la seccion de facturacion.
**Funcionalidades**
- Toggle mensual/anual con badge 'Ahorra 17%' para el ciclo anual.
- Precios recalculados segun el ciclo de facturacion seleccionado.
- Campo de codigo de descuento con boton 'Aplicar'. Si es valido, muestra precio tachado + precio final.
- 3 tarjetas de planes en grid responsive.
- El Plan Gratuito muestra 'Ya estas en el plan gratuito' (deshabilitado).
- El Plan Pro muestra 'Proximamente' (deshabilitado).
**Flujo de activacion de plan**
- Seleccionar plan (click en boton CTA de la tarjeta).
- El sistema crea una sesion de checkout (Stripe, PayU o MercadoPago segun configuracion).
- Redireccion a la pasarela de pago externa.
- Procesamiento del pago.
- Webhook procesa la confirmacion y activa el plan.
- El usuario regresa a Gestabiz con el plan activo.
**FAQ incluidas (4 preguntas)**

| Pregunta | Respuesta resumida |
| --- | --- |
| Puedo cambiar de plan? | Si, upgrades prorrateados, downgrades al final del periodo |
| Hay prueba gratuita? | 14 dias gratis en Plan Basico, cancelar sin cargo |
| Metodos de pago? | Visa, Mastercard, Amex via Stripe |
| Puedo cancelar? | Si, sin penalidades ni costos ocultos |


Enlace de soporte al final: 'Necesitas ayuda?' con boton de email a soporte@gestabiz.com.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Pagina de precios con toggle mensual/anual |


**38. Configuraciones del Negocio**
Las configuraciones del administrador se dividen en multiples sub-secciones accesibles desde la pagina de ajustes del negocio. Incluyen informacion general, branding, notificaciones, tracking, dias cerrados y chat.
**39. Informacion del Negocio**
La seccion de informacion permite editar los datos principales del negocio.
**Campos editables**

| Campo | Tipo | Validacion |
| --- | --- | --- |
| Nombre del negocio | Texto | Requerido, no vacio |
| Descripcion | Texto area | Opcional |
| Telefono | Telefono con prefijo | Opcional |
| Email | Email | Opcional |
| Sitio web | URL | Opcional |
| Direccion | Texto | Opcional |
| Ciudad | Selector | Opcional |
| NIT / RUT | Texto | Opcional |
| Razon social | Texto | Opcional |
| Atender en festivos | Toggle | Default segun negocio |


El boton 'Guardar' esta protegido por el permiso 'settings.edit_business'. Si el usuario no tiene este permiso, el boton estara deshabilitado (modo disable del PermissionGate).
**40. Logo y Banner (Branding)**
**Logo del negocio**

| Aspecto | Detalle |
| --- | --- |
| Tamano maximo | 2 MB |
| Formatos aceptados | JPEG, PNG, WebP |
| Proporcion | Cuadrado (1:1) con herramienta de recorte |
| Fallback | Iniciales del negocio como avatar |


**Banner del negocio**

| Aspecto | Detalle |
| --- | --- |
| Tamano maximo | 5 MB |
| Formatos aceptados | JPEG, PNG, WebP |
| Proporcion | Horizontal (16:9) con herramienta de recorte |
| Fallback | Texto 'Sin banner aun' centrado |


**Flujo de carga**
- Hacer clic en el area del logo o banner.
- Seleccionar archivo desde el explorador de archivos.
- Se valida el tipo y tamano del archivo.
- Se abre la herramienta de recorte con la proporcion correspondiente.
- Confirmar el recorte.
- La imagen se sube al almacenamiento y se actualiza la URL en la base de datos.
- Se aplica cache-bust para que la nueva imagen se muestre inmediatamente.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Seccion de branding con logo y banner |


**41. Configuracion de Notificaciones**
El administrador puede configurar los canales de notificacion, prioridades y tipos de notificaciones para su negocio.
**Canales disponibles**

| Canal | Estado | Descripcion |
| --- | --- | --- |
| Email | Disponible | Notificaciones por correo electronico via Brevo |
| SMS | No disponible aun | Switch deshabilitado con mensaje informativo |
| WhatsApp | Disponible | Mensajes via WhatsApp Business API |


**Prioridad de canales**
Los canales se ordenan por prioridad con botones de flecha arriba/abajo. El canal con prioridad #1 se usa primero; si falla, se intenta con el #2, luego el #3.
**Sistema de respaldo (Fallback)**
Toggle para activar el intento automatico del siguiente canal si el primero falla. Recomendado mantener activado para maximizar la entrega de notificaciones.
**Tiempos de recordatorio**
Lista configurada de tiempos antes de la cita para enviar recordatorios. Ejemplo: 24 horas y 2 horas antes de la cita. Formato legible con badge de minutos.
**Tipos de notificacion (6)**

| Tipo | Descripcion |
| --- | --- |
| Recordatorio de cita | Aviso antes de una cita programada |
| Confirmacion de cita | Confirmacion al crear una cita |
| Cancelacion de cita | Aviso al cancelar una cita |
| Cita reprogramada | Aviso al cambiar horario de una cita |
| Solicitud de empleado | Cuando un empleado solicita unirse al negocio |
| Resumen diario | Resumen de la actividad del dia anterior |


**Avanzado**
- Maximo de reintentos: configurable de 1 a 5 intentos por notificacion.
**Defaults automaticos**
Si es la primera vez que se accede a la configuracion, el sistema crea automaticamente los defaults: Email y WhatsApp habilitados, SMS deshabilitado, prioridad WhatsApp > Email > SMS, recordatorios a las 24h y 2h antes, zona horaria America/Bogota, ventana de envio 08:00-22:00.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Configuracion de canales de notificacion |


**42. Tracking de Notificaciones**
La seccion de tracking permite monitorear el estado de todas las notificaciones enviadas por el negocio, con estadisticas, graficos y filtros avanzados.
**Estadisticas principales (4 tarjetas)**

| Tarjeta | Descripcion |
| --- | --- |
| Total | Numero total de notificaciones enviadas |
| Exitosas | Notificaciones entregadas correctamente |
| Fallidas | Notificaciones que no pudieron entregarse |
| Tasa de exito | Porcentaje de entrega exitosa |


**Graficos (3)**
- Por Canal — Grafico circular por canal: distribucion email/sms/whatsapp.
- Por Estado — Grafico circular por estado: enviadas/fallidas/pendientes.
- Top 5 Tipos — Grafico de barras: top 5 tipos de notificacion mas frecuentes.
**Filtros (6)**

| Filtro | Opciones |
| --- | --- |
| Canal | Todos, Email, SMS, WhatsApp |
| Estado | Todos, Enviada, Fallida, Pendiente |
| Tipo | Todos + 17 tipos de notificacion |
| Fecha desde | Selector de fecha |
| Fecha hasta | Selector de fecha |
| Buscar | Por email o telefono del destinatario |


**Exportacion CSV**
Boton 'Exportar' que descarga un archivo CSV con todas las notificaciones filtradas. Columnas: Fecha, Tipo, Canal, Destinatario, Estado, Error, Reintentos, ID Externo.
**Tabla de detalle**
Tabla con las ultimas 500 notificaciones, ordenadas por fecha descendente. Columnas: Fecha (formato dd/mm/yyyy HH:mm), Tipo, Canal, Destinatario, Estado (con badge), Error.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Dashboard de tracking de notificaciones con graficos |


**43. Dias Cerrados**
El administrador puede definir dias en los que el negocio estara cerrado. Los clientes no podran reservar citas en dias cerrados.
**Agregar dia cerrado**
- Seleccionar fecha en el calendario (dias pasados y ya cerrados estan deshabilitados).
- Seleccionar alcance: 'Todas las sedes' o una sede especifica.
- Opcionalmente escribir una razon (maximo 120 caracteres).
- Hacer clic en 'Agregar dia cerrado'.
**Tabla de dias cerrados**

| Columna | Descripcion |
| --- | --- |
| Fecha | Fecha en formato espanol |
| Sede | 'Todas' o nombre de la sede especifica |
| Razon | Texto libre o vacio |
| Acciones | Boton de papelera para eliminar el dia cerrado |


Solo se muestran dias cerrados futuros, ordenados por fecha ascendente.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Configuracion de dias cerrados con calendario |


**44. Configuracion del Chat**
El administrador puede configurar el sistema de chat del negocio.
- Toggle principal: 'Permitir chat con profesionales' — activa o desactiva el chat entre clientes y empleados del negocio.
- Administrador de chat por sede: permite asignar un empleado especifico como administrador del chat para cada sede activa.
- Candidatos: solo empleados con nivel de jerarquia 0 o 1 (managers).
- Default: 'Usar propietario (por defecto)'.

| Nota sobre el Plan Gratuito Aunque el chat se puede configurar desde las opciones, el modulo de chat como tal no esta incluido en el Plan Gratuito. Para habilitar la mensajeria en tiempo real con clientes, se requiere al menos el Plan Basico. |
| --- |


**45. Configuracion General (Tema e Idioma)**
- Tema — Tema: selector entre Claro, Oscuro y Sistema (sigue la preferencia del navegador).
- Idioma — Idioma: actualmente solo espanol esta disponible. El selector muestra las opciones pero esta deshabilitado.
**46. Edicion de Perfil Personal**
La pestana 'Perfil' en las configuraciones permite al administrador editar su informacion personal (no la del negocio).
- Nombre completo.
- Foto de perfil (upload a bucket avatars).
- Telefono personal.
- Tipo de documento y numero.
- Genero.
- Fecha de nacimiento.
**47. Zona de Peligro — Desactivar Cuenta**
La Zona de Peligro permite al usuario desactivar permanentemente su cuenta. Es un proceso de dos pasos con multiples confirmaciones para evitar errores.
**Paso 1 — Consentimiento**
- Se muestra advertencia en rojo: 'Esta accion desactivara tu cuenta'.
- El usuario debe ingresar su email de confirmacion (debe coincidir exactamente).
- El usuario debe marcar un checkbox: 'Entiendo que esta accion es irreversible'.
- Boton 'Continuar con la desactivacion' — deshabilitado hasta completar ambos requisitos.
**Paso 2 — Confirmacion final**
- El usuario debe escribir exactamente: DESACTIVAR CUENTA (sensible a mayusculas/minusculas).
- Boton 'Desactivar mi cuenta permanentemente' (rojo) — deshabilitado hasta que el texto coincida.
**Ejecucion**
- Se llama a la funcion RPC 'deactivate_user_account'.
- Se cierra la sesion del usuario.
- Se limpia todo el almacenamiento local.
- Se redirige a la pagina de login despues de 2 segundos.

| Irreversible Una vez desactivada la cuenta, no es posible recuperarla. Todos los datos del usuario seran inaccesibles. Si el usuario administra negocios, estos quedaran sin administrador. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Zona de peligro — proceso de desactivacion de cuenta |


**48. Limites del Plan Gratuito — Resumen**

| Recurso | Limite | Comportamiento al exceder |
| --- | --- | --- |
| Sedes | 1 | Boton 'Agregar Sede' deshabilitado con tooltip. Banner informativo. |
| Empleados | 1 | Excedentes no mostrados. Banner informativo. |
| Citas/mes | 50 | Controlado por quotaInfo. Banner informativo. |
| Clientes visibles | 50 | Solo 50 visibles. Todos almacenados en BD. Banner informativo. |
| Servicios | 15 | Solo 15 visibles. Excedentes ocultos. Banner informativo. |


| Los datos siempre se conservan Aunque el Plan Gratuito limita la visualizacion, todos los datos se almacenan en la base de datos sin restriccion. Al actualizar a un plan superior, toda la informacion estara inmediatamente disponible. |
| --- |


**49. Modulos Bloqueados y Pantalla de Upgrade**
Cuando el administrador intenta acceder a un modulo que no esta incluido en su plan, el sistema muestra una pantalla de upgrade en lugar del contenido del modulo.
**Pantalla de upgrade (PlanGate)**
- Icono de candado grande con efecto sparkle.
- Texto: 'Modulo disponible en Plan {Basico/Pro}'.
- Boton CTA: 'Ver planes y precios' que navega a /app/admin/billing.
**Modos de bloqueo**

| Modo | Comportamiento |
| --- | --- |
| upgrade (default) | Pantalla completa con candado, nombre del modulo y boton CTA |
| hide | No renderiza nada — el modulo desaparece completamente |
| disable | Contenido visible pero opaco (40%), sin interactividad, overlay con texto |


En el sidebar, los modulos bloqueados muestran un icono de candado y un badge con el nombre del plan requerido (ej: 'Basico', 'Pro').
**50. Banner de Limite Alcanzado**
Cuando la cantidad de registros excede el limite del plan, aparece un banner informativo al final de la lista del modulo correspondiente.
- Fondo ambar suave con borde ambar.
- Icono de candado + texto: '{N} {recurso} adicionales disponibles al actualizar'.
- Sub-texto: 'Actualiza al Plan {Basico/Pro} para ver todos los registros'.
- Boton 'Actualizar plan' que navega a la seccion de facturacion.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Banner de limite alcanzado en la lista de servicios |


**51. Permisos del Administrador (PermissionGate)**
El sistema de permisos granulares protege cada boton de accion en la interfaz. Como propietario (owner) del negocio, el administrador tiene bypass total — todos los permisos son concedidos automaticamente sin consulta a la base de datos.
**Categorias de permisos relevantes para el admin**

| Categoria | Permisos incluidos |
| --- | --- |
| services.* | create, edit, delete, view |
| locations.* | create, edit, delete, view |
| appointments.* | create, edit, delete, cancel |
| settings.* | edit, edit_business |
| notifications.* | manage |
| billing.* | manage, view |


Si el negocio tiene administradores adicionales (no owners), estos dependen de los permisos asignados individualmente. Los botones protegidos por PermissionGate se ocultan (mode=hide) o se deshabilitan (mode=disable) segun el permiso y el modo configurado.

**52. Gestion de Multiples Negocios**
Un usuario puede ser propietario de varios negocios. El sistema permite cambiar entre ellos de forma fluida.
**Dropdown de negocios**
- Ubicado en el encabezado del AdminDashboard.
- Muestra el nombre del negocio activo.
- Lista desplegable con todos los negocios del usuario.
- Opcion 'Crear nuevo negocio' al final de la lista.
**Flujo de cambio**
- Hacer clic en el nombre del negocio en el encabezado.
- Seleccionar otro negocio de la lista.
- El sistema guarda la seleccion en localStorage y recarga todos los datos del dashboard.
- Todos los modulos se actualizan con los datos del nuevo negocio.
**53. Cambio de Rol (Admin / Empleado / Cliente)**
El usuario puede cambiar entre sus roles disponibles en cualquier momento.
- Selector de roles en el encabezado (junto al avatar).
- Roles disponibles se calculan automaticamente segun la relacion con negocios.
- Al cambiar de rol, se recarga el dashboard correspondiente (AdminDashboard, EmployeeDashboard o ClientDashboard).
- El rol activo se guarda en localStorage y se restaura al iniciar sesion.
**54. Estados de Carga, Error y Vacios**
Cada modulo del administrador maneja los siguientes estados:

| Estado | Indicador visual | Descripcion |
| --- | --- | --- |
| Carga | Skeleton / Spinner | Placeholders animados o indicador circular mientras se cargan datos |
| Error | Toast rojo / Sentry | Mensaje de error con registro en Sentry para monitoreo |
| Vacio sin datos | Icono + mensaje + CTA | Icono grande, texto descriptivo y boton para crear el primer registro |
| Vacio con filtros | Texto sugerencia | Sugiere cambiar filtros o activar opciones adicionales |
| Error de permisos | Mensaje 403 | Deteccion especifica de errores RLS/permisos con mensaje en espanol |


**55. Glosario de Terminos**

| Termino | Definicion |
| --- | --- |
| Owner / Propietario | Usuario que creo el negocio. Tiene bypass total de permisos. |
| Admin | Usuario con rol administrativo asignado. Sus permisos dependen de las plantillas. |
| Sede | Ubicacion fisica del negocio donde se prestan los servicios. |
| Sede Principal | La sede por defecto del negocio. Solo una puede serlo. |
| Sede Preferida | La sede que el admin selecciona como filtro predeterminado. |
| Setup Checklist | Asistente de configuracion que guia al admin para completar su negocio. |
| PlanGate | Componente que bloquea modulos no incluidos en el plan actual. |
| PlanLimitBanner | Banner que informa cuantos registros estan ocultos por limite del plan. |
| PermissionGate | Componente que protege botones de accion segun permisos del usuario. |
| Soft-delete | Eliminacion logica (is_active = false) que preserva el historial. |
| Two-step query | Patron de consulta en dos pasos para obtener datos relacionados. |
| Cache-bust | Tecnica para forzar al navegador a cargar una imagen actualizada. |
| Slug | URL amigable del negocio (ej: salon-belleza-medellin). |
| COP | Pesos colombianos — moneda predeterminada del sistema. |
| Edge Function | Funcion serverless en Supabase para logica del lado del servidor. |
| Webhook | Notificacion automatica de la pasarela de pago al confirmar transaccion. |
| RPC | Remote Procedure Call — funcion SQL invocada desde el cliente. |
| Free Trial | Periodo de prueba gratuito de 30 dias del Plan Basico. |


*Fin de la Parte 3 — Administrador Plan Gratuito.*
*Continua en la Parte 4: Administrador Plan Basico.*

**GESTABIZ**
**Manual de Usuario — Gestabiz**
*Guia funcional completa del sistema de gestion de citas y negocios*
**Parte 4 de 5: Administrador — Plan Basico**
Version del producto: 1.0.3   |   Abril 2026
*Fase Beta completada   |   Listo para produccion*

**Desarrollado por Ti Turing**
**INDICE DE CONTENIDOS**
*A continuacion se listan todas las secciones cubiertas en esta parte. Haga clic en cualquier titulo para navegar directamente al detalle.*
1. Resumen Ejecutivo — Plan Basico
2. Que incluye el Plan Basico
3. Comparativa de Limites: Gratuito vs. Basico
4. Como Activar el Plan Basico
5. Prueba Gratuita de 30 Dias
6. Gestion de Empleados
7. Dashboard de Empleados — Vista General
8. Tarjetas de Estadisticas de Empleados
9. Filtros y Busqueda de Empleados
10. Modos de Vista (Lista y Mapa Jerarquico)
11. Invitar Empleados (Codigo QR de 6 Digitos)
12. Solicitudes de Ingreso Pendientes
13. Empleados Pendientes de Configuracion
14. Modal de Perfil de Empleado
15. Horarios del Empleado (7 Dias)
16. Hora de Almuerzo del Empleado
17. Configuracion de Salario
18. Asignacion de Servicios al Empleado
19. Activar y Desactivar Empleados
20. Limite de Empleados en Plan Basico (6)
21. Gestion de Ausencias y Vacaciones (Admin)
22. Politica de Aprobacion Obligatoria
23. Pestana Pendientes — Aprobar o Rechazar
24. Tarjeta de Aprobacion de Ausencia — Detalle
25. Tipos de Ausencia y Colores
26. Citas Afectadas por una Ausencia
27. Pestana Historial de Ausencias
28. Widget de Balance de Vacaciones
29. Festivos Publicos y su Impacto
30. Notificaciones de Ausencias
31. Historial de Ventas
32. Tarjetas de Resumen de Ventas
33. Filtros de Periodo y Busqueda
34. Lista de Ventas Completadas
35. Ver Perfil de Cliente desde Ventas
36. Ventas Rapidas (Walk-In)
37. Formulario de Venta Rapida — Campos
38. Metodos de Pago Disponibles
39. Autocompletado de Monto por Servicio
40. Estadisticas de Ventas Rapidas
41. Historial de Ultimas 10 Ventas
42. Integracion Contable de Ventas Rapidas
43. Reportes Financieros
44. Dashboard Financiero Interactivo
45. Graficos Disponibles
46. Filtros del Dashboard Financiero
47. Exportacion de Reportes (Nota de Plan)
48. Gestion de Permisos
49. Tabla de Usuarios y Roles
50. Acciones sobre Permisos
51. Plantillas de Permisos (3 Predefinidas)
52. Estadisticas de Usuarios y Roles
53. Limites Ampliados — Sedes, Servicios, Citas, Clientes
54. Gestion de hasta 3 Sedes
55. Servicios Ilimitados
56. Citas Ilimitadas por Mes
57. Clientes Ilimitados
58. Funcionalidades Adicionales de Planes de Pago
59. Recordatorios por WhatsApp
60. Sincronizacion con Google Calendar
61. Modulos Bloqueados — Solo en Plan Pro
62. Como Actualizar al Plan Pro
63. Soporte y Ayuda
64. Glosario de Terminos del Plan Basico

**PARTE 1 — RESUMEN EJECUTIVO**
Esta seccion presenta a grandes rasgos las capacidades exclusivas del Plan Basico de Gestabiz. Para el detalle exhaustivo de cada funcionalidad, consulte la Parte 2.
**1. Resumen Ejecutivo — Plan Basico**
El Plan Basico de Gestabiz ($89,900 COP/mes o $899,000 COP/ano con 2 meses gratis) esta disenado para negocios que necesitan crecer mas alla de las limitaciones del Plan Gratuito. Incluye todo lo del Plan Gratuito mas seis modulos exclusivos y limites ampliados que permiten gestionar un equipo de hasta 6 empleados, multiples sedes y un volumen ilimitado de citas, clientes y servicios.
Los seis modulos exclusivos del Plan Basico son:
- Empleados — Gestionar hasta 6 empleados con invitaciones por codigo QR, horarios por dia, salarios, asignacion de servicios y jerarquia organizacional.
- Ausencias — Aprobar o rechazar solicitudes de ausencias y vacaciones de los empleados, con calculo automatico de balance de vacaciones y bloqueo de citas.
- Historial de Ventas — Consultar el historial completo de citas completadas con ingresos, filtrado por periodo y busqueda por cliente o servicio.
- Ventas Rapidas — Registrar ventas presenciales (walk-in) de clientes que llegan sin cita previa, con integracion contable automatica.
- Reportes Financieros — Acceder a un dashboard financiero interactivo con graficos de ingresos, gastos, distribucion por categoria y tendencias mensuales.
- Permisos — Controlar que pueden hacer los empleados en la plataforma mediante plantillas de permisos predefinidas.
Ademas, los limites se amplian significativamente:

| Recurso | Plan Gratuito | Plan Basico |
| --- | --- | --- |
| Sedes | 1 | 3 |
| Empleados | 1 (solo owner) | 6 |
| Citas por mes | 50 | Ilimitadas |
| Clientes visibles | 50 | Ilimitados |
| Servicios | 15 | Ilimitados |


| Incluye todo lo del Plan Gratuito El Plan Basico hereda todas las funcionalidades descritas en la Parte 3 de este manual (Dashboard, Servicios, Sedes, Calendario, Clientes CRM, Facturacion, Configuraciones, Perfil Publico, QR, etc.) sin restricciones adicionales. Esta parte documenta unicamente las funcionalidades NUEVAS y los limites ampliados. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Sidebar del admin con modulos del Plan Basico desbloqueados |


**2. Que incluye el Plan Basico**
El Plan Basico de Gestabiz incluye tres grandes categorias de mejoras respecto al Plan Gratuito:
**A. Modulos exclusivos desbloqueados**
Seis modulos que estaban bloqueados en el Plan Gratuito se desbloquean al activar el Plan Basico. Cada uno aparece en la barra lateral sin el icono de candado y es completamente funcional.

| Modulo | Icono Sidebar | Descripcion Corta |
| --- | --- | --- |
| Empleados | Users | Gestion de hasta 6 empleados con jerarquia |
| Ausencias | CalendarOff | Aprobacion de ausencias y vacaciones |
| Ventas | BarChart3 | Historial de citas completadas con ingresos |
| Ventas Rapidas | ShoppingCart | Registro de ventas walk-in |
| Reportes | FileText | Dashboard financiero con graficos |
| Permisos | Shield | Gestion de permisos por plantillas |


**B. Limites ampliados en modulos existentes**
Los modulos que ya estaban disponibles en el Plan Gratuito ahora operan con limites mucho mas generosos o directamente sin limites.
**C. Funcionalidades adicionales de planes de pago**
Al ser un plan de pago, el Plan Basico tambien habilita:
- Recordatorios automaticos de citas a clientes por WhatsApp Business API.
- Sincronizacion bidireccional con Google Calendar para el admin y empleados.
- Soporte prioritario por email.

**3. Comparativa de Limites: Gratuito vs. Basico**
La siguiente tabla muestra la comparativa completa de limites y funcionalidades entre el Plan Gratuito y el Plan Basico.

| Caracteristica | Plan Gratuito | Plan Basico |
| --- | --- | --- |
| Precio mensual | $0 COP | $89,900 COP |
| Precio anual | $0 COP | $899,000 COP (2 meses gratis) |
| Sedes | 1 | 3 |
| Empleados | 1 (solo owner) | 6 |
| Citas por mes | 50 | Ilimitadas |
| Clientes visibles | 50 | Ilimitados |
| Servicios | 15 | Ilimitados |
| Dashboard Resumen | Si | Si |
| Calendario de Citas | Si | Si |
| Gestion de Servicios | Si (hasta 15) | Si (ilimitados) |
| Gestion de Sedes | Si (1 sede) | Si (hasta 3) |
| CRM Clientes | Si (50 visibles) | Si (ilimitados) |
| Perfil Publico y SEO | Si | Si |
| Codigo QR | Si | Si |
| Facturacion y Planes | Si (vista) | Si (completa) |
| Configuraciones | Si | Si |
| Gestion de Empleados | No | Si (hasta 6) |
| Ausencias y Vacaciones | No | Si |
| Historial de Ventas | No | Si |
| Ventas Rapidas | No | Si |
| Reportes Financieros | No | Si (vista, sin exportacion) |
| Permisos | No | Si (3 plantillas) |
| Gestion de Gastos | No | No (Plan Pro) |
| Reclutamiento | No | No (Plan Pro) |
| Recursos Fisicos | No | No (Plan Pro) |
| Exportacion de Reportes | No | No (Plan Pro) |
| Permisos Granulares (79) | No | No (Plan Pro) |
| WhatsApp Recordatorios | No | Si |
| Google Calendar Sync | No | Si |
| Soporte | Comunidad | Email prioritario |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Pagina de precios con los tres planes comparados |


**4. Como Activar el Plan Basico**
Existen dos rutas para activar el Plan Basico desde el panel de administracion:
**Ruta 1: Desde la Barra Lateral**
- Haga clic en cualquier modulo bloqueado en la barra lateral (por ejemplo, 'Empleados').
- El sistema muestra una pantalla de upgrade con un icono de candado grande, un badge ambar con estrellas y el texto 'Modulo disponible en Plan Basico'.
- Haga clic en el boton 'Ver planes y precios'.
- El sistema navega a la seccion de Facturacion (/app/admin/billing) donde se muestra la pagina de precios.
- Seleccione el Plan Basico (mensual o anual) y complete el pago.
**Ruta 2: Desde Facturacion**
- Navegue a Facturacion en la barra lateral.
- En la vista del plan actual, haga clic en 'Cambiar plan' o 'Actualizar'.
- Seleccione el Plan Basico y complete el proceso de pago.

| Metodos de pago aceptados Gestabiz soporta tres pasarelas de pago: Stripe (tarjetas internacionales), PayU Latam (tarjetas colombianas, PSE, efectivo) y MercadoPago (Argentina, Brasil, Mexico, Chile). La pasarela activa depende de la configuracion del negocio. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Pantalla de upgrade (PlanGate) al intentar acceder a un modulo bloqueado |


**5. Prueba Gratuita de 30 Dias**
Todo nuevo negocio tiene la opcion de activar una prueba gratuita del Plan Basico por 30 dias antes de decidir si desea pagar. Esta prueba se puede activar una sola vez por cada owner (propietario del negocio).
**Reglas de la Prueba Gratuita**
- Duracion: exactamente 30 dias calendario desde la activacion.
- Activacion: una sola vez por owner, independientemente del numero de negocios.
- Funcionalidades: acceso completo a todos los modulos y limites del Plan Basico.
- Al finalizar: el negocio vuelve automaticamente al Plan Gratuito si no se paga.
- Datos conservados: los datos creados durante la prueba se conservan, pero los modulos exclusivos se bloquean nuevamente.
- Notificacion: el sistema avisa con 7 dias de anticipacion antes de que expire.
**Como Activar la Prueba**
- En la pagina de Facturacion, localice el banner 'Prueba gratuita de 30 dias'.
- Haga clic en 'Activar prueba gratuita'.
- El sistema activa inmediatamente el Plan Basico sin requerir datos de pago.
- Un contador muestra los dias restantes de la prueba en la seccion de Facturacion.

| Sin compromiso No se requiere tarjeta de credito ni datos de pago para activar la prueba gratuita. Al terminar los 30 dias, simplemente se revierte al Plan Gratuito automaticamente. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Banner de prueba gratuita en la seccion de Facturacion |


**PARTE 2 — DETALLE EXHAUSTIVO DE FUNCIONALIDADES**
A continuacion se documenta en detalle cada modulo exclusivo del Plan Basico, incluyendo todos los elementos de interfaz, flujos normales y alternos, reglas de negocio, validaciones, estados y excepciones.
**GESTION DE EMPLEADOS**
El modulo de Empleados permite al administrador gestionar un equipo de hasta 6 personas, organizado en una jerarquia visual con niveles definidos. Desde aqui se invitan nuevos miembros, se configuran horarios, salarios, servicios ofrecidos y se gestionan las solicitudes de ingreso.
**7. Dashboard de Empleados — Vista General**
Al acceder al modulo de Empleados desde la barra lateral, se presenta un dashboard completo con las siguientes secciones visibles:
- Encabezado con titulo 'Gestion de Empleados' y subtitulo descriptivo.
- Botones de cambio de vista: Lista (icono List) y Mapa jerarquico (icono Network).
- Boton 'Invitar' (icono QrCode) para generar codigos de invitacion.
- Boton 'Solicitudes' (icono Users) para ver solicitudes de ingreso pendientes.
- Tarjetas de estadisticas (4 cards en fila).
- Barra de filtros con busqueda, filtro por nivel y tipo.
- Contenido principal segun la vista seleccionada (lista o mapa).
- Banner de limite de plan (si se excede el limite de 6 empleados).

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Dashboard de gestion de empleados con vista de lista |


**8. Tarjetas de Estadisticas de Empleados**
En la parte superior del modulo se muestran 4 tarjetas con estadisticas en tiempo real:

| Tarjeta | Icono | Dato Mostrado | Descripcion |
| --- | --- | --- | --- |
| Total Empleados | Users | Numero total | Cuenta todos los empleados registrados |
| Por Nivel | (grid 5 col) | Prop./Admin/Ger./Lider/Pers. | Distribucion por nivel jerarquico |
| Ocupacion Promedio | — | Porcentaje (ej. 75.3%) | Promedio de ocupacion del equipo |
| Rating Promedio | Star (amarilla) | Puntuacion (ej. 4.5) | Calificacion promedio de reviews |


**Detalle de la tarjeta Por Nivel**
La tarjeta de distribucion por nivel muestra un grid de 5 columnas con las abreviaturas y la cantidad de empleados en cada nivel:

| Nivel | Abreviatura | Significado |
| --- | --- | --- |
| 0 | Prop. | Propietario (owner) |
| 1 | Admin | Administrador |
| 2 | Ger. | Gerente de sede |
| 3 | Lider | Lider de equipo |
| 4 | Pers. | Personal operativo |


**9. Filtros y Busqueda de Empleados**
La barra de filtros permite refinar la lista de empleados con los siguientes controles:
- Boton Filtros — Boton expandible con badge que cuenta filtros activos. Al hacer clic se despliega el panel completo de filtros (FiltersPanel).
- Boton Limpiar filtros — Solo visible si hay filtros aplicados. Resetea todos los filtros a su estado inicial.
- Incluir personal sin sede — Toggle que incluye o excluye empleados que no tienen sede asignada.
- Contador — Muestra la cantidad de empleados visibles despues de aplicar filtros.
**Campos del Panel de Filtros (FiltersPanel)**

| Campo | Tipo | Opciones | Pre-seleccion |
| --- | --- | --- | --- |
| Busqueda | Input texto | Nombre o email | Vacio |
| Nivel jerarquico | Select | Todos / Prop. / Admin / Ger. / Lider / Personal | Todos |
| Tipo de empleado | Select | Todos / Profesional / Recepcionista / Contador / etc. | Todos |
| Departamento | Select | Segun configuracion | Todos |
| Sede | Select | Todas / cada sede del negocio | Sede preferida (si configurada) |


| Pre-seleccion inteligente de sede Si el administrador tiene una sede preferida configurada (ver Parte 3 — Sede Preferida), el filtro de sede se pre-selecciona automaticamente con esa sede al abrir el modulo. |
| --- |


**10. Modos de Vista (Lista y Mapa Jerarquico)**
**Vista de Lista**
Muestra a los empleados en formato de tarjetas (cards) con la siguiente informacion por cada uno:
- Avatar del empleado (foto o iniciales).
- Nombre completo y email.
- Badge de rol (Admin, Profesional, Recepcionista, etc.).
- Badge de nivel jerarquico con color.
- Nombre de la sede asignada.
- Estado (Activo en verde o Inactivo en rojo).
- Botones de accion: Ver perfil, Editar, Asignar supervisor.
**Vista de Mapa Jerarquico**
Muestra la estructura organizacional del negocio en un diagrama de arbol visual (HierarchyMapView) donde:
- Cada nodo es un empleado con su avatar, nombre y nivel.
- Las lineas conectan supervisores con sus reportes directos.
- Se puede navegar por niveles para ver la estructura completa.
- Hacer clic en un nodo abre el modal de perfil del empleado.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Vista de mapa jerarquico de empleados con conexiones |


**11. Invitar Empleados (Codigo QR de 6 Digitos)**
El sistema de invitacion permite al administrador generar codigos unicos que los nuevos empleados pueden usar para unirse al negocio.
**Flujo Normal de Invitacion**
- El administrador hace clic en el boton 'Invitar' (icono QrCode) en el header del modulo.
- Se abre un dialog (modal) con el titulo 'Invitar empleado' y la descripcion 'Se generara un codigo de 6 digitos que caduca en 24 horas'.
- El administrador hace clic en 'Generar codigo'.
- El sistema genera un codigo aleatorio de 6 digitos y lo muestra en grande en el dialog.
- Debajo se muestran los codigos activos con su fecha de expiracion.
- El administrador comparte el codigo con el nuevo empleado (por WhatsApp, SMS, verbal, etc.).
- El empleado ingresa el codigo en su app para unirse al negocio.
- El sistema crea la solicitud de ingreso que el admin puede aprobar.
**Reglas del Codigo de Invitacion**
- El codigo es de 6 digitos numericos aleatorios.
- Expira automaticamente a las 24 horas de su generacion.
- Se pueden tener multiples codigos activos simultaneamente.
- Cada codigo es de un solo uso — una vez utilizado, se invalida.
- El boton 'Generar codigo' se deshabilita mientras hay una generacion pendiente.

| Seguridad del codigo El codigo de invitacion solo permite al empleado solicitar unirse al negocio, no le da acceso automatico. El administrador debe aprobar la solicitud antes de que el empleado pueda operar en el negocio. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Dialog de invitacion con codigo generado de 6 digitos |


**12. Solicitudes de Ingreso Pendientes**
Cuando un empleado utiliza un codigo de invitacion, se genera una solicitud de ingreso que el administrador debe gestionar.
**Acceso**
El boton 'Solicitudes' en el header del modulo de Empleados tiene un estado visual que indica si hay solicitudes pendientes (variant='default' cuando hay, 'outline' cuando no).
**Flujo de Aprobacion**
- Al hacer clic en 'Solicitudes', se muestra la lista de solicitudes pendientes.
- Cada solicitud muestra: nombre del solicitante, email, fecha de solicitud y el codigo usado.
- El administrador puede Aprobar o Rechazar cada solicitud.
- Al aprobar: el empleado se registra en business_employees con status='approved' y recibe una notificacion.
- Al rechazar: el solicitante recibe notificacion de rechazo.
**13. Empleados Pendientes de Configuracion**
Cuando un empleado nuevo es aprobado pero aun no tiene un supervisor (jefe directo) asignado, el sistema muestra una alerta prominente.
**Alerta Visual**
En la parte superior del modulo aparece una tarjeta con borde ambar y un icono de triangulo de alerta con el siguiente contenido:
- Titulo: '{N} empleado(s) pendiente(s) de configuracion'.
- Badge: 'Sin jefe directo' (ambar).
- Texto explicativo: 'No apareceran disponibles para recibir citas hasta que se les asigne un jefe directo'.
**Accion de Asignar Jefe Directo**
Por cada empleado pendiente se muestra:
- Avatar e informacion del empleado (nombre y email).
- Un select desplegable con la lista de supervisores validos (empleados de nivel jerarquico superior al del empleado pendiente).
- Botones de confirmacion (Check verde) y cancelacion (X rojo).

| Regla de negocio critica Un empleado que no tiene jefe directo asignado NO aparecera disponible para recibir citas en el wizard de reserva. Es indispensable completar esta configuracion para que el empleado pueda operar normalmente. |
| --- |


**14. Modal de Perfil de Empleado**
Al hacer clic en 'Ver perfil' de cualquier empleado, se abre un modal completo con toda la informacion detallada del empleado.
**Contenido del Modal**
- Foto de perfil (avatar) o iniciales si no tiene foto.
- Nombre completo, email y telefono.
- Rol dentro del negocio (Admin, Profesional, Recepcionista, etc.).
- Nivel jerarquico con badge de color.
- Sede asignada.
- Fecha de contratacion (hire_date).
- Estado: Activo o Inactivo.
- Lista de servicios que ofrece.
- Horarios configurados por dia de la semana.
- Informacion salarial (si tiene permisos para verla).
- Balance de vacaciones (dias disponibles, usados, pendientes).
- Rating promedio de reviews de clientes.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Modal de perfil de empleado con informacion completa |


**15. Horarios del Empleado (7 Dias)**
Cada empleado tiene un horario configurable para los 7 dias de la semana. Esta configuracion se realiza desde el panel de Configuraciones del empleado (CompleteUnifiedSettings, tab Preferencias de Empleado).
**Campos por cada dia**

| Campo | Tipo | Ejemplo | Requerido |
| --- | --- | --- | --- |
| Dia activo | Toggle (on/off) | Lunes: activo | Si |
| Hora inicio | Time picker | 08:00 | Si (si activo) |
| Hora fin | Time picker | 18:00 | Si (si activo) |


**Reglas**
- Si un dia esta desactivado, el empleado no esta disponible para citas ese dia.
- La hora de fin debe ser mayor que la hora de inicio.
- Los horarios se validan contra los horarios de la sede asignada.
- Los cambios se guardan inmediatamente al confirmar.
**16. Hora de Almuerzo del Empleado**
Cada empleado puede tener configurada una hora de almuerzo que bloquea automaticamente los slots de cita durante ese periodo.
**Campos**

| Campo | Tipo | Ejemplo |
| --- | --- | --- |
| Inicio almuerzo | Time picker | 12:00 |
| Fin almuerzo | Time picker | 13:00 |


**Impacto en el Sistema**
- Los slots de cita durante la hora de almuerzo se muestran deshabilitados en el wizard de reserva.
- Se muestra un tooltip 'Hora de almuerzo' en los slots bloqueados.
- La hora de almuerzo NO aplica retroactivamente a citas historicas (para dias pasados, isLunchBreak retorna false).
- Solo se almacena en business_employees.lunch_break_start y lunch_break_end.
**17. Configuracion de Salario**
La configuracion salarial del empleado se gestiona desde el panel de Configuraciones y esta protegida por permisos (solo usuarios con employees.edit_salary pueden verla o editarla).
**Campos de Salario**

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Salario base | Input numerico | Monto mensual en COP |
| Tipo de salario | Select | Fijo / Variable / Mixto |
| Comision | Input porcentaje | Porcentaje sobre ventas (si aplica) |
| Frecuencia de pago | Select | Quincenal / Mensual |


| Permiso requerido Solo los usuarios con el permiso 'employees.edit_salary' pueden ver y editar la informacion salarial. Esto se controla a traves del sistema de permisos (ver seccion 48). |
| --- |


**18. Asignacion de Servicios al Empleado**
Cada empleado puede ser asignado a uno o mas servicios del negocio. Solo los empleados asignados a un servicio aparecen como opciones en el wizard de reserva para ese servicio.
**Flujo de Asignacion**
- Acceda al perfil del empleado o a la seccion de asignaciones.
- Se muestra la lista de todos los servicios del negocio con checkboxes.
- Marque los servicios que el empleado puede realizar.
- Confirme la asignacion.
- El sistema guarda la relacion en la tabla employee_services.
- Ahora, cuando un cliente seleccione ese servicio en el wizard de reserva, el empleado aparecera como opcion.
**Regla de negocio**
- Un empleado puede estar asignado a multiples servicios.
- Un servicio puede tener multiples empleados asignados.
- Si un empleado no esta asignado a ningun servicio, no aparecera en el wizard de reserva para ningun servicio.
- La asignacion se almacena en la tabla employee_services con employee_id y service_id.
**19. Activar y Desactivar Empleados**
El administrador puede activar o desactivar empleados en cualquier momento.
**Impacto de Desactivar**
- El empleado desactivado NO aparece en el wizard de reserva para nuevas citas.
- Las citas existentes del empleado NO se cancelan automaticamente (deben gestionarse manualmente).
- El empleado desactivado no puede acceder a su panel de empleado del negocio.
- El empleado sigue existiendo en la base de datos (soft delete mediante is_active = false).
**Reactivacion**
- El administrador puede reactivar un empleado en cualquier momento.
- Al reactivar, el empleado vuelve a ser visible en el wizard de reserva y puede acceder a su panel.
**20. Limite de Empleados en Plan Basico (6)**
El Plan Basico permite gestionar hasta 6 empleados activos simultaneamente.
**Que ocurre al alcanzar el limite**
- Se muestra el banner PlanLimitBanner en la parte inferior del modulo con el texto: '{N} empleados no se muestran por limite del plan actual'.
- El banner incluye un boton 'Actualizar plan' que navega a la pagina de facturacion.
- Los empleados que exceden el limite NO se eliminan, simplemente no se muestran en la interfaz.
- Al actualizar al Plan Pro (15 empleados), todos los empleados vuelven a ser visibles.

| Los datos estan seguros Aunque un empleado no sea visible por el limite del plan, sus datos permanecen intactos en la base de datos. Al actualizar el plan, toda la informacion estara disponible. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Banner de limite de empleados con boton de actualizacion |


**GESTION DE AUSENCIAS Y VACACIONES**
El modulo de Ausencias permite al administrador gestionar las solicitudes de ausencia y vacaciones de todos los empleados del negocio. Este modulo es exclusivo del Plan Basico y superiores.
**22. Politica de Aprobacion Obligatoria**
En Gestabiz, la aprobacion de ausencias es SIEMPRE obligatoria. Esta es una regla de negocio no negociable que se aplica a todos los negocios sin excepcion.

| REGLA CRITICA: Aprobacion siempre requerida Ningun empleado puede tomar una ausencia o vacacion sin la aprobacion previa de un administrador. Esta politica se implementa a nivel de base de datos con el campo require_absence_approval = true (no parametrizable). Aplica para todos los tipos de ausencia: vacaciones, emergencia, incapacidad, personal y otros. |
| --- |


**Flujo Completo de una Solicitud**
- El empleado solicita una ausencia desde su panel (AbsenceRequestModal).
- El sistema envia notificacion in-app y email a TODOS los administradores y gerentes del negocio.
- La solicitud aparece en la pestana 'Pendientes' del modulo de Ausencias del admin.
- El administrador revisa la solicitud, opcionalmente agrega notas, y aprueba o rechaza.
- Si se aprueba: el balance de vacaciones se actualiza, las citas en el rango se cancelan automaticamente y el empleado recibe notificacion.
- Si se rechaza: el empleado recibe notificacion con la razon (si se proporciono).
**23. Pestana Pendientes — Aprobar o Rechazar**
La pestana 'Pendientes' muestra todas las solicitudes de ausencia que requieren la accion del administrador. El numero entre parentesis indica la cantidad de solicitudes pendientes.
**Estructura de la Vista**
- Tabs con 2 pestanas: 'Pendientes ({N})' y 'Historial ({N})'.
- Grid de tarjetas (AbsenceApprovalCard) para cada solicitud pendiente.
- Estado de carga: spinner animado centrado.
- Estado vacio: contenedor con borde punteado y texto 'No hay solicitudes pendientes'.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Pestana de solicitudes de ausencia pendientes |


**24. Tarjeta de Aprobacion de Ausencia — Detalle**
Cada solicitud de ausencia se presenta en una tarjeta (card) con toda la informacion necesaria para que el administrador tome una decision informada.
**Informacion Mostrada en la Tarjeta**

| Elemento | Icono | Descripcion |
| --- | --- | --- |
| Nombre empleado | User | Nombre completo del solicitante |
| Email empleado | — | Correo electronico del empleado |
| Tipo de ausencia | (badge color) | Vacaciones, Emergencia, Incapacidad, Personal u Otro |
| Rango de fechas | Calendar | Fecha inicio — Fecha fin |
| Duracion | (badge) | '{N} dias' calculado automaticamente |
| Fecha solicitud | Clock | Fecha y hora cuando se creo la solicitud |
| Razon | (fondo gris) | Texto de la razon proporcionada por el empleado |
| Notas del empleado | (italica) | Notas adicionales opcionales |
| Citas afectadas | AlertCircle | Cantidad de citas que seran canceladas (si aplica) |


**Botones de Accion**
Cada tarjeta tiene hasta 4 botones dependiendo del estado:

| Boton | Icono | Color | Accion |
| --- | --- | --- | --- |
| Agregar Nota | — | Outline (gris) | Muestra textarea para notas del admin |
| Aprobar | CheckCircle | Verde (green-600) | Aprueba la ausencia |
| Rechazar | XCircle | Rojo (destructive) | Rechaza la ausencia |
| Cancelar | — | Outline (gris) | Oculta el textarea de notas |


**Textarea de Notas del Administrador**
- Label: 'Notas para el Empleado (opcional)'.
- Placeholder: 'Comentarios adicionales...'.
- 2 filas de altura.
- Las notas se envian junto con la decision al empleado.
**Estados de Carga de los Botones**
- Mientras se procesa la accion, el boton muestra 'Aprobando...' o 'Rechazando...' con spinner.
- Todos los botones se deshabilitan durante el procesamiento para evitar doble envio.
**25. Tipos de Ausencia y Colores**
El sistema soporta 5 tipos de ausencia, cada uno con un color distintivo en la interfaz:

| Tipo | Label en Espanol | Color del Badge | Uso Tipico |
| --- | --- | --- | --- |
| vacation | Vacaciones | Azul | Descanso planificado |
| emergency | Emergencia | Rojo | Situacion imprevista urgente |
| sick_leave | Incapacidad | Amarillo | Enfermedad o certificado medico |
| personal | Personal | Morado | Asuntos personales |
| other | Otro | Gris | Cualquier otra razon |


**26. Citas Afectadas por una Ausencia**
Cuando un empleado solicita una ausencia, el sistema calcula automaticamente cuantas citas activas (no canceladas) caen dentro del rango de fechas solicitado.
**Visualizacion**
- Si hay citas afectadas, se muestra una tarjeta con fondo amarillo y un icono AlertCircle.
- El texto indica: '{N} cita(s) sera(n) cancelada(s)'.
- Subtexto: 'Los clientes recibiran notificacion por email y en la app'.
**Que ocurre al aprobar con citas afectadas**
- Al aprobar la ausencia, el sistema invoca automaticamente la Edge Function 'cancel-appointments-on-emergency-absence'.
- Todas las citas no canceladas del empleado en el rango de fechas se cancelan.
- Cada cliente afectado recibe notificacion por email y notificacion in-app.
- Los slots de cita del empleado se bloquean automaticamente en el wizard de reserva para el rango de la ausencia aprobada.

| Cancelacion automatica Las citas se cancelan automaticamente al aprobar la ausencia, no al solicitarla. Esto permite al administrador evaluar el impacto antes de tomar la decision. |
| --- |


**27. Pestana Historial de Ausencias**
La pestana 'Historial' muestra todas las solicitudes de ausencia ya procesadas (aprobadas y rechazadas) en formato de grid de tarjetas.
- Las tarjetas son identicas a las de la pestana Pendientes pero sin botones de accion.
- Se muestra el estado final (Aprobada o Rechazada) con el color correspondiente.
- Se incluyen las notas del administrador si las hubo.
- Estado vacio: 'No hay historial de ausencias'.
**28. Widget de Balance de Vacaciones**
El widget de balance de vacaciones (VacationDaysWidget) muestra el estado actual del derecho a vacaciones de cada empleado.
**Elementos del Widget**
- Header: icono Calendar + 'Vacaciones {ano}' + badge '15 dias totales' (default Colombia).
- Numero prominente en el centro: dias disponibles restantes (texto 4xl azul).
- Barra de progreso tricolor: verde (usados), amarillo (pendientes), azul (disponibles).
- Grid de 3 columnas con iconos:

| Metrica | Icono | Color | Descripcion |
| --- | --- | --- | --- |
| Usados | CheckCircle | Verde | Dias de vacaciones ya tomados |
| Pendientes | Clock | Amarillo | Dias solicitados pendientes de aprobacion |
| Libres | Calendar | Azul | Dias disponibles para solicitar |


**Reglas de Calculo**
- Los 15 dias son el default de vacaciones por ano en Colombia.
- El balance se calcula automaticamente: Total - Usados - Pendientes = Libres.
- Los festivos publicos se excluyen del calculo de dias de ausencia.
- El widget se actualiza en tiempo real al aprobar o rechazar ausencias.
**29. Festivos Publicos y su Impacto**
El sistema tiene precargados 54 festivos colombianos para los anos 2025-2027, que impactan tanto el calculo de vacaciones como la disponibilidad de citas.
**Impacto de los Festivos**
- En el calculo de ausencias: los festivos se excluyen del conteo de dias de ausencia. Si una ausencia de 5 dias incluye 1 festivo, solo se cuentan 4 dias de vacaciones.
- En el wizard de reserva: los slots de cita en dias festivos se bloquean automaticamente.
- En el calendario del admin: los dias festivos se marcan con indicador visual.
**Tipos de Festivos**
- Fijos (13 por ano): Ano Nuevo, Dia del Trabajo, Independencia, Navidad, etc.
- Moviles (5 por ano): basados en la fecha de Pascua — Carnaval, Semana Santa, Corpus Christi, etc.
**30. Notificaciones de Ausencias**
El sistema genera notificaciones automaticas en los siguientes eventos de ausencias:

| Evento | Destinatarios | Canales | Contenido |
| --- | --- | --- | --- |
| Solicitud creada | TODOS los admins/gerentes | In-app + Email | Nombre empleado, tipo, rango, razon |
| Ausencia aprobada | Empleado solicitante | In-app + Email | Confirmacion + notas del admin |
| Ausencia rechazada | Empleado solicitante | In-app + Email | Razon del rechazo + notas |
| Citas canceladas | Clientes afectados | In-app + Email | Empleado no disponible, reagendar |


**HISTORIAL DE VENTAS**
El modulo de Historial de Ventas permite al administrador consultar todas las citas completadas con sus ingresos asociados. Es una herramienta clave para hacer seguimiento de la facturacion y el rendimiento del negocio.
**32. Tarjetas de Resumen de Ventas**
En la parte superior del modulo se muestran 3 tarjetas con metricas clave del periodo seleccionado:

| Tarjeta | Icono | Formato | Descripcion |
| --- | --- | --- | --- |
| Citas completadas | CheckCircle2 | Numero entero | Total de citas con status=completed |
| Ingresos en periodo | DollarSign | COP (ej. $1.250.000) | Suma de precios de todas las citas completadas |
| Promedio por cita | TrendingUp | COP (ej. $45.000) | Division de ingresos / cantidad |


**33. Filtros de Periodo y Busqueda**
El modulo ofrece dos controles de filtrado:
**Filtro de Periodo**

| Opcion | Rango | Default |
| --- | --- | --- |
| Ultimos 7 dias | 7 dias atras — hoy | No |
| Ultimos 30 dias | 30 dias atras — hoy | Si (default) |
| Ultimos 90 dias | 90 dias atras — hoy | No |
| Ultimo ano | 365 dias atras — hoy | No |


**Campo de Busqueda**
- Icono de lupa (Search) a la izquierda.
- Placeholder: 'Buscar cliente o servicio...'.
- Filtra en tiempo real por nombre de cliente o nombre de servicio.
- La busqueda es local (client-side) sobre los datos ya cargados.
**34. Lista de Ventas Completadas**
La lista principal muestra cada venta completada como una tarjeta individual con la siguiente informacion:
- Fecha de la cita (dia y mes abreviado) en la columna izquierda.
- Separador vertical visual.
- Nombre del servicio realizado + hora formateada.
- Boton del cliente: avatar con iniciales + nombre (clickeable para abrir perfil).
- Precio del servicio en formato COP.
**Limite de Carga**
El sistema carga un maximo de 500 citas completadas por consulta. Para negocios con mayor volumen, se recomienda usar filtros de periodo mas cortos.
**Estados**
- Cargando: spinner (LoadingSpinner) centrado.
- Sin resultados con busqueda: icono CheckCircle2 + 'No se encontraron resultados para la busqueda'.
- Sin ventas en periodo: icono CheckCircle2 + 'No hay ventas completadas en este periodo'.
**35. Ver Perfil de Cliente desde Ventas**
Al hacer clic en el nombre de un cliente en la lista de ventas, se abre el ClientProfileModal con toda la informacion del cliente y su historial de citas.
El modal muestra dos pestanas: 'Informacion' (datos de contacto, estadisticas de visitas, fecha de primera y ultima visita) e 'Historial ({N})' (lista de todas las citas del cliente con servicio, fecha, estado y precio). Para mas detalle sobre este modal, consulte la Parte 3 del manual — seccion 33.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Historial de ventas con tarjetas de resumen y lista de citas |


**VENTAS RAPIDAS (WALK-IN)**
El modulo de Ventas Rapidas permite registrar ventas de clientes que llegan al negocio sin cita previa (walk-in). Es una herramienta esencial para capturar ingresos que de otro modo no quedarian registrados en el sistema.
**37. Formulario de Venta Rapida — Campos**
El formulario de registro de venta rapida contiene los siguientes campos:

| Campo | Tipo | Requerido | Icono | Validacion |
| --- | --- | --- | --- | --- |
| Nombre del Cliente | Input texto | Si | User | HTML required |
| Telefono | Input tel + prefijo | No | — | Selector de prefijo pais |
| Documento | Input texto | No | — | Libre |
| Correo Electronico | Input email | No | — | Validacion type=email |
| Servicio | Select desplegable | Si | Package | HTML required |
| Sede | Select desplegable | Si | MapPin | HTML required |
| Empleado que atendio | Select desplegable | No | — | Opcional |
| Monto Pagado (COP) | Input numerico | Si | — | min=0, step=100 |
| Metodo de Pago | Select desplegable | Si | CreditCard | 3 opciones |
| Notas | Textarea (2 filas) | No | — | Libre |


**Comportamiento Especial del Campo Sede**
El campo de sede utiliza un sistema de doble cache para pre-seleccionar automaticamente:
- Primero busca en localStorage la ultima sede usada para ventas rapidas (clave: quick-sale-location-{businessId}).
- Si no encuentra, usa la sede preferida del negocio (usePreferredLocation).
- Al cambiar de sede, el valor se guarda en ambos caches para la proxima venta.
**38. Metodos de Pago Disponibles**

| Valor | Icono | Label | Descripcion |
| --- | --- | --- | --- |
| cash | Banknote | Efectivo | Pago en billetes o monedas |
| card | CreditCard | Tarjeta | Pago con tarjeta debito o credito |
| transfer | Landmark | Transferencia | Transferencia bancaria o Nequi/Daviplata |


**39. Autocompletado de Monto por Servicio**
Cuando el administrador selecciona un servicio en el formulario, el sistema autocompleta automaticamente el campo 'Monto Pagado' con el precio configurado de ese servicio. El administrador puede modificar el monto si el precio real fue diferente (descuento, propina, etc.).
**40. Estadisticas de Ventas Rapidas**
En la parte superior de la pagina se muestran 3 tarjetas con estadisticas actualizadas en tiempo real:

| Tarjeta | Periodo | Formato |
| --- | --- | --- |
| Hoy | Solo transacciones de hoy | COP (ej. $350.000) |
| 7 dias | Ultimos 7 dias | COP (ej. $1.500.000) |
| 30 dias | Ultimos 30 dias | COP (ej. $5.200.000) |


Estas estadisticas se recalculan automaticamente cada vez que se registra una nueva venta o se recarga la pagina.
**41. Historial de Ultimas 10 Ventas**
Debajo del formulario se muestra una lista con las ultimas 10 ventas rapidas registradas. Cada venta muestra:
- Nombre del cliente.
- Telefono (con icono Phone) si fue proporcionado.
- Documento (con icono IdCard) si fue proporcionado.
- Email (con icono Mail) si fue proporcionado.
- Notas (con icono PencilLine) si fueron proporcionadas.
- Metodo de pago con icono correspondiente (Banknote, CreditCard o Landmark).
- Monto y fecha de la transaccion.
**Estados**
- Cargando: spinner animado.
- Sin ventas: icono Package + 'No hay ventas registradas aun' + subtexto motivacional.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Formulario de venta rapida con estadisticas y historial |


**42. Integracion Contable de Ventas Rapidas**
Cada venta rapida registrada se almacena automaticamente como una transaccion contable en la tabla transactions con los siguientes valores:

| Campo | Valor |
| --- | --- |
| type | income |
| category | service_sale |
| is_verified | true |
| verified_by | ID del admin que registro la venta |
| metadata (JSONB) | client_name, client_phone, client_document, client_email, service_id, notes, source='quick_sale' |


Esta integracion permite que las ventas rapidas aparezcan automaticamente en el modulo de Reportes Financieros y en cualquier exportacion contable futura (Plan Pro).

| Proteccion por permisos El boton de envio del formulario esta protegido por PermissionGate con el permiso 'sales.create'. Solo usuarios con este permiso pueden registrar ventas rapidas. |
| --- |


**REPORTES FINANCIEROS**
El modulo de Reportes ofrece un dashboard financiero interactivo con graficos que permiten visualizar los ingresos, gastos y tendencias del negocio. En el Plan Basico, los reportes estan disponibles en modo de visualizacion (sin exportacion a PDF/CSV/Excel, que es exclusiva del Plan Pro).
**44. Dashboard Financiero Interactivo**
El dashboard financiero (EnhancedFinancialDashboard) se carga de forma diferida (lazy loading) para optimizar el rendimiento. Incluye tarjetas de resumen, graficos interactivos y filtros avanzados.
**Acceso**
El acceso al dashboard esta protegido por PermissionGate con el permiso 'reports.view_financial'. Usuarios sin este permiso veran un mensaje de acceso denegado.
**Tarjetas de Resumen Financiero**
En la parte superior del dashboard se muestran tarjetas con metricas clave:
- Ingresos totales del periodo seleccionado.
- Gastos totales del periodo (si aplica).
- Balance neto (ingresos - gastos).
- Cantidad de transacciones.
**45. Graficos Disponibles**
El dashboard incluye 5 tipos de graficos interactivos (implementados con la libreria Recharts):

| Grafico | Componente | Tipo | Que Muestra |
| --- | --- | --- | --- |
| Ingresos vs Gastos | IncomeVsExpenseChart | Barras agrupadas | Comparacion mensual de ingresos y gastos |
| Tendencia Mensual | MonthlyTrendChart | Linea | Evolucion de ingresos a lo largo del tiempo |
| Distribucion por Categoria | CategoryPieChart | Torta/Pie | Proporcion de ingresos por tipo de servicio |
| Ingresos por Empleado | EmployeeRevenueChart | Barras horizontales | Ranking de ingresos generados por cada empleado |
| Ingresos por Sede | LocationBarChart | Barras verticales | Comparacion de ingresos entre sedes |


Cada grafico es interactivo: al pasar el cursor sobre un elemento se muestra un tooltip con el detalle numerico. Algunos graficos permiten hacer clic para filtrar los datos.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Dashboard financiero con graficos de ingresos y distribucion |


**46. Filtros del Dashboard Financiero**
El dashboard ofrece multiples opciones de filtrado:
- Periodo de tiempo: 7 dias, 30 dias, 90 dias, 12 meses, personalizado.
- Sede: filtrar por sede especifica o todas las sedes.
- Categoria de servicio: filtrar por tipo de servicio.
- Empleado: filtrar por empleado especifico.
- Tipo de transaccion: ingresos, gastos, o ambos.
Los filtros se aplican en tiempo real y actualizan todos los graficos y tarjetas simultaneamente sin recargar la pagina.
**47. Exportacion de Reportes (Nota de Plan)**

| Funcion exclusiva del Plan Pro La exportacion de reportes a PDF, CSV y Excel NO esta disponible en el Plan Basico. El dashboard muestra la informacion completa en pantalla, pero para descargar los datos en formato de archivo, es necesario actualizar al Plan Pro ($159,900 COP/mes). El subtitulo del modulo menciona 'exportacion a PDF/CSV/Excel' como referencia a la funcionalidad completa disponible en el plan superior. |
| --- |


**GESTION DE PERMISOS**
El modulo de Permisos permite al administrador controlar que acciones pueden realizar los empleados dentro de la plataforma. En el Plan Basico, la gestion se realiza mediante 3 plantillas predefinidas de permisos. La asignacion granular de permisos individuales (79 tipos disponibles) es exclusiva del Plan Pro.
**49. Tabla de Usuarios y Roles**
La pestana principal del modulo muestra una tabla con todos los usuarios que tienen acceso al negocio (administradores y empleados).
**Columnas de la Tabla**

| Columna | Contenido |
| --- | --- |
| Usuario | Avatar + nombre + badge 'Owner' (si aplica) + email |
| Rol | Badge: Admin (default) o Empleado (secondary) |
| Tipo | Badge outline: 'Presta servicios' o 'Staff soporte' |
| Permisos | Icono Shield + cantidad de permisos activos (o 'Todos' si es owner) |
| Estado | Badge: 'Activo' (verde) o 'Inactivo' (rojo) |
| Acciones | Botones: Editar permisos + Eliminar permisos |


**Filtros de la Tabla**
- Input de busqueda con icono Search: 'Buscar por nombre o email...'.
- Select de rol: 'Todos los roles' / 'Administradores' / 'Empleados'.
**Tarjetas de Estadisticas**
Debajo de la tabla se muestran 3 tarjetas:

| Tarjeta | Icono | Dato |
| --- | --- | --- |
| Total Usuarios | Users | Cantidad total |
| Administradores | Crown | Cantidad de admins |
| Empleados | UserCheck | Cantidad de empleados |


**Estados**
- Cargando: texto centrado 'Cargando usuarios...'.
- Sin resultados: texto centrado 'No se encontraron usuarios'.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Tabla de usuarios con roles y acciones en el modulo de permisos |


**50. Acciones sobre Permisos**
Desde la tabla de usuarios se pueden realizar las siguientes acciones:
**Editar Permisos de un Usuario**
- Icono: Edit (lapiz).
- Protegido por PermissionGate: 'permissions.edit' (mode=hide).
- Abre el editor de permisos (PermissionEditor) para el usuario seleccionado.
- En el Plan Basico, el editor permite aplicar una de las 3 plantillas predefinidas.
**Eliminar Permisos de un Usuario**
- Icono: Trash2 (papelera roja).
- Protegido por PermissionGate: 'permissions.delete' (mode=hide).
- Solo disponible para usuarios que NO son el owner del negocio.
- Muestra un AlertDialog de confirmacion antes de proceder.
- Al confirmar: marca todos los permisos del usuario como inactivos (is_active = false).
- No elimina al usuario del negocio, solo revoca sus permisos.
- Toast de confirmacion o error segun el resultado.
**Asignar Rol a Nuevo Usuario**
- Boton en el header: 'Asignar Rol' con icono UserPlus.
- Protegido por PermissionGate: 'permissions.assign_role' (mode=hide).
- Abre el componente RoleAssignment para buscar y asignar rol a un usuario existente.

| Proteccion del Owner El propietario (owner) del negocio tiene TODOS los permisos por defecto (bypass total) y no puede ser editado ni eliminado. Su columna de permisos muestra 'Todos' en lugar de un numero. No aparece el boton de eliminar para el owner. |
| --- |


**51. Plantillas de Permisos (3 Predefinidas)**
En el Plan Basico, los permisos se gestionan mediante plantillas predefinidas que agrupan conjuntos de permisos comunes para roles tipicos de un negocio de servicios.

| Plantilla | Permisos Incluidos | Ideal Para |
| --- | --- | --- |
| Recepcionista | appointments.create, appointments.edit, appointments.cancel, clients.view, services.view | Personal de recepcion que gestiona citas |
| Profesional | appointments.view, appointments.edit, appointments.cancel_own, reviews.view, services.view, absences.request | Empleados que prestan servicios directamente |
| Contador | accounting.view_reports, accounting.create, accounting.edit, expenses.view, billing.view | Personal encargado de la contabilidad del negocio |


**Aplicar una Plantilla**
- En el editor de permisos del usuario, seleccione la plantilla deseada.
- El sistema muestra un preview de los permisos que se asignaran.
- Confirme la aplicacion.
- Los permisos de la plantilla se asignan al usuario via el servicio PermissionRPCService.applyTemplate.
- Toast de confirmacion con el nombre de la plantilla aplicada.

| Permisos granulares — Plan Pro Para asignar permisos individuales de los 79 tipos disponibles (en lugar de usar plantillas predefinidas), es necesario actualizar al Plan Pro. El Plan Pro tambien incluye 9 plantillas (en lugar de 3) y la pestaña de auditoria de cambios. |
| --- |


**52. Estadisticas de Usuarios y Roles**
Debajo de la tabla de usuarios se muestran 3 tarjetas estadisticas que brindan una vision rapida de la composicion del equipo:
- Total Usuarios (icono Users): cuenta total de personas con acceso al negocio.
- Administradores (icono Crown): cantidad de usuarios con rol de administrador.
- Empleados (icono UserCheck): cantidad de usuarios con rol de empleado.

**LIMITES AMPLIADOS EN MODULOS EXISTENTES**
Ademas de los 6 modulos exclusivos, el Plan Basico amplia significativamente los limites de los modulos que ya estaban disponibles en el Plan Gratuito.
**54. Gestion de hasta 3 Sedes**
El Plan Gratuito permite unicamente 1 sede. Con el Plan Basico, el negocio puede gestionar hasta 3 sedes simultaneamente.
**Que cambia con multiples sedes**
- El boton 'Agregar sede' en el modulo de Sedes se habilita hasta que se alcancen las 3.
- Cada sede puede tener su propia direccion, horarios de apertura/cierre, telefono, email y coordenadas GPS.
- Los servicios se pueden asignar de forma independiente a cada sede.
- Los empleados se asignan a una sede principal pero pueden trabajar en otras (usando is_location_exception en citas).
- El filtro de sede aparece en multiples modulos para facilitar la gestion multi-sede: Calendario, Empleados, Ventas Rapidas, Reportes.
- La sede preferida se puede configurar en Configuraciones para pre-seleccionar automaticamente en los filtros.
**Banner de limite**
Al alcanzar las 3 sedes, el sistema muestra el PlanLimitBanner indicando que se alcanzo el limite y ofreciendo la opcion de actualizar al Plan Pro (hasta 10 sedes).
**55. Servicios Ilimitados**
El Plan Gratuito limita a 15 servicios. Con el Plan Basico, no hay limite en la cantidad de servicios que un negocio puede crear y gestionar.
- Se elimina el banner PlanLimitBanner del modulo de Servicios.
- Todos los servicios creados son visibles y funcionales sin restriccion.
- La gestion de servicios (crear, editar, eliminar, reactivar, asignar a sedes y empleados) funciona identicamente a como se describe en la Parte 3 del manual.
**56. Citas Ilimitadas por Mes**
El Plan Gratuito limita a 50 citas por mes. Con el Plan Basico, los clientes pueden agendar citas ilimitadas sin restriccion mensual.
- El wizard de reserva no muestra ningun mensaje de limite alcanzado.
- El calendario del admin muestra todas las citas sin restriccion.
- Las estadisticas del dashboard reflejan el volumen real de citas sin truncar.
**57. Clientes Ilimitados**
El Plan Gratuito limita a 50 clientes visibles en el CRM. Con el Plan Basico, todos los clientes son visibles sin restriccion.
- El modulo ClientsManager muestra todos los clientes con al menos una cita no cancelada.
- Se elimina el banner PlanLimitBanner del modulo de Clientes.
- La busqueda y el modal de perfil de cliente funcionan sobre la totalidad de los datos.

**FUNCIONALIDADES ADICIONALES DE PLANES DE PAGO**
Al ser un plan de pago, el Plan Basico habilita funcionalidades que no estan disponibles en ningun plan gratuito.
**59. Recordatorios por WhatsApp**
Los clientes pueden recibir recordatorios automaticos de sus citas a traves de WhatsApp Business API. Esto reduce significativamente las inasistencias (no-shows).
- Los recordatorios se envian en los intervalos configurados por el negocio (por ejemplo, 24h y 1h antes de la cita).
- El contenido del mensaje incluye: nombre del negocio, servicio, fecha, hora, direccion de la sede y enlace para confirmar o cancelar.
- La configuracion se realiza desde Configuraciones > Notificaciones > Canal WhatsApp.
- Requisito: el negocio debe tener configuradas las credenciales de WhatsApp Business API.
**60. Sincronizacion con Google Calendar**
El administrador y los empleados pueden sincronizar sus citas de Gestabiz con Google Calendar para tener una vista unificada de su agenda.
- Sincronizacion bidireccional: las citas creadas en Gestabiz aparecen en Google Calendar y viceversa.
- Autenticacion via OAuth 2.0 con cuenta de Google.
- Seleccion de calendario especifico para la sincronizacion.
- Colores y descripciones automaticas segun el tipo de cita.
- Configuracion desde Configuraciones > Integraciones > Google Calendar.

**MODULOS BLOQUEADOS — SOLO EN PLAN PRO**
Los siguientes modulos NO estan disponibles en el Plan Basico y requieren una actualizacion al Plan Pro ($159,900 COP/mes):

| Modulo | Icono | Descripcion | Precio Pro |
| --- | --- | --- | --- |
| Gastos (Expenses) | Wallet | Gestion de gastos fijos y recurrentes del negocio | $159,900/mes |
| Reclutamiento | BriefcaseBusiness | Publicar vacantes, recibir aplicaciones, matching inteligente | $159,900/mes |
| Recursos Fisicos | Box | Gestionar salas, mesas, canchas y otros recursos reservables | $159,900/mes |
| Exportacion de Reportes | Download | Descargar reportes financieros en PDF, CSV y Excel | $159,900/mes |
| Permisos Granulares | Shield | Asignar 79 permisos individuales + 9 plantillas + auditoria | $159,900/mes |


Al intentar acceder a cualquiera de estos modulos, el sistema muestra la pantalla de PlanGate con el icono de candado y un boton para ver los planes disponibles.
**62. Como Actualizar al Plan Pro**
- Navegue a Facturacion en la barra lateral.
- Haga clic en 'Cambiar plan' o 'Actualizar'.
- Seleccione el Plan Pro ($159,900 COP/mes o $1,599,000 COP/ano).
- Complete el proceso de pago con la pasarela configurada.
- Los modulos se desbloquean inmediatamente tras la confirmacion del pago.

**63. Soporte y Ayuda**
Los usuarios del Plan Basico cuentan con soporte prioritario por email. Para reportar errores, la app incluye un boton flotante de reporte de bugs (FloatingBugReportButton) que permite enviar reportes con capturas de pantalla y descripcion detallada del problema.
- Email de soporte: soporte@gestabiz.com.
- Tiempo de respuesta estimado: 24-48 horas habiles.
- Reporte de bugs: boton flotante en la esquina inferior derecha de la aplicacion.
- Severidades de bug: Critico, Alto, Medio, Bajo.
**64. Glosario de Terminos del Plan Basico**

| Termino | Definicion |
| --- | --- |
| Walk-in | Cliente que llega al negocio sin cita previa |
| PlanGate | Pantalla de bloqueo que aparece al intentar acceder a un modulo no incluido en el plan |
| PlanLimitBanner | Banner informativo que indica cuando se ha alcanzado el limite del plan |
| Jerarquia | Estructura organizacional del equipo con niveles (Owner > Admin > Gerente > Lider > Personal) |
| Plantilla de permisos | Conjunto predefinido de permisos agrupados para un rol comun |
| PermissionGate | Componente invisible que oculta o deshabilita botones segun los permisos del usuario |
| Balance de vacaciones | Calculo automatico de dias de vacaciones disponibles, usados y pendientes |
| Ausencia aprobada | Solicitud de ausencia que fue aceptada por un administrador |
| Free Trial | Prueba gratuita de 30 dias del Plan Basico sin requerir datos de pago |
| CRUD | Create, Read, Update, Delete — las 4 operaciones basicas sobre cualquier entidad |
| Edge Function | Funcion ejecutada en el servidor (Supabase) para operaciones que requieren privilegios |
| Soft delete | Desactivacion logica (is_active = false) en lugar de eliminacion fisica de datos |
| COP | Peso colombiano — moneda utilizada en toda la plataforma |
| Owner bypass | El propietario del negocio tiene todos los permisos sin verificacion adicional |
| Two-step query | Patron de consulta: primero citas, luego perfiles y servicios por separado |


**Desarrollado por Ti Turing — www.tituring.com**
*Gestabiz v1.0.3 — Manual de Usuario — Parte 4 de 5*

**GESTABIZ**
**Manual de Usuario — Gestabiz**
*Guia funcional completa del sistema de gestion de citas y negocios*
**Parte 5 de 5: Administrador — Plan Pro**
Version del producto: 1.0.3   |   Abril 2026
*Fase Beta completada   |   Listo para produccion*

**Desarrollado por Ti Turing**
**INDICE DE CONTENIDOS**
*A continuacion se listan todas las secciones cubiertas en esta parte. Haga clic en cualquier titulo para navegar directamente al detalle.*
1. Resumen Ejecutivo — Plan Pro
2. Que incluye el Plan Pro
3. Comparativa de Limites: Gratuito vs. Basico vs. Pro
4. Como Activar el Plan Pro
5. Modulo de Gastos y Egresos
6. Tarjetas de Estadisticas de Gastos
7. Pestana Egresos Unicos
8. Pestana Egresos Recurrentes
9. Pestana Resumen por Categoria
10. Las 48 Categorias de Gastos
11. Formulario de Nuevo Egreso — Campos
12. Configuracion de Egresos Recurrentes
13. Metodos de Pago para Egresos
14. Permisos del Modulo de Gastos
15. Modulo de Reclutamiento
16. Dashboard de Reclutamiento — Vista General
17. Crear Nueva Vacante — 4 Tarjetas
18. Tarjeta 1: Informacion Basica de la Vacante
19. Tarjeta 2: Detalles de la Vacante
20. Tarjeta 3: Compensacion y Ubicacion
21. Tarjeta 4: Estado de la Vacante
22. Lista de Vacantes — Filtros y Busqueda
23. Tarjeta de Vacante — Detalle Visual
24. Gestion de Aplicaciones
25. Las 6 Pestanas de Estado de Aplicaciones
26. 7 Tarjetas de Estadisticas de Aplicaciones
27. Tarjeta de Aplicacion — Detalle
28. Acciones por Estado de Aplicacion
29. Modal de Seleccionar Empleado
30. Dialogo de Rechazo
31. Modal de Perfil del Aplicante — 3 Pestanas
32. Reviews Obligatorias al Contratar y Finalizar
33. Notificaciones Automaticas de Reclutamiento
34. Permisos del Modulo de Reclutamiento
35. Modulo de Recursos Fisicos
36. Vista General de Recursos
37. Los 15 Tipos de Recursos
38. Filtros por Tipo de Recurso
39. Tabla de Recursos — Columnas
40. Crear o Editar Recurso — Modal
41. Validacion de Disponibilidad de Recursos
42. Condicion de Modelo de Negocio
43. Permisos del Modulo de Recursos
44. Sistema de Nomina y Salarios
45. Configuracion de Salario del Empleado
46. Frecuencias de Pago Disponibles
47. Dia de Pago Configurable
48. Generacion Automatica de Egreso Recurrente
49. Permisos del Sistema de Nomina
50. Mapa Jerarquico del Equipo
51. Los 5 Niveles Jerarquicos
52. Controles del Mapa: Zoom, Expandir, Pantalla Completa
53. Editar Nivel Jerarquico de un Empleado
54. Dashboard de Facturacion — Vista Pro
55. Estados del Dashboard de Facturacion
56. Estadisticas de Uso del Plan
57. Historial de Pagos
58. Flujo de Cancelacion
59. Pagina de Precios — Vista Completa
60. Grid de 3 Planes
61. Codigos de Descuento
62. Preguntas Frecuentes en Pricing
63. Limites Ampliados del Plan Pro
64. Gestion de hasta 10 Sedes
65. Hasta 15 Empleados
66. Funcionalidades Marcadas como Proximamente
67. Editor de Permisos Individuales (Proximamente)
68. Historial de Auditoria (Proximamente)
69. Como Actualizar de Basico a Pro
70. Soporte y Ayuda del Plan Pro
71. Glosario de Terminos del Plan Pro

**PARTE 1 — RESUMEN EJECUTIVO**
Esta seccion presenta a grandes rasgos las capacidades exclusivas del Plan Pro de Gestabiz. Para el detalle exhaustivo de cada funcionalidad, consulte la Parte 2.
**1. Resumen Ejecutivo — Plan Pro**
El Plan Pro de Gestabiz ($159,900 COP/mes o $1,599,000 COP/ano con 2 meses gratis — 17% de ahorro) esta disenado para negocios en crecimiento que necesitan control total sobre sus operaciones: gastos, reclutamiento de personal, gestion de recursos fisicos (salas, canchas, mesas, equipos) y nomina automatizada. Incluye todo lo del Plan Basico ($89,900/mes) mas cuatro modulos exclusivos y limites ampliados que permiten gestionar hasta 10 sedes y 15 empleados con citas, clientes y servicios ilimitados.
Los cuatro modulos exclusivos del Plan Pro son:
- Gastos y Egresos — Registrar, categorizar y controlar todos los gastos del negocio con 48 categorias, egresos unicos y recurrentes, y resumen por categoria. Control total de tus finanzas.
- Reclutamiento — Publicar vacantes, recibir aplicaciones, gestionar candidatos con flujo de 6 estados, seleccion con review obligatoria y notificaciones automaticas.
- Recursos Fisicos — Gestionar salas, canchas, mesas, equipos, vehiculos y 15 tipos mas de recursos fisicos con disponibilidad, precios por hora y amenidades.
- Nomina / Payroll — Configurar salario base, frecuencia de pago, dia de pago y generar automaticamente egresos recurrentes de nomina para cada empleado.
Ademas, los limites se amplian significativamente respecto al Plan Basico:

| Recurso | Plan Gratuito | Plan Basico | Plan Pro |
| --- | --- | --- | --- |
| Sedes | 1 | 3 | 10 |
| Empleados | 1 (solo owner) | 6 | 15 |
| Citas por mes | 50 | Ilimitadas | Ilimitadas |
| Clientes visibles | 50 | Ilimitados | Ilimitados |
| Servicios | 15 | Ilimitados | Ilimitados |
| Gastos/Egresos | No disponible | No disponible | Ilimitados |
| Vacantes activas | No disponible | No disponible | Ilimitadas |
| Recursos fisicos | No disponible | No disponible | Ilimitados |
| Nomina/Payroll | No disponible | No disponible | Incluido |


| Incluye TODO lo del Plan Gratuito y del Plan Basico El Plan Pro hereda todas las funcionalidades descritas en la Parte 3 (Plan Gratuito: Dashboard, Servicios, Sedes, Calendario, CRM Clientes, Facturacion, Configuraciones, Perfil Publico, QR) y en la Parte 4 (Plan Basico: Empleados, Ausencias, Historial de Ventas, Ventas Rapidas, Reportes Financieros, Permisos) sin restricciones adicionales. Esta parte documenta unicamente las funcionalidades NUEVAS y los limites ampliados del Plan Pro. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Sidebar del admin con todos los modulos del Plan Pro desbloqueados |


**2. Que incluye el Plan Pro**
El Plan Pro de Gestabiz incluye tres grandes categorias de mejoras respecto al Plan Basico:
**A. Cuatro modulos exclusivos desbloqueados**
Cuatro modulos que estaban bloqueados tanto en el Plan Gratuito como en el Plan Basico se desbloquean al activar el Plan Pro. Cada uno aparece en la barra lateral sin candado y es completamente funcional.

| Modulo | Icono Sidebar | Descripcion Corta |
| --- | --- | --- |
| Gastos | Wallet | Control completo de egresos con 48 categorias |
| Reclutamiento | BriefcaseBusiness | Publicacion de vacantes y gestion de candidatos |
| Recursos | Box | Gestion de recursos fisicos (salas, canchas, mesas, etc.) |
| Nomina | (Sub-modulo Empleados) | Configuracion de salarios y egresos automaticos |


**B. Limites ampliados**
Los limites operativos se expanden para negocios mas grandes:
- Hasta 10 sedes activas simultaneamente (vs. 3 en Plan Basico).
- Hasta 15 empleados activos (vs. 6 en Plan Basico).
- Citas, clientes, servicios, gastos, vacantes y recursos: todos ilimitados.
**C. Funcionalidades adicionales**
El Plan Pro tambien habilita:
- Mapa jerarquico visual del equipo con 5 niveles (Owner, Admin, Gerente, Lider, Personal).
- Dashboard de facturacion completo con historial de pagos y flujo de cancelacion.
- Recordatorios por WhatsApp y sincronizacion con Google Calendar (heredados del Plan Basico).
- Proximamente: Editor de permisos individuales (79 permisos), plantillas de permisos personalizadas e historial de auditoria de permisos.

**3. Comparativa de Limites: Gratuito vs. Basico vs. Pro**
La siguiente tabla muestra la comparativa completa entre los tres planes disponibles:

| Funcionalidad | Gratuito ($0) | Basico ($89,900/mes) | Pro ($159,900/mes) |
| --- | --- | --- | --- |
| Sedes | 1 | 3 | 10 |
| Empleados | 1 (owner) | 6 | 15 |
| Citas/mes | 50 | Ilimitadas | Ilimitadas |
| Clientes | 50 | Ilimitados | Ilimitados |
| Servicios | 15 | Ilimitados | Ilimitados |
| Dashboard Admin | Incluido | Incluido | Incluido |
| Calendario de Citas | Incluido | Incluido | Incluido |
| CRM de Clientes | Incluido | Incluido | Incluido |
| Perfil Publico + QR | Incluido | Incluido | Incluido |
| Notificaciones In-App | Incluido | Incluido | Incluido |
| Chat en Tiempo Real | Incluido | Incluido | Incluido |
| Facturacion | Incluido | Incluido | Incluido |
| Configuraciones | Incluido | Incluido | Incluido |
| Gestion de Empleados | Bloqueado | Incluido | Incluido |
| Ausencias/Vacaciones | Bloqueado | Incluido | Incluido |
| Historial de Ventas | Bloqueado | Incluido | Incluido |
| Ventas Rapidas | Bloqueado | Incluido | Incluido |
| Reportes Financieros | Bloqueado | Incluido | Incluido |
| Permisos (plantillas) | Bloqueado | Incluido | Incluido |
| Gastos y Egresos | Bloqueado | Bloqueado | Incluido |
| Reclutamiento | Bloqueado | Bloqueado | Incluido |
| Recursos Fisicos | Bloqueado | Bloqueado | Incluido |
| Nomina / Payroll | Bloqueado | Bloqueado | Incluido |
| Mapa Jerarquico | Bloqueado | Bloqueado | Incluido |
| Permisos individuales | Bloqueado | Bloqueado | Proximamente |
| Auditoria de permisos | Bloqueado | Bloqueado | Proximamente |
| WhatsApp Reminders | Bloqueado | Incluido | Incluido |
| Google Calendar Sync | Bloqueado | Incluido | Incluido |


| Nota sobre funcionalidades "Proximamente" Algunas funcionalidades del Plan Pro estan marcadas como "Proximamente" porque la interfaz de usuario aun esta en desarrollo. El backend esta listo y funcional. Se habilitaran en futuras actualizaciones sin costo adicional para los suscriptores del Plan Pro. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Pagina de Precios con los 3 planes |


**4. Como Activar el Plan Pro**
El Plan Pro se activa desde el panel de administracion del negocio. Actualmente el boton de compra muestra "Proximamente" con opacidad reducida y esta deshabilitado. Cuando se habilite, el flujo sera:
- Ingresar al panel de administracion como propietario del negocio.
- Navegar a Facturacion en la barra lateral.
- Hacer clic en "Mejorar Plan" o navegar a la pagina de Precios.
- Seleccionar el Plan Pro ($159,900/mes o $1,599,000/ano).
- Opcionalmente ingresar un codigo de descuento.
- Completar el pago con tarjeta de credito/debito via Stripe, PayU o MercadoPago.
- El plan se activa inmediatamente — todos los modulos Pro se desbloquean.

| Estado Actual: Proximamente Al momento de escribir este manual, el Plan Pro aun no esta disponible para compra. El boton muestra un badge "Proximamente" y el plan aparece con opacidad reducida (60%) en la pagina de precios. Se habilitara en una actualizacion futura. |
| --- |


Para negocios que actualmente estan en el Plan Basico, la actualizacion al Pro sera un "upgrade" prorrateado: se cobra la diferencia proporcional por los dias restantes del ciclo de facturacion actual.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Pagina de precios con el Plan Pro deshabilitado (Proximamente) |


**PARTE 2 — DETALLE EXHAUSTIVO DE FUNCIONALIDADES**
A continuacion se documenta cada funcionalidad exclusiva del Plan Pro con nivel de detalle exhaustivo: cada campo, boton, validacion, flujo normal y alterno.
**MODULO DE GASTOS Y EGRESOS**
**5. Modulo de Gastos y Egresos**
El modulo de Gastos y Egresos (ExpensesManagementPage) permite a los administradores registrar, categorizar y controlar todos los gastos operativos del negocio. Es exclusivo del Plan Pro y aparece en la barra lateral con el icono Wallet.
El modulo se compone de tres secciones principales:
- Cabecera con 3 tarjetas de estadisticas de gastos (hoy, 7 dias, mes).
- 3 pestanas de contenido: Egresos Unicos, Egresos Recurrentes, Resumen por Categoria.
- Boton "Nuevo Egreso" protegido por permisos (accounting.create).

| Proteccion por Plan Este modulo esta protegido por PlanGate con feature="expenses". Si el negocio no tiene el Plan Pro activo, se muestra una pantalla de bloqueo invitando a actualizar el plan. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Vista general del modulo de Gastos y Egresos |


**6. Tarjetas de Estadisticas de Gastos**
En la parte superior del modulo se muestran 3 tarjetas de estadisticas que resumen los gastos del negocio en tres periodos temporales:

| Tarjeta | Periodo | Color | Descripcion |
| --- | --- | --- | --- |
| Gastos de Hoy | Dia actual | Rojo (destructive) | Suma de egresos registrados hoy |
| Gastos Ultimos 7 Dias | 7 dias atras | Rojo (destructive) | Suma de egresos en la ultima semana |
| Gastos del Mes | Mes actual | Rojo (destructive) | Suma de egresos del mes en curso |


Cada tarjeta muestra el monto total en formato COP con separadores de miles (ejemplo: $1,250,000 COP). El color rojo (variant="destructive") refuerza visualmente que se trata de salidas de dinero.
**7. Pestana Egresos Unicos**
La primera pestana muestra una tabla con todos los egresos de tipo unico (no recurrente) registrados en el negocio. Estos son gastos puntuales que se registran una sola vez.

| Columna | Descripcion |
| --- | --- |
| Fecha | Fecha en que se registro el egreso (formato dd/mm/yyyy) |
| Categoria | Categoria del gasto (ej: Mantenimiento, Marketing, Impuestos) |
| Monto | Monto en COP con formato de miles |
| Sede | Sede asociada al gasto (opcional, puede estar vacia) |
| Descripcion | Descripcion libre del gasto |
| Notas | Notas adicionales opcionales |
| Metodo de Pago | Metodo utilizado (efectivo, tarjeta, transferencia, etc.) |


La tabla se ordena por fecha descendente (mas recientes primero). Los egresos unicos se almacenan en la tabla transactions con type='expense'.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Tabla de Egresos Unicos |


**8. Pestana Egresos Recurrentes**
La segunda pestana muestra una tabla con todos los egresos recurrentes configurados en el negocio. Estos son gastos que se repiten periodicamente (mensual, quincenal, semanal).

| Columna | Descripcion |
| --- | --- |
| Nombre | Nombre descriptivo del egreso recurrente (ej: "Arriendo Local Principal") |
| Categoria | Categoria del gasto |
| Monto | Monto en COP que se cobra en cada periodo |
| Frecuencia | Periodicidad: mensual, quincenal, semanal |
| Dia | Dia del mes/semana en que se ejecuta |
| Automatizado | Switch indicando si el sistema lo genera automaticamente |
| Estado | Activo o Inactivo |
| Acciones | Editar, Activar/Desactivar, Eliminar |


Cada fila permite 3 acciones:
- Editar: Abre el formulario prellenado con los datos actuales del egreso.
- Activar/Desactivar (toggle): Cambia el estado del egreso recurrente sin eliminarlo.
- Eliminar: Elimina el egreso recurrente de forma permanente (con confirmacion).
Los egresos recurrentes se almacenan en la tabla recurring_expenses. Cuando estan configurados como automatizados, el sistema genera una transaccion de tipo expense en la fecha indicada.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Tabla de Egresos Recurrentes con acciones |


**9. Pestana Resumen por Categoria**
La tercera pestana muestra un resumen agrupado de los gastos por categoria. Cada categoria se presenta con el monto total acumulado, permitiendo al administrador identificar rapidamente en que areas se concentran los egresos del negocio.
Las categorias se presentan como tarjetas o filas agrupadas con:
- Nombre de la categoria (ej: "Nomina y Salarios").
- Monto total acumulado en COP.
- Porcentaje del total de gastos.
- Indicador visual de proporcion.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Resumen de Gastos por Categoria |


**10. Las 48 Categorias de Gastos**
El modulo ofrece 48 categorias de gastos organizadas en 10 grupos tematicos. Al crear un nuevo egreso, el administrador selecciona una de estas categorias:

| Grupo | Categorias Incluidas |
| --- | --- |
| Nomina y Salarios | Salarios, Bonificaciones, Prestaciones sociales, Horas extra, Liquidaciones |
| Arriendo e Inmuebles | Arriendo, Administracion, Servicios publicos (agua, luz, gas, internet, telefono) |
| Mantenimiento | Mantenimiento preventivo, Mantenimiento correctivo, Reparaciones, Limpieza |
| Marketing y Publicidad | Publicidad digital, Publicidad impresa, Redes sociales, Eventos, Material POP |
| Impuestos y Obligaciones | IVA, ICA, Retencion en la fuente, Predial, Camara de comercio, Industria y comercio |
| Seguros | Seguro de responsabilidad civil, Seguro de empleados, Seguro de equipos, Poliza todo riesgo |
| Capacitacion | Cursos, Certificaciones, Conferencias, Material didactico |
| Equipos y Tecnologia | Computadores, Software, Licencias, Mobiliario, Herramientas |
| Transporte y Logistica | Combustible, Peajes, Parqueadero, Mensajeria, Envios |
| Honorarios y Servicios | Contabilidad, Asesoria legal, Consultoria, Servicios profesionales, Otros |


Esta clasificacion permite generar reportes financieros detallados por categoria y facilita el analisis de costos operativos del negocio.

**11. Formulario de Nuevo Egreso — Campos**
Al hacer clic en "Nuevo Egreso", se abre un formulario completo con los siguientes campos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| Nombre | Texto | Solo si es recurrente | Nombre descriptivo del egreso recurrente |
| Categoria | Select (48 opciones) | Si | Categoria del gasto (ver tabla anterior) |
| Monto | Numero (COP) | Si (> $0) | Monto del egreso en pesos colombianos |
| Sede | Select (sedes del negocio) | No | Sede asociada al gasto (opcional) |
| Descripcion | Textarea | No | Descripcion libre del gasto |
| Es Recurrente | Checkbox | No | Marca si el egreso se repite periodicamente |
| Frecuencia | Select | Si (si recurrente) | mensual, quincenal, semanal |
| Dia de Ejecucion | Select | Si (si recurrente) | Dia del mes o semana para el egreso |
| Automatizado | Switch | No | Si el sistema debe generar el egreso automaticamente |
| Metodo de Pago | Select | No | Forma de pago utilizada |
| Notas | Textarea | No | Notas adicionales |


**Validaciones del formulario:**
- El monto debe ser mayor a $0 COP.
- Si el checkbox "Es Recurrente" esta marcado, se habilitan los campos de Frecuencia, Dia y Automatizado.
- Si no es recurrente, esos campos se ocultan.
- La categoria es obligatoria — el formulario no se puede enviar sin seleccionarla.
**Flujo de guardado:**
- Si es recurrente: se ejecuta un UPSERT en la tabla recurring_expenses con los datos del formulario.
- Si es unico (no recurrente): se ejecuta un INSERT en la tabla transactions con type='expense'.
- En ambos casos se muestra un toast de confirmacion al guardar exitosamente.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Formulario de Nuevo Egreso con campos visibles |


**12. Configuracion de Egresos Recurrentes**
Los egresos recurrentes tienen configuracion adicional que permite controlar cuando y como se generan las transacciones automaticamente:

| Parametro | Opciones | Descripcion |
| --- | --- | --- |
| Frecuencia | mensual, quincenal, semanal | Con que periodicidad se repite el egreso |
| Dia de Ejecucion | 1-28 o "ultimo dia" | En que dia del periodo se genera el egreso |
| Automatizado | Si / No | Si el sistema genera la transaccion sin intervencion manual |
| Estado | Activo / Inactivo | Los egresos inactivos no generan transacciones |


Cuando un egreso recurrente esta configurado como automatizado y activo, el sistema genera automaticamente una transaccion de tipo expense en la tabla transactions en la fecha configurada. Si no esta automatizado, el administrador debe registrar el egreso manualmente cada periodo.
**13. Metodos de Pago para Egresos**
Al registrar un egreso, el administrador puede seleccionar el metodo de pago utilizado:
- Efectivo
- Tarjeta de Credito
- Tarjeta de Debito
- Transferencia Bancaria
- PSE (Pagos Seguros en Linea)
- Nequi
- Daviplata
- Cheque
- Otro
El metodo de pago es informativo — se almacena en la transaccion pero no afecta el procesamiento del egreso.
**14. Permisos del Modulo de Gastos**
El modulo de Gastos esta protegido por los siguientes permisos:

| Permiso | Que protege | Modo PermissionGate |
| --- | --- | --- |
| accounting.create | Boton "Nuevo Egreso" | hide |
| expenses.create | Creacion de egresos individuales | hide |
| expenses.delete | Eliminacion de egresos | hide |


Si el usuario no tiene el permiso accounting.create, el boton "Nuevo Egreso" no es visible. El propietario del negocio (owner) siempre tiene todos los permisos sin restriccion.

**MODULO DE RECLUTAMIENTO**
**15. Modulo de Reclutamiento**
El modulo de Reclutamiento (RecruitmentDashboard) es un sistema completo de publicacion de vacantes laborales, recepcion de aplicaciones y gestion de candidatos con flujo de estados, reviews obligatorias y notificaciones automaticas. Es exclusivo del Plan Pro.
El modulo ofrece tres vistas principales:
- Lista de Vacantes (VacancyList): vista principal con todas las vacantes del negocio.
- Crear Vacante (CreateVacancy): formulario de 4 tarjetas para publicar una nueva vacante.
- Gestion de Aplicaciones (ApplicationsManagement): vista de aplicaciones por vacante.

| Proteccion por Plan Este modulo esta protegido por PlanGate con feature="recruitment". Si el negocio no tiene el Plan Pro activo, se muestra una pantalla de bloqueo. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Vista general del modulo de Reclutamiento |


**16. Dashboard de Reclutamiento — Vista General**
El dashboard de reclutamiento se organiza con una navegacion de pestanas y una vista activa que cambia segun la seleccion:

| Pestana | Vista Mostrada | Descripcion |
| --- | --- | --- |
| Vacantes Activas | VacancyList (filtro open) | Vacantes con estado 'open' (abiertas a aplicaciones) |
| Historial | VacancyList (todas) | Todas las vacantes incluyendo cerradas y pausadas |


En la vista de vacantes activas, un boton "Nueva Vacante" protegido por el permiso recruitment.create_vacancy permite crear vacantes nuevas.
**17. Crear Nueva Vacante — 4 Tarjetas**
El formulario de creacion de vacante (CreateVacancy) se organiza en 4 tarjetas (cards) que agrupan los campos por seccion logica. El administrador completa los campos y hace clic en "Publicar Vacante" para guardarla.
Las 4 tarjetas son:
- Informacion Basica: titulo, descripcion, tipo de posicion y experiencia requerida.
- Detalles: requisitos, responsabilidades y beneficios del puesto.
- Compensacion: rango salarial, moneda, comision, sede y modalidad remota.
- Estado: estado inicial de la vacante (abierta, pausada o cerrada).

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Formulario de Crear Vacante con las 4 tarjetas |


**18. Tarjeta 1: Informacion Basica de la Vacante**

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| Titulo | Texto | Si | Titulo de la vacante (ej: "Estilista Senior") |
| Descripcion | Textarea | Si | Descripcion detallada del puesto y responsabilidades generales |
| Tipo de Posicion | Select (4 opciones) | Si | full_time, part_time, contractor, temporary |
| Experiencia | Select (3 niveles) | Si | junior, mid, senior |


**Opciones de Tipo de Posicion:**
- Tiempo Completo (full_time): jornada completa de 8 horas.
- Medio Tiempo (part_time): jornada parcial de 4 horas.
- Contratista (contractor): contratacion por prestacion de servicios.
- Temporal (temporary): contrato por duracion determinada.
**Opciones de Experiencia:**
- Junior: 0-2 anos de experiencia.
- Mid: 2-5 anos de experiencia.
- Senior: 5+ anos de experiencia.
**19. Tarjeta 2: Detalles de la Vacante**

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| Requisitos | Textarea | No | Lista de requisitos del puesto (habilidades, certificaciones) |
| Responsabilidades | Textarea | No | Lista de responsabilidades del puesto |
| Beneficios | Textarea | No | Beneficios que ofrece el negocio (descuentos, horario flexible, etc.) |


Los tres campos son textareas de formato libre. Se recomienda usar listas con viñetas para facilitar la lectura por parte de los candidatos.
**20. Tarjeta 3: Compensacion y Ubicacion**

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| Salario Minimo | Numero (COP) | No | Limite inferior del rango salarial |
| Salario Maximo | Numero (COP) | No | Limite superior del rango salarial |
| Moneda | Select | Si | Moneda del salario (default: COP) |
| Basado en Comision | Switch | No | Indica si la compensacion incluye comisiones |
| Sede | Select (sedes del negocio) | No | Sede donde se desempenara el puesto |
| Modalidad Remota | Switch | No | Indica si el puesto permite trabajo remoto |


Si el negocio tiene una sede preferida configurada, el campo de Sede se preselecciona automaticamente con esa sede. El administrador puede cambiarla si lo desea.
El campo "Basado en Comision" activa un indicador visual en la tarjeta de la vacante y en el formulario de aplicacion, informando al candidato que parte de la compensacion depende de comisiones por ventas o servicios.
**21. Tarjeta 4: Estado de la Vacante**

| Estado | Descripcion | Efecto |
| --- | --- | --- |
| open (Abierta) | Acepta nuevas aplicaciones | Visible en vacantes activas; candidatos pueden aplicar |
| paused (Pausada) | Temporalmente cerrada | No acepta nuevas aplicaciones pero mantiene las existentes |
| closed (Cerrada) | Finalizada | No acepta aplicaciones; solo visible en historial |
| filled (Ocupada) | Puesto cubierto | Indica que ya se selecciono un candidato |
| expired (Expirada) | Vencida | La vacante supero su fecha limite |


El estado inicial puede ser cualquiera de los tres primeros. Los estados "filled" y "expired" se asignan automaticamente cuando se selecciona un candidato o la vacante supera su fecha limite.

**22. Lista de Vacantes — Filtros y Busqueda**
La lista de vacantes (VacancyList) muestra todas las vacantes del negocio con opciones de filtrado y busqueda:
**Filtros disponibles:**

| Filtro | Opciones | Descripcion |
| --- | --- | --- |
| Estado | 5 opciones: Todas, Abiertas, Pausadas, Cerradas, Ocupadas | Filtra vacantes por estado actual |
| Tipo de Posicion | 4 opciones: Todos, Tiempo Completo, Medio Tiempo, Contratista, Temporal | Filtra por tipo de contratacion |
| Busqueda | Texto libre | Busca en titulo y descripcion de la vacante |


Los filtros se aplican en tiempo real — la lista se actualiza inmediatamente al cambiar cualquier filtro.
**23. Tarjeta de Vacante — Detalle Visual**
Cada vacante se muestra como una tarjeta (VacancyCard) con los siguientes elementos:
- Cabecera con titulo de la vacante, badge de estado (color segun estado) y menu dropdown con acciones.
- Grid de metadatos con 4 columnas: Tipo de posicion, Experiencia requerida, Rango salarial, Sede asignada.
- Pie con estadisticas: numero de aplicaciones recibidas, fecha de publicacion.
- Animacion highlight al crear una vacante nueva (la tarjeta destella brevemente).
**Acciones del menu dropdown:**
- Ver Aplicaciones: navega a la gestion de aplicaciones de esta vacante.
- Editar: abre el formulario de edicion prellenado (permiso: recruitment.edit_vacancy).
- Pausar/Reanudar: cambia entre estado open y paused.
- Cerrar: cambia a estado closed (permiso: recruitment.edit_vacancy).
- Eliminar: elimina la vacante permanentemente (permiso: recruitment.delete_vacancy, requiere confirmacion).

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Tarjeta de Vacante con metadata y acciones |


**24. Gestion de Aplicaciones**
La vista de Gestion de Aplicaciones (ApplicationsManagement) se accede al hacer clic en "Ver Aplicaciones" de una vacante. Muestra todas las aplicaciones recibidas organizadas por estado con estadisticas y filtros avanzados.
La vista se compone de:
- 7 tarjetas de estadisticas en la parte superior.
- 6 pestanas de estado para filtrar aplicaciones.
- 3 columnas de filtros adicionales.
- Lista de ApplicationCards con acciones contextuales.
**25. Las 6 Pestanas de Estado de Aplicaciones**

| Pestana | Estado | Color Badge | Descripcion |
| --- | --- | --- | --- |
| Pendientes | pending | Amarillo | Aplicaciones nuevas sin revisar |
| En Revision | reviewing | Azul | Aplicaciones que estan siendo evaluadas |
| En Proceso | in_process | Indigo | Candidatos en proceso de seleccion avanzado |
| Aceptadas | accepted | Verde | Candidatos seleccionados y aceptados |
| Rechazadas | rejected | Rojo | Candidatos descartados |
| Retiradas | withdrawn | Gris | Candidatos que retiraron su aplicacion |


Cada pestana muestra un contador con el numero de aplicaciones en ese estado. Las pestanas se actualizan en tiempo real al cambiar el estado de una aplicacion.
**26. 7 Tarjetas de Estadisticas de Aplicaciones**

| Tarjeta | Dato Mostrado |
| --- | --- |
| Total Aplicaciones | Numero total de aplicaciones recibidas para esta vacante |
| Pendientes | Aplicaciones sin revisar |
| En Revision | Aplicaciones en evaluacion |
| En Proceso | Candidatos en seleccion avanzada |
| Aceptados | Candidatos seleccionados |
| Rechazados | Candidatos descartados |
| Tasa de Aceptacion | Porcentaje de aceptados sobre el total |


**27. Tarjeta de Aplicacion — Detalle**
Cada aplicacion se muestra como una tarjeta (ApplicationCard) con los siguientes datos:
- Avatar del candidato con iniciales (si no tiene foto).
- Nombre completo, email y telefono del candidato.
- Badge de estado con color correspondiente.
- Informacion de la vacante a la que aplico.
- Rango salarial esperado por el candidato.
- Disponibilidad horaria del candidato.
- Carta de presentacion (cover letter) si la envio.
- Botones de accion contextuales segun el estado actual de la aplicacion.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Tarjeta de Aplicacion con datos del candidato |


**28. Acciones por Estado de Aplicacion**
Las acciones disponibles cambian segun el estado actual de la aplicacion:

| Estado Actual | Acciones Disponibles |
| --- | --- |
| pending (Pendiente) | Mover a Revision, Rechazar, Ver Perfil |
| reviewing (En Revision) | Mover a En Proceso, Rechazar, Ver Perfil |
| in_process (En Proceso) | Seleccionar (Aceptar), Rechazar, Ver Perfil |
| accepted (Aceptada) | Ver Perfil, (sin mas acciones) |
| rejected (Rechazada) | Ver Perfil, (sin mas acciones) |
| withdrawn (Retirada) | Ver Perfil, (sin mas acciones) |


Las acciones de Mover a Revision, Mover a En Proceso, Seleccionar y Rechazar requieren el permiso recruitment.manage_applications. Sin este permiso, los botones no son visibles (mode="hide").

**29. Modal de Seleccionar Empleado**
Al hacer clic en "Seleccionar" en una aplicacion en estado "in_process", se abre un AlertDialog que confirma la seleccion del candidato. Este modal es critico porque tiene efectos permanentes en el sistema.
**Efectos de seleccionar un candidato:**
- El estado de la aplicacion cambia a "accepted".
- El candidato se registra automaticamente como empleado en business_employees.
- Se le asigna el rol de "employee" en el negocio.
- Se genera una review obligatoria para el administrador (calificar al candidato).
- Todas las demas aplicaciones a esta vacante se rechazan automaticamente.

| Alerta de Notificaciones Automaticas Al seleccionar un candidato, el sistema envia automaticamente notificaciones al candidato aceptado (felicitacion) y a los demas candidatos (rechazo con mensaje personalizado). El administrador debe tener esto en cuenta antes de confirmar la seleccion. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Modal de Seleccionar Empleado con lista de efectos |


**30. Dialogo de Rechazo**
Al rechazar una aplicacion, se abre un dialogo con un campo de texto (textarea) donde el administrador puede escribir opcionalmente el motivo del rechazo.
El motivo de rechazo:
- Es opcional — el administrador puede rechazar sin dar motivo.
- Si se proporciona, se almacena en la aplicacion y puede ser consultado.
- No se envia al candidato por email (solo se notifica el cambio de estado).
- Es util para fines internos y de auditoria del proceso de seleccion.
**31. Modal de Perfil del Aplicante — 3 Pestanas**
Al hacer clic en "Ver Perfil" de cualquier aplicacion, se abre un modal (ApplicantProfileModal) con 3 pestanas de informacion detallada:
**Pestana 1: Informacion Personal**
- Nombre completo, email, telefono.
- Documento de identidad (tipo y numero).
- Avatar o iniciales.
- Fecha de registro en la plataforma.
**Pestana 2: Experiencia Profesional**
- Habilidades registradas en su perfil profesional.
- Anos de experiencia.
- Certificaciones.
- Historial de trabajos anteriores (si los registro).
- CV adjunto (si lo subio — enlace de descarga).
**Pestana 3: Aplicacion Actual**
- Estado actual de la aplicacion con badge de color.
- Fecha de aplicacion.
- Carta de presentacion completa.
- Disponibilidad horaria declarada.
- Expectativa salarial.
- Historial de cambios de estado.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Modal de Perfil del Aplicante con las 3 pestanas |


**32. Reviews Obligatorias al Contratar y Finalizar**
El sistema de reclutamiento integra un mecanismo de reviews obligatorias en dos momentos clave del proceso:
**Review al Contratar**
Cuando el administrador selecciona (acepta) un candidato, el sistema genera automaticamente una review pendiente obligatoria. El administrador debe calificar al nuevo empleado con un rating de 1 a 5 estrellas y un comentario.
**Review al Finalizar**
Si un empleado contratado via reclutamiento es dado de baja o finaliza su relacion laboral, se genera otra review obligatoria para documentar la experiencia.
Las reviews obligatorias aparecen como un modal (MandatoryReviewModal) que se muestra automaticamente al administrador. No se puede cerrar sin completar la review.

| Hook: useMandatoryReviews Las reviews obligatorias pendientes se consultan con el hook useMandatoryReviews. Si hay reviews pendientes, el modal se muestra automaticamente al entrar al modulo. |
| --- |


**33. Notificaciones Automaticas de Reclutamiento**
El modulo de reclutamiento genera notificaciones automaticas en los siguientes eventos:

| Evento | Destinatario | Canal | Contenido |
| --- | --- | --- | --- |
| Nueva aplicacion recibida | Admins del negocio | In-app + Email | "Juan Perez aplico a Estilista Senior" |
| Aplicacion movida a revision | Candidato | Email | "Tu aplicacion esta siendo revisada" |
| Candidato seleccionado | Candidato aceptado | In-app + Email | "Felicitaciones! Has sido seleccionado" |
| Candidato rechazado | Candidato rechazado | Email | "Gracias por tu interes. En esta oportunidad..." |
| Vacante cerrada | Todos los candidatos pendientes | Email | "La vacante ha sido cerrada" |


Las notificaciones se envian a traves de las Edge Functions send-selection-notifications y send-employee-request-notification.
**34. Permisos del Modulo de Reclutamiento**

| Permiso | Que protege | Modo PermissionGate |
| --- | --- | --- |
| recruitment.create_vacancy | Boton "Nueva Vacante" | hide |
| recruitment.edit_vacancy | Editar y cerrar vacantes | hide |
| recruitment.delete_vacancy | Eliminar vacantes | hide |
| recruitment.manage_applications | Cambiar estado de aplicaciones, seleccionar, rechazar | hide |


El propietario del negocio (owner) tiene todos los permisos automaticamente. Los demas usuarios necesitan permisos asignados explicitamente o a traves de una plantilla.

**MODULO DE RECURSOS FISICOS**
**35. Modulo de Recursos Fisicos**
El modulo de Recursos Fisicos (ResourcesManager) permite a los administradores gestionar recursos fisicos del negocio como salas, canchas, mesas, equipos, vehiculos y mas. Es exclusivo del Plan Pro y esta disenado para negocios cuyo modelo no se basa unicamente en profesionales sino tambien en la reserva de espacios o equipos.
Casos de uso principales:
- Hoteles — Hoteles: gestionar habitaciones (standard, suite, deluxe).
- Restaurantes — Restaurantes: gestionar mesas (2, 4, 6, 8 personas).
- Centros Deportivos — Centros Deportivos: gestionar canchas (tenis, futbol, padel).
- Gimnasios — Gimnasios: gestionar equipos (caminadora, bicicleta, banco de pesas).
- Co-working — Co-working: gestionar espacios (escritorio, sala de reuniones).
- Bowling — Bowling: gestionar carriles de boliche.
- Parqueaderos — Parqueaderos: gestionar espacios de estacionamiento.
- Hospitales — Hospitales: gestionar camas y consultorios.

| Condicion de Visibilidad El modulo de Recursos solo es visible si el negocio tiene configurado un resource_model diferente de 'professional'. Si el negocio opera unicamente con empleados (salon de belleza, clinica), el modulo no aparece en la barra lateral. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Vista general del modulo de Recursos Fisicos |


**36. Vista General de Recursos**
La vista principal del modulo muestra:
- Cabecera con titulo "Recursos" y boton "Agregar Recurso".
- Filtro por tipo de recurso (select con 15 opciones + "Todos").
- Tabla con todos los recursos del negocio.
**37. Los 15 Tipos de Recursos**
El sistema soporta 15 tipos de recursos fisicos, cubriendo una amplia gama de verticales de negocio:

| Tipo | Clave | Ejemplo de Uso |
| --- | --- | --- |
| Habitacion | room | Hotel: Suite 101, Habitacion Estandar |
| Mesa | table | Restaurante: Mesa 1 (4 personas), Mesa VIP |
| Cancha | court | Centro deportivo: Cancha de Padel, Cancha de Tenis |
| Escritorio | desk | Co-working: Escritorio A1, Escritorio Premium |
| Equipo | equipment | Gimnasio: Caminadora 1, Bicicleta Estatica |
| Vehiculo | vehicle | Rent-a-car: Toyota Corolla, Van de 12 pasajeros |
| Espacio | space | Salon de eventos: Salon Principal (100 personas) |
| Carril | lane | Bowling: Carril 1, Carril 2 |
| Campo/Cancha Exterior | field | Club: Cancha de Futbol, Campo de Golf (Hoyo 1-9) |
| Estacion | station | Fabrica: Estacion de Soldadura, Estacion de Corte |
| Parqueadero | parking_spot | Edificio: Espacio P-01, Espacio P-02 |
| Cama | bed | Hospital: Cama UCI 1, Cama Recuperacion 3 |
| Estudio | studio | Fotografia: Estudio A (luces incluidas) |
| Sala de Reuniones | meeting_room | Oficina: Sala Board, Sala de Videoconferencia |
| Otro | other | Cualquier recurso que no encaje en las categorias anteriores |


**38. Filtros por Tipo de Recurso**
En la parte superior de la tabla hay un select que permite filtrar los recursos por tipo. Las opciones incluyen los 15 tipos mas la opcion "Todos" para ver todos los recursos sin filtro.
El filtro se aplica en tiempo real — la tabla se actualiza inmediatamente al seleccionar un tipo diferente.
**39. Tabla de Recursos — Columnas**

| Columna | Descripcion |
| --- | --- |
| Nombre | Nombre identificador del recurso (ej: "Cancha de Padel 1") |
| Tipo | Badge con el tipo de recurso (ej: court, room, table) |
| Sede | Sede donde se ubica el recurso |
| Capacidad | Numero de personas/unidades que soporta |
| Precio/hora | Tarifa por hora en COP (formato con separadores de miles) |
| Estado | Badge de estado: Disponible (verde), En Mantenimiento (amarillo), Fuera de Servicio (rojo) |
| Acciones | Botones Editar y Eliminar |


La tabla se ordena por nombre del recurso de forma alfabetica.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Tabla de Recursos con columnas y badges de estado |


**40. Crear o Editar Recurso — Modal**
Al hacer clic en "Agregar Recurso" o en "Editar" de un recurso existente, se abre un modal con los siguientes campos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| Nombre | Texto | Si | Nombre identificador del recurso |
| Tipo | Select (15 opciones) | Si | Tipo de recurso (room, table, court, etc.) |
| Sede | Select (sedes del negocio) | Si | Sede donde se ubica el recurso |
| Capacidad | Numero (min: 1) | No | Capacidad del recurso en personas/unidades |
| Precio por Hora | Numero (COP) | No | Tarifa por hora de uso |
| Descripcion | Textarea | No | Descripcion detallada del recurso |
| Amenidades | Texto (separado por comas) | No | Lista de amenidades incluidas |
| Estado | Select | Si | available, maintenance, out_of_service |


**Validaciones:**
- El nombre es obligatorio — el formulario no se puede enviar sin nombre.
- El tipo es obligatorio — debe seleccionarse uno de los 15 tipos.
- La sede es obligatoria — el recurso debe estar asociado a una sede del negocio.
- La capacidad minima es 1 si se proporciona.
- El precio debe ser mayor a 0 si se proporciona.
- Las amenidades se ingresan como texto libre separado por comas (ej: "WiFi, Proyector, Aire acondicionado") y se almacenan como JSONB.
**Flujo de guardado:**
- Crear: INSERT en business_resources con los datos del formulario.
- Editar: UPDATE del recurso existente con los nuevos datos.
- En ambos casos se invalida el cache de React Query y se muestra un toast de confirmacion.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Modal de Crear/Editar Recurso |


**41. Validacion de Disponibilidad de Recursos**
Cuando un cliente intenta reservar una cita que involucra un recurso fisico, el sistema valida automaticamente que el recurso este disponible en el horario solicitado.
La validacion utiliza la funcion RPC is_resource_available() que verifica:
- Que no exista una cita ya agendada para ese recurso en el mismo horario (overlap detection).
- Que el recurso tenga estado "available" (no en mantenimiento ni fuera de servicio).
- Que el recurso pertenezca a la sede seleccionada.
El algoritmo de overlap es identico al de empleados: slotStart < aptEnd AND slotEnd > aptStart.

| Hook: useAssigneeAvailability La validacion de disponibilidad se realiza a traves del hook useAssigneeAvailability, que funciona tanto para empleados como para recursos fisicos. Automaticamente detecta si el assignee es un empleado o un recurso y aplica la logica correspondiente. |
| --- |


**42. Condicion de Modelo de Negocio**
El modulo de Recursos solo esta disponible para negocios cuyo campo resource_model en la tabla businesses no sea 'professional'. Los modelos soportados son:

| Modelo | Descripcion | Ejemplo de Negocios |
| --- | --- | --- |
| professional | Solo empleados (modelo tradicional) | Salon de belleza, Clinica dental, Consultorio medico |
| physical_resource | Solo recursos fisicos | Bowling, Parqueadero, Alquiler de vehiculos |
| hybrid | Empleados + Recursos fisicos | Hotel (recepcionista + habitaciones), Gimnasio (trainer + equipos) |
| group_class | Clases grupales con recurso | Yoga (instructor + sala), Crossfit (coach + box) |


Los negocios existentes que fueron creados antes de esta funcionalidad tienen resource_model = 'professional' por defecto y no veran el modulo de Recursos. El administrador puede cambiar el modelo desde la configuracion del negocio.
**43. Permisos del Modulo de Recursos**

| Permiso | Que protege | Modo PermissionGate |
| --- | --- | --- |
| resources.create | Boton "Agregar Recurso" | hide |
| resources.edit | Boton "Editar" en cada recurso | hide |
| resources.delete | Boton "Eliminar" en cada recurso | hide |
| resources.view | Acceso al modulo de Recursos | hide |


**SISTEMA DE NOMINA Y SALARIOS**
**44. Sistema de Nomina y Salarios**
El sistema de Nomina (Payroll) es un sub-modulo integrado dentro de la gestion de empleados que permite configurar el salario base, frecuencia de pago y dia de pago de cada empleado. Es exclusivo del Plan Pro.
Acceso: Modal de Perfil de Empleado → Pestana "Salario" (solo visible si el negocio tiene Plan Pro activo, verificado con planId === 'pro').

| Condicion de Visibilidad La pestana de Salario en el perfil del empleado solo es visible si el negocio tiene el Plan Pro activo. Si el plan es Gratuito o Basico, la pestana no aparece. |
| --- |


| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Pestana de Salario en el perfil de empleado |


**45. Configuracion de Salario del Empleado**

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| Salario Base | Numero (COP) | No | Monto del salario base del empleado |
| Frecuencia de Pago | Select | Si | Con que periodicidad se paga al empleado |
| Dia de Pago | Select | Condicional | Dia del mes/semana para el pago (solo si frecuencia es mensual) |
| Generar Egreso Recurrente | Switch | No | Si el sistema debe crear automaticamente el egreso de nomina |


**Logica de guardado:**
- Al guardar, se ejecuta un UPDATE en business_employees con los campos salary_base y salary_type.
- Si el salario es mayor a $0 y el switch "Generar Egreso Recurrente" esta activo: se ejecuta un UPSERT en recurring_expenses creando un egreso de nomina con la categoria "payroll".
- Si el salario se establece en $0 o se desactiva el switch: se desactiva el egreso recurrente correspondiente (no se elimina, solo se marca como inactivo).
**46. Frecuencias de Pago Disponibles**

| Frecuencia | Clave | Descripcion |
| --- | --- | --- |
| Mensual | monthly | Pago una vez al mes en el dia configurado |
| Quincenal | biweekly | Pago dos veces al mes (1 y 15, o segun configuracion) |
| Semanal | weekly | Pago cada semana en el dia configurado |
| Diario | daily | Pago diario (tipico en jornaleros o trabajo temporal) |
| Por Hora | hourly | Pago basado en horas trabajadas |


La frecuencia mas comun en Colombia es mensual, con pago el ultimo dia del mes o el dia 30. Las frecuencias quincenal y semanal son comunes en sectores como construccion y servicios temporales.
**47. Dia de Pago Configurable**
El campo "Dia de Pago" solo se muestra cuando la frecuencia seleccionada es "mensual". Las opciones disponibles son:
- Dias 1 al 28: dia fijo del mes.
- Ultimo dia: se ajusta automaticamente al ultimo dia calendario del mes (28, 29, 30 o 31).
Para frecuencias quincenales, el sistema usa por defecto los dias 1 y 15 del mes. Para frecuencias semanales, el dia corresponde al dia de la semana.

| Nota: Dias 29-31 El sistema permite como maximo el dia 28 para evitar inconsistencias con meses de distinta duracion (febrero tiene 28/29 dias). Para pagos al final del mes, use la opcion "Ultimo dia". |
| --- |


**48. Generacion Automatica de Egreso Recurrente**
Cuando el switch "Generar Egreso Recurrente" esta activado y el salario es mayor a $0, el sistema crea automaticamente un registro en la tabla recurring_expenses con:
- Nombre: "Nomina — [Nombre del Empleado]".
- Categoria: payroll (nomina y salarios).
- Monto: el salario base configurado.
- Frecuencia: la frecuencia de pago seleccionada.
- Dia: el dia de pago configurado.
- Automatizado: true (el sistema genera la transaccion automaticamente).
- Estado: activo.
Este egreso recurrente aparece en el modulo de Gastos, pestana Egresos Recurrentes, y genera transacciones automaticas de tipo expense en las fechas configuradas.
Si el administrador cambia el salario a $0 o desactiva el switch, el egreso recurrente se desactiva (is_active = false) pero no se elimina, preservando el historial de transacciones anteriores.
**49. Permisos del Sistema de Nomina**

| Permiso | Que protege | Modo PermissionGate |
| --- | --- | --- |
| employees.edit_salary | Pestana de Salario y todos sus campos | disable |


Si el usuario no tiene el permiso employees.edit_salary, la pestana de Salario aparece pero todos los campos estan deshabilitados (modo disable). El propietario del negocio siempre puede editar salarios.

**MAPA JERARQUICO DEL EQUIPO**
**50. Mapa Jerarquico del Equipo**
El Mapa Jerarquico (HierarchyMapView) es una visualizacion interactiva del organigrama del equipo en forma de arbol. Muestra la estructura de mando y las relaciones de reporte entre los empleados del negocio.
Acceso: Gestion de Empleados → Boton "Mapa Jerarquico" (vista alternativa a la lista).

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Mapa Jerarquico del equipo con 5 niveles |


**51. Los 5 Niveles Jerarquicos**

| Nivel | Rol | Descripcion |
| --- | --- | --- |
| 1 | Owner (Propietario) | Dueno del negocio — nodo raiz del arbol, siempre presente |
| 2 | Admin (Administrador) | Administrador con permisos elevados, reporta al owner |
| 3 | Manager (Gerente) | Gerente de sede o area, reporta al admin |
| 4 | Team Lead (Lider de Equipo) | Lider que coordina un grupo, reporta al gerente |
| 5 | Staff (Personal) | Personal operativo, reporta al lider de equipo |


Cada empleado se muestra como un nodo con su avatar, nombre, rol y nivel. Las conexiones entre nodos representan relaciones de reporte.
**52. Controles del Mapa: Zoom, Expandir, Pantalla Completa**

| Control | Rango/Accion | Descripcion |
| --- | --- | --- |
| Zoom | 50% — 150% | Slider para acercar o alejar el mapa |
| Expandir | Toggle por nodo | Expandir o colapsar los nodos hijos de un empleado |
| Pantalla Completa | On/Off | Expandir el mapa para ocupar toda la pantalla |
| Enfocar Empleado | Click en nodo | Centra la vista en el empleado seleccionado con auto-scroll |


**53. Editar Nivel Jerarquico de un Empleado**
Para cambiar el nivel jerarquico de un empleado:
- Hacer clic derecho o seleccionar el nodo del empleado en el mapa.
- Seleccionar "Cambiar Nivel" del menu contextual.
- Elegir el nuevo nivel (1-5) del selector HierarchyLevelSelector.
- Confirmar el cambio.
El cambio se guarda mediante el hook useUpdateEmployeeHierarchy que llama a la Edge Function update-hierarchy. El mapa se actualiza automaticamente.

| Nota: Solo Admins y Owners Solo los administradores y el propietario del negocio pueden cambiar niveles jerarquicos. Los empleados de nivel 3-5 solo pueden visualizar el mapa. |
| --- |


**DASHBOARD DE FACTURACION Y PAGINA DE PRECIOS**
**54. Dashboard de Facturacion — Vista Pro**
El Dashboard de Facturacion (BillingDashboard) muestra diferente contenido segun el estado de la suscripcion del negocio. Para usuarios del Plan Pro, la vista activa incluye informacion completa del plan y opciones de gestion.
**55. Estados del Dashboard de Facturacion**

| Estado | Vista Mostrada | Descripcion |
| --- | --- | --- |
| Sin plan (Gratuito) | Invitacion a suscribirse | Muestra beneficios del Plan Basico/Pro y CTA para activar |
| Plan cancelado | Mensaje de expiracion | Muestra fecha de expiracion y boton para reactivar |
| Plan activo | Dashboard completo | Informacion del plan, uso, historial de pagos, opcion de cancelar |
| Plan en prueba (trialing) | Dashboard + banner | Igual que activo pero con banner indicando dias restantes de prueba |


**56. Estadisticas de Uso del Plan**
Para negocios con plan activo, el dashboard muestra 3 tarjetas de uso:

| Tarjeta | Dato | Limite Pro |
| --- | --- | --- |
| Sedes Activas | Numero de sedes creadas | 10 |
| Empleados Activos | Numero de empleados registrados | 15 |
| Citas del Mes | Citas agendadas en el mes actual | Ilimitadas |


Cada tarjeta muestra una barra de progreso visual que indica el porcentaje de uso respecto al limite del plan. Para citas (ilimitadas en Pro), la barra muestra el conteo sin limite superior.
**57. Historial de Pagos**
El historial de pagos muestra una tabla con todas las transacciones de la suscripcion:

| Columna | Descripcion |
| --- | --- |
| Fecha | Fecha del cargo |
| Concepto | "Plan Pro — Mensual" o "Plan Pro — Anual" |
| Monto | Monto cobrado en COP |
| Estado | pagado, pendiente, fallido |
| Factura | Enlace para descargar la factura en PDF (si disponible) |


**58. Flujo de Cancelacion**
Para cancelar el Plan Pro:
- Navegar a Facturacion en la barra lateral.
- Hacer clic en "Cancelar Suscripcion".
- Confirmar la cancelacion en el dialogo de confirmacion.
- El plan se mantiene activo hasta el final del periodo de facturacion actual.
- Al expirar, el negocio vuelve al Plan Gratuito con los limites originales.

| Datos No Se Eliminan Al cancelar el Plan Pro, los datos del negocio (gastos, vacantes, recursos, salarios) no se eliminan. Solo se bloquea el acceso a los modulos exclusivos. Si el plan se reactiva posteriormente, toda la informacion estara disponible nuevamente. |
| --- |


**59. Pagina de Precios — Vista Completa**
La pagina de Precios (PricingPage) es accesible desde Facturacion o desde cualquier PlanGate que invite al usuario a actualizar su plan. Muestra los 3 planes disponibles con sus caracteristicas, precios y botones de accion.
**60. Grid de 3 Planes**

| Plan | Precio Mensual | Precio Anual | Badge | Boton |
| --- | --- | --- | --- | --- |
| Gratuito | $0 COP | $0 COP | — | Deshabilitado (plan actual si aplica) |
| Basico | $89,900 COP | $899,000 COP | Mas Popular | Activo — seleccionar plan |
| Pro | $159,900 COP | $1,599,000 COP | Proximamente | Deshabilitado (opacity 60%) |


Cada plan muestra:
- Icono representativo.
- Nombre del plan y subtitulo descriptivo.
- Precio mensual y anual (con tachado si hay descuento activo).
- Lista de funcionalidades incluidas (check verde) y no incluidas (X gris).
- Boton de accion (segun estado del plan).
El Plan Basico tiene estilo destacado con borde primario, sombra y escala 105% para resaltar como la opcion mas popular.
El Plan Pro aparece con opacidad reducida (60%) y un badge "Proximamente" que indica que aun no esta disponible para compra.

| [ Espacio reservado para captura de pantalla ] |
| --- |
| Figura: Grid de 3 planes con el Plan Pro marcado como Proximamente |


**61. Codigos de Descuento**
La pagina de precios incluye un campo de texto para ingresar codigos de descuento promocionales. El flujo es:
- El usuario escribe el codigo en el campo (se convierte a mayusculas automaticamente).
- Hace clic en "Aplicar".
- El sistema valida el codigo — si es valido, muestra un toast de exito y actualiza los precios con el descuento aplicado (tachado + nuevo precio).
- Si el codigo no es valido o ha expirado, se muestra un toast de error.
**62. Preguntas Frecuentes en Pricing**
La pagina de precios incluye 4 preguntas frecuentes:
**Puedo cambiar de plan?**
Si. Los upgrades se prorratean (se cobra la diferencia proporcional). Los downgrades se aplican al final del periodo de facturacion actual.
**Hay periodo de prueba?**
El Plan Basico ofrece 14 dias de prueba gratuita sin requerir datos de pago. El Plan Pro ofrecera condiciones similares cuando se habilite.
**Que metodos de pago aceptan?**
Visa, Mastercard, American Express via Stripe. PayU para metodos locales colombianos. MercadoPago para otros paises de Latinoamerica.
**Puedo cancelar en cualquier momento?**
Si, sin penalidades. El plan se mantiene activo hasta el final del periodo pagado.
Al final de la seccion hay un CTA: "Necesitas ayuda para elegir?" con enlace a soporte@gestabiz.com.

**LIMITES AMPLIADOS Y FUNCIONALIDADES ADICIONALES**
**63. Limites Ampliados del Plan Pro**
El Plan Pro expande significativamente los limites operativos del negocio, permitiendo gestionar operaciones mas grandes y complejas:

| Recurso | Plan Basico | Plan Pro | Incremento |
| --- | --- | --- | --- |
| Sedes | 3 | 10 | +233% |
| Empleados | 6 | 15 | +150% |
| Citas/mes | Ilimitadas | Ilimitadas | Sin cambio |
| Clientes | Ilimitados | Ilimitados | Sin cambio |
| Servicios | Ilimitados | Ilimitados | Sin cambio |


**64. Gestion de hasta 10 Sedes**
Con el Plan Pro, el negocio puede tener hasta 10 sedes activas simultaneamente. Cada sede funciona de forma independiente con sus propios:
- Horarios de apertura y cierre.
- Empleados asignados.
- Servicios disponibles.
- Recursos fisicos.
- Direccion y coordenadas de geolocalizacion.
Esto permite a cadenas de negocios, franquicias o negocios con multiples puntos de atencion gestionar toda su operacion desde una sola cuenta de Gestabiz.

| Limite de Sedes Si el negocio intenta crear una sede mas alla del limite de 10, el sistema muestra un PlanLimitBanner informando que se ha alcanzado el maximo del plan. No se ofrece un plan superior — 10 es el maximo actual. |
| --- |


**65. Hasta 15 Empleados**
El Plan Pro permite registrar hasta 15 empleados activos en el negocio (vs. 6 del Plan Basico). Todos los empleados tienen acceso a:
- Horarios configurables por dia de la semana.
- Hora de almuerzo personalizada.
- Asignacion de servicios.
- Configuracion de salario (exclusivo Plan Pro).
- Posicion en el mapa jerarquico.
- Permisos personalizados.
Si el negocio ya tiene 15 empleados activos y necesita mas, el sistema muestra un PlanLimitBanner. Actualmente no existe un plan superior al Pro.

**FUNCIONALIDADES MARCADAS COMO PROXIMAMENTE**
**66. Funcionalidades Marcadas como Proximamente**
Las siguientes funcionalidades estan parcialmente implementadas (backend listo) pero su interfaz de usuario aun esta en desarrollo. Se habilitaran en futuras actualizaciones sin costo adicional para suscriptores del Plan Pro:

| Funcionalidad | Estado Backend | Estado UI | Descripcion |
| --- | --- | --- | --- |
| Compra del Plan Pro | Listo (Stripe/PayU/MP) | Boton deshabilitado | El flujo de checkout esta listo pero el boton muestra "Proximamente" |
| Editor de Permisos Individuales | Listo (79 permisos) | Proximamente | Asignar/revocar los 79 tipos de permisos individualmente a cada usuario |
| Plantillas de Permisos UI | Listo (9 templates) | Proximamente | Crear, editar y aplicar plantillas de permisos personalizadas desde la UI |
| Historial de Auditoria | Listo (permission_audit_log) | Proximamente | Ver registro completo de cambios de permisos con fecha, usuario y accion |
| Emojis en Chat | — | Proximamente | Selector de emojis en la ventana de chat |
| Llamada de Voz | — | Proximamente | Llamadas de voz entre usuarios dentro de la plataforma |
| Videollamada | — | Proximamente | Videollamadas entre usuarios dentro de la plataforma |
| Agregar a Google Calendar | Listo | Proximamente | Boton para agregar la cita confirmada directamente al Google Calendar del cliente |


**67. Editor de Permisos Individuales (Proximamente)**
Actualmente en el Plan Basico, los permisos se asignan mediante 3 plantillas predefinidas (Recepcionista, Profesional, Contador). El Plan Pro habilitara un editor completo que permite:
- Ver los 79 tipos de permisos organizados por categoria (services.*, employees.*, appointments.*, etc.).
- Asignar o revocar cada permiso individualmente a cada usuario.
- Crear plantillas personalizadas combinando permisos a medida.
- Aplicar plantillas en bulk a multiples usuarios.
El backend esta completamente funcional (PermissionRPCService con 5 metodos: revoke, assign, applyTemplate, bulkRevoke, bulkAssign). Solo falta la interfaz de usuario.
**68. Historial de Auditoria (Proximamente)**
El Historial de Auditoria permitira al administrador ver un registro completo de todos los cambios de permisos realizados en el negocio:
- Quien asigno o revoco el permiso.
- A quien se le asigno o revoco.
- Que permiso fue afectado.
- Fecha y hora del cambio.
- Metodo utilizado (individual, plantilla, bulk).
La tabla permission_audit_log ya registra estos datos automaticamente mediante triggers. Solo falta la interfaz de consulta.

**UPGRADE, SOPORTE Y GLOSARIO**
**69. Como Actualizar de Basico a Pro**
Cuando el Plan Pro se habilite para compra, los negocios con Plan Basico podran actualizarse facilmente:
- Navegar a Facturacion → Mejorar Plan.
- Seleccionar el Plan Pro.
- El sistema calcula la diferencia prorrateada por los dias restantes del ciclo actual.
- Completar el pago adicional.
- Los modulos Pro se desbloquean inmediatamente.
Ejemplo: Si quedan 15 dias del mes y el negocio paga $89,900/mes (Basico), la diferencia prorrateada seria aproximadamente $35,000 COP por los 15 dias restantes. A partir del siguiente ciclo se cobrara el monto completo del Plan Pro.

| Sin Perdida de Datos Al actualizar de Basico a Pro, no se pierden datos ni configuraciones. Todos los empleados, ausencias, ventas, reportes y permisos existentes se mantienen intactos. Solo se agregan nuevas capacidades. |
| --- |


**70. Soporte y Ayuda del Plan Pro**
Los suscriptores del Plan Pro cuentan con:
- Email — Soporte prioritario por email con respuesta en 12-24 horas habiles.
- Bug Reports — Boton de reporte de bugs integrado en la aplicacion (FloatingBugReportButton).
- Documentacion — Documentacion completa en este manual y en la Propuesta de Valor.
- Updates — Actualizaciones automaticas — las nuevas funcionalidades se despliegan sin intervencion del usuario.
Contacto: soporte@gestabiz.com | WhatsApp: +57 XXX XXX XXXX | www.gestabiz.com
**71. Glosario de Terminos del Plan Pro**

| Termino | Definicion |
| --- | --- |
| PlanGate | Pantalla de bloqueo que aparece al intentar acceder a un modulo no incluido en el plan activo |
| PlanLimitBanner | Banner que informa cuando se ha alcanzado el limite del plan (sedes, empleados) |
| resource_model | Campo de la tabla businesses que define el modelo operativo (professional, physical_resource, hybrid, group_class) |
| recurring_expenses | Tabla que almacena egresos que se repiten periodicamente |
| Payroll | Sistema de nomina — configuracion de salarios y generacion automatica de egresos |
| UPSERT | Operacion que inserta un registro nuevo o actualiza el existente si ya existe |
| JSONB | Tipo de dato PostgreSQL para almacenar datos JSON binarios (usado en amenidades) |
| Overlap detection | Algoritmo que detecta conflictos de horario entre citas/reservas |
| RPC | Remote Procedure Call — funciones SQL ejecutadas desde el cliente via supabase.rpc() |
| SECURITY DEFINER | Modo de ejecucion de funciones SQL con privilegios del creador (no del usuario) |
| Prorrateado | Calculo proporcional del costo al cambiar de plan a mitad de ciclo |
| Edge Function | Funcion serverless ejecutada en Supabase (Deno) para operaciones privilegiadas |
| MandatoryReviewModal | Modal que se muestra automaticamente para reviews obligatorias en reclutamiento |
| Soft delete | Desactivacion logica (is_active = false) en vez de eliminacion fisica |
| Materialized view | Vista precalculada en PostgreSQL que se refresca periodicamente |
| COP | Peso colombiano — moneda utilizada en toda la plataforma |
| Owner bypass | El propietario del negocio tiene todos los permisos sin verificacion |
| PlanId | Identificador del plan activo del negocio (free, basico, pro) |


**Desarrollado por Ti Turing — www.tituring.com**
*Gestabiz v1.0.3 — Manual de Usuario — Parte 5 de 5*

---

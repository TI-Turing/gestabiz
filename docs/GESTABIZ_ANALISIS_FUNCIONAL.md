# Gestabiz — Análisis Funcional Completo

> **Versión analizada**: 1.1.0 (Noviembre 2025)  
> **Estado del proyecto**: BETA completada — solo bugs y optimizaciones  
> **Desarrollado por**: TI-Turing | Jose Luis Avila  
> **Fecha del análisis**: Marzo 2026

---

## Tabla de Contenidos

1. [¿Qué es Gestabiz?](#1-qué-es-gestabiz)
2. [Público Objetivo](#2-público-objetivo)
3. [Plataformas Disponibles](#3-plataformas-disponibles)
4. [Tipos de Negocio Soportados](#4-tipos-de-negocio-soportados)
5. [Sistema de Roles y Usuarios](#5-sistema-de-roles-y-usuarios)
6. [Planes y Precios](#6-planes-y-precios)
7. [Funcionalidades Principales por Módulo](#7-funcionalidades-principales-por-módulo)
   - 7.1 Gestión de Citas
   - 7.2 Gestión de Negocios
   - 7.3 Gestión de Empleados
   - 7.4 Gestión de Sedes / Ubicaciones
   - 7.5 Gestión de Servicios y Recursos
   - 7.6 Sistema de Reclutamiento y Vacantes
   - 7.7 Sistema de Ausencias y Vacaciones
   - 7.8 Sistema Contable
   - 7.9 Ventas Rápidas
   - 7.10 Sistema de Notificaciones Multicanal
   - 7.11 Chat en Tiempo Real
   - 7.12 Perfiles Públicos y Búsqueda
   - 7.13 Sistema de Reviews
   - 7.14 Sistema de Billing y Suscripciones
   - 7.15 Sistema de Permisos Granulares
   - 7.16 Google Analytics 4
   - 7.17 Extensión de Navegador
8. [Flujos Principales](#8-flujos-principales)
   - 8.1 Flujo de Reserva de Cita (Cliente)
   - 8.2 Alta de Negocio (Admin)
   - 8.3 Incorporación de Empleado
   - 8.4 Solicitud de Ausencia o Vacación
   - 8.5 Publicación y Gestión de Vacante
   - 8.6 Flujo de Pago y Suscripción
   - 8.7 Registro de Venta Rápida
9. [Lo que NO puede hacer Gestabiz (Limitaciones conocidas)](#9-lo-que-no-puede-hacer-gestabiz-limitaciones-conocidas)
10. [Integraciones Externas](#10-integraciones-externas)
11. [Seguridad y Privacidad](#11-seguridad-y-privacidad)
12. [Stack Técnico Resumido](#12-stack-técnico-resumido)

---

## 1. ¿Qué es Gestabiz?

**Gestabiz** es una plataforma SaaS **todo-en-uno** diseñada para que pequeños y medianos negocios de servicios **gestionen citas, clientes, empleados, contabilidad, reclutamiento y comunicaciones desde un solo lugar**.

La propuesta de valor central es eliminar la necesidad de usar múltiples herramientas independientes (agenda física, WhatsApp para recordatorios, Excel para contabilidad, etc.) ofreciendo en cambio un sistema integrado, automatizado y accesible desde web, móvil y extensión de navegador.

**Mercado objetivo principal**: PyMEs de servicios en Colombia, con cobertura ampliable a toda Latinoamérica (soporte de PayU y MercadoPago).

**Propuesta de valor cuantificada** (según datos de marketing de la plataforma):
- Reducción del 70% en ausencias (no-shows) gracias a recordatorios automáticos
- Ahorro de 8–12 horas semanales en gestión manual
- Aumento promedio del 35% en reservas al habilitar reservas 24/7
- ROI promedio del 900% (la inversión se recupera en el primer mes)

---

## 2. Público Objetivo

### Perfil del Administrador / Dueño de Negocio
- Dueños o gerentes de negocios de servicios (salones, clínicas, gimnasios, etc.)
- PyMEs con 1 a ~50 empleados y hasta 10 sedes físicas
- Negocios que atienden por cita previa o con reserva de recursos físicos
- Interés: digitalizar la operación, reducir trabajo manual, aumentar ingresos

### Perfil del Empleado / Profesional
- Profesionales que ofrecen servicios dentro de un negocio (estilistas, médicos, entrenadores)
- Empleados que necesitan ver su agenda, gestionar ausencias y postularse a vacantes
- Pueden trabajar en múltiples negocios simultáneamente

### Perfil del Cliente Final
- Clientes que buscan y reservan servicios en negocios locales
- Usuarios que quieren poder reservar en cualquier momento (24/7) sin llamar
- Clientes interesados en ver historial de citas, favoritos y calificaciones

### Sectores de Negocio Atendidos
- Belleza y estética (salones, spas, barberías, manicure)
- Salud y bienestar (clínicas, consultorios médicos, fisioterapia, odontología)
- Fitness y deportes (gimnasios, canchas deportivas, entrenadores personales)
- Educación (tutorías, academias, cursos)
- Consultoría y servicios profesionales (abogados, contadores, coaches)
- Mantenimiento y técnicos
- Alimentación (restaurantes con reserva de mesas)
- Entretenimiento y eventos
- Hotelería (reserva de habitaciones)
- Coworking y espacios (salas de reunión, escritorios)

---

## 3. Plataformas Disponibles

| Plataforma | Estado | Descripción |
|---|---|---|
| **Web App** | Producción | SPA React, accesible en cualquier navegador |
| **App Móvil** | En desarrollo | Expo / React Native para iOS y Android |
| **Extensión de Navegador** | Disponible | Chrome Extension para acceso rápido |

La web app es la plataforma principal y más completa. La app móvil está en proceso de construcción reutilizando toda la lógica de negocio de la web.

---

## 4. Tipos de Negocio Soportados

Gestabiz introduce un sistema de **Modelo de Negocio Flexible** capaz de soportar negocios muy distintos:

| Modelo | Descripción | Ejemplos |
|---|---|---|
| `professional` | Reservas con profesionales específicos (modelo clásico) | Salón de belleza, clínica, barbería |
| `physical_resource` | Reservas de recursos físicos sin empleado asignado | Hotel (habitaciones), cancha deportiva, mesa de restaurante |
| `hybrid` | Combina empleados y recursos físicos | Clínica con salas de procedimientos |
| `group_class` | Clases grupales con cupo máximo | Gimnasio, academia de baile |

**15 tipos de recursos físicos** soportados en el modelo de recurso:

> `room`, `table`, `court`, `desk`, `equipment`, `vehicle`, `space`, `lane`, `field`, `station`, `parking_spot`, `bed`, `studio`, `meeting_room`, `other`

**15 categorías de negocio** con ~60 subcategorías. Cada negocio puede tener hasta **3 subcategorías** asignadas.

---

## 5. Sistema de Roles y Usuarios

### Principio Fundamental: Roles Dinámicos
Los roles **NO se guardan en la base de datos**. Se calculan en tiempo real consultando las relaciones del usuario con los negocios. Un mismo usuario puede tener los tres roles simultáneamente.

### Los Tres Roles

#### ADMIN (Administrador / Dueño)
- Es el `owner_id` de al menos un negocio, O tiene rol `admin` en `business_roles`
- **Bypass total de permisos** si es owner del negocio
- Acceso a: gestión completa del negocio, empleados, sedes, servicios, contabilidad, reclutamiento, reportes, configuración
- Se registra automáticamente como empleado tipo `manager` en `business_employees` (trigger automático)

#### EMPLOYEE (Empleado / Profesional)
- Registrado en `business_employees.employee_id`
- Acceso a: su agenda de citas, solicitud de ausencias, sus vacantes aplicadas, configuración personal, chat
- Puede pertenecer a múltiples negocios
- Puede controlar si acepta mensajes de clientes

#### CLIENT (Cliente)
- Disponible para todo usuario autenticado (rol por defecto)
- Acceso a: búsqueda de negocios, reserva de citas, historial, favoritos, reviews, chat con negocios

### Cambio de Rol
Un usuario puede cambiar entre sus roles activos sin cerrar sesión. El rol activo se persiste en `localStorage`. La navegación desde notificaciones cambia el rol automáticamente cuando es necesario.

---

## 6. Planes y Precios

| Plan | Precio / mes | Precio / año | Estado |
|---|---|---|---|
| **Gratuito** | $0 COP | $0 COP | Activo |
| **Inicio** | $80.000 COP | $800.000 COP (10% OFF) | Activo (**Más Popular**) |
| **Profesional** | $200.000 COP | $2.000.000 COP | Próximamente |
| **Empresarial** | $500.000 COP | $5.000.000 COP | Próximamente |

### Límites por Plan

| Característica | Gratuito | Inicio | Profesional | Empresarial |
|---|---|---|---|---|
| Negocios | 1 | 1 | 1 | Ilimitado |
| Sedes | 1 | 3 | 10 | Ilimitado |
| Empleados | 1 | 6 | 21 | Ilimitado |
| Citas/mes | 50 | Ilimitado | Ilimitado | Ilimitado |
| Clientes | 100 | Ilimitado | Ilimitado | Ilimitado |
| Servicios | 10 | Ilimitado | Ilimitado | Ilimitado |

### Funcionalidades por Plan

**Gratuito incluye:**
- Gestión completa de citas y calendario
- Recordatorios automáticos (Email + WhatsApp)
- Gestión básica de clientes y catálogo de servicios
- Dashboard con estadísticas básicas
- App móvil incluida
- Soporte por email

**Inicio agrega:**
- Multi-ubicación (hasta 3 sucursales)
- Sistema contable básico (P&L, IVA, ICA)
- Gestión avanzada de clientes
- Reseñas y calificaciones públicas
- Sincronización con Google Calendar
- Chat interno entre empleados
- Exportación de reportes (CSV, Excel)
- Extensión de navegador
- Soporte prioritario (Chat + Email)

**Profesional agrega** (próximamente):
- Sistema contable completo + Facturación DIAN
- Reportes fiscales avanzados
- Portal de reclutamiento y vacantes de empleo
- Analytics avanzados con IA
- API Access para integraciones
- Soporte Premium (Teléfono + WhatsApp)
- Onboarding personalizado y branding personalizado

**Empresarial agrega** (próximamente):
- Servidor dedicado o instancia privada
- SLA garantizado (99.9% uptime)
- Desarrollo de funcionalidades custom
- Account Manager dedicado

**Gateways de pago soportados:**
- **Stripe** — Global
- **PayU Latam** — Colombia
- **MercadoPago** — Argentina, Brasil, México, Chile

---

## 7. Funcionalidades Principales por Módulo

### 7.1 Gestión de Citas

El sistema de citas es el **núcleo de la plataforma**. Gestiona el ciclo completo desde la reserva hasta la finalización.

#### Wizard de Reserva (AppointmentWizard)
Proceso guiado de 6 a 8 pasos dependiendo del contexto:

1. **Selección de negocio** — Busca y elige el negocio (si no está preseleccionado)
2. **Selección de sede** — Elige la ubicación física
3. **Selección de servicio** — Filtra servicios disponibles en esa sede
4. **Selección de empleado o recurso** — Elige profesional o recurso físico compatible con el servicio
5. **Selección de negocio del empleado** — Solo si el profesional trabaja en múltiples negocios
6. **Selección de fecha y hora** — Con validación en tiempo real (ver más abajo)
7. **Confirmación** — Resumen completo de datos
8. **Éxito** — Confirmación visual + tracking GA4 + notificación automática

#### Validaciones de Fecha/Hora (CRÍTICAS)
El calendario deshabilita automáticamente slots no disponibles por cualquiera de estas razones:
- Fuera del horario de apertura/cierre de la sede (`opens_at`, `closes_at`)
- Durante la hora de almuerzo del profesional (`lunch_break_start`, `lunch_break_end`)
- Overlap con citas existentes del mismo profesional (algoritmo: `slotStart < aptEnd && slotEnd > aptStart`)
- Ausencia aprobada del profesional
- Festivo público del país del negocio
- Cada slot deshabilitado muestra un tooltip indicando la razón

#### Edición de Citas
- Editar fecha, hora, empleado o sede de una cita existente
- Al editar, excluye la misma cita del cálculo de overlaps (permite reagendar al mismo horario)
- Diferencia entre operaciones CREATE e UPDATE

#### Cancelación de Citas
- Clientes pueden cancelar sus propias citas
- Empleados pueden cancelar citas asignadas a ellos
- Admins pueden cancelar cualquier cita del negocio
- Cancelación automática ante ausencia de emergencia del empleado (Edge Function)
- Notificación automática a todas las partes involucradas

#### Calendario Visual
- Vista de calendario para administradores (AppointmentsCalendar)
- Vista de agenda para empleados (EmployeeCalendarView, EmployeeAppointmentsPage)
- Vista de historial para clientes (ClientCalendarView, ClientHistory)

#### Confirmación / Página de Confirmación
- Páginas dedicadas `/appointment/confirmation/:id` y `/appointment/cancellation/:id`
- Diseñadas para consumirse vía link en notificación de email/SMS

---

### 7.2 Gestión de Negocios

#### Creación y Registro
- Registro guiado con información básica, categoría, subcategorías (máx. 3), horarios, servicios iniciales
- Generación de slug SEO-friendly único (ej: `salon-belleza-medellin`)
- Upload de logo y banner (con recorte integrado - ImageCropper, BannerCropper)
- Datos legales: NIT/RUT/Cédula, razón social, registro mercantil

#### Gestión Multi-negocio
- Un usuario puede ser dueño de múltiples negocios
- Header con dropdown para cambiar entre negocios activos
- Métricas y datos independientes por negocio

#### Modelo de Negocio Flexible
- Tipo de modelo configurable: `professional`, `physical_resource`, `hybrid`, `group_class`
- Soporte para recursos físicos (habitaciones, canchas, mesas, etc.)
- Precio personalizado de un servicio para un recurso específico

#### Perfil Público del Negocio (SEO)
- URL pública indexable: `/negocio/:slug`
- Meta tags dinámicos, Open Graph, Twitter Card, JSON-LD structured data
- 4 secciones/tabs: Servicios, Ubicaciones, Reseñas, Acerca de
- Botón "Reservar" con flujo de reserva directo desde el perfil público
- Un cliente no autenticado es redirigido a login y luego regresa automáticamente al wizard

#### Sede Preferida Global
- Cada administrador puede configurar una "Sede Administrada" por defecto
- Pre-selección automática en empleados, ventas rápidas, reportes y creación de vacantes
- Almacenamiento en `localStorage`, no en BD

---

### 7.3 Gestión de Empleados

#### Alta y Vinculación
- Invitación por código o enlace a empleados existentes
- Solicitud de acceso por parte del empleado (EmployeeRequestAccess)
- Aprobación de solicitudes por el administrador (EmployeeRequestsList)
- Registro automático del owner del negocio como empleado con rol `manager` (trigger)

#### Perfiles de Empleados
- Información personal, contacto, foto de perfil
- Especialidades, certificaciones, experiencia
- Configuración de horario de trabajo (7 días, horario de entrada/salida)
- Hora de almuerzo con intervalos de 15 minutos
- Sede principal asignada

#### Jerarquía y Estructura
- Estructura jerárquica de empleados (HierarchyMapView)
- Niveles jerárquicos configurables
- Vista tipo mapa/árbol del organigrama

#### Configuración de Salarios
- Salario base mensual
- Porcentajes de comisión configurables
- Registro de estructura salarial por empleado (EmployeeSalaryConfig)

#### Transferencia entre Sedes
- Empleados pueden ser transferidos entre sedes
- Flujo de transferencia con aprobación
- Cancelación automática de citas futuras al transferir (Edge Function)
- Estados de transferencia visibles (TransferStatusBadge)

#### Gestión desde el Empleado
- Dashboard propio con resumen de citas del día/semana
- Ver y gestionar sus propias citas
- Solicitar ausencias y vacaciones
- Ver balance de vacaciones
- Configurar disponibilidad de mensajes de clientes (toggle)
- Ver sus empleos en múltiples negocios (MyEmployments)

---

### 7.4 Gestión de Sedes / Ubicaciones

- Crear múltiples sedes por negocio (según límites del plan)
- Dirección completa con geolocalización (coordenadas lat/lng)
- Horario de apertura y cierre por sede (independiente del horario general del negocio)
- Teléfono y email por sede
- Estado activo/inactivo por sede
- Badge "Administrada" para señalar la sede preferida
- Perfil modal de cada sede con sus servicios y empleados asignados
- Configuración de gastos fijos por sede (LocationExpenseConfig)

---

### 7.5 Gestión de Servicios y Recursos

#### Servicios
- Nombre, descripción, categoría, duración (en minutos), precio (COP)
- Activar/desactivar servicio sin eliminar
- Asignar servicios a sedes específicas (LocationServices)
- Asignar servicios a empleados específicos (EmployeeServices)
- Campo de color para distinguir visualmente en calendarios

#### Recursos Físicos (Modelo Flexible)
- 15 tipos: habitación, mesa, cancha, escritorio, equipo, vehículo, espacio, carril, campo, estación, parking, cama, estudio, sala de reuniones, otro
- Capacidad, tarifa horaria, estado, amenidades (JSONB)
- Asignación de servicios a recursos con precio personalizado (override)
- Estadísticas de uso: total de reservas, ingresos totales, ingresos del mes
- Validación de disponibilidad vía RPC: `is_resource_available()`

---

### 7.6 Sistema de Reclutamiento y Vacantes

#### Publicación de Vacantes (Admin)
- Título, descripción, habilidades requeridas
- Rango salarial o modalidad de comisión (checkbox)
- Sede asignada a la vacante
- Activación/desactivación de la publicación

#### Marketplace de Vacantes (Empleado / Candidato)
- Listado de vacantes disponibles en negocios cercanos
- Matching inteligente entre el perfil del empleado y los requisitos de la vacante
- Score de compatibilidad calculado
- Detección de conflictos de horario antes de postularse
- Aplicación con CV adjunto (PDF, almacenado en Storage bucket `cvs`)
- Modal de perfil del aplicante para el empleador

#### Gestión de Aplicaciones (Admin)
- Listado de aplicaciones recibidas por vacante
- Aceptar o rechazar aplicaciones
- Notificación automática al candidato
- **Review obligatoria** al completar una contratación o finalizar la relación laboral
- Modal de revisión forzada (MandatoryReviewModal) para asegurar retroalimentación

#### Perfiles de Empleados Públicos
- Cada empleado puede tener un perfil público con habilidades, experiencia, certificaciones
- Visible en el perfil del negocio y en resultados de búsqueda de profesionales

---

### 7.7 Sistema de Ausencias y Vacaciones

#### Política Crítica
**La aprobación es SIEMPRE obligatoria** (`require_absence_approval = true` forzado en BD). Ningún empleado puede tomar ausencias o vacaciones sin autorización previa del administrador.

#### Tipos de Ausencia
`vacation`, `emergency`, `sick_leave`, `personal`, `other`

#### Flujo de Solicitud
1. Empleado abre el modal de solicitud (AbsenceRequestModal) con rango de fechas
2. El calendario muestra días laborables, festivos y días ya usados con highlighting visual
3. El sistema valida que el empleado tenga días disponibles
4. Se crea la solicitud y se notifica a **todos** los administradores y managers del negocio (in-app + email)

#### Flujo de Aprobación
1. Admin ve solicitudes pendientes en el tab "Ausencias" del dashboard
2. Card de aprobación (AbsenceApprovalCard) con opción de aprobar o rechazar + comentarios
3. Al aprobar: balance de vacaciones actualizado automáticamente (trigger)
4. Empleado notificado del resultado
5. Si tipo es `emergency`: Edge Function cancela automáticamente todas las citas futuras del profesional y notifica a los clientes

#### Balance de Vacaciones
- Widget visual (VacationDaysWidget) con días disponibles, usados, pendientes y restantes
- Días acumulados configurables por negocio (`vacation_days_per_year`, default 15)
- Festivos públicos de Colombia (54 festivos para 2025–2027) excluidos del conteo

---

### 7.8 Sistema Contable

#### Transacciones
- Registro de ingresos y egresos con clasificación fiscal
- Campos fiscales: subtotal, tipo de impuesto, tasa, monto de impuesto, período fiscal
- Tipos: `income`, `expense`
- Categorías: `service_sale`, `quick_sale`, y otras

#### Cálculo Automático de Impuestos (Colombia)
- **IVA**: Calculado según tasa configurada por negocio
- **ICA** (Impuesto de Industria y Comercio): Por municipio/ciudad
- **Retención en la Fuente**: Automática según normativa colombiana
- Configuración fiscal por negocio (`BusinessTaxConfig`)

#### Gastos Recurrentes
- Registro de gastos fijos mensuales por negocio o sede
- Categorización de gastos
- Proyección mensual automática

#### Reportes y Exportaciones
- Dashboard financiero con gráficos interactivos:
  - Ingresos vs. Gastos mensual (IncomeVsExpenseChart)
  - Tendencia mensual (MonthlyTrendChart)
  - Distribución por categoría (CategoryPieChart)
  - Ingresos por empleado (EmployeeRevenueChart)
  - Ingresos por sede (LocationBarChart)
- Exportación a PDF, CSV y Excel
- Reportes de períodos fiscales
- P&L (Profit & Loss) automático

---

### 7.9 Ventas Rápidas

Módulo diseñado para registrar ventas walk-in (clientes que llegan sin cita previa).

#### Formulario de Venta
- Cliente: nombre, teléfono, documento, email (no requiere cuenta en la plataforma)
- Servicio (del catálogo del negocio)
- Sede (pre-seleccionada con la sede preferida)
- Empleado que atendió (opcional)
- Monto y método de pago
- Notas adicionales

#### Estadísticas en Tiempo Real
- Ventas del día, últimos 7 días, últimos 30 días (en COP)
- Historial de las últimas 10 ventas registradas

#### Integración Contable
- Cada venta rápida genera automáticamente una transacción tipo `income` con categoría `service_sale`
- Se refleja en los reportes contables del negocio

#### Acceso
- Exclusivo para administradores del negocio

---

### 7.10 Sistema de Notificaciones Multicanal

#### Canales Disponibles
| Canal | Proveedor | Estado |
|---|---|---|
| Email | Brevo (Sendinblue) | Activo — 300 emails/día gratis |
| SMS | AWS SNS | Opcional |
| WhatsApp | WhatsApp Business API | Disponible |
| In-App | Supabase Realtime | Activo |

#### 17 Tipos de Notificaciones
- **Citas (7)**: Recordatorio, confirmación, cancelación, reagendamiento, nueva cita de cliente, nueva cita de empleado, nueva cita de negocio
- **Verificaciones (3)**: Email, SMS, WhatsApp
- **Empleados (3)**: Nueva solicitud de acceso, solicitud aceptada, solicitud rechazada
- **Vacantes (4)**: Nueva vacante publicada, nueva aplicación, aplicación aceptada, aplicación rechazada

#### Recordatorios Automáticos
- Configurables por negocio: 10 min, 1h, 24h, 48h antes de la cita
- Procesador automático corre cada 5 minutos (Edge Function `process-reminders`)
- Sistema de fallback automático entre canales si uno falla

#### Preferencias Granulares
- Cada usuario puede configurar qué tipos de notificaciones recibe por qué canal
- Configuración por negocio (un negocio puede preferir solo email; otro solo WhatsApp)

#### Centro de Notificaciones In-App
- Campana con badge de no leídas (NotificationBell)
- Panel lateral con todas las notificaciones (NotificationCenter)
- Navegación inteligente: al hacer clic en una notificación, cambia de rol automáticamente si es necesario y navega a la pantalla correcta
- Supresión de notificaciones: si el chat está activo en la conversación, no muestra toast duplicado

---

### 7.11 Chat en Tiempo Real

#### Características
- Mensajería instantánea entre cualquier combinación de usuarios
- Adjuntos de archivos e imágenes (Storage bucket `chat-attachments`)
- Read receipts (acuses de lectura)
- Indicador de escritura (typing indicator)
- Vista de conversaciones con última actividad

#### Integración con el Negocio
- Clientes pueden iniciar chat con empleados o el dueño desde el perfil público del negocio
- Los empleados pueden controlar si reciben mensajes de clientes (toggle `allow_client_messages`)
- Los managers no muestran la sede en el selector de chat (trabajan en todas las sedes)
- Notificación por email si el mensaje no se lee en X tiempo (Edge Function `send-unread-chat-emails`)

#### Arquitectura
- Subscripciones Realtime a `messages` y `conversations`
- Nombres de canales estáticos para evitar memory leaks (ej: `channel_${conversationId}` sin timestamp)
- FloatingChatButton para acceso rápido desde cualquier pantalla

---

### 7.12 Perfiles Públicos y Búsqueda

#### Búsqueda de Negocios y Profesionales
- Barra de búsqueda con selector de tipo (negocio, servicio, profesional)
- Debounce de 300ms para no sobrecargar la BD
- Full-text search con PostgreSQL (índices trigram para búsqueda fuzzy)
- **6 algoritmos de ordenamiento**:
  1. Relevancia (ts_rank)
  2. Rating + número de reseñas
  3. Distancia (geolocalización)
  4. Precio
  5. Fecha de creación
  6. Balanceado: Rating × 0.6 + (1 / distancia_km) × 0.4
- Filtros por categoría y ciudad
- Geolocalización automática del usuario (con prompt de permiso)

#### Perfiles Públicos de Negocios
- URL SEO-friendly: `gestabiz.com/negocio/salon-belleza-medellin`
- Indexable por Google (robots.txt permite `/negocio/*`)
- Sitemap.xml generado dinámicamente (`npm run generate-sitemap`)
- Información completa: descripción, servicios, ubicaciones, horarios, ratings
- Fotos: logo y banner
- Reseñas de clientes con respuestas del negocio
- Reserva directa desde el perfil

#### Página de Aterrizaje Pública (Landing Page)
- Sección Hero con estadísticas
- Características del producto
- Cómo funciona
- Testimonios de clientes reales
- Calculadora de ROI interactiva
- Planes y precios
- CTA con prueba gratuita de 30 días
- Completamente responsive (mobile-first)

---

### 7.13 Sistema de Reviews

#### Reglas de Negocio
- Solo clientes con **citas completadas** pueden dejar reseña
- **Una reseña por cita** (sin duplicados)
- Las reseñas son **anónimas** (no se muestra el nombre del reviewer)
- El negocio o empleado puede **responder** a la reseña
- El administrador puede **moderar** (ocultar/mostrar) reseñas
- **Review obligatoria** después de contratar o finalizar relación con empleado vía vacante

#### Información Capturada
- Rating de 1 a 5 estrellas (clickeable)
- Comentario de texto libre
- Tipo: reseña del negocio o del profesional específico

#### Visualización
- Distribución de ratings con gráfico de barras
- Rating promedio calculado
- Lista con filtros por rating, fecha
- Respuestas del negocio visibles debajo de cada reseña
- Integrado en perfiles públicos y en modal de perfil de usuario

---

### 7.14 Sistema de Billing y Suscripciones

#### Gestión de Suscripción (BillingDashboard)
- Ver plan activo, fecha de renovación y estado
- Historial de facturas (PaymentHistory)
- Métricas de uso vs. límites del plan (UsageMetrics)
- Agregar o cambiar método de pago (AddPaymentMethodModal)
- Cancelar suscripción (CancelSubscriptionModal)
- Upgrade de plan (PlanUpgradeModal)

#### Validación de Límites
- El sistema valida automáticamente los límites del plan antes de crear sedes, empleados, servicios o citas
- Función RPC `validate_plan_limits()` para validación server-side
- Bloqueo con mensaje explicativo cuando se alcanza un límite

#### Webhooks
- Stripe, PayU y MercadoPago tienen Edge Functions de webhook para sincronizar estados de pago automáticamente

---

### 7.15 Sistema de Permisos Granulares

Este sistema permite control de acceso fino dentro de un negocio, más allá del simple rol.

#### 79 Permisos Disponibles
Organizados en categorías:

| Categoría | Ejemplos de permisos |
|---|---|
| `services.*` | `create`, `edit`, `delete`, `view` |
| `resources.*` | `create`, `edit`, `delete`, `view` |
| `locations.*` | `create`, `edit`, `delete`, `view` |
| `employees.*` | `create`, `edit`, `delete`, `view`, `edit_salary`, `edit_own_profile` |
| `appointments.*` | `create`, `edit`, `delete`, `cancel`, `cancel_own`, `reschedule_own` |
| `recruitment.*` | `create_vacancy`, `edit_vacancy`, `delete_vacancy`, `manage_applications` |
| `accounting.*` | `create`, `edit`, `delete`, `view_reports` |
| `expenses.*` | `create`, `delete` |
| `reviews.*` | `create`, `moderate`, `respond` |
| `billing.*` | `manage`, `view` |
| `settings.*` | `edit`, `edit_business` |
| `permissions.*` | `manage`, `view`, `assign` |
| `absences.*` | `approve`, `request` |
| `favorites.*` | `toggle` |
| `sales.*` | `create` |

#### Gestión de Permisos
- Interface de administración (PermissionsManager, PermissionEditor)
- **9 Templates predefinidos**: Admin Completo, Vendedor, Cajero, Manager de Sede, Recepcionista, Profesional, Contador, Gerente de Sede, Staff de Soporte
- Asignación masiva de템플릿s (PermissionTemplates)
- Log de auditoría de cambios de permisos
- Asignación bulk por rol: todos los admins reciben un template al configurarlo

#### Protección de UI (PermissionGate)
- Componente `PermissionGate` envuelve **todos** los botones de acción
- Modos: `hide` (ocultar), `disable` (deshabilitar), `show` (mostrar alternativa)
- Verificación performante: el bypass de owner se evalúa primero (0 queries extra)
- Tiempo de respuesta < 200ms

---

### 7.16 Google Analytics 4 (GA4)

Integración GDPR-compliant para tracking de conversión:

#### Eventos Implementados (11)
- **Booking flow**: `booking_started`, `booking_step_completed`, `booking_abandoned`, `purchase`
- **Páginas públicas**: `page_view`, `profile_view`, `click_reserve_button`, `click_contact`
- **Auth**: `login` (email/google), `sign_up`

#### Cumplimiento GDPR
- Banner de consentimiento de cookies (CookieConsent)
- `anonymizeIp` activado
- Consent Mode API integrado
- Solo activa tracking después de aceptación del usuario

---

### 7.17 Extensión de Navegador

- Extensión Chrome para acceso rápido desde cualquier página
- Acceso a funcionalidades principales sin abrir la app web
- Build separado en `/extension/` y `/src/browser-extension/`
- Incluida en el plan Inicio y superiores

---

## 8. Flujos Principales

### 8.1 Flujo de Reserva de Cita (Cliente)

```
Inicio: Cliente visita perfil público del negocio o busca en el marketplace

1. Inicia sesión (si no está autenticado — redirect con contexto preservado)
2. Selecciona sede del negocio
3. Selecciona el servicio deseado
4. Selecciona empleado o recurso
5. Sistema presenta el calendario con slots disponibles (validados en tiempo real)
6. Elige fecha y hora
7. Confirma la reserva
8. Recibe confirmación in-app + email/WhatsApp automático
9. Recibe recordatorio automático (24h y/o 1h antes, según configuración del negocio)

Fin: Cita registrada, negocio y empleado notificados
```

**Reducción de fricción medida**: 57% menos clics (de 7 pasos sin preselección a 3 con datos preseleccionados desde el perfil público).

---

### 8.2 Alta de Negocio (Admin)

```
1. Usuario se registra o inicia sesión
2. Flujo de onboarding guiado (AdminOnboarding)
3. Completa: nombre, categoría, subcategorías (máx. 3), descripción
4. Configura primera sede (dirección, horarios, coordenadas)
5. Agrega servicios iniciales (nombre, duración, precio)
6. Agrega empleados (opcional al inicio)
7. Configura notificaciones y canales de contacto
8. Negocio activo — perfil público disponible inmediatamente
9. Owner registrado automáticamente como empleado manager (trigger)

Fin: Negocio operativo, listo para recibir citas
```

---

### 8.3 Incorporación de Empleado

**Vía invitación / solicitud:**
```
1. Empleado descarga la app o accede a la web
2. Navega a "Unirse a un negocio" (JoinBusiness)
3. Busca el negocio e ingresa código de invitación, O
4. Solicita acceso directamente al negocio
5. Admin recibe notificación de solicitud pendiente
6. Admin revisa perfil del candidato y aprueba/rechaza
7. Si aprueba: empleado aparece en business_employees, recibe acceso
8. Si rechaza: candidato notificado con mensaje opcional

Fin: Empleado puede ver su agenda y gestionar sus citas
```

---

### 8.4 Solicitud de Ausencia o Vacación

```
Empleado:
1. Abre modal "Solicitar Ausencia" desde su dashboard
2. Selecciona tipo (vacation/sick_leave/emergency/personal/other)
3. Elige rango de fechas (calendario con highlighting de festivos y días usados)
4. Escribe motivo / notas
5. Envía — sistema valida días disponibles
6. Todos los admins y managers del negocio son notificados (in-app + email)

Admin:
7. Ve la solicitud en el tab "Ausencias"
8. Revisa, puede aprobar o rechazar con comentario
9. Aprueba → balance actualizado automáticamente
10. Si tipo = emergency → citas futuras del empleado canceladas automáticamente
11. Empleado y clientes afectados notificados

Fin: Ausencia registrada, balance actualizado
```

---

### 8.5 Publicación y Gestión de Vacante

```
Admin:
1. Crea vacante (CreateVacancy): título, descripción, habilidades, salario, sede
2. Vacante publicada en el marketplace

Empleado / Candidato:
3. Ve vacantes disponibles en AvailableVacanciesMarketplace
4. Revisa detalle de la vacante (VacancyDetail) y compatibilidad de horario
5. Aplica adjuntando CV (o perfil existente)
6. Admin notificado de nueva aplicación

Admin:
7. Revisa aplicaciones (ApplicationsManagement)
8. Ve perfil del aplicante (ApplicantProfileModal)
9. Acepta o rechaza — candidato notificado
10. Si contrata: al finalizar la relación, review obligatoria de ambas partes

Fin: Vacante cubierta con registro completo del proceso
```

---

### 8.6 Flujo de Pago y Suscripción

```
1. Admin ve métricas de uso acercándose al límite del plan gratuito
2. Recibe notificación de alerta de límites
3. Accede a BillingDashboard → "Actualizar Plan"
4. Ve PlanUpgradeModal con comparativa de planes
5. Selecciona plan "Inicio" ($80.000/mes)
6. Es redirigido al checkout del gateway (Stripe/PayU/MercadoPago según región)
7. Completa el pago (PCI-compliant)
8. Webhook actualiza estado de suscripción automáticamente
9. Plan activado — límites expandidos inmediatamente
10. Factura disponible en historial

Fin: Negocio actualizado al nuevo plan
```

---

### 8.7 Registro de Venta Rápida

```
Admin:
1. Accede a "Ventas Rápidas" desde el dashboard
2. Completa formulario: cliente (nombre, tel), servicio, sede, empleado, monto, método de pago
3. Registra la venta
4. Sistema crea automáticamente transacción contable tipo income
5. Estadísticas del día actualizadas en tiempo real
6. Historial de las últimas 10 ventas actualizado

Fin: Venta registrada. Aparece en reportes contables del período
```

---

## 9. Lo que NO puede hacer Gestabiz (Limitaciones conocidas)

### Limitaciones de Planes
- Los planes **Profesional**, **Empresarial** están marcados como "Próximamente" — solo están disponibles Gratuito e Inicio
- El plan Gratuito tiene límite de **50 citas por mes** y **100 clientes**
- El plan Gratuito limita a **1 sede** y **1 empleado**

### Funcionalidades Pendientes / EN DESARROLLO
- **App Móvil nativa**: Está en análisis y arquitectura, no liberada al público
- **Analytics avanzados con IA**: Solo en plan Profesional (futuro)
- **API pública para integraciones**: Solo en plan Profesional (futuro)
- **Facturación electrónica DIAN**: Previsto para plan Profesional (futuro)
- **Soporte offline**: No tiene modo offline — requiere conexión a internet
- **UI completamente en modo Recursos Físicos**: El backend del modelo flexible (hotel, restaurant, etc.) está completo, pero los componentes de admin para gestionarlo están pendientes de UI (Fase 3 pendiente)
- **Motor de reportes custom**: Los reportes son predefinidos; no hay constructor de reportes custom

### Limitaciones Técnicas de Diseño
- **Sin instancia local de Supabase**: La base de datos solo existe en la nube (no hay entorno local de BD)
- **Reviews anónimas obligatoriamente**: No hay opción de review con nombre visible
- **Aprobación de ausencias no parametrizable**: Siempre es obligatoria, no puede desactivarse
- **Máximo 3 subcategorías por negocio**: Limitado por lógica de negocio y trigger de BD
- **Máximo 10 sedes en plan Empresarial**: No hay opción de más sedes sin plan Corporativo (futuro)
- **Timezone por defecto**: La aplicación usa `America/Bogota` como timezone principal; soporte multi-tz limitado

### Funcionalidades NO Implementadas
- Pagos a empleados / nómina integrada
- Inventario de productos (solo servicios)
- E-commerce / venta de productos físicos
- Integración con POS (punto de venta físico)
- App para TV / Kiosk modo tablet
- Portal de autogestión para clientes con recuperación de contraseña propia dentro del negocio
- Soporte de idiomas beyond español e inglés (solo 2 idiomas)

---

## 10. Integraciones Externas

| Integración | Propósito | Estado |
|---|---|---|
| **Supabase** | Base de datos, Auth, Storage, Realtime, Edge Functions | Activa |
| **Stripe** | Pagos y suscripciones globales | Activo |
| **PayU Latam** | Pagos en Colombia | Activo |
| **MercadoPago** | Pagos en LATAM | Activo |
| **Brevo (Sendinblue)** | Emails transaccionales (300/día gratis) | Activo |
| **AWS SNS** | SMS para recordatorios | Opcional |
| **WhatsApp Business API** | Mensajes WhatsApp | Disponible |
| **Google Calendar API** | Sincronización bidireccional de citas | Activo |
| **Google Analytics 4** | Tracking de conversión y uso | Activo |
| **Sentry** | Monitoreo de errores en producción | Configurado |
| **Vercel** | Hosting de la web app | Recomendado |

---

## 11. Seguridad y Privacidad

### Row Level Security (RLS)
Todas las tablas de la base de datos tienen políticas RLS activas:
- Los admins solo ven datos de **sus propios negocios**
- Los empleados solo ven sus **asignaciones y datos propios**
- Los clientes solo ven **sus propias citas y datos**
- Las reviews son anónimas (el reviewer no es identificable en resultados públicos)

### Protección de Datos Sensibles
- La clave `service_role` de Supabase **nunca se expone** al cliente
- Las API keys de pagos solo están en Edge Functions (serverless)
- Las credenciales de email/SMS/WhatsApp solo viven en secrets de Supabase
- HTTPS automático en Supabase y Vercel

### Privacidad de Usuarios
- Consentimiento de cookies explícito (banner GDPR)
- `anonymizeIp` en GA4
- Los CVs de aplicantes son privados (bucket privado, acceso controlado por RLS)
- Las evidencias de bug reports son privadas
- Las conversaciones de chat son privadas entre participantes

### Sistema de Permisos como Capa Extra
- Incluso dentro de un negocio, los empleados solo pueden ejecutar **las acciones para las que tienen permiso** explícito
- El owner del negocio siempre tiene bypass total (no requiere permisos individuales)

---

## 12. Stack Técnico Resumido

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.7.2 | Tipado estático |
| Vite | 6.3.5 | Build tool y dev server |
| Tailwind CSS | 4.1.11 | Estilos utility-first |
| Radix UI | — | Componentes accesibles (Dialog, Select, Tabs, etc.) |
| TanStack Query (React Query) | — | Data fetching y cache |
| React Router | v7 | Navegación SPA |
| Phosphor Icons / Lucide React | — | Iconografía universal |
| Sonner | — | Toast notifications |
| Zustand | — | State management global |
| date-fns | — | Manejo de fechas/horas |

### Backend (Supabase Cloud)
| Componente | Detalle |
|---|---|
| PostgreSQL | 15+ con uuid-ossp, pg_trgm, postgis |
| Auth | Supabase Auth (email + OAuth Google) |
| Row Level Security | Políticas en todas las tablas |
| Edge Functions | 30+ funciones serverless en Deno |
| Realtime | Suscripciones en tiempo real |
| Storage | Buckets: avatars, cvs, chat-attachments, bug-report-evidences |
| Vistas materializadas | business_ratings_stats, employee_ratings_stats, resource_availability |

### RPC Functions Clave
| Función | Propósito |
|---|---|
| `search_businesses()` | Búsqueda con ranking y estadísticas |
| `search_services()` | Búsqueda de servicios con relevancia |
| `search_professionals()` | Búsqueda de profesionales |
| `is_resource_available()` | Valida disponibilidad de recurso físico |
| `validate_plan_limits()` | Verifica límites del plan antes de crear recursos |
| `get_business_hierarchy()` | Jerarquía de empleados |
| `refresh_ratings_stats()` | Refresca vistas materializadas |

### Escala Actual del Código Base
- ~151.000 líneas de TypeScript
- 1.060 archivos `.ts` / `.tsx`
- 40+ tablas en PostgreSQL
- 58 hooks personalizados
- 30+ Edge Functions desplegadas
- ~2.200 claves de traducción en 2 idiomas (ES / EN)

---

*Documento generado en Marzo 2026 por análisis exhaustivo del código fuente, documentación técnica y instrucciones del proyecto Gestabiz.*  
*Mantenido por: TI-Turing Team*

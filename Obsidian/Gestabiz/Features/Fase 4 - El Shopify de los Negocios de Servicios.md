---
date: 2026-04-25
tags: [roadmap, fase-4, shopify, pagos, promociones, crm, estadisticas, recordatorios]
status: vision
---

# Fase 4 — El Shopify de los Negocios de Servicios

> "Gestabiz no es solo una agenda. Es la **plataforma operativa completa** para cualquier negocio que presta servicios."

El salto conceptual de Fase 4 es claro: pasar de ser una herramienta de agendamiento a ser la **columna vertebral del negocio**, igual que Shopify hizo con el comercio electrónico. El dueño de negocio no necesita nada más.

---

## La Analogía con Shopify

| Shopify (e-commerce) | Gestabiz (servicios) |
|----------------------|----------------------|
| Catálogo de productos | Catálogo de servicios |
| Carrito de compra | Wizard de reserva |
| Checkout y pagos | Cobro al reservar o al asistir |
| Email marketing / SMS | Recordatorios y campañas |
| Descuentos y cupones | Promociones y paquetes |
| CRM de compradores | CRM de clientes fieles |
| Dashboard de ventas | Estadísticas de ingresos y ocupación |
| Plugins / App Store | Integraciones (Google Cal, WhatsApp, contabilidad) |
| Multi-tienda | Multi-sede |
| Shopify Payments | Gestabiz Payments (Stripe/PayU/MercadoPago) |

---

## Pilares de la Fase 4

### 1. Recordatorios Inteligentes

**Situación actual**: se envían recordatorios básicos (Email/SMS/WhatsApp) con tiempos configurables por el negocio.

**Evolución Fase 4**:
- **Recordatorio escalonado**: 48h antes (email) → 24h (WhatsApp) → 2h (SMS si no hay confirmación)
- **Flujo de confirmación / cancelación**: el cliente puede confirmar o cancelar desde el mismo mensaje sin abrir la app. Si cancela, el slot vuelve a estar disponible automáticamente y se notifica al admin.
- **Recordatorios post-visita**: "¿Cómo estuvo tu visita?" + link de reseña + botón de reagendar
- **Recordatorios de reactivación**: si el cliente no reserva en X días, mensaje automático personalizado ("Hola María, han pasado 6 semanas desde tu última visita. ¿Te agendamos?")
- **Recordatorio de cumpleaños**: mensaje automático el día del cumpleaños del cliente con descuento especial
- **Canal preferido por cliente**: el cliente elige si quiere recordatorios por WhatsApp, Email o ambos
- **Límite anti-spam**: máximo 1 recordatorio de reactivación por semana por cliente

**Tablas nuevas / cambios**:
- `notification_flows`: secuencias multi-paso configurables por el negocio
- `notification_log`: ya existe — agregar columna `confirmed_by_client` (bool)
- `client_preferences`: canal preferido, opt-out, frecuencia máxima

---

### 2. Pagos Integrados

**Situación actual**: integración con Stripe, PayU y MercadoPago para suscripciones del negocio. El cobro a clientes por citas NO está implementado.

**Evolución Fase 4 — Cobros a Clientes**:
- **Pago al reservar (prepago)**: el cliente paga en el momento de agendar. Si cancela dentro del plazo de política, se hace reembolso automático.
- **Pago al asistir (post-servicio)**: el negocio registra el pago al finalizar la cita. Soporte QR para pago presencial.
- **Pagos parciales (seña o anticipo)**: el cliente paga el X% al reservar y el resto al asistir. Configurable por servicio.
- **Link de pago**: el negocio puede enviar un link de cobro a clientes específicos (sin cita vinculada). Útil para cobrar a distancia.
- **Paquetes de sesiones**: el cliente compra un paquete de 10 sesiones y se van descontando. Gestabiz lleva el balance.
- **Suscripciones de cliente**: el cliente paga mensualmente por un número de citas. Ej: "Plan mensual gym — 8 visitas" a $150k/mes.
- **División de ingresos por empleado**: el sistema calcula automáticamente cuánto le corresponde a cada empleado según comisiones configuradas.
- **Reembolsos**: flujo automatizado de reembolso en caso de cancelación del negocio.
- **Política de cancelación**: cada servicio puede tener su propia ventana de cancelación con/sin penalidad.

**Tablas nuevas**:
- `client_payments`: registro de cada pago de cliente (amount, status, gateway, appointment_id)
- `service_packages`: paquetes de sesiones y suscripciones de cliente
- `client_package_balance`: balance de sesiones restantes por cliente por paquete
- `refund_requests`: solicitudes de reembolso con estado

---

### 3. Promociones y Campañas

**Situación actual**: no existe sistema de promociones.

**Evolución Fase 4**:
- **Descuentos por código**: el cliente ingresa un cupón al reservar (% o monto fijo). El negocio genera y gestiona los códigos.
- **Descuentos automáticos por regla**: "primer cita gratis", "20% descuento martes y miércoles", "3x2 en masajes"
- **Paquetes promocionales**: un precio especial por la combinación de 2 o más servicios
- **Happy hours**: descuentos automáticos en franjas horarias de baja demanda
- **Campañas por segmento**: el admin elige un segmento (clientes inactivos > 60 días, clientes frecuentes, clientes de servicio X) y les envía una promoción por WhatsApp/Email
- **Flash sales**: promo activa durante un tiempo limitado, con contador regresivo en el perfil público
- **Programa de fidelidad básico**: puntos por visita → canjeable en descuentos
- **Referidos entre clientes**: el cliente comparte su link y cuando su referido reserva, ambos obtienen un descuento

**Tablas nuevas**:
- `promotions`: descuentos, reglas, vigencia, límite de usos
- `promo_codes`: cupones generados (code, promotion_id, uses_left, expires_at)
- `loyalty_points`: puntos acumulados por cliente por negocio
- `campaign_sends`: registro de envíos de campañas (segment, sent_at, opens, clicks)

---

### 4. Gestión de Clientes (CRM Avanzado)

**Situación actual**: `ClientsManager` muestra clientes con historial de citas. `ClientProfileModal` con tab de historial.

**Evolución Fase 4**:
- **Ficha de cliente completa**: historial de citas + historial de pagos + notas internas + preferencias (empleado favorito, sede preferida, productos usados)
- **Etiquetas / segmentos**: el admin puede etiquetar clientes (VIP, Inactivo, Nuevo, Por cobrar, etc.)
- **Notas del empleado**: el profesional puede agregar notas privadas sobre el cliente (ej: "alérgico a X producto", "prefiere música tranquila", "cumpleaños 15 de mayo")
- **Timeline de cliente**: vista cronológica de todas las interacciones (citas, pagos, mensajes, reseñas, ausencias)
- **Alertas de cliente**: el sistema avisa al admin cuando un cliente frecuente no ha reservado en más tiempo de lo normal
- **Importar clientes**: el negocio puede importar su base de datos existente desde CSV o Excel
- **Exportar clientes**: exportar lista de clientes con datos de contacto y estadísticas (para campañas externas)
- **RGPD/Privacidad**: el cliente puede solicitar borrado de sus datos. El sistema tiene un flujo de anonimización.
- **Formularios pre-cita**: el negocio configura preguntas que el cliente responde al reservar (alergias, condiciones médicas, preferencias)

**Tablas nuevas / cambios**:
- `client_notes`: notas privadas de empleados sobre clientes (visible solo al negocio)
- `client_tags`: etiquetas por cliente por negocio
- `client_forms`: formularios de intake configurables
- `client_form_responses`: respuestas de clientes
- Agregar `profiles.birthday` si no existe

---

### 5. Estadísticas y Analytics del Negocio

**Situación actual**: `ReportsPage` con gráficas de ingresos, gastos, categorías, empleados. `EnhancedFinancialDashboard`.

**Evolución Fase 4**:

**Dashboard ejecutivo (resumen en tiempo real)**:
- Ocupación del día / semana / mes (% de slots llenos vs disponibles)
- Ingresos del día vs. mismo día semana anterior
- Citas pendientes de confirmar
- Empleados con mayor y menor ocupación esta semana
- Clientes nuevos vs. recurrentes en el período
- Tasa de cancelación (y razones si el cliente las provee)
- Tasa de no-show (clientes que no llegaron sin cancelar)

**Reportes de negocio**:
- Ingresos por servicio, empleado, sede, mes
- Comparativa mensual y anual
- Servicios más y menos populares por hora / día / mes
- Análisis de retención: ¿cuántos clientes regresan vs. no regresan?
- Lifetime Value (LTV) por cliente y promedio del negocio
- Costo de adquisición estimado (si el negocio usa referidos o campañas)
- Pronóstico de ingresos del mes basado en citas confirmadas

**Reportes de empleados**:
- Desempeño individual: citas completadas, ingresos generados, calificación promedio
- Asistencia y puntualidad (con base en horarios configurados)
- Comparativa entre empleados

**Reportes financieros**:
- Ya existe: transacciones, IVA/ICA/Retención, exports PDF/CSV
- Agregar: flujo de caja proyectado, gastos fijos vs. variables

**Tablas / vistas nuevas**:
- `appointment_outcomes`: resultado de citas (completada, no-show, cancelada_por_cliente, cancelada_por_negocio)
- Vista materializada `business_occupancy_stats`: ocupación diaria/semanal/mensual
- Vista materializada `client_retention_stats`: tasa de retención por cohorte

---

## Módulos Adicionales a Considerar en Fase 4

### 6. Tienda Online del Negocio

- El negocio puede vender **productos físicos** (shampoos, cremas, aceites, suplementos) directamente desde su perfil público en Gestabiz
- Carrito de compra simple + checkout con los mismos gateways de pago
- Inventario básico: stock, alertas de bajo inventario
- Posibilidad de combinar servicio + producto en una sola transacción ("corte + acondicionador = $80k")

**¿Por qué?**: muchos salones, spas y clínicas tienen tienda. Shopify lo hace. Gestabiz puede hacerlo en un solo lugar.

---

### 7. Marketplace Público de Gestabiz

- Directorio navegable de negocios (ya existe `/negocio/:slug`)
- **Búsqueda avanzada por ciudad, servicio, precio, calificación, disponibilidad**
- **"Reservar ahora" para el primer slot disponible** de cualquier negocio sin entrar al perfil
- **"Trending near you"**: negocios con más reservas esta semana en tu ciudad
- **Sección de ofertas**: negocios con promociones activas visibles en el directorio

Este marketplace posiciona a Gestabiz como plataforma de doble cara (como Airbnb / Etsy): el negocio gana visibilidad, el cliente encuentra lo que necesita.

---

### 8. Widget Embebible

- El negocio puede incrustar el **botón / widget de reserva de Gestabiz** en su propio sitio web con un `<script>` de una línea
- El widget abre el wizard de reserva de Gestabiz en un iframe o modal
- El negocio personaliza colores y logo
- Gestabiz trackea conversiones del widget (GA4 event: `booking_started_widget`)

**Valor**: el negocio no necesita construir su propio sistema de reservas. Usa el de Gestabiz en su sitio actual.

---

### 9. App de Clientes Dedicada (White-label opcional)

- App móvil (ya existe Expo) con experiencia de cliente:
  - Ver mis citas, historial, factura, puntos de fidelidad
  - Reservar desde la app directamente con el negocio favorito
  - Chat con el negocio
  - Recibir notificaciones push de recordatorios y promos
- **Versión white-label**: el negocio paga una tarifa extra para que sus clientes descarguen una app con el nombre y logo del negocio (powered by Gestabiz)

---

### 10. Integraciones del Ecosistema

Equivalente al "App Store" de Shopify:
- **Google My Business**: sincronizar disponibilidad y recibir reservas desde GMB
- **Instagram / Facebook**: botón "Reservar" en el perfil de Instagram vinculado a Gestabiz
- **TikTok Shop for Services**: reservas desde TikTok
- **WhatsApp Business Platform**: recibir reservas por WhatsApp de forma automática (chatbot de reservas)
- **Contabilidad**: exportar transacciones a Siigo, Alegra, Contabilidad en línea (Colombia), QuickBooks
- **Google Calendar / Outlook**: ya existe — mejorar sync bidireccional
- **Zapier / Make**: webhooks para conectar con cualquier sistema externo

---

## Prioridad y Secuencia Sugerida

| Prioridad | Módulo | Impacto | Esfuerzo |
|-----------|--------|---------|---------|
| 🔴 Alta | Pagos a clientes (prepago + anticipo) | Muy alto (monetización directa) | Alto |
| 🔴 Alta | Recordatorios escalonados + confirmación | Muy alto (reduce no-shows) | Medio |
| 🟠 Media | CRM avanzado (notas, etiquetas, formularios) | Alto (retención) | Medio |
| 🟠 Media | Promociones y cupones | Alto (adquisición) | Medio |
| 🟠 Media | Dashboard ejecutivo mejorado | Alto (engagement admin) | Bajo |
| 🟡 Normal | Paquetes de sesiones y suscripciones de cliente | Medio-alto | Alto |
| 🟡 Normal | Widget embebible | Medio (adquisición inorgánica) | Bajo |
| 🟡 Normal | Tienda online del negocio | Medio | Alto |
| 🟢 Futura | Marketplace avanzado | Alto (escala) | Muy alto |
| 🟢 Futura | App white-label para clientes | Medio | Muy alto |
| 🟢 Futura | Integraciones GMB / Instagram / TikTok | Alto (adquisición) | Alto |

---

## Impacto en el Modelo de Negocio

**Nueva fuente de ingresos potencial — Gestabiz Payments**:
- Si el negocio cobra a sus clientes través de Gestabiz, se puede cobrar una **comisión de transacción** (ej: 1.5% sobre pagos procesados)
- A mayor volumen de transacciones, mayor ingreso pasivo para Gestabiz
- Esto convierte Gestabiz en una **plataforma financiera** además de operativa

**Efecto lock-in**:
- Cuanto más datos del negocio estén en Gestabiz (clientes, pagos, historial, estadísticas), más difícil es migrar a otro sistema
- La Fase 4 aumenta radicalmente el switching cost — exactamente como hace Shopify

**Posicionamiento para inversión**:
- Un negocio SaaS que también procesa pagos tiene múltiplos de valoración más altos
- GMV (Gross Merchandise Volume) como métrica adicional a MRR
- Narrativa: "El Shopify de los servicios en LATAM" — mercado de $5B+

---

## Notas Relacionadas

- [[Fase 2 - Contabilidad, DIAN y App Móvil]]
- [[Fase 3 - IA, Automatización y Agentes]]
- [[sistema-billing]]
- [[sistema-contable]]
- [[sistema-notificaciones]]
- [[sistema-crm-clientes]]
- [[propuesta-de-valor]]
- [[planes-y-precios]]
- [[go-to-market-2026]]

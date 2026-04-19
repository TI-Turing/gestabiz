---
date: 2026-04-12
tags: [roadmap, competidores, features, fase-2, fase-3, fase-4, estrategia]
---

# Análisis Competitivo — Roadmap de Features

## Competidores clave

| App | Mercado | Fortaleza |
|-----|---------|-----------|
| **Fresha** | Global/Latam | Gratis + comisión en pagos, domina belleza |
| **Booksy** | Global/Latam | Discovery + marketplace activo |
| **Mindbody** | Global | Fitness/wellness, membresías, clases grupales |
| **Vagaro** | US/Latam | Todo-en-uno, POS físico |
| **Bookline** | España/Latam | Reservas por WhatsApp/teléfono con IA |
| **TurnoPro / Agenda Pro** | Argentina/Latam | Foco local LATAM, bajo costo |
| **Square Appointments** | US | POS + pagos integrados |
| **Boulevard** | US premium | Salones/spas high-end |

---

## Lo que ya existe en BD pero sin UI completa (quick wins)

- `discount_codes` — descuentos/cupones (BD lista, UI pendiente)
- `payment_status: partial` en appointments — depósitos al reservar (BD lista)
- `payroll_configuration` + `payroll_payments` — nómina/comisiones (BD lista)
- `invoices` + `invoice_items` — facturas (BD lista, Matias API Fase 2)

---

## FASE 2 — Alto impacto, alta viabilidad

### ⭐ TOP 1 — UI Cupones y Descuentos
La tabla `discount_codes` ya existe. Solo falta la UI.
- Crear códigos (% o valor fijo, vencimiento, límite de usos)
- Aplicar en el wizard de reserva
- Dashboard de uso por cupón
- **Por qué**: herramienta de marketing inmediata, cero backend nuevo

### ⭐ TOP 2 — Depósito / Prepago al Reservar
`payment_status: partial` ya está en BD. El no-show es el dolor #1 del sector.
- Configurar % de depósito requerido por servicio
- Cobrar vía Stripe/PayU/MP al confirmar
- Si cancela fuera de política → retener depósito
- **Por qué**: impacto directo en ingresos del negocio, BD lista

### ⭐ TOP 3 — Google Reserve + Instagram Booking Button
- Botón "Reservar" en Google Maps → wizard de Gestabiz
- Botón "Reservar" en perfil de Instagram
- **Por qué**: 60%+ del descubrimiento local en Latam pasa por Google Maps. Cero cambios en la app.

### Lista de Espera (Waitlist)
- Cliente se apunta si horario está lleno
- Notificación automática al liberarse un slot
- Auto-confirmación con ventana de X minutos
- Recupera ingresos perdidos por cancelaciones

### Reservas Recurrentes
- "Cada 2 semanas con el mismo empleado" — se agenda una vez
- Frecuencia: semanal, quincenal, mensual
- Notificación de recordatorio antes de cada cita

### Programa de Fidelización (Loyalty)
- Puntos por cita completada / compra
- Canje por descuentos o servicios gratuitos
- "Tarjeta de sellos" digital (10 citas → 1 gratis)
- Reduce churn, aumenta frecuencia de visita

### Facturación Electrónica — Matias API
*(Ver nota separada: `facturacion-electronica-matias-api.md`)*

---

## FASE 3 — Alto impacto, mediana complejidad

### Marketing Directo Integrado
Infraestructura email/WhatsApp ya existe. Falta capa de campañas.
- Campañas de email a segmentos (clientes inactivos N días, por servicio)
- Campañas de WhatsApp masivas (templates aprobados)
- Automatizaciones: "sin visita en 30 días → enviar oferta"

### Paquetes y Membresías
Crítico para gimnasios, clínicas, estudios de yoga.
- Paquetes de sesiones (10 clases, válidas 3 meses)
- Membresías mensuales (N citas incluidas + descuento)
- Seguimiento de sesiones consumidas

### Formularios de Ingreso por Servicio
- Cuestionario de salud antes de primera cita (clínicas)
- Consentimiento digital (tratamientos estéticos)
- Ficha de cliente por servicio (alergias, preferencias, historial)
- Fotos antes/después (estética, dermatología)

### Nómina y Comisiones — UI Completa
BD ya tiene `payroll_configuration` y `payroll_payments`.
- Dashboard de comisiones por empleado
- Liquidación mensual exportable
- Deducciones colombianas (EPS, pensión, ARL)

### Widget de Reserva Embebible
- `<iframe>` o `<script>` para pegar en sitio web propio del negocio
- Mini-wizard con branding del negocio

### Sincronización Apple Calendar / Outlook
Complementa el Google Calendar ya existente.

---

## FASE 4 — Transformacional

### IA para Reservas por WhatsApp
- Bot que entiende lenguaje natural: "quiero cita con Juan el martes por la tarde"
- WhatsApp Business API ya configurada en Gestabiz
- Bookline levantó $12M con este modelo en España/Latam

### Análisis Predictivo y BI
- Score de riesgo de no-show por cliente
- Previsión de demanda por hora/día
- LTV (valor de vida del cliente)
- Alertas de churn
- Heatmap de ocupación

### POS Físico + Inventario de Productos
- Integración con terminales físicos (Bold en Colombia, Clip en México)
- Inventario de productos de reventa
- Venta mixta: servicio + producto en una transacción

### Marketplace Premium con Publicidad
- Listings destacados (negocios pagan por visibilidad)
- Slots de última hora con descuento
- Modelo de comisión adicional para Gestabiz

---

## Tabla resumen

| Feature | Fase | Impacto | Esfuerzo |
|---------|------|---------|----------|
| UI Cupones/Descuentos | 2 | Alto | Bajo |
| Depósito/Prepago | 2 | Alto | Medio |
| Google Reserve + Instagram | 2 | Alto | Bajo-Medio |
| Lista de Espera | 2 | Alto | Medio |
| Reservas Recurrentes | 2 | Alto | Medio |
| Programa de Fidelización | 2 | Alto | Medio |
| Facturación Electrónica | 2 | Alto | Medio |
| Nómina/Comisiones UI | 3 | Alto | Medio |
| Paquetes y Membresías | 3 | Alto | Alto |
| Formularios por Servicio | 3 | Medio-Alto | Medio |
| Marketing Directo | 3 | Alto | Alto |

## Notas Relacionadas

- [[comparativa-competidores]] — Análisis detallado vs Fresha/Booksy/Mindbody
- [[planes-y-precios]] — Modelo de precios actual
- [[sistema-billing]] — Stripe/PayU/MercadoPago ya integrados
- [[sistema-citas]] — AppointmentWizard y flujo de reserva
- [[sistema-notificaciones]] — Email/WhatsApp ya funcional
- [[sistema-contable]] — IVA/ICA/Retención automático
- [[sectores-y-casos-de-uso]] — Verticales soportadas
- [[Fase 2 - Contabilidad, DIAN y App Móvil]] — Roadmap Fase 2
- [[Fase 3 - IA, Automatización y Agentes]] — Roadmap Fase 3
- [[estrategia-producto-y-negocio]] — Estrategia de producto complementaria
- [[SEO-SEM-estrategia-2026]] — Competidores y keywords
- [[SEO-SEM-Strategy-Colombia-LATAM]] — Análisis competitivo SEO detallado
- [[facturacion-electronica-matias-api]] — Feature Fase 2 referenciada
- [[free-trial-mes-gratis]] — Feature de pricing/trial
| Widget Embebible | 3 | Medio | Medio |
| Sync Apple/Outlook | 3 | Medio | Bajo |
| IA Reservas WhatsApp | 4 | Muy alto | Muy alto |
| Análisis Predictivo / BI | 4 | Alto | Alto |
| POS Físico + Inventario | 4 | Alto | Muy alto |
| Marketplace Premium | 4 | Alto | Alto |

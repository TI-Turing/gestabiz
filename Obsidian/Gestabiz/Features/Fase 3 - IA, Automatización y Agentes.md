---
date: 2026-03-24
tags: [roadmap, fase-3, ia, automatizacion, agentes, llm]
status: futura
---

# Fase 3 — IA, Automatización y Agentes

Esta fase convierte Gestabiz de un sistema de gestión en una **plataforma inteligente** que trabaja por el negocio de forma autónoma.

---

## Visión General

El negocio no solo registra citas — Gestabiz actúa como un **asistente de negocio** que piensa, recuerda y ejecuta.

---

## 1. Agentes que escriben a los clientes

**Concepto**: Agentes LLM que contactan clientes automáticamente según triggers del negocio.

**Casos de uso:**
- Cliente no ha reservado en 30+ días → agente envía WhatsApp personalizado recordándole
- Cita cancelada → agente intenta reagendar en el mismo día
- Cliente cumpleaños → mensaje + descuento especial
- Post-cita completada → seguimiento automático pidiendo reseña
- Recordatorio inteligente (no solo "tu cita es mañana", sino "Sofía estará disponible a las 3pm, ¿confirmamos?")

**Stack sugerido:**
- Claude API (claude-haiku para volumen, sonnet para contexto rico)
- Edge Function `ai-client-outreach` — decide cuándo y qué enviar
- Canal: WhatsApp Business API (primario) + Email (fallback)
- Tabla: `ai_outreach_log` (qué se envió, cuándo, resultado)
- Control del negocio: el admin configura qué agentes activar y con qué frecuencia

**Guardarraíles importantes:**
- El negocio aprueba las plantillas de mensajes
- Límite de mensajes por cliente por semana (evitar spam)
- El cliente puede optar por no recibir mensajes IA

---

## 2. Procesos automatizados inteligentes

**Scheduling inteligente:**
- Cuando hay baja ocupación, el agente sugiere o crea promociones automáticamente
- Redistribución de citas si un empleado se ausenta de emergencia (con confirmación del cliente)
- Optimización de agenda: agrupar citas del mismo servicio para minimizar tiempos muertos

**Análisis predictivo:**
- Predecir demanda semanal por empleado/servicio/sede
- Alertar al admin cuando hay riesgo de baja ocupación
- Sugerir precios dinámicos en horas de baja demanda

**Gestión autónoma de ausencias:**
- Cuando se aprueba una ausencia, el agente contacta a los clientes afectados y reagenda automáticamente

---

## 3. AI Marketing Assistant

Ver también: [[Ideas Futuras - Social Media MCP y Marketing IA]]

**Concepto**: El negocio escribe un brief y Gestabiz crea y publica el contenido en redes sociales.

```
Admin escribe: "Promo 20% en citas de coloración esta semana"
    ↓
IA genera: copy + imagen + hashtags
    ↓
Preview para aprobación del admin
    ↓
Publicación automática en Instagram, Facebook, TikTok
```

---

## 4. Asistente de negocio (chat con IA)

- El admin puede preguntarle a Gestabiz cosas como:
  - "¿Cuál fue mi empleado más productivo este mes?"
  - "¿Qué servicios tienen más cancelaciones?"
  - "¿Cuándo debería contratar otro empleado?"
- La IA responde con datos reales del negocio + recomendaciones

**Stack sugerido:**
- RAG sobre los datos del negocio (transacciones, citas, empleados)
- Claude API con tool use sobre las tablas de Supabase
- UI: chat widget en el dashboard admin

---

## 5. Onboarding asistido por IA

- Cuando un negocio nuevo se registra, un agente lo guía paso a paso
- Detecta qué falta configurar y lo hace guiado (servicios, empleados, horarios)
- Reduce el tiempo de setup de horas a minutos

---

## Consideraciones Técnicas

- **LLM**: Claude API (Anthropic) — preferido por privacidad de datos de negocios
- **Orquestación**: Edge Functions Deno como runtime de agentes
- **Cola de tareas**: tabla `agent_tasks` + cron para ejecución asíncrona
- **Privacidad**: datos de clientes nunca salen a modelos externos sin consentimiento explícito
- **Costos**: calcular costo por negocio activo para incluir en pricing de planes Pro/Enterprise

---

---

## Tier A — Utilidad Real (Brainstorm Mayo 2026)

> Estas 5 features vienen del [[brainstorm-features-utiles-mayo-2026]] (Tier A). Se agregan a Fase 3 porque requieren más infraestructura que la Fase S pero aportan valor alto y diferenciación real.

### A1 — Cobro Automático de Propinas al Empleado

**Concepto**: al cerrar el servicio, el cliente puede dejar propina vía Gestabiz (sugerencias 10%/15%/20% o libre). La propina va al empleado que lo atendió, no al negocio. Gestabiz toma comisión menor (1-2%).

**Por qué Fase 3**: requiere layer de payout al empleado (cuenta bancaria verificada), compliance tributario colombiano, y que [[sistema-pagos-anticipados]] esté maduro.

**Impacto**: empleados felices = retención. Square construyó billones con esto en USA. Nuevo en LATAM.

---

### A2 — Wallet del Cliente / Saldo a Favor + Gift Cards

**Concepto**: cada cliente tiene un saldo monetario en el negocio. Se puede recargar (gift card), acumular por cancelaciones, devoluciones, paquetes pre-pagados. Se descuenta en próximas citas.

**Por qué Fase 3**: el saldo del cliente es pasivo contable del negocio. Requiere que [[sistema-contable]] soporte pasivos corrientes. Necesita gestión de vencimiento y política legal de devolución.

**Tablas nuevas**: `client_wallets` (business_id, client_id, balance, currency), `wallet_transactions` (amount, type, appointment_id, description).

**Impacto**: lock-in financiero — "tengo $30k a favor en X salón" bloquea el churn.

---

### A3 — Importador IA desde WhatsApp del Negocio

**Concepto**: el dueño exporta su chat de WhatsApp Business y Claude lo procesa, extrayendo citas pasadas, datos de clientes y servicios. Convierte el historial informal en datos estructurados de Gestabiz.

**Por qué Fase 3**: requiere integración con Claude API ([[Fase 3 - IA, Automatización y Agentes]] sección 4) y procesamiento de documentos. Costo de tokens considerable (validar modelo de precio).

**Flujo**: WhatsApp → exportar .txt → subir a Gestabiz → Claude extrae → preview para aprobar → importar.

**Impacto**: reduce la fricción de migración a casi cero. Trae historial real desde el día 1.

---

### A4 — Resumen Diario Push al Dueño

**Concepto**: cada noche a las 8pm el dueño recibe push de 1 línea en el celular: "Hoy: 15 citas, $850k facturado, 1 cancelación, 0 no-shows." Sin abrir la app.

**Por qué Fase 3**: técnicamente es simple, pero necesita la app móvil en stores con push notifications configurado ([[sistema-mobile-hybrid]]). Sin push nativo, vale poco.

**Personalizable**: el dueño elige qué métricas quiere ver. Puede silenciarlo.

**Impacto**: genera hábito diario, convierte a Gestabiz en parte del ritual del dueño. Bajo costo, alto retorno.

---

### A5 — Fotos Antes/Después con Consentimiento Digital

**Concepto**: para estética, dermatología, fisioterapia. El cliente firma digitalmente al registrarse un consentimiento de uso de imagen. El profesional toma fotos vinculadas a cliente + cita desde la app. Galería privada del negocio.

**Por qué Fase 3**: requiere storage significativo, manejo legal de consentimientos (Habeas Data), permisos granulares por empleado, y política de retención/eliminación.

**Usos opcionales**: portafolio público del negocio (solo con permiso explícito adicional del cliente).

**Tablas nuevas**: `client_consents` (client_id, business_id, consent_type, signed_at), `service_photos` (appointment_id, client_id, photo_url, phase: before/after, is_public).

**Impacto**: habilita el feature más usado en marketing de estética. Lock-in visual del profesional.

---

## Dependencias antes de iniciar Fase 3

- Fase S completada (features de utilidad base)
- Fase 2 completada (contabilidad + DIAN + mobile en stores)
- Al menos 50+ negocios activos para tener datos suficientes para ML/IA
- Definición de plan de precios que incluya features de IA (probablemente solo Plan Pro/Empresarial)

## Notas Relacionadas

- [[brainstorm-features-utiles-mayo-2026]] — Origen del Tier A integrado aquí
- [[Fase S - Utilidad Real del Día a Día]] — Fase anterior
- [[sistema-notificaciones]] — WhatsApp Business API y email ya funcional
- [[sistema-chat]] — Chat en tiempo real para agente conversacional
- [[edge-functions]] — Runtime Deno para agentes IA
- [[sistema-contable]] — Datos para análisis predictivo + wallet
- [[planes-y-precios]] — Features IA en Plan Pro/Empresarial
- [[base-de-datos]] — RAG sobre tablas de Supabase
- [[sistema-mobile-hybrid]] — Push notifications para Resumen Diario (A4)
- [[sistema-pagos-anticipados]] — Base para propinas (A1) y wallet (A2)
- [[Ideas Futuras - Social Media MCP y Marketing IA]] — Marketing con IA detallado
- [[analisis-competitivo-roadmap]] — Features Fase 3-4 del roadmap
- [[estrategia-producto-y-negocio]] — Marketing y automatización

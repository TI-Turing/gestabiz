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

## Dependencias antes de iniciar Fase 3

- Fase 2 completada (contabilidad + DIAN + mobile)
- Al menos 50+ negocios activos para tener datos suficientes para ML/IA
- Definición de plan de precios que incluya features de IA (probablemente solo Plan Pro/Empresarial)

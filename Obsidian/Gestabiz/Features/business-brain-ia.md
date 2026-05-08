---
date: 2026-05-08
tags: [ia, feature-idea, add-on, agente, memoria, crecimiento-negocio]
---

# Business Brain — Memoria Autónoma con IA por Negocio

## La Idea

Cada negocio en Gestabiz tendría su propio "cerebro" invisible: un agente de IA que observa todo lo que pasa en el negocio y escribe notas automáticamente en segundo plano. El administrador nunca ve esas notas ni sabe que existen — solo ve un chat donde puede hacerle preguntas al asistente y recibe respuestas sorprendentemente precisas.

**El insight central**: el agente escribe solo, lee solo. Para el admin es magia.

---

## Arquitectura

### Capa 1 — Observador de Eventos (Background Agent)

Escucha eventos de Supabase Realtime y webhooks. Ante cada evento relevante, genera una nota estructurada en Markdown y la guarda en `business_brain_notes` (tabla interna, nunca expuesta en UI):

- Nueva cita / cancelación / cita completada
- Pago recibido
- Reseña nueva
- Gasto registrado
- Empleado agrega o quita un servicio
- Ausencia aprobada
- Cambio de horarios de sede

**Ejemplo de nota auto-generada**:
```markdown
# Patrón detectado — Martes bajos (2026-05-07)
Los martes en mayo promediaron 3 citas vs 8 el resto de la semana.
El servicio más afectado es "Corte caballero" (-60%).
```

### Capa 2 — Memoria con Vector Search

Tabla `business_brain_notes`:
- `business_id`, `note_type` (pattern / event / insight / decision / alert)
- `content` (Markdown), `embedding` (pgvector), `source_event`, `relevance_score`
- **RLS: completamente privada por negocio, nunca visible en UI**

Embedding: Claude Haiku (barato) o modelo de Cohere/OpenAI para embeddings.

### Capa 3 — Chat con el Agente

Interfaz de chat en el dashboard admin. Pipeline de respuesta:
1. Embeder la pregunta del admin
2. Buscar top-K notas relevantes con pgvector (similaridad coseno)
3. Combinar con datos frescos de Gestabiz (citas, ingresos, empleados activos)
4. Enviar contexto a **Claude Sonnet 4.6**
5. Respuesta accionable en streaming

---

## Experiencia del Admin

- Un ícono de "Asistente IA" en el sidebar (plan Pro o add-on)
- Chat tipo WhatsApp — solo habla, no configura nada
- Respuestas que parecen "mágicas" porque el agente ya conoce el negocio

**Preguntas típicas que haría el admin**:
- "¿Cuál es mi servicio más rentable?"
- "¿Por qué perdí clientes este trimestre?"
- "¿Qué debería promocionar para el Día de la Madre?"
- "¿Cuándo debería contratar otro empleado?"

---

## Monetización

| Opción | Detalle |
|--------|---------|
| **Add-on mensual** | ~$20-30k COP/mes, cualquier plan puede comprarlo |
| **Incluido en Pro** | Diferenciador premium del plan más alto |
| **Freemium del feature** | 10 preguntas gratis → upgrade |

**Recomendación**: Add-on separado — los que ven el valor pagan, sin subir el precio base del Pro.

---

## Diferenciación Competitiva

- Calendly, Booksy, Fresha, AgendaPro: **cero IA de negocio**
- Gestabiz con Business Brain: **el único SaaS de agendamiento LATAM que aprende tu negocio**
- **Switching cost brutal**: el cerebro acumula meses de historia — nadie querrá irse

Relacionado: [[ventajas-estructurales-no-explotadas]], [[lock-in-estrategia-datos-clientes]]

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Costo API | Haiku para escribir notas, Sonnet solo para responder |
| Privacidad | RLS estricta, notas nunca exportadas ni compartidas |
| Notas malas | Job periódico de revisión y purga |
| Latencia | Streaming + indicador "pensando..." |
| Adopción | Valor desde el día 1, sin onboarding — solo hablar |

---

## Estado y Próximos Pasos

- **Fase**: Idea documentada — **NO en roadmap activo**
- **Prerequisito**: ≥10 negocios pagando activamente → validar casos de uso reales
- **Spike técnico cuando sea el momento**: pgvector + Claude API en Supabase Edge Function
- **Related**: [[Fase 3 - IA, Automatización y Agentes]]

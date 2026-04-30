---
date: 2026-04-30
tags: [decision, fase-4, calendly, webrtc, citas-virtuales, posicionamiento, nuevos-verticales]
status: decision
---

# Decisión: Citas Virtuales — Entrar al Territorio de Calendly

## Contexto

Con la implementación de llamadas de voz en el chat (WebRTC, v1.0.x), Gestabiz tiene la infraestructura base para citas completamente en línea. Esto abre un posicionamiento competitivo directo contra **Calendly** y otras herramientas de scheduling virtual.

## La Decisión

En Fase 4, Gestabiz extenderá las llamadas de voz del chat a **videollamadas + compartir pantalla**, convirtiendo cada cita en una sesión virtual completa sin salir de la app.

**Sacrificamos deliberadamente** la simplicidad de Calendly a cambio de una **base de datos nutrida** por negocio. Esa es la apuesta estratégica.

**Why:** Calendly gana en setup de 2 minutos. Gestabiz gana cuando el profesional lleva 6 meses atendiendo al mismo cliente y tiene su historial completo, notas de sesión, preferencias y pagos dentro del sistema. El switching cost se vuelve prohibitivo.

**How to apply:** Al diseñar la UX de citas virtuales, no intentar imitar la simpleza de Calendly. En cambio, mostrar el contexto del cliente (última cita, notas anteriores, formulario de intake) DENTRO de la sala virtual, justo antes de empezar la sesión.

---

## Por Qué No Intentar Ganarle a Calendly en Simplicidad

Calendly tiene ventajas reales que no vale la pena atacar de frente:
- Integración nativa con Google Calendar / Outlook en segundos
- Link de reserva shareable (`calendly.com/tu-nombre`) — viral y fácil
- Setup en 2 minutos para un freelancer individual
- Reconocimiento de marca masivo en LATAM

**Gestabiz no puede ganar en ese terreno** y no debe intentarlo.

Lo que Calendly NO tiene (y nunca tendrá por diseño):
- Historial clínico / notas privadas del profesional sobre el cliente
- Pagos integrados con anticipos y paquetes de sesiones
- Formularios de intake pre-cita configurables por negocio
- Sistema de ausencias y vacaciones del equipo
- CRM con etiquetas, segmentos y campañas
- Jerarquía de empleados + sedes múltiples
- Chat en tiempo real entre citas
- Reseñas y calificaciones verificadas
- Recordatorios escalonados multi-canal

---

## Nuevos Verticales Habilitados

La clave: estos negocios **no pueden usar Gestabiz hoy** porque necesitan atención virtual. Con citas virtuales, entran:

| Vertical | Tamaño de mercado LATAM | Por qué prefieren Gestabiz sobre Calendly |
|----------|------------------------|------------------------------------------|
| Psicólogos / terapeutas | Grande | Necesitan historial de paciente, notas privadas, recurrencia |
| Abogados | Grande | Compartir pantalla para documentos, facturación integrada |
| Nutricionistas | Mediano | Seguimiento de métricas, formularios de progreso |
| Tutores / profesores | Grande | Materiales por sesión, historial de clases |
| Coaches (vida, fitness, negocios) | Grande | Metas, seguimiento, paquetes de sesiones |
| Médicos (telemedicina) | Muy grande | Historial clínico, recetas digitales |
| Asesores financieros | Mediano | Notas del portafolio, privacidad |
| Diseñadores / freelancers consultivos | Grande | Proyectos, revisiones, facturación |

Estos verticales tienen en común: **relación recurrente con el cliente** — exactamente donde Gestabiz tiene ventaja estructural.

---

## Implementación Técnica

**Base existente** (no hay que construir desde cero):
- WebRTC para voz → extensión a video es incremental (activar `getUserMedia({ video: true }}`)
- Compartir pantalla → `getDisplayMedia()` — misma API
- Sala de chat ya existe — agregar track de video sobre la misma sesión

**Lo que hay que construir**:
- `virtual_rooms` tabla: sala efímera vinculada a `appointment_id`
- Botón "Unirse a sesión" en la notificación pre-cita
- Panel pre-sesión con contexto del cliente (última visita, notas, formulario de intake)
- `session_notes`: notas post-sesión del profesional (privadas)
- Nueva columna `appointment_type` en `appointments`: `'in_person' | 'virtual' | 'hybrid'`

**Privacidad por defecto**:
- Sin grabación automática (opt-in explícito con consentimiento del cliente)
- Salas efímeras (desaparecen al terminar)
- Cifrado WebRTC nativo (DTLS-SRTP)

---

## Impacto en Pricing

Las citas virtuales pueden justificar un plan superior o un módulo adicional:
- Plan **Profesional**: citas virtuales (video + voz)
- Plan **Empresarial**: video + pantalla + grabación + notas clínicas avanzadas
- Alternativa: módulo add-on "Sesiones Virtuales" a $X/mes adicional

---

## Notas Relacionadas

- [[Fase 4 - El Shopify de los Negocios de Servicios]]
- [[sistema-chat]]
- [[planes-y-precios]]
- [[propuesta-de-valor]]
- [[comparativa-competidores]]
- [[ventajas-estructurales-no-explotadas]]

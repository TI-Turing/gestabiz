---
date: 2026-05-08
tags: [brainstorm, features, ideas, utilidad-real, fase-2, fase-3, fase-4, ranked]
status: ideas-en-revision
autor: Claude Opus 4.7 + Jose Luis
---

# Lluvia de Ideas — Features Útiles para PyMEs Colombianas (Mayo 2026)

## Contexto del Brainstorm

Análisis exhaustivo del producto, notas, documentación y roadmap actual buscando **ideas útiles para el día a día del dueño/empleado/cliente**, no necesariamente orientadas a "crecimiento". El criterio es: ¿esto le ahorra tiempo, dinero, fricción o estrés a un negocio real en Colombia hoy?

**Filtros aplicados**:
- ❌ Excluidas ideas ya documentadas en [[analisis-competitivo-roadmap]], [[Fase 4 - El Shopify de los Negocios de Servicios]] o [[Fase 5 - Competencia Directa con Siigo]]
- ✅ Priorizadas por impacto real, no por "wow factor"
- ✅ Tomado en cuenta: Colombia, mobile-first, sectores reales (salón/barbería/clínica/gym/hotel), DIAN, walk-ins, efectivo

---

## TIER S — Las que cambian el día a día (implementar primero)

### 1. Cierre de Caja Diario con Conciliación Automática ⭐⭐⭐⭐⭐

Al final del día, el admin/empleado registra cuánto entró en efectivo, transferencia, tarjeta. El sistema reconcilia con las citas completadas y muestra discrepancias automáticamente.

**Pros**:
- Resuelve dolor enorme: en LATAM el efectivo sigue siendo grande, los dueños no saben si el cajero "se quedó" con plata
- Detecta robo hormiga, errores de cobro, citas no registradas
- Datos para [[sistema-contable]] sin esfuerzo extra
- Cero competidores LATAM lo hacen bien
- Genera reporte exportable que sirve al contador

**Contras**:
- Requiere nueva tabla `daily_cash_close` con campos de efectivo/transferencia/tarjeta esperado vs reportado
- UX delicada: el cajero debe contar antes de irse (10 min al final del día)
- Discrepancias tienen muchas causas (propina, ajuste, cambio) — falsos positivos al inicio

**Esfuerzo**: Medio (2-3 semanas). **Impacto**: Muy alto.

---

### 2. Modo Walk-in / Salón Lleno con QR de Turnos ⭐⭐⭐⭐⭐

Para barberías y salones donde la gente llega sin cita. Cliente escanea QR en la entrada, se anota virtualmente, se va a hacer otra vuelta, recibe SMS/WhatsApp cuando le falta poco. Ve en su celular cuántos van adelante.

**Pros**:
- Resuelve dolor masivo: barberías colombianas tienen filas de 1-2 horas los sábados, gente se va y pierde la venta
- Mejora experiencia del cliente: no tiene que esperar parado
- Aumenta capacidad real: el cliente no abandona porque "voy luego, ya regreso"
- Reutiliza infraestructura QR de Gestabiz ([[QR-con-branding-Gestabiz]])
- Diferenciador único — Booksy/Fresha NO lo tienen

**Contras**:
- Solo aplica a verticales walk-in (barberías, salones express, peluquería rápida)
- Requiere SMS o WhatsApp confirmado al cliente — costo de notificaciones
- Empleado debe marcar "siguiente" desde el dashboard

**Esfuerzo**: Medio (3-4 semanas). **Impacto**: Muy alto en barberías/salones (60% del mercado target).

---

### 3. Notas Privadas de Sesión por Profesional ⭐⭐⭐⭐⭐

Para psicólogos, fisioterapeutas, terapeutas, médicos, nutricionistas. Espacio privado vinculado a cliente + cita donde el profesional escribe notas tras la sesión. Solo el profesional las ve. Encriptadas a nivel de columna.

**Pros**:
- Lock-in profesional brutal: 6 meses de notas clínicas son IMPOSIBLES de migrar a otro sistema
- Habilita verticales completos que hoy NO usan Gestabiz (psicología, fisioterapia, medicina general, coaching)
- Calendly, Booksy, Fresha NO tienen esto
- Diferenciador legal en salud: respaldo de historia clínica
- Búsqueda full-text en notas propias del profesional ("¿qué le di a María en la última sesión?")

**Contras**:
- Implicaciones legales: HABEAS DATA, retención obligatoria, encriptación AES-256
- En Colombia hay que considerar si se vuelve "historia clínica" (Ley 23 de 1981) — requiere asesoría legal
- Templates por vertical: el psicólogo necesita campos distintos al fisioterapeuta

**Esfuerzo**: Medio-alto (4-6 semanas con encriptación + templates). **Impacto**: Muy alto (abre 4-5 verticales nuevos).

---

### 4. Escáner OCR de Cédula Colombiana ⭐⭐⭐⭐⭐

Cuando llega un cliente nuevo (walk-in o reserva), el empleado apunta la cámara del celular a la cédula y el sistema autocompleta nombre, número, tipo de documento.

**Pros**:
- DIAN exige documento del cliente para todas las facturas (Resolución 000202/2025) — ya documentado en [[decision-cedula-cliente-obligatoria]]
- Hoy todos lo digitan a mano = errores + tiempo perdido
- Reduce 60-90 segundos por cliente nuevo
- Librerías open source disponibles (Tesseract.js, Google ML Kit en mobile)
- En la app móvil ([[sistema-mobile-hybrid]]) usa cámara nativa con calidad alta

**Contras**:
- Cédulas colombianas tienen 2 formatos (vieja amarilla vs digital) — entrenar bien el OCR
- Privacidad: la imagen NO debe almacenarse, solo extraer datos y descartar
- Funciona con buena luz — UX debe guiar al usuario

**Esfuerzo**: Bajo-medio (2 semanas con Google ML Kit). **Impacto**: Muy alto en negocios con walk-ins.

---

### 5. Modo Offline para Agenda del Día ⭐⭐⭐⭐⭐

PWA + cache forzado de la agenda diaria. Si se cae internet (lo cual pasa en Colombia, y MUCHO en pueblos), el negocio sigue viendo quién viene hoy, marca asistencia, agrega notas locales que se sincronizan al volver la conexión.

**Pros**:
- Resuelve dolor real: una clínica en Soacha sin internet 4 horas el martes no para de operar
- Diferenciador masivo vs Calendly/Booksy/Fresha (todos requieren conexión)
- Genera confianza brutal en negocios pequeños
- Bajo costo: Service Worker + IndexedDB
- Mensaje de marketing oro: "Funciona aunque se caiga internet"

**Contras**:
- Solo agenda del día (no histórico, no reportes)
- Conflictos al sincronizar (cita marcada como completada offline + admin la canceló desde otro dispositivo)
- Validar bien la sincronización para no perder datos

**Esfuerzo**: Medio (3-4 semanas). **Impacto**: Muy alto, especialmente fuera de capitales.

---

## TIER A — Alto valor, esfuerzo razonable

### 6. Cobro Automático de Propinas al Empleado ⭐⭐⭐⭐

Al cerrar el servicio, el cliente puede dejar propina vía Gestabiz (sugerencia 10%/15%/20% o monto libre). La propina va directo al empleado que lo atendió, no al negocio. Gestabiz toma comisión menor.

**Pros**:
- En LATAM la propina es importante en salones/barberías/spas/restaurantes
- Square hizo billones con esto en USA
- Modelo de ingresos adicional para Gestabiz (1-2% de propinas)
- Empleados felices = retención de empleados (problema enorme en el sector)
- Diferenciador real vs competencia
- Reduce fricción: el cliente ya no necesita tener efectivo exacto para propina

**Contras**:
- Implica integrar [[sistema-pagos-anticipados]] con un layer adicional de payout al empleado
- Tributariamente complejo en Colombia (propina ¿es ingreso del empleado? ¿se reporta?)
- El negocio podría oponerse por no controlar el dinero
- Requiere que cada empleado tenga cuenta verificada

**Esfuerzo**: Alto (6-8 semanas con compliance tributario). **Impacto**: Alto (diferenciador estructural).

---

### 7. Wallet del Cliente / Saldo a Favor + Gift Cards ⭐⭐⭐⭐

Cada cliente tiene un saldo monetario en el negocio. Se puede recargar (tarjeta regalo), acumular por cancelaciones, devoluciones, paquetes pre-pagados. Se descuenta en próximas citas.

**Pros**:
- Aumenta retención brutalmente: "tengo $30k a favor en X salón" → no me voy a otro
- Habilita gift cards: navidad, día de la madre, cumpleaños = ingresos anticipados para el negocio
- Resuelve casos reales: "te transferí $100k pero el corte costó $80k, ¿qué hago con $20k?"
- Compatible con [[sistema-billing]] existente
- Convierte clientes en "depositantes" del negocio = lock-in financiero

**Contras**:
- Implicaciones contables: el saldo del cliente es pasivo del negocio en el balance
- Si el negocio cierra → ¿qué pasa con los saldos? Términos legales obligatorios
- Requiere reportes especiales para [[sistema-contable]]
- Vencimiento de saldo (¿prescribe a los 2 años?) tiene reglas legales en Colombia

**Esfuerzo**: Medio-alto (4-5 semanas). **Impacto**: Alto.

---

### 8. Importador IA desde WhatsApp del Negocio ⭐⭐⭐⭐

El dueño exporta su chat de WhatsApp Business y un agente Claude lo procesa, extrayendo citas pasadas, datos de clientes, servicios pedidos. Convierte caos textual en datos estructurados de Gestabiz.

**Pros**:
- Reduce fricción de migración a casi cero (la objeción más común: "ya tengo todo en mi WhatsApp")
- Trae años de historial al sistema = el agente IA ([[business-brain-ia]]) tiene mucho más contexto
- Casi todos los negocios pequeños operan así hoy
- Aprovecha plan Anthropic ya configurado en el proyecto
- Marketing oro: "Trae todo de tu WhatsApp en 5 minutos"

**Contras**:
- WhatsApp limita exportación: solo conversaciones individuales (no batch)
- Calidad del extracto depende del formato del chat (mucho varía)
- Costo de tokens Claude: 1 negocio con 5 años de WhatsApp = ~500k tokens
- Privacidad: ¿el negocio acepta enviar chats de clientes a un LLM?

**Esfuerzo**: Medio (3-4 semanas con prompt engineering). **Impacto**: Alto en adquisición.

---

### 9. Resumen Diario Push al Dueño ⭐⭐⭐⭐

Cada noche a las 8pm el dueño recibe push de 1 línea: "Hoy: 15 citas, $850k facturado, 1 cancelación, 0 no-shows. María agendó tu primera cita del jueves." Sin abrir la app.

**Pros**:
- El dueño que no está siempre en local lo necesita desesperadamente
- Genera hábito: el dueño se conecta a Gestabiz cada noche
- Bajo costo de implementación: Edge Function diaria + push
- Personalizable por el dueño (qué métricas le importan)
- Convierte Gestabiz en parte del ritual diario del dueño
- Estilo "resumen del día" del banco — muy familiar en Colombia

**Contras**:
- Pocos dueños tienen push notifications activadas (priorizar app móvil primero)
- Información personal sensible viajando — push debe ir encriptada
- Si el negocio tiene mal día, el push es deprimente (toggle on/off)

**Esfuerzo**: Bajo (1-2 semanas). **Impacto**: Alto en engagement.

---

### 10. Fotos Antes/Después con Consentimiento Digital ⭐⭐⭐⭐

Para estética, dermatología, fisioterapia, peluquería, dentistas. El cliente firma digitalmente al primer registro un consentimiento de uso de imagen. El profesional toma fotos vinculadas a cliente + cita. Galería privada del negocio + uso opcional en marketing solo si tiene permiso.

**Pros**:
- Hoy se hace en el celular del empleado y se pierde / mezcla con fotos personales
- Habilita el feature más usado en marketing del sector estética
- Vinculación legal: las fotos quedan asociadas a consentimiento firmado
- Aumenta valor del paquete pro
- Recolección estructurada para el portafolio público

**Contras**:
- Requiere storage adicional (fotos pesan)
- Privacidad crítica: una fuga es desastre legal
- UX de captura debe ser ultra rápida (durante el servicio)
- Permisos granulares: ¿puede el empleado X ver las fotos del cliente Y?

**Esfuerzo**: Medio (3-4 semanas). **Impacto**: Alto en estética/salud (~30% del target).

---

## TIER B — Buenas, pero con compromisos

### 11. Inventario Simple de Consumibles ⭐⭐⭐⭐

NO es un POS completo. Solo "no te quedes sin tinte un sábado". El negocio define consumibles (tinte rubio, cera, gel) y por cada servicio el sistema descuenta automáticamente. Alerta cuando el stock baja.

**Pros**: Resuelve un dolor real, sin pretender ser Siigo. Bajo esfuerzo.
**Contras**: Vale poco para verticales no-belleza. Si crece se confunde con POS pro.

**Esfuerzo**: Medio. **Impacto**: Alto en belleza/salud.

---

### 12. Cargo Automático por No-Show con Tarjeta Guardada ⭐⭐⭐⭐

El cliente firma digitalmente una política: "si no asisto sin avisar 24h antes, se me cobra el 50%/100%". Tarjeta tokenizada. Si pasa la hora y el cliente no llegó → cobro automático.

**Pros**: El no-show es el dolor #1. Soluciona estructuralmente. Documentado en [[Fase 4 - El Shopify de los Negocios de Servicios]] pero merece feature dedicado.
**Contras**: Requiere [[sistema-pagos-anticipados]] funcionando. Algunos clientes se ofenderán y se irán. Manejo legal cuidadoso.

**Esfuerzo**: Medio. **Impacto**: Muy alto cuando funciona.

---

### 13. Recordatorio "Trae lo Necesario" Configurable por Servicio ⭐⭐⭐

Cada servicio puede tener instrucciones especiales que se envían automáticamente 24h antes: "ven con el cabello lavado", "trae uniforme deportivo", "ven en ayunas", "no uses crema corporal hoy". Plantillas pre-cargadas por vertical.

**Pros**: Reduce visitas perdidas o reagendadas por "no traje nada". Cero infraestructura nueva (reutiliza notifications). Diferencial real en clínicas, depilación, exámenes.
**Contras**: El admin debe configurarlo (puede no hacerlo). Otra cosa más en el wizard de creación de servicio.

**Esfuerzo**: Bajo. **Impacto**: Alto en clínicas/estética/deporte.

---

### 14. Modo Día Especial (Black Friday, San Valentín, Día de la Madre) ⭐⭐⭐

Presets que el negocio activa con un click. Cambian temporalmente: precios promocionales en servicios seleccionados, mensajes en notificaciones, banner en perfil público, slots adicionales. Vuelve a normal automáticamente al terminar la fecha.

**Pros**: En Colombia el Día de la Madre, San Valentín, Amor y Amistad, Halloween, Navidad son enormes. Hoy el negocio cambia precios y olvida volverlos a normal. Implementable encima de [[sistema-perfiles-publicos]].
**Contras**: Requiere campo `temporary_price` y `valid_until` en services. Edge cases con citas ya pagadas si cambia precio.

**Esfuerzo**: Bajo-medio. **Impacto**: Medio-alto estacional.

---

### 15. NPS Post-Servicio con Ramificación Inteligente ⭐⭐⭐

24h después de la cita, el cliente recibe WhatsApp con 1 pregunta: "Del 0 al 10, ¿qué tan probable es que recomiendes [Negocio]?". Si es 9-10 → mensaje de gracias + link de reseña pública. Si es 6-8 → pide feedback privado. Si es 0-5 → alerta urgente al admin para recuperación del cliente.

**Pros**: Estándar mundial de satisfacción. Reseñas públicas suben naturalmente. Detecta clientes a punto de irse a tiempo.
**Contras**: Otra notificación más (saturación). NPS sin contexto no enseña qué arreglar. Necesita cultura del admin para responder al alerta.

**Esfuerzo**: Bajo. **Impacto**: Medio-alto.

---

### 16. Reservas para Terceros (Familiares) ⭐⭐⭐

La mamá agenda 3 citas: para Juan (hijo), María (hija), y ella misma. Cada cita queda registrada al cliente correcto, no a la mamá. Importante para clínicas pediátricas, dentistas familiares, salones que atienden mamá+hijas.

**Pros**: Caso real, hoy se mete todo a nombre de la mamá y los datos se ensucian. Habilita reportes correctos por cliente real.
**Contras**: UX compleja del wizard cuando se agendan múltiples. Edge cases en cobro (¿cobro 1 vez por todos o uno por uno?).

**Esfuerzo**: Medio. **Impacto**: Medio-alto en salones familiares y clínicas pediátricas.

---

### 17. Permiso Pre-Cita por Cuestionario Escalonado ⭐⭐⭐

Para servicios riesgosos o caros (alisado permanente, depilación láser, tratamientos médicos), el cliente nuevo primero responde cuestionario médico. Si responde "tomo anticoagulantes" → bloquea cita y notifica al profesional para llamar. Si responde bien → cita confirmada.

**Pros**: Evita demandas y devoluciones. Diferenciador en estética avanzada y salud. Reutiliza formularios de [[Fase 4 - El Shopify de los Negocios de Servicios]] (sección 4: formularios pre-cita).
**Contras**: El cliente abandona si el formulario es largo. Requiere que el negocio configure preguntas + reglas (esfuerzo del admin).

**Esfuerzo**: Medio-alto. **Impacto**: Alto en estética avanzada y salud.

---

### 18. Modo Vacaciones del Negocio (Cancelación Masiva) ⭐⭐⭐

Cuando el negocio cierra por vacaciones colectivas, feriado puente o emergencia (inundación, bloqueo), el admin marca rango y todas las citas se cancelan automáticamente con notificación masiva. Cada cliente recibe link para reagendar fácil.

**Pros**: Hoy se hace cancelación una por una (15-50 citas) o se olvidan. Resuelve emergencias también (paro armado en Colombia, marchas que cierran zonas). Tipo de operación batch limpia.
**Contras**: Requiere lógica de notificación batch que no sature. Reembolso si cobró anticipado (interactúa con [[sistema-pagos-anticipados]]).

**Esfuerzo**: Medio. **Impacto**: Medio-alto puntual.

---

### 19. Validación GPS de Asistencia del Empleado ⭐⭐⭐

El empleado debe estar dentro de cierto radio de la sede (50m) para registrar entrada. Sin ser big brother — solo un check-in que registra hora real vs hora pactada en horarios. Reportes mensuales de puntualidad.

**Pros**: Control real para dueños que no están en local. Detecta empleados que llegan tarde habitualmente. Alimenta reportes de [[Fase 4 - El Shopify de los Negocios de Servicios]] sección 5 (asistencia y puntualidad).
**Contras**: Algunos empleados se sentirán vigilados (riesgo cultural en Colombia). Requiere permiso de geolocalización en mobile. Falsos positivos por GPS impreciso.

**Esfuerzo**: Bajo-medio. **Impacto**: Medio (depende de cultura del negocio).

---

### 20. Cita Express (Slots Cortos para Servicios Rápidos) ⭐⭐⭐

Bloques de 15-20 min para servicios ultra rápidos (corte de cejas, retoque uñas, masaje express, lavado simple) que se llenan con cliente en lista de espera o walk-ins. Aumenta densidad de uso de empleados ociosos.

**Pros**: Compensa horarios muertos. Útil en barberías y salones con horarios pico. Combina bien con [[Modo Walk-in / Salón Lleno]].
**Contras**: Requiere repensar el modelo de slot por servicio. Algunos empleados odian "rellenar" con cositas.

**Esfuerzo**: Medio. **Impacto**: Medio.

---

## TIER C — Útiles pero secundarias

### 21. Sistema de Garantías de Servicio
"Tu coloración tiene garantía 7 días". Si hay problema, cita gratis automática.
**Esfuerzo**: Bajo. **Impacto**: Medio en estética premium.

### 22. Auto-traducción del Chat (zonas turísticas)
ES↔EN↔PT en tiempo real. Para Cartagena, Medellín, Cali, hoteles turísticos.
**Esfuerzo**: Medio. **Impacto**: Medio (nicho geográfico).

### 23. Encuesta Mensual de Satisfacción al Empleado
Privada, anónima, alerta al dueño si el clima baja. Crítico con la rotación del sector.
**Esfuerzo**: Bajo. **Impacto**: Medio.

### 24. Detector de Doble Agenda (manual + Gestabiz)
El empleado agendó por WhatsApp Y el admin lo registró en Gestabiz. Avisa antes de duplicar.
**Esfuerzo**: Medio. **Impacto**: Medio.

### 25. Sello de Calidad Verificado (asociaciones gremiales)
Validación con Asobeauty, Aciem, asociaciones médicas. Sello en perfil público.
**Esfuerzo**: Alto (alianzas externas). **Impacto**: Medio-alto en salud.

### 26. Modo Empleado Estricto (UI Simplificada)
"Hoy tienes 8 citas. La próxima es María a las 10:00." Sin más. Para empleados poco técnicos.
**Esfuerzo**: Medio. **Impacto**: Medio.

### 27. Sistema de Guardia para Emergencias
Para clínicas, vet, mecánicos. Cliente regular contacta fuera de horario, empleado de turno responde.
**Esfuerzo**: Medio. **Impacto**: Medio en verticales específicos.

### 28. Tracker de Objetivos Mensuales del Negocio
"Meta: 200 citas. Vas en 145." Push de motivación. Gamificación.
**Esfuerzo**: Bajo. **Impacto**: Bajo-medio.

### 29. Recordatorios en Papel (Print Mode)
Para clientes mayores que no usan email/WhatsApp. Imprime tarjeta con próxima cita.
**Esfuerzo**: Muy bajo. **Impacto**: Bajo (nicho).

### 30. Soporte para Clientes con Discapacidad
Campo en ficha: silla de ruedas, intérprete, perro guía. Avisa al empleado.
**Esfuerzo**: Bajo. **Impacto**: Bajo (nicho importante éticamente).

---

## TIER D — Polémicas o de baja prioridad

### 31. Lista Negra de Clientes (compartida o privada)
Negocio marca clientes problemáticos. Si está en lista de aliados → alerta.
**Riesgo**: legal en Colombia (Habeas Data, Ley 1581). Polémico pero MUY pedido.
**Recomendación**: Implementar versión PRIVADA por negocio primero, descartar la compartida.

### 32. Anti-Fraude Empleado (detector de patrones sospechosos)
Empleado X registra muchos no-shows en su almuerzo, empleado Y siempre cierra caja con ajuste.
**Riesgo**: cultura laboral en Colombia muy sensible a "sospecha automática".
**Recomendación**: Como reporte para el admin, no como acusación automática.

### 33. Embajadores VIP Públicos
"María López es nuestra clienta desde 2018". Social proof.
**Riesgo**: Privacidad del cliente (¿quién acepta?). Costos de gestión del programa.
**Recomendación**: Solo si el negocio lo pide, no por defecto.

### 34. TV del Salón (pantalla en local)
Mostrar próximas citas, mensajes de bienvenida, branding del local.
**Esfuerzo**: Alto (otra superficie a mantener). **Impacto**: Bajo. Se siente nice-to-have.

### 35. Up-sell Sugerido al Empleado
"Tu cliente Ana siempre pide secado, ¿lo agregamos?". Recomendación al empleado.
**Esfuerzo**: Medio (requiere lógica de patrones por cliente). **Impacto**: Bajo-medio.

---

## Recomendación de Priorización (Q3-Q4 2026)

Si tuviera que elegir las **5 a construir primero** para el siguiente trimestre, sin orden particular:

1. **Cierre de Caja Diario** (#1) — utilidad universal en TODOS los verticales
2. **Modo Walk-in / Salón Lleno** (#2) — diferenciador único, valor enorme en barberías
3. **Modo Offline para Agenda del Día** (#5) — confianza estructural, marketing oro
4. **Escáner OCR de Cédula** (#4) — DIAN obliga, baja fricción, fácil
5. **Resumen Diario Push al Dueño** (#9) — engagement, bajo costo, alto retorno

Estas 5 atacan diferentes verticales y dolores, son técnicamente independientes (no hay dependencias cruzadas) y se pueden construir en paralelo o secuencial.

---

## Filtros que Apliqué Mentalmente

Para llegar a este ranking pensé en:

- **¿Lo usaría un dueño de salón en Soacha mañana?** (filtro de utilidad real)
- **¿Lo entiende sin tutorial?** (filtro de simplicidad)
- **¿Genera valor desde el día 1?** (filtro de adopción)
- **¿La competencia LATAM ya lo tiene?** (filtro de diferenciación)
- **¿Encaja con la arquitectura actual sin grandes refactors?** (filtro de costo)
- **¿Aplica a ≥30% del target o es un nicho?** (filtro de mercado)
- **¿Tiene modelo de monetización claro o aumenta retención?** (filtro de negocio)

Las del Tier S pasaron los 7 filtros. Las del Tier A pasaron 5-6. Las del Tier C-D pasaron 3-4.

---

## Notas Relacionadas

- [[analisis-competitivo-roadmap]] — Roadmap de features ya documentadas
- [[Fase 4 - El Shopify de los Negocios de Servicios]] — Visión completa Fase 4
- [[business-brain-ia]] — Otra idea complementaria (agente IA por negocio)
- [[propuesta-de-valor]] — Pitch actual
- [[sectores-y-casos-de-uso]] — Verticales target
- [[ventajas-estructurales-no-explotadas]] — 17 ventajas competitivas latentes
- [[auditoria-completa-abril-2026]] — Auditoría exhaustiva del producto
- [[estrategia-producto-y-negocio]] — Estrategia de producto y GTM
- [[QR-con-branding-Gestabiz]] — Infra QR base para feature #2

---

*Generado: 2026-05-08 por Claude Opus 4.7 — Brainstorm a pedido del fundador, perspectiva de utilidad real, no growth-driven*

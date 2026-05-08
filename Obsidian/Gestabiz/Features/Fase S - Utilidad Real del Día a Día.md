---
date: 2026-05-08
tags: [roadmap, fase-s, utilidad, walk-in, offline, ocr, caja, notas-privadas]
status: planificado
---

# Fase S — Utilidad Real del Día a Día

> Features que cambian el trabajo diario del negocio desde el primer minuto. No son flashy — son las cosas que el dueño siente como indispensables una semana después de usarlas.

Estas 5 features surgieron del brainstorm [[brainstorm-features-utiles-mayo-2026]] (Tier S). Se priorizaron porque pasaron 7 filtros de utilidad real, son técnicamente independientes entre sí, y ningún competidor LATAM las cubre bien.

---

## S1 — Cierre de Caja Diario con Conciliación Automática ⭐

**Dolor que resuelve**: el dueño no sabe si el cajero entregó todo. En LATAM el efectivo sigue siendo grande y el robo hormiga es real.

**Cómo funciona**:
- Al final del día, el admin/cajero registra lo cobrado por canal: efectivo, transferencia, tarjeta
- El sistema compara con las citas completadas del día (ingresos esperados)
- Muestra discrepancias: "Esperado $850k — Reportado $830k — Diferencia: $20k"
- Permite añadir ajustes con nota (propina, cambio no devuelto, error de cobro)
- Reporte exportable para el contador

**Tablas nuevas**:
- `daily_cash_closes`: (business_id, location_id, date, cash_reported, transfer_reported, card_reported, expected_total, difference, notes, closed_by, closed_at)

**Integración**: alimenta [[sistema-contable]] sin esfuerzo extra del admin.

**Esfuerzo estimado**: 2-3 semanas.

---

## S2 — Modo Walk-in / Salón Lleno con QR de Turnos ⭐

**Dolor que resuelve**: barberías y salones pierden clientes que se aburren de esperar y se van. El sábado pueden tener 2h de fila y el negocio no captura esa demanda.

**Cómo funciona**:
1. El local pega el QR de Gestabiz (ya existe en [[QR-con-branding-Gestabiz]]) en la entrada o la ventana
2. El cliente escanea, ingresa su nombre/celular, queda en la fila virtual
3. Ve en tiempo real: "Vas #4, espera aprox 35 min"
4. Recibe WhatsApp/SMS cuando le quedan 2 turnos: "¡Es casi tu turno! Regresa a [Negocio]"
5. El empleado marca "siguiente" desde su dashboard al terminar cada servicio

**Tablas nuevas**:
- `walkin_queue`: (business_id, location_id, client_name, client_phone, position, status, notified_at, served_at, joined_at)

**Aplica a**: barberías, salones express, peluquerías rápidas, clínicas sin cita previa.

**Esfuerzo estimado**: 3-4 semanas.

---

## S3 — Notas Privadas de Sesión por Profesional ⭐

**Dolor que resuelve**: psicólogos, fisioterapeutas, nutricionistas, médicos, coaches anotan en cuadernos físicos o WhatsApp consigo mismos. Si el cuaderno se pierde, se pierde el historial del paciente.

**Cómo funciona**:
- Al completar una cita, el profesional tiene acceso a un editor de texto privado vinculado al cliente + cita
- Las notas son visibles SOLO para ese profesional (ni el admin las ve)
- Búsqueda full-text en las propias notas: "¿qué le recetó mi a Ana el mes pasado?"
- Templates por vertical: psicología tiene campos distintos a fisioterapia
- Encriptación a nivel de columna (AES-256) — la BD nunca guarda texto plano

**Tablas nuevas**:
- `session_notes`: (appointment_id, professional_id, client_id, content_encrypted, created_at, updated_at)
- `session_note_templates`: (vertical, fields JSONB)

**Implicaciones legales**: en Colombia, historia clínica tiene retención mínima de 15 años (Resolución 1995/1999 del Minisalud). Los negocios de salud deben conocer esta obligación. Gestabiz guarda, el negocio es responsable de no eliminarlas.

**Lock-in profesional**: 6 meses de notas clínicas en Gestabiz = imposible migrar.

**Esfuerzo estimado**: 4-6 semanas (incluye encriptación + templates).

---

## S4 — Escáner OCR de Cédula Colombiana ⭐

**Dolor que resuelve**: la DIAN exige número y tipo de documento del cliente para todas las facturas (Resolución 000202/2025 — ya documentado en [[decision-cedula-cliente-obligatoria]]). Hoy se digita a mano = errores + tiempo perdido por cada cliente nuevo.

**Cómo funciona**:
1. En la app móvil [[sistema-mobile-hybrid]], el empleado toca "Escanear cédula"
2. Apunta la cámara a la cédula del cliente
3. OCR extrae: nombre completo, número de documento, tipo (CC, CE, PA)
4. Autocompleta el formulario de nuevo cliente en Gestabiz
5. La imagen NO se almacena — solo los datos extraídos

**Stack**: Google ML Kit (nativo en React Native/Expo) para Android e iOS. Fallback: Tesseract.js en web.

**Soporta**:
- Cédula vieja (amarilla con foto)
- Cédula digital (holográfica)
- Cédula de extranjería

**Esfuerzo estimado**: 2 semanas.

---

## S5 — Modo Offline para Agenda del Día ⭐

**Dolor que resuelve**: internet se cae en locales colombianos (especialmente fuera de capitales). Hoy si se cae la conexión, el negocio queda ciego: no sabe quién viene, no puede marcar asistencias.

**Cómo funciona**:
- PWA Service Worker cachea automáticamente la agenda de hoy + mañana cada vez que hay conexión
- Sin internet: el negocio puede ver citas del día, marcar asistencia/no-show, agregar notas cortas
- Las acciones offline se guardan en IndexedDB y se sincronizan cuando vuelve la conexión
- Resolución de conflictos: si admin canceló cita online mientras el local la marcó como completada offline → alerta para resolver

**Alcance offline** (solo lo crítico):
- ✅ Ver agenda del día
- ✅ Marcar cita como completada / no-show
- ✅ Ver datos básicos del cliente
- ❌ Crear citas nuevas (requiere validación en servidor)
- ❌ Reportes financieros

**Mensaje de marketing**: *"Funciona aunque se caiga internet"* — diferenciador brutal vs Calendly/Fresha.

**Esfuerzo estimado**: 3-4 semanas (Service Worker + IndexedDB + sync logic).

---

## Secuencia Sugerida de Implementación

Las 5 son independientes entre sí. Orden sugerido por impacto/esfuerzo:

| Orden | Feature | Por qué primero |
|-------|---------|-----------------|
| 1 | S4 — OCR Cédula | Más fácil, impacto inmediato, DIAN lo exige |
| 2 | S9 (ver Fase 3) — Resumen Diario Push | Muy bajo esfuerzo, genera hábito desde el día 1 |
| 3 | S2 — Walk-in QR | Alto impacto en verticales walk-in, diferenciador único |
| 4 | S1 — Cierre de Caja | Universal, alta confianza del dueño |
| 5 | S5 — Offline Mode | Confianza estructural, mayor complejidad |
| 6 | S3 — Notas de Sesión | Abre verticales nuevos, mayor esfuerzo pero lock-in brutal |

---

## Notas Relacionadas

- [[brainstorm-features-utiles-mayo-2026]] — Origen de estas ideas (Tier S)
- [[Fase 3 - IA, Automatización y Agentes]] — Siguiente fase (Tier A del brainstorm integrado aquí)
- [[QR-con-branding-Gestabiz]] — Infra QR base para Walk-in mode (S2)
- [[sistema-mobile-hybrid]] — App móvil para OCR (S4) y offline (S5)
- [[decision-cedula-cliente-obligatoria]] — Requisito DIAN para OCR (S4)
- [[sistema-contable]] — Integración con Cierre de Caja (S1)
- [[sistema-citas]] — Base para Modo Offline (S5)

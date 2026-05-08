---
date: 2026-05-07
tags: [dian, testing, facturacion-electronica, qa, checklist]
status: pendiente
---

# Plan de Pruebas — Facturación Electrónica DIAN

> Prueba este documento de arriba a abajo en orden. Cada sección depende de la anterior.
> **Prerequisito**: stack local corriendo (`npx supabase start` + `npm run dev`).

---

## 0. Prerequisitos de entorno

- [ ] `npx supabase start` sin errores
- [ ] `supabase db reset` aplica las 4 migraciones nuevas sin error:
  - `20260707000000_habeas_data_consents.sql`
  - `20260707000001_fiscal_profile_fields.sql`
  - `20260707000002_dian_electronic_invoicing.sql`
  - `20260707000003_dian_permissions.sql`
- [ ] En Supabase Studio (`localhost:54323`) existen las tablas:
  - `data_processing_consents`
  - `business_dian_software`
  - `business_dian_resolution`
  - `electronic_invoices`
- [ ] En `profiles` existen las columnas `document_type_id` y `document_number`
- [ ] `npm run type-check` sin errores
- [ ] `npm run build` limpio (sin errores de TypeScript ni de imports)

---

## 1. Habeas Data — Captura de documento al registrar

### 1.1 Registro nuevo con documento

- [ ] Ir a `/register`
- [ ] Llenar el formulario de registro
- [ ] Verificar que aparecen los campos **Tipo de documento** (select) y **Número de documento** (input)
- [ ] Intentar registrar SIN llenar esos campos → debe mostrar error de validación (no avanza)
- [ ] Completar con CC + `12345678`
- [ ] Completar registro → verificar en `profiles` que `document_type_id = 'CC'` y `document_number = '12345678'`

### 1.2 Usuario existente sin documento — Modal bloqueante

- [ ] Crear un usuario de prueba directamente en BD **sin** `document_type_id` ni `document_number`
- [ ] Hacer login con ese usuario
- [ ] Verificar que aparece el **`CompleteProfileModal`** (modal bloqueante) antes de mostrar la app
- [ ] El modal NO debe tener botón de cerrar (✕) — es obligatorio
- [ ] Intentar hacer clic fuera del modal → no debe cerrarse
- [ ] Llenar el modal con tipo de documento + número → guardar
- [ ] Verificar que el modal desaparece y la app carga normalmente
- [ ] Verificar en `profiles` que los campos se guardaron

### 1.3 Usuario existente con documento — Sin modal

- [ ] Hacer login con un usuario que YA tiene `document_type_id` y `document_number`
- [ ] Verificar que el modal **NO aparece**

---

## 2. Plan Gating — Solo Pro y Empresarial

- [ ] Con un negocio en plan **Gratuito** o **Inicio**: ir a Configuración → Fiscal / DIAN
- [ ] Verificar que aparece la pantalla de **upgrade** con CTA, NO el wizard de habilitación
- [ ] Con un negocio en plan **Pro**: ir a Configuración → Fiscal / DIAN
- [ ] Verificar que aparece el estado de habilitación (pendiente o activo)

> Si no tienes un negocio Pro en local, inserta directamente en `business_plans`:
> ```sql
> UPDATE business_plans SET plan_id = 'pro' WHERE business_id = '<tu-business-id>';
> ```

---

## 3. Wizard de Habilitación DIAN

> Para probar sin Matias API real, el wizard llega a "Probar Conexión" que fallará con el sandbox falso — eso es esperado. Puedes mockear la edge function temporalmente o usar credenciales reales de sandbox de Matias.

### 3.1 Acceso al wizard

- [ ] Negocio Pro → Configuración → pestaña "Fiscal / DIAN"
- [ ] Aparece sección "Habilitación pendiente" con botón "Habilitar facturación electrónica"
- [ ] Al hacer clic abre el `DianEnrollmentWizard`

### 3.2 Navegación del wizard

- [ ] **Paso 1 — Datos del negocio**: campos NIT, DV, razón social, tipo organización, responsabilidades fiscales, CIIU, municipio
  - [ ] Intentar avanzar con campos vacíos → errores de validación
  - [ ] Llenar todos → botón "Siguiente" habilitado
- [ ] **Paso 2 — Resolución DIAN**: número de resolución, prefijo, desde, hasta, vigencia desde/hasta, clave técnica
  - [ ] Intentar avanzar con rango inválido (desde > hasta) → error
  - [ ] Intentar avanzar con fecha de vencimiento pasada → error
  - [ ] Llenar con datos ficticios válidos → avanza
- [ ] **Paso 3 — Software DIAN**: PAT token de Matias, ambiente (sandbox/producción)
  - [ ] Campo PAT token obligatorio → no avanza vacío
- [ ] **Paso 4 — Certificado digital**: upload de archivo `.p12` + contraseña
  - [ ] Intentar subir un archivo que no sea `.p12` → error o rechazo
  - [ ] Subir `.p12` válido (cualquier archivo .p12 de prueba sirve) + contraseña → avanza
- [ ] **Paso 5 — Prueba de conexión**: al hacer clic en "Verificar conexión" llama a la edge function
  - [ ] Verificar en logs de Supabase que `dian-enroll-business` recibe la petición
  - [ ] Si Matias sandbox responde → éxito y se guarda configuración
  - [ ] Si Matias falla → muestra error claro (no pantalla en blanco)

### 3.3 Persistencia post-habilitación

- [ ] Después de habilitación exitosa:
  - [ ] En `business_dian_software`: existe fila con `is_enrolled = true`, `matias_pat_token_encrypted` no nulo
  - [ ] En `business_dian_resolution`: existe fila con `is_active = true`, `current_number = from_number`
  - [ ] En Configuración → Fiscal / DIAN: aparece dashboard de estado (NO el wizard)

### 3.4 Dashboard de estado post-habilitación

- [ ] Aparece badge de ambiente (sandbox / producción)
- [ ] Barra de progreso del rango (ej: "0 de 5000 usados — 0%")
- [ ] Fecha de vencimiento de la resolución
- [ ] Botón para ver historial de facturas

---

## 4. Emisión Manual de Factura (EmitInvoiceButton)

> Para este test, el negocio debe estar habilitado (paso 3 completado).

### 4.1 Permisos

- [ ] Con usuario sin permiso `billing.emit_invoice`: el botón "Emitir factura" **NO aparece** (modo hide)
- [ ] Con usuario con permiso `billing.emit_invoice`: el botón aparece

### 4.2 Emisión exitosa

- [ ] Hacer clic en "Emitir factura" desde Historial de Ventas o una cita completada
- [ ] Se abre modal / formulario con: items, subtotal, impuestos, total, datos del cliente
- [ ] Llenar y confirmar → se llama a `emit-electronic-invoice`
- [ ] Verificar en `electronic_invoices`: fila con `status = 'pending'` (o `accepted` si Matias responde síncronamente)
- [ ] `document_number` debe ser el valor de `current_number` previo a la emisión
- [ ] `current_number` en `business_dian_resolution` debe haberse incrementado en 1

### 4.3 Selección automática de tipo de documento (5 UVT)

- [ ] Emitir con total **≤ $235,325 COP** → `document_type = 'pos'` en `electronic_invoices`
- [ ] Emitir con total **> $235,325 COP** → `document_type = 'invoice'` en `electronic_invoices`

### 4.4 Idempotencia

- [ ] Completar una cita que ya tiene factura en estado `accepted`
- [ ] Intentar emitir factura de nuevo para la misma cita/transacción
- [ ] La respuesta debe ser `{ alreadyExists: true, invoiceId: '...existente...' }`
- [ ] NO debe crearse una segunda fila en `electronic_invoices`
- [ ] NO debe incrementarse `current_number`

### 4.5 Consumidor Final (sin cédula del cliente)

- [ ] Emitir factura para un cliente sin `document_number` en su perfil
- [ ] Verificar en el payload enviado a Matias (ver logs de la edge function):
  - `buyer.name = 'Consumidor Final'`
  - `buyer.document_number = '222222222222'`
  - `buyer.document_type = 'CC'`
- [ ] La factura debe emitirse sin error

---

## 5. InvoiceCard y InvoicesHistoryPage

### 5.1 Historial de facturas

- [ ] Ir a Configuración → Fiscal / DIAN → "Ver facturas" (o la ruta equivalente)
- [ ] Aparece `InvoicesHistoryPage` con las facturas emitidas
- [ ] Tarjetas de resumen: total aceptadas, pendientes, rechazadas
- [ ] Filtros funcionan:
  - [ ] Por estado (todas / aceptadas / pendientes / rechazadas / canceladas)
  - [ ] Por tipo (todas / factura / POS / nota crédito)
  - [ ] Búsqueda por texto (número de documento, cliente)

### 5.2 InvoiceCard

- [ ] Cada factura muestra: número (prefijo + número), tipo, fecha, estado con badge de color
- [ ] Factura con `status = 'accepted'` y PDF disponible → botón "Descargar PDF" funciona (URL firmada, se abre o descarga)
- [ ] Factura con `status = 'accepted'` y XML disponible → botón "Descargar XML" funciona
- [ ] Factura con `status = 'rejected'` → botón "Reintentar" visible (con permiso `billing.emit_invoice`)
  - [ ] Al reintentar, llama a `emit-electronic-invoice` con el mismo `transactionId` / `appointmentId`
  - [ ] Idempotencia: si ya hay un accepted, no crea duplicado

### 5.3 Permisos en InvoiceCard

- [ ] Usuario sin `billing.emit_credit_note`: botón "Anular con NC" **NO aparece**
- [ ] Usuario con `billing.emit_credit_note`: botón "Anular con NC" aparece en facturas `accepted`

---

## 6. Notas Crédito (emit-credit-note)

### 6.1 Emisión manual de NC

- [ ] En una factura `accepted`: hacer clic en "Anular con NC"
- [ ] Seleccionar motivo (01 — Devolución parcial, 02 — Anulación, 03 — Rebaja, 04 — Ajuste)
- [ ] Ingresar monto del reembolso (puede ser menor al total — NC parcial)
- [ ] Confirmar → se llama a `emit-credit-note`
- [ ] Verificar en `electronic_invoices`: fila nueva con `document_type = 'credit_note'`, `parent_invoice_id` apuntando a la factura original, `status = 'pending'` o `'accepted'`

### 6.2 Validaciones

- [ ] Intentar anular una factura con `status = 'pending'` → error "Solo se pueden anular facturas en estado Aceptada"
- [ ] Intentar anular una factura con `status = 'rejected'` → mismo error
- [ ] Negocio sin resolución activa → error claro

### 6.3 Idempotencia de NC

- [ ] Emitir NC para una factura
- [ ] Intentar emitir NC de nuevo para la misma factura → respuesta `{ alreadyExists: true }`, sin crear segunda NC

---

## 7. Webhook de Matias (matias-webhook)

> Esta edge function recibe actualizaciones async de Matias cuando el estado de la factura cambia.

### 7.1 Prueba directa de la edge function

Llamar la edge function manualmente con `curl` o Postman apuntando al local (`http://localhost:54321/functions/v1/matias-webhook`):

```json
{
  "event": "invoice.accepted",
  "invoice_id": "<id-de-electronic-invoices-en-pending>",
  "cufe": "abc123cufe",
  "xml_url": "https://example.com/factura.xml",
  "pdf_url": "https://example.com/factura.pdf"
}
```

- [ ] La factura `pending` pasa a `accepted`
- [ ] Se guardan `cufe`, `xml_storage_path`, `pdf_storage_path`

```json
{
  "event": "invoice.rejected",
  "invoice_id": "<id-de-electronic-invoices-en-pending>",
  "error": "Firma inválida"
}
```

- [ ] La factura `pending` pasa a `rejected`
- [ ] Se guarda `error_message`
- [ ] Se crea notificación in-app `electronic_invoice_rejected`

### 7.2 Idempotencia del webhook

- [ ] Enviar el mismo webhook dos veces (factura ya en `accepted`)
- [ ] Segunda llamada → respuesta `200` pero sin modificar nada (no cambia a otro estado)

---

## 8. Monitor de Resolución (dian-resolution-monitor)

> Llamar la edge function manualmente: `http://localhost:54321/functions/v1/dian-resolution-monitor`

### 8.1 Resolución con >30 días y >10% disponible

- [ ] Resolución normal → función retorna `{ ok: true, processed: 1, expired: 0, warnings: 0 }` (sin notificaciones)

### 8.2 Alerta de vencimiento próximo

- [ ] Editar en BD: `valid_to = NOW() + INTERVAL '15 days'` para la resolución activa
- [ ] Llamar la edge function
- [ ] Verificar: fila en `in_app_notifications` con `type = 'dian_resolution_warning'`, `priority = 1`
- [ ] Volver a llamar → **NO crea segunda notificación** (deduplicación 24h)

### 8.3 Alerta de rango casi agotado

- [ ] Editar en BD: `current_number = to_number - 2` (queda <10%)
- [ ] Llamar la edge function
- [ ] Verificar: notificación `dian_resolution_warning`

### 8.4 Auto-desactivación por vencimiento

- [ ] Editar en BD: `valid_to = NOW() - INTERVAL '1 day'`
- [ ] Llamar la edge function
- [ ] Verificar: `is_active = false` en la resolución
- [ ] Verificar: notificación `dian_resolution_expired` con `priority = 2`
- [ ] Intentar emitir factura → error "No hay resolución de numeración activa"

### 8.5 Auto-desactivación por rango agotado

- [ ] Editar en BD: `current_number = to_number + 1`
- [ ] Llamar la edge function
- [ ] Verificar: `is_active = false`
- [ ] Intentar emitir factura → error "Se agotó el rango de numeración"

---

## 9. Resolución vencida / no activa — Bloqueo de emisión

- [ ] Sin resolución activa → `emit-electronic-invoice` retorna 422 "No hay resolución de numeración activa"
- [ ] Resolución activa pero `valid_to` pasado → retorna 422 "La resolución de numeración ha vencido"
- [ ] Resolución activa con `current_number > to_number` → retorna 422 "Se agotó el rango de numeración"

---

## 10. Negocio sin habilitación DIAN

- [ ] Un negocio Pro que NO completó el wizard
- [ ] Intentar emitir factura → error 422 "El negocio no está habilitado para facturación electrónica"
- [ ] DianFiscalSettings muestra el CTA de habilitación (no el dashboard)

---

## 11. Lock pesimista — Race conditions

> Esto es difícil de probar manualmente, pero el mecanismo es:
> `UPDATE ... WHERE current_number = $actual RETURNING current_number`
> Si dos requests concurrentes intentan el mismo número, uno obtiene la fila y el otro recibe `null` → 409.

- [ ] Hacer dos llamadas simultáneas a `emit-electronic-invoice` para **distinto** `appointmentId` (no idempotente entre sí) al mismo negocio
- [ ] Verificar que se crean **dos** facturas con **números consecutivos** (no el mismo número)
- [ ] `current_number` en `business_dian_resolution` quedó incrementado 2 veces

---

## 12. TypeScript y build

- [ ] `npm run type-check` → 0 errores
- [ ] `npm run build` → 0 errores, build exitoso
- [ ] `npm run lint` → sin errores (warnings aceptables)

---

## 13. Permisos granulares — Matriz completa

| Acción | Permiso requerido | Sin permiso | Con permiso |
|--------|-------------------|-------------|-------------|
| Ver tab Fiscal / DIAN | *(cualquier admin)* | — | Tab visible |
| Abrir wizard habilitación | `billing.dian_enroll` | Botón oculto | Botón visible |
| Botón "Emitir factura" | `billing.emit_invoice` | Oculto | Visible |
| Botón "Anular con NC" | `billing.emit_credit_note` | Oculto | Visible |
| Ver historial de facturas | `billing.view_invoices` | Pantalla bloqueada | Lista visible |

- [ ] Crear usuario con SOLO `billing.view_invoices` → puede ver historial pero no emitir ni anular
- [ ] Crear usuario con SOLO `billing.emit_invoice` → puede emitir pero no anular con NC
- [ ] Owner / Admin → tiene todos los permisos de billing por defecto

---

## 14. Notas de UI / UX

- [ ] DianFiscalSettings: en el tab "Fiscal / DIAN" no hay scroll horizontal
- [ ] DianEnrollmentWizard: en móvil (viewport < 640px) los campos son usables
- [ ] InvoicesHistoryPage: con 0 facturas muestra estado vacío (no pantalla en blanco)
- [ ] InvoiceCard: el badge de estado tiene colores correctos:
  - `accepted` → verde
  - `pending` → amarillo / naranja
  - `rejected` → rojo
  - `cancelled` → gris

---

## Datos de referencia para pruebas

### NIT de prueba válido (ficticio)
- NIT: `900123456`, DV: `7`
- Razón social: `Salón Belleza Test SAS`
- Tipo organización: 1 (Jurídica)
- Régimen: 48 (Responsable IVA)

### Resolución de prueba
- Número: `18764000001`
- Prefijo: `FE`
- Desde: `1`, Hasta: `5000`
- Vigencia: hoy + 2 años
- Clave técnica: cualquier string de 128 chars (en sandbox Matias no valida firma real)

### Certificado de prueba
- Cualquier archivo `.p12` de prueba — en sandbox Matias no valida el certificado real
- Si no tienes uno, crear uno dummy: `openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes && openssl pkcs12 -export -out test.p12 -inkey key.pem -in cert.pem -passout pass:test123`
- Contraseña: `test123`

### Query SQL de reset rápido (para repetir pruebas)
```sql
-- Limpiar facturas de prueba
DELETE FROM electronic_invoices WHERE business_id = '<tu-business-id>';
-- Resetear current_number
UPDATE business_dian_resolution SET current_number = from_number WHERE business_id = '<tu-business-id>';
-- Limpiar notificaciones DIAN
DELETE FROM in_app_notifications WHERE type IN ('dian_resolution_warning', 'dian_resolution_expired', 'electronic_invoice_rejected') AND business_id = '<tu-business-id>';
```

---

## Relacionado

- [[sistema-facturacion-electronica]] — documentación técnica del sistema
- [[decision-cedula-cliente-obligatoria]] — por qué se pide documento al cliente
- [[edge-functions]] — patrón verify_jwt = false

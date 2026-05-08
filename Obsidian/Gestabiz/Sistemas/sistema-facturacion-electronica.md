---
date: 2026-05-07
tags: [dian, facturacion-electronica, matias-api, colombia, edge-functions, pro-plan]
---

# Sistema de Facturación Electrónica (DIAN / Matias API)

Sistema multi-tenant de emisión de documentos electrónicos ante la DIAN colombiana, integrado vía **Matias API** (Ruta 2: software compartido). Disponible solo en planes Pro y Empresarial.

## Documentos soportados

- **Factura de Venta (FV)**: para totales > 5 UVT (~$235k COP)
- **Documento POS (DS)**: para totales ≤ 5 UVT (tope regulatorio 2026)
- **Nota Crédito (NC)**: cancelación total o parcial de una factura aceptada

## Arquitectura

### Tablas de BD

| Tabla | Propósito |
|-------|-----------|
| `business_dian_software` | PAT token cifrado, certificado p12, ambiente (sandbox/production), datos de habilitación |
| `business_dian_resolution` | Resolución de numeración DIAN: prefijo, rango from/to, current_number, vigencia, technical_key cifrada |
| `electronic_invoices` | Registro maestro: CUFE, estado, XML/PDF paths, parent_invoice_id para NC |

### Edge Functions

| Función | Trigger | Responsabilidad |
|---------|---------|-----------------|
| `dian-enroll-business` | UI wizard | Sube certificado p12, cifra campos sensibles, prueba conexión Matias, upserta software y resolución |
| `emit-electronic-invoice` | Manual / cita completada / Quick Sale | Idempotencia + lock pesimista → inserta en electronic_invoices → llama Matias POST /invoices |
| `emit-credit-note` | Cancelación de cita / refund | Valida factura padre aceptada → emite NC → llama Matias POST /credit-notes |
| `matias-webhook` | Webhook Matias → CUFE final | Actualiza estado pending→accepted/rejected, guarda XML/PDF en Storage |
| `dian-resolution-monitor` | Cron diario | Alerta si resolución vence en <30 días o <10% rango disponible; auto-desactiva si vencida o agotada |

### Storage

Bucket `electronic-invoices` (privado, retención 5 años por obligación DIAN):
- `dian/certificates/{businessId}.p12` — certificado digital del negocio

### Componentes Frontend

| Componente | Ubicación | Propósito |
|-----------|-----------|-----------|
| `DianEnrollmentWizard` | `src/components/billing/dian/` | Wizard 5 pasos: datos negocio → resolución → software → certificado → prueba sandbox |
| `DianFiscalSettings` | `src/components/billing/dian/` | Sub-tab "Fiscal / DIAN" dentro de Configuración admin. Gating Pro+ |
| `InvoicesHistoryPage` | `src/components/billing/dian/` | Listado con filtros, badges de estado, reintentar, acciones NC |
| `EmitInvoiceButton` | `src/components/billing/dian/` | Botón de emisión manual con PermissionGate `billing.emit_invoice` |
| `InvoiceCard` | `src/components/cards/` | Card self-fetch por invoiceId, descarga PDF/XML, anular con NC |

## Lógica de negocio crítica

### Selección automática de tipo de documento

```ts
const POS_MAX_COP = 5 * 47065  // 5 UVT 2026
const documentType = total <= POS_MAX_COP ? 'pos' : 'invoice'
```

### Idempotencia

- `emit-electronic-invoice`: verifica `(business_id, appointment_id)` o `(business_id, transaction_id)` con status pending/accepted antes de insertar
- `emit-credit-note`: verifica `(parent_invoice_id, document_type='credit_note')` con status pending/accepted

### Lock pesimista de número de documento

```sql
UPDATE business_dian_resolution
SET current_number = current_number + 1
WHERE id = $id AND current_number = $current  -- lock optimista
RETURNING current_number
```

Si otro proceso ya incrementó, retorna 409 Conflict y el cliente reintenta.

### Cifrado de campos sensibles

XOR + base64 con `CERTIFICATE_ENCRYPTION_KEY` (edge function secret). Placeholder para Supabase Vault. Campos cifrados: `matias_pat_token_encrypted`, `technical_key_encrypted`, `certificate_password_encrypted`, `own_software_pin_encrypted`.

## Permisos

| Permiso | Quién |
|---------|-------|
| `billing.dian_enroll` | Solo OWNER / ADMIN |
| `billing.emit_invoice` | Manager / Professional |
| `billing.view_invoices` | Manager / Professional / Accountant |
| `billing.emit_credit_note` | Solo Manager+ |

## Habilitación del negocio (Ruta 2 — Software Matias)

1. Admin obtiene PAT token de Matias (cuenta propia en matias.io)
2. Admin solicita resolución de numeración en MUISCA (DIAN) → obtiene número, prefijo, rango, technical_key
3. Admin solicita certificado digital `.p12` a ECD acreditada (Andes SCD, Certicámara, GSE gratuito)
4. Admin completa el `DianEnrollmentWizard` en Configuración → Fiscal / DIAN
5. Edge Function `dian-enroll-business` almacena todo y prueba conexión con Matias sandbox

## Monitoreo de resolución

`dian-resolution-monitor` corre diariamente:
- **<30 días para vencer** → notificación in-app `dian_resolution_warning` (priority 1)
- **<10% del rango disponible** → notificación in-app `dian_resolution_warning`
- **Vencida o rango agotado** → auto-desactiva + notificación `dian_resolution_expired` (priority 2)
- Deduplicación: no crea aviso si ya hay uno en las últimas 24h

## Plan gating

Solo disponible para negocios con `planIncludes(planId, 'pro')`. Usuarios en plan Gratuito / Inicio ven CTA de upgrade en la tab Fiscal.

## Notas regulatorias

- **Resolución DIAN 000202/2025**: datos mínimos del adquiriente (nombre + tipo/número doc)
- **Consumidor Final fallback**: si cliente no provee documento → nombre `'Consumidor Final'`, doc `222222222222` tipo CC
- **Retención XML/PDF**: 5 años obligatorios (bucket sin borrado físico)
- **Régimen simple**: validar `business_tax_config.tax_regime` antes de incluir IVA en payload

## Relacionado

- [[sistema-billing]] — planes y suscripciones
- [[sistema-ventas-rapidas]] — Quick Sales → trigger de emisión
- [[sistema-contable]] — transacciones y fiscal
- [[base-de-datos]] — schema de `electronic_invoices`
- [[edge-functions]] — patrón verify_jwt = false
- [[Fase 2 - Contabilidad, DIAN y App Móvil]] — spec original

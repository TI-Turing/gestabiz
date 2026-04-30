---
date: 2026-04-30
tags: [sistema, marketing, vault, assets, storage, whatsapp, email, produccion]
status: completado
---

# Sistema de Marketing Vault — COMPLETADO (Abr 2026)

Módulo para que los negocios almacenen, organicen y distribuyan sus materiales de marketing (flyers, videos, PDFs) directamente desde Gestabiz.

## Descripción

El Marketing Vault permite a admins y owners subir archivos de marketing a un bucket privado de Supabase Storage, organizarlos en carpetas virtuales y enviarlos por los canales disponibles: chat interno, WhatsApp Business y email (Brevo).

Disponible solo en planes **Profesional** y superiores.

## Bucket y RLS

- **Bucket**: `business-marketing-vault` (privado, 50 MB por archivo)
- **Estructura de paths**: `{business_id}/{carpeta}/{timestamp}_{nombre_archivo}`
- **Carpetas virtuales**: marcadas con un archivo `.keep` vacío
- **RLS**:
  - Admins y owners del negocio: lectura + escritura
  - Empleados activos del negocio: solo lectura
- **Migración**: `supabase/migrations/20260428000006_marketing_vault_bucket.sql`

## Componentes

| Componente | Ruta | Descripción |
|-----------|------|-------------|
| `MarketingManager` | `src/components/admin/marketing/MarketingManager.tsx` | Vista principal: dos paneles (carpetas / archivos), upload con drag & drop, lightbox, acciones por archivo |
| `SendAssetModal` | `src/components/admin/marketing/SendAssetModal.tsx` | Modal multi-canal: WhatsApp / Email, con RecipientPicker (clientes del negocio) |
| `MarketingVaultPicker` | `src/components/chat/MarketingVaultPicker.tsx` | Picker existente para seleccionar assets desde el chat |

## Hooks

| Hook | Archivo | Descripción |
|------|---------|-------------|
| `useMarketingVault(businessId)` | `src/hooks/useMarketingVault.ts` | Lista carpetas y archivos con signed URLs batch (TTL 1h) |
| `useUploadMarketingAsset(businessId)` | idem | Sube un archivo a `{businessId}/{folder}/{timestamp}_{name}`, invalida cache |
| `useDeleteMarketingAsset(businessId)` | idem | Elimina un archivo por path completo |
| `useCreateMarketingFolder(businessId)` | idem | Crea carpeta virtual subiendo `.keep` vacío |

## Edge Functions

| Función | Descripción |
|---------|-------------|
| `send-marketing-whatsapp` | Envía archivo de marketing por WhatsApp Cloud API; valida auth, genera signed URL 7d, detecta tipo (image/video/document), hasta 50 recipients |
| `send-marketing-email` | Envía archivo por Brevo con HTML responsive; imagen embebida o link de descarga para PDF/video; footer con logo del negocio |

## Permisos

- Subir/eliminar: `marketing.upload` (protegido con `PermissionGate`)
- Enviar: cualquier usuario autenticado con acceso al negocio puede enviar assets existentes
- Bloqueo de plan: si `planId === 'free' || 'basico'` → pantalla de upsell

## Planes

- Plan `free`: bloqueado — pantalla de upgrade
- Plan `basico`: bloqueado — pantalla de upgrade
- Plan `pro` y superior: acceso completo

## Flujo de acceso

1. Admin navega a `/app/admin/marketing`
2. `MarketingManager` lista carpetas del bucket vía `useMarketingVault`
3. Admin selecciona carpeta, ve grid de archivos con thumbnails (signed URLs 1h)
4. Acciones: preview (lightbox), copiar URL firmada 1h, enviar, eliminar
5. "Enviar" → `SendAssetModal` con tabs WhatsApp / Email
6. WhatsApp: llama a `send-marketing-whatsapp` con lista de números
7. Email: llama a `send-marketing-email` con lista de emails + asunto + cuerpo
8. Desde chat: `MarketingVaultPicker` → al confirmar, genera signed URL TTL 7 días y agrega como attachment

## Gotchas

- El bucket es **privado**: nunca usar `getPublicUrl()`, siempre `createSignedUrl()`
- TTL de URLs: 1h para thumbnails, 7 días para adjuntos en chat, 7 días para envío por WhatsApp/email
- Carpetas vacías: representadas por archivo `.keep` — el hook las filtra al listar
- `path` es campo obligatorio en `MarketingVaultFile` (actualizado en `types.ts`)
- WhatsApp Cloud API requiere que el número ya haya tenido conversación con el negocio (opt-in) para recibir templates; para media se usa el tipo correspondiente (image/video/document)

## Relacionado

- [[sistema-chat]] — Integración del picker en ChatInput
- [[sistema-permisos]] — PermissionGate protege acciones de upload/delete
- [[base-de-datos]] — Bucket `business-marketing-vault`, RLS

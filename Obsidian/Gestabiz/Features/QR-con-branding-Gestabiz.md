---
date: 2026-03-26
tags: [feature, qr, branding, pendiente]
---

# QR con Branding de Gestabiz

## Descripción

Generación de un QR personalizado que incluya el icono de Gestabiz centrado dentro del código QR, y debajo del QR el logo de Gestabiz acompañado del texto **"Reserva tu próxima cita aquí"**.

## Mockup conceptual

```
┌─────────────────────┐
│  ▄▄▄ ░░░░░ ▄▄▄      │
│  ░ ░ ░[G]░ ░ ░      │  ← icono Gestabiz en el centro del QR
│  ▀▀▀ ░░░░░ ▀▀▀      │
└─────────────────────┘
   [Logo Gestabiz]
  Reserva tu próxima
       cita aquí
```

## Contexto de uso

- Perfil público del negocio (`/negocio/:slug`)
- Dashboard admin → sección de compartir / marketing
- Impresión física para colocar en el local del negocio

## Implementación sugerida

- Librería actual: `qrcode` (ya instalada para generar QR básicos)
- Sobreimprimir icono: canvas API o `qrcode` con opción `imageUrl` / `logo`
- Alternativa: librería `qrcode-with-logos` o `qr-code-styling` que soporta logo central nativamente
- Output: PNG descargable + SVG opcional
- El texto y logo debajo se pueden renderizar con canvas o como HTML imprimible

## Estado

- [x] Implementado — 2026-03-28
- Componente: `src/components/admin/BusinessQRModal.tsx`
- Modificados: `OverviewTab.tsx` (botón QR), `PublicBusinessProfile.tsx` (auto-book `?book=true`)
- URL del QR: `/negocio/:slug?book=true`

## Notas

- El QR debe apuntar a la URL pública del negocio (`/negocio/:slug`)
- El icono central no debe superar ~20% del área del QR para mantener lectura correcta con corrección de errores nivel H
- Verificar que la librería existente (`src/components/ui/QRScannerWeb.tsx`, `QRScanner.tsx`) no entre en conflicto

## Notas Relacionadas

- [[sistema-perfiles-publicos]] — Perfil público /negocio/:slug (URL del QR)
- [[sistema-citas]] — Auto-book con `?book=true`
- [[Perfil-Publico-Profesional]] — Perfil público de profesional
- [[SEO-directorio-post-deploy]] — SEO y páginas públicas

---
date: 2026-05-07
tags: [dian, habeas-data, cedula, cliente, decision-arquitectonica]
---

# Decisión: Cédula (tipo + número) de documento obligatoria para clientes

## Contexto

Al implementar facturación electrónica DIAN (Matias API), surge la pregunta: ¿debe Gestabiz exigir el tipo y número de documento de identidad al cliente para poder emitir facturas?

## Decisión: SÍ, es obligatorio capturar tipo + número de documento

Los campos `document_type_id` y `document_number` son obligatorios en el perfil del cliente (`profiles` table) para negocios que emiten facturas electrónicas.

## Fundamento regulatorio

**Resolución DIAN 000202/2025** establece los datos mínimos del adquiriente:
- Nombre completo
- Tipo de documento + número de documento

Esto es el **mínimo obligatorio** — la regulación prohíbe exigir además teléfono, dirección física o RUT al consumidor final (esos son opcionales en Gestabiz).

## Fallback para clientes que se niegan

Si el cliente se niega a proporcionar su documento → emisión como **"Consumidor Final"**:
- Nombre: `'Consumidor Final'`
- Tipo documento: `CC`
- Número documento: `'222222222222'` (código DIAN oficial para consumidor final)

Este fallback es válido regulatoriamente para compras de bajo monto y clientes informales.

## Implicaciones de implementación

### Perfil de usuario
- Campos `document_type_id` (varchar 10) y `document_number` (varchar 20) en `profiles`
- NULL transitorio para usuarios existentes (se les pedirá al primer login post-deploy)
- Índice único parcial: `(document_type_id, document_number) WHERE document_number IS NOT NULL`

### Tipos de documento válidos (DIAN Colombia)
| Código | Tipo | Validación |
|--------|------|------------|
| CC | Cédula de Ciudadanía | 6-10 dígitos |
| NIT | NIT | 9-10 dígitos + DV |
| CE | Cédula de Extranjería | 6-7 dígitos |
| PA | Pasaporte | alfanumérico |
| TI | Tarjeta de Identidad | 10 dígitos |
| RC | Registro Civil | 10 dígitos |

### UX de captura
1. **Registro nuevo**: campos obligatorios en el form de signup
2. **Usuario existente**: modal bloqueante one-time al primer login post-deploy ("Completa tu perfil para continuar")
3. **Al emitir factura**: si el cliente de la cita no tiene documento → `ClientFiscalDataModal` para capturarlo en el momento
4. **Quick Sale**: bloque "Datos del cliente para facturación" cuando el negocio tiene FE habilitada

## Habeas Data (Ley 1581/2012)

No se requiere autorización del Estado. Gestabiz debe:
1. Política de Tratamiento de Datos publicada (`gestabiz.com/politica-datos-personales`)
2. Autorización previa, expresa e informada del titular (checkbox en signup)
3. Mecanismo para ejercer derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)

### Tabla `data_processing_consents` (pendiente Fase 2.0)
- `user_id`, `purpose` ('account' | 'electronic_invoicing' | 'marketing')
- `policy_version`, `accepted_at`, `ip_address`, `user_agent`

## Trade-offs

| Pro | Contra |
|-----|--------|
| Cumplimiento DIAN obligatorio para FE | +1 campo obligatorio en signup (leve fricción) |
| Mejora calidad fiscal de facturas emitidas | Clientes existentes deben actualizar perfil |
| Evita re-emisión masiva por datos faltantes | Gestión de datos sensibles (RLS + cifrado) |
| Fallback a Consumidor Final preserva UX | — |

## Relacionado

- [[sistema-facturacion-electronica]] — implementación
- [[sistema-autenticacion]] — signup y perfil
- [[sistema-permisos]] — RLS sobre profiles

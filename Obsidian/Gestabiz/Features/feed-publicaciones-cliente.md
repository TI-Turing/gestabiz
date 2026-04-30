---
date: 2026-04-30
tags: [feature, marketing, publicaciones, feed, cliente, realtime, fase3]
status: pendiente
---

# Feed de Publicaciones para Clientes — Fase 3

Spec de la siguiente iteración del módulo de marketing: publicaciones que los negocios hacen desde el vault y que los clientes ven en su dashboard.

## Descripción

Los negocios podrán "publicar" assets del vault como publicaciones dirigidas a sus clientes. Los clientes verán un feed de publicaciones de los negocios que frecuentan, similar a un tablón de novedades.

## Tablas propuestas

### `marketing_publications`

```sql
CREATE TABLE marketing_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT,
  asset_path TEXT,          -- ruta en bucket business-marketing-vault
  asset_type TEXT,          -- 'image' | 'video' | 'pdf'
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,   -- null = sin expiración
  audience TEXT DEFAULT 'all_clients',  -- 'all_clients' | 'frequent_clients'
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: negocios escriben, clientes del negocio leen
```

## Componentes propuestos

| Componente | Ubicación | Descripción |
|-----------|-----------|-------------|
| `PublicationsFeed` | `src/components/client/PublicationsFeed.tsx` | Feed de tarjetas en el dashboard del cliente, en la sección "Mis Citas" |
| `PublicationCard` | `src/components/client/PublicationCard.tsx` | Tarjeta individual: thumbnail, título, fecha, CTA de reserva |
| `CreatePublicationModal` | `src/components/admin/marketing/CreatePublicationModal.tsx` | Modal para publicar un asset del vault |

## Hooks propuestos

- `useClientPublications(clientId)` — publicaciones de negocios que el cliente frecuenta (usa `appointments` para filtrar negocios)
- `useBusinessPublications(businessId)` — publicaciones del negocio (vista admin)
- `useCreatePublication(businessId)` — mutación para publicar asset

## Realtime

- Supabase Realtime en tabla `marketing_publications`
- Los clientes reciben nuevas publicaciones en tiempo real mientras tienen el dashboard abierto
- Badge en tab "Mis Citas" si hay publicaciones no vistas

## KPIs y Analíticas

- `view_count`: incrementado por trigger o Edge Function al cargar la publicación
- Futuro: click-through rate hacia el wizard de reservas

## Criterios de audiencia

- `all_clients`: todos los clientes con al menos 1 cita no cancelada en el negocio
- `frequent_clients`: clientes con 3+ citas completadas en los últimos 90 días

## Relacionado

- [[sistema-marketing]] — Vault de assets desde donde se publican los materiales
- [[sistema-crm-clientes]] — Define quién es "cliente frecuente"
- [[Fase 3 - IA, Automatización y Agentes]] — Publicaciones automáticas generadas por IA

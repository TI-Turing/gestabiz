---
date: 2026-04-05
tags: [seo, search-console, pendiente, post-deploy]
---

# SEO Directorio — Pasos post-deploy (producción)

**Fecha de deploy a producción estimada**: 6 de abril de 2026

## Qué se implementó

- Sitemap dinámico en `/api/sitemap.ts` — reemplaza el `public/sitemap.xml` estático
- 72 páginas de directorio SSR (`/directorio/:categoria/:ciudad`) — 9 categorías × 8 ciudades
- Edge function SSR con meta tags + JSON-LD `ItemList` por directorio
- Rutas, rewrites en `vercel.json` y `robots.txt` actualizados

## Pendiente — hacer el día del deploy (6 Abr 2026 o después)

### 1. Google Search Console — Registrar sitemap dinámico
- Ir a [Google Search Console](https://search.google.com/search-console)
- Seleccionar propiedad `gestabiz.com`
- Sitemaps → agregar `https://gestabiz.com/sitemap.xml`
- Verificar que detecte las URLs de directorio y los perfiles de negocio

### 2. Solicitar indexación manual de páginas prioritarias
En Search Console → Inspección de URL → "Solicitar indexación" para:
- `https://gestabiz.com/directorio/barberias/bogota`
- `https://gestabiz.com/directorio/salones/bogota`
- `https://gestabiz.com/directorio/barberias/medellin`
- `https://gestabiz.com/directorio/salones/medellin`

Esto acelera el primer crawl sin esperar el ciclo normal de Google.

### 3. Verificar que el sitemap responde correctamente
```
curl https://gestabiz.com/sitemap.xml | head -30
```
Debe retornar XML con las URLs de directorio y los slugs de negocios públicos.

### 4. Monitorear en Search Console (1-2 semanas después)
- Cobertura → verificar que las páginas de directorio estén "Válidas"
- Rendimiento → observar si aparecen impresiones para queries como "barberías bogotá"

## Notas Relacionadas

- [[sistema-perfiles-publicos]] — Perfiles públicos y SEO
- [[sistema-busqueda]] — RPCs search_businesses, índices trigram
- [[sistema-categorias]] — Categorías y subcategorías para directorio
- [[sectores-y-casos-de-uso]] — Verticales y ciudades
- [[SEO-SEM-estrategia-2026]] — Estrategia SEO complementaria
- [[SEO-SEM-Strategy-Colombia-LATAM]] — Estrategia SEO/SEM exhaustiva
- [[Perfil-Publico-Profesional]] — Perfiles públicos indexables
- [[landing-page-dark-mode-fixed]] — Landing page pública

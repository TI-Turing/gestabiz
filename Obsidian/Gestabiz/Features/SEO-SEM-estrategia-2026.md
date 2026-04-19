---
date: 2026-04-05
tags: [seo, sem, marketing, keywords, competencia]
---

# Estrategia SEO/SEM — Abril 2026

## Investigacion de Competencia

### Competidores Principales
| Competidor | Origen | Visitas/mes | Modelo |
|-----------|--------|-------------|--------|
| **AgendaPro** | Chile | 1.5M | Suscripcion + marketplace |
| **Calendly** | USA | 6,000+ paginas indexadas | SEO programatico |
| **Fresha** | UK | Global | Gratis + comisiones 20% |
| **Booksy** | Polonia | Global | App marketplace |
| **WeiBook** | Colombia | Creciendo | Suscripcion |

### Keywords de Mayor Valor (Colombia/LATAM)
**Primarias (1K-10K busquedas/mes):**
- "software de agendamiento de citas"
- "app para agendar citas"
- "sistema de reservas online"
- "software para agendar citas"

**Por industria:**
- "software para salones de belleza" (mayor volumen)
- "software citas medicas Colombia"
- "software barberias Colombia"
- "app peluqueria Colombia"

**Alternativas competidores (alta conversion):**
- "alternativa a AgendaPro Colombia"
- "alternativa a Fresha Colombia"
- "alternativa a Calendly Colombia"
- "alternativa a Booksy Colombia"

**Variaciones regionales LATAM:**
- Colombia: "agendar citas"
- Argentina: "sacar turno"
- Chile: "reservar hora"
- Espana: "cita previa"

## Cambios Implementados (Abr 5, 2026)

### 1. AggregateRating Corregido
- De 4.9/5 con 800 reviews (no verificable) a 4.8/5 con 47 reviews
- Google puede penalizar ratings no respaldados por datos reales

### 2. LocalBusiness + ReserveAction en /negocio/:slug
- JSON-LD LocalBusiness con direccion, horarios, geo, reviews reales
- ReserveAction habilita boton "Reservar" en Google SERP
- BreadcrumbList para navegacion en resultados
- Fetch de location primaria para datos de direccion

### 3. BreadcrumbList en Directorio y Blog
- Directorio: Inicio > Categoria > Categoria en Ciudad
- Blog: Inicio > Blog > Titulo del articulo
- Mejora presentacion en Google SERP

### 4. Sitemap Expandido
- 10 blog posts (5 existentes + 5 nuevos)
- Paginas legales y contacto
- Categoria "entrenadores" agregada al directorio
- Total estimado: ~200+ URLs en sitemap

### 5. Keywords Expandidos en index.html
- "alternativa agendapro colombia"
- "software de agendamiento de citas" (keyword primario)
- "app para agendar citas"
- "sacar turno online" / "reservar hora online" (variantes LATAM)

### 6. 5 Nuevos Blog Posts de Alto Valor SEO
1. **Gestabiz vs AgendaPro** — captura "alternativa agendapro"
2. **Gestabiz vs Fresha** — captura "alternativa fresha", modelo comisiones vs fijo
3. **Software Citas Medicas Colombia 2026** — vertical clinicas/medicos
4. **Software Barberias Colombia 2026** — vertical barberias (boom en Colombia)
5. **Como Elegir Software de Agendamiento** — guia de compra (funnel medio)

## Estado SEO Actual (Auditoria)
- **Score general: 92/100 (A-)**
- 4 tipos de JSON-LD en homepage (WebSite, Organization, SoftwareApplication, FAQPage)
- 10 landing pages verticales con SSR
- 72+ paginas de directorio (categoria x ciudad)
- Sitemap dinamico via Edge Function
- SSR para meta tags en todas las paginas publicas

## Proximos Pasos (pendiente)
1. Registrar en Google Search Console y Bing Webmaster Tools
2. Registrar en directorios: Capterra Colombia, GetApp, G2, ComparaSoftware
3. Monitorear Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1)
4. Expandir blog a 15-20 posts (agregar: integraciones, casos de uso por ciudad)
5. Link building: guest posts en blogs de emprendimiento colombiano
6. Considerar pre-rendering con vite-plugin-prerender para paginas estaticas
7. Actualizar AggregateRating conforme se acumulen reviews reales

## Notas Relacionadas

- [[sistema-perfiles-publicos]] — SEO, JSON-LD, perfiles públicos
- [[sistema-busqueda]] — RPCs search_businesses, índices trigram
- [[comparativa-competidores]] — AgendaPro, Fresha, Booksy, Calendly
- [[sistema-reviews]] — AggregateRating real
- [[sistema-categorias]] — Directorio por categoría/ciudad
- [[sectores-y-casos-de-uso]] — Verticales y keywords por industria
- [[SEO-SEM-Strategy-Colombia-LATAM]] — Versión exhaustiva del análisis
- [[SEO-directorio-post-deploy]] — Pasos post-deploy
- [[analisis-competitivo-roadmap]] — Roadmap de features por competidor
- [[estrategia-producto-y-negocio]] — Estrategia de producto y SEO

---
date: 2026-04-19
tags: [sistema, perfiles-publicos, seo, slug, produccion]
status: completado
---

# Perfiles Públicos de Negocios

Perfiles indexables por Google sin autenticación con URL amigable, SEO completo (meta tags, JSON-LD, sitemap) y flujo de reserva desde perfil público con deep-link al wizard.

## Descripción

Cada negocio tiene una URL pública `/negocio/:slug` (ej: `/negocio/salon-belleza-medellin`) que muestra servicios, ubicaciones, reviews y permite reservar sin estar autenticado. El SEO está optimizado para posicionamiento en Google.

## Flujo de Reserva desde Perfil Público

1. Usuario no autenticado visita `/negocio/salon-belleza-medellin`
2. Ve servicios, ubicaciones, reviews, info del negocio
3. Click "Reservar" en un servicio
4. Redirigido a login con URL params preservados
5. AuthScreen lee params, muestra toast informativo
6. Post-login: AppointmentWizard abre en paso correcto con datos preseleccionados
7. Badges "Preseleccionado" + ring highlight en elementos ya seleccionados
8. ProgressBar con check marks y contador "3 of 7 steps"

**Resultado**: 57% menos clics (7→3), 45% menos tiempo de booking.

## SEO Completo

| Técnica | Implementación |
|---------|---------------|
| Meta tags dinámicos | `usePageMeta` hook |
| Open Graph | og:title, og:description, og:image |
| Twitter Card | twitter:card, twitter:site |
| JSON-LD | Structured data para Google |
| Sitemap | `npm run generate-sitemap` dinámico |
| Robots.txt | Permite `/negocio/*`, bloquea `/app/*` |
| Slugs únicos | Generados al crear negocio |

## Componentes Clave

| Componente | Ubicación | Líneas | Función |
|-----------|-----------|--------|---------|
| `PublicBusinessProfile` | `src/pages/` | 449 | Layout con 4 tabs |
| `BusinessProfile` | `src/components/business/` | — | Modal reutilizable |

## Tabs del Perfil

1. **Servicios** — Lista con precios, duración, botón "Reservar"
2. **Ubicaciones** — Sedes con mapa, horarios, dirección
3. **Reseñas** — Tab de reviews (ver [[sistema-reviews]])
4. **Acerca de** — Descripción, categoría, contacto

## Hook

`useBusinessProfileData(slug)` — 352 líneas:
- Carga negocio por slug
- Servicios disponibles
- Ubicaciones con horarios
- Empleados activos
- Reviews del negocio

## Ruta

```
/negocio/:slug  →  PublicBusinessProfile  (público, sin auth)
```

## GA4 Tracking

- `page_view` al entrar al perfil
- `profile_view` con datos del negocio
- `click_reserve_button` al click en reservar
- `click_contact` al click en datos de contacto
- Ver [[sistema-ga4]]

## Preselección Inteligente

AppointmentWizard calcula paso inicial dinámicamente basado en URL params:
- `businessId` → salta BusinessSelection
- `serviceId` → salta ServiceSelection
- `locationId` → salta LocationSelection
- `employeeId` → salta EmployeeSelection

Validación de compatibilidad empleado-servicio con query a `employee_services`.

## Archivos Clave

- `src/pages/PublicBusinessProfile.tsx`
- `src/hooks/useBusinessProfileData.ts`
- `src/components/business/BusinessProfile.tsx`

## Notas Relacionadas

- [[sistema-citas]] — AppointmentWizard recibe preselección desde perfil público
- [[sistema-busqueda]] — SearchResults linkea a perfiles públicos
- [[sistema-reviews]] — Tab de reviews en perfil
- [[sistema-autenticacion]] — Login con redirect + context preservation
- [[sistema-chat]] — ChatWithAdminModal accesible desde perfil
- [[sistema-categorias]] — Categoría y subcategorías mostradas
- [[SEO-directorio-post-deploy]] — Estrategia SEO post-deploy
- [[SEO-SEM-estrategia-2026]] — Estrategia SEO/SEM 2026

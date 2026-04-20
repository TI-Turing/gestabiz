---
date: 2026-03-24
tags: [ideas, social-media, mcp, marketing, ia, fase-3]
status: idea-exploratoria
origen: ChatGPT — investigación de viabilidad (Mar 2026)
---

# Ideas Futuras — Social Media MCP y Marketing con IA

> Estas son ideas exploratorias para considerar en Fase 3 o posterior. No están en el roadmap formal todavía.

---

## La Idea Central

Que el admin de un negocio en Gestabiz pueda escribir algo como:

> "Tengo 20% de descuento en cortes de pelo esta semana"

Y Gestabiz:
1. Genere el copy del post
2. Genere la imagen con IA
3. Publique automáticamente en Instagram, Facebook, TikTok, LinkedIn

**Para el negocio sería un diferenciador brutal** — especialmente para PyMEs que no tienen community manager.

---

## Estado del Arte — MCP para Redes Sociales (Mar 2026)

Existen MCP servers para redes sociales, pero en etapa temprana:

| Red Social | MCP disponible | Estado |
|-----------|----------------|--------|
| Instagram | Sí (via Instagram Graph API) | Requiere cuenta Business + FB Developer App |
| Twitter/X | Sí (simple) | Postear tweets, threads, responder |
| Multi-plataforma | Sí (varios) | Crear posts, hashtags, analizar engagement |
| TikTok | Limitado | API muy restrictiva |
| LinkedIn | Parcial | API con permisos limitados |

### Restricciones reales de Instagram (las más relevantes para Gestabiz)

Para publicar via API necesitas:
- Cuenta **Business** o Creator (no personal)
- Facebook Page conectada
- App registrada en **Meta Developer**
- Permisos aprobados por Meta (`instagram_content_publish`)
- Access Token válido (expira, requiere renovación)

---

## Stack Recomendado para Gestabiz

El flujo más viable hoy:

```
Admin Gestabiz escribe brief
        ↓
Claude API genera copy + imagen (DALL-E o Stability AI)
        ↓
Preview para aprobación del admin
        ↓
MCP social media (o Zapier/Make/Buffer API)
        ↓
Publicación en Instagram / Facebook / TikTok
```

### Opción A: MCP directo (más control, más trabajo)
- Implementar MCP server propio que use Instagram Graph API
- Gestabiz conecta la cuenta del negocio via OAuth
- Ventaja: todo dentro de Gestabiz, sin dependencias externas
- Desventaja: cada red social requiere implementación separada + aprobaciones de API

### Opción B: Via herramienta intermedia (más rápido, menos control)
```
Gestabiz → Buffer API / Hootsuite API / Zapier
```
- Ventaja: las herramientas ya manejan OAuth y aprobaciones
- Desventaja: costo adicional para el negocio, tercero en el flujo

### Opción C: MCP server open-source existente
- Buscar en GitHub MCP servers para Instagram ya implementados
- Adaptar y hostear como parte de la infraestructura de Gestabiz

---

## Feature Concept para Gestabiz: "AI Marketing Studio"

**Propuesta de valor**: El negocio no necesita community manager. Gestabiz es su equipo de marketing.

**Flujo del feature:**

1. Admin va a sección "Marketing" en dashboard
2. Escribe brief: `"Promo del día: manicure + pedicure por $80.000"`
3. Gestabiz:
   - Genera 3 variantes de copy (corto, medio, largo)
   - Genera imagen con brand colors del negocio
   - Muestra preview por plataforma (formato cuadrado para IG, vertical para stories, etc.)
4. Admin aprueba o edita
5. Selecciona plataformas destino
6. Publica inmediatamente o programa para hora pico

**Datos del negocio que haría disponibles para el contexto IA:**
- Nombre del negocio + logo + colores de marca
- Categoría de negocio (salón, clínica, gym)
- Servicios y precios
- Historial de posts anteriores (para coherencia de tono)

---

## Monetización

Este feature podría ser exclusivo de Plan Pro/Empresarial:
- Plan Inicio: Sin acceso
- Plan Pro: 30 posts/mes generados por IA
- Plan Empresarial: Ilimitado + programación avanzada

## Notas Relacionadas

- [[planes-y-precios]] — Planes y monetización de features IA
- [[sistema-notificaciones]] — WhatsApp Business API ya integrada
- [[edge-functions]] — Runtime Deno para agentes
- [[propuesta-de-valor]] — Diferenciador “marketing incluido”- [[Fase 3 - IA, Automatización y Agentes]] — Fase 3 incluye marketing IA
- [[analisis-competitivo-roadmap]] — Roadmap de marketing y features
- [[estrategia-producto-y-negocio]] — Marketing integrado en estrategia
---

## Próximos pasos cuando se decida explorar

1. Validar con 5 negocios actuales si pagarían por esto
2. Evaluar costo de generación de imagen por post (DALL-E 3 ≈ $0.04/imagen)
3. Decidir Opción A vs B vs C de implementación
4. Prototipo: integrar Buffer API + Claude API en 2 semanas para MVP

---

## Referencias

- [Instagram Graph API — Content Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Buffer API](https://buffer.com/developers/api)
- Claude API para generación de texto → ya usamos Anthropic
- Ver también: [[Fase 3 - IA, Automatización y Agentes]]

# Gestabiz — Vault de Conocimiento del Proyecto

Este vault es la **capa de memoria legible por humanos** del proyecto Gestabiz.
Se usa junto con el sistema `claude-mem` (MCP) para persistencia cross-sesión de Claude Code.

> **Stack**: React 19 + TypeScript 5.7 + Vite 6 + Supabase + Tailwind 4
> **Estado**: BETA completada — solo bugs, optimizaciones y features puntuales

---

## Sistemas (22 notas)

Documentación técnica de cada módulo funcional del producto.

| Nota | Descripción |
|------|-------------|
| [[sistema-citas]] | Wizard multi-paso, DateTimeSelection, overlap, CREATE/UPDATE |
| [[sistema-permisos]] | PermissionGate, 79 permisos, 9 templates, RPC service |
| [[sistema-ausencias]] | Ausencias, vacaciones, aprobación obligatoria, balance |
| [[sistema-notificaciones]] | Email/SMS/WhatsApp, in-app, recordatorios cron |
| [[sistema-chat]] | Chat en tiempo real, Realtime, FloatingChatButton |
| [[sistema-busqueda]] | Full-text search, RPCs, trigram, vistas materializadas |
| [[sistema-billing]] | Stripe/PayU/MercadoPago, planes, suscripciones |
| [[sistema-contable]] | IVA/ICA/Retención, transacciones, exports PDF/CSV |
| [[sistema-vacantes]] | Reclutamiento, matching, reviews obligatorias |
| [[sistema-reviews]] | Reviews anónimas, ratings, MandatoryReviewModal |
| [[sistema-modelo-flexible]] | Recursos físicos (hoteles, restaurantes, canchas) |
| [[sistema-ventas-rapidas]] | Ventas walk-in, estadísticas, integración contable |
| [[sistema-crm-clientes]] | CRM admin, historial, ClientProfileModal |
| [[sistema-perfiles-publicos]] | SEO, /negocio/:slug, JSON-LD, perfiles indexables |
| [[sistema-autenticacion]] | AuthContext singleton, roles dinámicos, multi-negocio |
| [[sistema-configuraciones]] | CompleteUnifiedSettings (admin/employee/client) |
| [[sistema-sede-preferida]] | Sede por defecto en localStorage, pre-selección |
| [[sistema-categorias]] | 15 categorías + ~60 subcategorías jerárquicas |
| [[sistema-festivos]] | public_holidays, 54 festivos colombianos 2025-2027 |
| [[sistema-referrals]] | Programa de referidos: cupones, comisiones MP, kill-switch |
| [[sistema-google-calendar]] | OAuth Google, sync bidireccional, calendar_sync_settings |
| [[sistema-mobile-hybrid]] | Expo + WebView, auth bridging, EAS Build (.aab/.apk/.ipa) |

---

## Arquitectura (9 notas)

Decisiones técnicas transversales y patrones del codebase.

| Nota | Descripción |
|------|-------------|
| [[stack-tecnologico]] | React 19, Vite 6, TypeScript 5.7, Supabase, Tailwind 4 |
| [[base-de-datos]] | 70+ tablas, 108 triggers, RLS, vistas materializadas, system_config |
| [[supabase-local-workflow]] | Stack local Docker, scripts auxiliares, headers de seguridad |
| [[edge-functions]] | ~50 Edge Functions Deno, selective deploy, JWT/HMAC/CORS |
| [[cicd-pipeline]] | GitHub Actions: ci.yml, deploy-dev.yml, deploy-prod.yml |
| [[catalog-api-azure]] | API .NET de catálogos (países/regiones/ciudades/EPS) |
| [[react-query-cache]] | STABLE/FREQUENT/REALTIME, query keys, deduplication |
| [[sistema-cards]] | Cards self-fetch por ID, patrón reutilizable |
| [[i18n]] | ~2,200 claves ES/EN, ~44 archivos por idioma |

---

## Negocio (8 notas)

Estrategia comercial, pricing, go-to-market y posicionamiento.

| Nota | Descripción |
|------|-------------|
| [[go-to-market-2026]] | Estrategia de ventas agresiva: puerta-puerta, redes, vendedores, ads, referrals, SEO/SEM |
| [[diferenciacion-pricing]] | Tesis de pricing: 90k COP vs. Calendly/Booksy/Fresha, ROI para cliente, elasticidad |
| [[planes-y-precios]] | Gratuito → Inicio (90k) → Profesional (180k) → Empresarial |
| [[propuesta-de-valor]] | Todo-en-uno para PyMEs de servicios en Colombia |
| [[comparativa-competidores]] | vs AgendaPro, Fresha, Booksy, Calendly, WeiBook |
| [[sectores-y-casos-de-uso]] | Salones, clínicas, gimnasios, hoteles, coworkings |
| [[pricing-fase2]] | Fase 2: planes por sede/empleado, cobros incrementales, sin comisión por cita |
| [[competencia-luna-barberia]] | Luna chatbot WhatsApp: amenaza táctica en microbarberías, oportunidad de funnel |

---

## Features (11 notas)

Specs de features en desarrollo, pendientes o ideas futuras.

- [[Fase 2 - Contabilidad, DIAN y App Móvil]] — Módulo contable completo, facturación electrónica DIAN, app móvil
- [[Fase 3 - IA, Automatización y Agentes]] — Agentes LLM, procesos automáticos, AI marketing assistant
- [[Ideas Futuras - Social Media MCP y Marketing IA]] — MCP para redes sociales, publicación automática con IA
- [[QR-con-branding-Gestabiz]] — QR con icono de Gestabiz centrado + logo y texto "Reserva tu próxima cita aquí"
- [[analisis-competitivo-roadmap]] — Roadmap competitivo y análisis de mercado
- [[Perfil-Publico-Profesional]] — Perfil público de profesionales independientes
- [[free-trial-mes-gratis]] — Estrategia de free trial (mes gratis)
- [[SEO-directorio-post-deploy]] — SEO de directorio post-deploy
- [[SEO-SEM-estrategia-2026]] — Estrategia SEO/SEM 2026 (resumen ejecutivo)
- [[SEO-SEM-Strategy-Colombia-LATAM]] — SEO/SEM completo: keywords, competidores, technical SEO, content strategy
- [[facturacion-electronica-matias-api]] — Integración facturación electrónica vía Matias API

---

## Contexto (2 notas)

Contexto del negocio, auditorías y estrategia general.

- [[auditoria-completa-abril-2026]] — Auditoría completa del proyecto (abril 2026)
- [[estrategia-producto-y-negocio]] — Estrategia de producto y modelo de negocio

---

## Decisiones (2 notas)

Decisiones arquitectónicas y trade-offs importantes.

- [[google-oauth-separacion-entornos]] — Dos clientes Google OAuth separados (DEV y PROD)
- [[decision-antifraude-referrals]] — Por qué no se necesitan reglas anti-fraude complejas en el programa de referrals

---

## Bugs (3 notas)

Bugs conocidos, gotchas y soluciones documentadas.

- [[bug-session-disconnection-on-tab-switch]] — Desconexión de sesión al cambiar de tab
- [[landing-page-dark-mode-fixed]] — Fix de dark mode en landing page
- [[secretos-en-scripts-gitguardian]] — Secretos en historial de git (rotar PROD service role key)

---

## Sesiones Claude (3 notas)

Resúmenes de sesiones de trabajo importantes.

- [[2026-03-31-infra-oauth-ci]] — Fix widget estado, secretos GitGuardian, CI, Google OAuth DEV/PROD
- [[2026-04-13-primer-dia-ventas]] — Primer día de ventas, pricing, onboarding
- [[2026-04-17-exploracion-area-publica-y-cliente]] — Exploración del área pública y flujos de cliente

---

## Cómo usar con Claude Code

Cuando le dices a Claude **"recuerda X"** o **"guarda una nota de X"**, Claude debe:
1. Crear una nota `.md` en la carpeta apropiada de este vault
2. Guardar también en el sistema `claude-mem` (auto-memory) para recuperación cross-sesión

## Sistema de Memoria en Capas

```
Claude Code Auto-Memory  →  ~/.claude/projects/.../memory/   (recuperación automática)
claude-mem MCP           →  Índice semántico cross-sesión     (make-plan, mem-search)
Este Vault (Obsidian)    →  Legible por humanos, notas libres (tú lo lees directamente)
```

- **React 19** + TypeScript 5.7 + Vite 6
- **Supabase** (DEV: `dkancockzvcqorqbwtyh` / PROD: `emknatoknbomvmyumqju`)
- **Tailwind 4** + Radix UI + Phosphor Icons
- **Deploy**: Vercel

# Gestabiz — Vault de Conocimiento del Proyecto

Este vault es la **capa de memoria legible por humanos** del proyecto Gestabiz.
Se usa junto con el sistema `claude-mem` (MCP) para persistencia cross-sesión de Claude Code.

## Carpetas

| Carpeta | Qué guardar aquí |
|---------|-----------------|
| `Decisiones/` | Decisiones arquitectónicas, elecciones de diseño, trade-offs importantes |
| `Bugs/` | Bugs conocidos, gotchas, problemas recurrentes y sus soluciones |
| `Sesiones Claude/` | Resúmenes de sesiones de trabajo importantes con Claude Code |
| `Features/` | Especificaciones y notas de features en desarrollo o pendientes |
| `Contexto/` | Notas de contexto del negocio, usuarios, roadmap |

## Notas de Features

- [[Fase 2 - Contabilidad, DIAN y App Móvil]] — Módulo contable completo, facturación electrónica DIAN, app móvil
- [[Fase 3 - IA, Automatización y Agentes]] — Agentes LLM, procesos automáticos, AI marketing assistant
- [[Ideas Futuras - Social Media MCP y Marketing IA]] — MCP para redes sociales, publicación automática con IA
- [[QR-con-branding-Gestabiz]] — QR con icono de Gestabiz centrado + logo y texto "Reserva tu próxima cita aquí"

## Sesiones Claude

- [[2026-03-31-infra-oauth-ci]] — Fix widget estado, secretos GitGuardian, CI, Google OAuth DEV/PROD, Vercel env vars

## Decisiones Arquitectónicas

- [[google-oauth-separacion-entornos]] — Dos clientes Google OAuth separados para DEV y PROD

## Bugs Conocidos

- [[secretos-en-scripts-gitguardian]] — Secretos en historial de git (acción pendiente: rotar PROD service role key)

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

## Stack del Proyecto

- **React 19** + TypeScript 5.7 + Vite 6
- **Supabase** (DEV: `dkancockzvcqorqbwtyh` / PROD: `emknatoknbomvmyumqju`)
- **Tailwind 4** + Radix UI + Phosphor Icons
- **Deploy**: Vercel

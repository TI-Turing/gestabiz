---
date: 2026-04-19
tags: [arquitectura, stack, react, typescript, vite, supabase, tailwind]
status: activo
---

# Stack Tecnológico

React 19 + TypeScript 5.7 + Vite 6 + Supabase + Tailwind 4. Monorepo con 3 superficies: web, móvil y extensión de navegador.

## Frontend Web

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 19 | UI framework |
| TypeScript | 5.7 | Tipado estricto (cero `any`) |
| Vite | 6 | Bundler + dev server |
| Tailwind CSS | 4 | Estilos (variables CSS semánticas) |
| React Router | v6 | Enrutamiento (rutas públicas + privadas) |
| React Query (TanStack) | v5 | Cache de datos + mutations |
| Radix UI | — | Componentes accesibles base |
| Recharts | — | Charts financieros (ver [[sistema-contable]]) |
| Framer Motion | — | Animaciones y transiciones |
| Phosphor Icons | — | Iconos principales (NUNCA emojis) |
| Lucide React | — | Iconos secundarios |
| Sonner | — | Toast notifications |
| Zod | — | Validación de schemas |

## Backend

| Tecnología | Uso |
|-----------|-----|
| Supabase | BaaS completo (PostgreSQL 15+, Auth, Storage, Realtime, Edge Functions) |
| PostgreSQL | 15+ con extensiones: `uuid-ossp`, `pg_trgm`, `postgis` |
| Deno | Runtime de Edge Functions |
| RLS | Row Level Security en TODAS las tablas |

## Móvil

| Tecnología | Uso |
|-----------|-----|
| Expo / React Native | App móvil en `src/mobile/` |
| React Navigation | Navigator con 59 registros |

## Extensión de Navegador

- `extension/` — Extensión Chrome básica
- `src/browser-extension/` — Extensión mejorada

## Path Aliases

`@` → `src/` en imports (ej: `@/lib/supabase`, `@/hooks/useAuth`)

## Providers Stack (orden en App.tsx)

```
ErrorBoundary
  → BrowserRouter
    → QueryClientProvider
      → ThemeProvider
        → LanguageProvider
          → AppStateProvider
            → AuthProvider
              → AlertProvider
                → AppRoutes + CookieConsent + Toaster
```

## Variables de Entorno

- Web: `.env.development` (DEV), `.env.production` (PROD) — gitignoreados
- Móvil: `src/mobile/.env` — formato `EXPO_PUBLIC_*`
- Edge Functions: Supabase Secrets
- **NUNCA** exponer `SUPABASE_SERVICE_ROLE_KEY` con prefijo `VITE_`

## Configs de Vite

| Config | Uso |
|--------|-----|
| `vite.config.ts` | Default |
| `vite.config.owner.ts` | Modo owner |
| `vite.config.users.ts` | Modo users |

## Comandos Principales

```bash
npm run dev              # Dev server
npm run build            # Build producción
npm run type-check       # TypeScript check
npm run lint             # ESLint
npm run test             # Vitest
npm run analyze          # Bundle analyzer
npm run generate-sitemap # Sitemap SEO
```

## Deploy

- **Web**: Vercel (`vercel.json`)
- **Supabase**: Cloud (DEV: `dkancockzvcqorqbwtyh`, PROD: `emknatoknbomvmyumqju`)
- **Edge Functions**: CI/CD (push a dev → deploy DEV, push a main → deploy PROD)

## Código Base

~151k líneas TypeScript, 1,060 archivos `.ts`/`.tsx`

## Archivos Clave

- `package.json` — Versión 1.0.3
- `vite.config.ts`
- `tsconfig.json`
- `tailwind.config.js`
- `vercel.json`

## Notas Relacionadas

- [[base-de-datos]] — Infraestructura Supabase
- [[edge-functions]] — Edge Functions Deno
- [[react-query-cache]] — Configuración de cache
- [[i18n]] — Sistema de internacionalización
- [[sistema-autenticacion]] — Auth con Supabase GoTrueClient
- [[sistema-billing]] — Payment gateways

---
date: 2026-04-19
tags: [sistema, autenticacion, roles, auth, critico, produccion]
status: completado
---

# Sistema de Autenticación y Roles

AuthContext singleton con cálculo dinámico de roles (Admin/Employee/Client), multi-negocio simultáneo y bypass de owner para permisos.

## Descripción

La autenticación usa Supabase GoTrueClient con un ÚNICO cliente singleton en `src/lib/supabase.ts`. Los roles se calculan dinámicamente consultando `businesses.owner_id`, `business_roles` y `business_employees` — NUNCA se persisten en BD.

## Arquitectura — CRÍTICO

```
AuthContext.tsx → llama useAuthSimple() UNA SOLA VEZ
  ↓
AuthProvider envuelve toda la app en App.tsx
  ↓
Componentes usan useAuth() del context
```

> **NUNCA** usar `useAuthSimple()` directamente en componentes.
> **SIEMPRE** usar `useAuth()` del context.
> Si ves "Multiple GoTrueClient instances detected" → algo está usando useAuthSimple() o creando clientes nuevos.

## Jerarquía de Roles

| Rol | Cómo se detecta | Bypass permisos |
|-----|-----------------|-----------------|
| **OWNER** | `businesses.owner_id === auth.uid()` | ✅ Bypass TOTAL (0 queries extra) |
| **ADMIN** | `business_roles.role = 'admin'` | ❌ Verificación normal |
| **EMPLOYEE** | Existe en `business_employees` | ❌ Verificación normal |
| **CLIENT** | Default (cualquier usuario) | ❌ Verificación normal |

## Triggers de Sincronización

- `trg_auto_insert_admin_as_employee` — Admin → automáticamente insertado en `business_employees` como `manager`
- `sync_business_roles_from_business_employees` — Mantiene sincronía `business_roles` ↔ `business_employees`
- `auto_insert_owner_to_business_employees` — Owner → insertado como `manager` al crear negocio

> **NUNCA** crear admins manualmente en `business_employees` — los triggers lo hacen automáticamente.

## Multi-Negocio

Un usuario puede tener roles diferentes en cada negocio:
- Admin de Salón A
- Employee de Clínica B
- Client en cualquier negocio

## Hook de Roles

`useUserRoles(user)` → `{ roles, activeRole, activeBusiness, switchRole }`

Solo el **rol activo** se guarda en localStorage. Los roles disponibles se recalculan cada vez.

## Métodos de Login

- Email + password
- Google OAuth (ver [[google-oauth-separacion-entornos]])
- GitHub OAuth
- Magic Link (email sin password)

## Provee (via useAuth)

- `user` — Usuario autenticado
- `session` — Sesión Supabase
- `loading` — Estado de carga
- `signOut()`, `loginWithPassword()`, `signUpWithPassword()`
- `signInWithGoogle()`, `signInWithGitHub()`, `sendMagicLink()`
- `switchBusiness(businessId)` — Cambiar negocio activo

## Stack de Providers (orden en App.tsx)

```
ErrorBoundary → BrowserRouter → QueryClientProvider → ThemeProvider →
LanguageProvider → AppStateProvider → AuthProvider → AlertProvider →
  AppRoutes + CookieConsent + Toaster
```

## GOTCHAS

- `business_employees` usa `employee_id` NO `user_id` — siempre `employee_id = auth.uid()`
- Demo mode: cliente simulado si `VITE_DEMO_MODE=true`
- Google OAuth: dos clientes separados (DEV vs PROD) — ver [[google-oauth-separacion-entornos]]
- **NUNCA** exponer `SUPABASE_SERVICE_ROLE_KEY` con prefijo `VITE_`

## Archivos Clave

- `src/lib/supabase.ts` — Cliente singleton (ÚNICO createClient)
- `src/contexts/AuthContext.tsx` — Context + Provider
- `src/hooks/useAuth.ts` — Hook consumidor
- `src/hooks/useAuthSimple.ts` — Implementación interna (NO usar directamente)
- `src/hooks/useUserRoles.ts` — Cálculo dinámico de roles

## Notas Relacionadas

- [[sistema-permisos]] — PermissionGate verifica permisos después de auth
- [[google-oauth-separacion-entornos]] — Configuración OAuth DEV vs PROD
- [[secretos-en-scripts-gitguardian]] — Seguridad de secrets
- [[sistema-perfiles-publicos]] — Login con redirect desde perfil público
- [[stack-tecnologico]] — Supabase GoTrueClient como base
- [[base-de-datos]] — Tablas de auth y roles

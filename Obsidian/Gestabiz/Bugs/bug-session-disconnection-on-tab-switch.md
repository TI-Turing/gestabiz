---
date: 2026-04-18
tags: [bug, auth, supabase, critical]
---

# Bug: App se pega al cambiar de pestaña o minimizar ventana

## Síntomas
- Cambiar de pestaña / minimizar ventana
- Volver a la app → UI "pegada"
- Imagen de perfil desaparece
- Botones no responden
- F5 (refresh) lo arregla

## Causa raíz
**No hay revalidación de sesión cuando la pestaña vuelve al foco.**

Cuando minimizas o cambias de pestaña:
1. El navegador suspende JavaScript
2. Supabase realtime se desconecta silenciosamente (sin error)
3. La sesión puede expirar en background
4. Cuando vuelves a la pestaña, `onAuthStateChange` NO se reactiva automáticamente
5. El hook `useAuthSimple` sigue devolviendo datos stale/vacíos

**No hay errores en console** porque Supabase no lanza exception — simplemente se desconecta.

## Ubicación
`src/hooks/useAuthSimple.ts` — línea 187 (listener de auth)

## Solución
Agregar listener de `visibilitychange` que:
1. Valide la sesión actual cuando la pestaña vuelve al foco (`document.visibilityState === 'visible'`)
2. Llame a `supabase.auth.getSession()` para revalidar
3. Si la sesión expiró, dispare logout automático
4. Si sigue válida, haga un refetch de datos críticos (profile, etc.)

## Implementación propuesta
```typescript
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && state.session) {
      // Revalidar sesión cuando vuelve al foco
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Sesión expiró
        setState(prev => ({ ...prev, user: null, session: null }))
      }
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [state.session])
```

## Impacto
- Crítico: afecta experiencia de usuario en móvil y desktop
- Visible en flujos normales (cambiar a WhatsApp, email, etc.)
- Workaround actual: F5

## Notas Relacionadas

- [[sistema-autenticacion]] — Sistema de auth (useAuthSimple, AuthContext)
- [[stack-tecnologico]] — Stack y providers de la app
- [[google-oauth-separacion-entornos]] — Separación auth por entorno
- [[2026-03-31-infra-oauth-ci]] — Sesión que trabajó infraestructura auth
- [[auditoria-completa-abril-2026]] — Auditoría menciona React Query cache en logout

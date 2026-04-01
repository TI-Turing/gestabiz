---
mode: agent
description: Scaffoldea una Edge Function Deno para Gestabiz con CORS, autenticación JWT, manejo de errores y estructura correcta.
tools:
  - read_file
  - file_search
  - create_file
  - list_dir
---

Scaffoldea una Edge Function Deno para Gestabiz.

## Antes de escribir

Leer 2 funciones existentes en `supabase/functions/` como referencia de estilo (ej: `send-notification/index.ts`, `send-message/index.ts`).

## La función debe incluir

1. **CORS:** headers correctos para OPTIONS preflight (copiar patrón de funciones existentes)
2. **Auth:** validar JWT del usuario con `supabase.auth.getUser(token)` si la función lo requiere
3. **Cliente admin:** usar `SUPABASE_SERVICE_ROLE_KEY` solo si necesita bypass de RLS — nunca exponerlo al cliente
4. **Response:** siempre retornar `new Response(JSON.stringify(...), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })`
5. **Error handling:** try/catch con respuesta de error estructurada `{ error: message }` y status codes apropiados (400, 401, 403, 500)
6. **Imports:** Deno URL imports o import maps — nunca `require()`
7. **Secrets:** acceder vía `Deno.env.get('SECRET_NAME')` — documentar qué secrets requiere

## Estructura del archivo `index.ts`

```ts
// Imports
// CORS headers
// Handler principal con try/catch
// Deno.serve(handler)
```

## Entrega

- Archivo `index.ts` completo en `supabase/functions/<nombre>/index.ts`
- Comando de deploy: `npx supabase functions deploy <nombre>`
- Lista de Supabase Secrets requeridos (si aplica)
- Explicación de efectos secundarios (triggers, notificaciones, tablas modificadas)

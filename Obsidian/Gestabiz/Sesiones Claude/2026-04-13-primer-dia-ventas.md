---
date: 2026-04-13
tags: [ventas, go-to-market, chapinero, fase-1, pricing, releases]
---

# Primer día de ventas — 13 Abril 2026

## Decisiones tomadas hoy

### Plan de releases
- Bugs toda la semana (lunes-jueves)
- PR a main cada **jueves 10pm**
- Viernes: pruebas en producción / hotfixes si hay regresión
- Fines de semana: descanso
- Rama `fase-2` para todo lo nuevo

### Primer salida a vender
- Destino: negocios en **Chapinero**, Bogotá
- Estrategia: no vender, preguntar primero — "¿cómo manejan sus reservas?"
- Llevar cuenta demo con datos reales (no mostrar dashboard vacío)
- Ayudar a configurar el negocio en el momento si hay interés

### Modelo de vendedor externo (a implementar en ~2 semanas)
- Contrato por prestación de servicios via TI Turing
- **$30K COP el día que consigue el negocio nuevo** + **$30K COP cuando ese negocio paga** (aprox. 1 mes después del periodo gratis)
- Total: $60K COP por cliente cerrado (se evaluará subir a $40K + $40K)
- Importante: definir por escrito desde el día 1 los casos edge (cancelaciones anticipadas, pipeline duplicado)

### Ajustes críticos para el PR del jueves (v1.0.1)
1. `queryClient.clear()` en logout — riesgo real en dispositivos compartidos
2. Rotar Service Role Key de PROD en Supabase dashboard (5 min)
3. Checklist de configuración visible en el overview (onboarding)
4. Limpiar console.logs del build

Los demás issues (tests, RLS cron_execution_logs, webhooks idempotencia) son para sprints siguientes.

## Preguntas respondidas hoy

**WAB**: Weekly Active Businesses — negocios que usan la app al menos 1 vez por semana. Métrica de retención.

**¿El precio está bien?** $89,900 COP/mes (~$22 USD) es competitivo. Argumento: 1 no-show evitado = plan pagado. A futuro subir cuando haya volumen.

**¿La app puede vencer a la competencia?** Sí, tiene más funcionalidades que la mayoría de competidores en Colombia. El factor decisivo no es el código sino: ¿se consiguen 10 negocios en 30 días? ¿Vuelven la semana siguiente? ¿Hay referidos orgánicos?

## Señales a vigilar esta semana
- ¿Cuántos negocios visitados hoy?
- ¿Cuántos mostraron interés?
- ¿Cuántos se registraron?
- ¿Qué objeciones aparecieron más?
- ¿Qué feature pidieron que no existe?

---
date: 2026-04-19
tags: [decision, referrals, antifraude, negocio, producto]
---

# Decisión: Anti-fraude en Referrals — Por Qué No Se Necesitan Reglas Complejas

## Contexto

Al diseñar el programa de referrals se evaluó qué tan vulnerable era el sistema a fraude (un usuario generando cupones para negocios ficticios o haciéndose referir a sí mismo). La conclusión fue que **las reglas inherentes al modelo económico hacen que el fraude no sea rentable**, sin necesidad de validaciones complejas de identidad o KYC.

## Argumento Central (palabras del fundador)

> "Para que un dueño de negocio crearía un negocio con NIT falso y luego lo eliminaría o desactivaría para crear el mismo negocio de nuevo con otro NIT inventado? No tiene sentido. Ya hay un plan gratis que ofrece 50 citas gratis sin pagar nada. La idea del plan básico es guardar la data de los clientes, ver reportes y gestionar empleados. Si hace fraude tendría que hacer eso cada mes. No lo veo rentable."

## Por Qué el Fraude No Es Rentable

### Para el referrer intentando auto-referirse

- El sistema bloquea `creator_user_id = businesses.owner_id` en el RPC `apply_referral_code`
- Necesitaría crear una **segunda cuenta de usuario** para esquivarlo
- Aun así solo obtendría $60.000 por negocio → tendría que registrar un negocio real, pagar $74.900, para recibir $60.000 → **pierde $14.900 netos**
- Si intenta con un cómplice (amigo o familiar): el riesgo legal/social de una comisión de $60.000 no justifica la complejidad

### Para el dueño de negocio intentando reusar el descuento

- Solo aplica si **nunca ha pagado un plan antes** (`NOT EXISTS business_plans WHERE status IN ('active','canceled','past_due')`)
- Ya existe el **Plan Gratuito con 50 citas** — si lo único que quiere es hacer citas, no necesita pagar $74.900
- Para "resetear" su historial tendría que: crear negocio nuevo con datos falsos → registrar empleados → migrar clientes manualmente → hacer eso **cada mes** → ahorro de $15.000/mes por un trabajo de horas → no rentable
- El negocio que activa el plan quiere acceder a: datos de clientes, reportes, gestión de empleados — funcionalidades que requieren datos reales

### Para cualquier tipo de fraude organizado

- El programa **es temporal** — se desactiva al alcanzar ~200-300 clientes (ajustable según el ritmo de crecimiento)
- La ventana de oportunidad es corta y el ROI del fraude es mínimo

## Reglas Implementadas (Suficientes)

Las siguientes reglas cubren los casos relevantes sin over-engineering:

1. **No auto-referral**: `creator_user_id != businesses.owner_id`
2. **Solo primera vez**: `NOT EXISTS business_plans WHERE status IN ('active','canceled','past_due')`
3. **Un cupón por par**: `UNIQUE (creator_user_id, used_by_business_id)`
4. **Cupón caduca a 90 días**: `expires_at = created_at + INTERVAL '90 days'`
5. **Pago real requerido**: la transferencia solo ocurre cuando MercadoPago confirma el pago (`payment.status = 'approved'`)
6. **Kill-switch**: `system_config.referral_program_enabled` desactiva todo el programa

## Qué Se Descartó Intencionalmente

- ❌ Verificación de NIT real vs. datos fiscales
- ❌ Blacklist de dominios de email
- ❌ Límite de cupones por IP/dispositivo
- ❌ KYC del referrer
- ❌ Revisión manual de cada payout

Estas medidas agregarían fricción real a usuarios legítimos con ganancia mínima en seguridad dado el valor bajo del fraude potencial.

## Monitoreo Post-lanzamiento

Si se detectan patrones sospechosos (muchos payouts desde el mismo referrer en poco tiempo), el kill-switch permite desactivar el programa inmediatamente sin afectar cupones ya canjeados ni pagos pendientes.

## Relacionado

- [[sistema-referrals]] — implementación completa del programa
- [[planes-y-precios]] — Plan Gratuito 50 citas, Plan Básico $89.900
- [[sistema-billing]] — MercadoPago Money Transfer API

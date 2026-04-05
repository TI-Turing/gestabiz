# Fix Permanente: JWT Webhook y Actualización de Planes

## Problema 1: JWT se reactiva en cada redeploy

Supabase reactiva automáticamente la verificación JWT después de cada `functions deploy`. Solución:

### Opción A: Automática (Recomendado)

```bash
# Después de desplegar, ejecuta:
SUPABASE_ACCESS_TOKEN=sbp_xxxxx node supabase/migrations/disable-jwt-webhook.js
```

### Opción B: Manual (Dashboard Supabase)

1. Ve a: https://supabase.com/dashboard/project/dkancockzvcqorqbwtyh/functions
2. Haz clic en `mercadopago-webhook`
3. Settings → "Verify JWT" toggle → **OFF**

### Opción C: Línea de comandos

```bash
# NO EXISTE FLAG EN SUPABASE CLI
# Usa la Opción B o crea un alias en package.json post-deploy
```

---

## Problema 2: Plan no se actualiza a "basico" después del pago

### Debug: Verificar qué envía MercadoPago

El webhook debería actualizar `business_plans` automáticamente. Prueba estos pasos:

1. **Ver logs del webhook**:
   - Dashboard Supabase → Edge Functions → mercadopago-webhook → Logs
   - Busca línea: `[mercadopago-webhook] Updating plan:`

2. **Verificar tabla `business_plans`**:
   ```sql
   SELECT * FROM business_plans WHERE business_id = 'tu-business-id' LIMIT 1;
   ```

3. **Si NO aparece en logs**:
   - El payment NO tiene `metadata.business_id`
   - Solución: Verificar que la app envíe correctamente los valores en el Checkout

### Verificar que MercadoPago reciba metadata:

En tu checkout, asegurate que envíes:
```typescript
// Cuando creas el preference/checkout:
const preference = {
  //...
  metadata: {
    business_id: currentBusiness.id,       // OBLIGATORIO
    plan_type: 'basico',                    // OBLIGATORIO
    billing_cycle: 'monthly',               // OBLIGATORIO
  },
}
```

---

## Solución Inmediata: Actualizar Plan Manualmente

Si el pago se procesó pero el plan no se actualizó:

```sql
-- Dev project
UPDATE business_plans 
SET 
  plan_type = 'basico',
  status = 'active',
  billing_cycle = 'monthly',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month'
WHERE business_id = 'tu-business-id';
```

---

## Próximos Pasos

1. ✅ Deploy webhook v65 (148 líneas, sin Sentry, procesa payment + merchant_order)
2. ⏳ Genera Personal Access Token: https://app.supabase.com/account/tokens
3. ⏳ Ejecuta script post-deploy para desactivar JWT automáticamente
4. ⏳ Prueba pago real desde sandbox
5. ⏳ Verifica logs en Edge Functions
6. ✅ Usa SQL manual si no aparece en `business_plans`


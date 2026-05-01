---
date: 2026-04-30
tags: [pricing, billing, fase2, negocio, pay-as-you-go, whatsapp, modulos]
---

# Modelo de Cobro Pay-As-You-Go — Fase 2

## Contexto

Actualmente Gestabiz opera con suscripciones mensuales en niveles fijos:
- **Gratuito** — funciones básicas, 50 citas/mes
- **Inicio** — $90.000 COP/mes, acceso amplio
- **Profesional / Empresarial** — próximos (no lanzados aún)

El problema identificado: **la mayoría de los negocios no usan ni el 30% de las funcionalidades incluidas en el plan pago**, lo que genera dos fricciones:
1. La objeción de ventas "pago por cosas que no uso" es difícil de rebatir.
2. El salto de $0 → $90k/mes es una barrera de entrada alta para negocios pequeños.

**Decisión pendiente para Fase 2**: migrar a un modelo modular donde el cliente paga solo los módulos que activa.

---

## Modelo Propuesto

### Capa Base — Gratuita (siempre)

Igual al plan Gratuito actual:
- Hasta 50 citas/mes
- Recordatorios por email
- Perfil público (`/negocio/:slug`)
- Gestión básica de servicios, empleados y sedes
- Chat interno con clientes (canal básico)

### Add-ons Modulares (suscripción mensual, activa/desactiva cuando quieras)

| Módulo | Precio referencia | Descripción |
|--------|-------------------|-------------|
| **Citas ilimitadas** | ~$30.000 COP/mes | Elimina el límite de 50 citas/mes |
| **Contabilidad** | ~$15.000 COP/mes | Transacciones, IVA/ICA/Retención, exports PDF/CSV |
| **Reclutamiento** | ~$12.000 COP/mes | Vacantes, matching empleado-vacante, reviews |
| **WhatsApp Business** | Packs de consumo | Ver sección dedicada abajo |
| **Facturación Electrónica DIAN** | ~$20.000 COP/mes | Integración Matias API (Fase 2, pendiente) |

> ⚠️ Los precios son **referencia de trabajo**, no definitivos. Validar con CAC, churn y elasticidad antes de lanzar.

### WhatsApp — Modelo de Packs de Consumo

WhatsApp es el canal más caro porque se adapta a las tarifas de Meta/Twilio. **No tiene sentido un mínimo mensual fijo** (un negocio con 80 citas/mes no necesita 500 mensajes). Modelo recomendado: packs prepago.

| Pack | Mensajes | Precio referencia | COP/msg |
|------|----------|-------------------|---------|
| Starter | 100 msgs | ~$15.000 COP | $150 |
| Básico | 500 msgs | ~$60.000 COP | $120 |
| Estándar | 1.000 msgs | ~$100.000 COP | $100 |
| Pro | 5.000 msgs | ~$400.000 COP | $80 |

Los packs no expiran (o tienen vigencia de 3 meses). El negocio recarga cuando se le acaban.

**Análisis de margen**: Meta cobra ~$0.006 USD/conversación de utilidad (~24 COP). A $120 COP/msg el margen bruto es ~5x. Twilio agrega un fee, pero el margen sigue siendo sólido.

---

## Pros

### 1. Barrera de entrada más baja
El primer pago ya no es $90k todo-o-nada. Un negocio puede activar solo contabilidad por $15k y crecer desde ahí.

### 2. El cliente paga lo que usa
Un salón de belleza no necesita reclutamiento. Un gimnasio puede no necesitar contabilidad aún. Elimina la principal objeción de ventas.

### 3. WhatsApp como upsell natural
El canal WhatsApp se activa cuando el negocio ya tiene el volumen para justificarlo. El costo real y variable se traslada al cliente de forma transparente.

### 4. Menor churn por insatisfacción
Los negocios que pagaban $90k sin usar todo lo cancelaban. Con módulos, pagan solo lo que activan → menos sensación de desperdicio.

### 5. Ticket puede crecer orgánicamente
Un cliente que activa 3 módulos paga más que el plan Inicio actual. El ARPU puede subir sin necesidad de "vender" un upgrade de plan.

### 6. Mejor narrativa de ventas
"Activa solo lo que necesitas, desactiva cuando quieras" es más fácil de vender que "aquí tienes todo por $90k".

---

## Contras y Riesgos

### 1. ARPU puede caer si los módulos son baratos
Si el módulo promedio es $12k y los negocios solo activan uno, el ingreso por cliente baja de $90k a $12k. Necesita diseño cuidadoso de los "pisos mínimos".

**Mitigación**: un bundle base de $25-30k que incluya citas ilimitadas + 1 módulo elegido puede actuar como piso.

### 2. Previsibilidad de ingresos se complica
El MRR se vuelve más difícil de proyectar. Los packs de WhatsApp son especialmente volátiles.

**Mitigación**: los módulos mensuales (contabilidad, reclutamiento) siguen siendo recurrentes y predecibles. Los packs solo afectan el ingreso variable.

### 3. Infraestructura de billing más compleja
Actualmente `subscriptions` y `usage_metrics` existen en la BD, pero el metering por módulo per negocio per mes requiere:
- Tracking de módulos activos por negocio
- Contador de mensajes WhatsApp consumidos
- Lógica de activación/desactivación en tiempo real
- Webhooks de pago por packs

**Estimado de trabajo**: 3-4 semanas de desarrollo backend + billing UI.

### 4. El sistema de referidos con cupones necesita rediseño
El referral actual aplica descuento sobre la suscripción mensual. Con módulos variables, el descuento pierde base de cálculo clara.

**Opción A**: Cupones aplican sobre el primer mes de cualquier módulo activado.
**Opción B**: Crédito fijo (ej: $20k COP) que se consume contra cualquier módulo o pack.
**Opción C**: Pausar referrals hasta que el nuevo modelo esté estable.

### 5. Ansiedad del "pay-per-use"
El cobro por consumo puede hacer que los negocios cuenten cada mensaje y no usen el canal libremente, reduciendo el valor percibido.

**Mitigación**: packs con suficiente volumen por precio bajo (psicología de "tengo de sobra").

### 6. Anchoring negativo vs. competidores con todo incluido
Booksy y Fresha cobran comisión por cita (no suscripción). Calendly cobra por asiento. Un modelo modular puede percibirse como "costoso si activo todo" vs. la suscripción plana de la competencia.

**Mitigación**: bundle recomendado pre-configurado que sea más barato que la suma de módulos separados.

---

## Recomendación Final

**Modelo híbrido**: suscripciones mensuales para módulos funcionales + packs de consumo para canales variables (WhatsApp).

```
┌─────────────────────────────────────────────────┐
│  CAPA BASE (Gratuita, siempre)                  │
│  50 citas/mes + email + perfil público          │
├─────────────────────────────────────────────────┤
│  ADD-ONS MENSUALES (activa/desactiva)           │
│  + Citas ilimitadas     ~$30k/mes               │
│  + Contabilidad         ~$15k/mes               │
│  + Reclutamiento        ~$12k/mes               │
│  + DIAN/Facturación     ~$20k/mes (Fase 2)      │
├─────────────────────────────────────────────────┤
│  PACKS DE CONSUMO (prepago, no expiran rápido)  │
│  + WhatsApp 100 msgs    ~$15k                   │
│  + WhatsApp 500 msgs    ~$60k                   │
│  + WhatsApp 1.000 msgs  ~$100k                  │
└─────────────────────────────────────────────────┘
```

**Bundle recomendado** para negocios medianos: Citas ilimitadas + Contabilidad + WhatsApp 500 = ~$100k/mes (similar al plan Inicio actual, pero con más claridad de valor).

---

## Impacto en Sistemas Existentes

| Sistema afectado | Cambio requerido |
|------------------|-----------------|
| [[sistema-billing]] | Rediseño de `subscriptions` para módulos + packs |
| `usage_metrics` (tabla) | Agregar tracking de mensajes WhatsApp consumidos |
| [[sistema-referrals]] | Rediseño de cupones para base variable (ver opciones arriba) |
| `BillingDashboard.tsx` | Nueva UI de módulos activos + saldo de packs |
| `pricingPlans.ts` | Reemplazar estructura de planes por estructura de módulos |
| `PlanUpgradeModal.tsx` | Convertir en "Module Activation Modal" |
| Edge Functions de pagos | Añadir flows para compra de packs (PayU/MercadoPago) |

---

## Estado

- **Fase**: Pendiente — planificado para Fase 2
- **Prioridad**: Alta (impacta conversión y retención)
- **Prerequisito**: Definir precios finales con datos reales de CAC y churn
- **Relacionado con**: [[planes-y-precios]], [[pricing-fase2]], [[sistema-billing]], [[sistema-referrals]]

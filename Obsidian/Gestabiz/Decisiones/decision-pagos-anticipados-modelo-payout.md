---
date: 2026-05-07
tags: [pagos, mercadopago, arquitectura, regulacion, impuestos, colombia]
---

# Decisión: Modelo de Dispersión de Pagos Anticipados — Plan B (MP Marketplace 1:1)

## Contexto

Al diseñar el sistema de anticipos, surgió la pregunta: ¿el dinero que paga el cliente debe llegar a la **cuenta bancaria del negocio** directamente, o a su **cuenta de MercadoPago**?

Se analizaron dos arquitecturas:

- **Plan A**: Gestabiz recibe el dinero del cliente → lo retiene → lo transfiere al banco del negocio (mediante Wompi Pagos a Terceros o Kushki PayOuts).
- **Plan B**: El dinero del cliente va directo a la cuenta MP del negocio; Gestabiz cobra su comisión (5%) automáticamente via `marketplace_fee` de MercadoPago Marketplace. Gestabiz nunca toca el principal.

**Decisión adoptada: Plan B.**

---

## Flujo del dinero (Plan B — implementado)

```
Cliente paga $50.000 en MercadoPago
         ↓
MP procesa internamente:
  - Comisión MP (~4.75%)       → se queda en MercadoPago
  - marketplace_fee (5%)       → va a cuenta MP de Gestabiz (automático)
  - Neto (~$45.125)            → va directo a cuenta MP del negocio
         ↓
Webhook → Gestabiz actualiza deposit_status = 'paid'
```

Gestabiz **nunca recibe ni retiene** el dinero del cliente. Solo recibe su `marketplace_fee` que MP separa automáticamente al momento del pago.

**Clave técnica**: `create-appointment-deposit-preference` crea la preferencia de pago usando el `access_token` del negocio (obtenido vía OAuth, guardado en `business_mp_connections`) como collector, no el access_token de Gestabiz.

---

## Por qué se descartó el Plan A (cuenta bancaria directa)

### 1. Riesgo regulatorio — Intermediación Financiera (crítico)

Si Gestabiz recibe dinero de un cliente y lo transfiere a un tercero (el negocio), eso constituye **intermediación financiera** según la legislación colombiana.

**Marco legal**:
- Artículo 335 de la Constitución Política de Colombia.
- Estatuto Orgánico del Sistema Financiero (EOSF) — Decreto 663 de 1993.
- Circular Básica Jurídica de la SFC.

**Requisitos para intermediar legalmente**:
- Licencia de establecimiento de crédito o entidad financiera otorgada por la Superintendencia Financiera de Colombia (SFC).
- Capital mínimo: aproximadamente **8.100 millones de pesos** (2025, sujeto a ajuste anual).
- Auditoría anual, reporte de SARLAFT (prevención de lavado de activos), reporte de UIAF.
- Proceso de autorización: 12-24 meses típicamente.

**Consecuencias de operar sin licencia**:
- Multas de hasta 500.000 SMMLV (~$600.000.000 COP en 2026).
- Posible acción penal por captación masiva ilegal de recursos del público.
- Cierre forzado de la operación por la SFC.
- Riesgo reputacional que destruye la empresa en etapa temprana.

Empresas como Rappi Pay, Bold, Nequi, Daviplata operan bajo licencia o convenio con entidad financiera. Una startup SaaS sin licencia no puede asumir este rol.

**Con Plan B, no hay intermediación**: el dinero fluye cliente → cuenta MP del negocio. Gestabiz es un facilitador tecnológico, no un intermediario financiero. MercadoPago (entidad regulada) es quien hace la transferencia.

### 2. Carga tributaria al girar dinero a terceros

Si Gestabiz recibiera el anticipo y luego lo girara al negocio, se activarían **obligaciones de retención en la fuente**:

| Concepto | Tarifa | Cuándo aplica |
|----------|--------|---------------|
| Honorarios — persona natural | 10% | Negocio es PN o profesional independiente |
| Servicios — persona jurídica | 4% | Negocio es SAS, SA, ESAL, etc. |
| Umbral mínimo (2026) | 2 UVT | ~$104.748 COP por pago |

Ejemplo: cliente paga anticipo de $150.000 → Gestabiz debe retener $6.000 (4%) o $15.000 (10%) al girar al negocio. Gestabiz se convierte en **agente de retención**, con obligaciones de:
- Declaración mensual ante la DIAN (Formulario 350).
- Certificados anuales de retención a cada negocio afiliado.
- Sanciones por no retener: equivalentes al valor no retenido + intereses.

**Nota**: desde marzo 2026 (Decreto reglamentario), la retención sobre pagos con tarjeta/PSE *al recibir* el dinero quedó eliminada para operadores de plataformas. Pero la retención *al girar* a terceros sigue vigente — son conceptos distintos.

**Con Plan B**, Gestabiz no gira dinero al negocio. La única transacción de Gestabiz es recibir su `marketplace_fee` (ingreso propio), que genera IVA del 19% que Gestabiz declara normalmente como ingreso por servicios de intermediación tecnológica. Sin retenciones a terceros, sin declaraciones adicionales.

### 3. Costos comparados

| Rubro | Plan A (banco directo) | Plan B (MP Marketplace) |
|-------|----------------------|------------------------|
| Pasarela de cobro | Wompi ~2.99% + IVA ≈ 3.56% | MP standard ~3.99% + IVA ≈ 4.75% |
| Fee de dispersión | ~$4.000–$8.000 COP por transferencia | $0 — incluido en el modelo |
| Retención a retener | 4–10% del giro (devuelto en certificado) | No aplica |
| Carga operativa | Alta (declarar, certificar, conciliar) | Cero |
| KYC del negocio | Gestabiz debe validar datos bancarios | Lo hace MP (entidad regulada) |
| Tiempo de onboarding | Formulario + validación manual | 1 click OAuth |
| Riesgo regulatorio | Alto (SFC, UIAF, SARLAFT) | Bajo (MP es el intermediario) |

Plan A tiene comisión de pasarela menor (~3.56% vs ~4.75%), pero los fees de dispersión, la carga de retención y el riesgo regulatorio lo hacen netamente más costoso y peligroso.

### 4. APIs de dispersión evaluadas y descartadas

**Wompi Pagos a Terceros (Bancolombia)**:
- API de ACH directo a cualquier banco colombiano.
- Soporta Bancolombia, Banco de Occidente, Banco de Bogotá.
- Requiere activación especial (no autoservicio).
- **Descartada**: Gestabiz igual recibiría el dinero primero → intermediación financiera.

**Kushki PayOuts**:
- Dispersión desde balance Kushki a cuentas bancarias vía ACH.
- Ciclos ACH: 1-3 días hábiles.
- **Descartada**: mismo problema regulatorio — Gestabiz retendría el principal.

---

## Implicaciones del Plan B para la declaración de impuestos de Gestabiz

**Ingresos de Gestabiz**: solo el `marketplace_fee` (5% del anticipo). El total pagado por el cliente nunca es ingreso de Gestabiz.

**IVA**: el fee de Gestabiz es un servicio de intermediación tecnológica → genera IVA del 19% que Gestabiz factura y declara.

**Renta**: el fee neto (después de la comisión MP) es ingreso gravable para Gestabiz. No hay confusión con el dinero del cliente que pasa por las cuentas.

**Retención recibida**: quienes paguen a Gestabiz como PJ pueden retenerle en la fuente sobre el fee. Gestabiz lo recupera en su declaración de renta.

---

## Requisito para activar (lado del negocio)

El admin del negocio debe conectar su cuenta de MercadoPago una sola vez desde **Configuración → Pagos → "Conectar cuenta MP"** (OAuth de 1 click). Esto dispara `mp-oauth-init` → autorización en MP → `mp-oauth-callback` guarda el `access_token` encriptado con pgcrypto en `business_mp_connections`.

Sin esta conexión, `PaymentSettingsTab` bloquea la activación de anticipos (`useMpConnection` retorna `isConnected = false`).

---

## Limitaciones conocidas del Plan B

- El negocio necesita cuenta de MercadoPago (gratuita, ~5 min de registro). En Colombia 2026, MP tiene 15M+ usuarios — cobertura alta en PyMEs.
- El dinero llega a la billetera MP del negocio (no directamente al banco). El negocio retira cuando quiera a su cuenta bancaria: el retiro a cuenta propia en MP es **gratuito**, acredita en 2 días hábiles.
- Si MP cambia sus condiciones de marketplace en Colombia, hay que reevaluar (se monitorea via `payment_gateway_fees` editable).

---

## Ver también

- [[sistema-pagos-anticipados]] — implementación técnica completa
- [[sistema-billing]] — suscripciones y pasarelas (Stripe/PayU/MP)
- [[edge-functions]] — EF `mp-oauth-init`, `mp-oauth-callback`, `create-appointment-deposit-preference`

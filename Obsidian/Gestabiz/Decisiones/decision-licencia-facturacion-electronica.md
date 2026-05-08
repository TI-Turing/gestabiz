---
date: 2026-05-07
tags: [pricing, facturacion-electronica, licencia, payg, add-on, modelo-hibrido]
---

# Decisión: Licencia Anual de Facturación Electrónica como Add-on

## El modelo

La facturación electrónica **no está atada a ningún plan mensual**. Es una licencia anual independiente que el negocio compra por separado, desde el "carrito de funcionalidades".

```
Plan mensual (suscripción)  +  Licencia FE (add-on anual)
        ↓                              ↓
 Gestión de citas,             Emisión de facturas
 empleados, etc.              electrónicas ante DIAN
```

**Combinaciones válidas:**
- Plan Gratuito + Licencia FE → facturas sus citas (aunque el plan sea gratuito)
- Plan Pro + Licencia FE → factura citas + ventas rápidas + todo lo del plan
- Plan Pro sin Licencia FE → no emite facturas electrónicas
- Cualquier plan sin Licencia FE → comportamiento actual (sin FE)

## Estructura de la licencia

La licencia incluye un **cupo de documentos anuales** (espejo del modelo Matias). Se proponen tres tiers:

| Licencia | Docs/año | Precio sugerido | Docs/mes equiv. | Ideal para |
|----------|----------|-----------------|-----------------|------------|
| Starter | 500 | $280,000 COP/año | ~42 | Negocios con pocas citas facturables |
| Pro | 1,200 | $380,000 COP/año | ~100 | Salones/consultorios medianos |
| Business | 3,000 | $520,000 COP/año | ~250 | Negocios con alto volumen |

**Documentos adicionales**: cuando el cupo se agota, se cobra por documento adicional. Matias cobra $150 COP/doc extra (Casa de Software). Gestabiz cobra ~$250–350 COP/doc extra al cliente, manteniendo margen.

## Flujo de caja

```
Cliente paga licencia anual a Gestabiz (upfront)
         ↓
Gestabiz paga plan Casa de Software a Matias (upfront anual)
         ↓
Gestabiz factura docs extra al cliente (mes vencido, automático)
         ↓
Gestabiz paga a Matias los docs extra del pool (mes vencido)
```

**Costo de Matias** (Casa de Software, pool compartido):

| Clientes con licencia FE | Docs/año estimados | Plan Matias | Costo/año |
|---|---|---|---|
| 5 clientes | 6,000 | 10,000 docs | $400,000 COP |
| 15 clientes | 18,000 | 30,000 docs | $660,000 COP |
| 30 clientes | 36,000 | 50,000 docs | $875,000 COP |
| 100 clientes | 120,000 | 150,000 docs | $2,400,000 COP |

El margen de Gestabiz en la licencia cubre con holgura el costo de Matias desde los primeros clientes.

## Restricción operativa Matias: mínimo 5 clientes en 3 meses

El plan Casa de Software de Matias exige tener **al menos 5 negocios habilitados** dentro de los primeros 3 meses. Si no se cumple, Matias puede no renovar el plan o cambiar condiciones. **Esto es un prerequisito de lanzamiento**: no activar FE en producción hasta tener al mínimo 5 negocios listos para habilitar simultáneamente (o en pipeline inmediato).

## Gestión del pool de documentos

El pool de Matias es **compartido** entre todos los clientes de Gestabiz. Implicaciones:

1. **Tracking por cliente**: Gestabiz debe llevar contador interno de documentos emitidos por cada negocio (ya persiste en `electronic_invoices`).
2. **Alertas de cupo**: cuando un negocio alcanza el 80% de su cupo → notificación in-app "Te quedan X documentos en tu licencia FE".
3. **Cobro automático de extras**: si supera el cupo → cargo automático al método de pago del negocio.
4. **Renovación**: la licencia vence en la misma fecha cada año. 30 días antes → recordatorio por email + in-app. Si no renueva → FE se desactiva, no se borran datos históricos.

## Alineación con el modelo híbrido (carrito de funcionalidades)

Esta licencia es el **primer add-on del carrito de funcionalidades** de Gestabiz. El modelo de negocio evoluciona de:

```
Antes:  [Plan Gratuito] [Plan Inicio $90k] [Plan Pro $180k]
                                ↓
Después: Plan base (suscripción mensual)
         + Carrito de add-ons anuales/mensuales:
           ✓ Licencia Facturación Electrónica (anual)
           ✓ Pack WhatsApp adicional (mensual - ya existe)
           ✓ [futuros add-ons: nómina electrónica, BI avanzado, etc.]
```

Cada add-on tiene su propio ciclo de vida (anual / mensual), su propio precio y sus propias métricas de consumo.

## Ventajas del modelo

- **Revenue predecible**: los ingresos de la licencia anual son upfront y predecibles
- **ARPU alto**: un negocio en Plan Gratuito + Licencia FE + WhatsApp puede pagar más que un cliente de Plan Pro básico
- **Menor fricción para adopción**: el negocio no tiene que subir de plan para acceder a FE, solo agrega la licencia
- **Alineado con DIAN**: la resolución de numeración DIAN también es anual → el negocio ya está acostumbrado a pensar en renovaciones anuales para facturación
- **Margen saludable**: a $280k–520k/año por licencia, el costo de Matias por cliente es de $13k–33k/año → margen bruto del 90%+

## Relacionado

- [[modelo-cobro-payg-fase2]] — contexto del modelo híbrido suscripción + PAYG
- [[sistema-facturacion-electronica]] — implementación técnica
- [[planes-y-precios]] — planes base de Gestabiz
- [[pricing-fase2]] — estrategia de pricing por módulos

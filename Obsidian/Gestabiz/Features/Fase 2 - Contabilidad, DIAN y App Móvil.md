---
date: 2026-03-24
tags: [roadmap, fase-2, contabilidad, dian, mobile]
status: planificada
---

# Fase 2 — Contabilidad Completa, DIAN y App Móvil

## Módulo de Contabilidad Completo

El módulo de contabilidad actual es funcional pero básico. En Fase 2 se convierte en el motor fiscal real del negocio.

**Lo que ya existe (Fase 1):**
- Transacciones (ingresos/gastos)
- Configuración fiscal (IVA, ICA, Retención)
- Charts: CategoryPie, EmployeeRevenue, IncomeVsExpense, etc.
- Exports PDF/CSV/Excel

**Lo que falta (Fase 2):**
- [ ] Plan de cuentas PUC (Plan Único de Cuentas — estándar Colombia)
- [ ] Libro de contabilidad formal (diario, mayor, balance)
- [ ] Estado de resultados y balance general
- [ ] Conciliación bancaria
- [ ] Nómina y prestaciones sociales
- [ ] Cierres contables por periodo
- [ ] Multimoneda (COP base, con soporte USD/EUR para expansión LATAM)

---

## Conexión DIAN — Facturación Electrónica

Colombia exige facturación electrónica para negocios formales. Este es un diferenciador crítico.

**Contexto regulatorio:**
- Resolución DIAN 042/2020 — facturación electrónica obligatoria
- Formato: UBL 2.1 (XML firmado digitalmente)
- Transmisión: directamente a la DIAN o via proveedor tecnológico habilitado

**Stack sugerido:**
- **Proveedor habilitado**: usar API de un proveedor habilitado DIAN (Siigo, Alegra, o directo) en lugar de implementar el XML UBL desde cero — reduce tiempo y riesgo legal
- **Alternativa directa**: implementar cliente UBL 2.1 + firma digital con certificado digital
- **Edge Function**: `generate-electronic-invoice` — genera, firma y transmite a DIAN
- **Tabla nueva**: `electronic_invoices` (CUFE, fecha transmisión, estado DIAN, XML, PDF)

**Flujo esperado:**
```
Cita completada / Venta rápida
    ↓
Gestabiz genera factura electrónica
    ↓
Firma digital (certificado del negocio)
    ↓
Transmisión a DIAN
    ↓
DIAN devuelve CUFE (código único)
    ↓
PDF enviado al cliente por email
```

**Notas importantes:**
- Cada negocio necesita su propio NIT y certificado digital
- Los negocios en régimen simplificado emiten **documento equivalente** (no factura electrónica)
- Considerar si Gestabiz actúa como intermediario tecnológico o si cada negocio gestiona su cuenta DIAN

---

## App Móvil

**Existe base en** `src/mobile/` (Expo/React Native) — pendiente de completar.

**Prioridades Fase 2:**
- [ ] App para empleados — ver agenda del día, marcar llegada/salida, gestionar citas asignadas
- [ ] App para clientes — reservar cita, ver historial, recibir notificaciones push
- [ ] Push notifications nativas (vs. email/SMS actual)
- [ ] Modo offline básico (ver agenda sin internet)
- [ ] Escáner QR nativo (ya existe en web, adaptarlo a móvil)

**Stack:**
- Expo SDK (ya configurado)
- Supabase mismo backend
- Notificaciones: Expo Push Notifications + FCM/APNs

---

## Dependencias antes de iniciar Fase 2

- Lanzamiento producción estable (Fase 1 completada)
- Al menos 10 negocios activos para validar el módulo contable con datos reales
- Decisión sobre proveedor DIAN (directo vs. habilitado)

## Notas Relacionadas

- [[sistema-contable]] — Módulo contable actual (IVA/ICA/Retención)
- [[edge-functions]] — Edge Functions de Supabase para DIAN
- [[base-de-datos]] — Tablas de transacciones y fiscal
- [[stack-tecnologico]] — Expo/React Native, Vite, Supabase
- [[planes-y-precios]] — Validar módulo con negocios activos
- [[sistema-ventas-rapidas]] — Ventas como input para facturación
- [[facturacion-electronica-matias-api]] — Matias API para facturación electrónica
- [[analisis-competitivo-roadmap]] — Features de Fase 2 detalladas
- [[estrategia-producto-y-negocio]] — Mobile-first y precios

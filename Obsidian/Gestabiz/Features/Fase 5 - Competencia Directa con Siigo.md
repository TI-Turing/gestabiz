---
date: 2026-05-07
tags: [features, fase-5, estrategia, siigo, competencia, roadmap, todo-tipo-de-negocio]
status: propuesto
relacionado: [[Fase 2 - Contabilidad, DIAN y App Móvil]], [[Fase 4 - El Shopify de los Negocios de Servicios]], [[comparativa-competidores]], [[planes-y-precios]], [[propuesta-de-valor]]
---

# Fase 5 — Competencia Directa con Siigo

> **Tesis**: seguir el ejemplo del líder probado en Colombia (Siigo, 300k empresas), copiar lo que ya funciona y mejorarlo. Expandir Gestabiz de "gestión de citas para PyMEs de servicios" a **plataforma administrativa todo-en-uno para todo tipo de negocio**, desde la barbería de barrio hasta la mediana empresa.
>
> **Status**: propuesta estratégica (post-BETA) — no se ejecuta hasta cerrar [[Fase 2 - Contabilidad, DIAN y App Móvil]] y validar tracción comercial.

---

## 1. ¿Por qué Siigo es la referencia?

Siigo es el **player dominante de software administrativo PyME en Colombia** y un caso de éxito replicable:

- **300.000+ empresas** activas en Colombia (también opera en Ecuador, México, Perú, Uruguay, Chile)
- **23+ años en el mercado** (NIT 830.048.145-8, fundada en Bogotá)
- **Ticket bajo de entrada**: plan más barato $9.992 COP/mes (facturación electrónica 24 documentos/año)
- **Pricing escalable**: desde freelancers/microempresas hasta empresas medianas
- **Producto modular**: el cliente arranca con lo mínimo y va sumando módulos
- **100% nube**, multi-país, multi-dispositivo (web + app móvil)
- **Validado por la DIAN** para facturación y nómina electrónica
- **Marca de confianza**: testimonios reales, contadores como canal de venta, fundación, sostenibilidad

**Lección clave**: en Colombia gana quien resuelve el dolor administrativo completo, no solo una pieza.

---

## 2. Catálogo de productos de Siigo (qué vamos a copiar)

| Módulo Siigo | Qué hace | Estado en Gestabiz |
|---|---|---|
| **Factura electrónica DIAN** | Crear facturas en 30 seg, emisión electrónica con todos los requisitos DIAN, botón de pago en línea, adjuntar imágenes/videos | 🟡 Planeado en [[Fase 2 - Contabilidad, DIAN y App Móvil]] vía [[facturacion-electronica-matias-api]] |
| **Sistema POS** | Punto de venta para tiendas: productos rápidos, online/offline, abrir/cerrar caja, control de turnos, cuadre diario, comprobante DIAN | 🟡 Parcial: [[sistema-ventas-rapidas]] (sin facturación DIAN ni inventario) |
| **POS Gastrobar/Restaurantes** | POS especializado: recetas, mesas, órdenes, normativa DIAN | ❌ No existe (sería **vertical nuevo**) |
| **Contabilidad** | Movimientos contables alimentados en tiempo real desde ventas/compras, contador puede acceder | 🟡 Existe [[sistema-contable]] (IVA/ICA/Retención CO) pero sin libro auxiliar ni PUC |
| **Nómina electrónica** | Liquidación de nómina en 4 pasos, comprobante electrónico al empleado, validación DIAN | ❌ No existe (oportunidad: ya tenemos `business_employees` con salario base) |
| **Inventario** | Conteo automático cada vez que se compra/vende, sin conteos manuales | ❌ No existe (necesario para POS de productos físicos) |
| **Compras y gastos** | Registrar gastos con foto, categorización, actualización automática de inventario | 🟡 Existe `recurring_expenses` y `transactions` (sin OCR ni inventario) |
| **Centro de costos** | Rentabilidad por sucursal, reportes detallados por área | 🟡 Parcial: tenemos `locations` y reportes básicos (falta vista contable por centro de costo) |
| **Gestión de cobranza** | Alertas automáticas por email/SMS, botón de pago en factura | 🟡 Tenemos [[sistema-notificaciones]] (falta link a factura/pago) |
| **Siigo Contador** | Software gratuito para contadores que asesoran múltiples empresas | ❌ No existe (oportunidad: arquitectura multi-rol ya lo soporta) |
| **App móvil** | Operar todo desde el celular | 🟡 [[sistema-mobile-hybrid]] (Expo + WebView) — listo para sumar módulos contables |
| **Cotizaciones / CRM** | Personalizar y enviar cotizaciones, seguimiento comercial | 🟡 [[sistema-crm-clientes]] (sin cotizaciones formales con PDF) |

---

## 3. La diferencia que vamos a explotar

Siigo nació **contable y horizontal** (sirve a cualquier negocio que vende productos o servicios). Gestabiz nació **vertical de servicios y citas**, lo que nos da ventajas que Siigo NO tiene y nunca tendrá bien:

| Capacidad | Siigo | Gestabiz |
|---|---|---|
| Citas y agenda con disponibilidad real | ❌ | ✅ [[sistema-citas]] |
| Recursos físicos (mesas, canchas, habitaciones, equipos) | ❌ | ✅ [[sistema-modelo-flexible]] (15 tipos) |
| Permisos granulares por empleado | ❌ (solo usuarios) | ✅ [[sistema-permisos]] (79 permisos, 9 templates) |
| Reseñas públicas indexables por Google | ❌ | ✅ [[sistema-reviews]] + [[sistema-perfiles-publicos]] |
| Reclutamiento + matching inteligente | ❌ | ✅ [[sistema-vacantes]] |
| Chat tiempo real con clientes | ❌ | ✅ [[sistema-chat]] (con WebRTC, audio) |
| Multi-rol nativo (admin/empleado/cliente en un solo usuario) | ❌ | ✅ [[sistema-autenticacion]] |
| Ausencias y vacaciones con aprobación | ❌ | ✅ [[sistema-ausencias]] |
| Marketplace de servicios + búsqueda | ❌ | ✅ [[sistema-busqueda]] |
| Pagos anticipados con marketplace MP | ❌ | ✅ [[sistema-pagos-anticipados]] |

**Posicionamiento Fase 5**: *"Gestabiz: lo que Siigo hace para tu contabilidad, nosotros lo hacemos para todo tu negocio — agenda, ventas, equipo, clientes y contabilidad en una sola app."*

---

## 4. Brechas a cerrar (lo que tenemos que construir)

Para competirle a Siigo de tú a tú en negocios que **no son solo de citas** (tiendas, restaurantes, ferreterías, distribuidoras), necesitamos:

### 4.1 Bloque "Productos e Inventario" 🔥 CRÍTICO
- Tabla `products` (separada de `services`): SKU, código de barras, precio, costo, stock
- Tabla `inventory_movements`: entradas (compras), salidas (ventas), ajustes
- Tabla `warehouses` (bodegas, opcional Pro)
- Decremento automático de stock al vender (ventas rápidas, POS, factura)
- Alertas de stock mínimo
- Reporte de rotación y valorización

### 4.2 POS completo (extensión de Ventas Rápidas)
- Modo POS pantalla completa con productos vendidos rápidos (favoritos)
- Apertura y cierre de caja con efectivo declarado vs. esperado
- Control de turnos por empleado/sede
- Cuadre diario, comprobante diario DIAN
- Funcionamiento offline-first (PWA + IndexedDB) y sincronización al recuperar conexión
- Soporte de impresora térmica vía WebUSB / Bluetooth (PWA) o impresión nativa (Expo)

### 4.3 Facturación electrónica DIAN
- Cerrar [[facturacion-electronica-matias-api]]
- Numeración autorizada DIAN
- CUFE, código QR DIAN, XML estándar
- Adjuntar evidencias (foto, video) — copiar feature de Siigo
- Botón de pago en línea sobre la factura (link MercadoPago/PayU)

### 4.4 Nómina electrónica 🔥 OPORTUNIDAD GRANDE
- Liquidación de nómina en 4 pasos (igual que Siigo)
- Cálculo automático de aportes (salud, pensión, ARL, parafiscales, prestaciones)
- Comprobante de nómina electrónico DIAN al empleado por correo
- Aprovechar datos ya existentes: `business_employees.salary_base`, `hire_date`, ausencias, vacaciones
- **Diferenciador**: nómina conectada con horarios reales y ausencias aprobadas (Siigo no tiene esto)

### 4.5 Centros de costo / Multi-sede contable
- Reportes financieros segmentados por `location_id`
- P&L por sede, por servicio, por empleado
- Comparativa entre sedes
- Exportable a Excel/PDF

### 4.6 Vertical Restaurantes / Gastrobar (largo plazo)
- Gestión de mesas (extender [[sistema-modelo-flexible]] tipo `table`)
- Comandas hacia cocina/barra
- Recetas y costo de plato
- Propinas
- División de cuenta

### 4.7 Modo Contador (similar Siigo Contador)
- Vista especial donde un contador ve **múltiples negocios** que asesora
- Sin costo adicional para el contador (lo paga el negocio)
- Aprovechar arquitectura multi-rol existente
- Canal de adquisición: convertir contadores en partners que recomiendan Gestabiz a sus clientes (igual que Siigo Partners)

### 4.8 OCR de facturas/recibos (diferenciador)
- Subir foto de un recibo → extraer monto, fecha, NIT, categoría automáticamente
- Crear `transactions` tipo `expense` con un click
- Stack: Tesseract.js o Google Vision API o OpenAI Vision

---

## 5. Replanteo de planes y pricing (Fase 5)

Siigo arranca en **$9.992 COP/mes** (1 usuario, 24 documentos/año). Eso es ~3x más barato que nuestro plan Inicio ($90k). No vamos a competir en precio bruto, pero sí en **valor por peso**.

Propuesta de **5 planes Fase 5** (ver también [[planes-y-precios]] y [[pricing-fase2]]):

| Plan | Target | Precio mensual | Incluye |
|---|---|---|---|
| **Free** | Profesional independiente | $0 | 1 sede, 1 empleado, 30 citas/mes, agenda, perfil público |
| **Inicio** | Microempresa de servicios | $50.000 | Citas ilimitadas, 1 sede, hasta 3 empleados, ventas rápidas, contabilidad básica |
| **Negocio** | PyME de servicios + ventas | $120.000 | + Productos/inventario, POS básico, multi-sede, 10 empleados |
| **Empresa** | Pyme con facturación electrónica | $250.000 | + Facturación electrónica DIAN, nómina electrónica, centros de costo, OCR |
| **Empresa+** | Mediana empresa multi-sede | $500.000+ | + Múltiples sedes ilimitadas, modo contador, integraciones, soporte priorizado |

**Add-ons consumibles** (modelo PAYG, ver [[modelo-cobro-payg-fase2]]):
- Documentos electrónicos extra (pack de 100, 500, 1000)
- Mensajes WhatsApp
- Empleados adicionales
- Sedes adicionales

**Comparativa frente a Siigo en plan equivalente**:
- Siigo Facturación 120 = $22.493/mes → solo factura electrónica DIAN
- Gestabiz Empresa = $250.000/mes → factura DIAN + agenda + POS + nómina + CRM + chat + reseñas + reclutamiento

→ Justificable porque resolvemos **6 verticales en uno**.

---

## 6. Roadmap de ejecución (orden sugerido)

> **Pre-requisito**: cerrar [[Fase 2 - Contabilidad, DIAN y App Móvil]]

### Etapa 5.1 — Productos e Inventario (4-6 semanas)
- Migración: tabla `products`, `inventory_movements`, `warehouses`
- UI: ProductsManager (admin), ProductCard, modal de movimientos
- Integración con Ventas Rápidas (decremento automático)
- Reportes básicos de stock

### Etapa 5.2 — POS Pro (3-4 semanas)
- Modo POS pantalla completa
- Apertura/cierre de caja
- Soporte impresora térmica
- PWA offline-first

### Etapa 5.3 — Facturación electrónica DIAN (depende de [[facturacion-electronica-matias-api]])
- Integración Matias API o equivalente
- CUFE, QR, XML
- Numeración autorizada
- Botón de pago en factura

### Etapa 5.4 — Nómina electrónica (6-8 semanas)
- Cálculo de aportes y prestaciones (CO)
- Liquidación masiva
- Comprobante electrónico DIAN
- Conexión con ausencias y vacaciones existentes

### Etapa 5.5 — Modo Contador (2-3 semanas)
- Vista multi-negocio para contadores
- Acceso por invitación del owner
- Reportes consolidados
- Programa de partners contadores

### Etapa 5.6 — POS Gastrobar (vertical restaurantes, 6-8 semanas)
- Gestión de mesas y comandas
- Recetas y costos
- División de cuenta
- Propinas

### Etapa 5.7 — OCR de gastos (2-3 semanas)
- Subir foto → extraer datos → crear transacción

---

## 7. Estrategia de adquisición (copiar lo que funciona)

Siigo gana clientes con tres canales que vamos a replicar:

| Canal Siigo | Aplicación en Gestabiz |
|---|---|
| **Contadores como referidos** | Programa de partners contadores con comisión recurrente. Modo Contador gratis. |
| **SEO masivo** (blog, landing por keyword) | [[SEO-SEM-Strategy-Colombia-LATAM]] + [[SEO-directorio-post-deploy]] — landing por ciudad + vertical |
| **Asesores comerciales telefónicos** | [[manual-vendedores-externos]] + [[go-to-market-2026]] — vendedores puerta-puerta y telemarketing |
| **Testimonios y casos de éxito** | Pendiente: sección de testimonios en landing, programa de clientes embajadores |
| **Migración asistida** desde competidores | Importador de Excel/CSV de clientes/productos, soporte de onboarding 1:1 incluido en planes pagos |
| **Prueba sin compromiso** | [[free-trial-mes-gratis]] ya planeado |

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| **Diluir el foco** (de citas pasamos a "todo") | Lanzar por etapas. Mantener Free + Inicio enfocados en servicios. Productos/POS solo en plan Negocio+ |
| **Complejidad técnica de DIAN/nómina** | Tercerizar vía Matias API (facturación) y libreria especializada para nómina. No reinventar |
| **Competir en precio con Siigo** | NO bajar precios. Vender valor: "1 app reemplaza Siigo + Calendly + Booksy + WhatsApp Business" |
| **Sub-vender al cliente actual** que solo quiere agenda | Mantener plan Inicio simple. Productos/POS son add-on, no obligatorio |
| **Resistencia de contadores acostumbrados a Siigo** | Modo Contador 100% gratis + comisión por referido + soporte técnico priorizado |
| **Producto se vuelve "bloated"** | Cada módulo es activable/desactivable por negocio. UX modular, no todo a la vista |

---

## 9. Métricas de éxito (KPIs Fase 5)

- **Diversificación de verticales**: % de negocios activos que NO son del vertical "servicios puros" (meta: 30% en 12 meses post-Fase 5)
- **ARPU** (Average Revenue Per User): meta subir de $90k a $150k mensuales
- **Adopción modular**: % de cuentas pagas que activan ≥3 módulos (meta: 60%)
- **Churn**: mantener <5% mensual (Siigo tiene fama de churn bajo gracias al lock-in contable, [[lock-in-estrategia-datos-clientes]])
- **Contadores referidos**: 50 contadores partners en 12 meses
- **Migraciones desde Siigo**: meta 100 negocios migrados desde Siigo en 18 meses (con incentivo de 3 meses gratis)

---

## 10. Conclusión y siguiente paso

Esta fase convierte a Gestabiz de "agenda + servicios" a **plataforma administrativa horizontal** capaz de competir con Siigo en su propio terreno, **sin perder** la ventaja vertical en citas/servicios.

**Siguiente paso operativo**:
1. Validar tesis con 10 entrevistas a clientes actuales: *"¿usarías Gestabiz para vender productos también?"*, *"¿cuánto pagas hoy a Siigo / contador?"*
2. Cerrar primero [[Fase 2 - Contabilidad, DIAN y App Móvil]]
3. Tras Fase 2, comenzar Etapa 5.1 (Productos e Inventario) como mínimo viable para POS

---

**Notas relacionadas**:
- [[comparativa-competidores]] (sección Siigo expandida)
- [[propuesta-de-valor]]
- [[Fase 2 - Contabilidad, DIAN y App Móvil]]
- [[Fase 4 - El Shopify de los Negocios de Servicios]]
- [[planes-y-precios]] / [[pricing-fase2]] / [[modelo-cobro-payg-fase2]]
- [[lock-in-estrategia-datos-clientes]]
- [[ventajas-estructurales-no-explotadas]]
- [[manual-vendedores-externos]] / [[go-to-market-2026]]
- [[facturacion-electronica-matias-api]]

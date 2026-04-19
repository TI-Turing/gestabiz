---
date: 2026-04-13
tags: [auditoria, arquitectura, seguridad, testing, estrategia, roadmap, produccion, critico]
---

# Auditoría Completa — Gestabiz (Abril 2026)

> Análisis exhaustivo desde perspectiva técnica, arquitectónica, funcional, de negocio, marketing, ventas, soporte, inversión y operaciones. Documento vivo que debe revisarse cada mes.

---

## PARTE 1: ESTADO TÉCNICO — LO QUE HAY QUE ARREGLAR YA

### 1.1 CRÍTICO — Seguridad

#### Tabla `cron_execution_logs` sin RLS
- 72 de 73 tablas tienen RLS habilitado. Esta es la excepción.
- Riesgo: información interna de jobs expuesta.
- Fix: `ALTER TABLE public.cron_execution_logs ENABLE ROW LEVEL SECURITY;`

#### Webhooks sin protección contra replay attacks
- `stripe-webhook`, `payu-webhook`, `mercadopago-webhook` validan firma pero NO verifican idempotencia.
- Un atacante que capture un payload firmado puede re-enviarlo y duplicar pagos/suscripciones.
- Fix: tabla `webhook_idempotency` con `event_id` único, verificar antes de procesar.

#### Función `assign_user_permission()` — autorización incompleta
- Verifica que el caller sea owner/admin, pero NO verifica que tenga derecho a otorgar ESE permiso específico.
- Un admin podría asignarse permisos que no debería tener.
- Fix: validar contra lista de permisos permitidos por rol antes de asignar.

#### Secretos en historial de Git
- GitGuardian detectó tokens hardcodeados (`sbp_939fa09...`, PROD Service Role Key).
- El código ya fue corregido (usa `process.env`), PERO los secretos siguen en el historial de git.
- **PENDIENTE CRÍTICO**: rotar el Service Role Key de PROD en Supabase dashboard.

#### `.env` y `.env.staging` commiteados al repo
- Contienen credenciales de staging/dev.
- Fix: agregar a `.gitignore`, usar solo `.env.example` como template.

### 1.2 CRÍTICO — Estabilidad de código

#### Tests fallando: 47 de 198 tests fallan
- `permissions-v2.test.ts`: espera 60 permisos, hay 64 (código cambió, test no se actualizó).
- `hierarchyService.test.ts`: 12 fallos — exports faltantes en el módulo.
- `useFinancialReports.test.ts`: 13 fallos — jsPDF mock incompleto.
- `useTaxCalculation.test.ts`: timeouts en waitFor.
- 11 archivos de test con 0 tests (vacíos): PermissionEditor, AdminDashboard, FiltersPanel, etc.
- **Los tests NO se ejecutan en CI/CD** — deployments pasan sin validación.

#### Doble sistema de permisos (v1 + v2) activo simultáneamente
- `permissions.ts` (legacy) y `permissions-v2.ts` coexisten sin migración definida.
- Hook `usePermissions-v2.tsx` exporta ambas lógicas.
- Riesgo: gaps de seguridad, comportamiento inconsistente entre componentes.

#### 856 instancias de `as unknown` / `as any` en el código
- TypeScript strict está configurado pero se bypasea masivamente.
- Oculta errores reales, hace refactoring peligroso.
- Patrón más común: `(data as any) || {}` en componentes.

#### React Query cache no se limpia en logout
- QueryClient se crea en root pero nunca se resetea al cerrar sesión.
- Datos de un usuario admin pueden filtrarse al siguiente usuario que inicie sesión.
- Fix: `queryClient.clear()` en el handler de signOut.

#### Supabase client cae silenciosamente a modo mock
- Si las env vars están mal configuradas, la app funciona con datos falsos sin avisar al usuario.
- En producción, un error de configuración = app silenciosamente inútil.
- Fix: lanzar error explícito si las credenciales no son válidas.

### 1.3 IMPORTANTE — Deuda técnica

#### 2,092 console.log en el código fuente
- Script `remove-console-logs.js` existe pero NUNCA se llama en el pipeline de build.
- Estos logs llegan a producción y pueden exponer datos sensibles en la consola del navegador.

#### 699 errores de ESLint pre-existentes
- CI/CD configurado con `continue-on-error: true` para lint y type-check.
- 48 errores de TypeScript ignorados.
- El CI no bloquea nada — es decorativo.

#### 381 TODOs/FIXMEs/HACKs en el código
- Incluyen: "Implement ResourceSelection", "Add typing indicators", "Add field is_active".
- Deuda técnica acumulada que crece con cada feature.

#### 5 niveles de Context Providers anidados
- `BrowserRouter > QueryClient > Theme > Language > AppState > Auth > Alert > AppRoutes`
- Cada cambio en cualquier context causa re-renders en cascada.
- Fix: consolidar en 2-3 providers, usar composición.

#### Sin pre-commit hooks
- No hay Husky ni lint-staged configurado.
- Código con errores de lint, tests rotos y console.logs puede commitearse libremente.

#### Accesibilidad incompleta
- Utilidades de accesibilidad existen en `accessibility.ts` pero solo 28 de 76 componentes UI usan `role=`.
- Sin labels `htmlFor`, sin `aria-labelledby`, sin trap de focus en dialogs.
- No cumple WCAG 2.1 Level AA.

---

## Notas Relacionadas

- [[sistema-permisos]] — Sistema de permisos granulares (doble sistema v1+v2)
- [[sistema-autenticacion]] — Auth, sesión, QueryClient
- [[base-de-datos]] — Tablas, RLS, cron_execution_logs
- [[stack-tecnologico]] — Tests, CI/CD, console.logs
- [[edge-functions]] — Webhooks sin idempotencia
- [[sistema-billing]] — Stripe/PayU/MP webhooks
- [[secretos-en-scripts-gitguardian]] — Detalle del problema de secretos
- [[google-oauth-separacion-entornos]] — Separación de entornos OAuth
- [[estrategia-producto-y-negocio]] — Estrategia de producto (partes 3-4 de la auditoría)
- [[analisis-competitivo-roadmap]] — Competidores mencionados en la auditoría

## PARTE 2: ESTADO DE INFRAESTRUCTURA Y OPERACIONES

### 2.1 CI/CD — Gaps críticos

| Aspecto | Estado | Riesgo |
|---------|--------|--------|
| Tests en CI | No se ejecutan | Alto — bugs llegan a prod |
| Type-check en CI | continue-on-error | Medio — errores ignorados |
| Lint en CI | continue-on-error | Medio — calidad degrada |
| Pre-commit hooks | No existen | Alto — sin quality gates |
| Deploy automático | Funciona (Vercel) | OK |
| Migraciones automáticas | Funcionan | OK |
| Edge Functions deploy | Funciona | OK |
| Rollback de migraciones | No automatizado | Alto — si falla en prod, es manual |
| Source maps a Sentry | Condicional en SENTRY_AUTH_TOKEN | Medio |

### 2.2 Monitoreo y observabilidad

| Aspecto | Estado | Recomendación |
|---------|--------|---------------|
| Sentry (errores) | Configurado, 30% sampling prod | Subir a 100% hasta estabilizar |
| GA4 (analytics) | Configurado con consent | OK |
| Uptime monitoring | No existe | Agregar UptimeRobot o Checkly |
| Performance monitoring | No existe | Core Web Vitals con Vercel Analytics |
| Database monitoring | No hay alertas | Configurar alertas en Supabase dashboard |
| Edge Function logs | Solo en Supabase dashboard | Agregar logging estructurado |
| Página de status pública | No existe | status.gestabiz.com con Instatus/Cachet |

### 2.3 Base de datos — Puntos de atención

| Aspecto | Estado |
|---------|--------|
| RLS en todas las tablas | 72/73 (falta cron_execution_logs) |
| Índices | 100+ índices, cobertura buena |
| Triggers en appointments | 5 triggers en INSERT/UPDATE — riesgo de performance en bulk ops |
| SECURITY DEFINER functions | 125 funciones — superficie de ataque grande |
| Columnas generadas DEV vs PROD | Migración de catch-up creada, verificar que se aplicó |
| Políticas RLS | Solo verifican owner_id, no business_roles — admins no-owner bloqueados |
| Rate limiting en webhooks | No existe |
| Transacciones en webhooks | Stripe hace 3+ updates sin transaction — riesgo de estado parcial |

---

## PARTE 3: PERSPECTIVA DE PRODUCTO — QUÉ FUNCIONA Y QUÉ NO

### 3.1 Fortalezas del producto (aprovechar)

1. **Cobertura funcional amplia**: citas, empleados, ausencias, contabilidad, chat, notificaciones, permisos, reclutamiento, billing — pocas apps en LATAM tienen todo esto
2. **Multi-gateway de pagos**: Stripe + PayU + MercadoPago ya integrados — ventaja competitiva real para LATAM
3. **Perfiles públicos con SEO**: `/negocio/:slug` indexable, Schema.org, sitemap — base para marketplace
4. **Sistema de permisos granular**: 79 permisos, 9 templates — más sofisticado que Fresha o Booksy
5. **i18n modular**: ~2,200 claves, ES/EN, extensible a PT/FR
6. **Recursos físicos**: soporte para canchas, salas, equipos — diferenciador vs. competidores de solo-salones
7. **App móvil en Expo**: base funcional con 59 screens registrados
8. **Infraestructura de notificaciones**: email + SMS + WhatsApp + in-app ya conectados

### 3.2 Debilidades del producto (corregir)

1. **Onboarding inexistente**: el usuario se registra y ve un dashboard vacío. No hay wizard de configuración, no hay checklist, no hay demo. Esta es la razón #1 de churn temprano en SaaS B2B.
2. **Mobile no está en stores**: la app Expo existe pero no está publicada en App Store ni Google Play. En LATAM el 70% accede desde celular.
3. **Sin programa de fidelización**: el feature más pedido por negocios de servicios. Fresha, Booksy y Vagaro lo tienen.
4. **Sin depósitos al reservar**: el no-show es el dolor #1. La BD ya lo soporta (`payment_status: partial`) pero no hay UI.
5. **Sin waitlist**: cuando un horario está lleno, el cliente simplemente se va. No hay forma de capturar esa demanda.
6. **UI de cupones no existe**: la tabla `discount_codes` existe pero no hay forma de crearlos ni aplicarlos.
7. **Marketing integrado nulo**: la infraestructura de email/WhatsApp existe pero no hay campañas ni automatizaciones.
8. **Widget embebible no existe**: negocios con web propia no pueden integrar el booking.

### 3.3 Riesgos del producto

1. **Complejidad excesiva para el usuario target**: PyMEs de servicios en Colombia no son técnicos. Si la UI tiene demasiadas opciones sin guía, abandonan.
2. **Feature bloat sin pruning**: 70+ hooks, 76 componentes UI, 50 Edge Functions — la complejidad crece pero no se poda.
3. **Dependencia de un solo desarrollador**: si Jose Luis no puede trabajar, todo se detiene. No hay documentación de arquitectura más allá de CLAUDE.md.

---

## PARTE 4: PERSPECTIVA DE NEGOCIO Y GO-TO-MARKET

### 4.1 Modelo de monetización — Decisión más importante

**Opción A — Freemium + Comisión (recomendado)**
- Plan gratuito real y usable (citas + agenda + 1 sede)
- Comisión del 2% en pagos online procesados por Gestabiz
- Plans de pago para features avanzados (permisos, multi-sede, reportes, marketing)
- **Por qué**: baja la barrera de entrada a cero, la comisión escala con el negocio, Fresha creció a 100K+ negocios así

**Opción B — SaaS puro por sede**
- Plan gratuito limitado (1 empleado, 50 citas/mes)
- $80K COP/mes por sede (plan actual)
- Planes más altos para más features
- **Por qué**: ingresos predecibles, más simple de gestionar

**Opción C — Híbrido**
- Freemium + comisión para negocios pequeños
- SaaS fijo para negocios medianos-grandes (>5 empleados)
- **Por qué**: captura ambos segmentos

**Mi recomendación**: empezar con Opción A (freemium + comisión). El mercado LATAM es extremadamente sensible al precio. Cobrar desde el día 1 mata la adopción. Fresha demostró que "gratis para siempre" + comisión en pagos es el modelo ganador.

### 4.2 Estrategia de Go-to-Market para Colombia

#### Fase 1: Validación (0-50 negocios) — AHORA
- **Canal**: outreach directo en Bogotá y Medellín
- **Vertical**: salones de belleza y barberías (mercado más grande, ciclo de venta más corto)
- **Pitch**: "Gestiona tu agenda gratis, cobra online y reduce no-shows"
- **Acción**: visitar 10 salones/barberías por semana, configurar la app EN PERSONA, dar soporte por WhatsApp
- **Meta**: 50 negocios activos con al menos 1 cita/semana cada uno
- **KPI**: Weekly Active Businesses (WAB)

#### Fase 2: Tracción (50-500 negocios)
- **Canal**: referidos (programa de referidos activo), SEO (blog + directorios), redes sociales
- **Vertical**: expandir a clínicas de salud/bienestar, gimnasios
- **Pitch**: casos de éxito reales de los primeros 50 negocios
- **Acción**: landing pages por ciudad/vertical, contenido de blog 2x/semana, videos cortos para Instagram/TikTok
- **Meta**: 500 WAB, NPS > 40

#### Fase 3: Escala (500-5,000 negocios)
- **Canal**: SEO orgánico, alianzas con proveedores de insumos, Cámaras de Comercio
- **Vertical**: todas las verticales soportadas
- **Acción**: equipo de ventas (2-3 personas), automatización de marketing, marketplace premium
- **Meta**: 5,000 WAB, revenue positivo

#### Fase 4: Expansión LATAM (5,000+ negocios)
- **Países**: México primero (mercado más grande), luego Argentina, Chile, Perú
- **Acción**: adaptar moneda, impuestos, festivos, gateways de pago por país
- **Meta**: presencia en 3+ países

### 4.3 Competidores — Cómo ganarles

| Competidor | Debilidad que explotar | Tu ventaja |
|------------|----------------------|------------|
| **Fresha** | Soporte solo en inglés, no entiende regulación colombiana | Soporte en español por WhatsApp, impuestos CO |
| **Booksy** | Caro para el mercado colombiano | Precio en COP, plan gratuito |
| **Agenda Pro** | Solo agenda, sin contabilidad ni permisos | Suite completa todo-en-uno |
| **TurnoPro** | UI anticuada, sin pagos online | UX moderna, multi-gateway |
| **Mindbody** | $139 USD/mes, excesivo para PyMEs LATAM | 10x más barato, mismas features core |
| **Vagaro** | Cobro por usuario, sin presencia LATAM real | Cobro por sede, hecho para LATAM |

**Mensaje diferenciador**: "El Fresha de Latinoamérica — gratis para siempre, hecho para tu negocio"

### 4.4 Métricas de negocio a trackear desde el día 1

| Métrica | Meta inicial | Por qué |
|---------|-------------|---------|
| **WAB** (Weekly Active Businesses) | 50 en 3 meses | Métrica estrella de retención |
| **Time to first booking** | < 10 min | Si tarda más, se van |
| **Activation rate** | > 40% | % que completa onboarding |
| **No-show rate de negocios** | Medir baseline, reducir 30% | Argumento de venta #1 |
| **NPS** | > 40 | Satisfacción general |
| **Churn mensual** | < 5% | Salud del negocio |
| **Revenue per business** | Cualquier número > 0 | Validar modelo de monetización |

---

## PARTE 5: QUÉ HACER Y QUÉ NO HACER

### HAZ ESTO

1. **Arregla los tests y ponlos en CI ANTES de agregar features** — cada feature nueva sin tests es deuda que crece exponencialmente
2. **Implementa el onboarding wizard** — es más importante que cualquier feature nueva. Un negocio que no configura no paga, no refiere, no se queda.
3. **Publica la app móvil en stores** — aunque sea una v1 básica. La presencia en stores da legitimidad y acceso al 70% del mercado.
4. **Limpia los console.logs y los `as any`** — es deuda técnica que se acumula y explota en el peor momento.
5. **Rota el Service Role Key de PROD** — es un incidente de seguridad pendiente.
6. **Elige UNA vertical y domínala** — salones de belleza en Bogotá es el candidato ideal.
7. **Consigue 10 negocios reales usándola** antes de agregar más features — el feedback real vale más que 100 features.
8. **Implementa depósitos al reservar** — monetiza desde el primer uso y resuelve el dolor #1.
9. **Configura monitoreo de uptime** — si se cae y no te enteras, pierdes negocios.
10. **Documenta la arquitectura** con diagramas (no solo CLAUDE.md) — si mañana necesitas un co-founder técnico o un empleado, necesitan entender el sistema.

### NO HAGAS ESTO

1. **No agregues más features sin arreglar la base** — 47 tests rotos, 856 `as any`, 2,092 console.logs. Cada feature nueva sobre esta base es construir sobre arena.
2. **No intentes vender a todas las verticales a la vez** — "software para tu negocio" no convierte. "Software para tu salón" sí.
3. **No gastes en marketing pagado todavía** — hasta que el onboarding no esté afinado, cada lead es dinero quemado.
4. **No compitas en features contra Fresha** — ellos tienen 500 ingenieros. Compite en cercanía, soporte en español, precio justo para LATAM, y entendimiento del mercado local.
5. **No dejes que el scope crezca sin podar** — cada feature que agregas es una feature que mantener. Si no la usa nadie, elimínala.
6. **No descuides la seguridad** — un incidente de datos con negocios reales en Colombia activa la SIC (Superintendencia de Industria y Comercio) y puede matar el negocio.
7. **No ignores el mobile** — en LATAM, mobile-first no es una preferencia, es la realidad.
8. **No lances en múltiples países sin dominar Colombia** — cada país es un producto diferente (impuestos, pagos, regulación, cultura).

---

## PARTE 6: PUNTOS DE INFLEXIÓN

### Punto 1: Primer negocio que paga (Validación del modelo)
- **Qué significa**: alguien encontró suficiente valor para sacar la tarjeta de crédito.
- **Qué hacer**: entender exactamente POR QUÉ pagó, qué feature le convenció, y replicar eso.
- **Riesgo**: si nadie paga en los primeros 3 meses con 50 negocios, el modelo de precios necesita cambiar.

### Punto 2: 50 WAB (Product-Market Fit signal)
- **Qué significa**: hay demanda real recurrente.
- **Qué hacer**: medir NPS, identificar features más usadas, duplicar lo que funciona.
- **Riesgo**: si el churn > 10% mensual, el producto no está resolviendo el problema bien.

### Punto 3: Primer referido orgánico
- **Qué significa**: un negocio le recomendó Gestabiz a otro sin que se lo pidieras.
- **Qué hacer**: crear programa de referidos formal, premiar al referidor.
- **Esto es más valioso que cualquier campaña de marketing.**

### Punto 4: 500 WAB (Escalabilidad)
- **Qué significa**: la infraestructura se pone a prueba. Supabase free tier ya no alcanza.
- **Qué hacer**: migrar a plan Pro de Supabase, optimizar queries, implementar caching serio.
- **Riesgo**: si la app se cae o se pone lenta, los negocios migran rápido.

### Punto 5: Primer empleado/co-founder
- **Qué significa**: ya no puedes hacer todo solo.
- **Qué hacer**: la documentación (CLAUDE.md, Obsidian, diagramas) se vuelve crítica. Sin ella, el onboarding del nuevo miembro toma meses.

### Punto 6: Primer país fuera de Colombia
- **Qué significa**: el producto es generalizable.
- **Qué hacer**: abstraer todo lo que es Colombia-específico (impuestos, festivos, gateways) en módulos por país.

---

## PARTE 7: ROADMAP TÉCNICO PRIORIZADO

### Sprint 0: Estabilización (Antes de CUALQUIER feature nueva)
- [ ] Rotar Service Role Key de PROD
- [ ] Habilitar RLS en `cron_execution_logs`
- [ ] Agregar idempotencia a webhooks de pago
- [ ] Limpiar `.env` y `.env.staging` del repo
- [ ] Arreglar los 47 tests rotos
- [ ] Agregar tests al CI/CD (bloquear deploy si fallan)
- [ ] Agregar pre-commit hooks (Husky + lint-staged)
- [ ] Limpiar console.logs (ejecutar `remove-console-logs.js` en build)
- [ ] `queryClient.clear()` en logout
- [ ] Validar Supabase credentials en startup (no caer a mock silenciosamente)

### Sprint 1: Onboarding + Mobile
- [ ] Wizard de configuración inicial (5 pasos)
- [ ] Checklist de completitud visible en dashboard
- [ ] Negocio demo precargado
- [ ] Publicar app móvil en App Store y Google Play (v1 básica)
- [ ] Push notifications en mobile

### Sprint 2: Monetización inmediata (Fase 2 features)
- [ ] UI de cupones/descuentos (BD lista)
- [ ] Depósito/prepago al reservar (BD lista)
- [ ] Nómina/comisiones UI (BD lista)
- [ ] Programa de fidelización (puntos/sellos)
- [ ] Lista de espera (waitlist)

### Sprint 3: Adquisición (SEO + Integraciones)
- [ ] Google Reserve integration
- [ ] Instagram booking button
- [ ] Widget de reserva embebible
- [ ] Landing pages por ciudad/vertical (programmatic SEO)
- [ ] Blog con contenido útil (2 posts/semana)

### Sprint 4: Retención y valor (Fase 3)
- [ ] Marketing directo (campañas email/WhatsApp)
- [ ] Paquetes y membresías
- [ ] Formularios de ingreso por servicio
- [ ] Reservas recurrentes
- [ ] Resumen semanal automático por email

### Sprint 5: Diferenciación (Fase 4)
- [ ] IA para reservas por WhatsApp
- [ ] Análisis predictivo / BI
- [ ] Marketplace premium con publicidad
- [ ] Facturación electrónica (Matias API)

---

## PARTE 8: CHECKLIST DE PRODUCCIÓN

### Antes de escalar a negocios reales:
- [ ] Monitoreo de uptime configurado (UptimeRobot/Checkly)
- [ ] Página de status pública
- [ ] Backups automáticos verificados
- [ ] Plan de Supabase adecuado al volumen
- [ ] Rate limiting en Edge Functions
- [ ] Política de privacidad y Habeas Data (Ley 1581)
- [ ] Términos de servicio publicados
- [ ] Exportación de datos para negocios
- [ ] 2FA para cuentas de owner
- [ ] Sentry al 100% sampling hasta estabilizar
- [ ] Core Web Vitals medidos y optimizados
- [ ] PWA instalable y funcional offline (al menos agenda del día)

---

## PARTE 9: VISIÓN — CÓMO SE VE EL ÉXITO

### 6 meses: Validación
- 50+ negocios activos en Bogotá/Medellín
- NPS > 40, churn < 5%
- Primer ingreso real (comisión o suscripción)
- App en stores

### 12 meses: Tracción
- 500+ WAB en Colombia
- 3+ casos de éxito documentados
- Revenue mensual recurrente (MRR) > $5M COP
- Equipo de 2-3 personas

### 24 meses: Escala
- 5,000+ WAB
- Presencia en 2+ países LATAM
- MRR > $50M COP
- IA de reservas por WhatsApp activa
- Marketplace con listings premium

### 36 meses: Dominio LATAM
- 20,000+ WAB
- Marca reconocida en el sector
- "El Fresha de Latinoamérica"

---

*Última actualización: 13 Abril 2026 — Claude Code*

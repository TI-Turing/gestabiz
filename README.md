# Gestabiz

**Plataforma SaaS todo-en-uno de gestión de citas y negocios para PyMEs de servicios en Colombia y Latinoamérica.**

![Version](https://img.shields.io/badge/versión-0.0.69-blueviolet)
![License](https://img.shields.io/badge/licencia-Propietaria-red)
![Status](https://img.shields.io/badge/estado-BETA-orange)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6)
![Supabase](https://img.shields.io/badge/Supabase-2.57-3ecf8e)

> **Aviso legal**: Este repositorio es software propietario exclusivo de [Ti Turing](https://github.com/TI-Turing). La visibilidad pública de este repositorio **no otorga ningún derecho de uso, copia o distribución**. Ver [LICENSE](./LICENSE).

---

## Descripción

Gestabiz elimina la necesidad de múltiples herramientas independientes para negocios de servicios: salones, barberías, clínicas, gimnasios, spas, consultorios, entrenadores personales y coworkings. Todo en una sola plataforma con gestión de citas, clientes, empleados, contabilidad, reclutamiento y más.

**Superficies:**
- **Web**: React SPA (Vite) — principal
- **Móvil**: Expo / React Native (`src/mobile/`)
- **Extensión de navegador**: Chrome Extension (`extension/`, `src/browser-extension/`)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript 5.7 + Vite 6 |
| Estilos | Tailwind CSS 4 + Radix UI + shadcn/ui |
| Backend | Supabase Cloud (PostgreSQL 15+, RLS, Edge Functions Deno) |
| Auth | Supabase Auth (email, Google OAuth, magic link) |
| Pagos | MercadoPago · Stripe · PayU Latam |
| Notificaciones | Brevo (email) · AWS SNS (SMS) · WhatsApp Business API |
| Analytics | Google Analytics 4 (GDPR-compliant, consent mode) |
| Monitoreo | Sentry (error tracking) |
| Deploy | Vercel (frontend) + Supabase Cloud (backend) |
| CI/CD | GitHub Actions |
| State | React Query 5 + Zustand |
| Mobile | Expo / React Native |

---

## Módulos del Sistema

### Gestión de Citas
- Wizard multi-paso: selección de negocio → sede → servicio → empleado → fecha/hora → confirmación
- Validación en tiempo real: horarios de sede, almuerzo del empleado, festivos colombianos, ausencias aprobadas, conflictos de overlap
- Confirmación y cancelación por email con tokens seguros (`/confirmar-cita/:token`, `/cancelar-cita/:token`, `/reprogramar-cita/:token`)
- Sincronización con Google Calendar
- Soporte para empleados y recursos físicos (salas, mesas, canchas, equipos)

### Sistema de Roles Dinámicos
- **OWNER** — bypass total de permisos, sin queries adicionales, tambien es usuario Admin
- **ADMIN** — gestión completa del negocio
- **EMPLOYEE** — manager, professional, receptionist, accountant, support_staff
- **CLIENT** — reserva de citas y reviews
- Un usuario puede ser admin de un negocio, empleado de otro y cliente de cualquiera simultáneamente

### Permisos Granulares
- 79 tipos de permisos organizados en 16 categorías
- 9 plantillas predefinidas (Admin Completo, Vendedor, Cajero, Recepcionista, etc.)
- Componente `<PermissionGate>` con modos `hide`, `disable`, `show`
- 1.919+ registros en producción
- Owner bypass: verificación instantánea sin queries adicionales (99.4% más rápido)

### Facturación y Planes
- Plan Gratuito, Inicio ($79.900/mes), Profesional, Empresarial
- Integración completa con MercadoPago (Colombia/LATAM), Stripe (global), PayU (Colombia)
- Webhooks para activación automática de planes tras pago exitoso
- Facturación con IVA colombiano
- Dashboard de facturación con historial de pagos y métricas de uso

### Sistema Contable
- Transacciones de ingreso y gasto categorizadas
- Impuestos automáticos: IVA, ICA, Retención en la Fuente (Colombia)
- Reportes P&L automáticos exportables en PDF, CSV y Excel
- 5 tipos de gráficos: tendencia mensual, categorías (pie), ingresos vs gastos, por sede, por empleado

### Empleados y Jerarquía
- Gestión completa: contratación, horarios 7 días, salarios, tipos de contrato
- Árbol jerárquico visual interactivo
- Transferencia de sedes con cancelación automática de citas futuras
- Portal de reclutamiento: vacantes, aplicaciones, matching inteligente con detección de conflictos
- Ausencias y vacaciones con aprobación obligatoria del admin

### Clientes
- CRM con historial completo de visitas por negocio
- Perfil público del negocio con SEO (`/negocio/:slug`)
- Búsqueda con 6 algoritmos de ordenamiento y full-text search (trigram GIN)
- Flujo de reserva sin login con redirección post-autenticación

### Chat en Tiempo Real
- Mensajería entre clientes y empleados del negocio
- Adjuntos de archivos (bucket `chat-attachments`)
- Indicadores de escritura, recibos de lectura
- Notificaciones por email para mensajes no leídos
- Filtro: solo empleados con `allow_client_messages = true`

### Notificaciones Multicanal
- 17 tipos de notificaciones (citas, empleados, vacantes, ausencias, sistema)
- Canales: Email (Brevo), SMS (AWS SNS), WhatsApp Business API, In-app
- Recordatorios automáticos programables
- Mapeo de tipo → rol → navegación automática

### Reviews y Calificaciones
- Reviews de negocio y empleado por clientes con citas completadas
- Respuestas del negocio, control de visibilidad
- Vistas materializadas `business_ratings_stats` y `employee_ratings_stats`

### Internacionalización (i18n)
- Español e Inglés
- ~44 archivos de traducción por idioma (~2.200 claves type-safe)
- Hook `useLanguage()` con auto-completado TypeScript

---

## Infraestructura Supabase

| Componente | Detalle |
|-----------|---------|
| Base de datos | PostgreSQL 15+ con 40+ tablas |
| Edge Functions | ~49 funciones Deno desplegadas |
| Autenticación | Supabase Auth con OAuth y magic links |
| Almacenamiento | Buckets: `avatars`, `cvs`, `chat-attachments`, `bug-report-evidences` |
| Seguridad | RLS en todas las tablas sin excepción |
| Festivos | 54 festivos colombianos 2025–2027 |

**Proyectos Supabase:**
- **DEV**: `dkancockzvcqorqbwtyh` (datos de prueba)
- **PROD**: `emknatoknbomvmyumqju` (producción limpia)

---

## SEO y Páginas Públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page principal |
| `/negocio/:slug` | Perfil público del negocio (indexable por Google) |
| `/profesional/:employeeId` | Perfil público del profesional |
| `/para/:vertical` | 10 landing pages verticales por industria |
| `/directorio/:categoria/:ciudad` | Directorio de negocios por categoría y ciudad |
| `/blog` | Blog con contenido para SEO |
| `/blog/:slug` | 5 artículos publicados |
| `/terminos` | Términos y condiciones |
| `/privacidad` | Política de privacidad (Ley 1581/2012) |
| `/cookies` | Política de cookies |
| `/contacto` | Página de contacto |

**Verticales disponibles:** salones, barberías, clínicas, psicólogos, fisioterapeutas, odontólogos, gimnasios, spas, entrenadores, coworkings

**Blog posts publicados:**
1. Cómo reducir ausencias en citas con WhatsApp
2. Los 5 mejores software para salones de belleza en Colombia (2026)
3. Gestabiz vs Calendly: ¿cuál es mejor para Colombia?
4. Cómo digitalizar tu negocio de servicios en Colombia en 2026
5. 7 ventajas de tener una agenda online para tu negocio

---

## Estructura del Proyecto

```
gestabiz/
├── src/
│   ├── App.tsx                     # Raíz: rutas + providers
│   ├── components/
│   │   ├── admin/                  # Dashboard admin (15 módulos)
│   │   ├── employee/               # Dashboard empleado
│   │   ├── client/                 # Dashboard cliente
│   │   ├── landing/                # Landing page pública
│   │   ├── billing/                # Facturación y planes
│   │   ├── appointments/           # Wizard de citas
│   │   ├── accounting/             # Contabilidad y reportes
│   │   ├── chat/                   # Chat en tiempo real
│   │   ├── jobs/                   # Portal de reclutamiento
│   │   ├── cards/                  # Componentes self-fetch por ID
│   │   ├── settings/               # Configuraciones unificadas
│   │   └── ui/                     # Radix UI + componentes custom
│   ├── contexts/                   # Auth, Theme, Language, AppState
│   ├── hooks/                      # 70+ hooks personalizados
│   ├── lib/
│   │   ├── supabase.ts             # Cliente Supabase singleton
│   │   ├── services/               # Capa de servicios (CRUD)
│   │   ├── payments/               # PaymentGatewayFactory
│   │   └── permissions-v2.ts       # Permisos granulares
│   ├── locales/                    # i18n (es/ + en/, ~44 archivos)
│   ├── pages/                      # 15 páginas de nivel superior
│   ├── data/                       # Blog posts, verticales
│   └── types/                      # TypeScript types
├── supabase/
│   ├── functions/                  # ~49 Edge Functions Deno
│   └── migrations/                 # 40+ migraciones SQL
├── src/mobile/                     # Expo / React Native
├── extension/                      # Chrome Extension
├── api/                            # Vercel Edge Functions (SSR/SEO)
├── scripts/                        # Automatización y utilidades
├── .github/workflows/              # CI/CD (GitHub Actions)
├── .claude/                        # Configuración Claude Code MCP
└── Obsidian/Gestabiz/              # Vault de notas del proyecto
```

---

## Comandos

```bash
# Desarrollo
npm run dev              # Vite dev server (http://localhost:5173)
npm run build            # Build de producción
npm run type-check       # TypeScript sin emitir
npm run lint             # ESLint con auto-fix
npm run test             # Vitest

# Base de datos (Supabase CLI)
npx supabase db push --dns-resolver https --yes   # Aplicar migraciones
npx supabase functions deploy <nombre>            # Deploy edge function
npx supabase migration list --dns-resolver https  # Ver estado migraciones

# Utilidades
npm run db:seed          # Generar datos de prueba
npm run generate-sitemap # Generar sitemap.xml
npm run pre-deploy       # Checks pre-deploy
```

---

## Variables de Entorno

```bash
# Frontend (.env.development / .env.production)
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...        # Formato nuevo (no JWT legacy)
VITE_APP_URL=https://gestabiz.com
VITE_PAYMENT_GATEWAY=mercadopago                 # mercadopago | stripe | payu
VITE_GOOGLE_CLIENT_ID=...
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Edge Functions (Supabase Secrets)
BREVO_API_KEY, BREVO_SMTP_*
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
MERCADOPAGO_ACCESS_TOKEN
PAYU_API_KEY, PAYU_MERCHANT_ID
WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
```

> **Importante**: Las claves `VITE_SUPABASE_ANON_KEY` deben usar el formato nuevo `sb_publishable_*`. Los JWT legacy (`eyJ...`) están deshabilitados desde Abril 2026.

---

## Deploy

**Frontend**: Vercel — push a `main` despliega automáticamente a producción.

**Backend**: Supabase Cloud — migraciones y edge functions se despliegan vía CLI o CI/CD.

**CI/CD**: GitHub Actions (`.github/workflows/`) ejecuta type-check, lint, tests y deploy en cada PR a `main`.

---

## Convenciones de Versionado

- **PATCH** (0.0.x) — cada commit
- **MINOR** (0.x.0) — releases funcionales
- **MAJOR** (x.0.0) — cambios disruptivos de arquitectura

Versión actual: **0.0.69**

---

## Autor y Contacto

**Desarrollado por [Ti Turing](https://github.com/TI-Turing)**

- Autor: Jose Luis Avila (jlap.11@hotmail.com) — [@jlap11](https://github.com/jlap11)
- Organización: [TI-Turing](https://github.com/TI-Turing)
- Repositorio: [github.com/TI-Turing/Gestabiz](https://github.com/TI-Turing/Gestabiz)
- Deploy: [gestabiz.com](https://gestabiz.com)

---

## Licencia

Copyright (c) 2024–2026 Ti Turing. **Todos los derechos reservados.**

Este software es **propietario y confidencial**. La visibilidad pública de este repositorio no otorga ningún derecho de uso, copia, modificación ni distribución. Ver [LICENSE](./LICENSE) para los términos completos.

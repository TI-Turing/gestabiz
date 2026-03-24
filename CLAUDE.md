# CLAUDE.md — Guía para Claude Code en Gestabiz

> **NOTA DE MIGRACIÓN**: Este archivo fue originalmente creado como instrucciones para **GitHub Copilot**. En Marzo 2026 se migró a **Claude Code** (Anthropic) como asistente principal de desarrollo.

> **Gestabiz** — Sistema SaaS de gestión de citas y negocios
> **Stack**: React 19 + TypeScript 5.7 + Vite 6 + Supabase + Tailwind 4
> **Versión actual**: 0.0.40 (incrementar PATCH en cada commit)
> **Estado**: BETA completada — solo bugs, optimizaciones y features puntuales

---

## RESUMEN EJECUTIVO

Gestabiz es una plataforma SaaS **todo-en-uno** para PyMEs de servicios (salones, clínicas, gimnasios, centros deportivos, hoteles, restaurantes, coworkings) que elimina la necesidad de múltiples herramientas independientes. Opera en Colombia con expansión latam (soporta Stripe, PayU y MercadoPago).

**Superficies**:
- **Web**: React SPA (Vite) — principal
- **Móvil**: Expo/React Native en `src/mobile/`
- **Extensión de navegador**: en `extension/` y `src/browser-extension/`

**Backend**: 100% Supabase Cloud (PostgreSQL 15+, RLS, Edge Functions Deno, Realtime, Storage)

**MCP configurados** (proyecto + global):

| Servidor | Alcance | Propósito |
|----------|---------|-----------|
| `supabase` | Proyecto (`.claude/mcp.json`) | SQL directo, migraciones, Edge Functions. DEV: `dkancockzvcqorqbwtyh` / PROD: `emknatoknbomvmyumqju` |
| `chrome-devtools` | Proyecto (`.claude/mcp.json`) | Inspección de Network, Console y DOM en tiempo real |
| `pencil` | Global (`~/.claude/settings.json`) | Editor de diseño `.pen` — generar y editar pantallas UI/UX |
| `claude-mem` | Global (plugin `claude-mem@thedotmack`) | Memoria persistente cross-sesión: `make-plan`, `do`, `mem-search`, `smart-explore` |
| `vercel` | Local (`.claude/settings.local.json`) | Listar teams, proyectos y configuración de deploys |
| `canva` | Global (Canva MCP) | Crear, editar y exportar diseños en Canva |
| `sentry` | Global (Sentry MCP) | Buscar y analizar issues, errores y tracks en Sentry |

---

## SISTEMA DE MEMORIA EN CAPAS

El proyecto usa **tres capas de persistencia** complementarias:

| Capa | Ubicación | Para qué sirve |
|------|-----------|----------------|
| **Auto-Memory** | `~/.claude/projects/.../memory/` | Preferencias, feedback, contexto de usuario — cargado automáticamente al inicio de sesión |
| **claude-mem MCP** | Índice semántico cross-sesión | Decisiones técnicas, trabajo anterior, búsqueda por `mem-search` |
| **Vault Obsidian** | `Obsidian/Gestabiz/` en el repo | Notas legibles por humanos: decisiones, bugs, sesiones, features |

### Vault Obsidian — Ruta y Estructura

**Ruta absoluta**: `C:/Users/Usuario/source/repos/TI-Turing/gestabiz/Obsidian/Gestabiz/`

```
Obsidian/Gestabiz/
├── Índice.md              # Guía del vault
├── Decisiones/            # Decisiones arquitectónicas y trade-offs
├── Bugs/                  # Bugs conocidos, gotchas, soluciones
├── Sesiones Claude/       # Resúmenes de sesiones importantes
├── Features/              # Specs de features en desarrollo o pendientes
└── Contexto/              # Contexto de negocio, roadmap, usuarios
```

### Convención: "recuerda X" / "guarda una nota de X"

Cuando el usuario diga **"recuerda X"**, **"guarda esto"**, **"toma nota de"** o similar:

1. **Crear nota en Obsidian** en la carpeta apropiada:
   - Decisión técnica → `Decisiones/`
   - Bug o gotcha → `Bugs/`
   - Feature o spec → `Features/`
   - Contexto general → `Contexto/`
   - Resumen de sesión → `Sesiones Claude/`

2. **Guardar también en Auto-Memory** (`memory/` files) si es relevante para sesiones futuras

3. **Formato de nota Obsidian**:
```markdown
---
date: YYYY-MM-DD
tags: [tag1, tag2]
---

# Título

Contenido de la nota...
```

**Esta convención está siempre activa** — no necesita configuración adicional por sesión.

---

**Skills disponibles** (invocar con `/nombre` o `Skill tool`):

| Skill | Cuándo usarlo |
|-------|---------------|
| `claude-mem:make-plan` | Planificar features o tareas multi-paso antes de implementar |
| `claude-mem:do` | Ejecutar un plan generado por `make-plan` con subagentes |
| `claude-mem:mem-search` | Buscar decisiones o trabajo de sesiones anteriores |
| `claude-mem:smart-explore` | Explorar estructura de código con AST (más eficiente que leer archivos) |
| `simplify` | Revisar código recién escrito para calidad y reutilización |
| `update-config` | Configurar `settings.json`: hooks, permisos, variables de entorno |
| `schedule` | Crear agentes programados con cron |
| `loop` | Ejecutar un comando en intervalo recurrente |
| `claude-api` | Construir integraciones con Claude API / Anthropic SDK |

**Agentes especializados** (usan el `Agent tool` internamente):

| Agente | Cuándo usarlo |
|--------|---------------|
| `supabase-agent` | Migraciones SQL, Edge Functions Deno, RLS, triggers, optimización de queries |
| `qa-reviewer` | Revisar código antes de commit — detecta anti-patterns de Gestabiz |
| `i18n-gestabiz` | Agregar/auditar claves de traducción ES/EN en los ~44 archivos de locales |
| `launch-checker` | Verificar checklist de lanzamiento a producción |
| `gtm-instagram-outreach` | Generar DMs de Instagram para outreach de Gestabiz en Colombia |
| `marketing-agent` | Crear piezas visuales para redes sociales (Instagram, Facebook, TikTok) usando Canva MCP y Pencil MCP. Entrega diseño + caption + hashtags listos para publicar |
| `Explore` | Exploración de codebase por patrón, keyword o pregunta arquitectónica |
| `Plan` | Diseñar plan de implementación antes de codear |
| `claude-code-guide` | Responder preguntas sobre Claude Code CLI, MCP servers, API de Anthropic |
| `statusline-setup` | Configurar el status line de Claude Code en `settings.json` |
| `general-purpose` | Investigación compleja, búsquedas multi-paso o tareas que no encajan en otros agentes |

---

## PRINCIPIOS DE DESARROLLO — LEER ANTES DE CODEAR

1. **No generar archivos `.md`** salvo solicitud explícita
2. **Nunca usar emojis en componentes UI** — solo iconos Phosphor Icons o Lucide React
3. **Conservar diseño original** — al agregar campos, seguir estilos existentes sin eliminar código funcional
4. **Cliente Supabase singleton** — un solo export en `src/lib/supabase.ts`. Nunca crear `createClient()` adicionales
5. **Roles dinámicos** — calculados en tiempo real, nunca persistidos en BD
6. **TypeScript strict** — cero `any`, tipado completo, usar `unknown` cuando sea necesario
7. **Proteger con PermissionGate** — TODOS los botones de acción deben estar protegidos
8. **Incrementar versión en cada commit** — actualizar `package.json`. Patrón: PATCH en cada commit, MINOR en releases, MAJOR en cambios disruptivos
9. **Reutilizar Card Components** — ver sección "Sistema de Cards Reutilizables"
10. **useAuth() nunca useAuthSimple()** — siempre consumir desde el context

---

## ARQUITECTURA Y ESTRUCTURA

### Árbol de directorios clave

```
gestabiz/
├── src/
│   ├── App.tsx                    # Raíz: rutas públicas + privadas, providers
│   ├── components/
│   │   ├── MainApp.tsx            # Enrutador de roles (Admin/Employee/Client)
│   │   ├── admin/                 # Dashboard admin y todos sus módulos
│   │   │   ├── ClientsManager.tsx     # CRM clientes del negocio (admin)
│   │   │   ├── SalesHistoryPage.tsx   # Historial de ventas/citas completadas (admin)
│   │   │   └── ClientProfileModal.tsx # Modal perfil cliente — compartido admin+empleado
│   │   ├── employee/              # Dashboard empleado
│   │   │   └── EmployeeClientsPage.tsx # Clientes atendidos por el empleado
│   │   ├── client/                # Dashboard cliente
│   │   ├── appointments/          # AppointmentWizard (wizard multi-paso)
│   │   ├── absences/              # AbsenceRequestModal, VacationDaysWidget, ApprovalCard
│   │   ├── accounting/            # Charts: CategoryPie, EmployeeRevenue, IncomeVsExpense, etc.
│   │   ├── auth/                  # AuthScreen, EmailVerification, GoogleAuthCallback
│   │   ├── billing/               # BillingDashboard, PaymentHistory, PlanUpgradeModal
│   │   ├── business/              # BusinessProfile, BusinessRegistration, ChatWithAdminModal
│   │   ├── cards/                 # Componentes self-fetch por ID (ver sección Cards)
│   │   ├── catalog/               # CitySelect, CountrySelect, DocumentTypeSelect, GenderSelect, etc.
│   │   ├── chat/                  # ChatLayout, ChatWindow, ConversationList, FloatingChatButton
│   │   ├── dashboard/             # ClientDashboard, AppointmentsView, AdvancedFilters, financial/
│   │   ├── jobs/                  # RecruitmentDashboard, VacancyCard, ApplicationList, etc.
│   │   ├── landing/               # LandingPage pública
│   │   ├── layouts/               # UnifiedLayout (layout con sidebar para todos los roles)
│   │   ├── notifications/         # NotificationBell, NotificationCenter
│   │   ├── reviews/               # ReviewCard, ReviewForm, ReviewList
│   │   ├── sales/                 # QuickSaleForm
│   │   ├── settings/              # CompleteUnifiedSettings (admin+employee+client)
│   │   ├── transactions/          # EnhancedFinancialDashboard, TransactionForm, TransactionList
│   │   └── ui/                    # Radix UI + custom: PermissionGate, OwnerBadge, etc.
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Singleton auth (wraps useAuthSimple ONCE)
│   │   ├── AppStateContext.tsx    # Loading, errores, toasts globales
│   │   ├── LanguageContext.tsx    # i18n con hook useLanguage() y t()
│   │   ├── NotificationContext.tsx
│   │   └── ThemeContext.tsx / ThemeProvider.tsx
│   ├── hooks/                     # 70+ hooks personalizados (ver sección Hooks)
│   ├── lib/
│   │   ├── supabase.ts            # CLIENTE SINGLETON — único archivo con createClient()
│   │   ├── services/              # Capa de servicios: appointments, businesses, clients,
│   │   │                          #   locations, profiles, resources, services, stats,
│   │   │                          #   userSettings, permissionRPC
│   │   ├── payments/              # PaymentGatewayFactory, Stripe/PayU/MercadoPago gateways
│   │   ├── permissions-v2.ts      # Lógica de permisos granulares v2
│   │   ├── permissions.ts         # Permisos legacy (mantener por compatibilidad)
│   │   ├── queryConfig.ts         # QUERY_CONFIG: STABLE/FREQUENT/REALTIME + KEYS centralizadas
│   │   ├── translations.ts        # Traducciones legacy (siendo reemplazadas por /locales)
│   │   ├── pricingPlans.ts        # Definición centralizada de planes (Gratuito/Inicio/Pro/Empresarial)
│   │   ├── notificationRoleMapping.ts  # Mapeo 30+ tipos notif → rol requerido
│   │   ├── hierarchyService.ts    # Servicio para jerarquía de empleados
│   │   └── ...otros utils
│   ├── locales/                   # Sistema i18n modular (ver sección i18n)
│   │   ├── es/                    # ~44 archivos de traducción en español
│   │   ├── en/                    # ~44 archivos de traducción en inglés
│   │   ├── index.ts
│   │   └── types.ts
│   ├── pages/                     # Páginas de nivel superior
│   │   ├── PublicBusinessProfile.tsx   # /negocio/:slug — indexable por Google
│   │   ├── QuickSalesPage.tsx
│   │   ├── AppointmentConfirmation.tsx # /confirmar-cita/:token
│   │   ├── AppointmentCancellation.tsx # /cancelar-cita/:token
│   │   └── AdminTestDataPage.tsx
│   ├── types/
│   │   ├── types.ts               # Tipos principales: UserRole, Business, Appointment, etc.
│   │   ├── accounting.types.ts    # Tipos del sistema contable
│   │   ├── supabase.gen.ts        # Tipos generados por Supabase CLI
│   │   └── index.ts
│   └── constants/index.ts         # APP_CONFIG, BUSINESS_CONFIG, UI_CONFIG
├── supabase/
│   ├── functions/                 # ~50 Edge Functions Deno
│   └── migrations/                # 40+ migraciones SQL aplicadas
├── scripts/                       # Scripts de automatización (demo data, export, etc.)
├── extension/                     # Extensión Chrome básica
├── src/browser-extension/         # Extensión Chrome mejorada
├── .claude/
│   ├── mcp.json                   # MCP servers para Claude Code (Supabase + Chrome DevTools)
│   └── settings.local.json
└── .vscode/
    ├── mcp.json                   # MCP servers para VS Code
    └── tasks.json                 # Tasks de Supabase CLI
```

### Rutas de la aplicación (App.tsx)

| Ruta | Acceso | Componente |
|------|--------|------------|
| `/` | Público | LandingPage |
| `/login` | Público | AuthScreen |
| `/register` | Público | AuthScreen |
| `/negocio/:slug` | Público | PublicBusinessProfile |
| `/confirmar-cita/:token` | Público | AppointmentConfirmation |
| `/cancelar-cita/:token` | Público | AppointmentCancellation |
| `/app/*` | Autenticado | MainApp → Admin/Employee/Client Dashboard |
| `/permission-testing` | Dev only | PermissionTestingPage |

### Stack de Providers (orden en App.tsx)

```
ErrorBoundary → BrowserRouter → QueryClientProvider → ThemeProvider →
LanguageProvider → AppStateProvider → AuthProvider → AlertProvider →
  AppRoutes + CookieConsent + Toaster
```

---

## SISTEMA DE ROLES

### Jerarquía de roles (calculados dinámicamente, nunca persistidos)

- **OWNER**: `businesses.owner_id === auth.uid()` → bypass TOTAL de permisos, sin queries adicionales
- **ADMIN**: registrado en `business_roles` con `role = 'admin'`. Trigger `trg_auto_insert_admin_as_employee` lo registra automáticamente en `business_employees` como `manager`
- **EMPLOYEE**: registrado en `business_employees`. Puede ofrecer servicios (`offers_services = true`). Roles posibles: `manager`, `professional`, `receptionist`, `accountant`, `support_staff`
- **CLIENT**: cualquier usuario sin entrada en business_roles/business_employees. Solo ve sus citas

**Multi-negocio**: un usuario puede ser admin de negocio A, employee de negocio B, y client en cualquier negocio simultáneamente.

**Hook de roles**: `useUserRoles(user)` → `{ roles, activeRole, activeBusiness, switchRole }`

**Persistencia**: solo el rol activo se guarda en localStorage.

### Autenticación — CRÍTICO

```tsx
// NUNCA:  const { user } = useAuthSimple()   ← crea instancias múltiples de GoTrueClient
// SIEMPRE: const { user } = useAuth()         ← consume el context singleton
```

- `useAuthSimple` se llama UNA SOLA VEZ en `AuthContext.tsx`
- Todos los componentes usan `useAuth()` del context
- El cliente Supabase vive en `src/lib/supabase.ts` (única instancia)
- Provee: `user`, `session`, `loading`, `signOut`, `loginWithPassword`, `signUpWithPassword`, `signInWithGoogle`, `signInWithGitHub`, `sendMagicLink`, `switchBusiness`

---

## MÓDULOS DEL DASHBOARD ADMIN

El AdminDashboard tiene estas pestañas/páginas en su sidebar:

| ID | Label | Componente | Icono |
|----|-------|-----------|-------|
| `overview` | Resumen | OverviewTab | LayoutDashboard |
| `appointments` | Citas | AppointmentsCalendar | Calendar |
| `absences` | Ausencias | AbsencesTab | CalendarOff |
| `locations` | Sedes | LocationsManager | MapPin |
| `services` | Servicios | ServicesManager | Briefcase |
| `resources` | Recursos | ResourcesManager | Box |
| `employees` | Empleados | EmployeeManagementHierarchy | Users |
| `recruitment` | Reclutamiento | RecruitmentDashboard | BriefcaseBusiness |
| `clients` | Clientes | ClientsManager | UserCheck |
| `sales` | Ventas | SalesHistoryPage | BarChart3 |
| `quickSales` | Ventas Rápidas | QuickSalesPage | ShoppingCart |
| `expenses` | Gastos | ExpensesManagementPage | Wallet |
| `reports` | Reportes | ReportsPage | FileText |
| `billing` | Facturación | BillingDashboard | CreditCard |
| `permissions` | Permisos | PermissionsManager (lazy) | Shield |

La URL del admin sigue el patrón `/app/admin/<id>` y el estado activo se extrae de la URL.

---

## SISTEMAS PRINCIPALES

### 1. Gestión de Citas — PRODUCTION READY

- **Wizard multi-paso**: `src/components/appointments/AppointmentWizard.tsx`
- **Pasos**: BusinessSelection → EmployeeBusinessSelection (condicional) → ServiceSelection → LocationSelection → EmployeeSelection → DateTimeSelection → ConfirmationStep → SuccessStep
- **DateTimeSelection**: validación en tiempo real de horarios sede, almuerzo empleado, overlap de citas, festivos públicos, ausencias aprobadas
- **Algoritmo overlap**: `slotStart < aptEnd && slotEnd > aptStart`
- **CREATE vs UPDATE**: `createAppointment()` diferencia INSERT de UPDATE con exclusión de la cita en edición
- **Confirmación/cancelación por email**: rutas públicas `/confirmar-cita/:token` y `/cancelar-cita/:token`
- **Wizard cache**: `useWizardDataCache` para persistir datos entre pasos

### 2. Sistema de Permisos Granulares — COMPLETADO

- **Componente**: `src/components/ui/PermissionGate.tsx`
- **Hook**: `usePermissions(businessId, permission)` → boolean
- **Tabla**: `user_permissions` (business_id, user_id, permission, granted_by, is_active)
- **Registros**: 1,919+ permisos en producción, 79 tipos únicos
- **Templates**: 9 plantillas (Admin Completo, Vendedor, Cajero, Manager de Sede, Recepcionista, Profesional, Contador, Gerente de Sede, Staff de Soporte)
- **Modos del Gate**: `hide` (destruir/eliminar), `disable` (formularios), `show` (con fallback)
- **RPC Service**: `src/lib/services/permissionRPC.ts` — 5 métodos con SECURITY DEFINER
- **Owner bypass**: verificación inmediata sin queries adicionales (99.4% más rápido)

**Patrón obligatorio para botones de acción**:
```tsx
import { PermissionGate } from '@/components/ui/PermissionGate'

// Acciones destructivas
<PermissionGate permission="services.delete" businessId={businessId} mode="hide">
  <Button onClick={handleDelete}>Eliminar</Button>
</PermissionGate>

// Formularios
<PermissionGate permission="settings.edit_business" businessId={businessId} mode="disable">
  <Button type="submit">Guardar</Button>
</PermissionGate>
```

**Categorías de permisos**: `services.*`, `resources.*`, `locations.*`, `employees.*`, `appointments.*`, `recruitment.*`, `accounting.*`, `expenses.*`, `reviews.*`, `billing.*`, `notifications.*`, `settings.*`, `permissions.*`, `absences.*`, `favorites.*`, `sales.*`

### 3. Sistema de Ausencias y Vacaciones — COMPLETADO

- **POLÍTICA CRÍTICA**: `require_absence_approval = true` SIEMPRE en todos los negocios — no es parametrizable
- **Tablas**: `employee_absences`, `absence_approval_requests`, `vacation_balance`
- **Edge Functions**: `request-absence`, `approve-reject-absence`, `cancel-appointments-on-emergency-absence`
- **Hooks**: `useEmployeeAbsences` (perspectiva empleado), `useAbsenceApprovals` (perspectiva admin)
- **Componentes**: `AbsenceRequestModal` (con range highlighting en calendarios), `AbsenceApprovalCard`, `VacationDaysWidget`, `AbsencesTab`
- **Tipos**: vacation, emergency, sick_leave, personal, other
- **Festivos**: tabla `public_holidays` con 54 festivos colombianos 2025-2027, hook `usePublicHolidays` (cache 24h)

### 4. Sistema de Modelo de Negocio Flexible — BACKEND COMPLETO

- **resource_model** ENUM: `professional` | `physical_resource` | `hybrid` | `group_class`
- **15 tipos de recursos**: room, table, court, studio, meeting_room, desk, equipment, vehicle, space, lane, field, station, parking_spot, bed, other
- **Tablas**: `business_resources`, `resource_services` (M:N), `appointments.resource_id` (nullable, alternativa a employee_id)
- **Servicio**: `src/lib/services/resources.ts` — CRUD completo + disponibilidad + stats
- **Hook**: `useBusinessResources.ts` — 8 queries + 5 mutations con React Query
- **Hook de disponibilidad**: `useAssigneeAvailability.ts` — valida empleado OR recurso automáticamente
- **CHECK constraint**: `employee_id IS NOT NULL OR resource_id IS NOT NULL`
- **Retrocompatibilidad**: negocios existentes tienen `resource_model = 'professional'`
- **UI pendiente**: Fase 3 (componentes) y Fase 4 (integración AppointmentWizard)

### 5. Jerarquía de Empleados — COMPLETADO

- **Componentes**: `EmployeeManagementHierarchy`, `HierarchyMapView`, `HierarchyNode`, `HierarchyLevelSelector`
- **Hooks**: `useBusinessHierarchy`, `useUpdateEmployeeHierarchy`, `useHierarchyLevelUtils`
- **Servicio**: `src/lib/hierarchyService.ts`
- **Edge Function**: `update-hierarchy`
- **RPC**: `get_business_hierarchy()` consulta en `business_roles`
- **GOTCHA**: trigger `sync_business_roles_from_business_employees()` mantiene sincronía entre ambas tablas

### 6. Transferencia de Sedes — COMPLETADO

- **Componente**: `LocationTransferModal`
- **Hooks**: `useLocationTransfer`, `useEmployeeTransferAvailability`
- **Edge Functions**: `cancel-future-appointments-on-transfer`, `process-pending-transfers`
- **Badge**: `TransferStatusBadge`

### 7. Sistema de Vacantes y Reclutamiento — COMPLETADO

- **Componentes**: RecruitmentDashboard, VacancyCard, VacancyList, VacancyDetail, CreateVacancy, ApplicationCard, ApplicationList, ApplicantProfileModal, MandatoryReviewModal
- **Hooks**: `useJobVacancies`, `useJobApplications`, `useMatchingVacancies`, `useMandatoryReviews`, `useScheduleConflicts`, `useEmployeeProfile`
- **Tablas**: `job_vacancies`, `job_applications`, `employee_profiles`
- **Edge Functions**: `send-selection-notifications`, `send-employee-request-notification`
- **Reviews obligatorias** al contratar/finalizar
- **Matching inteligente** empleado-vacante con detección de conflictos de horario
- **45 tests E2E pausados** con `describe.skip()` (rate limit de emails Supabase)

### 8. Sistema Contable — COMPLETADO

- **Componentes**: EnhancedFinancialDashboard, TransactionList, EnhancedTransactionForm, TaxConfiguration
- **Charts** (Recharts): CategoryPieChart, EmployeeRevenueChart, IncomeVsExpenseChart, LocationBarChart, MonthlyTrendChart
- **Hooks**: `useTransactions`, `useBusinessTaxConfig`, `useTaxCalculation`, `useFinancialReports`
- **Impuestos automáticos**: IVA, ICA, Retención en la Fuente (Colombia)
- **Moneda**: COP (pesos colombianos)
- **Exports**: PDF (jspdf), CSV, Excel (xlsx)
- **Integración**: Ventas Rápidas → transacción tipo `income`, categoría `service_sale`

### 9. Sistema de Gastos — COMPLETADO

- **Componentes**: `ExpensesManagementPage`, `ExpenseRegistrationForm`, `BusinessRecurringExpenses`, `LocationExpenseConfig`
- **Hook**: `useTransactions` (compartido con sistema contable)

### 10. Chat en Tiempo Real — COMPLETADO

- **Componentes**: ChatLayout, ChatWindow, ChatInput, ConversationList, FloatingChatButton, MessageBubble, TypingIndicator, ReadReceipts, FileUpload
- **Hooks**: `useChat`, `useMessages`, `useConversations`
- **Edge Function**: `send-message`, `send-unread-chat-emails`
- **Tablas**: `conversations`, `messages`, `chat_participants`
- **Storage**: bucket `chat-attachments`
- **Realtime**: suscripción invalida cache de React Query (no refetch continuo)
- **ChatWithAdminModal**: modal para que clientes elijan con qué empleado chatear
- **Filtro**: solo empleados con `allow_client_messages = true`

### 11. Notificaciones Multicanal — COMPLETADO

- **Canales**: Email (Brevo/Sendinblue), SMS (AWS SNS, opcional), WhatsApp Business API
- **In-app**: tabla `in_app_notifications`, hook `useInAppNotifications` (1 query base + filtros locales)
- **Componentes**: NotificationBell, NotificationCenter
- **Edge Functions**: `send-notification`, `process-reminders`, `schedule-reminders`, `send-email`, `send-email-reminder`, `send-sms-reminder`, `send-whatsapp`, `send-whatsapp-reminder`, `send-notification-reminders`
- **Rol mapping**: `src/lib/notificationRoleMapping.ts` — 30+ tipos de notificación → rol requerido → navegación automática
- **17 tipos de notificaciones**: citas, verificaciones, empleados, vacantes, ausencias, sistema
- **Hook optimizado**: `useInAppNotifications` — antes 5 queries separadas, ahora 1 query + filtrado local

### 12. Perfiles Públicos y Búsqueda — COMPLETADO

- **URL**: `/negocio/:slug` — indexable por Google sin autenticación
- **SEO**: meta tags dinámicos, Open Graph, Twitter Card, JSON-LD, sitemap.xml
- **Hook**: `useBusinessProfileData` — carga negocio + servicios + ubicaciones + empleados + reviews
- **Componente**: `PublicBusinessProfile` — layout con tabs (Servicios, Ubicaciones, Reseñas, Acerca de)
- **Búsqueda**: SearchBar (debounce 300ms, dropdown de tipos), SearchResults (6 algoritmos de ordenamiento)
- **RPC**: `search_businesses()`, `search_services()`, `search_professionals()` con ts_rank
- **Índices**: trigram GIN para búsqueda fuzzy en businesses, services, profiles
- **Flujo de reserva sin login**: usuario no autenticado → click Reservar → login → wizard con datos preseleccionados

### 13. Sistema de Reviews — COMPLETADO

- **Componentes**: ReviewCard, ReviewForm, ReviewList
- **Hook**: `useReviews` — CRUD: create, respond, toggle visibility, delete
- **Validación**: solo clientes con citas completadas (`useCompletedAppointments`) sin review previa
- **Reviews anónimas**: tipo `business` y `employee`
- **Hook**: `usePendingReviews`, `useMandatoryReviews` (para reclutamiento)

### 14. Sistema de Billing — COMPLETADO

- **Gateways**: Stripe (global), PayU Latam (Colombia), MercadoPago (Argentina/Brasil/México/Chile)
- **Factory**: `PaymentGatewayFactory` — variable `VITE_PAYMENT_GATEWAY`
- **Planes**: Gratuito (0 COP), Inicio ($80k/mes — activo), Profesional, Empresarial (próximamente)
- **Componentes**: BillingDashboard, PaymentHistory, UsageMetrics, PlanUpgradeModal, AddPaymentMethodModal
- **Edge Functions**: `create-checkout-session`, `create-setup-intent`, `manage-subscription`, `stripe-webhook`, `payu-create-checkout`, `payu-webhook`, `mercadopago-create-preference`, `mercadopago-webhook`, `mercadopago-manage-subscription`

### 15. Sistema i18n Modular — COMPLETADO (Nov 2025)

- **Ubicación**: `src/locales/`
- **Idiomas**: Español (default) e Inglés
- **~44 archivos por idioma**: absences.ts, admin.ts, adminDashboard.ts, appointments.ts, auth.ts, business.ts, jobs.ts, etc.
- **~2,200 claves** de traducción, type-safe con auto-completado TypeScript
- **Hook**: `const { t } = useLanguage()` → `t('clave.anidada')`
- **Legacy**: `src/lib/translations.ts` sigue existiendo por compatibilidad (merge strategy)

### 16. Google Analytics 4 — COMPLETADO

- **Hook**: `useAnalytics` (14 métodos)
- **Módulo**: `src/lib/ga4.ts` (GDPR-compliant, anonymizeIp, consent mode)
- **Componente**: `CookieConsent` (cookie consent banner)
- **Eventos**: booking_started/completed/abandoned, purchase, page_view, profile_view, click_reserve_button, login, sign_up

### 17. Sede Preferida — COMPLETADO

- **Hook**: `usePreferredLocation(businessId)` — localStorage, key `preferred-location-${businessId}`
- **Pre-selección automática**: FiltersPanel (empleados), CreateVacancy, QuickSaleForm, ReportsPage
- **Badge "Administrada"** en LocationsManager
- **Hook**: `usePreferredCity(userId)` — para el dashboard de cliente

### 18. Catálogo de Selects — COMPLETADO

- **Componentes**: `src/components/catalog/` — CitySelect, CountrySelect, DocumentTypeSelect, GenderSelect, HealthInsuranceSelect, PhonePrefixSelect, RegionSelect
- **Todos tipados**, con búsqueda, validación y soporte i18n

### 19. Sistema de QR — COMPLETADO

- **Componentes**: `QRScanner.tsx`, `src/components/ui/QRScannerWeb.tsx`
- **Librería**: jsqr (leer QR), qrcode (generar QR)

### 20. Registración Automática de Owners — COMPLETADO

- **Trigger**: `auto_insert_owner_to_business_employees()` al crear negocio
- **Role**: `manager`, `status: approved`, `is_active: true`
- **Backfill**: 30 owners existentes migrados

### 22. CRM de Clientes (Admin) — COMPLETADO (Mar 2026)

- **Componente**: `src/components/admin/ClientsManager.tsx`
- **Acceso**: sidebar admin `id: 'clients'` → `/app/admin/clients`
- **Scope**: a nivel de negocio — muestra todos los clientes que han tenido al menos una cita no cancelada en el negocio activo
- **Datos**: query en dos pasos — `appointments` (client_id, start_time, status) → `profiles` (full_name, email, avatar_url)
- **Agregación**: total de visitas, visitas completadas, última visita — calculadas en cliente
- **Vista**: grid de cards con avatar de iniciales, email, contador de visitas, fecha última visita
- **Acción**: click en cliente abre `ClientProfileModal` con historial completo
- **Búsqueda**: filtro local por nombre o email
- **GOTCHA**: `appointments` NO tiene columnas `client_name`, `client_email` — siempre usar two-step query (appointments → profiles)

### 23. Historial de Ventas (Admin) — COMPLETADO (Mar 2026)

- **Componente**: `src/components/admin/SalesHistoryPage.tsx`
- **Acceso**: sidebar admin `id: 'sales'` → `/app/admin/sales`
- **Scope**: a nivel de negocio — citas con `status = 'completed'`
- **Filtro de rango**: últimos 7/30/90/365 días (default 30)
- **Summary cards**: total de ventas completadas, ingresos totales, promedio por cita
- **Tabla**: fecha, servicio, cliente (botón → abre `ClientProfileModal`), precio
- **Datos**: query en dos pasos — `appointments` → `profiles` + `services` en batch
- **GOTCHA**: `appointments` usa `service_id` (FK a `services`) — el nombre del servicio requiere join separado

### 24. Mis Clientes (Empleado) — COMPLETADO (Mar 2026)

- **Componente**: `src/components/employee/EmployeeClientsPage.tsx`
- **Acceso**: sidebar empleado `id: 'my-clients'` → `/app/employee/my-clients`
- **Scope**: clientes atendidos por el empleado — filtra `employee_id = currentUser.id` en `appointments`
- **Ordenamiento**: por cantidad de visitas completadas (más atendidos primero)
- **Vista**: grid de cards — igual visual que `ClientsManager` pero acotado al empleado
- **Acción**: click abre `ClientProfileModal` (importado desde `src/components/admin/`)
- **GOTCHA**: misma limitación que ClientsManager — two-step query obligatorio

### 25. Modal de Perfil de Cliente — COMPLETADO (Mar 2026)

- **Componente**: `src/components/admin/ClientProfileModal.tsx`
- **Usado por**: `ClientsManager`, `SalesHistoryPage`, `EmployeeClientsPage`
- **Props**: `clientId`, `businessId`, `isOpen`, `onClose`
- **Tabs**: "Información" (stats, fecha primer/última visita) y "Historial (N)" (lista de citas con servicio, fecha, estado, precio)
- **Datos**: `profiles` (info de contacto) + `appointments` + `services` (two-step)
- **Patrón**: Radix UI Dialog + Tabs, basado en `ApplicantProfileModal`

### 21. Configuraciones Unificadas — COMPLETADO

- **Componente**: `CompleteUnifiedSettings.tsx` — TODOS los roles en un solo componente
- **Admin**: Preferencias del Negocio (info, contacto, dirección, legal, operaciones)
- **Employee**: Preferencias de Empleado (horarios 7 días, salarios, mensajes de clientes `allow_client_messages`)
- **Client**: Preferencias de Cliente (anticipación, pago, historial)

---

## SISTEMA DE CARDS REUTILIZABLES — CRÍTICO

**Regla**: TODOS los cards de entidades en `src/components/cards/`. NUNCA renderizar inline con `<Card>` de Radix UI.

| Componente | Entidad | Prop | Tabla |
|-----------|---------|------|-------|
| `ServiceCard` | Servicio | `serviceId` | `services` |
| `EmployeeCard` | Empleado | `employeeId` | `profiles` + `business_employees` |
| `LocationCard` | Sede | `locationId` | `locations` |
| `BusinessCard` | Negocio | `businessId` | `businesses` |
| `ResourceCard` | Recurso físico | `resourceId` | `business_resources` |
| `AppointmentCard` | Cita | `appointmentId` | `appointments` |
| `ClientCard` | Cliente | `clientId` | `profiles` |
| `SearchResultCard` | Resultado búsqueda | props propias | — |

**Patrón self-fetch**: el card recibe solo el ID y consulta datos internamente con `useQuery`. Props comunes: `readOnly?`, `isSelected?`, `onSelect?`, `onViewProfile?`, `isPreselected?`, `className?`, `renderActions?`, `initialData?` (hidrata cache).

---

## HOOKS PERSONALIZADOS (70+)

### Autenticación y Roles
- `useAuth()` — acceso al context de auth (SIEMPRE usar este)
- `useAuthSimple()` — implementación interna (NO usar directamente)
- `useUserRoles(user)` — calcula roles disponibles y activo

### Datos de Negocio
- `useAdminBusinesses(userId?)` — negocios donde el usuario es admin
- `useEmployeeBusinesses(userId, includeIndependent?)` — negocios donde es empleado
- `useBusinessProfileData(slug)` — datos completos para perfil público
- `useBusinessHierarchy(businessId)` — árbol jerárquico de empleados
- `useBusinessCategories()`, `useBusinessSubcategories(categoryId?)`
- `useBusinessCountry(businessId)`, `useBusinessAdmins(businessId)`

### Empleados
- `useEmployeeBusinesses`, `useEmployeeBusinessDetails`, `useEmployeeActiveBusiness`
- `useEmployeeServices(employeeId, businessId)`, `useEmployeeMetrics`
- `useEmployeeProfile(employeeId)`, `useEmployeeRequests(businessId)`
- `useEmployeeAppointments`, `useLocationEmployees(locationId)`
- `useUpdateEmployeeHierarchy`, `useEmployeeTimeOff`
- `useEmployeeTransferAvailability`, `useLocationTransfer`
- `useBusinessEmployeesForChat(businessId)` — filtra `allow_client_messages = true`

### Citas y Disponibilidad
- `useAssigneeAvailability(assigneeId, type)` — valida empleado OR recurso
- `useScheduleConflicts(employeeId)`, `useCompletedAppointments(clientId)`
- `useWizardDataCache()` — persistencia entre pasos del wizard

### Recursos Físicos
- `useBusinessResources` — 8 queries + 5 mutations para `business_resources`

### Ausencias
- `useEmployeeAbsences(employeeId, businessId)` — perspectiva empleado
- `useAbsenceApprovals(businessId)` — perspectiva admin
- `usePublicHolidays(countryId, year)` — cache 24h, helpers `isHoliday()`, `getHolidayName()`
- `useEmployeeTimeOff(employeeId, businessId)`

### Contabilidad y Finanzas
- `useTransactions(businessId, filters)`, `useTaxCalculation(subtotal, taxConfig)`
- `useBusinessTaxConfig(businessId)` — cache 1h, prefetch
- `useFinancialReports(businessId, period)`
- `useChartData(businessId)` — datos para charts de accounting

### Clientes y Dashboard
- `useClientDashboard(clientId, cityName?, regionName?)` — RPC `get_client_dashboard_data`
- `useFavorites(userId)`, `useGeolocation()`
- `usePreferredLocation(businessId)`, `usePreferredCity(userId)`

### Reclutamiento
- `useJobVacancies(businessId)`, `useJobApplications(vacancyId)`
- `useMatchingVacancies(employeeId)`, `useMandatoryReviews(applicationId)`
- `useEmployeeProfile(employeeId)`

### Notificaciones y Chat
- `useInAppNotifications(userId)` — 1 query base + filtros locales
- `useNotifications(userId)`, `useChat(conversationId)`
- `useMessages(conversationId)`, `useConversations(userId)`

### Billing
- `useSubscription(businessId)`

### Servicios y Sedes
- `useLocationServices(locationId)`, `useLocationNames(businessId)`
- `useServiceStatus(serviceId)`, `useCatalogs()`

### UI y UX
- `useAnalytics()` — 14 métodos GA4
- `useDebounce(value, delay)`, `useForm(schema)` — con Zod
- `useFileUpload(bucket)`, `usePageMeta(meta)`
- `usePendingNavigation()` — navegación pendiente desde notificaciones
- `useCustomAlert()`, `use-mobile.ts` (breakpoint detection)
- `useGoogleCalendarSync()`, `useKV(key, defaultValue)` — localStorage type-safe

---

## SERVICIOS (src/lib/services/)

Capa de abstracción sobre Supabase para operaciones CRUD:

- **appointments.ts**: createAppointment (INSERT/UPDATE), cancelAppointment, getByBusiness, getByEmployee, getByClient
- **businesses.ts**: getById, getBySlug, getByOwner, create, update, searchBusinesses
- **clients.ts**: getByBusiness, getClientHistory
- **locations.ts**: list({ businessIds, activeOnly }), getById, create, update, delete
- **profiles.ts**: getById, getByEmail, update
- **resources.ts**: CRUD + getAvailability + assignServices + getStats (15 métodos)
- **services.ts**: getByBusiness, getByLocation, getByEmployee, create, update, delete
- **stats.ts**: getBusinessStats, getEmployeeStats
- **userSettings.ts**: get, update
- **permissionRPC.ts**: PermissionRPCService — revoke, assign, applyTemplate, bulkRevoke, bulkAssign (SECURITY DEFINER)
- **index.ts**: re-exports centralizados

---

## BASE DE DATOS SUPABASE

**Solo en la nube** (no hay instancia local).
- **DEV**: `dkancockzvcqorqbwtyh` — proyecto original con data de prueba
- **PROD**: `emknatoknbomvmyumqju` — proyecto nuevo, limpio

### Tablas principales (40+)

**Core del negocio**:
- `businesses`: negocio (owner_id, resource_model, category_id, subcategory_ids[], slug, banner_url, logo_url)
- `locations`: sedes (opens_at, closes_at, address, lat/lng, city_id)
- `services`: servicios (price, duration, category, image_url, is_active)
- `business_employees`: empleados (employee_id, role, employee_type, lunch_break_start/end, allow_client_messages, hire_date, vacation_days_accrued, setup_completed)
- `business_resources`: recursos físicos (resource_type, capacity, hourly_rate, amenities JSONB)
- `resource_services`: relación M:N recursos-servicios (custom_price override)
- `location_services`: servicios disponibles por sede
- `employee_services`: servicios que ofrece cada empleado
- `business_roles`: roles por negocio (admin/employee, sincronizado con business_employees via trigger)

**Citas**:
- `appointments`: citas (start_time, end_time, status, employee_id OR resource_id, is_location_exception)
  - CHECK: `employee_id IS NOT NULL OR resource_id IS NOT NULL`

**Usuarios**:
- `profiles`: (name, email, phone, avatar_url, is_active, document_type, document_number)

**Ausencias**:
- `employee_absences`, `absence_approval_requests`, `vacation_balance`
- `public_holidays`: 54 festivos colombianos 2025-2027

**Permisos**:
- `user_permissions`: (business_id, user_id, permission, granted_by, is_active) — UNIQUE(business_id, user_id, permission)
- `permission_templates`: plantillas de permisos reutilizables (JSONB arrays)
- `permission_audit_log`: auditoría de cambios

**Notificaciones**:
- `in_app_notifications`: (type, data JSONB, read, user_id, business_id)
- `business_notification_settings`: configuración de canales y recordatorios
- `user_notification_preferences`: preferencias por tipo y canal
- `notification_log`: registro de notificaciones enviadas

**Billing**:
- `subscriptions`, `billing_invoices`, `payment_methods`, `usage_metrics`

**Contabilidad**:
- `transactions`: (type, category, amount, subtotal, tax_type, tax_rate, tax_amount, fiscal_period)
- `business_tax_config`: configuración fiscal (IVA, ICA, Retención)
- `recurring_expenses`: gastos recurrentes

**Reclutamiento**:
- `job_vacancies`, `job_applications`, `employee_profiles`

**Chat**:
- `conversations`, `messages`, `chat_participants`

**Categorías**:
- `business_categories` (15 principales), `business_subcategories` (~60), máximo 3 subcategorías por negocio

**Reviews**:
- `reviews`: (rating 1-5, comment, response, review_type: 'business'|'employee')

**Bug Reports**:
- `bug_reports`, `bug_report_evidences`, `bug_report_comments`

**Logs**:
- `error_logs`, `login_logs`

### Vistas Materializadas
- `business_ratings_stats`: estadísticas de ratings por negocio
- `employee_ratings_stats`: estadísticas de ratings por empleado
- `resource_availability`: bookings y revenue por recurso

### Funciones RPC importantes
- `search_businesses()`, `search_services()`, `search_professionals()` — búsqueda con ts_rank
- `get_business_hierarchy()` — árbol de empleados
- `get_client_dashboard_data(client_id, city_name, region_name)` — dashboard cliente con filtros geográficos
- `get_matching_vacancies()` — matching empleado-vacante
- `is_resource_available()` — validación overlap para recursos
- `get_resource_stats()`, `refresh_resource_availability()`
- `refresh_ratings_stats()` — refresco CONCURRENTLY de vistas materializadas

### Storage Buckets
- `avatars` (public), `cvs` (private), `chat-attachments` (private), `bug-report-evidences` (private)

### Triggers importantes
- `auto_insert_owner_to_business_employees`: al crear negocio → owner insertado como manager
- `trg_auto_insert_admin_as_employee`: al insertar en business_roles con role='admin' → inserta en business_employees como manager
- `sync_business_roles_from_business_employees`: mantiene sincronía business_roles ↔ business_employees
- `auto_assign_permissions_to_owners`: 79 permisos al crear negocio
- `auto_assign_permissions_to_admins`: permisos al asignar rol admin

### Migraciones recientes (2026)
- `20260304000001`: campo `setup_completed` en `business_employees`
- `20260309000001`: fix `get_locations_rpc` columna hours
- `20260312000001`: fix `service_image_url` en RPC
- `20260314000000`: fix `service_image_url` en dashboard RPC
- `20260601000000`: fix trigger cascade loop
- `20260602000000`: backfill business_roles para negocios específicos

---

## EDGE FUNCTIONS DESPLEGADAS (~50)

### Citas
- `appointment-actions`: confirmar, cancelar, gestión general
- `appointment-status-updater`: actualización automática de estados
- `send-appointment-confirmation`: email de confirmación con token
- `calendar-integration`: sync con Google Calendar

### Notificaciones
- `send-notification`: envío multi-canal (Email/SMS/WhatsApp)
- `send-email`, `send-email-reminder`: emails via Brevo
- `send-sms-reminder`: SMS via AWS SNS
- `send-whatsapp`, `send-whatsapp-reminder`: WhatsApp Business API
- `process-reminders`: procesador automático (cron cada 5 min)
- `schedule-reminders`: programar recordatorios
- `send-notification-reminders`: recordatorios de citas
- `send-unread-chat-emails`: notificaciones de mensajes no leídos
- `send-notifications`: batch notifications
- `send-reminders`: recordatorios genéricos
- `notify-business-unconfigured`: alertar a negocios sin configurar

### Ausencias
- `request-absence`: solicitar ausencia (notifica a TODOS los admins)
- `approve-reject-absence`: aprobar/rechazar ausencia
- `cancel-appointments-on-emergency-absence`: cancelación automática

### Empleados y Reclutamiento
- `send-employee-request-notification`: notificación de solicitud de empleado
- `send-selection-notifications`: notificaciones de selección en vacantes
- `update-hierarchy`: actualización de jerarquía
- `cancel-future-appointments-on-transfer`: cancelar citas al transferir sede
- `process-pending-transfers`: procesar transferencias pendientes

### Pagos
- `create-checkout-session`, `stripe-webhook`, `manage-subscription` (Stripe)
- `create-setup-intent` (Stripe)
- `payu-create-checkout`, `payu-webhook` (PayU)
- `mercadopago-create-preference`, `mercadopago-webhook`, `mercadopago-manage-subscription`

### Analytics y Reportes
- `refresh-ratings-stats`: actualiza vistas materializadas (cron cada 5 min)
- `get-client-dashboard-data`: RPC wrapper para dashboard cliente
- `check-business-inactivity`: verificación de negocios inactivos
- `daily-digest`: resumen diario de actividad

### Permisos
- `refresh-permissions-cache`: refresca cache de permisos

### Otros
- `send-message`: envío de mensajes de chat
- `send-bug-report-email`: reporte de bugs
- `create-test-users`: usuarios de prueba
- `search_businesses`: función de búsqueda

---

## REACT QUERY — CONFIGURACIÓN

```ts
// src/lib/queryConfig.ts
QUERY_CONFIG = {
  STABLE: { staleTime: 5min, gcTime: 24h, refetchOnWindowFocus: false },  // negocio, servicios
  FREQUENT: { staleTime: 1min, gcTime: 10min, refetchOnWindowFocus: true }, // citas, ausencias
  REALTIME: { staleTime: 0, gcTime: 5min, refetchInterval: 30s },          // chat, notifs
}

// Query keys predefinidas en QUERY_CONFIG.KEYS
BUSINESS_EMPLOYEES(businessId)
EMPLOYEE_ABSENCES(employeeId, businessId)
VACATION_BALANCE(employeeId, businessId, year)
PUBLIC_HOLIDAYS(country, year)
IN_APP_NOTIFICATIONS(userId)
EMPLOYEE_BUSINESSES(employeeId)
COMPLETED_APPOINTMENTS(clientId)
CLIENT_DASHBOARD(clientId, cityName, regionName)
```

---

## COMANDOS PRINCIPALES

```bash
# Desarrollo
npm run dev              # Vite dev server (http://localhost:5173)
npm run dev:owner        # Modo owner (vite.config.owner.ts)
npm run dev:users        # Modo users (vite.config.users.ts)
npm run build            # Build de producción
npm run type-check       # TypeScript check sin emitir
npm run lint             # ESLint con auto-fix
npm run analyze          # Bundle analyzer

# Testing
npm run test             # Vitest
npm run test:watch       # Vitest watch mode
npm run test -- --coverage

# Scripts de base de datos
npm run db:seed          # Generar datos demo
npm run db:clean         # Limpiar datos transaccionales (dry-run por default)
npm run db:clean:force   # Limpiar sin confirmación
npm run db:fix-appointments  # Fix ambigüedad en appointments

# Supabase CLI (siempre con npx, siempre --yes en push)
npx supabase db push --dns-resolver https --yes  # Aplicar migraciones
npx supabase migration list --dns-resolver https
npx supabase migration fetch --yes --dns-resolver https
npx supabase functions deploy <nombre>           # Deploy edge function
npx supabase migration repair --status reverted  # Reparar migración fallida

# Otros
npm run generate-sitemap  # Generar sitemap.xml para SEO
npm run pre-deploy        # Checks pre-deploy
```

---

## VARIABLES DE ENTORNO

**Web** — ver templates en `environments/`. Archivos gitignoreados:
- `.env.development` → local/dev (apunta a `dkancockzvcqorqbwtyh`)
- `.env.staging` → build de dev (idem)
- `.env.production` → build de prod (apunta a `emknatoknbomvmyumqju`)

```bash
# Ejemplo .env.development (DEV)
VITE_SUPABASE_URL=https://dkancockzvcqorqbwtyh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Gestabiz
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_PAYMENT_GATEWAY=stripe|payu|mercadopago
VITE_GOOGLE_CLIENT_ID=...
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_DEMO_MODE=true   # Cliente Supabase simulado
```

**Edge Functions (Supabase Secrets)**:
```bash
BREVO_API_KEY, BREVO_SMTP_HOST, BREVO_SMTP_PORT, BREVO_SMTP_USER, BREVO_SMTP_PASSWORD
WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION  # Para SMS
SUPPORT_EMAIL
```

---

## CONVENCIONES Y GOTCHAS

### CRÍTICOS
- **`appointments` NO tiene columnas de texto denormalizadas**: NO existen `client_name`, `client_email`, `title`, `service_name` en la tabla real. Siempre usar two-step query: fetch `client_id`/`service_id` de appointments → batch fetch `profiles`/`services` por separado. Las columnas falsas solo existen en el mock data (`src/lib/demoData.ts`).
- **`services!inner` en joins oculta citas silenciosamente**: si el servicio fue eliminado, el INNER JOIN excluye la cita. Usar `services (...)` (LEFT JOIN) en calendarios y listados históricos.
- **Hora de almuerzo no aplica a días pasados**: `isLunchBreak()` en `AppointmentsCalendar` retorna `false` para fechas anteriores a hoy, evitando ocultar citas históricas que se crearon con un horario de almuerzo distinto.
- **`business_employees` usa `employee_id` NO `user_id`**: siempre `employee_id = auth.uid()`
- **`appointments` tiene `is_location_exception`**: empleados trabajando fuera de su sede asignada
- **RLS no puede consultar la misma tabla que protege**: evitar recursión infinita en políticas
- **Audit triggers requieren auth context**: usar `set_config()` en SQL directo para mantener `auth.uid()`
- **Permission templates usan JSONB arrays**: expandir con `jsonb_array_elements_text()`
- **Bulk operations**: `ON CONFLICT DO UPDATE` para evitar duplicados en asignación masiva
- **Sincronización business_roles ↔ business_employees**: trigger automático garantiza sincronía (migración `20251020180000_*`)

### Performance
- **React Query**: deduplication + cache para evitar requests duplicados
- **useInAppNotifications**: 1 query base (limit=50) + filtros locales (UnreadCount calculado localmente)
- **Owner bypass**: verificación owner PRIMERO (0 queries adicionales)
- **Vistas materializadas**: cron cada 5 min actualiza CONCURRENTLY
- **Lazy loading**: PermissionsManager y otros componentes pesados

### Seguridad
- **RLS en todas las tablas**: sin excepciones
- **Variables privadas SOLO en Edge Functions**: nunca en frontend
- **Payment gateways**: reciben el cliente Supabase como parámetro del constructor

### UI
- **Tailwind 4**: variables CSS semánticas (`bg-background`, `text-foreground`, `border-border`, `bg-card`)
- **NO hardcodear colores** hex directamente
- **Iconos**: Phosphor Icons (`@phosphor-icons/react`) y Lucide React (`lucide-react`)
- **Animaciones**: Framer Motion (`framer-motion`) para transiciones
- **Charts**: Recharts (`recharts`) + D3 (`d3`) para visualizaciones

### Limpieza
- Archivos temporales SQL/scripts creados para testing → eliminar al terminar
- Cada cambio en Supabase → hacer deploy/migración correspondiente
- Cada cambio estructural → actualizar este CLAUDE.md

---

## INTEGRACIONES EXTERNAS

| Servicio | Propósito | Variables |
|---------|-----------|-----------|
| **Supabase** | Backend completo | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY |
| **Brevo (Sendinblue)** | Email transaccional (300/día gratis) | BREVO_* |
| **Stripe** | Pagos internacionales | STRIPE_SECRET_KEY, VITE_STRIPE_PUBLISHABLE_KEY |
| **PayU Latam** | Pagos Colombia | PAYU_* |
| **MercadoPago** | Pagos LATAM | MERCADOPAGO_* |
| **AWS SNS** | SMS (opcional) | AWS_* |
| **WhatsApp Business API** | Mensajes WhatsApp | WHATSAPP_* |
| **Google Calendar API** | Sync de calendarios | VITE_GOOGLE_CLIENT_ID |
| **Google Analytics 4** | Analytics GDPR-compliant | VITE_GA_MEASUREMENT_ID |
| **Sentry** | Error tracking (plan gratuito) | Configurado en vite.config.ts |

---

## DATOS DEL PROYECTO

- **Autor**: Jose Luis Avila (jlap.11@hotmail.com) — @jlap11
- **Organización**: TI-Turing (https://github.com/TI-Turing)
- **Repo**: https://github.com/TI-Turing/Gestabiz
- **Deploy**: Vercel (configurado en `vercel.json`)
- **Supabase DEV**: `dkancockzvcqorqbwtyh` (proyecto original, data de prueba)
- **Supabase PROD**: `emknatoknbomvmyumqju` (proyecto nuevo, limpio)
- **Versión**: 0.0.51
- **Fase**: BETA completada — no se agregan nuevos flujos funcionales; solo bugs, optimizaciones y features puntuales solicitadas

---

*Última actualización: Marzo 2026 — Claude Code*

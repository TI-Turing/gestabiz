# AUDITORÍA TÉCNICA — Gestabiz
### Documento base para refactorización · Marzo 2026

> **Propósito**: Catálogo exhaustivo de malas prácticas, ineficiencias, duplicaciones y problemas de calidad detectados en el codebase. Cada hallazgo incluye severidad, ubicación y corrección sugerida. Este documento debe ser la referencia central durante la refactorización.

---

## RESUMEN EJECUTIVO

| Categoría | Crítico | Alto | Medio | Bajo |
|-----------|---------|------|-------|------|
| Arquitectura / God Components | 2 | 2 | 3 | 1 |
| TypeScript / Tipado | 0 | 3 | 5 | 2 |
| Rendimiento / React Query | 0 | 4 | 6 | 2 |
| Calidad de código | 0 | 2 | 6 | 3 |
| Manejo de errores | 0 | 2 | 4 | 1 |
| Seguridad | 0 | 0 | 3 | 1 |
| Accesibilidad | 0 | 0 | 1 | 2 |
| **TOTAL** | **2** | **13** | **28** | **12** |

**Total de hallazgos: 55**

---

## ÍNDICE DE SECCIONES

1. [Componentes God (Crítico)](#1-componentes-god)
2. [Patrones React Anti-pattern](#2-patrones-react-anti-pattern)
3. [React Query y Data Fetching](#3-react-query-y-data-fetching)
4. [Supabase — Uso Directo y Overfetching](#4-supabase--uso-directo-y-overfetching)
5. [TypeScript — Tipado Débil](#5-typescript--tipado-débil)
6. [Duplicación de Código](#6-duplicación-de-código)
7. [Rendimiento y Optimización](#7-rendimiento-y-optimización)
8. [Manejo de Errores](#8-manejo-de-errores)
9. [Capa de Servicios — Inconsistencias](#9-capa-de-servicios--inconsistencias)
10. [Contextos — Problemas](#10-contextos--problemas)
11. [Seguridad](#11-seguridad)
12. [Calidad de Código](#12-calidad-de-código)
13. [Accesibilidad](#13-accesibilidad)
14. [Hallazgos Positivos](#14-hallazgos-positivos)
15. [Plan de Refactorización por Fases](#15-plan-de-refactorización-por-fases)

---

## 1. COMPONENTES GOD

### [CRÍTICO-01] AppointmentWizard.tsx — 1,171 líneas

**Archivo**: `src/components/appointments/AppointmentWizard.tsx`
**Severidad**: 🔴 CRÍTICO
**Categoría**: Arquitectura

**Problema**:
Componente monolítico de 1,171 líneas que gestiona simultáneamente:
- 8 pasos del wizard (BusinessSelection, EmployeeBusinessSelection, ServiceSelection, LocationSelection, EmployeeSelection, DateTimeSelection, ConfirmationStep, SuccessStep)
- Lógica de creación y edición de citas
- Gestión de cache inter-pasos (`useWizardDataCache`)
- Múltiples formularios y validaciones
- Estado para 15+ tipos de datos distintos
- Switch/if chains para renderizado de pasos

**Impacto**: Difícil de testear, mantener y debuggear. Un cambio en un paso puede romper otro.

**Refactorización propuesta**:
```
src/components/appointments/
├── AppointmentWizard.tsx          (orquestador puro, <100 líneas)
├── hooks/
│   ├── useWizardState.ts          (estado global del wizard)
│   ├── useAppointmentSubmit.ts    (lógica CREATE/UPDATE)
│   └── useWizardNavigation.ts     (navegación entre pasos)
└── steps/
    ├── BusinessSelectionStep.tsx
    ├── ServiceSelectionStep.tsx
    ├── LocationSelectionStep.tsx
    ├── EmployeeSelectionStep.tsx
    ├── DateTimeSelectionStep.tsx
    ├── ConfirmationStep.tsx
    └── SuccessStep.tsx
```

Cada step debería ser ≤200 líneas y manejar solo su propia responsabilidad.

---

### [CRÍTICO-02] CompleteUnifiedSettings.tsx — 1,842 líneas

**Archivo**: `src/components/settings/CompleteUnifiedSettings.tsx`
**Severidad**: 🔴 CRÍTICO
**Categoría**: Arquitectura

**Problema**:
El componente más grande del proyecto con 1,842 líneas. Gestiona configuraciones de **3 roles distintos** (Admin, Employee, Client) con múltiples secciones dentro de cada uno:
- Admin: Info de negocio, configuración notificaciones, branding, gastos recurrentes
- Employee: Perfil, detalles laborales, certificaciones, horario laboral
- Client: Preferencias, favoritos, notificaciones
- Shared: Tema, idioma, perfil de usuario

**Impacto**: Compilación lenta, imposible testear unitariamente, cualquier modificación implica riesgo de regresión, bundle contribution innecesariamente grande.

**Refactorización propuesta**:
```
src/components/settings/
├── SettingsContainer.tsx          (router de tabs, <50 líneas)
├── admin/
│   ├── BusinessInfoSettings.tsx
│   ├── BusinessBrandingSettings.tsx
│   ├── NotificationSettings.tsx
│   └── RecurringExpensesSettings.tsx
├── employee/
│   ├── EmployeeProfileSettings.tsx
│   ├── WorkScheduleSettings.tsx
│   └── EmploymentDetailsSettings.tsx
├── client/
│   ├── ClientPreferencesSettings.tsx
│   └── FavoritesSettings.tsx
└── shared/
    ├── ThemeLanguageSettings.tsx
    └── ProfileSettings.tsx
```

---

### [ALTO-03] AdminDashboard.tsx — Múltiples responsabilidades

**Archivo**: `src/components/admin/AdminDashboard.tsx`
**Severidad**: 🟠 ALTO
**Categoría**: Arquitectura

**Problema**:
El componente gestiona 8+ props (`businesses`, `onSelectBusiness`, `onCreateNew`, `onUpdate`, `onLogout`, `currentRole`, `availableRoles`, `onRoleChange`) que sugieren prop drilling de contexto que debería venir de Context API. Además mezcla:
- Gestión de estado de página activa
- Preferencia de sede
- Selección de empleado activo
- Estado del chat

**Corrección**:
```tsx
// Extraer en hook personalizado:
const useAdminDashboardState = () => {
  // toda la lógica de estado aquí
  return { activePage, selectedEmployee, preferredLocation, ... }
}
```
Reemplazar prop drilling de roles con `useAuth()` context directamente en el componente.

---

## 2. PATRONES REACT ANTI-PATTERN

### [ALTO-04] Contextos sin useMemo en el value

**Archivos**: `src/contexts/AuthContext.tsx:32`, `src/contexts/AppStateContext.tsx:90`
**Severidad**: 🟠 ALTO
**Categoría**: Performance / React

**Problema**:
Los providers pasan el value sin `useMemo`, causando que **todos los consumidores re-rendericen** en cada render del provider, aunque el estado no haya cambiado.

```tsx
// ❌ ACTUAL — crea nuevo objeto en cada render
<AuthContext.Provider value={authState}>

// ✅ CORRECCIÓN
const memoValue = useMemo(() => authState, [authState])
<AuthContext.Provider value={memoValue}>
```

**Archivos afectados**: Revisar TODOS los contextos: `AuthContext`, `AppStateContext`, `LanguageContext`, `NotificationContext`, `ThemeContext`.

---

### [MEDIO-05] ThemeProvider — Efectos redundantes que escriben el DOM dos veces

**Archivo**: `src/contexts/ThemeProvider.tsx:16-59`
**Severidad**: 🟡 MEDIO
**Categoría**: Performance

**Problema**:
Dos `useEffect` separados actualizan los mismos elementos del DOM (`document.documentElement.classList`, `document.body.classList`). El primero reacciona a `effectiveTheme`, el segundo a `theme`. Esto genera **doble escritura al DOM** en cada cambio de tema.

**Corrección**: Consolidar en un solo efecto que maneje tanto la lógica de `system` theme como la aplicación de clases CSS.

---

### [MEDIO-06] useEffect con dependencia `.length` como proxy anti-regresión

**Archivo**: `src/components/MainApp.tsx:44, 74`
**Severidad**: 🟡 MEDIO
**Categoría**: React

**Problema**:
```tsx
// ❌ Patrón frágil — usa .length para evitar infinite loops
const employeeBusinessesLength = employeeBusinesses?.length
useEffect(() => { ... }, [employeeBusinessesLength])
```

Esto pierde actualizaciones cuando el array tiene el mismo tamaño pero distintos elementos (ej: se reemplaza un negocio por otro).

**Corrección**: Usar un ID estable como dependencia, o un `useRef` + comparación profunda con `useMemo`.

---

### [MEDIO-07] AppStateContext — Funciones de dispatch recreadas en cada render

**Archivo**: `src/contexts/AppStateContext.tsx:73-89`
**Severidad**: 🟡 MEDIO
**Categoría**: Performance

**Problema**:
Las funciones `setLoading`, `setError`, etc. se definen como arrow functions dentro del `useMemo`, lo que las recrea en cada evaluación del memo.

**Corrección**:
```tsx
// Envolver cada función con useCallback ANTES del useMemo
const setLoading = useCallback((loading: boolean) => dispatch({ type: 'SET_LOADING', loading }), [dispatch])
const setError = useCallback((error: string | null) => dispatch({ type: 'SET_ERROR', error }), [dispatch])

const contextValue = useMemo(() => ({ ...state, setLoading, setError }), [state, setLoading, setError])
```

---

### [BAJO-08] useMemo innecesario en ThemeProvider

**Archivo**: `src/contexts/ThemeProvider.tsx:9-12`
**Severidad**: 🟢 BAJO
**Categoría**: Performance

**Problema**:
`useMemo` aplicado a un cálculo trivial (una ternaria + una llamada a `matchMedia`). El costo de la memoización supera al del cálculo.

**Corrección**: Calcular directamente sin `useMemo`:
```tsx
const isDark = theme !== 'system' ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
```

---

## 3. REACT QUERY Y DATA FETCHING

### [ALTO-09] useTransactions.ts — No usa React Query (useState + useEffect manual)

**Archivo**: `src/hooks/useTransactions.ts`
**Severidad**: 🟠 ALTO
**Categoría**: React Query / Performance

**Problema**:
Este hook usa el patrón `useState + useEffect + fetch manual` en lugar de React Query. Consecuencias:
- **Sin caché**: cada montaje del componente hace un fetch completo
- **Sin deduplicación**: múltiples instancias hacen queries duplicadas
- **Sin invalidación**: después de cada mutación llama `fetchTransactions()` forzando un refetch completo (líneas 146, 176, 199, 218, 303)
- **Sin configuración staleTime/gcTime**
- **Sin background refetch**

**Corrección**: Migrar completamente a `useQuery` + `useMutation`:
```tsx
const { data: transactions, isLoading, error } = useQuery({
  queryKey: QUERY_CONFIG.KEYS.TRANSACTIONS(businessId, filters),
  queryFn: () => transactionsService.getByBusiness(businessId, filters),
  ...QUERY_CONFIG.STABLE,
})

const createMutation = useMutation({
  mutationFn: transactionsService.create,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_CONFIG.KEYS.TRANSACTIONS(businessId) }),
})
```

---

### [ALTO-10] useAbsenceApprovals.ts — refreshKey como anti-patrón

**Archivo**: `src/hooks/useAbsenceApprovals.ts:54, 164, 198, 256`
**Severidad**: 🟠 ALTO
**Categoría**: React Query

**Problema**:
```tsx
// ❌ Anti-patrón — incrementar key para forzar re-fetch derrota el propósito de React Query
const [refreshKey, setRefreshKey] = useState(0)
setRefreshKey((prev) => prev + 1) // En cada mutación
```

Mismo problema que `useTransactions`: usa `useState` en lugar de `useQuery`. El patrón `refreshKey` es una señal clara de que se debería usar la invalidación de cache de React Query.

**Corrección**: Migrar a React Query con `queryClient.invalidateQueries()`.

---

### [ALTO-11] useChat.ts — Problema N+1 queries en fetchConversations

**Archivo**: `src/hooks/useChat.ts:154-273`
**Severidad**: 🟠 ALTO
**Categoría**: Performance / N+1

**Problema**:
Por cada N conversaciones, el hook ejecuta:
1. Query para `chat_participants` (1 query)
2. Para cada conversación directa, query separada para obtener el "otro usuario" (N queries)
3. Query para remitentes del último mensaje (1 query)

**Total**: `N+2` queries para N conversaciones. Con 20 conversaciones = 22 queries en la carga inicial.

**Corrección**: Crear función RPC en Supabase:
```sql
CREATE FUNCTION get_conversations_with_participants(p_user_id uuid)
RETURNS TABLE (...) AS $$ ... $$
```
Esto reduce a 1-2 queries totales.

---

### [ALTO-12] useInAppNotifications-OLD.ts — Archivo obsoleto sin eliminar

**Archivo**: `src/hooks/useInAppNotifications-OLD.ts`
**Severidad**: 🟠 ALTO
**Categoría**: Duplicación / Code Quality

**Problema**:
Existe la versión antigua del hook (5 queries separadas) junto con la nueva (1 query + filtros locales). El archivo `*-OLD.ts` nunca fue eliminado, causando:
- Confusión para desarrolladores sobre cuál usar
- Riesgo de que alguien importe la versión deprecated
- Carga cognitiva innecesaria

**Corrección**: Eliminar `useInAppNotifications-OLD.ts` definitivamente.

---

### [MEDIO-13] Suscripción Realtime recreada por cambios de filtro

**Archivo**: `src/hooks/useInAppNotifications.ts:439-507`
**Severidad**: 🟡 MEDIO
**Categoría**: Performance / Memory Leaks

**Problema**:
El canal Realtime se recrea cuando cambia ANY de: `userId, limit, type, businessId, excludeChatMessages, suppressToasts`. Cambiar el filtro de tipo genera un nuevo canal, dejando el anterior huérfano hasta que el garbage collector lo elimine.

**Corrección**: Solo recrear en cambio de `userId`. Mover la lógica de filtrado fuera de la dependencia del canal:
```tsx
useEffect(() => {
  const channel = supabase.channel(`notifications:${userId}`)
  // ... setup
  return () => { supabase.removeChannel(channel) }
}, [userId]) // Solo userId como dependencia
```

---

### [MEDIO-14] queryConfig.ts — Sin keys de paginación

**Archivo**: `src/lib/queryConfig.ts`
**Severidad**: 🟡 MEDIO
**Categoría**: Architecture

**Problema**:
Las query keys no contemplan variantes de paginación. Listas que paginen pueden tener conflictos de caché si la key es la misma con distinto `page`.

**Corrección**:
```tsx
APPOINTMENTS: (businessId: string, page = 0, limit = 20) =>
  ['appointments', businessId, page, limit] as const,
```

---

### [BAJO-15] Límites de paginación hardcodeados en múltiples archivos

**Archivos**: `useChat.ts:278`, `useMessages.ts:101`, `useInAppNotifications.ts`
**Severidad**: 🟢 BAJO
**Categoría**: Mantenibilidad

**Problema**:
Valores como `50`, `20`, `100` están hardcodeados en múltiples lugares.

**Corrección**: Definir constante centralizada:
```tsx
// src/constants/index.ts
export const PAGINATION = {
  MESSAGES: 50,
  NOTIFICATIONS: 50,
  CONVERSATIONS: 20,
  APPOINTMENTS: 25,
} as const
```

---

## 4. SUPABASE — USO DIRECTO Y OVERFETCHING

### [MEDIO-16] `.select('*')` — Overfetching en múltiples hooks

**Archivos**: `useChat.ts:172`, `useAbsenceApprovals.ts:multiple`, y otros
**Severidad**: 🟡 MEDIO
**Categoría**: Performance / Supabase

**Problema**:
`.select('*')` en consultas donde solo se necesitan 3-5 columnas transfiere datos innecesarios de la base de datos.

**Ejemplos detectados**:
```tsx
// ❌ Trae todas las columnas de chat_participants
supabase.from('chat_participants').select('*')

// ✅ Solo lo necesario
supabase.from('chat_participants')
  .select('user_id, conversation_id, unread_count, is_pinned')
```

**Acción**: Auditar TODOS los `.select('*')` y reemplazar con columnas específicas.

---

### [MEDIO-17] Llamadas directas a Supabase fuera de la capa de servicios

**Archivos**: `useSupabaseData.ts:129, 154`, múltiples hooks
**Severidad**: 🟡 MEDIO
**Categoría**: Arquitectura

**Problema**:
Algunos hooks hacen calls directos a Supabase (`.from().select()`) en lugar de usar la capa de servicios en `src/lib/services/`. Hay dos patrones conviviendo:
```tsx
// Patrón A (correcto) — servicio centralizado
import { appointmentsService } from '@/lib/services'
appointmentsService.getByBusiness(businessId)

// Patrón B (anti-patrón) — directo en el hook
supabase.from('businesses').select('id').eq('owner_id', userId)
```

**Corrección**: Crear servicios faltantes y migrar todas las queries directas:
- `chatService.ts` (actualmente no existe)
- `transactionsService.ts` (actualmente no existe)
- `notificationsService.ts` (actualmente no existe)
- `absencesService.ts` (actualmente no existe)

---

### [MEDIO-18] Suscripción de auth sin cleanup apropiado

**Archivo**: `src/hooks/useAuthSimple.ts`
**Severidad**: 🟡 MEDIO
**Categoría**: Memory Leaks

**Problema**:
Si el `useEffect` que registra el listener de cambios de auth no retorna una función de cleanup, la suscripción persiste incluso si el componente se desmonta o el usuario hace logout.

**Corrección**:
```tsx
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(...)
  return () => subscription.unsubscribe() // Cleanup OBLIGATORIO
}, [])
```

---

### [BAJO-19] Importaciones duplicadas del cliente Supabase

**Archivos**: Múltiples
**Severidad**: 🟢 BAJO
**Categoría**: Arquitectura

**Problema**:
Todos los servicios importan `supabase` directamente. Si en el futuro se necesita inyectar el cliente (testing, multi-tenant), habría que modificar todos los archivos.

**Corrección**: Crear wrapper:
```tsx
// src/lib/services/db.ts
export { supabase as db } from '@/lib/supabase'
```
Facilita mocking en tests.

---

## 5. TYPESCRIPT — TIPADO DÉBIL

### [ALTO-20] 49 instancias de `as any` en 22+ archivos

**Archivos**: `hierarchyService.ts:148`, `BusinessSelection.tsx:201,400,462,508`, `AppointmentsCalendar.tsx:854`, servicios y hooks
**Severidad**: 🟠 ALTO
**Categoría**: TypeScript

**Problema**:
49 usos de `as any` detectados. Esto elimina el beneficio de TypeScript y puede enmascarar bugs en runtime.

**Principales ofensores**:
```tsx
// hierarchyService.ts
.update({ setup_completed: true } as any)

// BusinessSelection.tsx (múltiples líneas)
(data as any).some_property

// En error handlers
(error as any).details
(error as any).code
```

**Corrección**:
```tsx
// Para actualizaciones de Supabase
const updateData: Partial<Tables<'business_employees'>> = { setup_completed: true }
.update(updateData)

// Para errores de Supabase
import type { PostgrestError } from '@supabase/supabase-js'
const pgError = error as PostgrestError
pgError.code // ahora tipado
```

---

### [ALTO-21] Non-null assertions sin verificación previa

**Archivo**: `src/hooks/useSupabaseData.ts:84-96`
**Severidad**: 🟠 ALTO
**Categoría**: TypeScript / Seguridad

**Problema**:
```tsx
apt.id!          // Line 84
apt.service_id!  // Line 90
apt.start_time!  // Line 95
apt.end_time!    // Line 96
```

Si estos valores son `null` o `undefined`, la app creará datos inválidos silenciosamente.

**Corrección**: Validar antes de usar:
```tsx
if (!apt.id || !apt.service_id || !apt.start_time || !apt.end_time) {
  console.error('Appointment data incomplete', apt)
  return null
}
```
O usar Zod para validación en la capa de servicios.

---

### [MEDIO-22] Cast `Record<string, unknown>` pierde tipado

**Archivo**: `src/hooks/useSupabase.ts:39-76`
**Severidad**: 🟡 MEDIO
**Categoría**: TypeScript

**Problema**:
El tipo `AnyRecord = Record<string, unknown>` y las funciones helper `asString`, `asBoolean`, etc. son reimplementaciones manuales de lo que Zod/TypeScript deberían proveer automáticamente.

**Corrección**: Migrar a schemas Zod para validación de datos de la BD.

---

### [MEDIO-23] LanguageContext — type casting en getNestedValue

**Archivo**: `src/contexts/LanguageContext.tsx:58`
**Severidad**: 🟡 MEDIO
**Categoría**: TypeScript

**Problema**:
```tsx
reduce<unknown>((current, key) =>
  (current as Record<string, unknown> | undefined)?.[key], obj)
```
Si la clave no existe, falla silenciosamente devolviendo `undefined` en lugar de indicar un error de traducción faltante.

**Corrección**: En modo desarrollo, lanzar error cuando no se encuentre una clave de traducción.

---

### [BAJO-24] Falta de tipos de retorno explícitos en funciones async

**Archivos**: `useTransactions.ts`, múltiples hooks
**Severidad**: 🟢 BAJO
**Categoría**: TypeScript

**Problema**:
Funciones async sin tipo de retorno explícito. TypeScript infiere el tipo pero dificulta la revisión.

**Corrección**:
```tsx
const fetchTransactions = async (): Promise<void> => { ... }
const createTransaction = async (data: CreateTransactionInput): Promise<Transaction> => { ... }
```

---

### [BAJO-25] Errores de Supabase sin tipo específico

**Archivos**: Múltiples hooks
**Severidad**: 🟢 BAJO
**Categoría**: TypeScript

**Corrección**: Crear wrapper tipado:
```tsx
// src/lib/errors.ts
import type { PostgrestError } from '@supabase/supabase-js'

export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly pgError?: PostgrestError
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}
```

---

## 6. DUPLICACIÓN DE CÓDIGO

### [ALTO-26] Patrón fetch manual repetido en ~15 hooks

**Archivos**: `useTransactions.ts`, `useAbsenceApprovals.ts`, `useEmployeeBusinesses.ts`, `useChat.ts`, y más
**Severidad**: 🟠 ALTO
**Categoría**: Duplicación

**Problema**:
El siguiente patrón está repetido con variaciones mínimas en al menos 15 hooks:

```tsx
// ❌ Código duplicado en CADA hook
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const fetchData = useCallback(async () => {
  setLoading(true)
  try {
    const result = await supabase.from('table').select('...')
    setData(result.data || [])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    setError(message)
    toast.error(message)
  } finally {
    setLoading(false)
  }
}, [dependencies])

useEffect(() => { fetchData() }, [fetchData])
```

**Corrección**: Migrar TODOS estos hooks a React Query. El patrón correcto ya existe en otros hooks del proyecto:
```tsx
const { data, isLoading, error } = useQuery({
  queryKey: QUERY_CONFIG.KEYS.SOME_KEY(id),
  queryFn: () => someService.getById(id),
  ...QUERY_CONFIG.STABLE,
})
```

---

### [MEDIO-27] Cálculo de días entre fechas duplicado

**Archivo**: `src/hooks/useAbsenceApprovals.ts:78-80, 126-127`
**Severidad**: 🟡 MEDIO
**Categoría**: Duplicación

**Problema**:
```tsx
// Aparece al menos 2 veces
const daysRequested = Math.floor(
  (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
) + 1
```

**Corrección**: Extraer a utilidad en `src/lib/dateUtils.ts`:
```tsx
export const daysBetween = (start: Date, end: Date): number =>
  Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
```

---

### [MEDIO-28] Lógica de permisos duplicada — sistema legacy vs v2

**Archivos**: `src/lib/permissions.ts`, `src/lib/permissions-v2.ts`
**Severidad**: 🟡 MEDIO
**Categoría**: Duplicación / Deuda técnica

**Problema**:
`permissions.ts` está marcado como deprecated pero sigue siendo importado. Hay dos sistemas de permisos conviviendo, lo que genera:
- Indirección innecesaria (`usePermissions` envuelve `usePermissions-v2`)
- Mantenimiento duplicado
- Confusión sobre cuál usar

**Corrección**:
1. Identificar todos los imports de `permissions.ts`
2. Migrar todos a `permissions-v2.ts`
3. Eliminar `permissions.ts`

---

### [BAJO-29] Mensajes de error en dos idiomas mezclados

**Archivos**: Múltiples hooks
**Severidad**: 🟢 BAJO
**Categoría**: Calidad / i18n

**Problema**:
Los mensajes de error mezclan español e inglés de forma inconsistente:
```tsx
toast.error('Error desconocido')           // Español
toast.error('Failed to load data')         // Inglés
toast.error('Error al cargar los datos')   // Español
```

**Corrección**: Centralizar en el sistema i18n:
```
src/locales/es/errors.ts
src/locales/en/errors.ts
```

---

## 7. RENDIMIENTO Y OPTIMIZACIÓN

### [ALTO-30] Falta de memoización generalizada — ~2.5 useCallback/useMemo por archivo

**Archivos**: 74 hooks, múltiples componentes
**Severidad**: 🟠 ALTO
**Categoría**: Performance

**Problema**:
Se detectaron solo 188 instancias de `useCallback`/`useMemo` en todo el proyecto (~74 hooks + componentes). Un ratio de ~2.5 por archivo sugiere que muchas funciones se recrean en cada render, causando cascadas de re-renders en consumidores.

**Áreas de mayor impacto**:
- Handlers de formularios (`onChange`, `onSubmit`)
- Funciones pasadas como props a componentes hijos
- Objetos computados pasados como props

**Corrección**: Auditar con React DevTools Profiler e identificar componentes que re-renderizan innecesariamente. Aplicar `useCallback` a handlers y `useMemo` a objetos derivados costosos.

---

### [MEDIO-31] Sin virtualización en listas largas

**Afecta**: `TransactionList`, `ConversationList`, `AppointmentsCalendar` (vista lista)
**Severidad**: 🟡 MEDIO
**Categoría**: Performance

**Problema**:
Listas que pueden tener 100+ items se renderizan completamente sin virtualización, causando lag visible en dispositivos lentos.

**Corrección**: Implementar virtualización con `@tanstack/react-virtual` (ya en el ecosistema TanStack que el proyecto usa):
```tsx
import { useVirtualizer } from '@tanstack/react-virtual'
```

---

### [MEDIO-32] Imports de librerías completas en lugar de tree-shaking

**Archivos**: Componentes que usan recharts, date-fns, lodash
**Severidad**: 🟡 MEDIO
**Categoría**: Bundle Size

**Problema**:
Si se importa `import _ from 'lodash'` o librerías sin tree-shaking, se incluye todo el módulo en el bundle.

**Corrección**: Verificar imports con `npm run analyze` y reemplazar con imports específicos:
```tsx
// ❌ import { format } from 'date-fns' — generalmente bien
// ❌ import _ from 'lodash'
// ✅ import debounce from 'lodash/debounce'
```

---

### [BAJO-33] QueryClient creado en nivel de módulo sin comentario explicativo

**Archivo**: `src/App.tsx:27-35`
**Severidad**: 🟢 BAJO
**Categoría**: Arquitectura / Documentación

**Problema**:
El QueryClient se crea fuera del componente, lo que es intencional (para persistir cache entre hot reloads) pero no es obvio y podría causar problemas en SSR futuro.

**Corrección**: Agregar comentario explicativo:
```tsx
// QueryClient creado fuera del componente para persistir cache entre hot reloads en desarrollo.
// En SSR: mover dentro del componente con useMemo(() => new QueryClient(), [])
const queryClient = new QueryClient({ ... })
```

---

## 8. MANEJO DE ERRORES

### [ALTO-34] Promise.all() sin manejo de fallos parciales

**Archivo**: `src/hooks/useAbsenceApprovals.ts:76-113`
**Severidad**: 🟠 ALTO
**Categoría**: Error Handling / Reliability

**Problema**:
```tsx
// ❌ Si UNA query falla, TODO el Promise.all() falla
const results = await Promise.all(
  absences.map(absence =>
    supabase.from('appointments').select('count')...
  )
)
```

Si falla el conteo de citas afectadas para una sola ausencia, toda la pantalla de aprobación falla.

**Corrección**:
```tsx
// ✅ Promise.allSettled() permite fallos parciales
const results = await Promise.allSettled(
  absences.map(absence => fetchAffectedCount(absence))
)
const counts = results.map(r => r.status === 'fulfilled' ? r.value : 0)
```

---

### [ALTO-35] Errores silenciosos en AuthContext

**Archivo**: `src/hooks/useAuth.ts:83-84, 210-213`
**Severidad**: 🟠 ALTO
**Categoría**: Error Handling / UX

**Problema**:
```tsx
// Line 83-84 — retorna null silenciosamente sin notificar al usuario
if (error && error.code !== 'PGRST116') { return null }

// Line 210-213 — error de creación de perfil solo se verifica por código
```

Si hay un error creando el perfil del usuario nuevo, el usuario ve la app "funcionando" pero sin datos correctos.

**Corrección**: Siempre mostrar feedback al usuario con `toast.error()` para errores que afectan su experiencia.

---

### [MEDIO-36] Falta de Error Boundaries en componentes críticos

**Afecta**: `AppointmentWizard`, `CompleteUnifiedSettings`, `AdminDashboard`
**Severidad**: 🟡 MEDIO
**Categoría**: Error Handling

**Problema**:
Un error de rendering en estos componentes desmonta toda la app. React 19 tiene soporte mejorado para error boundaries pero no se está aprovechando en los componentes de mayor riesgo.

**Corrección**: Envolver con `<ErrorBoundary>`:
```tsx
<ErrorBoundary fallback={<SettingsErrorFallback />}>
  <CompleteUnifiedSettings />
</ErrorBoundary>
```

---

### [MEDIO-37] useEffect sin cleanup en múltiples suscripciones

**Archivos**: `useAuthSimple.ts`, suscripciones Realtime en varios hooks
**Severidad**: 🟡 MEDIO
**Categoría**: Memory Leaks

**Problema**:
Suscripciones a `supabase.auth.onAuthStateChange()` y canales Realtime que no tienen cleanup function en su `useEffect`.

**Corrección**:
```tsx
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(handler)
  return () => subscription.unsubscribe() // Siempre
}, [])
```

---

### [MEDIO-38] Manejo de errores inconsistente en servicios

**Archivos**: Todos los archivos en `src/lib/services/`
**Severidad**: 🟡 MEDIO
**Categoría**: Architecture / Error Handling

**Problema**:
Cada servicio maneja errores de forma distinta:
- `appointments.ts`: usa `.single()` que lanza si no encuentra (throw)
- `businesses.ts`: verifica null después del query (return null)
- Otros: ignoran el error de Supabase

**Corrección**: Estandarizar con `ServiceError` class:
```tsx
export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly cause?: PostgrestError
  ) { super(message); this.name = 'ServiceError' }
}

// En cada servicio:
const { data, error } = await supabase.from('...').select('...')
if (error) throw new ServiceError('FETCH_FAILED', 'No se pudieron cargar los datos', error)
return data
```

---

### [BAJO-39] Rechazo de promesas no manejado globalmente

**Archivo**: `src/App.tsx`
**Severidad**: 🟢 BAJO
**Categoría**: Error Handling

**Corrección**: Agregar manejador global de errores no capturados:
```tsx
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // Opcionalmente: reportar a Sentry
})
```

---

## 9. CAPA DE SERVICIOS — INCONSISTENCIAS

### [MEDIO-40] Servicios faltantes — queries directas en hooks

**Severidad**: 🟡 MEDIO
**Categoría**: Arquitectura

**Servicios que deberían existir pero NO existen**:

| Hook / Archivo | Querías sin servicio | Servicio propuesto |
|----------------|---------------------|-------------------|
| `useChat.ts` | `chat_participants`, `conversations`, `messages` | `chatService.ts` |
| `useTransactions.ts` | `transactions`, `recurring_expenses` | `transactionsService.ts` |
| `useAbsenceApprovals.ts` | `employee_absences`, `absence_approval_requests` | `absencesService.ts` |
| `useInAppNotifications.ts` | `in_app_notifications` | `notificationsService.ts` |
| `useJobVacancies.ts` | `job_vacancies`, `job_applications` | `recruitmentService.ts` |

---

### [MEDIO-41] permisos — sistema legacy sin eliminar

**Archivos**: `src/lib/permissions.ts` (DEPRECATED), `src/lib/permissions-v2.ts`
**Severidad**: 🟡 MEDIO
**Categoría**: Deuda Técnica

**Acción requerida**:
1. `grep -r "from.*permissions'" src/` para encontrar todos los imports
2. Migrar cada uno a `permissions-v2`
3. Eliminar `permissions.ts`

---

### [MEDIO-42] hierarchyService.ts — tipo forzado con `as any`

**Archivo**: `src/lib/hierarchyService.ts:148`
**Severidad**: 🟡 MEDIO
**Categoría**: TypeScript

```tsx
// ❌
.update({ setup_completed: true } as any)

// ✅
const updatePayload: Partial<Tables<'business_employees'>> = { setup_completed: true }
.update(updatePayload)
```

---

## 10. CONTEXTOS — PROBLEMAS

### [ALTO-43] NotificationContext — 10+ console.log en código de producción

**Archivo**: `src/contexts/NotificationContext.tsx:56, 73-98, 115, 129, 160, 171, 176, 186`
**Severidad**: 🟠 ALTO
**Categoría**: Code Quality / Performance

**Problema**:
10+ `console.log` con checks `import.meta.env.DEV` dispersos. Aumenta el bundle size con código condicional y poluciona los logs de desarrollo.

**Corrección**: Crear logger centralizado:
```tsx
// src/lib/logger.ts
const isDev = import.meta.env.DEV
export const logger = {
  debug: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
  info: (...args: unknown[]) => isDev && console.info('[INFO]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args), // siempre en producción
}
```

---

### [MEDIO-44] NotificationContext — Race condition en refs de estado

**Archivo**: `src/contexts/NotificationContext.tsx:53-179`
**Severidad**: 🟡 MEDIO
**Categoría**: Correctness

**Problema**:
Uso de `useRef` para gestionar estado que necesita sincronización (`stateRef`, `hasSubscribedRef`, `lastUserIdRef`). Acceder a `stateRef.current` dentro de event handlers puede producir lecturas del estado stale (desactualizado) si React procesa múltiples updates en batch.

**Corrección**: Usar `useReducer` con callbacks de eventos, o asegurar que los refs se actualicen de forma sincrónica después de cada cambio de estado con `useLayoutEffect`.

---

## 11. SEGURIDAD

### [MEDIO-45] Credenciales de prueba en código de producción

**Archivo**: `src/hooks/useAuth.ts:452-455, 665`
**Severidad**: 🟡 MEDIO
**Categoría**: Seguridad

**Problema**:
```tsx
// TODO: REMOVE BEFORE PRODUCTION
const testPassword = 'TestPassword123!'  // hardcodeado
```
Magic link también marcado como "TODO: REMOVE" pero sigue en el código.

**Corrección**: Eliminar INMEDIATAMENTE. Si se necesita para testing, usar variables de entorno:
```tsx
if (import.meta.env.DEV && import.meta.env.VITE_TEST_PASSWORD) {
  // Only in development with explicit env var
}
```

---

### [MEDIO-46] Sin validación de longitud en sendMessage

**Archivo**: `src/hooks/useChat.ts:407-450`
**Severidad**: 🟡 MEDIO
**Categoría**: Seguridad / UX

**Problema**:
`sendMessage` acepta `params.content` sin validación:
- Sin límite de longitud (podría enviar mensajes de MB)
- Sin sanitización básica
- Sin rate-limiting en cliente

**Corrección**:
```tsx
if (!params.content?.trim()) throw new Error('El mensaje no puede estar vacío')
if (params.content.length > 5000) throw new Error('Mensaje demasiado largo (máx. 5,000 caracteres)')
```

---

### [MEDIO-47] Demo user con ID hardcodeado

**Archivo**: `src/hooks/useAuth.ts:39-73`
**Severidad**: 🟡 MEDIO
**Categoría**: Seguridad

**Problema**:
Usuario demo con `id: 'demo-user-id'` hardcodeado. Aunque marcado para demo mode, podría ser un vector de bypass en configuraciones incorrectas.

**Corrección**: Envolver estrictamente:
```tsx
if (!import.meta.env.VITE_DEMO_MODE || import.meta.env.VITE_DEMO_MODE !== 'true') {
  throw new Error('Demo mode not enabled')
}
```

---

### [BAJO-48] console.warn visible en producción

**Archivo**: `src/contexts/AuthContext.tsx:42`
**Severidad**: 🟢 BAJO
**Categoría**: Seguridad / Code Quality

```tsx
// ❌ Visible en producción — puede exponer información de arquitectura
console.warn('[useAuth] AuthContext is not available...')

// ✅
if (import.meta.env.DEV) console.warn(...)
```

---

## 12. CALIDAD DE CÓDIGO

### [ALTO-49] 103 archivos con console.log/warn/error en código de producción

**Afecta**: Todo el proyecto
**Severidad**: 🟠 ALTO
**Categoría**: Code Quality

**Archivos con más incidencias**:
- `NotificationContext.tsx` (8+)
- `MainApp.tsx` (4+)
- `AppointmentsCalendar.tsx` (4+)
- `useAuthSimple.ts` (3+)

**Corrección**:
1. Crear `src/lib/logger.ts` (ver [ALTO-43])
2. Global replace de `console.log` → `logger.debug`
3. Mantener `console.error` → `logger.error` (visible en producción para errores reales)

---

### [ALTO-50] 28+ colores hex hardcodeados — Rompe el sistema de temas

**Archivos**: `DashboardScreen.tsx`, `App.tsx`, `MonthlyTrendChart.tsx`, `ConfirmationStep.tsx`, componentes de billing y charts
**Severidad**: 🟠 ALTO
**Categoría**: Design System / Mantenibilidad

**Problema**:
Colores hardcodeados ignorando el sistema de temas CSS/Tailwind:
```tsx
// ❌
color: '#667eea'
backgroundColor: '#1a1a1a'
stroke="#10b981"
```

Esto hace que el dark/light mode no funcione correctamente en estos componentes.

**Corrección**:
```tsx
// src/constants/chartColors.ts
export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--chart-1))',
  danger: 'hsl(var(--chart-2))',
  // ...
} as const
```

---

### [MEDIO-51] 28+ comentarios TODO/FIXME — Deuda técnica sin trackear

**Afecta**: Múltiples archivos
**Severidad**: 🟡 MEDIO
**Categoría**: Proceso / Technical Debt

**TODOs críticos detectados**:

| Archivo | Comentario | Acción |
|---------|-----------|--------|
| `AuthScreen.tsx:25,41,261` | "Remove magic link before production" | Eliminar YA |
| `useAuth.ts:452-455` | "REMOVE BEFORE PRODUCTION" | Eliminar YA |
| `EmployeeManagementHierarchy.tsx:109` | "Add is_active field" | Issue GitHub |
| `ConversationList.tsx:64,65,190` | "Add is_pinned field" | Issue GitHub |
| `ChatLayout.tsx:136-164` | "Typing indicator, edit/delete, archive" | Issues GitHub |
| `ClientHistory.tsx:92` | "TODO: All hooks must go first" | Fix inmediato |

**Corrección**:
- TODOs de seguridad: eliminar inmediatamente
- TODOs de features: crear issues en GitHub con formato `// TODO: GH-{number}: descripción`
- TODOs de fixes: sprint actual

---

### [MEDIO-52] Strings sin i18n en componentes UI

**Afecta**: Múltiples componentes
**Severidad**: 🟡 MEDIO
**Categoría**: i18n / Internacionalización

**Problema**:
Strings literales en español hardcodeados en componentes que ya tienen el sistema i18n implementado:
```tsx
<span>Cargar más</span>
<Button>Guardar cambios</Button>
<p>No se encontraron resultados</p>
```

**Corrección**: Usar `const { t } = useLanguage()` y clave de traducción apropiada.

---

### [BAJO-53] AppLoader definido inline en App.tsx

**Archivo**: `src/App.tsx:46-56`
**Severidad**: 🟢 BAJO
**Categoría**: Code Organization

**Corrección**: Extraer a `src/components/ui/AppLoader.tsx`.

---

## 13. ACCESIBILIDAD

### [MEDIO-54] Componentes de chat sin atributos ARIA

**Afecta**: `ChatWindow`, `ConversationList`, `MessageBubble`, `TypingIndicator`
**Severidad**: 🟡 MEDIO
**Categoría**: Accesibilidad

**Problema**:
El módulo de chat probablemente carece de:
- `aria-live="polite"` en el área de mensajes (nuevos mensajes leídos por screen readers)
- `role="log"` en el contenedor de mensajes
- `aria-label` en los botones de acción de chat

**Corrección**:
```tsx
<div role="log" aria-live="polite" aria-label="Mensajes del chat">
  {messages.map(msg => <MessageBubble key={msg.id} {...msg} />)}
</div>
```

---

### [BAJO-55] Falta `aria-label` en botones de iconos

**Afecta**: Botones con solo íconos (Phosphor/Lucide) sin texto visible
**Severidad**: 🟢 BAJO
**Categoría**: Accesibilidad

**Corrección**:
```tsx
// ❌
<Button><TrashIcon /></Button>

// ✅
<Button aria-label="Eliminar servicio"><TrashIcon aria-hidden="true" /></Button>
```

---

## 14. HALLAZGOS POSITIVOS

A pesar de los problemas detectados, el proyecto tiene bases sólidas:

✅ **Estructura clara**: Separación limpia de contexts, services, components, hooks
✅ **React Query integrado**: `QUERY_CONFIG` con STABLE/FREQUENT/REALTIME bien definidos
✅ **Singleton pattern**: AuthContext y cliente Supabase correctamente centralizados
✅ **Sistema de permisos robusto**: 1,919+ permisos, owner bypass, templates
✅ **i18n modular**: 44 archivos por idioma, ~2,200 claves, completamente type-safe
✅ **Dependencias actualizadas**: React 19, TypeScript 5.7, Vite 6, todas en última versión
✅ **RLS implementado**: Seguridad a nivel de base de datos en todas las tablas
✅ **Sistema de cards reutilizables**: Patrón self-fetch implementado
✅ **Lazy loading aplicado**: PermissionsManager y componentes pesados con carga diferida
✅ **Versión semántica**: Proceso de versioning documentado

---

## 15. PLAN DE REFACTORIZACIÓN POR FASES

### FASE 1 — Urgente · Impacto inmediato · 1-2 semanas

| # | Hallazgo | Archivo(s) | Esfuerzo |
|---|---------|-----------|---------|
| 1 | Eliminar credenciales hardcodeadas de producción | `useAuth.ts`, `AuthScreen.tsx` | Muy bajo |
| 2 | Eliminar `useInAppNotifications-OLD.ts` | — | Muy bajo |
| 3 | Crear `src/lib/logger.ts` y reemplazar console.log | 103 archivos | Medio |
| 4 | Agregar `useMemo` en context providers | 5 contextos | Bajo |
| 5 | Migrar `useTransactions` a React Query | `useTransactions.ts` | Medio |
| 6 | Migrar `useAbsenceApprovals` a React Query | `useAbsenceApprovals.ts` | Medio |
| 7 | Reemplazar `Promise.all` con `Promise.allSettled` | `useAbsenceApprovals.ts` | Muy bajo |
| 8 | Migrar permisisons.ts legacy a v2 y eliminar | 2 archivos | Bajo |
| 9 | Resolver TODOs de seguridad críticos | `AuthScreen.tsx`, `useAuth.ts` | Bajo |

---

### FASE 2 — Alta prioridad · Calidad de código · 2-4 semanas

| # | Hallazgo | Archivo(s) | Esfuerzo |
|---|---------|-----------|---------|
| 10 | Refactorizar `AppointmentWizard` (1,171 → 10 archivos) | `AppointmentWizard.tsx` | Alto |
| 11 | Refactorizar `CompleteUnifiedSettings` (1,842 → 12 archivos) | `CompleteUnifiedSettings.tsx` | Muy alto |
| 12 | Crear `ServiceError` class y estandarizar manejo de errores | Todos los servicios | Medio |
| 13 | Reemplazar los 49 `as any` con tipos correctos | 22 archivos | Alto |
| 14 | Crear servicios faltantes: `chatService`, `transactionsService`, etc. | — | Medio |
| 15 | Eliminar colores hex hardcodeados → usar variables CSS | 6+ archivos | Medio |
| 16 | Consolidar query keys en `queryConfig.ts` | 74 hooks | Medio |

---

### FASE 3 — Mejoras de rendimiento · 3-4 semanas

| # | Hallazgo | Archivo(s) | Esfuerzo |
|---|---------|-----------|---------|
| 17 | Crear RPC para `get_conversations_with_participants` | SQL + `useChat.ts` | Medio |
| 18 | Virtualizar listas largas (`TransactionList`, `ConversationList`) | 3 componentes | Medio |
| 19 | Auditar y aplicar `useCallback`/`useMemo` faltantes | 74 hooks | Alto |
| 20 | Reemplazar `.select('*')` con columnas específicas | 10+ archivos | Bajo |
| 21 | Refactorizar `NotificationContext` (race conditions + refs) | `NotificationContext.tsx` | Alto |
| 22 | Consolidar efectos en `ThemeProvider` | `ThemeProvider.tsx` | Bajo |

---

### FASE 4 — Calidad y mantenibilidad · Continuo

| # | Hallazgo | Archivo(s) | Esfuerzo |
|---|---------|-----------|---------|
| 23 | Convertir 28+ TODOs a issues de GitHub | Múltiples | Bajo |
| 24 | Internacionalizar strings hardcodeados | Múltiples | Medio |
| 25 | Agregar Error Boundaries en componentes críticos | 5+ componentes | Bajo |
| 26 | Agregar atributos ARIA en chat y botones de iconos | Chat components | Medio |
| 27 | Migrar hooks manuales restantes a React Query | 15+ hooks | Muy alto |
| 28 | Agregar validación con Zod en capa de servicios | Servicios | Alto |
| 29 | Implementar paginación en listas | 5+ listados | Alto |
| 30 | Agregar `aria-label` en botones solo-icono | Múltiples | Bajo |

---

## MÉTRICAS OBJETIVO POST-REFACTORIZACIÓN

| Métrica | Estado actual | Objetivo |
|---------|--------------|---------|
| Componente más grande | 1,842 líneas | <300 líneas |
| Instancias `as any` | 49 | 0 |
| Archivos con console.log | 103 | 0 (usar logger) |
| Hooks con estado manual (no React Query) | ~15 | 0 |
| Colores hex hardcodeados | 28+ | 0 |
| TODOs sin trackear | 28+ | 0 (todos en GitHub Issues) |
| Cobertura de servicios | ~60% | 95%+ |
| N+1 queries detectadas | 2+ | 0 |

---

*Documento generado: Marzo 2026 · Auditoría por Claude Code (Anthropic)*
*Codebase auditado: Gestabiz v0.0.6 — `src/`, `supabase/`, contextos, hooks, servicios*

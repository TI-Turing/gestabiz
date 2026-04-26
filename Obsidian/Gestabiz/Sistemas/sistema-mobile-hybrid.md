---
date: 2026-04-26
tags: [mobile, expo, react-native, eas, cliente]
status: completed
---

# Sistema Mobile (Expo React Native)

La app móvil de Gestabiz es una **app React Native nativa** en `src/mobile/`. No es WebView — tiene sus propios componentes, navegación y tema.

## Stack

- **Expo SDK 51** + React Native 0.74
- **React Navigation 6**: BottomTabs + NativeStack
- **TanStack React Query 5**: cache idéntica a web (STABLE/FREQUENT/REALTIME)
- **Supabase JS v2**: mismo cliente singleton (`src/mobile/src/lib/supabase.ts`)
- **Theme propio**: `ThemeContext`, `useTheme()`, tokens en `src/mobile/src/theme/`
- **StyleSheet** + no NativeWind (estilos inline con tema)

## Estructura de pantallas (cliente)

| Pantalla | Estado | Notas |
|----------|--------|-------|
| `ClientDashboardScreen` | ✅ Paridad | Filtro upcoming: `['scheduled', 'confirmed', 'pending']` |
| `ClientAppointmentsScreen` | ✅ Paridad | Pending + employeeTitle + banner fallback + hero radius.lg |
| `AppointmentHistoryScreen` | ✅ Completo | Stats card + filtros rango/status |
| `CalendarScreen` / `CalendarView` | ✅ Completo | Grilla mensual, dots por status, pending incluido |
| `SearchScreen` | ✅ Paridad | 3 tipos búsqueda, geo toggle, sort Haversine, distance badge |
| `BusinessProfileScreen` | ✅ Paridad | AppHeader back, tabs Servicios/Sedes/Reseñas/Acerca |
| `BookingScreen` | ✅ Paridad | Wizard 5 pasos, preselección desde BusinessProfile |
| `FavoritesScreen` | ✅ Completo | BusinessCard, heart overlay, empty CTA |
| `ClientProfileScreen` | ✅ Paridad | Cover hero, avatar upload, doc identidad, accesos rápidos |
| `SettingsScreen` | ✅ Paridad | Notifs (email/SMS/WhatsApp), resúmenes, DND, tema oscuro |
| `WriteReviewScreen` | ✅ Completo | Selector negocio/empleado, wraps ReviewForm |
| `PendingReviewsScreen` | ✅ Completo | Lista citas sin reseña, navega a WriteReview |
| `AppointmentConfirmationScreen` | ✅ Completo | Deep-link `/confirmar-cita/:token` |
| `AppointmentCancellationScreen` | ✅ Completo | Deep-link `/cancelar-cita/:token` |

## Pantallas admin y employee

Existen en `src/mobile/src/screens/admin/` y `src/mobile/src/screens/employee/` pero no son el foco del sprint de paridad cliente.

## Navegación (App.tsx en `src/mobile/`)

```
RootStack (modal)
├── ClientRoot (BottomTabs)
│   ├── Inicio tab → ClientDashboardScreen
│   ├── MisCitas tab → ClientAppointmentsStack
│   ├── Buscar tab → ClientSearchStack
│   ├── Reservar tab → BookingScreen
│   └── Perfil tab → ClientProfileStack
├── WriteReview (global, sin tabs)
├── ConfirmarCita / CancelarCita (deep-links públicos)
└── AdminRoot / EmployeeRoot (otros roles)
```

## Patrones críticos

### Two-step query (OBLIGATORIO)
`appointments` no tiene columnas denormalizadas (`client_name`, `service_name`, etc.). Siempre:
```ts
// Paso 1: fetch appointments
const { data: apts } = await supabase.from('appointments').select('*').eq('client_id', userId)
// Paso 2: batch fetch en paralelo
const [bizRes, svcRes] = await Promise.all([
  supabase.from('businesses').select('id, name').in('id', businessIds),
  supabase.from('services').select('id, name, price, image_url').in('id', serviceIds),
])
```

### Filtro de estado upcoming
```ts
.in('status', ['scheduled', 'confirmed', 'pending'])
// 'pending' = estado inicial antes de confirmación del negocio — SIEMPRE incluir
```

### employeeTitle (rol del empleado)
```ts
const ROLE_LABELS = { manager: 'Manager', professional: 'Profesional', ... }
// Fetch business_employees.role por clave compuesta (employee_id, business_id)
```

### Deep links (`linking.ts`)
```
gestabiz://confirmar-cita/:token   → AppointmentConfirmationScreen
gestabiz://cancelar-cita/:token    → AppointmentCancellationScreen
gestabiz://app/client/review/:id   → WriteReviewScreen
gestabiz://app/client/pending-reviews → PendingReviewsScreen
```

### Variables de entorno móvil
```bash
EXPO_PUBLIC_SUPABASE_URL=https://...supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # formato nuevo OBLIGATORIO (JWT legacy deshabilitado)
```

## Build

```bash
cd src/mobile
npx expo start          # desarrollo
npx expo start --tunnel # cuando la red bloquea el puerto
eas build --profile preview --platform android  # APK de prueba
```

## Notas relacionadas

- [[sistema-citas]] — Wizard y lógica de citas (web)
- [[sistema-reviews]] — ReviewForm compartido
- [[sistema-notificaciones]] — Canales notificación
- [[2026-04-26-mobile-client-parity-fase3]] — Sesión de paridad sprint

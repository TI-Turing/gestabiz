# Plan de Migración y Paridad Completa: App Móvil Gestabiz

> Última actualización: Abril 2026  
> Estado: 🚧 En progreso

## Resumen Ejecutivo

**Objetivo**: Unificar las dos versiones móviles (`/mobile` y `/src/mobile`) en una sola app nativa en `/src/mobile` con paridad completa respecto a la web app. La app resultante debe replicar todas las funcionalidades, flujos y estilos de la versión web, adaptados a componentes nativos React Native.

**Estado actual**:
- `/mobile` (raíz): Hybrid WebView con Expo 49. Tiene push notifications, deep linking, session persistence, env config. Solo 2 componentes propios.
- `/src/mobile`: Nativa con Expo 51. Tiene 20+ screens, 9 UI primitives, theme system, tipos completos. Le falta infraestructura de la versión hybrid.
- Web app: 150+ componentes, 75+ hooks, 15 módulos admin, 7 módulos employee, 6 módulos client, 60+ UI primitives.

**Enfoque**: Migrar infraestructura de `/mobile` a `/src/mobile`, luego construir todas las pantallas faltantes con componentes nativos. La versión Hybrid WebView queda DEPRECADA.

---

## FASE 0: Migración de Infraestructura (`/mobile` → `/src/mobile`)
> **Prioridad P0 — CRÍTICA** | Migrar features de infraestructura que solo existen en la versión hybrid.

### 0.1 Push Notifications
- [x] Crear `src/mobile/src/lib/push-notifications.ts` — adaptar de `mobile/lib/push-notifications.ts`
- [ ] Crear `src/mobile/src/contexts/NotificationContext.tsx` — adaptar de `mobile/lib/notifications.tsx`
- [ ] Integrar en `App.tsx` provider chain: `<NotificationProvider>`
- [ ] Registrar token al login, eliminar al logout en `AuthContext.tsx`

### 0.2 Deep Linking
- [x] Crear `src/mobile/src/lib/linking.ts` — adaptar de `mobile/lib/linking.ts`
- [ ] Integrar linking config en NavigationContainer de `App.tsx`

### 0.3 Environment Config
- [x] Crear `src/mobile/src/lib/env-config.ts` — adaptar de `mobile/lib/env-config.ts`
- [ ] Actualizar `app.json` con `extra` config (supabaseUrl, supabaseAnonKey, webAppUrl)

### 0.4 Alert System
- [x] Crear `src/mobile/src/lib/alert.ts` — adaptar de `mobile/lib/alert.ts`

### 0.5 Expo Plugins Config
- [ ] Actualizar `app.json` con plugins expo-notifications, expo-camera, expo-image-picker
- [ ] Agregar permisos Android: INTERNET, CAMERA, NOTIFICATIONS, ACCESS_FINE_LOCATION
- [ ] Agregar permisos iOS: NSCameraUsageDescription, NSLocationWhenInUseUsageDescription

### 0.6 Secure Storage para Auth
- [ ] Actualizar `AuthContext.tsx` para persistir sesión en SecureStore (no solo AsyncStorage)

### 0.7 Limpieza
- [ ] Agregar nota en `/mobile/README.md` apuntando a `/src/mobile`

---

## FASE 1: Theme System — Paridad Visual con Web
> **Prioridad P0 — CRÍTICA** | Colores, tipografía y tokens alineados con la web.

### 1.1 Actualizar Theme (`src/mobile/src/theme/index.ts`)
- [x] Colores Light Mode (primary: `#6820F7`, secondary: `#4DB8D9`, accent: `#FF9800`)
- [x] Colores Dark Mode (background: `#0D0D0F`, card: `#1A1A1E`)
- [x] Soporte dual modo: `getTheme(mode: 'light' | 'dark')`
- [x] Tipografía alineada con web: xs/sm/base/lg/xl/2xl/3xl
- [x] Spacing alineado con Tailwind
- [x] Border Radius alineado con web
- [x] Shadows con tinte morado

### 1.2 Theme Provider (Dark/Light mode)
- [x] Crear `src/mobile/src/contexts/ThemeContext.tsx`
- [ ] Integrar `<ThemeProvider>` en `App.tsx`

### 1.3 Actualizar UI Primitives para dual-mode
- [ ] `Avatar.tsx` — colores del theme
- [ ] `Badge.tsx` — variantes: default, secondary, destructive, outline
- [ ] `Button.tsx` — variantes: default (purple), secondary (turquoise), destructive, outline, ghost
- [ ] `Card.tsx` — bg-card, border, shadow
- [ ] `Input.tsx` — focus ring purple, error state red
- [ ] `LoadingSpinner.tsx` — color primary
- [ ] `EmptyState.tsx` — colores del theme
- [ ] `Screen.tsx` — bg-background del theme
- [ ] `StatusBadge.tsx` — colores alineados con web

---

## FASE 2: Componentes UI Faltantes
> **Prioridad P1 — ALTA** | Componentes nativos que existen en la web.

### 2.1 UI Primitives Faltantes
- [ ] `Switch.tsx` — toggle on/off
- [ ] `Select.tsx` / `Picker.tsx` — dropdown nativo
- [ ] `Tabs.tsx` — tab navigation horizontal
- [ ] `Modal.tsx` — modal/dialog estándar con overlay
- [ ] `Toast.tsx` — notificaciones tipo toast (success/error/info/warning)
- [ ] `SearchInput.tsx` — input con icono lupa y debounce 300ms
- [ ] `Skeleton.tsx` — loading placeholder con shimmer
- [ ] `Separator.tsx` — divider horizontal/vertical
- [ ] `ProgressBar.tsx` — barra de progreso (para wizard)
- [ ] `DatePicker.tsx` — wrapper de @react-native-community/datetimepicker
- [ ] `TimePicker.tsx` — picker de hora
- [ ] `RadioGroup.tsx` — opciones radio nativas
- [ ] `Checkbox.tsx` — checkbox nativo
- [ ] `ConfirmDialog.tsx` — dialog de confirmación
- [ ] `FAB.tsx` — Floating Action Button
- [ ] `PullToRefresh.tsx` — wrapper de RefreshControl
- [ ] `SectionHeader.tsx` — header de sección con título + acción
- [ ] `StarRating.tsx` — rating de 1-5 estrellas
- [ ] `CurrencyText.tsx` — formateador de moneda COP

### 2.2 Card Components (Self-Fetching)
- [ ] `cards/AppointmentCard.tsx` — cita (self-fetch por appointmentId)
- [ ] `cards/BusinessCard.tsx` — negocio (self-fetch por businessId)
- [ ] `cards/ServiceCard.tsx` — servicio (self-fetch por serviceId)
- [ ] `cards/EmployeeCard.tsx` — empleado (self-fetch por employeeId)
- [ ] `cards/LocationCard.tsx` — sede (self-fetch por locationId)
- [ ] `cards/ClientCard.tsx` — cliente (self-fetch + stats)
- [ ] `cards/ReviewCard.tsx` — review (estrellas, comentario, respuesta)
- [ ] `cards/VacancyCard.tsx` — vacante (título, salario, skills)
- [ ] `cards/NotificationCard.tsx` — notificación in-app

---

## FASE 3: Servicios y Hooks Compartidos
> **Prioridad P0/P1** | Capa de datos que replica la lógica de la web.

### 3.1 Services Layer (`src/mobile/src/lib/services/`)
- [ ] `appointments.ts` — CRUD citas + cancelación
- [ ] `businesses.ts` — getById, getBySlug, search
- [ ] `clients.ts` — getByBusiness, historial
- [ ] `locations.ts` — list, getById
- [ ] `profiles.ts` — getById, update
- [ ] `services.ts` — CRUD servicios
- [ ] `resources.ts` — CRUD recursos + disponibilidad
- [ ] `employees.ts` — getByBusiness, getForChat
- [ ] `absences.ts` — request, approve, reject, listByEmployee, listByBusiness
- [ ] `transactions.ts` — CRUD + fiscal
- [ ] `reviews.ts` — create, respond, list
- [ ] `notifications.ts` — getInApp, markRead
- [ ] `permissions.ts` — check, getForUser
- [ ] `vacancies.ts` — CRUD vacantes + aplicaciones

### 3.2 Hooks de Datos (`src/mobile/src/hooks/`)
- [ ] `useAdminBusinesses.ts`
- [ ] `useEmployeeBusinesses.ts`
- [ ] `usePermissions.ts`
- [ ] `useInAppNotifications.ts` — 1 query + filtros locales
- [ ] `useEmployeeAbsences.ts`
- [ ] `useAbsenceApprovals.ts`
- [ ] `usePublicHolidays.ts` — cache 24h
- [ ] `usePreferredLocation.ts`
- [ ] `useBusinessHierarchy.ts`
- [ ] `useJobVacancies.ts`
- [ ] `useJobApplications.ts`
- [ ] `useReviews.ts`
- [ ] `useChat.ts`
- [ ] `useConversations.ts`
- [ ] `useMessages.ts`
- [ ] `useTransactions.ts`
- [ ] `useBusinessTaxConfig.ts`
- [ ] `useFinancialReports.ts`
- [ ] `useSubscription.ts`
- [ ] `useFavorites.ts`
- [ ] `useGeolocation.ts`
- [ ] `useDebounce.ts`
- [ ] `useAssigneeAvailability.ts`
- [ ] `useBusinessEmployeesForChat.ts`
- [ ] `useWizardDataCache.ts`

---

## FASE 4: Pantallas Admin Faltantes
> **Prioridad P2 — MEDIA** | Completar módulos del dashboard admin.

### 4.1 Overview/Dashboard Mejorado
- [ ] Mejorar `AdminDashboardScreen.tsx`: KPIs, mini chart, citas del día, accesos rápidos

### 4.2 Calendario de Citas (Admin)
- [ ] Crear `screens/admin/AppointmentsCalendarScreen.tsx` — calendario mensual + lista diaria + filtros

### 4.3 Gestión de Recursos Físicos
- [ ] Crear `screens/admin/ResourcesScreen.tsx` — CRUD recursos, 15 tipos, asignar servicios

### 4.4 Reclutamiento
- [ ] Crear `screens/admin/RecruitmentScreen.tsx` — dashboard vacantes + aplicaciones
- [ ] Crear `screens/admin/CreateVacancyScreen.tsx` — formulario vacante
- [ ] Crear `screens/admin/VacancyDetailScreen.tsx` — detalle + lista aplicantes
- [ ] Crear `screens/admin/ApplicantProfileScreen.tsx` — perfil aplicante + CV

### 4.5 Gastos/Egresos
- [ ] Crear `screens/admin/ExpensesScreen.tsx` — lista gastos, crear gasto, recurrentes

### 4.6 Reportes Financieros
- [ ] Crear `screens/admin/ReportsScreen.tsx` — KPIs + gráficas + exportar

### 4.7 Facturación/Billing
- [ ] Crear `screens/admin/BillingScreen.tsx` — plan actual, historial, uso, deep link web para pago

### 4.8 Permisos
- [ ] Crear `screens/admin/PermissionsScreen.tsx` — lista usuarios, asignar/revocar, templates

### 4.9 Notificaciones Admin
- [ ] Crear `screens/admin/NotificationSettingsScreen.tsx` — configurar canales y recordatorios

### 4.10 QR de Negocio
- [ ] Crear `screens/admin/BusinessQRScreen.tsx` — generar + compartir QR del perfil público

### 4.11 Ventas Rápidas
- [ ] Crear `screens/admin/QuickSaleScreen.tsx` — formulario venta, stats día, últimas 10

---

## FASE 5: Pantallas Employee Faltantes
> **Prioridad P2 — MEDIA**

### 5.1 Mis Empleos
- [ ] Crear `screens/employee/MyEmploymentsScreen.tsx` — lista negocios donde trabaja

### 5.2 Calendario del Empleado
- [ ] Crear `screens/employee/EmployeeCalendarScreen.tsx` — mis citas + ausencias + festivos

### 5.3 Marketplace de Vacantes
- [ ] Crear `screens/employee/VacanciesMarketplaceScreen.tsx` — vacantes + matching + aplicar

### 5.4 Perfil Profesional
- [ ] Crear `screens/employee/ProfessionalProfileScreen.tsx` — skills, horarios, servicios, salario

### 5.5 Solicitud de Ausencia mejorada
- [ ] Mejorar `AbsenceRequestScreen.tsx` — range highlighting, festivos, balance vacaciones

---

## FASE 6: Pantallas Client Faltantes
> **Prioridad P1 — ALTA** | Core user flow para clientes.

### 6.1 Appointment Wizard Completo (8 pasos)
- [ ] Refactorizar `BookingScreen.tsx` a wizard multi-paso:
  - [ ] Paso 1: BusinessSelection
  - [ ] Paso 2: EmployeeBusinessSelection (condicional)
  - [ ] Paso 3: ServiceSelection
  - [ ] Paso 4: LocationSelection
  - [ ] Paso 5: EmployeeSelection / ResourceSelection
  - [ ] Paso 6: DateTimeSelection con validaciones (overlap, almuerzo, festivos, ausencias)
  - [ ] Paso 7: ConfirmationStep
  - [ ] Paso 8: SuccessStep
- [ ] ProgressBar nativo con checks en pasos completados

### 6.2 Búsqueda Avanzada
- [ ] Crear `screens/client/SearchScreen.tsx` — SearchBar, filtros, resultados con ranking, geolocalización

### 6.3 Perfil Público de Negocio mejorado
- [ ] Mejorar `BusinessProfileScreen.tsx` — 4 tabs (Servicios, Ubicaciones, Reseñas, Acerca de), Reservar, Chatear, Favorito

### 6.4 Historial de Citas
- [ ] Crear `screens/client/AppointmentHistoryScreen.tsx` — filtros, review, re-agendar

### 6.5 Favoritos
- [ ] Crear `screens/client/FavoritesScreen.tsx` — lista negocios favoritos, toggle

### 6.6 Vista Calendario Cliente
- [ ] Crear `screens/client/CalendarScreen.tsx` — calendario mensual con mis citas

---

## FASE 7: Chat en Tiempo Real
> **Prioridad P2 — MEDIA**

### 7.1 Infraestructura Chat
- [ ] Crear `screens/chat/ConversationListScreen.tsx` — lista conversaciones, unread badge
- [ ] Crear `screens/chat/ChatScreen.tsx` — burbujas, input, typing indicator, read receipts, paginación
- [ ] Crear `components/chat/MessageBubble.tsx`
- [ ] Crear `components/chat/ChatInput.tsx`
- [ ] Crear `components/chat/TypingIndicator.tsx`
- [ ] Crear `components/chat/FileAttachment.tsx`
- [ ] Supabase Realtime subscription para nuevos mensajes
- [ ] Deep link desde push notification → conversación

### 7.2 Modal "Chatear con"
- [ ] Crear `components/ChatWithEmployeeModal.tsx` — lista empleados allow_client_messages=true

---

## FASE 8: Notificaciones In-App
> **Prioridad P2 — MEDIA**

- [ ] Crear `screens/notifications/NotificationsScreen.tsx` — lista, filtros, swipe, navegación contextual
- [ ] Crear `components/NotificationBell.tsx` — icono en header con badge count

---

## FASE 9: Reviews y Calificaciones
> **Prioridad P3 — BAJA**

- [ ] `components/reviews/ReviewCard.tsx` — display review con avatar anónimo
- [ ] `components/reviews/ReviewForm.tsx` — 5 estrellas tap + comentario
- [ ] `components/reviews/ReviewList.tsx` — lista con stats y distribución
- [ ] Integrar reviews en BusinessProfileScreen (tab Reseñas)
- [ ] ReviewForm en AppointmentHistoryScreen (si cita completada sin review)

---

## FASE 10: Settings Unificados
> **Prioridad P3 — BAJA**

- [ ] Crear `screens/settings/SettingsScreen.tsx` — tabs por rol (Común/Admin/Employee/Client)
- [ ] Mejorar pantallas de perfil — avatar upload, documento, género

---

## FASE 11: Funcionalidades Adicionales
> **Prioridad P3 — BAJA**

- [ ] `screens/client/QRScannerScreen.tsx` — escanear QR → abrir perfil negocio
- [ ] `components/BugReportModal.tsx` — descripción + severidad + screenshot
- [ ] `screens/onboarding/AdminOnboardingScreen.tsx`
- [ ] `screens/onboarding/EmployeeOnboardingScreen.tsx`

---

## FASE 12: Navegación Final y Polish
> **Prioridad P2 — MEDIA** | Reorganizar navigación completa.

### Admin Tabs (5)
- [ ] Inicio / Citas / Clientes / Chat / Más

### Employee Tabs (5)
- [ ] Inicio / Citas / Clientes / Chat / Más

### Client Tabs (5)
- [ ] Inicio / Reservar / Mis Citas / Chat / Más

### Polish
- [ ] Role switcher en header con dropdown
- [ ] NotificationBell en todos los headers
- [ ] Pull-to-refresh en todas las listas
- [ ] Back button consistente en screens anidadas

---

## FASE 13: Testing y QA
> **Prioridad P3 — BAJA**

- [ ] Flujo completo reserva (8 pasos) como Cliente
- [ ] Gestión de citas como Admin
- [ ] Solicitar ausencia + aprobación
- [ ] Chat end-to-end
- [ ] Push notifications (device físico)
- [ ] Deep linking
- [ ] Cambio de rol dinámico
- [ ] Tema claro/oscuro
- [ ] Performance: React Query cache, no memory leaks, tiempos < 3s
- [ ] iOS: SafeAreaView, StatusBar, KeyboardAvoidingView
- [ ] Android: back button, notification channels, permisos

---

## Dependencias a Agregar

```json
{
  "expo-notifications": "~0.28.x",
  "expo-device": "~6.0.x",
  "expo-secure-store": "~13.0.x",
  "expo-image-picker": "~15.0.x",
  "expo-camera": "~15.0.x",
  "expo-linking": "~6.3.x",
  "expo-haptics": "~13.0.x",
  "expo-file-system": "~17.0.x",
  "expo-sharing": "~12.0.x",
  "react-native-calendars": "^1.1304.x",
  "react-native-chart-kit": "^6.12.x",
  "react-native-qrcode-svg": "^6.3.x",
  "react-native-reanimated": "~3.10.x",
  "@gorhom/bottom-sheet": "^4.6.x"
}
```

---

## Resumen de Archivos

| Fase | Nuevos | Modificados |
|------|--------|-------------|
| 0 — Infraestructura | 5 | 2 (AuthContext, app.json) |
| 1 — Theme | 2 | 10 (UI primitives) |
| 2 — UI Primitives | 28 | 0 |
| 3 — Services/Hooks | 30 | 0 |
| 4 — Admin Screens | 11 | 1 (Dashboard) |
| 5 — Employee Screens | 4 | 1 (AbsenceRequest) |
| 6 — Client Screens | 5 | 1 (BookingScreen) |
| 7 — Chat | 7 | 0 |
| 8 — Notificaciones | 2 | 0 |
| 9 — Reviews | 3 | 2 |
| 10 — Settings | 1 | 2 |
| 11 — Adicionales | 4 | 0 |
| 12 — Navegación | 0 | 3 (App.tsx + menus) |
| **TOTAL** | **~102** | **~22** |

---

## Prioridades

| Prioridad | Fases | Justificación |
|-----------|-------|---------------|
| **P0 — Crítica** | 0, 1 | Sin esto nada funciona |
| **P1 — Alta** | 2, 6.1 (Wizard), 3 (Services) | Core user flows |
| **P2 — Media** | 4, 5, 6.2-6.6, 7, 8, 12 | Paridad funcional |
| **P3 — Baja** | 9, 10, 11, 13 | Polish y completitud |

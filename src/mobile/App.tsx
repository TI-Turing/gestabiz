import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'
import { Platform, View, ActivityIndicator, LogBox } from 'react-native'
import { useFonts } from 'expo-font'
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit'

// Supabase emite console.error internamente cuando el refresh token expira.
// El error es manejado correctamente en AuthContext (signOut + redirect a login).
LogBox.ignoreLogs(['AuthApiError: Invalid Refresh Token'])
import { Ionicons } from '@expo/vector-icons'

// Foundation
import { ToastContainer } from './src/components/ui/Toast'
import { queryClient } from './src/lib/queryClient'
import { navigationRef } from './src/lib/navigationRef'
import { AuthProvider, useAuth } from './src/contexts/AuthContext'
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext'
import { NotificationProvider } from './src/contexts/NotificationContext'
import { linking } from './src/lib/linking'
// useUserRoles se mantiene en el codebase pero no se usa aquí mientras la app sea client-only.
import { colors } from './src/theme'
import { FloatingChatButton } from './src/components/chat/FloatingChatButton'

// Auth
import AuthScreen from './src/screens/auth/AuthScreen'

// Admin screens
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen'
import AdminAppointmentsScreen from './src/screens/admin/AdminAppointmentsScreen'
import ClientsScreen from './src/screens/admin/ClientsScreen'
import ServicesScreen from './src/screens/admin/ServicesScreen'
import EmployeesScreen from './src/screens/admin/EmployeesScreen'
import LocationsScreen from './src/screens/admin/LocationsScreen'
import AbsencesScreen from './src/screens/admin/AbsencesScreen'
import SalesScreen from './src/screens/admin/SalesScreen'
import BusinessSettingsScreen from './src/screens/admin/BusinessSettingsScreen'
import MoreScreen from './src/screens/admin/MoreScreen'

// Employee screens
import EmployeeDashboardScreen from './src/screens/employee/EmployeeDashboardScreen'
import EmployeeAppointmentsScreen from './src/screens/employee/EmployeeAppointmentsScreen'
import EmployeeClientsScreen from './src/screens/employee/EmployeeClientsScreen'
import EmployeeSettingsScreen from './src/screens/employee/EmployeeSettingsScreen'
import AbsenceRequestScreen from './src/screens/employee/AbsenceRequestScreen'
import EmployeeCalendarScreen from './src/screens/employee/EmployeeCalendarScreen'
import MyEmploymentsScreen from './src/screens/employee/MyEmploymentsScreen'
import ProfessionalProfileScreen from './src/screens/employee/ProfessionalProfileScreen'
import VacanciesMarketplaceScreen from './src/screens/employee/VacanciesMarketplaceScreen'

// Client screens
// ClientDashboardScreen queda fuera de la navegación porque "Mis Citas"
// (ClientAppointmentsScreen) asume el rol de pantalla de inicio en la paridad
// con la web responsive. El archivo se conserva por si se reactiva.
import BookingScreen from './src/screens/client/BookingScreen'
import ClientAppointmentsScreen from './src/screens/client/ClientAppointmentsScreen'
import ClientProfileScreen from './src/screens/client/ClientProfileScreen'
import BusinessProfileScreen from './src/screens/client/BusinessProfileScreen'
import AppointmentHistoryScreen from './src/screens/client/AppointmentHistoryScreen'
import CalendarScreen from './src/screens/client/CalendarScreen'
import FavoritesScreen from './src/screens/client/FavoritesScreen'
import SearchScreen from './src/screens/client/SearchScreen'
import WriteReviewScreen from './src/screens/client/WriteReviewScreen'
import PendingReviewsScreen from './src/screens/client/PendingReviewsScreen'
import AppointmentConfirmationScreen from './src/screens/client/AppointmentConfirmationScreen'
import AppointmentCancellationScreen from './src/screens/client/AppointmentCancellationScreen'

// Admin additional screens
import AppointmentsCalendarScreen from './src/screens/admin/AppointmentsCalendarScreen'
import BillingScreen from './src/screens/admin/BillingScreen'
import BusinessQRScreen from './src/screens/admin/BusinessQRScreen'
import ExpensesScreen from './src/screens/admin/ExpensesScreen'
import NotificationSettingsScreen from './src/screens/admin/NotificationSettingsScreen'
import PermissionsScreen from './src/screens/admin/PermissionsScreen'
import QuickSaleScreen from './src/screens/admin/QuickSaleScreen'
import RecruitmentScreen from './src/screens/admin/RecruitmentScreen'
import ReportsScreen from './src/screens/admin/ReportsScreen'
import ResourcesScreen from './src/screens/admin/ResourcesScreen'

// Notifications, Chat, Settings
import NotificationsScreen from './src/screens/notifications/NotificationsScreen'
import ChatScreen from './src/screens/chat/ChatScreen'
import ConversationListScreen from './src/screens/chat/ConversationListScreen'
import SettingsScreen from './src/screens/settings/SettingsScreen'

// ─── Configuración de notificaciones ─────────────────────────────────────────

SplashScreen.preventAutoHideAsync()

// ─── Constantes de estilo para navegación ────────────────────────────────────

const TAB_BAR_STYLE = {
  backgroundColor: colors.tabBar,
  borderTopWidth: 1,
  borderTopColor: colors.tabBarBorder,
  paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  paddingTop: 8,
  height: Platform.OS === 'ios' ? 88 : 64,
}

const STACK_HEADER_STYLE = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const },
  headerBackVisible: true,
}

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// ─── Auth Stack ───────────────────────────────────────────────────────────────

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  )
}

// ─── Admin — Stack "Más" (accede a todas las pantallas adicionales) ──────────

function AdminMoreStack() {
  return (
    <Stack.Navigator screenOptions={{ ...STACK_HEADER_STYLE }}>
      <Stack.Screen name="MoreList" component={MoreScreen} options={{ title: 'Más' }} />
      <Stack.Screen name="Servicios" component={ServicesScreen} options={{ title: 'Servicios' }} />
      <Stack.Screen name="Empleados" component={EmployeesScreen} options={{ title: 'Empleados' }} />
      <Stack.Screen name="Sedes" component={LocationsScreen} options={{ title: 'Sedes' }} />
      <Stack.Screen name="Ausencias" component={AbsencesScreen} options={{ title: 'Ausencias' }} />
      <Stack.Screen name="Ventas" component={SalesScreen} options={{ title: 'Historial de ventas' }} />
      <Stack.Screen name="Configuracion" component={BusinessSettingsScreen} options={{ title: 'Config. del negocio' }} />
      <Stack.Screen name="Recursos" component={ResourcesScreen} options={{ title: 'Recursos' }} />
      <Stack.Screen name="Reclutamiento" component={RecruitmentScreen} options={{ title: 'Reclutamiento' }} />
      <Stack.Screen name="Gastos" component={ExpensesScreen} options={{ title: 'Gastos' }} />
      <Stack.Screen name="Reportes" component={ReportsScreen} options={{ title: 'Reportes' }} />
      <Stack.Screen name="Facturacion" component={BillingScreen} options={{ title: 'Facturación' }} />
      <Stack.Screen name="CalendarioCitas" component={AppointmentsCalendarScreen} options={{ title: 'Calendario' }} />
      <Stack.Screen name="ConfigNotificaciones" component={NotificationSettingsScreen} options={{ title: 'Config. notificaciones' }} />
      <Stack.Screen name="Permisos" component={PermissionsScreen} options={{ title: 'Permisos' }} />
      <Stack.Screen name="VentasRapidas" component={QuickSaleScreen} options={{ title: 'Venta rápida' }} />
      <Stack.Screen name="QR" component={BusinessQRScreen} options={{ title: 'Código QR' }} />
      <Stack.Screen name="Notificaciones" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="ConversacionList" component={ConversationListScreen} options={{ title: 'Mensajes' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '' }} />
      <Stack.Screen name="Ajustes" component={SettingsScreen} options={{ title: 'Ajustes de cuenta' }} />
    </Stack.Navigator>
  )
}

// ─── Admin Tabs ───────────────────────────────────────────────────────────────

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Dashboard: ['home', 'home-outline'],
            Citas: ['calendar', 'calendar-outline'],
            Clientes: ['people', 'people-outline'],
            Mas: ['menu', 'menu-outline'],
          }
          const [active, inactive] = icons[route.name] ?? ['help', 'help-outline']
          return <Ionicons name={(focused ? active : inactive) as keyof typeof Ionicons.glyphMap} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ title: 'Resumen' }} />
      <Tab.Screen name="Citas" component={AdminAppointmentsScreen} options={{ title: 'Citas' }} />
      <Tab.Screen name="Clientes" component={ClientsScreen} options={{ title: 'Clientes' }} />
      <Tab.Screen name="Mas" component={AdminMoreStack} options={{ title: 'Más' }} />
    </Tab.Navigator>
  )
}

// ─── Employee Tabs ────────────────────────────────────────────────────────────

function EmployeeMoreStack() {
  return (
    <Stack.Navigator screenOptions={{ ...STACK_HEADER_STYLE }}>
      <Stack.Screen name="EmployeeSettings" component={EmployeeSettingsScreen} options={{ title: 'Mi perfil' }} />
      <Stack.Screen name="SolicitudAusencia" component={AbsenceRequestScreen} options={{ title: 'Solicitar ausencia' }} />
      <Stack.Screen name="MiCalendario" component={EmployeeCalendarScreen} options={{ title: 'Mi calendario' }} />
      <Stack.Screen name="MisEmpleos" component={MyEmploymentsScreen} options={{ title: 'Mis empleos' }} />
      <Stack.Screen name="MiPerfil" component={ProfessionalProfileScreen} options={{ title: 'Perfil profesional' }} />
      <Stack.Screen name="Vacantes" component={VacanciesMarketplaceScreen} options={{ title: 'Vacantes disponibles' }} />
      <Stack.Screen name="Notificaciones" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="ConversacionList" component={ConversationListScreen} options={{ title: 'Mensajes' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '' }} />
      <Stack.Screen name="Ajustes" component={SettingsScreen} options={{ title: 'Ajustes de cuenta' }} />
    </Stack.Navigator>
  )
}

function EmployeeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            EmpDashboard: ['home', 'home-outline'],
            EmpCitas: ['calendar', 'calendar-outline'],
            EmpClientes: ['people', 'people-outline'],
            EmpPerfil: ['person', 'person-outline'],
          }
          const [active, inactive] = icons[route.name] ?? ['help', 'help-outline']
          return <Ionicons name={(focused ? active : inactive) as keyof typeof Ionicons.glyphMap} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="EmpDashboard" component={EmployeeDashboardScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="EmpCitas" component={EmployeeAppointmentsScreen} options={{ title: 'Mis Citas' }} />
      <Tab.Screen name="EmpClientes" component={EmployeeClientsScreen} options={{ title: 'Clientes' }} />
      <Tab.Screen name="EmpPerfil" component={EmployeeMoreStack} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  )
}

// ─── Client Tabs ──────────────────────────────────────────────────────────────

// ─── Client Stacks (paridad con UI web responsive) ───────────────────────────
//
// Estructura de tabs alineada con la web del rol Cliente:
//   Inicio (Mis Citas)  →  ClientHomeStack
//   Favoritos           →  ClientFavoritesStack
//   Historial           →  ClientHistoryStack
//   Buscar              →  ClientSearchStack
//   Perfil              →  ClientProfileStack
//
// El wizard de reserva (BookingScreen) deja de ser un tab: se puebla en cada
// stack para poder hacer push desde cualquier punto (FAB "+ Nueva cita",
// botón "Reservar" en BusinessProfile, etc.).

function ClientHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ ...STACK_HEADER_STYLE }}>
      <Stack.Screen name="MisCitasList" component={ClientAppointmentsScreen} options={{ title: 'Mis Citas', headerShown: false }} />
      <Stack.Screen name="Calendario" component={CalendarScreen} options={{ title: 'Calendario' }} />
      <Stack.Screen name="Reservar" component={BookingScreen} options={{ title: 'Reservar cita', headerShown: false }} />
      <Stack.Screen name="EscribirResena" component={WriteReviewScreen} options={{ title: 'Reseña', headerShown: false }} />
      <Stack.Screen name="ReseñasPendientes" component={PendingReviewsScreen} options={{ title: 'Reseñas pendientes', headerShown: false }} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} options={{ title: 'Negocio' }} />
    </Stack.Navigator>
  )
}

function ClientFavoritesStack() {
  return (
    <Stack.Navigator screenOptions={{ ...STACK_HEADER_STYLE }}>
      <Stack.Screen name="FavoritosList" component={FavoritesScreen} options={{ title: 'Favoritos', headerShown: false }} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} options={{ title: 'Negocio' }} />
      <Stack.Screen name="Reservar" component={BookingScreen} options={{ title: 'Reservar cita', headerShown: false }} />
    </Stack.Navigator>
  )
}

function ClientHistoryStack() {
  return (
    <Stack.Navigator screenOptions={{ ...STACK_HEADER_STYLE }}>
      <Stack.Screen name="HistorialCitas" component={AppointmentHistoryScreen} options={{ title: 'Historial', headerShown: false }} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} options={{ title: 'Negocio' }} />
      <Stack.Screen name="EscribirResena" component={WriteReviewScreen} options={{ title: 'Reseña', headerShown: false }} />
      <Stack.Screen name="ReseñasPendientes" component={PendingReviewsScreen} options={{ title: 'Reseñas pendientes', headerShown: false }} />
    </Stack.Navigator>
  )
}

function ClientSearchStack() {
  return (
    <Stack.Navigator screenOptions={{ ...STACK_HEADER_STYLE }}>
      <Stack.Screen name="Buscar" component={SearchScreen} options={{ title: 'Buscar', headerShown: false }} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} options={{ title: 'Negocio' }} />
      <Stack.Screen name="Reservar" component={BookingScreen} options={{ title: 'Reservar cita', headerShown: false }} />
    </Stack.Navigator>
  )
}

function ClientProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ ...STACK_HEADER_STYLE }}>
      <Stack.Screen name="ClientProfile" component={ClientProfileScreen} options={{ title: 'Mi perfil', headerShown: false }} />
      <Stack.Screen name="Favoritos" component={FavoritesScreen} options={{ title: 'Favoritos' }} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} options={{ title: 'Negocio' }} />
      <Stack.Screen name="Notificaciones" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="ConversacionList" component={ConversationListScreen} options={{ title: 'Mensajes' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '' }} />
      <Stack.Screen name="Ajustes" component={SettingsScreen} options={{ title: 'Ajustes' }} />
      <Stack.Screen name="ReseñasPendientes" component={PendingReviewsScreen} options={{ title: 'Reseñas pendientes', headerShown: false }} />
      <Stack.Screen name="EscribirResena" component={WriteReviewScreen} options={{ title: 'Reseña', headerShown: false }} />
    </Stack.Navigator>
  )
}

function ClientTabs() {
  const { theme } = useTheme()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopWidth: 1,
          borderTopColor: theme.tabBarBorder,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Inicio: ['calendar', 'calendar-outline'],
            Buscar: ['search', 'search-outline'],
            Favoritos: ['heart', 'heart-outline'],
            Historial: ['time', 'time-outline'],
            Perfil: ['person', 'person-outline'],
          }
          const [active, inactive] = icons[route.name] ?? ['help', 'help-outline']
          return <Ionicons name={(focused ? active : inactive) as keyof typeof Ionicons.glyphMap} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Inicio" component={ClientHomeStack} options={{ title: 'Mis Citas' }} />
      <Tab.Screen name="Buscar" component={ClientSearchStack} options={{ title: 'Buscar' }} />
      <Tab.Screen name="Favoritos" component={ClientFavoritesStack} options={{ title: 'Favoritos' }} />
      <Tab.Screen name="Historial" component={ClientHistoryStack} options={{ title: 'Historial' }} />
      <Tab.Screen name="Perfil" component={ClientProfileStack} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  )
}

// ─── App Navigator (detecta rol) ─────────────────────────────────────────────

// TEMP (Abr 2026): App móvil en fase de lanzamiento exclusivo para clientes.
// Los stacks AdminTabs/AdminMoreStack/EmployeeTabs/EmployeeMoreStack se conservan
// definidos pero NO se montan en el NavigationContainer. Cuando se habilite
// multi-rol, restaurar la ramificación por activeRole.
// Marcamos los stacks no usados como "void" para evitar warnings de unused.
void AdminTabs
void EmployeeTabs

// ─── Root Stack (permite deep-links globales sin auth) ───────────────────────

function RootStack({ user }: { user: { id: string } | null }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="AuthRoot" component={AuthStack} />
      ) : (
        <Stack.Screen name="ClientRoot" component={ClientTabs} />
      )}
      {/* Deep-link screens — accesibles sin autenticación */}
      <Stack.Screen name="ConfirmarCita" component={AppointmentConfirmationScreen} />
      <Stack.Screen name="CancelarCita" component={AppointmentCancellationScreen} />
      {/* Chat screens — accesibles desde FloatingChatButton sin requerir tab específica */}
      <Stack.Screen name="ConversacionList" component={ConversationListScreen} options={{ ...STACK_HEADER_STYLE, headerShown: true, title: 'Mensajes' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ ...STACK_HEADER_STYLE, headerShown: true, title: '' }} />
    </Stack.Navigator>
  )
}

function AppNavigator() {
  const { user, loading: authLoading } = useAuth()
  const { theme } = useTheme()
  const [splashHidden, setSplashHidden] = useState(false)

  const isLoading = authLoading

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().then(() => setSplashHidden(true))
    }
  }, [isLoading])

  if (isLoading || !splashHidden) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <NotificationProvider>
        <RootStack user={user} />
        {user && <FloatingChatButton />}
      </NotificationProvider>
    </NavigationContainer>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_Regular: Outfit_400Regular,
    Outfit_Medium: Outfit_500Medium,
    Outfit_SemiBold: Outfit_600SemiBold,
    Outfit_Bold: Outfit_700Bold,
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppNavigator />
            <ToastContainer />
            <StatusBar style="auto" />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}

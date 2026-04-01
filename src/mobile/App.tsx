import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'
import { Platform, View, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

// Foundation
import { queryClient } from './src/lib/queryClient'
import { AuthProvider, useAuth } from './src/contexts/AuthContext'
import { useUserRoles } from './src/hooks/useUserRoles'
import { colors } from './src/theme'

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

// Client screens
import ClientDashboardScreen from './src/screens/client/ClientDashboardScreen'
import BookingScreen from './src/screens/client/BookingScreen'
import ClientAppointmentsScreen from './src/screens/client/ClientAppointmentsScreen'
import ClientProfileScreen from './src/screens/client/ClientProfileScreen'
import BusinessProfileScreen from './src/screens/client/BusinessProfileScreen'

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
      <Stack.Screen name="Configuracion" component={BusinessSettingsScreen} options={{ title: 'Configuración' }} />
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

function ClientProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ ...STACK_HEADER_STYLE }}>
      <Stack.Screen name="ClientProfile" component={ClientProfileScreen} options={{ title: 'Mi perfil' }} />
    </Stack.Navigator>
  )
}

function ClientBookingStack() {
  return (
    <Stack.Navigator screenOptions={{ ...STACK_HEADER_STYLE }}>
      <Stack.Screen name="Reservar" component={BookingScreen} options={{ title: 'Reservar cita', headerShown: false }} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} options={{ title: 'Negocio' }} />
    </Stack.Navigator>
  )
}

function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Inicio: ['home', 'home-outline'],
            Reservar: ['add-circle', 'add-circle-outline'],
            MisCitas: ['calendar', 'calendar-outline'],
            Perfil: ['person', 'person-outline'],
          }
          const [active, inactive] = icons[route.name] ?? ['help', 'help-outline']
          return <Ionicons name={(focused ? active : inactive) as keyof typeof Ionicons.glyphMap} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Inicio" component={ClientDashboardScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Reservar" component={ClientBookingStack} options={{ title: 'Reservar' }} />
      <Tab.Screen name="MisCitas" component={ClientAppointmentsScreen} options={{ title: 'Mis Citas' }} />
      <Tab.Screen name="Perfil" component={ClientProfileStack} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  )
}

// ─── App Navigator (detecta rol) ─────────────────────────────────────────────

function AppNavigator() {
  const { user, loading: authLoading } = useAuth()
  const { activeRole, isLoading: rolesLoading } = useUserRoles(user)
  const [splashHidden, setSplashHidden] = useState(false)

  const isLoading = authLoading || (!!user && rolesLoading)

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().then(() => setSplashHidden(true))
    }
  }, [isLoading])

  if (isLoading || !splashHidden) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : activeRole === 'admin' ? (
        <AdminTabs />
      ) : activeRole === 'employee' ? (
        <EmployeeTabs />
      ) : (
        <ClientTabs />
      )}
    </NavigationContainer>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="light" />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}

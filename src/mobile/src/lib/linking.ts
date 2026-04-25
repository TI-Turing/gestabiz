import * as Linking from 'expo-linking'
import type { LinkingOptions } from '@react-navigation/native'

/**
 * Configuración de Deep Linking para React Navigation.
 *
 * Soporta:
 * - gestabiz://        (esquema personalizado iOS/Android)
 * - https://gestabiz.com
 * - https://app.gestabiz.com
 */
export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [
    'gestabiz://',
    'https://gestabiz.com',
    'https://app.gestabiz.com',
    Linking.createURL('/'),
  ],

  config: {
    screens: {
      // ─── Auth ──────────────────────────────────────────────
      Auth: 'login',

      // ─── Admin tabs ────────────────────────────────────────
      Dashboard: 'app/admin',
      Citas: 'app/admin/appointments',
      Clientes: 'app/admin/clients',
      // Pantallas dentro de AdminMoreStack
      Servicios: 'app/admin/services',
      Empleados: 'app/admin/employees',
      Sedes: 'app/admin/locations',
      Recursos: 'app/admin/resources',
      Ausencias: 'app/admin/absences',
      Reclutamiento: 'app/admin/recruitment',
      Ventas: 'app/admin/sales',
      VentasRapidas: 'app/admin/quick-sale',
      Gastos: 'app/admin/expenses',
      Reportes: 'app/admin/reports',
      Facturacion: 'app/admin/billing',
      CalendarioCitas: 'app/admin/calendar',
      Permisos: 'app/admin/permissions',
      QR: 'app/admin/qr',
      Configuracion: 'app/admin/settings',

      // ─── Employee tabs ─────────────────────────────────────
      EmpDashboard: 'app/employee',
      EmpCitas: 'app/employee/appointments',
      EmpClientes: 'app/employee/clients',
      // Pantallas dentro de EmployeeMoreStack (EmpPerfil tab)
      EmployeeSettings: 'app/employee/me',
      MiCalendario: 'app/employee/calendar',
      MisEmpleos: 'app/employee/employments',
      MiPerfil: 'app/employee/profile',
      Vacantes: 'app/employee/vacancies',
      SolicitudAusencia: 'app/employee/absence-request',

      // ─── Client tabs ───────────────────────────────────────
      // Estructura: Inicio (Mis Citas) | Favoritos | Historial | Buscar | Perfil
      MisCitasList: 'app/client',
      Calendario: 'app/client/calendar',
      Reservar: 'app/client/booking',
      FavoritosList: 'app/client/favorites',
      HistorialCitas: 'app/client/history',
      Buscar: 'app/client/search',
      ClientProfile: 'app/client/profile',
      // Alias legacy: si alguien guardó link a "Favoritos" (screen de
      // ProfileStack) se sigue resolviendo.
      Favoritos: 'app/client/favorites/legacy',

      // ─── Reseñas (cliente) ─────────────────────────────────
      EscribirResena: 'app/client/review/:appointmentId',
      ReseñasPendientes: 'app/client/pending-reviews',

      // ─── Compartidas (accesibles desde notificaciones) ─────
      Chat: 'chat/:conversationId',
      ConversacionList: 'app/messages',
      Notificaciones: 'app/notifications',
      BusinessProfile: 'negocio/:slug',
      Ajustes: 'app/account',
    },
  },
}

/**
 * Crear un deep link programáticamente.
 * @example createDeepLink('app/client') → 'gestabiz://app/client'
 */
export function createDeepLink(path: string): string {
  return Linking.createURL(path)
}

/**
 * Parsear un deep link entrante extrayendo ruta y params.
 */
export async function parseDeepLink(url: string) {
  const { path, queryParams } = Linking.parse(url)
  return { path, queryParams }
}

/**
 * Abrir URL externa en el navegador del sistema.
 */
export async function openExternalUrl(url: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(url)
  if (canOpen) {
    await Linking.openURL(url)
  } else {
  }
}

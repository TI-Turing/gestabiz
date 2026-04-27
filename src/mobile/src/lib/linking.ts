import * as Linking from 'expo-linking'
import type { LinkingOptions } from '@react-navigation/native'

/**
 * Configuración de Deep Linking para React Navigation.
 *
 * Soporta:
 * - gestabiz://        (esquema personalizado iOS/Android)
 * - https://gestabiz.com
 * - https://app.gestabiz.com
 *
 * Jerarquía del navigator (Apr 2026, fase client-only):
 *   RootStack
 *   ├── AuthRoot  → AuthStack → Auth
 *   ├── ClientRoot → ClientTabs → (Inicio|Favoritos|Historial|Buscar|Perfil)
 *   ├── ConfirmarCita  (no auth required)
 *   └── CancelarCita   (no auth required)
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
      AuthRoot: {
        screens: {
          Auth: 'login',
        },
      },

      // ─── Deep-link screens (globales, sin auth) ────────────
      ConfirmarCita: 'confirmar-cita/:token',
      CancelarCita: 'cancelar-cita/:token',

      // ─── Client root ───────────────────────────────────────
      ClientRoot: {
        screens: {
          // Tab: Inicio → ClientHomeStack
          Inicio: {
            screens: {
              MisCitasList: 'app/client',
              Calendario: 'app/client/calendar',
              Reservar: 'app/client/booking',
              EscribirResena: 'app/client/review/:appointmentId',
              ReseñasPendientes: 'app/client/pending-reviews',
              BusinessProfile: 'negocio/:slug',
            },
          },
          // Tab: Favoritos → ClientFavoritesStack
          Favoritos: {
            screens: {
              FavoritosList: 'app/client/favorites',
            },
          },
          // Tab: Historial → ClientHistoryStack
          Historial: {
            screens: {
              HistorialCitas: 'app/client/history',
            },
          },
          // Tab: Buscar → ClientSearchStack
          Buscar: {
            screens: {
              Buscar: 'app/client/search',
            },
          },
          // Tab: Perfil → ClientProfileStack
          Perfil: {
            screens: {
              ClientProfile: 'app/client/profile',
              Notificaciones: 'app/notifications',
              ConversacionList: 'app/messages',
              Chat: 'chat/:conversationId',
              Ajustes: 'app/account',
            },
          },
        },
      },
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

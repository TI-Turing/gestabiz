import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from '../../src/lib/supabase'

/**
 * Configuración global del handler de notificaciones
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

/**
 * Registrar dispositivo para push notifications
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Solo en dispositivos físicos
  if (!Device.isDevice) {    return null
  }

  // Verificar permisos existentes
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  // Solicitar permisos si no existen
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  // Si no se concedieron permisos, retornar null
  if (finalStatus !== 'granted') {    return null
  }

  try {
    // Obtener token de Expo
    const token = (await Notifications.getExpoPushTokenAsync()).data    // Configurar canal de notificaciones (Android)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      })
    }

    return token
  } catch (error) {    return null
  }
}

/**
 * Guardar token en Supabase para enviar notificaciones
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    // Guardar token en tabla user_push_tokens
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          platform: Platform.OS,
          device_name: Device.deviceName || 'Unknown',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,token',
        }
      )

    if (error) {    } else {    }
  } catch (error) {  }
}

/**
 * Eliminar token cuando usuario hace logout
 */
export async function removePushToken(token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_push_tokens')
      .delete()
      .eq('token', token)

    if (error) {    } else {    }
  } catch (error) {  }
}

/**
 * Listener para notificaciones recibidas
 */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler)
}

/**
 * Listener para cuando usuario toca una notificación
 */
export function addNotificationResponseReceivedListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler)
}

/**
 * Obtener todas las notificaciones programadas
 */
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync()
}

/**
 * Cancelar todas las notificaciones programadas
 */
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

/**
 * Obtener badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync()
}

/**
 * Setear badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count)
}



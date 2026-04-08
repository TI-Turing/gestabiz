import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from './supabase'

// Configuración global del handler de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

/**
 * Registrar dispositivo para push notifications.
 * Solo funciona en dispositivos físicos.
 * Retorna el Expo push token o null si no se puede registrar.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {    return null
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Gestabiz',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6820F7',
      })
      await Notifications.setNotificationChannelAsync('appointments', {
        name: 'Citas',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6820F7',
      })
      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Mensajes',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#4DB8D9',
      })
    }

    return token
  } catch (error) {    return null
  }
}

/**
 * Guardar token en Supabase para poder enviar notificaciones push.
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          platform: Platform.OS,
          device_name: Device.deviceName ?? 'Unknown',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      )

    if (error) {    }
  } catch (error) {  }
}

/**
 * Eliminar token al hacer logout para dejar de recibir notificaciones.
 */
export async function removePushToken(token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_push_tokens')
      .delete()
      .eq('token', token)

    if (error) {    }
  } catch (error) {  }
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler)
}

export function addNotificationResponseReceivedListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler)
}

export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync()
}

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count)
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

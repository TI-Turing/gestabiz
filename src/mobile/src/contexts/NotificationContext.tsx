import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import * as Notifications from 'expo-notifications'
import { navigate } from '../lib/navigationRef'
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  setBadgeCount,
} from '../lib/push-notifications'
import type { Subscription } from 'expo-notifications'

interface NotificationContextType {
  /** ID de la conversación de chat actualmente abierta (para suprimir notifs) */
  activeConversationId: string | null
  /** Verdadero cuando la pantalla de chat está visible */
  isChatOpen: boolean
  setActiveConversationId: (id: string | null) => void
  setIsChatOpen: (open: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

/**
 * NotificationProvider — gestiona push notifications y navegación por notificaciones.
 *
 * IMPORTANTE: Este provider debe colocarse DENTRO del NavigationContainer
 * (o usar navigationRef para navegar externamente).
 *
 * Funcionalidades:
 * - Listener en foreground: actualiza badge, suprime si chat activo
 * - Listener en tap: navega a la pantalla correspondiente según tipo
 * - Supresión inteligente: si el chat está abierto y la notif es de esa conversación
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const notificationListener = useRef<Subscription | null>(null)
  const responseListener = useRef<Subscription | null>(null)

  // Guardar referencias para el closure en useEffect
  const isChatOpenRef = useRef(isChatOpen)
  const activeConvIdRef = useRef(activeConversationId)

  useEffect(() => {
    isChatOpenRef.current = isChatOpen
    activeConvIdRef.current = activeConversationId
  }, [isChatOpen, activeConversationId])

  useEffect(() => {
    // Listener cuando llega notificación en foreground
    notificationListener.current = addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown>

      // Suprimir si el chat de esta conversación ya está abierto
      if (
        isChatOpenRef.current &&
        typeof data?.conversationId === 'string' &&
        data.conversationId === activeConvIdRef.current
      ) {        return
      }

      setBadgeCount(1)
    })

    // Listener cuando el usuario toca la notificación
    responseListener.current = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>

      if (data?.route && typeof data.route === 'string') {
        navigate(data.route)
      } else if (data?.type && typeof data.type === 'string') {
        handleNotificationNavigation(data.type, data)
      }

      // Resetear badge al interactuar
      setBadgeCount(0)
    })

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current)
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current)
      }
    }
  }, [])

  const value: NotificationContextType = {
    activeConversationId,
    isChatOpen,
    setActiveConversationId,
    setIsChatOpen,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

/**
 * Navegar según el tipo de notificación usando los screen names de React Navigation.
 * Nombres reales en App.tsx:
 *   Admin:    Dashboard, Citas, Clientes, Mas
 *   Employee: EmpDashboard, EmpCitas, EmpClientes, EmpPerfil
 *   Client:   Inicio, Reservar, MisCitas, Perfil
 */
function handleNotificationNavigation(type: string, data: Record<string, unknown>) {
  switch (type) {
    case 'appointment_confirmed':
    case 'appointment_cancelled':
    case 'appointment_reminder':
    case 'appointment_rescheduled':
      // Navegar a citas del rol activo — intenta admin primero, luego empleado, luego cliente
      navigate('Citas')
      break

    case 'chat_message':
    case 'new_message':
      if (typeof data.conversationId === 'string') {
        // React Navigation con params
        navigate('Chat', { conversationId: data.conversationId })
      }
      break

    case 'employee_request':
    case 'new_application':
      navigate('Dashboard')
      break

    case 'absence_approved':
    case 'absence_rejected':
    case 'absence_requested':
      navigate('EmpDashboard')
      break

    case 'vacancy_posted':
    case 'vacancy_matched':
      navigate('EmpPerfil')
      break

    case 'new_review':
    case 'review_response':
      navigate('Dashboard')
      break

    default:  }
}

export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider')
  }
  return context
}

export default NotificationContext

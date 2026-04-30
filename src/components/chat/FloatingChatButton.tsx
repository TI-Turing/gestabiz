import React, { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SimpleChatLayout } from '@/components/chat/SimpleChatLayout'
import { useInAppNotifications } from '@/hooks/useInAppNotifications'
import { useNotificationContext } from '@/contexts/NotificationContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

interface FloatingChatButtonProps {
  userId: string
  businessId?: string
  initialConversationId?: string | null
  isBusinessSide?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

export function FloatingChatButton({
  userId,
  businessId,
  initialConversationId = null,
  isBusinessSide = false,
  onOpenChange
}: Readonly<FloatingChatButtonProps>) {
  const [isOpen, setIsOpen] = useState(false)
  const previousOpenRef = React.useRef(isOpen)
  const { t } = useLanguage()
  
  // Contexto de notificaciones
  const { setChatOpen } = useNotificationContext()
  
  // Obtener contador de notificaciones de chat con refetch
  const { unreadCount, refetch } = useInAppNotifications({
    userId,
    autoFetch: true,
    type: 'chat_message', // ✅ FIX: Tipo correcto del enum (sin _received)
    limit: 1,
    suppressToasts: true
  })
  
  // Abrir chat cuando se proporciona conversación inicial
  React.useEffect(() => {
    if (initialConversationId) {
      // Pequeño delay para asegurar que el prop se propague correctamente
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [initialConversationId])
  
  // Notificar cambios en estado de apertura solo cuando realmente cambie,
  // evitando el falso "closed" del primer render.
  React.useEffect(() => {
    if (previousOpenRef.current === isOpen) {
      return
    }

    previousOpenRef.current = isOpen
    onOpenChange?.(isOpen)
    setChatOpen(isOpen) // ✨ Notificar al contexto global
  }, [isOpen, onOpenChange, setChatOpen])
  
  // 🔥 FIX: Refrescar contador al cerrar el chat
  const handleClose = React.useCallback(() => {
    setIsOpen(false)
    // Esperar 500ms para que las notificaciones se marquen como leídas en Supabase
    setTimeout(() => {
      refetch()
    }, 500)
  }, [refetch])
  
  // ✨ Refrescar badge cuando se marcan mensajes como leídos (en tiempo real)
  const handleMessagesRead = React.useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <>
      {/* Botón Flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-[5.5rem] lg:bottom-6 right-6 z-50",
            "w-14 h-14 rounded-full",
            "bg-primary text-primary-foreground",
            "shadow-lg hover:shadow-xl",
            "flex items-center justify-center",
            "transition-all duration-300",
            "hover:scale-110 active:scale-95",
            "group"
          )}
          aria-label={unreadCount > 0 ? t('common.chat.openChatWithUnread', { count: unreadCount }) : t('common.chat.openChat')}
        >
          <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" />
          {/* Badge de notificaciones de chat */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 flex items-center justify-center text-xs animate-bounce"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </button>
      )}

      {/* Modal de Chat */}
      {isOpen && (
        <div className="fixed inset-0 z-140 flex items-start md:items-end justify-end md:p-6">
          {/* Overlay */}
          <div
            role="button"
            tabIndex={0}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={handleClose}
            onKeyDown={(e) => e.key === 'Escape' && handleClose()}
            aria-label="Cerrar chat"
          />

          {/* Ventana de Chat */}
          <div
            className={cn(
              "relative",
              "w-full h-full",
              "md:w-[500px] md:max-h-[700px]",
              "lg:w-[600px] lg:max-h-[750px]",
              "bg-card rounded-none md:rounded-lg shadow-2xl",
              "overflow-hidden flex flex-col",
              "animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-300"
            )}
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between border-b shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <h3 className="font-semibold">Chat</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <SimpleChatLayout
                userId={userId}
                businessId={businessId}
                initialConversationId={initialConversationId}
                onMessagesRead={handleMessagesRead}
                isBusinessSide={isBusinessSide}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

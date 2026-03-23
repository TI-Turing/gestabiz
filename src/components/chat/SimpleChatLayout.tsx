import React, { useEffect, useState, useRef } from 'react';
import * as Sentry from '@sentry/react'
import { isSameDay } from 'date-fns';
import { useChat } from '@/hooks/useChat';
import { useEmployeeActiveBusiness } from '@/hooks/useEmployeeActiveBusiness';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { ChatWindow } from './ChatWindow';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReadReceipts } from './ReadReceipts';
import { formatChatDate } from '@/lib/chatUtils';

interface SimpleChatLayoutProps {
  userId: string;
  businessId?: string;
  initialConversationId?: string | null;
  onMessagesRead?: () => void; // ✨ Callback para notificar cuando se marcan mensajes como leídos
  hideHeader?: boolean; // ✅ Ocultar header cuando está en modal flotante
}

/**
 * SimpleChatLayout - Layout simplificado usando useChat con vista móvil
 * 
 * Este componente usa las tablas chat_* (chat_conversations, chat_participants, chat_messages)
 * Muestra lista de conversaciones O chat activo, nunca ambos simultáneamente
 */
export function SimpleChatLayout({ 
  userId, 
  businessId,
  initialConversationId,
  onMessagesRead, // ✨ Callback para refrescar badge
  hideHeader = false // ✅ Por defecto muestra el header
}: SimpleChatLayoutProps) {
  const {
    conversations,
    activeMessages,
    activeConversation,
    loading,
    error,
    sendMessage,
    markMessagesAsRead,
    setActiveConversationId,
    fetchConversations,
  } = useChat(userId);

  // Contexto de notificaciones para suprimir notificaciones redundantes
  const { setActiveConversation: setGlobalActiveConversation } = useNotificationContext();

  // Estado para controlar si mostramos lista o chat
  const [showChat, setShowChat] = useState(false);
  
  // Ref para el contenedor de mensajes (para auto-scroll)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoOpenedRef = useRef(false);
  // Retry counter to avoid infinite loops when conversation is not found
  const fetchRetryCountRef = useRef(0);

  console.log('[SimpleChatLayout] userId:', userId);
  console.log('[SimpleChatLayout] initialConversationId:', initialConversationId);
  console.log('[SimpleChatLayout] conversations:', conversations);
  console.log('[SimpleChatLayout] activeConversation:', activeConversation);
  console.log('[SimpleChatLayout] showChat:', showChat);

  // Función para hacer scroll al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch inicial
  useEffect(() => {
    console.log('[SimpleChatLayout] Fetching conversations...');
    fetchConversations();
  }, [fetchConversations]);

  // Set conversación inicial y mostrar chat
  useEffect(() => {
    console.log('[SimpleChatLayout] initialConversationId:', initialConversationId);
    if (initialConversationId) {
      console.log('[SimpleChatLayout] Setting active conversation:', initialConversationId);
      setActiveConversationId(initialConversationId);
      setShowChat(true);
      // Refresh conversations to ensure the newly created conversation is in the list.
      // This is critical when the chat panel is already open (no remount), so the
      // fresh conversation created by createOrGetConversation is available immediately.
      fetchConversations();
      // NO establecer autoOpenedRef aquí para permitir re-apertura
    }
  }, [initialConversationId, setActiveConversationId, fetchConversations]);

  // Auto abrir primera conversación para evitar estado "vacío"
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (initialConversationId) return;
    if (showChat) return;
    if (conversations.length === 0) return;

    const firstConversation = conversations[0];
    console.log('[SimpleChatLayout] Auto-opening first conversation:', firstConversation.id);
    setActiveConversationId(firstConversation.id);
    setShowChat(true);
    autoOpenedRef.current = true;
  }, [conversations, initialConversationId, showChat, setActiveConversationId]);

  // Retry: if initialConversationId is set but conversation not found after loading,
  // re-fetch conversations (max 3 retries) to handle timing gaps between conversation
  // creation and the local state being populated.
  useEffect(() => {
    if (!initialConversationId) return;
    if (!showChat) return;
    if (activeConversation) {
      fetchRetryCountRef.current = 0; // Reset on success
      return;
    }
    if (loading) return; // Still loading, wait
    if (fetchRetryCountRef.current >= 3) return; // Stop after 3 attempts

    fetchRetryCountRef.current += 1;
    console.log('[SimpleChatLayout] Conversation not found after load, retry attempt:', fetchRetryCountRef.current);
    // Add a delay between retries to avoid rapid consecutive API calls
    const retryTimer = setTimeout(() => {
      fetchConversations();
    }, 500);
    return () => clearTimeout(retryTimer);
  }, [initialConversationId, showChat, activeConversation, loading, fetchConversations]);

  // Auto-scroll cuando llegan nuevos mensajes
  useEffect(() => {
    if (activeMessages.length > 0) {
      console.log('[SimpleChatLayout] 📜 New messages detected, scrolling to bottom');
      // Pequeño delay para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [activeMessages]);

  // Auto-scroll cuando se abre una conversación
  useEffect(() => {
    if (showChat && activeConversation) {
      console.log('[SimpleChatLayout] 📜 Conversation opened, scrolling to bottom');
      // Delay más largo para la primera carga (esperar fetch de mensajes)
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }
  }, [showChat, activeConversation]);

  // Notificar al contexto global cuando cambia la conversación activa
  useEffect(() => {
    if (activeConversation) {
      setGlobalActiveConversation(activeConversation.id);
    } else {
      setGlobalActiveConversation(null);
    }
    return () => {
      // Cleanup: limpiar conversación activa al desmontar
      setGlobalActiveConversation(null);
    };
  }, [activeConversation, setGlobalActiveConversation]);

  // Marcar como leído cuando se abre conversación Y cuando llegan mensajes
  useEffect(() => {
    if (!activeConversation || activeMessages.length === 0) {
      return;
    }

    // Obtener último mensaje
    const lastMessage = activeMessages[activeMessages.length - 1];
    
    // Solo marcar si hay mensajes sin leer del otro usuario
    const unreadMessages = activeMessages.filter(
      msg => msg.sender_id !== userId && (!msg.read_by || !msg.read_by.some(r => r.user_id === userId))
    );
    
    if (unreadMessages.length > 0) {
      console.log('[SimpleChatLayout] 👀 Marking conversation as read:', {
        conversationId: activeConversation.id,
        lastMessageId: lastMessage.id,
        totalMessages: activeMessages.length,
        unreadCount: unreadMessages.length
      });
      markMessagesAsRead(activeConversation.id, lastMessage.id);
      
      // ✨ Notificar al padre para que actualice el badge
      // Esperar 600ms para dar tiempo a Supabase de procesar
      setTimeout(() => {
        onMessagesRead?.();
      }, 600);
    } else {
      console.log('[SimpleChatLayout] ℹ️ No unread messages to mark');
    }
    // ✅ IMPORTANTE: Incluir activeMessages.length para detectar mensajes nuevos
    // Esto SE ejecutará en cada mensaje nuevo, pero debouncedMarkAsRead en useChat
    // prevendrá llamadas excesivas agrupándolas con 500ms delay
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id, activeMessages.length, userId]);

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) return;
    
    try {
      await sendMessage({
        conversation_id: activeConversation.id,
        content,
        type: 'text',
      });
    } catch (error) {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'SimpleChatLayout' } })
      console.error('[SimpleChatLayout] Error sending message:', error);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setShowChat(true); // Mostrar chat al seleccionar conversación
  };

  const handleBackToList = () => {
    setShowChat(false);
    setActiveConversationId(null); // Limpiar conversación activa
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden">
      {/* Lista de conversaciones - Solo visible cuando !showChat */}
      {!showChat && (
        <div className="w-full bg-card flex flex-col flex-1 min-h-0">
          {/* El header de Conversaciones ya NO es necesario porque FloatingChatButton tiene el header "Chat" */}
          {/* {!hideHeader && (
            <div className="border-b border-border bg-card px-4 py-3 shrink-0">
              <h2 className="font-semibold text-lg">Conversaciones</h2>
            </div>
          )} */}

          {loading && conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-8 gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <div className="text-sm text-muted-foreground">Cargando conversaciones...</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-8">
              <div className="text-muted-foreground text-center">
                <p className="font-semibold mb-2">No hay conversaciones</p>
                <p className="text-sm">Aún no tienes conversaciones activas</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0">
              {conversations.map((conv) => {
                const metadata = conv.metadata as { last_sender_id?: unknown } | undefined;
                const metadataSenderId = typeof metadata?.last_sender_id === 'string' ? metadata.last_sender_id : undefined;
                const lastSenderId = conv.last_message_sender_id ?? metadataSenderId ?? null;
                const preview = conv.last_message_preview || 'Sin mensajes';
                const isOwnLastMessage = lastSenderId === userId;
                const displayPreview = conv.last_message_preview
                  ? `${isOwnLastMessage ? 'Tu: ' : ''}${conv.last_message_preview}`
                  : preview;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className="w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-semibold">
                      {conv.other_user?.full_name || conv.title || 'Conversación'}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {displayPreview}
                    </div>
                    {conv.unread_count ? (
                      <div className="mt-1">
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
                          {conv.unread_count}
                        </span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Ventana de chat - Solo visible cuando showChat */}
      {showChat && (
        <div className="w-full max-w-full flex flex-col flex-1 min-h-0">
          {activeConversation ? (
            <>
              {/* Header con botón Back + Avatar + Info */}
              <ChatHeader
                activeConversation={activeConversation}
                onBackToList={handleBackToList}
              />

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {activeMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No hay mensajes. ¡Envía el primero!
                  </div>
                ) : (
                  <>
                    {activeMessages.map((message, index) => {
                      const messageDate = new Date(message.sent_at);
                      const prevDate = index > 0 ? new Date(activeMessages[index - 1].sent_at) : null;
                      const showDateSeparator = !prevDate || !isSameDay(messageDate, prevDate);

                      return (
                        <React.Fragment key={message.id}>
                          {showDateSeparator && (
                            <div className="flex items-center gap-3 my-2">
                              <div className="flex-1 h-px bg-border" />
                              <span className="text-xs text-muted-foreground font-medium px-2 whitespace-nowrap">
                                {formatChatDate(messageDate)}
                              </span>
                              <div className="flex-1 h-px bg-border" />
                            </div>
                          )}
                          <div
                            className={`flex ${
                              message.sender_id === userId ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                                message.sender_id === userId
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {message.sender_id !== userId && message.sender && (
                                <div className="text-xs font-semibold mb-1">
                                  {message.sender.full_name || message.sender.email}
                                </div>
                              )}
                              <div className="wrap-break-word">{message.content}</div>
                              <div className="text-xs opacity-70 mt-1 flex items-center gap-1.5">
                                {new Date(message.sent_at).toLocaleTimeString('es', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {/* Indicador de visto - Solo para mensajes propios */}
                                <ReadReceipts
                                  senderId={message.sender_id}
                                  currentUserId={userId}
                                  readBy={message.read_by || []}
                                  deliveredAt={message.delivered_at}
                                  sentAt={message.sent_at}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    {/* Elemento invisible para auto-scroll */}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border bg-card p-4 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                    if (input.value.trim()) {
                      handleSendMessage(input.value.trim());
                      input.value = '';
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    name="message"
                    placeholder="Escribe un mensaje..."
                    className="flex-1 min-w-0 px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    className="px-6"
                  >
                    Enviar
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="font-semibold mb-2">Cargando conversación...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ChatHeader - Header del chat con avatar, nombre y negocio activo
 */
interface ChatHeaderProps {
  activeConversation: NonNullable<ReturnType<typeof useChat>['activeConversation']>;
  onBackToList: () => void;
}

function ChatHeader({ activeConversation, onBackToList }: ChatHeaderProps) {
  const otherUserId = activeConversation.other_user?.id;
  const activeBusiness = useEmployeeActiveBusiness(otherUserId);

  // Obtener iniciales para el avatar fallback
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-3 shrink-0">
      {/* Botón Back */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onBackToList}
        className="shrink-0"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage 
          src={activeConversation.other_user?.avatar_url || undefined} 
          alt={activeConversation.other_user?.full_name || 'Usuario'} 
        />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {getInitials(activeConversation.other_user?.full_name)}
        </AvatarFallback>
      </Avatar>

      {/* Info del usuario */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">
          {activeConversation.other_user?.full_name || activeConversation.title || 'Chat'}
        </div>
        
        {/* Mostrar negocio o estado según horario */}
        {activeBusiness.status === 'active' && activeBusiness.business_name ? (
          <div className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {activeBusiness.business_name}
          </div>
        ) : activeBusiness.status === 'off-schedule' && activeBusiness.business_name ? (
          <div className="text-sm text-orange-600 dark:text-orange-400 truncate flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Fuera de horario laboral
          </div>
        ) : activeBusiness.status === 'no-schedule' && activeBusiness.business_name ? (
          <div className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {activeBusiness.business_name} (sin horario)
          </div>
        ) : null}
        {/* Si es cliente (not-employee), no mostrar nada adicional */}
      </div>
    </div>
  );
}

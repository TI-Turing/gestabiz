import React, { useEffect, useState } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { ChatErrorBoundary } from './ChatErrorBoundary';
import { useChat } from '@/hooks/useChat';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ChatLayoutProps {
  userId: string;
  businessId?: string;
  initialConversationId?: string | null;
  onNavigate?: (conversationId: string | null) => void;
}

/**
 * ChatLayout Component (Refactorizado FASE 2)
 * 
 * Layout principal del sistema de chat que integra:
 * - ConversationList (sidebar)
 * - ChatWindow (contenido principal)
 * - Hooks useConversations + useMessages (nueva arquitectura)
 * 
 * Props:
 * - userId: ID del usuario actual (requerido)
 * - businessId: ID del negocio (opcional, filtra conversaciones)
 * - initialConversationId: Conversación inicial a mostrar (opcional)
 * - onNavigate: Callback cuando se selecciona una conversación (opcional)
 */
export function ChatLayout({ 
  userId, 
  businessId,
  initialConversationId = null,
  onNavigate 
}: ChatLayoutProps) {
  // State para conversación activa
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId
  );

  // Hook de chat unificado
  const {
    conversations,
    activeMessages,
    activeConversation: hookActiveConversation,
    activeTypingUsers,
    loading,
    error,
    sendMessage,
    markMessagesAsRead,
    setActiveConversationId: hookSetActiveConversation,
    fetchConversations,
    toggleMuteConversation,
    togglePinConversation,
  } = useChat(userId);

  // Conversación activa (del array de conversaciones o del hook)
  const activeConversation = hookActiveConversation || conversations.find((c) => c.id === activeConversationId) || null;
  const messages = activeMessages || [];

  // Debug: Log conversations array changes
  useEffect(() => {
    console.log('[ChatLayout] conversations changed:', conversations);
    console.log('[ChatLayout] conversations.length:', conversations.length);
    console.log('[ChatLayout] activeConversationId:', activeConversationId);
    console.log('[ChatLayout] activeConversation:', activeConversation);
  }, [conversations, activeConversationId, activeConversation]);

  // Sincronizar conversationId inicial
  useEffect(() => {
    console.log('[ChatLayout] initialConversationId changed:', initialConversationId)
    if (initialConversationId) {
      console.log('[ChatLayout] Setting active conversation to:', initialConversationId)
      setActiveConversationId(initialConversationId);
      // ✅ También setear en el hook para cargar los mensajes
      hookSetActiveConversation(initialConversationId);
    }
  }, [initialConversationId, hookSetActiveConversation]);

  // Fetch conversaciones inicial
  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId, businessId, fetchConversations]);

  // Cargar mensajes cuando cambia conversación activa
  useEffect(() => {
    if (activeConversationId) {
      hookSetActiveConversation(activeConversationId);
    }
  }, [activeConversationId, hookSetActiveConversation]);

  // Marcar conversación como leída cuando se abre
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender_id !== userId) {
        markMessagesAsRead(activeConversationId);
      }
    }
  }, [activeConversationId, messages, userId, markMessagesAsRead]);

  /**
   * Manejar selección de conversación
   */
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    if (onNavigate) {
      onNavigate(id);
    }
  };

  /**
   * Wrapper de sendMessage (adaptado a nueva interfaz)
   */
  const handleSendMessage = async (
    content: string,
    replyToId?: string,
     
    _attachments?: unknown
  ) => {
    if (!activeConversation) return;

    if (!activeConversationId) return;
    
    await sendMessage({
      conversation_id: activeConversationId,
      content: content,
      type: 'text',
      reply_to_id: replyToId,
    });
  };

  /**
   * Typing indicator (TODO: implementar en FASE futura)
   */
   
  const handleTypingChange = (_isTyping: boolean) => {
    // TODO: Implementar typing indicator con broadcast
    // Por ahora no-op
  };

  /**
   * Wrapper de editMessage
   */
  const handleEditMessage = async (_messageId: string, _newContent: string) => {
    // TODO: Implementar editMessage en useChat
    console.log('Edit message not implemented yet');
  };

  /**
   * Wrapper de deleteMessage
   */
  const handleDeleteMessage = async (_messageId: string) => {
    // TODO: Implementar deleteMessage en useChat
    console.log('Delete message not implemented yet');
  };

  /**
   * Wrapper de toggleArchive
   */
  const handleToggleArchive = async (_convId: string, _isArchived: boolean) => {
    // TODO: Implementar archive en useChat
    console.log('Archive conversation not implemented yet');
  };

  /**
   * Wrapper de toggleMute
   */
  const handleToggleMute = async (convId: string, isMuted: boolean) => {
    await toggleMuteConversation(convId, isMuted);
  };

  /**
   * Wrapper de togglePin
   */
  const handleTogglePin = async (convId: string, isPinned: boolean) => {
    await togglePinConversation(convId, isPinned);
  };

  // Calcular total de mensajes sin leer
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar: Lista de conversaciones */}
      <div className="w-80 flex-shrink-0">
        <ConversationList
          conversations={conversations as any}
          activeConversationId={activeConversation?.id || null}
          onSelectConversation={handleSelectConversation}
          totalUnreadCount={totalUnreadCount}
          loading={loading}
        />
      </div>

      {/* Contenido principal: Ventana de chat */}
      <div className="flex-1 flex flex-col">
        {/* Error alert (si existe) */}
        {error && (
          <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => {
                  /* Error se limpia automáticamente */
                }}
                className="text-sm underline hover:no-underline"
              >
                Cerrar
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Chat window */}
        <ChatErrorBoundary>
          <ChatWindow
            conversation={activeConversation as any} // TODO: Actualizar tipos en ChatWindow
            messages={messages as any} // TODO: Actualizar tipos en ChatWindow
            typingUsers={[]} // TODO: Implementar typing indicators
            currentUserId={userId}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onTypingChange={handleTypingChange}
            onToggleArchive={handleToggleArchive}
            onToggleMute={handleToggleMute}
            onTogglePin={handleTogglePin}
            loading={loading}
          />
        </ChatErrorBoundary>
      </div>
    </div>
  );
}

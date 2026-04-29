import React, { useState, useEffect, useRef } from 'react'
import { isSameDay } from 'date-fns'
import { ChatCircle, HandWaving, MagnifyingGlass } from '@phosphor-icons/react'
import { Search as SearchIcon } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { ChatHeader } from './ChatHeader'
import { CallModal } from './CallModal'
import { TypingIndicator } from './TypingIndicator'
import { ChatComponentErrorBoundary } from './ChatErrorBoundary'
import { formatChatDate } from '@/lib/chatUtils'
import { useWebRTCCall } from '@/hooks/useWebRTCCall'
import { useUserPresence } from '@/hooks/useUserPresence'
import type { ConversationPreview } from '@/hooks/useConversations'
import type { MessageWithSender } from '@/hooks/useMessages'
import type { ChatTypingUser, ChatAttachment } from '@/hooks/useChat'

interface ChatWindowProps {
  conversation: ConversationPreview | null
  messages: MessageWithSender[]
  typingUsers: ChatTypingUser[]
  currentUserId: string
  onSendMessage: (content: string, replyToId?: string, attachments?: ChatAttachment[]) => Promise<void>
  onSendAudio?: (blob: Blob, duration: number, waveform: number[]) => Promise<void>
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>
  onDeleteMessage?: (messageId: string) => Promise<void>
  onTypingChange?: (isTyping: boolean) => void
  onToggleArchive?: (conversationId: string, isArchived: boolean) => void
  onToggleMute?: (conversationId: string, isMuted: boolean) => void
  onTogglePin?: (conversationId: string, isPinned: boolean) => void
  loading?: boolean
  /** Si true, el usuario actual es admin/empleado del negocio (habilita vault picker) */
  isBusinessSide?: boolean
  businessId?: string
}

export function ChatWindow({
  conversation,
  messages,
  typingUsers,
  currentUserId,
  onSendMessage,
  onSendAudio,
  onEditMessage,
  onDeleteMessage,
  onTypingChange,
  onToggleArchive,
  loading = false,
  isBusinessSide = false,
  businessId,
}: ChatWindowProps) {
  const [replyToMessage, setReplyToMessage] = useState<MessageWithSender | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // WebRTC call
  const {
    callState,
    activeCall,
    incomingCall,
    isMuted,
    startCall,
    answerCall,
    rejectCall,
    hangUp,
    toggleMute,
  } = useWebRTCCall(currentUserId)

  // Presence del otro usuario
  const otherId = conversation?.other_user?.id
  const presenceMap = useUserPresence(otherId ? [otherId] : [])
  const otherPresence = otherId ? presenceMap.get(otherId) : undefined

  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => msg.body?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  useEffect(() => {
    setReplyToMessage(null)
    setEditingMessageId(null)
  }, [conversation?.id])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (replyToMessage) setReplyToMessage(null)
        if (editingMessageId) setEditingMessageId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [replyToMessage, editingMessageId])

  const handleReply = (message: MessageWithSender) => {
    setReplyToMessage(message)
    setEditingMessageId(null)
  }

  const handleEdit = (messageId: string) => {
    setEditingMessageId(messageId)
    setReplyToMessage(null)
  }

  const handleDelete = (messageId: string) => {
    if (!onDeleteMessage) return
    setPendingDeleteId(messageId)
  }

  const confirmDelete = async () => {
    if (pendingDeleteId && onDeleteMessage) await onDeleteMessage(pendingDeleteId)
    setPendingDeleteId(null)
  }

  const handleSend = async (content: string, replyToId?: string, attachments?: ChatAttachment[]) => {
    if (editingMessageId && onEditMessage) {
      await onEditMessage(editingMessageId, content)
      setEditingMessageId(null)
    } else {
      await onSendMessage(content, replyToId, attachments)
      setReplyToMessage(null)
    }
  }

  const handleStartCall = () => {
    if (!otherId || !conversation?.id) return
    startCall(otherId, conversation.id, 'voice')
  }

  // Llamada modal visible si hay estado activo o llamada entrante
  const showCallModal = callState !== 'idle' || !!incomingCall

  const callerInfo = incomingCall
    ? { id: incomingCall.caller_id }
    : activeCall?.callee_id
    ? { id: activeCall.callee_id }
    : null

  const callerMsg = messages.find(m => m.sender_id === callerInfo?.id)
  const callerName = callerMsg?.sender?.full_name || conversation?.other_user?.full_name || 'Usuario'
  const callerAvatar = callerMsg?.sender?.avatar_url || conversation?.other_user?.avatar_url

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <ChatCircle size={64} weight="fill" className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Selecciona una conversación</h3>
          <p className="text-muted-foreground">Elige una conversación de la lista para empezar a chatear</p>
        </div>
      </div>
    )
  }

  const inputPlaceholder = editingMessageId
    ? 'Editando mensaje...'
    : replyToMessage
    ? 'Escribe tu respuesta...'
    : 'Escribe un mensaje...'

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader
        conversation={conversation}
        currentUserId={currentUserId}
        otherUserPresence={otherPresence}
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => { setIsSearchOpen(o => !o); if (isSearchOpen) setSearchQuery('') }}
        onStartCall={otherId ? handleStartCall : undefined}
        onToggleArchive={onToggleArchive}
      />

      {/* Barra de búsqueda */}
      {isSearchOpen && (
        <div className="border-b bg-muted/30 px-3 py-2 sm:px-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar mensajes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
              autoFocus
            />
            {searchQuery && (
              <output className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" aria-live="polite">
                {filteredMessages.length} resultado{filteredMessages.length !== 1 ? 's' : ''}
              </output>
            )}
          </div>
        </div>
      )}

      {/* Mensajes */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-3 sm:p-4" role="log" aria-label="Historial de mensajes" aria-live="polite">
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Cargando mensajes...</p>
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <HandWaving size={48} weight="fill" className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No hay mensajes. ¡Envía el primero!</p>
            </div>
          </div>
        )}
        {searchQuery && filteredMessages.length === 0 && messages.length > 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MagnifyingGlass size={48} weight="duotone" className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No se encontraron mensajes con "{searchQuery}"</p>
            </div>
          </div>
        )}
        {filteredMessages.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {filteredMessages.map((message, index) => {
              const messageDate = new Date(message.created_at)
              const prevDate = index > 0 ? new Date(filteredMessages[index - 1].created_at) : null
              const showDateSeparator = !prevDate || !isSameDay(messageDate, prevDate)
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
                  <ChatComponentErrorBoundary componentName="MessageBubble">
                    <MessageBubble
                      message={message}
                      currentUserId={currentUserId}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onReply={handleReply}
                      searchQuery={searchQuery}
                    />
                  </ChatComponentErrorBoundary>
                </React.Fragment>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
        {typingUsers.length > 0 && (
          <div className="mt-3 sm:mt-4">
            <ChatComponentErrorBoundary componentName="TypingIndicator">
              <TypingIndicator typingUsers={typingUsers} />
            </ChatComponentErrorBoundary>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatComponentErrorBoundary componentName="ChatInput">
        <ChatInput
          conversationId={conversation.id}
          onSendMessage={handleSend}
          onSendAudio={onSendAudio}
          onTypingChange={onTypingChange}
          replyToMessage={replyToMessage}
          onCancelReply={() => setReplyToMessage(null)}
          placeholder={inputPlaceholder}
          isBusinessSide={isBusinessSide}
          businessId={businessId}
        />
      </ChatComponentErrorBoundary>

      {/* Confirmación de eliminación */}
      <AlertDialog open={!!pendingDeleteId} onOpenChange={open => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar mensaje</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar este mensaje? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de llamada */}
      {showCallModal && (
        <CallModal
          callState={callState}
          activeCall={activeCall}
          callerName={callerName}
          callerAvatar={callerAvatar}
          isMuted={isMuted}
          remoteStream={null}
          onAnswer={answerCall}
          onReject={rejectCall}
          onHangUp={hangUp}
          onToggleMute={toggleMute}
        />
      )}
    </div>
  )
}

// Keep old default export alias for backward compatibility
export default ChatWindow

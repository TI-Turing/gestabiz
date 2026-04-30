import React, { useEffect, useState, useRef } from 'react';
import * as Sentry from '@sentry/react'
import { isSameDay } from 'date-fns';
import { useChat } from '@/hooks/useChat';
import type { ChatAttachment } from '@/hooks/useChat';
import { useEmployeeActiveBusiness } from '@/hooks/useEmployeeActiveBusiness';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';
import { useUserPresence } from '@/hooks/useUserPresence';
import { ChatInput } from './ChatInput';
import { AudioMessage } from './AudioMessage';
import { CallModal } from './CallModal';
import { PresenceDot } from './PresenceDot';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReadReceipts } from './ReadReceipts';
import { formatChatDate } from '@/lib/chatUtils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SimpleChatLayoutProps {
  userId: string;
  businessId?: string;
  initialConversationId?: string | null;
  onMessagesRead?: () => void;
  hideHeader?: boolean;
  isBusinessSide?: boolean;
}

/**
 * SimpleChatLayout - Layout simplificado con todas las funciones del chat v2:
 * emoji, adjuntos, audio hold-to-record, vault de marketing, llamadas P2P.
 */
export function SimpleChatLayout({
  userId,
  businessId,
  initialConversationId,
  onMessagesRead,
  hideHeader = false,
  isBusinessSide = false,
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

  const { setActiveConversation: setGlobalActiveConversation } = useNotificationContext();

  const [showChat, setShowChat] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoOpenedRef = useRef(false);
  const fetchRetryCountRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!lightboxUrl) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxUrl(null); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [lightboxUrl]);

  // WebRTC call
  const otherId = activeConversation?.other_user?.id;
  const {
    callState,
    activeCall,
    incomingCall,
    isMuted,
    remoteStream,
    startCall,
    answerCall,
    rejectCall,
    hangUp,
    toggleMute,
  } = useWebRTCCall(userId);

  // Presence del otro usuario
  const presenceMap = useUserPresence(otherId ? [otherId] : []);
  const otherPresence = otherId ? presenceMap.get(otherId) : undefined;

  const showCallModal = callState !== 'idle' || !!incomingCall;

  const callerInfo = incomingCall
    ? { id: incomingCall.caller_id }
    : activeCall?.callee_id
    ? { id: activeCall.callee_id }
    : null;
  const callerName = activeConversation?.other_user?.full_name || 'Usuario';
  const callerAvatar = activeConversation?.other_user?.avatar_url || undefined;

  // ── Fetch inicial ────────────────────────────────────────────────────────
  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (initialConversationId) {
      setActiveConversationId(initialConversationId);
      setShowChat(true);
      fetchConversations();
    }
  }, [initialConversationId, setActiveConversationId, fetchConversations]);

  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (initialConversationId) return;
    if (showChat) return;
    if (conversations.length === 0) return;
    setActiveConversationId(conversations[0].id);
    setShowChat(true);
    autoOpenedRef.current = true;
  }, [conversations, initialConversationId, showChat, setActiveConversationId]);

  useEffect(() => {
    if (!initialConversationId) return;
    if (!showChat) return;
    if (activeConversation) { fetchRetryCountRef.current = 0; return; }
    if (loading) return;
    if (fetchRetryCountRef.current >= 3) return;
    fetchRetryCountRef.current += 1;
    const t = setTimeout(() => { fetchConversations(); }, 500);
    return () => clearTimeout(t);
  }, [initialConversationId, showChat, activeConversation, loading, fetchConversations]);

  useEffect(() => {
    if (activeMessages.length > 0) setTimeout(scrollToBottom, 100);
  }, [activeMessages]);

  useEffect(() => {
    if (showChat && activeConversation) setTimeout(scrollToBottom, 300);
  }, [showChat, activeConversation]);

  useEffect(() => {
    if (activeConversation) setGlobalActiveConversation(activeConversation.id);
    else setGlobalActiveConversation(null);
    return () => { setGlobalActiveConversation(null); };
  }, [activeConversation, setGlobalActiveConversation]);

  useEffect(() => {
    if (!activeConversation || activeMessages.length === 0) return;
    const lastMessage = activeMessages[activeMessages.length - 1];
    const unread = activeMessages.filter(
      m => m.sender_id !== userId && (!m.read_by || !m.read_by.some(r => r.user_id === userId))
    );
    if (unread.length > 0) {
      markMessagesAsRead(activeConversation.id, lastMessage.id);
      setTimeout(() => { onMessagesRead?.(); }, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id, activeMessages.length, userId]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSendMessage = async (content: string, replyToId?: string, attachments?: ChatAttachment[]) => {
    if (!activeConversation) return;
    try {
      await sendMessage({
        conversation_id: activeConversation.id,
        content,
        type: attachments && attachments.length > 0 ? 'file' : 'text',
        attachments,
        reply_to_id: replyToId,
      });
    } catch (err) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { tags: { component: 'SimpleChatLayout' } });
    }
  };

  const handleSendAudio = async (blob: Blob, duration: number, waveform: number[]) => {
    if (!activeConversation) return;
    try {
      const filename = `${activeConversation.id}/${userId}/audio-${Date.now()}.webm`;
      const { data, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filename, blob, { contentType: 'audio/webm' });
      if (uploadError) throw uploadError;
      const { data: signedData, error: signError } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(data.path, 31536000); // 1 año — bucket privado requiere signed URL
      if (signError) throw signError;
      await sendMessage({
        conversation_id: activeConversation.id,
        content: '',
        type: 'audio',
        duration_seconds: Math.round(duration),
        waveform,
        metadata: { audio_url: signedData.signedUrl, audio_path: data.path },
      });
    } catch (err) {
      toast.error('Error al enviar audio');
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { tags: { component: 'SimpleChatLayout' } });
    }
  };

  const handleStartCall = () => {
    if (!otherId || !activeConversation?.id) return;
    startCall(otherId, activeConversation.id, 'voice');
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setShowChat(false);
    setActiveConversationId(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────

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
      {/* Lista de conversaciones */}
      {!showChat && (
        <div className="w-full bg-card flex flex-col flex-1 min-h-0">
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
                    <div className="text-sm text-muted-foreground truncate">{displayPreview}</div>
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

      {/* Ventana de chat */}
      {showChat && (
        <div className="w-full max-w-full flex flex-col flex-1 min-h-0">
          {activeConversation ? (
            <>
              <ChatHeader
                activeConversation={activeConversation}
                otherPresence={otherPresence}
                onBackToList={handleBackToList}
                onStartCall={otherId ? handleStartCall : undefined}
              />

              {/* Mensajes */}
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
                          <div className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                                message.sender_id === userId ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              }`}
                            >
                              {message.sender_id !== userId && message.sender && (
                                <div className="text-xs font-semibold mb-1">
                                  {message.sender.full_name || message.sender.email}
                                </div>
                              )}
                              {message.type === 'audio' ? (
                                <AudioMessage
                                  url={(message.metadata as { audio_url?: string })?.audio_url || ''}
                                  duration={message.duration_seconds || 0}
                                  waveform={message.waveform || undefined}
                                  isOwnMessage={message.sender_id === userId}
                                />
                              ) : (
                                <>
                                  {message.content && message.content !== 'Archivo adjunto' && (
                                    <div className="wrap-break-word">{message.content}</div>
                                  )}
                                  {(() => {
                                    const atts = typeof message.attachments === 'string'
                                      ? (() => { try { return JSON.parse(message.attachments as unknown as string) } catch { return null } })()
                                      : message.attachments
                                    return Array.isArray(atts) && atts.length > 0 ? (
                                      <div className={`${message.content && message.content !== 'Archivo adjunto' ? 'mt-2 ' : ''}space-y-2`}>
                                        {atts.map((att) => (
                                          att.type.startsWith('image/') ? (
                                            <button
                                              key={att.url}
                                              type="button"
                                              onClick={() => setLightboxUrl(att.url)}
                                              className="block p-0 border-0 bg-transparent"
                                            >
                                              <img
                                                src={att.url}
                                                alt={att.name}
                                                className="max-w-[240px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                loading="lazy"
                                              />
                                            </button>
                                          ) : att.type.startsWith('video/') ? (
                                            <video
                                              key={att.url}
                                              src={att.url}
                                              controls
                                              className="max-w-[240px] rounded-lg"
                                              aria-label={att.name}
                                            >
                                              <track kind="captions" />
                                          </video>
                                        ) : null
                                      ))}
                                    </div>
                                    ) : null
                                  })()}
                                  {!message.content && (!message.attachments || (Array.isArray(message.attachments) && message.attachments.length === 0)) && (
                                    <div className="wrap-break-word text-muted-foreground italic">Mensaje vacío</div>
                                  )}
                                </>
                              )}
                              <div className="text-xs opacity-70 mt-1 flex items-center gap-1.5">
                                {new Date(message.sent_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
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
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* ChatInput con emojis, audio, adjuntos, vault */}
              <ChatInput
                conversationId={activeConversation.id}
                onSendMessage={handleSendMessage}
                onSendAudio={handleSendAudio}
                isBusinessSide={isBusinessSide}
                businessId={businessId}
              />
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

      {/* Lightbox de imágenes */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Vista de imagen"
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img
            src={lightboxUrl}
            alt="Vista completa"
            className="max-w-[90vw] max-h-[90vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Modal de llamada */}
      {showCallModal && (
        <CallModal
          callState={callState}
          activeCall={activeCall}
          callerName={callerName}
          callerAvatar={callerAvatar}
          isMuted={isMuted}
          remoteStream={remoteStream}
          onAnswer={answerCall}
          onReject={rejectCall}
          onHangUp={hangUp}
          onToggleMute={toggleMute}
        />
      )}
    </div>
  );
}

// ── ChatHeader local con botón de llamada y presencia ──────────────────────

import type { UserPresenceInfo } from '@/types/types';

interface ChatHeaderProps {
  activeConversation: NonNullable<ReturnType<typeof useChat>['activeConversation']>;
  otherPresence?: UserPresenceInfo;
  onBackToList: () => void;
  onStartCall?: () => void;
}

function ChatHeader({ activeConversation, otherPresence, onBackToList, onStartCall }: ChatHeaderProps) {
  const otherUserId = activeConversation.other_user?.id;
  const activeBusiness = useEmployeeActiveBusiness(otherUserId);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="border-b border-border bg-card px-3 py-2 flex items-center gap-2 shrink-0">
      <Button variant="ghost" size="icon" onClick={onBackToList} className="shrink-0 h-8 w-8">
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Avatar con punto de presencia */}
      <div className="relative shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={activeConversation.other_user?.avatar_url || undefined} alt={activeConversation.other_user?.full_name || 'Usuario'} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
            {getInitials(activeConversation.other_user?.full_name)}
          </AvatarFallback>
        </Avatar>
        {otherPresence && (
          <PresenceDot status={otherPresence.status} className="absolute bottom-0 right-0" size="sm" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">
          {activeConversation.other_user?.full_name || activeConversation.title || 'Chat'}
        </div>
        {activeBusiness.status === 'active' && activeBusiness.business_name ? (
          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
            {activeBusiness.business_name}
          </div>
        ) : activeBusiness.status === 'off-schedule' ? (
          <div className="text-xs text-orange-500 truncate flex items-center gap-1">
            <Clock className="w-3 h-3" /> Fuera de horario
          </div>
        ) : null}
      </div>

      {/* Botón de llamada */}
      {onStartCall && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onStartCall}
          title="Llamada de voz"
          aria-label="Iniciar llamada de voz"
        >
          <Phone className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

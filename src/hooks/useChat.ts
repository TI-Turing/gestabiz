/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * useChat Hook - Sistema de Chat en Tiempo Real
 * 
 * Funcionalidades:
 * - Gestión de conversaciones y mensajes
 * - Realtime subscriptions (mensajes + typing indicators)
 * - CRUD completo con optimistic updates
 * - Integración con sistema de notificaciones in-app
 * 
 * @author Gestabiz Team
 * @version 2.0.0
 * @date 2025-10-13
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { trackChatEvent, ChatEvents } from '@/lib/analytics';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ChatConversation {
  id: string;
  type: 'direct' | 'group';
  title: string | null;
  created_by: string | null;
  business_id: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  last_message_sender_id?: string | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  metadata: Record<string, unknown>;
  
  // Computed fields (from participants)
  unread_count?: number;
  is_pinned?: boolean;
  is_muted?: boolean;
  other_user?: ChatParticipantUser; // Para conversaciones directas
}

export interface ChatParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  last_read_at: string | null;
  last_read_message_id: string | null;
  unread_count: number;
  is_muted: boolean;
  is_pinned: boolean;
  user?: ChatParticipantUser;
}

export interface ChatParticipantUser {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'audio' | 'video' | 'call_log';
  attachments: ChatAttachment[] | null;
  sent_at: string;
  delivered_at: string | null;
  read_by: ChatReadReceipt[];
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  metadata: Record<string, unknown>;
  duration_seconds: number | null;
  waveform: number[] | null;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  sender?: ChatParticipantUser;
  reply_to?: ChatMessage;
  is_sent?: boolean;
  is_delivered?: boolean;
  is_read?: boolean;
}

export interface ChatAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface ChatReadReceipt {
  user_id: string;
  read_at: string;
}

export interface ChatTypingUser {
  user_id: string;
  user?: ChatParticipantUser;
  started_at: string;
  expires_at: string;
}

export interface SendMessageParams {
  conversation_id: string;
  content: string;
  type?: 'text' | 'image' | 'file' | 'audio' | 'video' | 'call_log';
  attachments?: ChatAttachment[];
  reply_to_id?: string;
  duration_seconds?: number;
  waveform?: number[];
  metadata?: Record<string, unknown>;
}

export interface CreateConversationParams {
  other_user_id: string;
  business_id?: string;
  initial_message?: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useChat(userId: string | null) {
  // State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, ChatTypingUser[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref for typing timeout (realtime refs removed - now using polling)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeInstanceIdRef = useRef<string>(
    globalThis.crypto?.randomUUID?.() ?? `inst_${Math.random().toString(36).slice(2)}`
  );
  
  // Ref for debounced mark as read (prevent excessive RPC calls)
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMarkAsReadRef = useRef<{ conversationId: string; messageId: string } | null>(null);
  
  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================
  
  /**
   * Fetch all conversations for current user.
   * Uses RPC get_conversations_with_participants to eliminate N+1 queries:
   *   Before: 1 base query + N queries per direct conversation + 1 last-senders query
   *   After:  1 single RPC call with LATERAL JOINs
   */
  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      logger.debug('fetchConversations', { component: 'useChat', userId });

      const { data, error: rpcError } = await supabase
        .rpc('get_conversations_with_participants', { p_user_id: userId });

      if (rpcError) throw rpcError;

      if (!data || data.length === 0) {
        setConversations([]);
        return;
      }

      // Map flat RPC rows → ChatConversation objects
      const conversations: ChatConversation[] = (data as Array<{
        id: string;
        type: 'direct' | 'group';
        title: string | null;
        created_by: string | null;
        business_id: string | null;
        last_message_at: string;
        last_message_preview: string | null;
        created_at: string;
        updated_at: string;
        is_archived: boolean;
        metadata: Record<string, unknown>;
        unread_count: number;
        is_pinned: boolean;
        is_muted: boolean;
        other_user_id: string | null;
        other_user_full_name: string | null;
        other_user_email: string | null;
        other_user_avatar_url: string | null;
        last_message_sender_id: string | null;
      }>).map(row => ({
        id: row.id,
        type: row.type,
        title: row.title,
        created_by: row.created_by,
        business_id: row.business_id,
        last_message_at: row.last_message_at,
        last_message_preview: row.last_message_preview,
        last_message_sender_id: row.last_message_sender_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        is_archived: row.is_archived,
        metadata: row.metadata ?? {},
        unread_count: row.unread_count ?? 0,
        is_pinned: row.is_pinned ?? false,
        is_muted: row.is_muted ?? false,
        other_user: row.other_user_id
          ? {
              id: row.other_user_id,
              full_name: row.other_user_full_name,
              email: row.other_user_email ?? '',
              avatar_url: row.other_user_avatar_url,
            }
          : undefined,
      }));

      logger.debug('fetchConversations result', { component: 'useChat', count: conversations.length });
      setConversations(conversations);
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to fetch chat conversations', error, {
        component: 'useChat',
        operation: 'fetchConversations',
        userId,
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  /**
   * Fetch messages for a specific conversation
   */
  const fetchMessages = useCallback(async (conversationId: string, limit = 50) => {
    if (!userId) return;
    
    try {
      const { data, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          type,
          attachments,
          sent_at,
          delivered_at,
          read_by,
          reply_to_id,
          edited_at,
          deleted_at,
          metadata,
          created_at,
          updated_at,
          sender:profiles(id, full_name, email, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (messagesError) throw messagesError;
      
      if (data) {
        // Mapear content → body para compatibilidad con componentes UI
        const mappedMessages = data.map((msg: any) => ({
          ...msg,
          body: msg.content, // ✅ Mapear content → body
          reply_to: msg.reply_to_id, // ✅ Mapear reply_to_id → reply_to
        }));
        
        // Reverse to show oldest first
        const sortedMessages = mappedMessages.reverse();
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: sortedMessages,
        }));
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    }
  }, [userId]);
  
  /**
   * Fetch typing indicators for a conversation
   */
  const fetchTypingIndicators = useCallback(async (conversationId: string) => {
    if (!userId) return;
    
    try {
      const { data, error: typingError } = await supabase
        .from('chat_typing_indicators')
        .select(`
          *,
          user:profiles(id, full_name, email, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .neq('user_id', userId)
        .gt('expires_at', new Date().toISOString());
      
      if (typingError) throw typingError;
      
      if (data) {
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: data,
        }));
      }
    } catch (err) {
      // Silently handle typing indicator errors
    }
  }, [userId]);
  
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================
  
  /**
   * Create or get existing direct conversation
   */
  const createOrGetConversation = useCallback(async (params: CreateConversationParams) => {
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      const { data: conversationId, error: rpcError } = await supabase
        .rpc('get_or_create_direct_conversation', {
          p_user1_id: userId,
          p_user2_id: params.other_user_id,
          p_business_id: params.business_id || null,
        });
      
      if (rpcError) throw rpcError;
      
      // Refresh conversations
      await fetchConversations();
      
      // Send initial message if provided
      if (params.initial_message && conversationId) {
        await sendMessage({
          conversation_id: conversationId,
          content: params.initial_message,
        });
      }
      
      return conversationId;
    } catch (err: any) {
      throw err;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, fetchConversations]);
  
  /**
   * Send a message
   */
  const sendMessage = useCallback(async (params: SendMessageParams) => {
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: ChatMessage = {
        id: tempId,
        conversation_id: params.conversation_id,
        sender_id: userId,
        content: params.content,
        type: (params.type || 'text') as ChatMessage['type'],
        attachments: params.attachments || null,
        sent_at: new Date().toISOString(),
        delivered_at: null,
        read_by: [],
        reply_to_id: params.reply_to_id || null,
        edited_at: null,
        deleted_at: null,
        metadata: (params.metadata as Record<string, unknown>) || {},
        duration_seconds: params.duration_seconds ?? null,
        waveform: params.waveform || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_sent: false,
      };
      
      setMessages(prev => ({
        ...prev,
        [params.conversation_id]: [
          ...(prev[params.conversation_id] || []),
          optimisticMessage,
        ],
      }));
      
      // Send via RPC
      const { data: messageId, error: rpcError } = await supabase
        .rpc('send_message', {
          p_conversation_id: params.conversation_id,
          p_sender_id: userId,
          p_content: params.content,
          p_type: params.type || 'text',
          p_attachments: params.attachments ? JSON.stringify(params.attachments) : null,
          p_reply_to_id: params.reply_to_id || null,
          p_metadata: params.metadata ?? null,
          p_duration_seconds: params.duration_seconds ?? null,
          p_waveform: params.waveform ?? null,
        });
      
      if (rpcError) {
        // Remove optimistic message on error
        setMessages(prev => ({
          ...prev,
          [params.conversation_id]: prev[params.conversation_id].filter(m => m.id !== tempId),
        }));
        throw rpcError;
      }
      
      // Replace optimistic message with real one
      const { data: realMessage, error: fetchError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles(id, full_name, email, avatar_url)
        `)
        .eq('id', messageId)
        .single();
      
      if (!fetchError && realMessage) {
        setMessages(prev => ({
          ...prev,
          [params.conversation_id]: prev[params.conversation_id].map(m =>
            m.id === tempId ? { ...realMessage, is_sent: true } : m
          ),
        }));
      }
      
      // Update conversation's last_message_at locally
      setConversations(prev =>
        prev.map(conv =>
          conv.id === params.conversation_id
            ? {
                ...conv,
                last_message_at: new Date().toISOString(),
                last_message_preview: params.content.substring(0, 100),
                last_message_sender_id: userId,
              }
            : conv
        )
      );
      
      // Stop typing indicator
      await updateTypingIndicator(params.conversation_id, false);
      
      // Track analytics
      trackChatEvent(ChatEvents.MESSAGE_SENT, {
        conversation_id: params.conversation_id,
        message_type: params.type || 'text',
        has_attachments: !!params.attachments && params.attachments.length > 0,
        has_reply: !!params.reply_to_id,
        content_length: params.content.length,
      });
      
      return messageId;
    } catch (err: any) {
      throw err;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  
  /**
   * Mark messages as read (with debounce to prevent excessive calls)
   */
  const markMessagesAsRead = useCallback(async (conversationId: string, lastMessageId?: string) => {
    if (!userId) {
      return;
    }
    try {
      const { data: count, error: rpcError } = await supabase
        .rpc('mark_messages_as_read', {
          p_conversation_id: conversationId,
          p_user_id: userId,
          p_message_id: lastMessageId || null,
        });
      
      if (rpcError) {
        throw rpcError;
      }
      // Update local unread count
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
      
      // 🔥 FIX: También limpiar notificaciones de chat de esta conversación
      // Esto sincroniza el badge del botón flotante
      try {
        // Usar operador JSONB contains (@>) para filtrar por conversation_id en data column
        const { data: clearedNotifs, error: notifError } = await supabase
          .from('in_app_notifications')
          .update({ 
            status: 'read',
            read_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('type', 'chat_message')  // ✅ FIX: Tipo correcto del enum
          .eq('status', 'unread')
          .contains('data', { conversation_id: conversationId })
          .select('id');
        
        if (notifError) {
        } else {
        }
      } catch (notifErr) {
        // No bloquear si falla - logging solo
      }
      
      return count;
    } catch (err: any) {
    }
  }, [userId]);
  
  /**
   * Debounced mark as read - previene llamadas excesivas cuando llegan múltiples mensajes
   */
  const debouncedMarkAsRead = useCallback((conversationId: string, messageId: string) => {
    // Guardar pending request
    pendingMarkAsReadRef.current = { conversationId, messageId };
    
    // Cancelar timeout anterior
    if (markAsReadTimeoutRef.current) {
      clearTimeout(markAsReadTimeoutRef.current);
    }
    
    // Programar ejecución después de 500ms de inactividad
    markAsReadTimeoutRef.current = setTimeout(() => {
      const pending = pendingMarkAsReadRef.current;
      if (pending) {
        markMessagesAsRead(pending.conversationId, pending.messageId);
        pendingMarkAsReadRef.current = null;
      }
    }, 500);
  }, [markMessagesAsRead]);
  
  /**
   * Update typing indicator
   */
  const updateTypingIndicator = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (!userId) return;
    
    try {
      await supabase.rpc('update_typing_indicator', {
        p_conversation_id: conversationId,
        p_user_id: userId,
        p_is_typing: isTyping,
      });
      
      // Auto-stop typing after 10 seconds
      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          updateTypingIndicator(conversationId, false);
        }, 10000);
      }
    } catch (err: any) {
    }
  }, [userId]);
  
  /**
   * Edit a message
   */
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!userId) return;
    
    try {
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({
          content: newContent,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('sender_id', userId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(convId => {
          updated[convId] = updated[convId].map(msg =>
            msg.id === messageId
              ? { ...msg, content: newContent, edited_at: new Date().toISOString() }
              : msg
          );
        });
        return updated;
      });
      
      // Track analytics
      trackChatEvent(ChatEvents.MESSAGE_EDITED, {
        message_id: messageId,
        content_length: newContent.length,
      });
    } catch (err: any) {
      throw err;
    }
  }, [userId]);
  
  /**
   * Delete a message (soft delete)
   */
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!userId) return;
    
    try {
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('sender_id', userId);
      
      if (updateError) throw updateError;
      
      // Remove from local state
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(convId => {
          updated[convId] = updated[convId].filter(msg => msg.id !== messageId);
        });
        return updated;
      });
      
      // Track analytics
      trackChatEvent(ChatEvents.MESSAGE_DELETED, {
        message_id: messageId,
      });
    } catch (err: any) {
      throw err;
    }
  }, [userId]);
  
  /**
   * Archive/unarchive conversation
   */
  const toggleArchiveConversation = useCallback(async (conversationId: string, isArchived: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('chat_conversations')
        .update({ is_archived: isArchived })
        .eq('id', conversationId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, is_archived: isArchived }
            : conv
        )
      );
    } catch (err: any) {
      throw err;
    }
  }, []);
  
  /**
   * Mute/unmute conversation
   */
  const toggleMuteConversation = useCallback(async (conversationId: string, isMuted: boolean) => {
    if (!userId) return;
    
    try {
      const { error: updateError } = await supabase
        .from('chat_participants')
        .update({ is_muted: isMuted })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, is_muted: isMuted }
            : conv
        )
      );
    } catch (err: any) {
      throw err;
    }
  }, [userId]);
  
  /**
   * Pin/unpin conversation
   */
  const togglePinConversation = useCallback(async (conversationId: string, isPinned: boolean) => {
    if (!userId) return;
    
    try {
      const { error: updateError } = await supabase
        .from('chat_participants')
        .update({ is_pinned: isPinned })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, is_pinned: isPinned }
            : conv
        )
      );
    } catch (err: any) {
      throw err;
    }
  }, [userId]);

  // ============================================================================
  // AUTO-LOAD MESSAGES WHEN CONVERSATION CHANGES
  // ============================================================================

  /**
   * Cargar mensajes automáticamente cuando activeConversationId cambia
   * ✅ FIX: Cuando se abre un chat desde externa (e.g., desde BusinessProfile),
   * se debe cargar automáticamente los mensajes iniciales
   */
  useEffect(() => {
    if (activeConversationId && userId) {
      fetchMessages(activeConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, userId]);
  
  // ============================================================================
  // REALTIME SUBSCRIPTIONS
  // ============================================================================
  
  /**
   * Subscribe to conversations changes - FIXED: removed Date.now() from channel name
   * OPTIMIZED: Only update local state, don't refetch everything
   */
  useEffect(() => {
    if (!userId) return;
    
    // ✅ FIX CRÍTICO: usar id estable por instancia para evitar colisiones
    // cuando hay multiples hooks useChat montados al mismo tiempo.
    const channelName = `chat_participants_${userId}_${realtimeInstanceIdRef.current}`;
    
    // Subscribe to participant changes (for unread count, etc.)
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Solo escuchar UPDATE (no INSERT/DELETE para evitar loops)
          schema: 'public',
          table: 'chat_participants',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // 🔥 FIX: NO hacer fetchConversations - causa 1000+ queries
          // Solo actualizar el estado local con los nuevos datos
          const updated = payload.new as ChatParticipant;
          
          setConversations(prev => prev.map(conv => {
            if (conv.id === updated.conversation_id) {
              return {
                ...conv,
                unread_count: updated.unread_count,
                is_pinned: updated.is_pinned,
                is_muted: updated.is_muted
              };
            }
            return conv;
          }));
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  
  /**
   * Subscribe to messages for active conversation - FIXED: removed Date.now() from channel names
   */
  useEffect(() => {
    if (!userId || !activeConversationId) return;
    // ✅ FIX CRÍTICO: usar id estable por instancia para evitar colisiones
    // cuando hay multiples hooks useChat montados al mismo tiempo.
    const channelName = `chat_messages_${activeConversationId}_${realtimeInstanceIdRef.current}`;
    
    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async (payload) => {
          // Fetch full message with sender info
          const { data: newMessage } = await supabase
            .from('chat_messages')
            .select(`
              id,
              conversation_id,
              sender_id,
              content,
              type,
              attachments,
              sent_at,
              delivered_at,
              read_by,
              reply_to_id,
              edited_at,
              deleted_at,
              metadata,
              created_at,
              updated_at,
              sender:profiles(id, full_name, email, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();
          if (newMessage) {
            const normalizedSender = Array.isArray(newMessage.sender)
              ? newMessage.sender[0]
              : newMessage.sender;

            // ✅ Mapear content → body para compatibilidad UI
            const mappedMessage: ChatMessage & { body: string; reply_to: string | null } = {
              ...newMessage,
              sender: normalizedSender,
              body: newMessage.content,
              reply_to: newMessage.reply_to_id,
            };
            
            // 🔥 FIX: Solo agregar mensajes de OTROS usuarios
            // Los mensajes propios ya se agregaron con optimistic update
            if (mappedMessage.sender_id === userId) {
              return;
            }
            
            // Agregar mensaje de otro usuario
            // Evitar duplicados: verificar si el mensaje ya existe
            setMessages(prev => {
              const existingMessages = prev[activeConversationId] || [];
              const messageExists = existingMessages.some(m => m.id === mappedMessage.id);
              
              if (messageExists) {
                return prev;
              }
              return {
                ...prev,
                [activeConversationId]: [
                  ...existingMessages,
                  mappedMessage,
                ],
              };
            });
            
            // Mark as read SOLO si el mensaje es de otro usuario (con debounce)
            if (mappedMessage.sender_id !== userId) {
              debouncedMarkAsRead(activeConversationId, mappedMessage.id);
            }
            
            // 🔥 OPTIMIZACIÓN: NO hacer fetchConversations completo
            // Solo actualizar last_message_at y preview en el estado local
            setConversations(prev => prev.map(conv => {
              if (conv.id === activeConversationId) {
                return {
                  ...conv,
                  last_message_at: mappedMessage.sent_at,
                  last_message_preview: mappedMessage.content.substring(0, 100),
                  last_message_sender_id: mappedMessage.sender_id,
                };
              }
              return conv;
            }).sort((a, b) => {
              // Re-ordenar por fecha (más reciente primero)
              const dateA = new Date(a.last_message_at).getTime();
              const dateB = new Date(b.last_message_at).getTime();
              return dateB - dateA;
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          setMessages(prev => ({
            ...prev,
            [activeConversationId]: prev[activeConversationId]?.map(msg =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            ) || [],
          }));
        }
      )
      .subscribe((status) => {
      });
    
    // ✅ FIX CRÍTICO: usar id estable por instancia para evitar colisiones
    // cuando hay multiples hooks useChat montados al mismo tiempo.
    const typingChannelName = `chat_typing_${activeConversationId}_${realtimeInstanceIdRef.current}`;
    const typingChannel = supabase
      .channel(typingChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_typing_indicators',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        () => {
          fetchTypingIndicators(activeConversationId); // Safe: fetchTypingIndicators is stable
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      
      // Limpiar debounce timeout
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeConversationId]); // ✅ Callbacks are stable (useCallback) - intentionally excluded
  
  // ============================================================================
  // INITIAL LOAD
  // ============================================================================
  
  useEffect(() => {
    if (!userId) return;
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // ✅ Solo ejecutar al montar o cuando userId cambie
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const activeTypingUsers = activeConversationId ? typingUsers[activeConversationId] || [] : [];
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  
  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    // State
    conversations,
    activeConversation,
    activeMessages,
    activeTypingUsers,
    totalUnreadCount,
    loading,
    error,
    
    // Actions
    setActiveConversationId,
    createOrGetConversation,
    sendMessage,
    markMessagesAsRead,
    updateTypingIndicator,
    editMessage,
    deleteMessage,
    toggleArchiveConversation,
    toggleMuteConversation,
    togglePinConversation,
    fetchConversations,
    fetchMessages,
  };
}

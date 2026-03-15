/**
 * Servicio de chat
 * Centraliza las queries directas a `conversations`, `messages`, `chat_participants`
 */
import supabase from '@/lib/supabase'
import { throwIfError } from '@/lib/errors'
import { PAGINATION } from '@/lib/queryConfig'

export const chatService = {
  /** Lista las conversaciones de un usuario con datos de participantes */
  async listConversations(userId: string, limit = PAGINATION.CONVERSATIONS) {
    const { data, error } = await supabase
      .from('chat_participants')
      .select('conversation_id, unread_count, is_pinned, is_muted')
      .eq('user_id', userId)
      .limit(limit)
    throwIfError(error, 'LIST_CONVERSATIONS', 'No se pudieron cargar las conversaciones')
    return data ?? []
  },

  /** Lista mensajes de una conversación con paginación */
  async listMessages(conversationId: string, limit = PAGINATION.MESSAGES, offset = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, type, status, created_at, metadata')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    throwIfError(error, 'LIST_MESSAGES', 'No se pudieron cargar los mensajes')
    return (data ?? []).reverse()
  },

  /** Envía un mensaje */
  async sendMessage(payload: {
    conversation_id: string
    sender_id: string
    content: string
    type?: 'text' | 'image' | 'file'
    metadata?: Record<string, unknown>
  }) {
    if (!payload.content.trim()) throw new Error('El mensaje no puede estar vacío')
    if (payload.content.length > 5000) throw new Error('Mensaje demasiado largo (máx. 5,000 caracteres)')

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: payload.conversation_id,
        sender_id: payload.sender_id,
        content: payload.content.trim(),
        type: payload.type ?? 'text',
        metadata: payload.metadata ?? {},
      })
      .select()
      .single()
    throwIfError(error, 'SEND_MESSAGE', 'No se pudo enviar el mensaje')
    return data
  },

  /** Crea o recupera una conversación directa entre dos usuarios */
  async getOrCreateDirectConversation(userId1: string, userId2: string, businessId: string) {
    const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
      p_user1_id: userId1,
      p_user2_id: userId2,
      p_business_id: businessId,
    })
    throwIfError(error, 'GET_DIRECT_CONVERSATION', 'No se pudo obtener la conversación')
    return data
  },

  /** Marca mensajes como leídos */
  async markConversationAsRead(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('chat_participants')
      .update({ unread_count: 0 })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
    throwIfError(error, 'MARK_CONVERSATION_READ', 'No se pudo marcar la conversación como leída')
  },
}

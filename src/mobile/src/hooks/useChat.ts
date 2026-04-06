import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { throwIfError } from '../lib/services/errors'
import { QUERY_CONFIG } from '../lib/queryClient'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string
  business_id?: string | null
  title?: string | null
  created_at: string
  last_message_at?: string | null
  participants?: ConversationParticipant[]
  lastMessage?: ChatMessage | null
}

export interface ConversationParticipant {
  conversation_id: string
  user_id: string
  role?: string | null
  joined_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  attachment_url?: string | null
  attachment_type?: string | null
  is_read: boolean
  created_at: string
}

// ─── Hook: useConversations ───────────────────────────────────────────────────

export function useConversations(userId: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = ['conversations', userId]

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<Conversation[]> => {
      // 1. Get conversation IDs where user is a participant
      const { data: parts, error: pErr } = await supabase
        .from('chat_participants')
        .select('conversation_id')
        .eq('user_id', userId!)
      throwIfError(pErr, 'FETCH_CONVERSATIONS', 'No se pudieron cargar las conversaciones')

      const ids = (parts ?? []).map(p => p.conversation_id as string)
      if (!ids.length) return []

      // 2. Fetch conversations
      const { data, error } = await supabase
        .from('conversations')
        .select('id, business_id, title, created_at, last_message_at')
        .in('id', ids)
        .order('last_message_at', { ascending: false })
      throwIfError(error, 'FETCH_CONVERSATIONS_DETAIL', 'No se pudieron cargar las conversaciones')
      return (data ?? []) as Conversation[]
    },
    enabled: !!userId,
    ...QUERY_CONFIG.FREQUENT,
  })

  const createConversation = useMutation({
    mutationFn: async ({
      participantIds,
      businessId,
      title,
    }: {
      participantIds: string[]
      businessId?: string
      title?: string
    }) => {
      const { data: conv, error: cErr } = await supabase
        .from('conversations')
        .insert({ business_id: businessId ?? null, title: title ?? null })
        .select()
        .single()
      throwIfError(cErr, 'CREATE_CONVERSATION', 'No se pudo crear la conversación')

      const participantRows = participantIds.map(uid => ({
        conversation_id: conv.id,
        user_id: uid,
      }))
      const { error: pErr } = await supabase
        .from('chat_participants')
        .insert(participantRows)
      throwIfError(pErr, 'ADD_PARTICIPANTS', 'No se pudieron agregar los participantes')

      return conv as Conversation
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return { ...query, conversations: query.data ?? [], createConversation }
}

// ─── Hook: useMessages ─────────────────────────────────────────────────────────

export function useMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = ['messages', conversationId]

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, attachment_url, attachment_type, is_read, created_at')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true })
        .limit(100)
      throwIfError(error, 'FETCH_MESSAGES', 'No se pudieron cargar los mensajes')
      return (data ?? []) as ChatMessage[]
    },
    enabled: !!conversationId,
    ...QUERY_CONFIG.REALTIME,
  })

  const sendMessage = useMutation({
    mutationFn: async ({
      content,
      senderId,
      attachmentUrl,
      attachmentType,
    }: {
      content: string
      senderId: string
      attachmentUrl?: string
      attachmentType?: string
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId!,
          sender_id: senderId,
          content,
          attachment_url: attachmentUrl ?? null,
          attachment_type: attachmentType ?? null,
          is_read: false,
        })
        .select()
        .single()
      throwIfError(error, 'SEND_MESSAGE', 'No se pudo enviar el mensaje')
      return data as ChatMessage
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const markRead = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId!)
        .neq('sender_id', userId)
        .eq('is_read', false)
      throwIfError(error, 'MARK_MESSAGES_READ', 'No se pudieron marcar los mensajes como leídos')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return { ...query, messages: query.data ?? [], sendMessage, markRead }
}

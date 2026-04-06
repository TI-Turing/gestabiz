import React, { useEffect, useRef } from 'react'
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRoute, RouteProp } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { colors, spacing } from '../../theme'
import Screen from '../../components/ui/Screen'
import MessageBubble from '../../components/chat/MessageBubble'
import ChatInput from '../../components/chat/ChatInput'
import TypingIndicator from '../../components/chat/TypingIndicator'
import { QUERY_CONFIG } from '../../lib/queryClient'

type RouteParams = {
  Chat: { conversationId: string; title?: string }
}

type Message = {
  id: string
  content: string
  sender_id: string
  created_at: string
  read_at: string | null
  sender_name?: string
}

export default function ChatScreen() {
  const { user } = useAuth()
  const route = useRoute<RouteProp<RouteParams, 'Chat'>>()
  const { conversationId } = route.params
  const qc = useQueryClient()
  const listRef = useRef<FlatList>(null)
  const messagesKey = ['messages', conversationId]

  const { data: messages = [], isLoading } = useQuery({
    queryKey: messagesKey,
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at, read_at, profiles:sender_id (full_name)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      return ((data ?? []) as any[]).map(m => ({
        id: m.id,
        content: m.content,
        sender_id: m.sender_id,
        created_at: m.created_at,
        read_at: m.read_at,
        sender_name: (m.profiles as any)?.full_name,
      })) as Message[]
    },
    ...QUERY_CONFIG.REALTIME,
  })

  // Mark messages as read on mount and when new messages arrive
  useEffect(() => {
    if (!user?.id || messages.length === 0) return
    const unread = messages.filter(m => m.sender_id !== user.id && !m.read_at)
    if (unread.length === 0) return
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unread.map(m => m.id))
      .then(() => qc.invalidateQueries({ queryKey: ['conversations', user.id] }))
  }, [messages.length])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, () => {
        qc.invalidateQueries({ queryKey: messagesKey })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content,
      })
      // Update conversation updated_at
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messagesKey })
      qc.invalidateQueries({ queryKey: ['conversations', user?.id] })
    },
  })

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length])

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <MessageBubble
                content={item.content}
                senderName={item.sender_name}
                timestamp={item.created_at}
                isOwn={item.sender_id === user?.id}
                isRead={!!item.read_at}
              />
            )}
            ListFooterComponent={<TypingIndicator isVisible={false} />}
          />
        )}
        <ChatInput
          onSend={text => sendMutation.mutate(text)}
          disabled={sendMutation.isPending}
        />
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { padding: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
})

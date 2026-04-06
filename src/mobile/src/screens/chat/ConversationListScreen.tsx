import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import { QUERY_CONFIG } from '../../lib/queryClient'

type ConversationRow = {
  id: string
  lastMessage: string | null
  lastAt: string | null
  unread: number
  otherName: string
  otherAvatar: string | null
  businessName: string | null
}

export default function ConversationListScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  const qc = useQueryClient()

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      // Get participant rows for current user
      const { data: participantRows } = await supabase
        .from('chat_participants')
        .select('conversation_id')
        .eq('user_id', user!.id)

      const conversationIds = (participantRows ?? []).map((r: any) => r.conversation_id)
      if (conversationIds.length === 0) return []

      // Fetch conversations with last message
      const { data: convRows } = await supabase
        .from('conversations')
        .select('id, business_id, updated_at, businesses:business_id (name), messages (content, created_at, sender_id, read_at)')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false })

      if (!convRows) return []

      // Fetch participants for each conversation (to get the other person)
      const allParticipantRes = await supabase
        .from('chat_participants')
        .select('conversation_id, user_id, profiles:user_id (full_name, avatar_url)')
        .in('conversation_id', conversationIds)
        .neq('user_id', user!.id)

      const participantMap = ((allParticipantRes.data ?? []) as any[]).reduce((acc, p) => {
        if (!acc[p.conversation_id]) acc[p.conversation_id] = p
        return acc
      }, {} as Record<string, any>)

      return convRows.map((conv: any) => {
        const msgs: any[] = conv.messages ?? []
        const sorted = [...msgs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        const lastMsg = sorted[0]
        const unread = msgs.filter(m => m.sender_id !== user!.id && !m.read_at).length
        const other = participantMap[conv.id]

        return {
          id: conv.id,
          lastMessage: lastMsg?.content ?? null,
          lastAt: lastMsg?.created_at ?? conv.updated_at,
          unread,
          otherName: (other?.profiles as any)?.full_name ?? 'Usuario',
          otherAvatar: (other?.profiles as any)?.avatar_url ?? null,
          businessName: (conv.businesses as any)?.name ?? null,
        } as ConversationRow
      })
    },
    enabled: !!user?.id,
    ...QUERY_CONFIG.REALTIME,
  })

  const renderItem = ({ item }: { item: ConversationRow }) => {
    const relTime = item.lastAt
      ? new Date(item.lastAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      : ''
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('Chat', { conversationId: item.id, title: item.otherName })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.otherName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowTop}>
            <Text style={styles.name} numberOfLines={1}>{item.otherName}</Text>
            <Text style={styles.time}>{relTime}</Text>
          </View>
          {item.businessName && (
            <Text style={styles.business} numberOfLines={1}>{item.businessName}</Text>
          )}
          <Text style={[styles.lastMsg, item.unread > 0 && styles.lastMsgUnread]} numberOfLines={1}>
            {item.lastMessage ?? 'Sin mensajes'}
          </Text>
        </View>
        {item.unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unread > 9 ? '9+' : item.unread}</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <Screen>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Sin conversaciones</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyText: { ...typography.body, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
    backgroundColor: colors.card,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.bodyBold, color: colors.primary },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...typography.bodyBold, color: colors.text, flex: 1 },
  business: { ...typography.caption, color: colors.primary },
  lastMsg: { ...typography.caption, color: colors.textMuted },
  lastMsgUnread: { color: colors.text, fontWeight: '600' },
  time: { ...typography.caption, color: colors.textMuted },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
})

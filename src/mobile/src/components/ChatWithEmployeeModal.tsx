import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { colors, spacing, typography, radius } from '../theme'
import { QUERY_CONFIG } from '../lib/queryClient'

type Employee = {
  id: string
  name: string
  role: string
  avatarUrl: string | null
}

type Props = {
  businessId: string
  visible: boolean
  onClose: () => void
}

export default function ChatWithEmployeeModal({ businessId, visible, onClose }: Props) {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  const qc = useQueryClient()

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['chat-employees', businessId],
    queryFn: async () => {
      const { data } = await supabase
        .from('business_employees')
        .select('employee_id, role, profiles:employee_id (full_name, avatar_url)')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .eq('allow_client_messages', true)
        .neq('employee_id', user?.id ?? '')
      return ((data ?? []) as any[]).map(e => ({
        id: e.employee_id,
        name: (e.profiles as any)?.full_name ?? 'Empleado',
        role: e.role,
        avatarUrl: (e.profiles as any)?.avatar_url ?? null,
      })) as Employee[]
    },
    enabled: visible && !!businessId,
    ...QUERY_CONFIG.STABLE,
  })

  const startChatMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      // Check for existing conversation
      const { data: existing } = await supabase
        .from('chat_participants')
        .select('conversation_id')
        .eq('user_id', user!.id)

      const myConvIds = (existing ?? []).map((r: any) => r.conversation_id)

      if (myConvIds.length > 0) {
        const { data: shared } = await supabase
          .from('chat_participants')
          .select('conversation_id')
          .eq('user_id', employeeId)
          .in('conversation_id', myConvIds)
        if (shared && shared.length > 0) {
          return shared[0].conversation_id as string
        }
      }

      // Create new conversation
      const { data: conv } = await supabase
        .from('conversations')
        .insert({ business_id: businessId })
        .select('id')
        .single()

      const conversationId = conv!.id as string
      await supabase.from('chat_participants').insert([
        { conversation_id: conversationId, user_id: user!.id },
        { conversation_id: conversationId, user_id: employeeId },
      ])
      return conversationId
    },
    onSuccess: (conversationId, employeeId) => {
      const emp = employees.find(e => e.id === employeeId)
      qc.invalidateQueries({ queryKey: ['conversations', user?.id] })
      onClose()
      navigation.navigate('Chat', { conversationId, title: emp?.name ?? 'Chat' })
    },
  })

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chatear con...</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : employees.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No hay empleados disponibles para chatear</Text>
          </View>
        ) : (
          <FlatList
            data={employees}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: spacing.md }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => startChatMutation.mutate(item.id)}
                disabled={startChatMutation.isPending}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.role}>{item.role}</Text>
                </View>
                <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.text },
  closeBtn: { padding: spacing.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
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
  name: { ...typography.bodyBold, color: colors.text },
  role: { ...typography.caption, color: colors.textMuted },
})

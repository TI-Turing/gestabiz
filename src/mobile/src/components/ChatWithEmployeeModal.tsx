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
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'
import { spacing, typography, radius } from '../theme'
import { QUERY_CONFIG } from '../lib/queryClient'
import Avatar from './ui/Avatar'

// ─── Types ────────────────────────────────────────────────────────────────────

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

const ROLE_LABELS: Record<string, string> = {
  manager: 'Manager',
  professional: 'Profesional',
  receptionist: 'Recepcionista',
  accountant: 'Contador',
  support_staff: 'Soporte',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatWithEmployeeModal({ businessId, visible, onClose }: Props) {
  const { user } = useAuth()
  const { theme } = useTheme()
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
      return ((data ?? []) as any[]).map((e) => ({
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
      // Buscar conversación existente entre el usuario y este empleado
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

      // Crear conversación nueva
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
      const emp = employees.find((e) => e.id === employeeId)
      qc.invalidateQueries({ queryKey: ['conversations', user?.id] })
      onClose()
      navigation.navigate('Chat', { conversationId, title: emp?.name ?? 'Chat' })
    },
  })

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Chatear con...</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : employees.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Sin agentes disponibles
            </Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Este negocio no tiene empleados disponibles para chatear en este momento.
            </Text>
          </View>
        ) : (
          <FlatList
            data={employees}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.row,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  startChatMutation.isPending && { opacity: 0.6 },
                ]}
                onPress={() => startChatMutation.mutate(item.id)}
                disabled={startChatMutation.isPending}
                activeOpacity={0.75}
              >
                <Avatar name={item.name} uri={item.avatarUrl} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.role, { color: theme.textMuted }]}>
                    {ROLE_LABELS[item.role] ?? item.role}
                  </Text>
                </View>
                {startChatMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons name="chatbubble-outline" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: typography.lg, fontWeight: '700' },
  closeBtn: { padding: spacing.xs },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  name: { fontSize: typography.base, fontWeight: '600' },
  role: { fontSize: typography.sm, marginTop: 2 },
})

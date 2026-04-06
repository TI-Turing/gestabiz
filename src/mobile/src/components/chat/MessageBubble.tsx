import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography, radius } from '../../theme'

type Props = {
  content: string
  senderName?: string
  timestamp: string
  isOwn: boolean
  isRead?: boolean
}

export default function MessageBubble({ content, senderName, timestamp, isOwn, isRead }: Props) {
  const time = new Date(timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  return (
    <View style={[styles.wrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}>
      {!isOwn && senderName && (
        <Text style={styles.senderName}>{senderName}</Text>
      )}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.content, isOwn ? styles.contentOwn : styles.contentOther]}>
          {content}
        </Text>
      </View>
      <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>
        {time}{isOwn && (isRead ? ' ✓✓' : ' ✓')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: spacing.xs / 2,
    maxWidth: '80%',
  },
  wrapperOwn: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapperOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: { ...typography.caption, color: colors.textMuted, marginBottom: 2, marginLeft: spacing.xs },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  bubbleOwn: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
  content: { ...typography.body },
  contentOwn: { color: '#fff' },
  contentOther: { color: colors.text },
  time: { ...typography.caption, marginTop: 2 },
  timeOwn: { color: colors.textMuted },
  timeOther: { color: colors.textMuted },
})

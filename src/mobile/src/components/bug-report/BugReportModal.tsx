import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Modal } from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useTheme } from '../../contexts/ThemeContext'
import { spacing, typography, radius } from '../../theme'
import { useBugReports, type BugReportSeverity } from '../../hooks/useBugReports'

interface BugReportModalProps {
  isOpen: boolean
  onClose: () => void
  /** Pantalla actual desde donde se reporta (ayuda a triaje). */
  affectedPage?: string
}

const SEVERITIES: { value: BugReportSeverity; label: string; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'low', label: 'Baja', color: '#10B981', icon: 'leaf-outline' },
  { value: 'medium', label: 'Media', color: '#F59E0B', icon: 'alert-outline' },
  { value: 'high', label: 'Alta', color: '#FF9800', icon: 'warning-outline' },
  { value: 'critical', label: 'Crítica', color: '#EF4444', icon: 'flame-outline' },
]

export function BugReportModal({ isOpen, onClose, affectedPage }: BugReportModalProps) {
  const { theme } = useTheme()
  const { loading, createBugReport } = useBugReports()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stepsToReproduce, setStepsToReproduce] = useState('')
  const [severity, setSeverity] = useState<BugReportSeverity>('medium')
  const [titleError, setTitleError] = useState<string | undefined>()
  const [descError, setDescError] = useState<string | undefined>()

  const reset = () => {
    setTitle('')
    setDescription('')
    setStepsToReproduce('')
    setSeverity('medium')
    setTitleError(undefined)
    setDescError(undefined)
  }

  const handleClose = () => {
    if (loading) return
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    let valid = true
    if (title.trim().length < 5) {
      setTitleError('Mínimo 5 caracteres')
      valid = false
    } else setTitleError(undefined)
    if (description.trim().length < 10) {
      setDescError('Mínimo 10 caracteres')
      valid = false
    } else setDescError(undefined)
    if (!valid) return

    const ok = await createBugReport({
      title: title.trim(),
      description: description.trim(),
      stepsToReproduce: stepsToReproduce.trim() || undefined,
      severity,
      affectedPage,
    })
    if (ok) {
      reset()
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reportar un problema" size="lg">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.helper, { color: theme.mutedForeground }]}>
          Cuéntanos qué pasó. Tu reporte llega directo a nuestro equipo.
        </Text>

        <Input
          label="Título"
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: La app se cierra al confirmar una cita"
          error={titleError}
          autoCapitalize="sentences"
        />

        <Input
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe el problema con el mayor detalle posible"
          error={descError}
          multiline
          numberOfLines={4}
        />

        <Input
          label="Pasos para reproducir (opcional)"
          value={stepsToReproduce}
          onChangeText={setStepsToReproduce}
          placeholder="1. Abrir la app&#10;2. Buscar negocio&#10;3. Reservar cita..."
          multiline
          numberOfLines={3}
        />

        <View style={styles.severitySection}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Severidad</Text>
          <View style={styles.severityRow}>
            {SEVERITIES.map((s) => {
              const selected = severity === s.value
              return (
                <TouchableOpacity
                  key={s.value}
                  onPress={() => setSeverity(s.value)}
                  activeOpacity={0.8}
                  style={[
                    styles.severityChip,
                    {
                      borderColor: selected ? s.color : theme.border,
                      backgroundColor: selected ? `${s.color}20` : 'transparent',
                    },
                  ]}
                >
                  <Ionicons name={s.icon} size={16} color={selected ? s.color : theme.textSecondary} />
                  <Text
                    style={[
                      styles.severityText,
                      { color: selected ? s.color : theme.textSecondary, fontWeight: selected ? '600' : '500' },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={styles.actions}>
          <Button title="Cancelar" variant="ghost" onPress={handleClose} disabled={loading} />
          <Button title="Enviar reporte" onPress={handleSubmit} loading={loading} icon="send" />
        </View>
      </ScrollView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  helper: {
    fontSize: typography.sm,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  severitySection: {
    marginTop: spacing.xs,
  },
  severityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  severityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  severityText: {
    fontSize: typography.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
})

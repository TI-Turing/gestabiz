import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { radius, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

interface ProgressBarProps {
  /** Valor actual (0-total) */
  value: number
  /** Valor máximo */
  total: number
  /** Mostrar etiqueta "N de M" */
  showLabel?: boolean
  /** Color personalizado para la barra activa */
  color?: string
  /** Altura de la barra en px */
  height?: number
  style?: ViewStyle
}

export function ProgressBar({
  value,
  total,
  showLabel = false,
  color,
  height = 6,
  style,
}: ProgressBarProps) {
  const { theme } = useTheme()
  const pct = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0
  const barColor = color ?? theme.primary

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.track,
          { backgroundColor: theme.border, height, borderRadius: height / 2 },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${pct * 100}%`,
              backgroundColor: barColor,
              height,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {value} de {total}
        </Text>
      )}
    </View>
  )
}

// ─── Stepped variant — muestra puntos/segmentos en lugar de barra continua ─────

interface SteppedProgressProps {
  currentStep: number
  totalSteps: number
  style?: ViewStyle
}

export function SteppedProgress({ currentStep, totalSteps, style }: SteppedProgressProps) {
  const { theme } = useTheme()

  return (
    <View style={[styles.steppedContainer, style]}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const done = i < currentStep
        const active = i === currentStep - 1
        return (
          <View
            key={i}
            style={[
              styles.step,
              {
                flex: 1,
                height: 4,
                backgroundColor: done || active ? theme.primary : theme.border,
                opacity: active ? 1 : done ? 0.7 : 0.4,
              },
            ]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1] + 2,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  label: {
    fontSize: typography.xs,
    textAlign: 'right',
  },
  steppedContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  step: {
    borderRadius: radius.full,
  },
})

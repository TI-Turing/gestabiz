import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native'
import DateTimePickerNative, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Modal } from './Modal'
import Button from './Button'
import { radius, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

// ─── Shared picker shell ──────────────────────────────────────────────────────

interface PickerShellProps {
  label?: string
  error?: string
  displayValue: string
  onOpen: () => void
  disabled?: boolean
  icon: string
  style?: ViewStyle
}

function PickerShell({ label, error, displayValue, onOpen, disabled, icon, style }: PickerShellProps) {
  const { theme } = useTheme()
  return (
    <View style={style}>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
      <TouchableOpacity
        onPress={() => !disabled && onOpen()}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.inputBg,
            borderColor: error ? theme.error : theme.inputBorder,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        activeOpacity={0.7}
      >
        <Ionicons name={icon as any} size={18} color={theme.textSecondary} />
        <Text style={[styles.triggerText, { color: displayValue ? theme.text : theme.textMuted }]}>
          {displayValue || 'Seleccionar...'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
      </TouchableOpacity>
      {error && <Text style={[styles.error, { color: theme.error }]}>{error}</Text>}
    </View>
  )
}

// ─── DatePicker ───────────────────────────────────────────────────────────────

interface DatePickerProps {
  value: Date | null
  onChange: (date: Date) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  minimumDate?: Date
  maximumDate?: Date
  style?: ViewStyle
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Seleccionar fecha',
  error,
  disabled = false,
  minimumDate,
  maximumDate,
  style,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date())

  const displayValue = value
    ? format(value, "d 'de' MMMM yyyy", { locale: es })
    : ''

  const handleChange = (_: DateTimePickerEvent, date?: Date) => {
    if (date) {
      if (Platform.OS === 'android') {
        setOpen(false)
        onChange(date)
      } else {
        setTempDate(date)
      }
    } else if (Platform.OS === 'android') {
      setOpen(false)
    }
  }

  if (Platform.OS === 'android') {
    return (
      <>
        <PickerShell
          label={label}
          error={error}
          displayValue={displayValue}
          onOpen={() => setOpen(true)}
          disabled={disabled}
          icon="calendar"
          style={style}
        />
        {open && (
          <DateTimePickerNative
            value={tempDate}
            mode="date"
            display="default"
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        )}
      </>
    )
  }

  return (
    <>
      <PickerShell
        label={label}
        error={error}
        displayValue={displayValue}
        onOpen={() => setOpen(true)}
        disabled={disabled}
        icon="calendar"
        style={style}
      />
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Seleccionar fecha"
        size="sm"
      >
        <DateTimePickerNative
          value={tempDate}
          mode="date"
          display="spinner"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          locale="es"
          style={styles.iosPicker}
        />
        <View style={styles.iosActions}>
          <Button title="Cancelar" onPress={() => setOpen(false)} variant="secondary" />
          <Button
            title="Confirmar"
            onPress={() => {
              onChange(tempDate)
              setOpen(false)
            }}
          />
        </View>
      </Modal>
    </>
  )
}

// ─── TimePicker ───────────────────────────────────────────────────────────────

interface TimePickerProps {
  value: Date | null
  onChange: (date: Date) => void
  label?: string
  error?: string
  disabled?: boolean
  minuteInterval?: 1 | 5 | 10 | 15 | 20 | 30
  style?: ViewStyle
}

export function TimePicker({
  value,
  onChange,
  label,
  error,
  disabled = false,
  minuteInterval = 15,
  style,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date())

  const displayValue = value ? format(value, 'HH:mm', { locale: es }) : ''

  const handleChange = (_: DateTimePickerEvent, date?: Date) => {
    if (date) {
      if (Platform.OS === 'android') {
        setOpen(false)
        onChange(date)
      } else {
        setTempDate(date)
      }
    } else if (Platform.OS === 'android') {
      setOpen(false)
    }
  }

  if (Platform.OS === 'android') {
    return (
      <>
        <PickerShell
          label={label}
          error={error}
          displayValue={displayValue}
          onOpen={() => setOpen(true)}
          disabled={disabled}
          icon="time"
          style={style}
        />
        {open && (
          <DateTimePickerNative
            value={tempDate}
            mode="time"
            display="default"
            onChange={handleChange}
            minuteInterval={minuteInterval}
          />
        )}
      </>
    )
  }

  return (
    <>
      <PickerShell
        label={label}
        error={error}
        displayValue={displayValue}
        onOpen={() => setOpen(true)}
        disabled={disabled}
        icon="time"
        style={style}
      />
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Seleccionar hora" size="sm">
        <DateTimePickerNative
          value={tempDate}
          mode="time"
          display="spinner"
          onChange={handleChange}
          minuteInterval={minuteInterval}
          style={styles.iosPicker}
        />
        <View style={styles.iosActions}>
          <Button title="Cancelar" onPress={() => setOpen(false)} variant="secondary" />
          <Button
            title="Confirmar"
            onPress={() => {
              onChange(tempDate)
              setOpen(false)
            }}
          />
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: typography.sm,
    fontWeight: '500',
    marginBottom: spacing[1] + 2,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
    minHeight: 46,
    gap: spacing.xs + 2,
  },
  triggerText: {
    flex: 1,
    fontSize: typography.base,
  },
  error: {
    fontSize: typography.xs,
    marginTop: spacing[1],
  },
  iosPicker: {
    width: '100%',
    height: 200,
  },
  iosActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
})

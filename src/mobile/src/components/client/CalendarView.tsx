import React, { useState, useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { spacing, typography, radius } from '../../theme'
import LoadingSpinner from '../ui/LoadingSpinner'
import { QUERY_CONFIG } from '../../lib/queryClient'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayAppointment {
  id: string
  start_time: string
  status: string
  serviceName: string
  businessName: string
}

interface CalendarViewProps {
  /** Si se proporciona, al tocar una cita se llama este handler */
  onAppointmentPress?: (appointmentId: string) => void
}

const WEEKDAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

function formatYMD(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ─── Component ────────────────────────────────────────────────────────────────
//
// Vista de calendario mensual reutilizable. Diseñada para embeberse dentro
// de "Mis Citas" cuando el usuario activa el toggle Calendar, o en cualquier
// otro contexto donde se necesite una vista mensual de citas del cliente.

export default function CalendarView({ onAppointmentPress }: CalendarViewProps) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>(formatYMD(now))

  const DOT_COLORS: Record<string, string> = {
    scheduled: theme.primary,
    confirmed: '#10b981',
    completed: '#3b82f6',
    cancelled: '#ef4444',
    pending: '#f59e0b',
  }

  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['calendar-appointments', user?.id, year, month],
    queryFn: async (): Promise<DayAppointment[]> => {
      const start = firstOfMonth.toISOString()
      const end = lastOfMonth.toISOString()

      const { data: apts, error } = await supabase
        .from('appointments')
        .select('id, start_time, status, service_id, business_id')
        .eq('client_id', user!.id)
        .gte('start_time', start)
        .lte('start_time', end)
        .not('status', 'eq', 'cancelled')
        .order('start_time', { ascending: true })

      if (error || !apts?.length) return []

      const serviceIds = [...new Set(apts.map((a) => a.service_id as string).filter(Boolean))]
      const businessIds = [...new Set(apts.map((a) => a.business_id as string).filter(Boolean))]

      const [svcRes, bizRes] = await Promise.all([
        supabase.from('services').select('id, name').in('id', serviceIds),
        supabase.from('businesses').select('id, name').in('id', businessIds),
      ])

      const svcMap = Object.fromEntries(
        (svcRes.data ?? []).map((s: Record<string, unknown>) => [s.id, s.name]),
      )
      const bizMap = Object.fromEntries(
        (bizRes.data ?? []).map((b: Record<string, unknown>) => [b.id, b.name]),
      )

      return apts.map((a) => ({
        id: a.id as string,
        start_time: a.start_time as string,
        status: a.status as string,
        serviceName: (svcMap[a.service_id as string] as string) ?? 'Servicio',
        businessName: (bizMap[a.business_id as string] as string) ?? 'Negocio',
      }))
    },
    enabled: !!user?.id,
    ...QUERY_CONFIG.FREQUENT,
  })

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = []
    const startWeekday = firstOfMonth.getDay()
    for (let i = 0; i < startWeekday; i++) days.push(null)
    for (let d = 1; d <= lastOfMonth.getDate(); d++) {
      days.push(new Date(year, month, d))
    }
    return days
  }, [year, month, firstOfMonth, lastOfMonth])

  const markedDates = useMemo(() => {
    const map: Record<string, { dots: { color: string }[] }> = {}
    appointments.forEach((a) => {
      const key = formatYMD(new Date(a.start_time))
      if (!map[key]) map[key] = { dots: [] }
      const color = DOT_COLORS[a.status] ?? theme.primary
      if (!map[key].dots.some((d) => d.color === color)) {
        map[key].dots.push({ color })
      }
    })
    return map
  }, [appointments, DOT_COLORS, theme.primary])

  const selectedAppointments = useMemo(
    () => appointments.filter((a) => formatYMD(new Date(a.start_time)) === selectedDate),
    [appointments, selectedDate],
  )

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else setMonth((m) => m + 1)
  }

  return (
    <View style={s.container}>
      {/* Month navigation */}
      <View style={s.monthNav}>
        <TouchableOpacity
          onPress={prevMonth}
          style={[s.navBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.monthLabel, { color: theme.text }]}>
          {firstOfMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={[s.navBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={s.weekRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={[s.weekday, { color: theme.textMuted }]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      {isLoading ? (
        <View style={s.loadingBox}>
          <LoadingSpinner />
        </View>
      ) : (
        <View style={s.grid}>
          {calendarDays.map((day, idx) => {
            if (!day) return <View key={`empty-${idx}`} style={s.cell} />
            const ymd = formatYMD(day)
            const marked = markedDates[ymd]
            const isSelected = ymd === selectedDate
            const isToday = ymd === formatYMD(now)

            return (
              <TouchableOpacity
                key={ymd}
                style={[
                  s.cell,
                  isSelected && { backgroundColor: theme.primary },
                  isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.primary },
                ]}
                onPress={() => setSelectedDate(ymd)}
              >
                <Text
                  style={[
                    s.dayNum,
                    { color: theme.text },
                    isSelected && { color: '#fff', fontWeight: '700' },
                    isToday && !isSelected && { color: theme.primary, fontWeight: '700' },
                  ]}
                >
                  {day.getDate()}
                </Text>
                {marked?.dots && marked.dots.length > 0 && (
                  <View style={s.dotRow}>
                    {marked.dots.slice(0, 3).map((dot, i) => (
                      <View key={i} style={[s.dot, { backgroundColor: dot.color }]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      {/* Selected day appointments */}
      <View style={[s.daySection, { borderTopColor: theme.border }]}>
        <Text style={[s.dayLabel, { color: theme.text }]}>
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CO', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
          })}
        </Text>
        {selectedAppointments.length === 0 ? (
          <Text style={[s.noApts, { color: theme.textMuted }]}>Sin citas este día</Text>
        ) : (
          <FlatList
            data={selectedAppointments}
            keyExtractor={(a) => a.id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const time = new Date(item.start_time).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })
              const dotColor = DOT_COLORS[item.status] ?? theme.primary
              return (
                <TouchableOpacity
                  style={[s.aptRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  activeOpacity={0.75}
                  onPress={() => onAppointmentPress?.(item.id)}
                >
                  <View style={[s.aptDot, { backgroundColor: dotColor }]} />
                  <View style={s.aptInfo}>
                    <Text style={[s.aptService, { color: theme.text }]}>{item.serviceName}</Text>
                    <Text style={[s.aptBiz, { color: theme.textMuted }]}>{item.businessName}</Text>
                  </View>
                  <Text style={[s.aptTime, { color: theme.textMuted }]}>{time}</Text>
                </TouchableOpacity>
              )
            }}
          />
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
  },
  navBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  monthLabel: {
    fontSize: typography.lg,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weekRow: {
    flexDirection: 'row',
    paddingBottom: spacing.xs,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.xs,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  dayNum: {
    fontSize: typography.base,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  loadingBox: { paddingVertical: spacing.xl },
  daySection: {
    marginTop: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: 1,
  },
  dayLabel: {
    fontSize: typography.base,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
  },
  noApts: { fontSize: typography.sm, fontStyle: 'italic' },
  aptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  aptDot: { width: 8, height: 8, borderRadius: 4 },
  aptInfo: { flex: 1 },
  aptService: { fontSize: typography.sm, fontWeight: '600' },
  aptBiz: { fontSize: typography.xs, marginTop: 2 },
  aptTime: { fontSize: typography.sm, fontWeight: '600' },
})

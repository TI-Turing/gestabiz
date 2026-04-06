import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import { QUERY_CONFIG } from '../../lib/queryClient'

interface DayAppointment {
  id: string
  start_time: string
  status: string
  serviceName: string
  businessName: string
}

interface MarkedDate {
  [date: string]: {
    dots?: { color: string }[]
    selected?: boolean
    selectedColor?: string
  }
}

function formatYMD(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const DOT_COLORS: Record<string, string> = {
  scheduled: colors.primary,
  confirmed: '#22c55e',
  completed: '#8b5cf6',
  cancelled: '#ef4444',
}

export default function CalendarScreen() {
  const { user } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(formatYMD(now))

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

      const serviceIds = [...new Set(apts.map(a => a.service_id as string).filter(Boolean))]
      const businessIds = [...new Set(apts.map(a => a.business_id as string).filter(Boolean))]

      const [svcRes, bizRes] = await Promise.all([
        supabase.from('services').select('id, name').in('id', serviceIds),
        supabase.from('businesses').select('id, name').in('id', businessIds),
      ])

      const svcMap = Object.fromEntries(
        (svcRes.data ?? []).map((s: Record<string, unknown>) => [s.id, s.name])
      )
      const bizMap = Object.fromEntries(
        (bizRes.data ?? []).map((b: Record<string, unknown>) => [b.id, b.name])
      )

      return apts.map(a => ({
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

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = []
    const startWeekday = firstOfMonth.getDay() // 0=Sun
    for (let i = 0; i < startWeekday; i++) days.push(null)
    for (let d = 1; d <= lastOfMonth.getDate(); d++) {
      days.push(new Date(year, month, d))
    }
    return days
  }, [year, month, firstOfMonth, lastOfMonth])

  const markedDates = useMemo(() => {
    const map: MarkedDate = {}
    appointments.forEach(a => {
      const key = formatYMD(new Date(a.start_time))
      if (!map[key]) map[key] = { dots: [] }
      const color = DOT_COLORS[a.status] ?? colors.primary
      if (!map[key].dots!.some(d => d.color === color)) {
        map[key].dots!.push({ color })
      }
    })
    return map
  }, [appointments])

  const selectedAppointments = useMemo(
    () => appointments.filter(a => formatYMD(new Date(a.start_time)) === selectedDate),
    [appointments, selectedDate]
  )

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const WEEKDAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

  return (
    <Screen>
      <View style={styles.container}>
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {firstOfMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Weekday headers */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map(d => (
            <Text key={d} style={styles.weekday}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={styles.grid}>
            {calendarDays.map((day, idx) => {
              if (!day) return <View key={`empty-${idx}`} style={styles.cell} />
              const ymd = formatYMD(day)
              const marked = markedDates[ymd]
              const isSelected = ymd === selectedDate
              const isToday = ymd === formatYMD(now)

              return (
                <TouchableOpacity
                  key={ymd}
                  style={[
                    styles.cell,
                    isSelected && styles.cellSelected,
                    isToday && !isSelected && styles.cellToday,
                  ]}
                  onPress={() => setSelectedDate(ymd)}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      isSelected && styles.dayNumSelected,
                      isToday && !isSelected && styles.dayNumToday,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                  {marked?.dots && marked.dots.length > 0 && (
                    <View style={styles.dotRow}>
                      {marked.dots.slice(0, 3).map((dot, i) => (
                        <View key={i} style={[styles.dot, { backgroundColor: dot.color }]} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* Selected day appointments */}
        <View style={styles.daySection}>
          <Text style={styles.dayLabel}>
            {new Date(selectedDate).toLocaleDateString('es-CO', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            })}
          </Text>
          {selectedAppointments.length === 0 ? (
            <Text style={styles.noApts}>Sin citas este día</Text>
          ) : (
            <FlatList
              data={selectedAppointments}
              keyExtractor={a => a.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const time = new Date(item.start_time).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <View style={styles.aptRow}>
                    <View style={[styles.aptDot, { backgroundColor: DOT_COLORS[item.status] ?? colors.primary }]} />
                    <View style={styles.aptInfo}>
                      <Text style={styles.aptService}>{item.serviceName}</Text>
                      <Text style={styles.aptBiz}>{item.businessName}</Text>
                    </View>
                    <Text style={styles.aptTime}>{time}</Text>
                  </View>
                )
              }}
            />
          )}
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  navBtn: {
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  monthLabel: {
    ...typography.h3,
    color: colors.text,
    textTransform: 'capitalize',
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  loadingBox: { height: 200, alignItems: 'center', justifyContent: 'center' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  cellSelected: { backgroundColor: colors.primary },
  cellToday: { borderWidth: 1.5, borderColor: colors.primary },
  dayNum: { ...typography.body, color: colors.text, fontWeight: '500' },
  dayNumSelected: { color: '#fff', fontWeight: '700' },
  dayNumToday: { color: colors.primary, fontWeight: '700' },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 1,
  },
  dot: { width: 4, height: 4, borderRadius: 2 },
  daySection: {
    marginTop: spacing.lg,
    flex: 1,
  },
  dayLabel: {
    ...typography.h3,
    color: colors.text,
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
  },
  noApts: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  aptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  aptDot: { width: 8, height: 8, borderRadius: 4 },
  aptInfo: { flex: 1 },
  aptService: { ...typography.bodyBold, color: colors.text },
  aptBiz: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  aptTime: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
})

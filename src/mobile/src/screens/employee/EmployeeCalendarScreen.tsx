import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { useEmployeeAbsences } from '../../hooks/useEmployeeAbsences'
import { usePublicHolidays } from '../../hooks/usePublicHolidays'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import { QUERY_CONFIG } from '../../lib/queryClient'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function formatYMD(d: Date) {
  return d.toISOString().split('T')[0]
}

type DayMarker = {
  type: 'appointment' | 'absence' | 'holiday'
  color: string
}

export default function EmployeeCalendarScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const businessId = activeBusiness
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>(formatYMD(now))

  // Employee appointments for this month
  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0)

  const { data: appointments, isLoading: loadingApts } = useQuery({
    queryKey: ['employee-calendar', user?.id, businessId, year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, start_time, end_time, status, service_id')
        .eq('employee_id', user?.id)
        .eq('business_id', businessId)
        .gte('start_time', startOfMonth.toISOString())
        .lte('start_time', endOfMonth.toISOString())
        .order('start_time')
      if (error) throw error
      return data ?? []
    },
    enabled: !!user?.id && !!businessId,
    ...QUERY_CONFIG.FREQUENT,
  })

  const { absences, isLoading: loadingAbsences } = useEmployeeAbsences(user?.id, businessId ?? undefined)
  const { isHoliday, getHolidayName } = usePublicHolidays('CO', year)

  // Build calendar grid
  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: Array<Date | null> = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    return cells
  }, [year, month])

  // Build marker map
  const markerMap = useMemo<Record<string, DayMarker[]>>(() => {
    const map: Record<string, DayMarker[]> = {}

    appointments?.forEach(apt => {
      const ymd = apt.start_time.split('T')[0]
      if (!map[ymd]) map[ymd] = []
      if (map[ymd].length < 3) {
        const c =
          apt.status === 'confirmed' ? colors.success
          : apt.status === 'completed' ? '#8b5cf6'
          : apt.status === 'cancelled' ? colors.error
          : colors.primary
        map[ymd].push({ type: 'appointment', color: c })
      }
    })

    const approvedAbsences = absences?.filter(a => a.status === 'approved') ?? []
    approvedAbsences.forEach(absence => {
      const start = new Date(absence.start_date)
      const end = new Date(absence.end_date)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const ymd = formatYMD(d)
        if (!map[ymd]) map[ymd] = []
        if (!map[ymd].find(m => m.type === 'absence')) {
          map[ymd].push({ type: 'absence', color: '#f97316' })
        }
      }
    })

    for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) {
      const date = new Date(year, month, d)
      const ymd = formatYMD(date)
      if (isHoliday(ymd)) {
        if (!map[ymd]) map[ymd] = []
        if (!map[ymd].find(m => m.type === 'holiday')) {
          map[ymd].push({ type: 'holiday', color: colors.error })
        }
      }
    }

    return map
  }, [appointments, absences, isHoliday, year, month])

  // Selected day appointments
  const dayApts = appointments?.filter(a => a.start_time.startsWith(selectedDate)) ?? []
  const dayHoliday = isHoliday(selectedDate) ? getHolidayName(selectedDate) : null

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const isLoading = loadingApts || loadingAbsences

  return (
    <Screen>
      <ScrollView>
        {/* Header */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* Day names row */}
        <View style={styles.row}>
          {DAY_NAMES.map(d => (
            <Text key={d} style={styles.dayName}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={styles.grid}>
            {grid.map((date, i) => {
              if (!date) return <View key={i} style={styles.cell} />
              const ymd = formatYMD(date)
              const isToday = ymd === formatYMD(new Date())
              const isSelected = ymd === selectedDate
              const markers = markerMap[ymd] ?? []

              return (
                <TouchableOpacity
                  key={ymd}
                  style={[
                    styles.cell,
                    isToday && styles.cellToday,
                    isSelected && styles.cellSelected,
                  ]}
                  onPress={() => setSelectedDate(ymd)}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      isToday && styles.dayNumToday,
                      isSelected && styles.dayNumSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  <View style={styles.dots}>
                    {markers.slice(0, 3).map((m, j) => (
                      <View key={j} style={[styles.dot, { backgroundColor: m.color }]} />
                    ))}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <LegendItem color={colors.primary} label="Programada" />
          <LegendItem color={colors.success} label="Confirmada" />
          <LegendItem color="#f97316" label="Ausencia" />
          <LegendItem color={colors.error} label="Festivo" />
        </View>

        {/* Selected day panel */}
        <View style={styles.dayPanel}>
          <Text style={styles.dayPanelTitle}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>

          {dayHoliday && (
            <View style={styles.holidayRow}>
              <Text style={styles.holidayText}>Festivo: {dayHoliday}</Text>
            </View>
          )}

          {dayApts.length === 0 && !dayHoliday && (
            <Text style={styles.noApts}>Sin citas para este día</Text>
          )}

          {dayApts.map(apt => {
            const timeStr = new Date(apt.start_time).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
            })
            const statusColor =
              apt.status === 'confirmed' ? colors.success
              : apt.status === 'cancelled' ? colors.error
              : colors.primary
            return (
              <View key={apt.id} style={styles.aptItem}>
                <View style={[styles.aptDot, { backgroundColor: statusColor }]} />
                <Text style={styles.aptTime}>{timeStr}</Text>
                <Text style={styles.aptStatus}>{apt.status}</Text>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </Screen>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  )
}

const CELL_SIZE = `${100 / 7}%` as const

const styles = StyleSheet.create({
  center: { height: 200, alignItems: 'center', justifyContent: 'center' },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navBtn: { padding: spacing.sm },
  navArrow: { ...typography.h3, color: colors.primary },
  monthLabel: { ...typography.h3, color: colors.text },
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: 4,
  },
  dayName: {
    width: CELL_SIZE,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
  },
  cell: {
    width: CELL_SIZE,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  cellToday: {
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  cellSelected: {
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  dayNum: { ...typography.caption, color: colors.text },
  dayNumToday: { color: colors.primary, fontWeight: '700' },
  dayNumSelected: { color: '#fff', fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 1 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { ...typography.caption, color: colors.textMuted },
  dayPanel: {
    margin: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  dayPanelTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  holidayRow: {
    backgroundColor: colors.error + '15',
    borderRadius: radius.sm,
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  holidayText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  noApts: { ...typography.body, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  aptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  aptDot: { width: 8, height: 8, borderRadius: 4 },
  aptTime: { ...typography.bodyBold, color: colors.text, width: 50 },
  aptStatus: { ...typography.caption, color: colors.textMuted, textTransform: 'capitalize' },
})

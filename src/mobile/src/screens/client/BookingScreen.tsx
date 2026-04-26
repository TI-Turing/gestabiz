import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ScrollView, Alert, Platform, Image, Dimensions,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, RouteProp } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import type { ThemeColors } from '../../theme'
import { supabase } from '../../lib/supabase'
import { spacing, typography, radius } from '../../theme'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { Business, Service, Location } from '../../types'
import { QUERY_KEYS as QK, QUERY_CONFIG as QC } from '../../lib/queryClient'

type BookingRouteParams = {
  Reservar: { preselectedBusinessId?: string }
}

interface EmployeeOption {
  id: string
  employee_id: string
  full_name: string
  avatar_url?: string
}

interface TimeSlot { time: string; available: boolean }

type Step = 'business' | 'service' | 'employee' | 'datetime' | 'confirm'

interface WizardData {
  business: Business | null
  service: Service | null
  employee: EmployeeOption | null
  location: Location | null
  date: Date
  timeSlot: string | null
  notes: string
}

function generateSlots(opensAt: string, closesAt: string): TimeSlot[] {
  const slots: TimeSlot[] = []
  const [oh, om] = opensAt.split(':').map(Number)
  const [ch, cm] = closesAt.split(':').map(Number)
  let h = oh, m = om
  while (h < ch || (h === ch && m < cm)) {
    slots.push({ time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, available: true })
    m += 30
    if (m >= 60) { h++; m = 0 }
  }
  return slots
}

const STEPS: { key: Step; label: string }[] = [
  { key: 'business', label: 'Negocio' },
  { key: 'service', label: 'Servicio' },
  { key: 'employee', label: 'Profesional' },
  { key: 'datetime', label: 'Fecha y hora' },
  { key: 'confirm', label: 'Confirmar' },
]

type BusinessWithStats = Business & {
  average_rating?: number | null
  review_count?: number | null
}

const SCREEN_W = Dimensions.get('window').width
const CARD_GAP = spacing.sm
const CARD_W = (SCREEN_W - spacing.base * 2 - CARD_GAP) / 2
const CARD_H = Math.round(CARD_W * 0.68)

function StepBusiness({ onSelect, theme }: { onSelect: (b: Business) => void; theme: ThemeColors }) {
  const [search, setSearch] = useState('')
  const [minRating, setMinRating] = useState(false)
  const [minReviews, setMinReviews] = useState('')

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses-grid', search, minRating, minReviews],
    queryFn: async () => {
      let q = supabase.from('businesses').select('*').eq('is_active', true).limit(50)
      if (search.trim()) q = q.ilike('name', `%${search.trim()}%`)
      const { data } = await q
      let results = (data ?? []) as BusinessWithStats[]
      if (minRating) results = results.filter((b) => (b.average_rating ?? 0) >= 4.5)
      const n = parseInt(minReviews, 10)
      if (!isNaN(n) && n > 0) results = results.filter((b) => (b.review_count ?? 0) >= n)
      return results.slice(0, 30)
    },
    ...QC.STABLE,
  })

  const businessIds = businesses.map((b) => b.id)
  const { data: locationCounts = {} } = useQuery({
    queryKey: ['biz-loc-counts', businessIds.join(',')],
    queryFn: async () => {
      if (businessIds.length === 0) return {}
      const { data } = await supabase
        .from('locations')
        .select('business_id')
        .in('business_id', businessIds)
        .eq('is_active', true)
      const counts: Record<string, number> = {}
      for (const l of data ?? []) counts[l.business_id] = (counts[l.business_id] ?? 0) + 1
      return counts
    },
    enabled: businessIds.length > 0,
    ...QC.STABLE,
  })

  return (
    <View style={styles.stepContainer}>
      <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border, marginHorizontal: spacing.base }]}>
        <Ionicons name="search-outline" size={18} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Buscar negocios..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      <View style={[styles.filterRow, { marginHorizontal: spacing.base }]}>
        <TouchableOpacity
          style={[
            styles.filterPill,
            { borderColor: minRating ? theme.primary : theme.border },
            minRating && { backgroundColor: `${theme.primary}22` },
          ]}
          onPress={() => setMinRating((v) => !v)}
        >
          <Ionicons name="star" size={12} color={minRating ? theme.primary : theme.textMuted} />
          <Text style={[styles.filterPillText, { color: minRating ? theme.primary : theme.textSecondary }]}>4.5 o más</Text>
        </TouchableOpacity>
        <View style={styles.filterInputGroup}>
          <Text style={[styles.filterInputLabel, { color: theme.textSecondary }]}>Reviews mín.</Text>
          <TextInput
            style={[styles.filterInputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            placeholder="e.g. 10"
            placeholderTextColor={theme.textMuted}
            keyboardType="numeric"
            value={minReviews}
            onChangeText={setMinReviews}
            maxLength={4}
          />
        </View>
      </View>

      {isLoading ? <LoadingSpinner /> : (
        <FlatList
          data={businesses}
          keyExtractor={(b) => b.id}
          numColumns={2}
          key="two-col"
          columnWrapperStyle={styles.bizGridRow}
          contentContainerStyle={styles.bizGridContent}
          renderItem={({ item }) => {
            const sedes = locationCounts[item.id] ?? 0
            return (
              <TouchableOpacity
                style={[styles.bizCard, { borderColor: theme.cardBorder }]}
                onPress={() => onSelect(item)}
                activeOpacity={0.85}
              >
                {item.banner_url ? (
                  <Image source={{ uri: item.banner_url }} style={styles.bizCardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.bizCardNoBanner, { backgroundColor: `${theme.primary}22` }]}>
                    <Ionicons name="business-outline" size={28} color={`${theme.primary}55`} />
                  </View>
                )}
                <View style={styles.bizCardOverlay} />
                <View style={styles.bizCardContent}>
                  <View style={styles.bizCardLogoRow}>
                    <Avatar uri={item.logo_url} name={item.name} size={24} />
                  </View>
                  <Text style={styles.bizCardName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.bizCardMetaRow}>
                    <Ionicons name="star" size={9} color="#fbbf24" />
                    <Text style={styles.bizCardRating}>{item.average_rating != null ? item.average_rating.toFixed(1) : '—'}</Text>
                    <Text style={styles.bizCardReviews}> ({item.review_count ?? 0})</Text>
                    {sedes > 0 && (
                      <>
                        <Text style={styles.bizCardDot}> · </Text>
                        <Ionicons name="location-outline" size={9} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.bizCardSedes}> {sedes}</Text>
                      </>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

function StepService({ businessId, onSelect, theme }: { businessId: string; onSelect: (s: Service) => void; theme: ThemeColors }) {
  const { data: services = [], isLoading } = useQuery({
    queryKey: QK.SERVICES(businessId),
    queryFn: async () => {
      const { data } = await supabase.from('services').select('*').eq('business_id', businessId).eq('is_active', true).order('name')
      return (data ?? []) as Service[]
    },
    ...QC.STABLE,
  })

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  if (isLoading) return <LoadingSpinner />

  return (
    <FlatList
      data={services}
      keyExtractor={(s) => s.id}
      style={styles.flatList}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.selCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => onSelect(item)}
        >
          <View style={styles.selInfo}>
            <Text style={[styles.selName, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.selSub, { color: theme.textSecondary }]}>{item.duration} min · {formatCOP(item.price)}</Text>
            {item.description && <Text style={[styles.selDesc, { color: theme.textMuted }]} numberOfLines={1}>{item.description}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      )}
    />
  )
}

function StepEmployee({ businessId, onSelect, onSkip, theme }: { businessId: string; serviceId: string; onSelect: (e: EmployeeOption) => void; onSkip: () => void; theme: ThemeColors }) {
  const { data: employees = [], isLoading } = useQuery({
    queryKey: QK.EMPLOYEES(businessId),
    queryFn: async () => {
      const { data: emps } = await supabase
        .from('business_employees')
        .select('id, employee_id')
        .eq('business_id', businessId)
        .eq('status', 'approved')
        .eq('is_active', true)
        .eq('offers_services', true)

      if (!emps || emps.length === 0) return []
      const ids = emps.map((e) => e.employee_id)
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', ids)

      return emps.map((e) => {
        const p = (profiles ?? []).find((pr) => pr.id === e.employee_id)
        return { id: e.id, employee_id: e.employee_id, full_name: p?.full_name ?? 'Empleado', avatar_url: p?.avatar_url }
      }) as EmployeeOption[]
    },
    ...QC.STABLE,
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <FlatList
      data={employees}
      keyExtractor={(e) => e.id}
      style={styles.flatList}
      ListHeaderComponent={
        <TouchableOpacity
          style={[styles.selCard, { backgroundColor: theme.card, borderColor: '#22c55e44' }]}
          onPress={onSkip}
        >
          <View style={[styles.bizIcon, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
            <Ionicons name="shuffle-outline" size={22} color="#22c55e" />
          </View>
          <View style={styles.selInfo}>
            <Text style={[styles.selName, { color: theme.text }]}>Cualquier profesional</Text>
            <Text style={[styles.selSub, { color: theme.textSecondary }]}>Asignación automática</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.selCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => onSelect(item)}
        >
          <Avatar name={item.full_name} uri={item.avatar_url} size={40} />
          <View style={styles.selInfo}>
            <Text style={[styles.selName, { color: theme.text }]}>{item.full_name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      )}
    />
  )
}

function StepDateTime({
  businessId, employeeId, serviceDuration, onSelect, theme,
}: {
  businessId: string
  employeeId: string | null
  serviceDuration: number
  onSelect: (date: Date, time: string) => void
  theme: ThemeColors
}) {
  const [date, setDate] = useState(new Date())
  const [showPicker, setShowPicker] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const dateStr = date.toISOString().split('T')[0]

  const { data: location } = useQuery({
    queryKey: QK.LOCATIONS(businessId),
    queryFn: async () => {
      const { data } = await supabase.from('locations').select('opens_at, closes_at').eq('business_id', businessId).eq('is_active', true).limit(1).single()
      return data
    },
    ...QC.STABLE,
  })

  const { data: bookedSlots = [] } = useQuery({
    queryKey: QK.AVAILABLE_SLOTS(employeeId ?? businessId, dateStr),
    queryFn: async () => {
      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999)
      let q = supabase.from('appointments').select('start_time, end_time').gte('start_time', dayStart.toISOString()).lte('start_time', dayEnd.toISOString()).in('status', ['scheduled', 'confirmed'])
      if (employeeId) q = q.eq('employee_id', employeeId)
      const { data } = await q
      return (data ?? []).map((a) => ({ start: new Date(a.start_time), end: new Date(a.end_time) }))
    },
    ...QC.FREQUENT,
  })

  const { data: lunchBreak } = useQuery({
    queryKey: ['lunch-break', employeeId, businessId],
    queryFn: async () => {
      if (!employeeId) return null
      const { data } = await supabase
        .from('business_employees')
        .select('lunch_break_start, lunch_break_end')
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)
        .single()
      return data
    },
    enabled: !!employeeId,
    ...QC.STABLE,
  })

  const { data: holiday } = useQuery({
    queryKey: ['public-holiday', dateStr],
    queryFn: async () => {
      const { data } = await supabase.from('public_holidays').select('name').eq('holiday_date', dateStr).limit(1).maybeSingle()
      return data
    },
    ...QC.STABLE,
  })

  const { data: employeeAbsent } = useQuery({
    queryKey: ['employee-absence', employeeId, dateStr],
    queryFn: async () => {
      if (!employeeId) return null
      const { data } = await supabase
        .from('employee_absences')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('status', 'approved')
        .lte('start_date', dateStr)
        .gte('end_date', dateStr)
        .limit(1)
        .maybeSingle()
      return data
    },
    enabled: !!employeeId,
    ...QC.FREQUENT,
  })

  const slots = location ? generateSlots(location.opens_at, location.closes_at) : []
  const now = new Date()

  const isSlotAvailable = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    const slotStart = new Date(date); slotStart.setHours(h, m, 0, 0)
    const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000)
    if (slotStart <= now) return false
    if (lunchBreak?.lunch_break_start && lunchBreak?.lunch_break_end) {
      const [lh, lm] = lunchBreak.lunch_break_start.split(':').map(Number)
      const [leh, lem] = lunchBreak.lunch_break_end.split(':').map(Number)
      const lunchStart = new Date(date); lunchStart.setHours(lh, lm, 0, 0)
      const lunchEnd = new Date(date); lunchEnd.setHours(leh, lem, 0, 0)
      if (slotStart < lunchEnd && slotEnd > lunchStart) return false
    }
    return !bookedSlots.some((b) => slotStart < b.end && slotEnd > b.start)
  }

  const hasBlockingCondition = !!holiday || !!employeeAbsent

  return (
    <ScrollView style={styles.flatList}>
      <TouchableOpacity
        style={[styles.datePicker, { backgroundColor: theme.card, borderColor: `${theme.primary}44` }]}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={theme.primary} />
        <Text style={[styles.datePickerText, { color: theme.text }]}>
          {date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={new Date()}
          onChange={(_, d) => {
            setShowPicker(false)
            if (d) { setDate(d); setSelectedTime(null) }
          }}
        />
      )}

      {holiday && (
        <View style={[styles.infoBanner, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)' }]}>
          <Ionicons name="flag-outline" size={16} color="#f59e0b" />
          <Text style={[styles.infoBannerText, { color: theme.text }]}>Festivo: {holiday.name}. No hay atención este día.</Text>
        </View>
      )}
      {!holiday && employeeAbsent && (
        <View style={[styles.infoBanner, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)' }]}>
          <Ionicons name="person-remove-outline" size={16} color="#f59e0b" />
          <Text style={[styles.infoBannerText, { color: theme.text }]}>El profesional no está disponible este día (ausencia aprobada).</Text>
        </View>
      )}

      {!hasBlockingCondition && (
        <>
          <Text style={[styles.slotTitle, { color: theme.text }]}>Horarios disponibles</Text>
          <View style={styles.slotsGrid}>
            {slots.length === 0 && <Text style={[styles.noSlots, { color: theme.textSecondary }]}>No hay horarios disponibles</Text>}
            {slots.map((slot) => {
              const available = isSlotAvailable(slot.time)
              const selected = selectedTime === slot.time
              return (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.slot,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    !available && { opacity: 0.3 },
                    selected && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  disabled={!available}
                  onPress={() => { setSelectedTime(slot.time); onSelect(date, slot.time) }}
                >
                  <Text style={[
                    styles.slotText,
                    { color: theme.text },
                    !available && { color: theme.textMuted },
                    selected && { color: '#fff' },
                  ]}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </>
      )}
    </ScrollView>
  )
}

function StepConfirm({
  data, onConfirm, onEdit, loading, theme,
}: {
  data: WizardData
  onConfirm: () => void
  onEdit: (step: Step) => void
  loading: boolean
  theme: ThemeColors
}) {
  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const confirmDate = data.date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const rows = [
    { label: 'Negocio', value: data.business?.name ?? '', step: 'business' as Step },
    { label: 'Servicio', value: data.service ? `${data.service.name} — ${formatCOP(data.service.price)}` : '', step: 'service' as Step },
    { label: 'Profesional', value: data.employee?.full_name ?? 'Cualquier profesional', step: 'employee' as Step },
    { label: 'Fecha y hora', value: `${confirmDate} · ${data.timeSlot}`, step: 'datetime' as Step },
  ]

  return (
    <ScrollView style={styles.flatList}>
      <Text style={[styles.confirmTitle, { color: theme.text }]}>Resumen de tu cita</Text>
      {rows.map((row) => (
        <View key={row.label} style={[styles.confirmRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.confirmLeft}>
            <Text style={[styles.confirmLabel, { color: theme.textSecondary }]}>{row.label}</Text>
            <Text style={[styles.confirmValue, { color: theme.text }]}>{row.value}</Text>
          </View>
          <TouchableOpacity onPress={() => onEdit(row.step)}>
            <Ionicons name="pencil-outline" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>
      ))}
      <Button title="Confirmar reserva" onPress={onConfirm} loading={loading} icon="checkmark-circle-outline" style={styles.confirmBtn} />
    </ScrollView>
  )
}

export default function BookingScreen() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const qc = useQueryClient()
  const route = useRoute<RouteProp<BookingRouteParams, 'Reservar'>>()
  const preselectedBusinessId = route.params?.preselectedBusinessId

  const [step, setStep] = useState<Step>('business')
  const [wizardData, setWizardData] = useState<WizardData>({
    business: null, service: null, employee: null, location: null,
    date: new Date(), timeSlot: null, notes: '',
  })

  // Pre-select business and skip to service step when coming from BusinessProfile
  useEffect(() => {
    if (!preselectedBusinessId) return
    supabase
      .from('businesses')
      .select('*')
      .eq('id', preselectedBusinessId)
      .single()
      .then(({ data }) => {
        if (data) {
          setWizardData((d) => ({ ...d, business: data as Business }))
          setStep('service')
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedBusinessId])

  const currentStepIdx = STEPS.findIndex((s) => s.key === step)

  const goNext = (nextStep: Step) => setStep(nextStep)
  const goBack = () => {
    const idx = STEPS.findIndex((s) => s.key === step)
    if (idx > 0) setStep(STEPS[idx - 1].key)
  }

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!wizardData.business || !wizardData.service || !wizardData.timeSlot) {
        throw new Error('Faltan datos de la reserva')
      }
      const [h, m] = wizardData.timeSlot.split(':').map(Number)
      const start = new Date(wizardData.date); start.setHours(h, m, 0, 0)
      const end = new Date(start.getTime() + wizardData.service.duration * 60000)

      const { error } = await supabase.from('appointments').insert({
        business_id: wizardData.business.id,
        client_id: user!.id,
        employee_id: wizardData.employee?.employee_id ?? null,
        service_id: wizardData.service.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'scheduled',
        price: wizardData.service.price,
        notes: wizardData.notes || null,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.MY_APPOINTMENTS(user?.id ?? '') })
      Alert.alert('¡Cita reservada!', 'Tu cita fue reservada exitosamente. Recibirás una confirmación en tu correo.', [
        { text: 'OK', onPress: () => { setStep('business'); setWizardData({ business: null, service: null, employee: null, location: null, date: new Date(), timeSlot: null, notes: '' }) } },
      ])
    },
    onError: (e: Error) => Alert.alert('Error al reservar', e.message),
  })

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.progress}>
        {STEPS.map((s, i) => {
          const reached = i <= currentStepIdx
          const completed = i < currentStepIdx
          return (
            <View key={s.key} style={styles.progressItem}>
              <View style={[
                styles.progressDot,
                { backgroundColor: theme.card, borderColor: theme.border },
                reached && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}>
                {completed ? (
                  <Ionicons name="checkmark" size={10} color="#fff" />
                ) : (
                  <Text style={[styles.progressNum, { color: reached ? '#fff' : theme.textMuted }]}>{i + 1}</Text>
                )}
              </View>
              {i < STEPS.length - 1 && (
                <View style={[
                  styles.progressLine,
                  { backgroundColor: theme.border },
                  i < currentStepIdx && { backgroundColor: theme.primary },
                ]} />
              )}
            </View>
          )
        })}
      </View>
      <Text style={[styles.stepLabel, { color: theme.text }]}>{STEPS[currentStepIdx]?.label}</Text>

      <View style={styles.stepContent}>
        {step === 'business' && (
          <StepBusiness theme={theme} onSelect={(b) => { setWizardData((d) => ({ ...d, business: b })); goNext('service') }} />
        )}
        {step === 'service' && wizardData.business && (
          <StepService theme={theme} businessId={wizardData.business.id} onSelect={(s) => { setWizardData((d) => ({ ...d, service: s })); goNext('employee') }} />
        )}
        {step === 'employee' && wizardData.business && (
          <StepEmployee
            theme={theme}
            businessId={wizardData.business.id}
            serviceId={wizardData.service?.id ?? ''}
            onSelect={(e) => { setWizardData((d) => ({ ...d, employee: e })); goNext('datetime') }}
            onSkip={() => { setWizardData((d) => ({ ...d, employee: null })); goNext('datetime') }}
          />
        )}
        {step === 'datetime' && (
          <StepDateTime
            theme={theme}
            businessId={wizardData.business?.id ?? ''}
            employeeId={wizardData.employee?.employee_id ?? null}
            serviceDuration={wizardData.service?.duration ?? 60}
            onSelect={(date, time) => setWizardData((d) => ({ ...d, date, timeSlot: time }))}
          />
        )}
        {step === 'confirm' && (
          <StepConfirm
            theme={theme}
            data={wizardData}
            onConfirm={() => bookMutation.mutate()}
            onEdit={(s) => setStep(s)}
            loading={bookMutation.isPending}
          />
        )}
      </View>

      <View style={[styles.nav, { borderTopColor: theme.border }]}>
        {step !== 'business' && (
          <Button title="Atrás" onPress={goBack} variant="secondary" style={styles.navBtn} icon="arrow-back-outline" />
        )}
        {step === 'datetime' && wizardData.timeSlot && (
          <Button title="Siguiente" onPress={() => goNext('confirm')} style={styles.navBtnFlex} icon="arrow-forward-outline" />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progress: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.base },
  progressItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressDot: { width: 24, height: 24, borderRadius: radius.full, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  progressNum: { fontSize: 10, fontWeight: '700' },
  progressLine: { flex: 1, height: 2, marginHorizontal: 2 },
  stepLabel: { fontSize: typography.lg, fontWeight: '700', paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  stepContent: { flex: 1 },
  stepContainer: { flex: 1 },
  flatList: { flex: 1, paddingHorizontal: spacing.base },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, marginVertical: spacing.sm, paddingHorizontal: spacing.sm, borderWidth: 1, gap: spacing.xs },
  searchInput: { flex: 1, fontSize: typography.base, paddingVertical: spacing.sm },
  selCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.sm, borderWidth: 1, gap: spacing.sm },
  bizIcon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  selInfo: { flex: 1 },
  selName: { fontSize: typography.base, fontWeight: '700' },
  selSub: { fontSize: typography.sm, marginTop: 2 },
  selDesc: { fontSize: typography.xs, marginTop: 2 },
  datePicker: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing.base, marginVertical: spacing.sm, borderWidth: 1, gap: spacing.sm },
  datePickerText: { flex: 1, fontSize: typography.base, fontWeight: '600' },
  slotTitle: { fontSize: typography.base, fontWeight: '600', marginVertical: spacing.sm },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radius.md, borderWidth: 1, padding: spacing.sm, marginVertical: spacing.sm },
  infoBannerText: { flex: 1, fontSize: typography.sm },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  noSlots: { fontSize: typography.sm },
  slot: { width: '30%', paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', borderWidth: 1 },
  slotText: { fontSize: typography.sm, fontWeight: '600' },
  confirmTitle: { fontSize: typography.xl, fontWeight: '700', marginBottom: spacing.base },
  confirmRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.sm, borderWidth: 1 },
  confirmLeft: { flex: 1 },
  confirmLabel: { fontSize: typography.sm },
  confirmValue: { fontSize: typography.base, fontWeight: '600', marginTop: 2 },
  confirmBtn: { marginTop: spacing.lg, marginBottom: spacing.xl },
  nav: { flexDirection: 'row', gap: spacing.sm, padding: spacing.base, borderTopWidth: 1 },
  navBtn: { flex: 1 },
  navBtnFlex: { flex: 2 },
  // Business grid
  bizGridRow: { gap: CARD_GAP, paddingHorizontal: spacing.base },
  bizGridContent: { paddingBottom: spacing.xl },
  bizCard: { width: CARD_W, height: CARD_H, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, marginBottom: CARD_GAP },
  bizCardImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bizCardNoBanner: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  bizCardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.42)' },
  bizCardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.sm },
  bizCardLogoRow: { marginBottom: 3 },
  bizCardName: { fontSize: 13, fontWeight: '700', color: '#fff', lineHeight: 15 },
  bizCardMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  bizCardRating: { fontSize: 11, color: '#fbbf24', fontWeight: '600', marginLeft: 2 },
  bizCardReviews: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  bizCardDot: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  bizCardSedes: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  // Filters
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1 },
  filterPillText: { fontSize: 12, fontWeight: '600' },
  filterInputGroup: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  filterInputLabel: { fontSize: 12 },
  filterInputField: { flex: 1, fontSize: 12, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.xs, paddingVertical: 4 },
})

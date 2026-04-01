import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { Business, Service, Location } from '../../types'
import { QUERY_KEYS as QK, QUERY_CONFIG as QC } from '../../lib/queryClient'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface EmployeeOption {
  id: string
  employee_id: string
  full_name: string
  avatar_url?: string
}

interface TimeSlot {
  time: string // "HH:MM"
  available: boolean
}

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Componentes de paso ─────────────────────────────────────────────────────

function StepBusiness({ onSelect }: { onSelect: (b: Business) => void }) {
  const [search, setSearch] = useState('')

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: QK.BUSINESS_SEARCH(search),
    queryFn: async () => {
      let q = supabase.from('businesses').select('*').eq('is_active', true).limit(20)
      if (search.trim()) q = q.ilike('name', `%${search.trim()}%`)
      const { data } = await q
      return (data ?? []) as Business[]
    },
    ...QC.STABLE,
  })

  return (
    <View style={styles.stepContainer}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Buscar negocio..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} autoCapitalize="none" />
      </View>
      {isLoading ? <LoadingSpinner /> : (
        <FlatList
          data={businesses}
          keyExtractor={(b) => b.id}
          style={styles.flatList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.selCard} onPress={() => onSelect(item)}>
              <View style={[styles.bizIcon, { backgroundColor: colors.primary + '22' }]}>
                <Ionicons name="business-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.selInfo}>
                <Text style={styles.selName}>{item.name}</Text>
                {item.address && <Text style={styles.selSub}>{item.address}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

function StepService({ businessId, onSelect }: { businessId: string; onSelect: (s: Service) => void }) {
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
        <TouchableOpacity style={styles.selCard} onPress={() => onSelect(item)}>
          <View style={styles.selInfo}>
            <Text style={styles.selName}>{item.name}</Text>
            <Text style={styles.selSub}>{item.duration} min · {formatCOP(item.price)}</Text>
            {item.description && <Text style={styles.selDesc} numberOfLines={1}>{item.description}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    />
  )
}

function StepEmployee({ businessId, serviceId, onSelect, onSkip }: { businessId: string; serviceId: string; onSelect: (e: EmployeeOption) => void; onSkip: () => void }) {
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
        <TouchableOpacity style={[styles.selCard, styles.anyOption]} onPress={onSkip}>
          <View style={[styles.bizIcon, { backgroundColor: colors.success + '22' }]}>
            <Ionicons name="shuffle-outline" size={22} color={colors.success} />
          </View>
          <View style={styles.selInfo}>
            <Text style={styles.selName}>Cualquier profesional</Text>
            <Text style={styles.selSub}>Asignación automática</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.selCard} onPress={() => onSelect(item)}>
          <Avatar name={item.full_name} uri={item.avatar_url} size={40} />
          <View style={styles.selInfo}>
            <Text style={styles.selName}>{item.full_name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    />
  )
}

function StepDateTime({
  businessId,
  employeeId,
  serviceDuration,
  onSelect,
}: {
  businessId: string
  employeeId: string | null
  serviceDuration: number
  onSelect: (date: Date, time: string) => void
}) {
  const [date, setDate] = useState(new Date())
  const [showPicker, setShowPicker] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const { data: location } = useQuery({
    queryKey: QK.LOCATIONS(businessId),
    queryFn: async () => {
      const { data } = await supabase.from('locations').select('opens_at, closes_at').eq('business_id', businessId).eq('is_active', true).limit(1).single()
      return data
    },
    ...QC.STABLE,
  })

  const { data: bookedSlots = [] } = useQuery({
    queryKey: QK.AVAILABLE_SLOTS(employeeId ?? businessId, date.toISOString().split('T')[0]),
    queryFn: async () => {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      let q = supabase.from('appointments').select('start_time, end_time').gte('start_time', dayStart.toISOString()).lte('start_time', dayEnd.toISOString()).in('status', ['scheduled', 'confirmed'])
      if (employeeId) q = q.eq('employee_id', employeeId)
      const { data } = await q
      return (data ?? []).map((a) => ({ start: new Date(a.start_time), end: new Date(a.end_time) }))
    },
    ...QC.FREQUENT,
  })

  const slots = location ? generateSlots(location.opens_at, location.closes_at) : []
  const now = new Date()

  const isSlotAvailable = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    const slotStart = new Date(date)
    slotStart.setHours(h, m, 0, 0)
    const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000)

    if (slotStart <= now) return false

    return !bookedSlots.some(
      (b) => slotStart < b.end && slotEnd > b.start
    )
  }

  return (
    <ScrollView style={styles.flatList}>
      <TouchableOpacity style={styles.datePicker} onPress={() => setShowPicker(true)}>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        <Text style={styles.datePickerText}>
          {date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={new Date()}
          onChange={(_, d) => { setShowPicker(false); if (d) setDate(d) }}
        />
      )}

      <Text style={styles.slotTitle}>Horarios disponibles</Text>
      <View style={styles.slotsGrid}>
        {slots.length === 0 && <Text style={styles.noSlots}>No hay horarios disponibles</Text>}
        {slots.map((slot) => {
          const available = isSlotAvailable(slot.time)
          return (
            <TouchableOpacity
              key={slot.time}
              style={[styles.slot, !available && styles.slotUnavail, selectedTime === slot.time && styles.slotSelected]}
              disabled={!available}
              onPress={() => { setSelectedTime(slot.time); onSelect(date, slot.time) }}
            >
              <Text style={[styles.slotText, !available && styles.slotTextUnavail, selectedTime === slot.time && styles.slotTextSelected]}>
                {slot.time}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </ScrollView>
  )
}

function StepConfirm({
  data,
  onConfirm,
  onEdit,
  loading,
}: {
  data: WizardData
  onConfirm: () => void
  onEdit: (step: Step) => void
  loading: boolean
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
      <Text style={styles.confirmTitle}>Resumen de tu cita</Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.confirmRow}>
          <View style={styles.confirmLeft}>
            <Text style={styles.confirmLabel}>{row.label}</Text>
            <Text style={styles.confirmValue}>{row.value}</Text>
          </View>
          <TouchableOpacity onPress={() => onEdit(row.step)}>
            <Ionicons name="pencil-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ))}
      <Button title="Confirmar reserva" onPress={onConfirm} loading={loading} icon="checkmark-circle-outline" style={styles.confirmBtn} />
    </ScrollView>
  )
}

// ─── Wizard principal ────────────────────────────────────────────────────────

export default function BookingScreen() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [step, setStep] = useState<Step>('business')
  const [wizardData, setWizardData] = useState<WizardData>({
    business: null, service: null, employee: null, location: null,
    date: new Date(), timeSlot: null, notes: '',
  })

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
      const start = new Date(wizardData.date)
      start.setHours(h, m, 0, 0)
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
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View key={s.key} style={styles.progressItem}>
            <View style={[styles.progressDot, i <= currentStepIdx && styles.progressDotActive]}>
              {i < currentStepIdx ? (
                <Ionicons name="checkmark" size={10} color={colors.text} />
              ) : (
                <Text style={styles.progressNum}>{i + 1}</Text>
              )}
            </View>
            {i < STEPS.length - 1 && <View style={[styles.progressLine, i < currentStepIdx && styles.progressLineActive]} />}
          </View>
        ))}
      </View>
      <Text style={styles.stepLabel}>{STEPS[currentStepIdx]?.label}</Text>

      {/* Steps */}
      <View style={styles.stepContent}>
        {step === 'business' && (
          <StepBusiness onSelect={(b) => { setWizardData((d) => ({ ...d, business: b })); goNext('service') }} />
        )}
        {step === 'service' && wizardData.business && (
          <StepService businessId={wizardData.business.id} onSelect={(s) => { setWizardData((d) => ({ ...d, service: s })); goNext('employee') }} />
        )}
        {step === 'employee' && wizardData.business && (
          <StepEmployee
            businessId={wizardData.business.id}
            serviceId={wizardData.service?.id ?? ''}
            onSelect={(e) => { setWizardData((d) => ({ ...d, employee: e })); goNext('datetime') }}
            onSkip={() => { setWizardData((d) => ({ ...d, employee: null })); goNext('datetime') }}
          />
        )}
        {step === 'datetime' && (
          <StepDateTime
            businessId={wizardData.business?.id ?? ''}
            employeeId={wizardData.employee?.employee_id ?? null}
            serviceDuration={wizardData.service?.duration ?? 60}
            onSelect={(date, time) => setWizardData((d) => ({ ...d, date, timeSlot: time }))}
          />
        )}
        {step === 'confirm' && (
          <StepConfirm
            data={wizardData}
            onConfirm={() => bookMutation.mutate()}
            onEdit={(s) => setStep(s)}
            loading={bookMutation.isPending}
          />
        )}
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
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

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  progress: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.base },
  progressItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressDot: { width: 24, height: 24, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  progressDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  progressNum: { fontSize: 10, color: colors.textMuted, fontWeight: '700' },
  progressLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 2 },
  progressLineActive: { backgroundColor: colors.primary },
  stepLabel: { fontSize: typography.lg, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  stepContent: { flex: 1 },
  stepContainer: { flex: 1 },
  flatList: { flex: 1, paddingHorizontal: spacing.base },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, marginVertical: spacing.sm, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  searchInput: { flex: 1, color: colors.text, fontSize: typography.base, paddingVertical: spacing.sm },
  selCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder, gap: spacing.sm },
  anyOption: { borderColor: colors.success + '44' },
  bizIcon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  selInfo: { flex: 1 },
  selName: { fontSize: typography.base, fontWeight: '700', color: colors.text },
  selSub: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  selDesc: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  datePicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, marginVertical: spacing.sm, borderWidth: 1, borderColor: colors.primary + '44', gap: spacing.sm },
  datePickerText: { flex: 1, fontSize: typography.base, fontWeight: '600', color: colors.text },
  slotTitle: { fontSize: typography.base, fontWeight: '600', color: colors.text, marginVertical: spacing.sm },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  noSlots: { color: colors.textSecondary, fontSize: typography.sm },
  slot: { width: '30%', paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  slotUnavail: { opacity: 0.3 },
  slotSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: typography.sm, fontWeight: '600', color: colors.text },
  slotTextUnavail: { color: colors.textMuted },
  slotTextSelected: { color: colors.text },
  confirmTitle: { fontSize: typography.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.base },
  confirmRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  confirmLeft: { flex: 1 },
  confirmLabel: { fontSize: typography.sm, color: colors.textSecondary },
  confirmValue: { fontSize: typography.base, fontWeight: '600', color: colors.text, marginTop: 2 },
  confirmBtn: { marginTop: spacing.lg, marginBottom: spacing.xl },
  nav: { flexDirection: 'row', gap: spacing.sm, padding: spacing.base, borderTopWidth: 1, borderTopColor: colors.border },
  navBtn: { flex: 1 },
  navBtnFlex: { flex: 2 },
})

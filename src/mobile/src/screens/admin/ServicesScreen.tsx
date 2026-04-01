import React, { useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, RefreshControl, Switch, Alert,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Service } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

async function fetchServices(businessId: string): Promise<Service[]> {
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .order('name')
  return (data ?? []) as Service[]
}

interface ServiceForm {
  name: string
  description: string
  price: string
  duration: string
  is_active: boolean
}

const emptyForm: ServiceForm = { name: '', description: '', price: '', duration: '60', is_active: true }

export default function ServicesScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const qc = useQueryClient()
  const [modalVisible, setModalVisible] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [form, setForm] = useState<ServiceForm>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: services = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.SERVICES(activeBusiness ?? ''),
    queryFn: () => fetchServices(activeBusiness!),
    enabled: !!activeBusiness,
    ...QUERY_CONFIG.STABLE,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('El nombre es requerido')
      const price = parseFloat(form.price)
      const duration = parseInt(form.duration, 10)
      if (isNaN(price) || price < 0) throw new Error('Precio inválido')
      if (isNaN(duration) || duration <= 0) throw new Error('Duración inválida')

      const payload = {
        business_id: activeBusiness!,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        duration,
        is_active: form.is_active,
      }

      if (editService) {
        await supabase.from('services').update(payload).eq('id', editService.id)
      } else {
        await supabase.from('services').insert(payload)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SERVICES(activeBusiness ?? '') })
      closeModal()
    },
    onError: (e: Error) => setFormError(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('services').update({ is_active: false }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.SERVICES(activeBusiness ?? '') }),
  })

  const openCreate = () => {
    setEditService(null)
    setForm(emptyForm)
    setFormError(null)
    setModalVisible(true)
  }

  const openEdit = (s: Service) => {
    setEditService(s)
    setForm({ name: s.name, description: s.description ?? '', price: String(s.price), duration: String(s.duration), is_active: s.is_active })
    setFormError(null)
    setModalVisible(true)
  }

  const closeModal = () => { setModalVisible(false); setEditService(null); setForm(emptyForm) }

  const confirmDelete = (s: Service) => {
    Alert.alert('Desactivar servicio', `¿Desactivar "${s.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desactivar', style: 'destructive', onPress: () => deleteMutation.mutate(s.id) },
    ])
  }

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen>
      <FlatList
        data={services}
        keyExtractor={(s) => s.id}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={[styles.list, services.length === 0 && { flex: 1 }]}
        ListHeaderComponent={
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addBtnText}>Agregar servicio</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <EmptyState icon="briefcase-outline" title="Sin servicios" message="Agrega tu primer servicio" action={{ label: 'Agregar', onPress: openCreate }} />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_active && styles.cardInactive]}>
            <View style={styles.cardInfo}>
              <Text style={styles.serviceName}>{item.name}</Text>
              {item.description && <Text style={styles.serviceDesc} numberOfLines={1}>{item.description}</Text>}
              <View style={styles.metaRow}>
                <Text style={styles.price}>{formatCOP(item.price)}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.duration}>{item.duration} min</Text>
                {!item.is_active && <Text style={styles.inactive}>Inactivo</Text>}
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editService ? 'Editar servicio' : 'Nuevo servicio'}</Text>
            <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          {formError && <View style={styles.errorBox}><Text style={styles.errorText}>{formError}</Text></View>}
          <Input label="Nombre *" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Corte de cabello" />
          <Input label="Descripción" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Descripción opcional..." />
          <Input label="Precio (COP) *" value={form.price} onChangeText={(v) => setForm((f) => ({ ...f, price: v }))} keyboardType="numeric" placeholder="50000" />
          <Input label="Duración (minutos) *" value={form.duration} onChangeText={(v) => setForm((f) => ({ ...f, duration: v }))} keyboardType="numeric" placeholder="60" />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Servicio activo</Text>
            <Switch value={form.is_active} onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))} trackColor={{ true: colors.primary }} />
          </View>
          <Button title={editService ? 'Guardar cambios' : 'Crear servicio'} onPress={() => saveMutation.mutate()} loading={saveMutation.isPending} style={styles.saveBtn} />
        </View>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { padding: spacing.base, gap: spacing.sm },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.primary, marginBottom: spacing.sm },
  addBtnText: { color: colors.primary, fontWeight: '600', fontSize: typography.base },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  cardInactive: { opacity: 0.5 },
  cardInfo: { flex: 1 },
  serviceName: { fontSize: typography.base, fontWeight: '700', color: colors.text },
  serviceDesc: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
  price: { fontSize: typography.sm, color: colors.success, fontWeight: '600' },
  dot: { color: colors.textMuted },
  duration: { fontSize: typography.sm, color: colors.textSecondary },
  inactive: { fontSize: typography.xs, color: colors.error, marginLeft: spacing.xs },
  cardActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: { padding: spacing.xs },
  modal: { flex: 1, backgroundColor: colors.background, padding: spacing.base },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: typography.xl, fontWeight: '700', color: colors.text },
  errorBox: { backgroundColor: '#450a0a', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  errorText: { color: '#f87171', fontSize: typography.sm },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.sm },
  switchLabel: { color: colors.text, fontSize: typography.base },
  saveBtn: { marginTop: spacing.lg },
})

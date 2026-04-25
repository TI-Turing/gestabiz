import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery } from '@tanstack/react-query'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { UserRole, UserRoleAssignment } from '../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../lib/queryClient'

// TEMP (Abr 2026): App móvil en fase de lanzamiento client-only.
// Este hook se mantiene intacto porque varias pantallas admin/employee dormidas
// dependen de él. NO debe usarse `switchRole` en UI mientras la app sea client-only.
// Cuando se reactive multi-rol, restaurar la ramificación en App.tsx > AppNavigator.

interface UseUserRolesResult {
  roles: UserRoleAssignment[]
  activeRole: UserRole
  activeBusiness: string | null
  switchRole: (role: UserRole, businessId: string | null) => Promise<void>
  isLoading: boolean
}

interface PersistedRoleState {
  activeRole: UserRole
  activeBusiness: string | null
}

function storageKey(userId: string) {
  return `gestabiz-role-${userId}`
}

async function fetchRoles(userId: string): Promise<UserRoleAssignment[]> {
  const roles: UserRoleAssignment[] = []

  // 1. Negocios donde el usuario es dueño → rol admin
  const { data: ownedBusinesses } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', userId)
    .eq('is_active', true)

  if (ownedBusinesses) {
    for (const biz of ownedBusinesses) {
      roles.push({
        id: `admin-${biz.id}`,
        user_id: userId,
        role: 'admin',
        business_id: biz.id,
        business_name: biz.name,
        is_active: true,
      })
    }
  }

  // 2. Negocios donde es empleado aprobado → rol employee
  const { data: employeeRecords } = await supabase
    .from('business_employees')
    .select('id, business_id, businesses(name)')
    .eq('employee_id', userId)
    .eq('status', 'approved')
    .eq('is_active', true)

  if (employeeRecords) {
    for (const rec of employeeRecords) {
      // Evitar duplicar si ya es admin de ese negocio (owner)
      const alreadyAdmin = roles.some(
        (r) => r.role === 'admin' && r.business_id === rec.business_id
      )
      if (!alreadyAdmin) {
        const bizData = rec.businesses as unknown as { name: string } | null
        roles.push({
          id: `employee-${rec.business_id}`,
          user_id: userId,
          role: 'employee',
          business_id: rec.business_id,
          business_name: bizData?.name,
          is_active: true,
        })
      }
    }
  }

  // 3. Siempre tiene rol cliente
  roles.push({
    id: `client-${userId}`,
    user_id: userId,
    role: 'client',
    business_id: null,
    is_active: true,
  })

  return roles
}

export function useUserRoles(user: User | null): UseUserRolesResult {
  const [activeRole, setActiveRole] = useState<UserRole>('client')
  const [activeBusiness, setActiveBusiness] = useState<string | null>(null)
  const [stateLoaded, setStateLoaded] = useState(false)

  const { data: roles = [], isLoading: queryLoading } = useQuery({
    queryKey: QUERY_KEYS.USER_ROLES(user?.id ?? ''),
    queryFn: () => fetchRoles(user!.id),
    enabled: !!user,
    ...QUERY_CONFIG.STABLE,
  })

  // Cargar estado persistido desde AsyncStorage
  useEffect(() => {
    if (!user) {
      setStateLoaded(true)
      return
    }

    AsyncStorage.getItem(storageKey(user.id))
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as PersistedRoleState
          setActiveRole(parsed.activeRole)
          setActiveBusiness(parsed.activeBusiness)
        }
      })
      .catch(() => {
        // Si falla la lectura, usar defaults
      })
      .finally(() => setStateLoaded(true))
  }, [user])

  // Cuando los roles cargan, validar que el rol activo persitido siga siendo válido
  useEffect(() => {
    if (!stateLoaded || roles.length === 0) return

    const match = roles.find(
      (r) => r.role === activeRole && r.business_id === activeBusiness
    )

    if (!match) {
      // El rol persitido ya no es válido — usar el primero disponible
      const first = roles[0]
      setActiveRole(first.role)
      setActiveBusiness(first.business_id)
    }
  }, [roles, stateLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  const switchRole = useCallback(
    async (role: UserRole, businessId: string | null) => {
      setActiveRole(role)
      setActiveBusiness(businessId)
      if (user) {
        const state: PersistedRoleState = { activeRole: role, activeBusiness: businessId }
        await AsyncStorage.setItem(storageKey(user.id), JSON.stringify(state))
      }
    },
    [user]
  )

  return {
    roles,
    activeRole,
    activeBusiness,
    switchRole,
    isLoading: queryLoading || !stateLoaded,
  }
}

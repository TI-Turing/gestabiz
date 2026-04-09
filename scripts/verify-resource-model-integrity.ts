/**
 * Script de Verificación de Integridad del Sistema de Modelo de Negocio Flexible
 * 
 * Ejecutar: npx tsx scripts/verify-resource-model-integrity.ts
 * 
 * Verifica:
 * 1. Todos los negocios tienen resource_model definido
 * 2. CHECK constraint de appointments (employee_id XOR resource_id)
 * 3. Integridad referencial de resource_id
 * 4. Integridad referencial de location_id en recursos
 * 
 * Fecha: 21 de Octubre de 2025
 */

import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface VerificationResult {
  passed: boolean
  warnings: string[]
  errors: string[]
  info: string[]
}

async function verifyResourceModelIntegrity(): Promise<VerificationResult> {
  const result: VerificationResult = {
    passed: true,
    warnings: [],
    errors: [],
    info: [],
  }  // ===== 1. Verificar que todos los negocios tengan resource_model =====  const { data: businessesWithoutModel, error: businessError } = await supabase
    .from('businesses')
    .select('id, name')
    .is('resource_model', null)

  if (businessError) {
    result.errors.push(`Error al consultar negocios: ${businessError.message}`)
    result.passed = false
  } else if (businessesWithoutModel && businessesWithoutModel.length > 0) {
    result.warnings.push(`${businessesWithoutModel.length} negocios sin resource_model definido`)    // Actualizar automáticamente a 'professional'
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ resource_model: 'professional' })
      .is('resource_model', null)

    if (updateError) {
      result.errors.push(`Error al actualizar negocios: ${updateError.message}`)
      result.passed = false
    } else {
      result.info.push(`✓ ${businessesWithoutModel.length} negocios actualizados a 'professional'`)    }
  } else {
    result.info.push('✓ Todos los negocios tienen resource_model definido')  }

  // ===== 2. Verificar CHECK constraint (employee_id XOR resource_id) =====  const { data: invalidAppointments, error: appointmentError } = await supabase
    .from('appointments')
    .select('id, employee_id, resource_id')
    .not('employee_id', 'is', null)
    .not('resource_id', 'is', null)

  if (appointmentError) {
    result.errors.push(`Error al consultar appointments: ${appointmentError.message}`)
    result.passed = false
  } else if (invalidAppointments && invalidAppointments.length > 0) {
    result.errors.push(`${invalidAppointments.length} appointments violan CHECK constraint (tienen employee_id Y resource_id)`)
    result.passed = false    invalidAppointments.slice(0, 5).forEach(apt => {    })
    if (invalidAppointments.length > 5) {    }
  } else {
    result.info.push('✓ CHECK constraint cumplido en todos los appointments')  }

  // ===== 3. Verificar integridad referencial de resource_id =====  const { data: appointmentsWithResource } = await supabase
    .from('appointments')
    .select('id, resource_id')
    .not('resource_id', 'is', null)

  if (appointmentsWithResource && appointmentsWithResource.length > 0) {
    const resourceIds = appointmentsWithResource.map(a => a.resource_id)
    const { data: existingResources } = await supabase
      .from('business_resources')
      .select('id')
      .in('id', resourceIds)

    const existingResourceIds = new Set(existingResources?.map(r => r.id) || [])
    const orphanAppointments = appointmentsWithResource.filter(
      apt => !existingResourceIds.has(apt.resource_id!)
    )

    if (orphanAppointments.length > 0) {
      result.errors.push(`${orphanAppointments.length} appointments con resource_id inválido`)
      result.passed = false      orphanAppointments.slice(0, 5).forEach(apt => {      })
    } else {
      result.info.push('✓ Todos los resource_id son válidos')    }
  } else {
    result.info.push('ℹ️  No hay appointments con resource_id')  }

  // ===== 4. Verificar integridad referencial de location_id en recursos =====  const { data: resourcesWithLocation } = await supabase
    .from('business_resources')
    .select('id, location_id')
    .not('location_id', 'is', null)

  if (resourcesWithLocation && resourcesWithLocation.length > 0) {
    const locationIds = resourcesWithLocation.map(r => r.location_id)
    const { data: existingLocations } = await supabase
      .from('locations')
      .select('id')
      .in('id', locationIds)

    const existingLocationIds = new Set(existingLocations?.map(l => l.id) || [])
    const orphanResources = resourcesWithLocation.filter(
      res => !existingLocationIds.has(res.location_id!)
    )

    if (orphanResources.length > 0) {
      result.warnings.push(`${orphanResources.length} recursos con location_id inválido`)      orphanResources.slice(0, 5).forEach(res => {      })
    } else {
      result.info.push('✓ Todos los location_id en recursos son válidos')    }
  } else {
    result.info.push('ℹ️  No hay recursos con location_id')  }

  // ===== 5. Estadísticas del sistema =====  const { count: totalBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })

  const { count: professionalBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('resource_model', 'professional')

  const { count: resourceBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('resource_model', 'physical_resource')

  const { count: hybridBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('resource_model', 'hybrid')

  const { count: groupClassBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('resource_model', 'group_class')

  const { count: totalResources } = await supabase
    .from('business_resources')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: appointmentsWithEmployee } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .not('employee_id', 'is', null)

  const { count: appointmentsWithResource } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .not('resource_id', 'is', null)  
    return result
}

// Ejecutar verificación
async function main() {
  try {
    const result = await verifyResourceModelIntegrity()

        

    if (result.info.length > 0) {      result.info.forEach(info => )
    }

    if (result.warnings.length > 0) {      result.warnings.forEach(warning => )
    }

    if (result.errors.length > 0) {      result.errors.forEach(error => )
    }

    if (result.passed) {    } else {      process.exit(1)
    }

  } catch (error) {    process.exit(1)
  }
}

main()

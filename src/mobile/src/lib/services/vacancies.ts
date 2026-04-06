import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'

export interface Vacancy {
  id: string
  business_id: string
  location_id?: string | null
  title: string
  description?: string | null
  salary_min?: number | null
  salary_max?: number | null
  commission_based?: boolean | null
  requirements?: string[] | null
  employment_type?: EmploymentType | null
  is_active: boolean
  applications_count?: number
  created_at: string
}

export type VacancyCreate = Omit<Vacancy, 'id' | 'applications_count' | 'created_at'>
export type VacancyUpdate = Partial<Omit<Vacancy, 'id' | 'business_id' | 'applications_count' | 'created_at'>>

export interface VacancyQuery {
  businessId?: string
  activeOnly?: boolean
  limit?: number
  offset?: number
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const vacanciesService = {
  async list(query: VacancyQuery = {}): Promise<Vacancy[]> {
    const { businessId, activeOnly = false, limit = 50, offset = 0 } = query

    let q = supabase
      .from('job_vacancies')
      .select('id, business_id, location_id, title, description, salary_min, salary_max, commission_based, requirements, employment_type, is_active, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (businessId) q = q.eq('business_id', businessId)
    if (activeOnly) q = q.eq('is_active', true)

    const { data, error } = await q
    throwIfError(error, 'LIST_VACANCIES', 'No se pudieron cargar las vacantes')
    return (data ?? []) as Vacancy[]
  },

  async get(id: string): Promise<Vacancy | null> {
    const { data, error } = await supabase
      .from('job_vacancies')
      .select('id, business_id, location_id, title, description, salary_min, salary_max, commission_based, requirements, employment_type, is_active, created_at')
      .eq('id', id)
      .maybeSingle()
    throwIfError(error, 'GET_VACANCY', 'No se pudo obtener la vacante')
    return data as Vacancy | null
  },

  async create(payload: VacancyCreate): Promise<Vacancy> {
    const { data, error } = await supabase
      .from('job_vacancies')
      .insert(payload)
      .select()
      .single()
    throwIfError(error, 'CREATE_VACANCY', 'No se pudo crear la vacante')
    return data as Vacancy
  },

  async update(id: string, updates: VacancyUpdate): Promise<Vacancy> {
    const { data, error } = await supabase
      .from('job_vacancies')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    throwIfError(error, 'UPDATE_VACANCY', 'No se pudo actualizar la vacante')
    return data as Vacancy
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('job_vacancies')
      .delete()
      .eq('id', id)
    throwIfError(error, 'DELETE_VACANCY', 'No se pudo eliminar la vacante')
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('job_vacancies')
      .update({ is_active: isActive })
      .eq('id', id)
    throwIfError(error, 'TOGGLE_VACANCY', 'No se pudo cambiar el estado de la vacante')
  },
}

import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReviewType = 'business' | 'employee'

export interface Review {
  id: string
  business_id?: string | null
  employee_id?: string | null
  client_id: string
  appointment_id?: string | null
  rating: number
  comment?: string | null
  business_response?: string | null
  responded_at?: string | null
  is_visible: boolean
  review_type: ReviewType
  created_at: string
}

export type ReviewCreate = {
  business_id?: string
  employee_id?: string
  client_id: string
  appointment_id?: string
  rating: number
  comment?: string
  review_type: ReviewType
}

export interface ReviewQuery {
  businessId?: string
  employeeId?: string
  clientId?: string
  reviewType?: ReviewType
  visibleOnly?: boolean
  limit?: number
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const reviewsService = {
  async list(query: ReviewQuery = {}): Promise<Review[]> {
    const { businessId, employeeId, clientId, reviewType, visibleOnly = false, limit = 50 } = query

    let q = supabase
      .from('reviews')
      .select('id, business_id, employee_id, client_id, appointment_id, rating, comment, business_response, responded_at, is_visible, review_type, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (businessId) q = q.eq('business_id', businessId)
    if (employeeId) q = q.eq('employee_id', employeeId)
    if (clientId) q = q.eq('client_id', clientId)
    if (reviewType) q = q.eq('review_type', reviewType)
    if (visibleOnly) q = q.eq('is_visible', true)

    const { data, error } = await q
    throwIfError(error, 'LIST_REVIEWS', 'No se pudieron cargar las reseñas')
    return (data ?? []) as Review[]
  },

  async get(id: string): Promise<Review | null> {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, business_id, employee_id, client_id, appointment_id, rating, comment, business_response, responded_at, is_visible, review_type, created_at')
      .eq('id', id)
      .maybeSingle()
    throwIfError(error, 'GET_REVIEW', 'No se pudo obtener la reseña')
    return data as Review | null
  },

  async create(payload: ReviewCreate): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .insert({ ...payload, is_visible: true })
      .select()
      .single()
    throwIfError(error, 'CREATE_REVIEW', 'No se pudo crear la reseña')
    return data as Review
  },

  async respond(id: string, response: string): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .update({ business_response: response, responded_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    throwIfError(error, 'RESPOND_REVIEW', 'No se pudo responder la reseña')
    return data as Review
  },

  async toggleVisibility(id: string, isVisible: boolean): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .update({ is_visible: isVisible })
      .eq('id', id)
    throwIfError(error, 'TOGGLE_REVIEW_VISIBILITY', 'No se pudo cambiar la visibilidad de la reseña')
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
    throwIfError(error, 'DELETE_REVIEW', 'No se pudo eliminar la reseña')
  },
}

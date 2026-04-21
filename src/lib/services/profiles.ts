import * as Sentry from '@sentry/react'
import supabase from '@/lib/supabase'
import type { User } from '@/types'
import type { Json } from '@/types/database'

export interface ProfileSummary {
  id: string
  full_name: string | null
  email: string
  phone: string | null
}

export const profilesService = {
  async findByPhone(phone: string): Promise<ProfileSummary | null> {
    const cleaned = phone.replace(/\s+/g, '').trim()
    if (!cleaned) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('phone', cleaned)
      .limit(1)
      .maybeSingle()
    if (error) {
      Sentry.captureException(error, { tags: { service: 'profiles', operation: 'findByPhone' } })
      return null
    }
    return data as ProfileSummary | null
  },

  async findByEmail(email: string): Promise<ProfileSummary | null> {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('email', trimmed)
      .limit(1)
      .maybeSingle()
    if (error) {
      Sentry.captureException(error, { tags: { service: 'profiles', operation: 'findByEmail' } })
      return null
    }
    return data as ProfileSummary | null
  },

  async get(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error) {
      Sentry.captureException(error, { tags: { service: 'profiles', operation: 'get' }, extra: { userId: id } })
      throw error
    }
    if (!data) return null
    const settings = (data.settings as Json) as unknown as { language?: 'es' | 'en' } | null
    return {
      id: data.id,
      email: data.email,
      name: data.full_name || '',
      avatar_url: data.avatar_url || undefined,
      roles: [{
        id: 'legacy-role-profiles-service',
        user_id: data.id,
        role: data.role,
        business_id: null,
        is_active: true,
        created_at: data.created_at
      }],
      activeRole: data.role,
      role: data.role, // Legacy support
      phone: data.phone || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_active: data.is_active,
      language: settings?.language || 'es',
      notification_preferences: {
        email: true, push: true, browser: true, whatsapp: false,
        reminder_24h: true, reminder_1h: true, reminder_15m: false,
        daily_digest: false, weekly_report: false
      },
      permissions: [],
      timezone: 'America/Bogota'
    }
  }
}

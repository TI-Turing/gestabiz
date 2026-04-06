import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name?: string | null
  phone?: string | null
  avatar_url?: string | null
  role?: string | null
  is_active?: boolean
  created_at: string
  updated_at?: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const profilesService = {
  async get(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at')
      .eq('id', id)
      .single()
    throwIfError(error, 'GET_PROFILE', 'No se pudo cargar el perfil')
    return data as Profile | null
  },

  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    throwIfError(error, 'UPDATE_PROFILE', 'No se pudo actualizar el perfil')
    return data as Profile
  },

  async uploadAvatar(userId: string, uri: string): Promise<string> {
    // Convert local URI to Blob
    const response = await fetch(uri)
    const blob = await response.blob()
    const ext = uri.split('.').pop() ?? 'jpg'
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { upsert: true })
    throwIfError(uploadError, 'UPLOAD_AVATAR', 'No se pudo subir el avatar')

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  },
}

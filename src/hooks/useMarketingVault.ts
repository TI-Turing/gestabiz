import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MarketingVaultFolder, MarketingVaultFile } from '@/types/types'

const BUCKET = 'business-marketing-vault'
// TTL para listados (1 hora, suficiente para thumbnails)
const SIGNED_URL_EXPIRY_LIST = 3600
// TTL para adjuntos en chat (7 días)
export const SIGNED_URL_EXPIRY_CHAT = 604800

type PendingEntry = { folderId: number; fileIdx: number; path: string }

async function listVaultFolders(businessId: string): Promise<MarketingVaultFolder[]> {
  // Lista carpetas de primer nivel en {businessId}/
  const { data: topLevel, error } = await supabase.storage
    .from(BUCKET)
    .list(businessId, { limit: 100, sortBy: { column: 'name', order: 'asc' } })

  if (error) throw error

  const folders: MarketingVaultFolder[] = []
  const pending: PendingEntry[] = []

  for (const item of topLevel || []) {
    // Si no tiene metadata, asumimos que es carpeta
    if (!item.metadata) {
      const { data: files, error: filesError } = await supabase.storage
        .from(BUCKET)
        .list(`${businessId}/${item.name}`, {
          limit: 200,
          sortBy: { column: 'name', order: 'asc' },
        })

      if (filesError) continue

      // Excluir archivos .keep (marcadores de carpeta vacía)
      const realFiles = (files || []).filter(f => f.metadata && f.name !== '.keep')

      const folderId = folders.length
      const enrichedFiles: MarketingVaultFile[] = []

      for (const f of realFiles) {
        const ext = f.name.split('.').pop()?.toLowerCase() || ''
        const filePath = `${businessId}/${item.name}/${f.name}`
        const fileIdx = enrichedFiles.length
        enrichedFiles.push({
          name: f.name,
          id: f.id,
          updated_at: f.updated_at,
          created_at: f.created_at,
          last_accessed_at: f.last_accessed_at,
          metadata: f.metadata as Record<string, unknown>,
          path: filePath,
          isImage: ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext),
        })
        pending.push({ folderId, fileIdx, path: filePath })
      }

      folders.push({ name: item.name, files: enrichedFiles })
    } else {
      // Archivo en raíz (sin carpeta) — excluir .keep
      if (item.name === '.keep') continue
      const ext = item.name.split('.').pop()?.toLowerCase() || ''
      let rootFolderIdx = folders.findIndex(f => f.name === '')
      if (rootFolderIdx === -1) {
        rootFolderIdx = folders.length
        folders.push({ name: '', files: [] })
      }
      const filePath = `${businessId}/${item.name}`
      const fileIdx = folders[rootFolderIdx].files.length
      folders[rootFolderIdx].files.push({
        name: item.name,
        id: item.id,
        updated_at: item.updated_at,
        created_at: item.created_at,
        last_accessed_at: item.last_accessed_at,
        path: filePath,
        isImage: ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext),
      })
      pending.push({ folderId: rootFolderIdx, fileIdx, path: filePath })
    }
  }

  // Batch-generate signed URLs en una sola llamada (bucket privado requiere URLs firmadas)
  if (pending.length > 0) {
    const { data: signedData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(pending.map(p => p.path), SIGNED_URL_EXPIRY_LIST)

    if (signedData) {
      signedData.forEach((entry, i) => {
        const { folderId, fileIdx } = pending[i]
        if (entry.signedUrl) {
          folders[folderId].files[fileIdx].url = entry.signedUrl
        }
      })
    }
  }

  return folders
}

export function useMarketingVault(businessId: string | undefined) {
  return useQuery({
    queryKey: ['marketing-vault', businessId],
    queryFn: () => listVaultFolders(businessId!),
    enabled: !!businessId,
    staleTime: 2 * 60 * 1000,
    retry: false,
  })
}

// ---------------------------------------------------------------------------
// Mutaciones
// ---------------------------------------------------------------------------

interface UploadAssetParams {
  folder: string
  file: File
}

/**
 * Sube un archivo al vault del negocio.
 * Ruta: {businessId}/{folder}/{timestamp}_{sanitized_name}
 */
export function useUploadMarketingAsset(businessId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ folder, file }: UploadAssetParams) => {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${businessId}/${folder}/${Date.now()}_${sanitizedName}`

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false })

      if (error) throw error

      return path
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-vault', businessId] })
    },
  })
}

/**
 * Elimina un archivo del vault por su path completo.
 */
export function useDeleteMarketingAsset(businessId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (path: string) => {
      const { error } = await supabase.storage
        .from(BUCKET)
        .remove([path])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-vault', businessId] })
    },
  })
}

/**
 * Crea una carpeta virtual subiendo un archivo .keep vacío.
 */
export function useCreateMarketingFolder(businessId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (folderName: string) => {
      const sanitizedFolder = folderName.trim().replace(/[^a-zA-Z0-9 _-]/g, '_')
      const path = `${businessId}/${sanitizedFolder}/.keep`

      const emptyBlob = new Blob([], { type: 'text/plain' })

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, emptyBlob, { upsert: true })

      if (error) throw error

      return sanitizedFolder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-vault', businessId] })
    },
  })
}

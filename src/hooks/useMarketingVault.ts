import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MarketingVaultFolder, MarketingVaultFile } from '@/types/types'

const BUCKET = 'business-marketing-vault'
// Signed URL expiry: 1 hour — well beyond the 2-minute query staleTime
const SIGNED_URL_EXPIRY_SECONDS = 3600

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

      const folderId = folders.length
      const enrichedFiles: MarketingVaultFile[] = []

      for (const f of (files || []).filter(f => f.metadata)) {
        const ext = f.name.split('.').pop()?.toLowerCase() || ''
        const fileIdx = enrichedFiles.length
        enrichedFiles.push({
          name: f.name,
          id: f.id,
          updated_at: f.updated_at,
          created_at: f.created_at,
          last_accessed_at: f.last_accessed_at,
          metadata: f.metadata as Record<string, unknown>,
          isImage: ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext),
        })
        pending.push({ folderId, fileIdx, path: `${businessId}/${item.name}/${f.name}` })
      }

      folders.push({ name: item.name, files: enrichedFiles })
    } else {
      // Archivo en raíz (sin carpeta)
      const ext = item.name.split('.').pop()?.toLowerCase() || ''
      let rootFolderIdx = folders.findIndex(f => f.name === '')
      if (rootFolderIdx === -1) {
        rootFolderIdx = folders.length
        folders.push({ name: '', files: [] })
      }
      const fileIdx = folders[rootFolderIdx].files.length
      folders[rootFolderIdx].files.push({
        name: item.name,
        id: item.id,
        updated_at: item.updated_at,
        created_at: item.created_at,
        last_accessed_at: item.last_accessed_at,
        isImage: ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext),
      })
      pending.push({ folderId: rootFolderIdx, fileIdx, path: `${businessId}/${item.name}` })
    }
  }

  // Batch-generate signed URLs in a single request (private bucket requires signed URLs)
  if (pending.length > 0) {
    const { data: signedData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(pending.map(p => p.path), SIGNED_URL_EXPIRY_SECONDS)

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

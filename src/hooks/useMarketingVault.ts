import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MarketingVaultFolder, MarketingVaultFile } from '@/types/types'

const BUCKET = 'business-marketing-vault'

async function listVaultFolders(businessId: string): Promise<MarketingVaultFolder[]> {
  // Lista carpetas de primer nivel en {businessId}/
  const { data: topLevel, error } = await supabase.storage
    .from(BUCKET)
    .list(businessId, { limit: 100, sortBy: { column: 'name', order: 'asc' } })

  if (error) throw error

  const folders: MarketingVaultFolder[] = []

  for (const item of topLevel || []) {
    // Si no tiene extensión, asumimos que es carpeta
    if (!item.metadata) {
      const { data: files, error: filesError } = await supabase.storage
        .from(BUCKET)
        .list(`${businessId}/${item.name}`, {
          limit: 200,
          sortBy: { column: 'name', order: 'asc' },
        })

      if (filesError) continue

      const enrichedFiles: MarketingVaultFile[] = (files || [])
        .filter(f => f.metadata) // solo archivos reales
        .map(f => {
          const path = `${businessId}/${item.name}/${f.name}`
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
          const ext = f.name.split('.').pop()?.toLowerCase() || ''
          return {
            name: f.name,
            id: f.id,
            updated_at: f.updated_at,
            created_at: f.created_at,
            last_accessed_at: f.last_accessed_at,
            metadata: f.metadata as Record<string, unknown>,
            url: urlData.publicUrl,
            isImage: ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext),
          }
        })

      folders.push({ name: item.name, files: enrichedFiles })
    } else {
      // Archivo en raíz (sin carpeta)
      const path = `${businessId}/${item.name}`
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const ext = item.name.split('.').pop()?.toLowerCase() || ''
      const rootFolder = folders.find(f => f.name === '')
      if (rootFolder) {
        rootFolder.files.push({
          name: item.name,
          id: item.id,
          updated_at: item.updated_at,
          created_at: item.created_at,
          last_accessed_at: item.last_accessed_at,
          url: urlData.publicUrl,
          isImage: ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext),
        })
      } else {
        folders.push({
          name: '',
          files: [{
            name: item.name,
            id: item.id,
            updated_at: item.updated_at,
            created_at: item.created_at,
            last_accessed_at: item.last_accessed_at,
            url: urlData.publicUrl,
            isImage: ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext),
          }],
        })
      }
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

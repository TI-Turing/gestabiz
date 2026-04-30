import { useState, useRef, useCallback } from 'react'
import {
  FolderOpen,
  FolderPlus,
  Upload,
  Trash2,
  Copy,
  Send,
  ZoomIn,
  FileText,
  Video,
  File,
  X,
  Megaphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePlanFeatures } from '@/hooks/usePlanFeatures'
import {
  useMarketingVault,
  useUploadMarketingAsset,
  useDeleteMarketingAsset,
  useCreateMarketingFolder,
} from '@/hooks/useMarketingVault'
import { supabase } from '@/lib/supabase'
import type { MarketingVaultFile } from '@/types/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { SendAssetModal } from './SendAssetModal'

interface MarketingManagerProps {
  businessId: string
}

const ACCEPTED_MIME =
  'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,application/pdf'
const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

function getFileIcon(file: MarketingVaultFile) {
  if (file.isImage) return null // se muestra como thumbnail
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (['mp4', 'webm'].includes(ext)) return <Video className="h-8 w-8 text-muted-foreground" />
  if (ext === 'pdf') return <FileText className="h-8 w-8 text-muted-foreground" />
  return <File className="h-8 w-8 text-muted-foreground" />
}

export function MarketingManager({ businessId }: MarketingManagerProps) {
  const { planId } = usePlanFeatures(businessId)
  const isPlanBlocked = planId === 'free' || planId === 'basico'

  const { data: folders = [], isLoading, error } = useMarketingVault(businessId)
  const uploadMutation = useUploadMarketingAsset(businessId)
  const deleteMutation = useDeleteMarketingAsset(businessId)
  const createFolderMutation = useCreateMarketingFolder(businessId)

  const [activeFolderIndex, setActiveFolderIndex] = useState(0)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [sendAsset, setSendAsset] = useState<MarketingVaultFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeFolder = folders[activeFolderIndex] ?? null

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    try {
      await createFolderMutation.mutateAsync(name)
      toast.success(`Carpeta "${name}" creada`)
      setNewFolderName('')
      setIsCreatingFolder(false)
      // Activar la nueva carpeta (quedará al final de la lista)
    } catch {
      toast.error('No se pudo crear la carpeta')
    }
  }

  const handleUploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const folder = activeFolder?.name ?? 'General'
      const fileArr = Array.from(files)

      for (const file of fileArr) {
        if (file.size > MAX_BYTES) {
          toast.error(`"${file.name}" supera el límite de 50 MB`)
          continue
        }
        try {
          await uploadMutation.mutateAsync({ folder, file })
          toast.success(`"${file.name}" subido`)
        } catch {
          toast.error(`Error al subir "${file.name}"`)
        }
      }
    },
    [activeFolder, uploadMutation]
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleUploadFiles(e.target.files)
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      void handleUploadFiles(e.dataTransfer.files)
    }
  }

  const handleDelete = async (file: MarketingVaultFile) => {
    if (!confirm(`¿Eliminar "${file.name}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteMutation.mutateAsync(file.path)
      toast.success(`"${file.name}" eliminado`)
    } catch {
      toast.error('No se pudo eliminar el archivo')
    }
  }

  const handleCopyUrl = async (file: MarketingVaultFile) => {
    try {
      const { data, error: signErr } = await supabase.storage
        .from('business-marketing-vault')
        .createSignedUrl(file.path, 3600)
      if (signErr || !data?.signedUrl) throw signErr
      await navigator.clipboard.writeText(data.signedUrl)
      toast.success('URL copiada al portapapeles (válida por 1 hora)')
    } catch {
      toast.error('No se pudo copiar la URL')
    }
  }

  if (isPlanBlocked) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-4">
        <div className="rounded-full bg-muted p-4">
          <Megaphone className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Vault de Marketing</h2>
        <p className="text-muted-foreground max-w-sm">
          Almacena, organiza y comparte tus flyers, videos y materiales de marketing directamente
          desde Gestabiz. Disponible en el plan{' '}
          <span className="font-semibold text-foreground">Profesional</span> o superior.
        </p>
        <Button variant="default" className="mt-2">
          Ver planes
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Vault de Marketing</h1>
        </div>
        <PermissionGate permission="marketing.upload" businessId={businessId} mode="hide">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending || !activeFolder}
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir archivos
          </Button>
        </PermissionGate>
      </div>

      {/* Layout principal: dos paneles en escritorio */}
      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Panel izquierdo: carpetas */}
        <div className="w-full md:w-52 shrink-0 border rounded-lg overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Carpetas
            </span>
            <PermissionGate permission="marketing.upload" businessId={businessId} mode="hide">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Nueva carpeta"
                onClick={() => setIsCreatingFolder(v => !v)}
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </PermissionGate>
          </div>

          {isCreatingFolder && (
            <div className="p-2 border-b flex gap-1">
              <Input
                className="h-7 text-sm"
                placeholder="Nombre carpeta"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') void handleCreateFolder()
                  if (e.key === 'Escape') setIsCreatingFolder(false)
                }}
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={() => void handleCreateFolder()}
                disabled={createFolderMutation.isPending}
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {isLoading && (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                  Cargando...
                </p>
              )}
              {!isLoading && folders.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                  Sin carpetas
                </p>
              )}
              {folders.map((folder, i) => (
                <button
                  key={folder.name || 'root'}
                  type="button"
                  onClick={() => setActiveFolderIndex(i)}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-md text-sm flex items-center gap-2 transition-colors',
                    i === activeFolderIndex
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted/60 text-foreground'
                  )}
                >
                  <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1">{folder.name || 'Sin carpeta'}</span>
                  <span className="text-xs text-muted-foreground">{folder.files.length}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Panel derecho: archivos */}
        <div
          className={cn(
            'flex-1 border rounded-lg overflow-hidden flex flex-col',
            isDragging && 'border-primary border-dashed bg-primary/5'
          )}
          onDragOver={e => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {/* Toolbar del panel */}
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {activeFolder ? activeFolder.name || 'Sin carpeta' : 'Selecciona una carpeta'}
            </span>
            {isDragging && (
              <span className="text-xs text-primary">Suelta para subir</span>
            )}
          </div>

          <ScrollArea className="flex-1">
            {error && (
              <div className="flex items-center justify-center h-40">
                <p className="text-sm text-muted-foreground">
                  No se pudo cargar el vault.
                </p>
              </div>
            )}

            {!error && !isLoading && !activeFolder && (
              <EmptyState
                title="Crea una carpeta primero"
                description="Usa el botón + para crear tu primera carpeta de marketing."
              />
            )}

            {!error && activeFolder && activeFolder.files.length === 0 && !uploadMutation.isPending && (
              <EmptyState
                title="Carpeta vacía"
                description="Sube tu primer flyer o imagen de marketing."
                onUpload={() => fileInputRef.current?.click()}
              />
            )}

            {activeFolder && activeFolder.files.length > 0 && (
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {activeFolder.files.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
                    businessId={businessId}
                    onPreview={url => setLightboxUrl(url)}
                    onDelete={handleDelete}
                    onCopyUrl={handleCopyUrl}
                    onSend={f => setSendAsset(f)}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            )}

            {uploadMutation.isPending && (
              <div className="px-3 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                  <Upload className="h-4 w-4" />
                  Subiendo...
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_MIME}
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightboxUrl(null)}
            aria-label="Cerrar"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Modal enviar asset */}
      {sendAsset && (
        <SendAssetModal
          file={sendAsset}
          businessId={businessId}
          isOpen={true}
          onClose={() => setSendAsset(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

function EmptyState({
  title,
  description,
  onUpload,
}: {
  title: string
  description: string
  onUpload?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="rounded-full bg-muted p-4">
        <Megaphone className="h-10 w-10 text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      {onUpload && (
        <Button size="sm" variant="outline" onClick={onUpload}>
          <Upload className="h-4 w-4 mr-2" />
          Subir archivos
        </Button>
      )}
    </div>
  )
}

interface FileCardProps {
  file: MarketingVaultFile
  businessId: string
  onPreview: (url: string) => void
  onDelete: (file: MarketingVaultFile) => void
  onCopyUrl: (file: MarketingVaultFile) => void
  onSend: (file: MarketingVaultFile) => void
  isDeleting: boolean
}

function FileCard({
  file,
  businessId,
  onPreview,
  onDelete,
  onCopyUrl,
  onSend,
  isDeleting,
}: FileCardProps) {
  const icon = getFileIcon(file)

  return (
    <div className="group relative rounded-lg border bg-card overflow-hidden flex flex-col">
      {/* Thumbnail / icono */}
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
        {file.isImage && file.url ? (
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 p-2">
            {icon}
            <span className="text-xs text-muted-foreground text-center truncate w-full">
              {file.name}
            </span>
          </div>
        )}

        {/* Overlay de acciones en hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 flex-wrap p-1">
          {file.isImage && file.url && (
            <button
              type="button"
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
              title="Ver en grande"
              onClick={() => onPreview(file.url!)}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
            title="Copiar URL (1h)"
            onClick={() => onCopyUrl(file)}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
            title="Enviar"
            onClick={() => onSend(file)}
          >
            <Send className="h-4 w-4" />
          </button>
          <PermissionGate permission="marketing.upload" businessId={businessId} mode="hide">
            <button
              type="button"
              className="p-1.5 rounded-full bg-red-500/70 hover:bg-red-500 text-white"
              title="Eliminar"
              onClick={() => onDelete(file)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Nombre del archivo */}
      <div className="px-2 py-1.5 text-xs text-muted-foreground truncate" title={file.name}>
        {file.name}
      </div>
    </div>
  )
}

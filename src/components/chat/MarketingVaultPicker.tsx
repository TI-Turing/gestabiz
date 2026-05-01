import { useState } from 'react'
import { X, FolderOpen, CheckSquare, Square, Image as ImageIcon, FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMarketingVault } from '@/hooks/useMarketingVault'
import type { MarketingVaultFile } from '@/types/types'
import { cn } from '@/lib/utils'

interface MarketingVaultPickerProps {
  businessId: string
  isOpen: boolean
  onClose: () => void
  onSelect: (files: MarketingVaultFile[]) => void
}

export function MarketingVaultPicker({ businessId, isOpen, onClose, onSelect }: MarketingVaultPickerProps) {
  const { data: folders, isLoading, error } = useMarketingVault(isOpen ? businessId : undefined)
  const [activeFolderIndex, setActiveFolderIndex] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const toggleFile = (fileId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(fileId)) { next.delete(fileId) } else { next.add(fileId) }
      return next
    })
  }

  const handleConfirm = () => {
    const allFiles = folders?.flatMap(f => f.files) ?? []
    const picked = allFiles.filter(f => selected.has(f.id))
    onSelect(picked)
    setSelected(new Set())
    onClose()
  }

  const activeFolder = folders?.[activeFolderIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="font-semibold">Vault de Marketing</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {isLoading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-muted-foreground text-sm">Cargando archivos...</p>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-muted-foreground text-sm">
              No se pudo cargar el vault. Verifica tu acceso.
            </p>
          </div>
        )}

        {!isLoading && !error && folders?.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">El vault está vacío</p>
              <p className="text-sm text-muted-foreground">
                Agrega archivos en la sección de Marketing para usarlos aquí.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && (folders?.length ?? 0) > 0 && (
          <div className="flex flex-1 min-h-0">
            {/* Sidebar carpetas */}
            <div className="w-44 border-r shrink-0">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {folders!.map((folder, i) => (
                    <button
                      key={folder.name || 'root'}
                      type="button"
                      onClick={() => setActiveFolderIndex(i)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors',
                        i === activeFolderIndex ? 'bg-muted font-medium' : 'hover:bg-muted/50'
                      )}
                    >
                      <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{folder.name || 'Sin carpeta'}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {folder.files.length}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Grid archivos */}
            <ScrollArea className="flex-1">
              <div className="p-3 grid grid-cols-3 gap-2">
                {activeFolder?.files.map(file => {
                  const isSelected = selected.has(file.id)
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => toggleFile(file.id)}
                      className={cn(
                        'relative rounded-lg border-2 overflow-hidden aspect-square transition-all',
                        isSelected ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
                      )}
                      title={file.name}
                      aria-label={`${isSelected ? 'Deseleccionar' : 'Seleccionar'} ${file.name}`}
                    >
                      {file.isImage && file.url ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-muted gap-1 p-2">
                          {file.isImage ? <ImageIcon className="h-8 w-8 text-muted-foreground" /> : <FileIcon className="h-8 w-8 text-muted-foreground" />}
                          <span className="text-xs text-muted-foreground truncate w-full text-center">
                            {file.name}
                          </span>
                        </div>
                      )}
                      {/* Checkbox overlay */}
                      <div className="absolute top-1 right-1">
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-primary drop-shadow" />
                        ) : (
                          <Square className="h-5 w-5 text-white drop-shadow" />
                        )}
                      </div>
                    </button>
                  )
                })}
                {activeFolder?.files.length === 0 && (
                  <div className="col-span-3 py-8 text-center text-sm text-muted-foreground">
                    Esta carpeta está vacía
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t shrink-0">
          <span className="text-sm text-muted-foreground">
            {selected.size > 0 ? `${selected.size} seleccionado${selected.size > 1 ? 's' : ''}` : 'Selecciona archivos'}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" disabled={selected.size === 0} onClick={handleConfirm}>
              Insertar ({selected.size})
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

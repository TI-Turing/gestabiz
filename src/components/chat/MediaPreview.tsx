import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MediaPreviewProps {
  file: File
  type: 'image' | 'video'
  objectUrl: string
  onConfirm: () => void
  onCancel: () => void
}

export function MediaPreview({ file, type, objectUrl, onConfirm, onCancel }: MediaPreviewProps) {
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative bg-background rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <p className="font-medium text-sm truncate max-w-[250px]">{file.name}</p>
            <p className="text-xs text-muted-foreground">{sizeMB} MB</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Cancelar">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Preview */}
        <div className="p-4 flex items-center justify-center bg-muted/20 min-h-[200px] max-h-[400px]">
          {type === 'image' ? (
            <img
              src={objectUrl}
              alt="Vista previa"
              className="max-w-full max-h-[360px] object-contain rounded"
            />
          ) : (
            <video
              src={objectUrl}
              controls
              className="max-w-full max-h-[360px] rounded"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={onConfirm}>
            Enviar
          </Button>
        </div>
      </div>
    </div>
  )
}

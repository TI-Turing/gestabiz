import React, { Suspense } from 'react'
import type { EmojiClickData } from 'emoji-picker-react'

const Picker = React.lazy(() => import('emoji-picker-react'))

interface EmojiPickerProps {
  isOpen: boolean
  onEmojiSelect: (emoji: string) => void
  onClose: () => void
}

export function EmojiPicker({ isOpen, onEmojiSelect, onClose }: EmojiPickerProps) {
  if (!isOpen) return null

  const handleClick = (data: EmojiClickData) => {
    onEmojiSelect(data.emoji)
    onClose()
  }

  return (
    <>
      {/* Overlay para cerrar al hacer click fuera */}
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div className="absolute bottom-full right-0 mb-2 z-50 shadow-lg rounded-lg overflow-hidden">
        <Suspense fallback={
          <div className="h-[350px] w-[300px] flex items-center justify-center bg-background border rounded-lg">
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
        }>
          <Picker
            onEmojiClick={handleClick}
            height={350}
            width={300}
            searchPlaceholder="Buscar emoji..."
            lazyLoadEmojis
          />
        </Suspense>
      </div>
    </>
  )
}

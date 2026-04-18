import { useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export interface LightboxImage {
  url: string
  description?: string | null
}

interface ImageLightboxProps {
  images: LightboxImage[]
  initialIndex?: number
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex = 0, onClose }: Readonly<ImageLightboxProps>) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [showDescription, setShowDescription] = useState(true)

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < images.length - 1
  const current = images[currentIndex]

  const goNext = useCallback(() => {
    if (hasNext) setCurrentIndex((i) => i + 1)
  }, [hasNext])

  const goPrev = useCallback(() => {
    if (hasPrev) setCurrentIndex((i) => i - 1)
  }, [hasPrev])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    globalThis.addEventListener('keydown', handleKey)
    return () => globalThis.removeEventListener('keydown', handleKey)
  }, [onClose, goNext, goPrev])

  if (!current) return null

  return createPortal(
    <dialog
      open
      aria-label="Visor de imagen"
      className="fixed inset-0 m-0 w-full h-full max-w-full max-h-full z-9999 bg-black/95 flex items-center justify-center border-0 p-0"
    >
      {/* Backdrop invisible — clic fuera del contenido cierra el lightbox */}
      <button
        type="button"
        aria-label="Cerrar visor"
        className="fixed inset-0 w-full h-full bg-transparent cursor-default focus:outline-none"
        onClick={onClose}
      />
      {/* Botón cerrar */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors z-10"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Flecha anterior */}
      {hasPrev && (
        <button
          type="button"
          aria-label="Imagen anterior"
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors z-10"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Imagen principal — click para mostrar/ocultar descripción */}
      <button
        type="button"
        aria-label={showDescription ? 'Ocultar descripción' : 'Mostrar descripción'}
        className="flex items-center justify-center focus:outline-none"
        onClick={(e) => { e.stopPropagation(); setShowDescription((s) => !s) }}
      >
        <img
          src={current.url}
          alt={current.description ?? ''}
          className="max-w-[90vw] max-h-[85vh] object-contain cursor-pointer select-none"
          draggable={false}
        />
      </button>

      {/* Flecha siguiente */}
      {hasNext && (
        <button
          type="button"
          aria-label="Imagen siguiente"
          onClick={(e) => { e.stopPropagation(); goNext() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors z-10"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Descripción */}
      {showDescription && current.description && (
        <p
          className="absolute bottom-10 left-1/2 -translate-x-1/2 max-w-lg w-[90vw] text-center text-sm text-white bg-black/60 px-4 py-2 rounded-lg pointer-events-none"
        >
          {current.description}
        </p>
      )}

      {/* Contador */}
      {images.length > 1 && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs select-none pointer-events-none">
          {currentIndex + 1} / {images.length}
        </span>
      )}
    </dialog>,
    document.body
  )
}

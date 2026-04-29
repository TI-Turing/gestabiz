/**
 * useImageCompression
 *
 * Wrapper sobre browser-image-compression para comprimir imágenes
 * antes de subirlas al chat. Reduce el tamaño a máx 1MB / 1280px.
 */

import { useCallback } from 'react'
import imageCompression from 'browser-image-compression'

export function useImageCompression() {
  const compress = useCallback(async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file

    return imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.7,
    })
  }, [])

  return { compress }
}

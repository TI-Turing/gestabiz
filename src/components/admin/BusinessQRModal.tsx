import { useEffect, useState } from 'react'
import * as Sentry from '@sentry/react'
import QRCode from 'qrcode'
import gestabizIconUrl from '@/assets/images/gestabiz/gestabiz_icon_clean.svg?url'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Download, QrCode } from 'lucide-react'
import type { Business } from '@/types/types'

interface BusinessQRModalProps {
  business: Business
  isOpen: boolean
  onClose: () => void
}

async function buildQRCanvas(url: string, tagline: string): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 400,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#ffffff' },
  })

  const qrSize = 400
  const padding = 28
  const bottomHeight = 90
  const totalWidth = qrSize + padding * 2
  const totalHeight = qrSize + padding * 2 + bottomHeight
  const canvas = document.createElement('canvas')
  canvas.width = totalWidth
  canvas.height = totalHeight
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, totalWidth, totalHeight)

  const qrImg = new Image()
  qrImg.src = qrDataUrl
  await new Promise<void>((resolve) => { qrImg.onload = () => resolve() })
  ctx.drawImage(qrImg, padding, padding, qrSize, qrSize)

  // Círculo blanco detrás del icono
  const iconSize = Math.round(qrSize * 0.2)
  const iconX = padding + (qrSize - iconSize) / 2
  const iconY = padding + (qrSize - iconSize) / 2
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2 + 6, 0, Math.PI * 2)
  ctx.fill()

  const iconImg = new Image()
  iconImg.src = gestabizIconUrl
  await new Promise<void>((resolve, reject) => {
    iconImg.onload = () => resolve()
    iconImg.onerror = reject
  })
  ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize)

  // Franja inferior
  const stripY = padding + qrSize + 10
  ctx.fillStyle = '#f3f4f6'
  ctx.fillRect(padding, stripY, qrSize, bottomHeight - 10)

  ctx.fillStyle = '#111827'
  ctx.font = 'bold 22px system-ui, -apple-system, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('gestabiz', totalWidth / 2, stripY + 28)

  ctx.fillStyle = '#6b7280'
  ctx.font = '13px system-ui, -apple-system, Arial, sans-serif'
  ctx.fillText(tagline, totalWidth / 2, stripY + 56)

  return canvas.toDataURL('image/png')
}

export function BusinessQRModal({ business, isOpen, onClose }: BusinessQRModalProps) {
  const [includeBooking, setIncludeBooking] = useState(false)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const targetUrl = includeBooking
    ? `${window.location.origin}/negocio/${business.slug}?book=true`
    : `${window.location.origin}/negocio/${business.slug}`

  const tagline = includeBooking
    ? 'Reserva tu próxima cita aquí'
    : 'Conoce nuestros servicios'

  // Re-genera cada vez que abre el modal o cambia la opción
  useEffect(() => {
    if (!isOpen || !business.slug) return

    setDataUrl(null)
    setIsGenerating(true)

    buildQRCanvas(targetUrl, tagline)
      .then(setDataUrl)
      .catch((err) => {
        Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
          tags: { component: 'BusinessQRModal' },
        })
      })
      .finally(() => setIsGenerating(false))
  }, [isOpen, business.slug, targetUrl, tagline])

  const handleClose = () => {
    setIncludeBooking(false)
    setDataUrl(null)
    onClose()
  }

  const handleDownload = () => {
    if (!dataUrl) return
    const suffix = includeBooking ? 'QR-reservas' : 'QR-perfil'
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${business.name.replaceAll(/\s+/g, '-')}-${suffix}.png`
    link.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generar QR del negocio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Opción */}
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <Checkbox
              id="include-booking"
              checked={includeBooking}
              onCheckedChange={(val) => setIncludeBooking(Boolean(val))}
              className="mt-0.5"
            />
            <div>
              <Label htmlFor="include-booking" className="font-medium cursor-pointer">
                Abrir ventana de reserva de cita
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Al escanear se abrirá el perfil del negocio con el modal de creación de cita abierto y el negocio preseleccionado.
              </p>
            </div>
          </div>

          {/* QR */}
          {isGenerating && (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isGenerating && dataUrl && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={dataUrl}
                alt={`QR de ${business.name}`}
                className="rounded-lg border border-border w-full max-w-[280px]"
              />
              <p className="text-xs text-muted-foreground text-center break-all leading-relaxed">
                {targetUrl}
              </p>
              <Button onClick={handleDownload} className="w-full gap-2">
                <Download className="h-4 w-4" />
                Descargar PNG
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

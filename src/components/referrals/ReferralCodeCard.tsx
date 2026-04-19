import { useState } from 'react'
import { Copy, Check, WhatsappLogo, Share } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { ReferralCode } from '@/hooks/useReferralCodes'

interface ReferralCodeCardProps {
  code: ReferralCode
  daysRemaining: number
}

export function ReferralCodeCard({ code, daysRemaining }: ReferralCodeCardProps) {
  const [copied, setCopied] = useState(false)

  const shareText = encodeURIComponent(
    `¡Usa mi cupón *${code.code}* en Gestabiz y paga solo $74.900 el primer mes (en lugar de $89.900)! 🎉\n\nRegistra tu negocio en gestabiz.com y aplica el cupón al momento de pagar.`
  )

  const whatsappUrl = `https://wa.me/?text=${shareText}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.code)
      setCopied(true)
      toast.success('Cupón copiado al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  const handleShareNative = async () => {
    const text = decodeURIComponent(shareText)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mi cupón Gestabiz', text })
      } catch {
        // Usuario canceló
      }
    } else {
      window.open(whatsappUrl, '_blank')
    }
  }

  const statusConfig = {
    active:   { label: 'Activo',   className: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' },
    redeemed: { label: 'Canjeado', className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
    expired:  { label: 'Expirado', className: 'bg-muted text-muted-foreground border-border' },
    disabled: { label: 'Inactivo', className: 'bg-muted text-muted-foreground border-border' },
  }

  const statusInfo = statusConfig[code.status]

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6 pb-5 space-y-4">
        {/* Code display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tu código de referral</p>
            <p className="text-3xl font-bold tracking-widest font-mono text-foreground">
              {code.code}
            </p>
          </div>
          <Badge variant="outline" className={statusInfo.className}>
            {statusInfo.label}
          </Badge>
        </div>

        {/* Discount info */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">El negocio paga</p>
            <p className="text-lg font-bold text-foreground">$74.900</p>
            <p className="text-xs text-muted-foreground">en lugar de $89.900</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Tú recibes</p>
            <p className="text-lg font-bold text-primary">$60.000</p>
            <p className="text-xs text-muted-foreground">por MercadoPago</p>
          </div>
        </div>

        {/* Expiry */}
        {code.status === 'active' && (
          <p className="text-xs text-muted-foreground text-center">
            {daysRemaining > 0
              ? `Vence en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`
              : 'Vence hoy'}
          </p>
        )}

        {code.status === 'redeemed' && code.redeemed_at && (
          <p className="text-xs text-muted-foreground text-center">
            Canjeado el {new Date(code.redeemed_at).toLocaleDateString('es-CO', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}

        {/* Actions */}
        {code.status === 'active' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCopy}
            >
              {copied ? (
                <><Check className="h-4 w-4 mr-2 text-emerald-500" />Copiado</>
              ) : (
                <><Copy className="h-4 w-4 mr-2" />Copiar</>
              )}
            </Button>

            <Button
              size="sm"
              className="flex-1 bg-[#25D366] hover:bg-[#1ebe57] text-white border-0"
              onClick={() => window.open(whatsappUrl, '_blank')}
            >
              <WhatsappLogo className="h-4 w-4 mr-2" weight="fill" />
              WhatsApp
            </Button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareNative}
              >
                <Share className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

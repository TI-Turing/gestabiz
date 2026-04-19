import { Gift, ArrowRight } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFeatureFlag } from '@/hooks/useFeatureFlag'
import { useReferralCodes } from '@/hooks/useReferralCodes'

interface ReferralBannerProps {
  userId: string
  onNavigate: () => void
}

export function ReferralBanner({ userId, onNavigate }: ReferralBannerProps) {
  const isEnabled = useFeatureFlag('referral_program_enabled')
  const { activeCode, redeemedCodes } = useReferralCodes(userId)

  if (!isEnabled) return null

  const totalEarned = redeemedCodes.length * 60000
  const hasEarnings = totalEarned > 0

  return (
    <Card
      className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
      onClick={onNavigate}
    >
      <CardContent className="py-4 px-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/15 rounded-lg shrink-0">
              <Gift size={24} weight="fill" className="text-primary" />
            </div>
            <div>
              {hasEarnings ? (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    Has ganado{' '}
                    <span className="text-primary">
                      ${totalEarned.toLocaleString('es-CO')} COP
                    </span>{' '}
                    refiriendo negocios
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeCode ? `Tu cupón activo: ${activeCode.code}` : 'Ver mis ganancias y cupones'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    ¿Quieres generar un dinerito extra?
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Refiere negocios a Gestabiz y llévate más del 70% del primer pago.
                  </p>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-primary hover:text-primary/80 hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation()
              onNavigate()
            }}
          >
            <ArrowRight size={18} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

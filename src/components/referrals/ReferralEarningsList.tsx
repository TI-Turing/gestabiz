import { CheckCircle, Clock, XCircle, Warning } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { ReferralPayout } from '@/hooks/useReferralEarnings'

interface ReferralEarningsListProps {
  payouts: ReferralPayout[]
}

const statusConfig: Record<
  ReferralPayout['status'],
  { label: string; icon: React.ReactNode; className: string }
> = {
  pending:       { label: 'Pendiente',       icon: <Clock    size={14} />, className: 'bg-amber-500/20 text-amber-600 border-amber-500/30' },
  processing:    { label: 'Procesando',      icon: <Clock    size={14} />, className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  transferred:   { label: 'Transferido',     icon: <CheckCircle size={14} weight="fill" />, className: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' },
  failed:        { label: 'Fallido',         icon: <XCircle  size={14} weight="fill" />, className: 'bg-red-500/20 text-red-600 border-red-500/30' },
  manual_review: { label: 'Revisión manual', icon: <Warning  size={14} weight="fill" />, className: 'bg-orange-500/20 text-orange-600 border-orange-500/30' },
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function ReferralEarningsList({ payouts }: ReferralEarningsListProps) {
  if (payouts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Aún no tienes comisiones registradas.</p>
        <p className="text-xs mt-1">Comparte tu cupón para empezar a ganar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {payouts.map((payout) => {
        const config = statusConfig[payout.status]
        return (
          <Card key={payout.id} className="bg-card border-border">
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCOP(payout.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payout.paid_at
                      ? `Pagado ${new Date(payout.paid_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : `Creado ${new Date(payout.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </p>
                  {payout.status === 'failed' && payout.last_error && (
                    <p className="text-xs text-destructive mt-0.5 truncate max-w-[200px]">
                      {payout.last_error}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={`${config.className} flex items-center gap-1 shrink-0`}>
                {config.icon}
                {config.label}
              </Badge>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

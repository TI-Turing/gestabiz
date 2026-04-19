import { useState } from 'react'
import { Gift, Coins, Hourglass, ArrowsClockwise, PencilSimple, EnvelopeSimple, Bank, IdentificationCard } from '@phosphor-icons/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PayoutDetailsForm } from '@/components/referrals/PayoutDetailsForm'
import { ReferralCodeCard } from '@/components/referrals/ReferralCodeCard'
import { ReferralEarningsList } from '@/components/referrals/ReferralEarningsList'
import { useReferralCodes } from '@/hooks/useReferralCodes'
import { usePayoutDetails } from '@/hooks/usePayoutDetails'
import { useReferralEarnings } from '@/hooks/useReferralEarnings'
import { useFeatureFlag } from '@/hooks/useFeatureFlag'
import { toast } from 'sonner'
import type { User } from '@/types/types'

interface ReferralsPageProps {
  user: User
}

function StatCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtext?: string
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-muted rounded-lg">{icon}</div>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
      </CardContent>
    </Card>
  )
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function ReferralsPage({ user }: ReferralsPageProps) {
  const isEnabled = useFeatureFlag('referral_program_enabled')
  const { details, hasDetails, isLoading: isLoadingDetails, upsert, isSaving } = usePayoutDetails(user.id)
  const { activeCode, codes, isLoading: isLoadingCodes, generate, isGenerating, getDaysRemaining } = useReferralCodes(user.id)
  const { data: earnings, isLoading: isLoadingEarnings } = useReferralEarnings(user.id)

  const [showPayoutForm, setShowPayoutForm] = useState(false)

  const handleGenerateCode = async () => {
    if (!hasDetails) {
      setShowPayoutForm(true)
      return
    }
    try {
      const result = await generate()
      if (result.already_existed) {
        toast.info('Ya tienes un cupón activo')
      } else {
        toast.success(`¡Cupón ${result.code} generado exitosamente!`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generando cupón'
      toast.error(message)
    }
  }

  const handlePayoutSaved = async () => {
    setShowPayoutForm(false)
    // Auto-generate code after saving payout details
    try {
      const result = await generate()
      toast.success(`¡Datos guardados! Tu cupón es: ${result.code}`)
    } catch {
      toast.success('Datos guardados. Ahora puedes generar tu cupón.')
    }
  }

  if (!isEnabled) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Gift size={48} className="mx-auto mb-4 opacity-30" />
        <p className="text-base font-medium">El programa de referrals no está disponible actualmente.</p>
      </div>
    )
  }

  const isLoading = isLoadingDetails || isLoadingCodes

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Gift size={26} weight="fill" className="text-primary" />
          Programa de Referrals
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Comparte tu cupón con dueños de negocio. Cuando paguen su primer mes en Gestabiz,
          el negocio paga <strong>$74.900</strong> (ahorra $15.000) y tú recibes{' '}
          <strong className="text-primary">$60.000</strong> por MercadoPago.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          icon={<Coins size={18} className="text-emerald-500" />}
          label="Total ganado"
          value={formatCOP(earnings?.totalEarned ?? 0)}
          subtext="transferido a MP"
        />
        <StatCard
          icon={<Hourglass size={18} className="text-amber-500" />}
          label="Pendiente"
          value={formatCOP(earnings?.totalPending ?? 0)}
          subtext="en proceso"
        />
        <StatCard
          icon={<ArrowsClockwise size={18} className="text-primary" />}
          label="Cupones canjeados"
          value={codes.filter((c) => c.status === 'redeemed').length.toString()}
          subtext="negocios referidos"
        />
      </div>

      {/* Active code */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Tu cupón</h3>
          {hasDetails && !activeCode && (
            <Button
              size="sm"
              onClick={handleGenerateCode}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando...</>
              ) : (
                'Generar cupón'
              )}
            </Button>
          )}
        </div>

        {isLoading ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Cargando...</p>
            </CardContent>
          </Card>
        ) : activeCode ? (
          <ReferralCodeCard code={activeCode} daysRemaining={getDaysRemaining(activeCode.expires_at)} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Gift size={40} className="mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm font-medium text-foreground mb-1">Aún no tienes cupón activo</p>
              <p className="text-xs text-muted-foreground mb-4">
                {hasDetails
                  ? 'Genera tu cupón para empezar a referir negocios.'
                  : 'Configura tus datos de pago para generar tu primer cupón.'}
              </p>
              <Button
                onClick={handleGenerateCode}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando...</>
                ) : hasDetails ? (
                  'Generar mi cupón'
                ) : (
                  'Configurar datos y generar cupón'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payout details — setup si no tiene, resumen editable si ya tiene */}
      {!isLoading && (
        hasDetails && details ? (
          <Card className="border-border">
            <CardContent className="py-4 px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Datos de pago</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <EnvelopeSimple size={13} />
                    <span className="truncate">{details.mp_email}</span>
                  </div>
                  {details.bank_name && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Bank size={13} />
                      <span>{details.bank_name}{details.account_type ? ` — ${details.account_type === 'savings' ? 'Ahorros' : 'Corriente'}` : ''}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IdentificationCard size={13} />
                    <span>{details.document_type} {details.document_number}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPayoutForm(true)}
                >
                  <PencilSimple size={15} className="mr-1.5" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-4 px-5">
              <p className="text-sm font-medium text-foreground mb-1">
                Configura tus datos de pago
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Necesitas un email de MercadoPago para recibir tus comisiones.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPayoutForm(true)}
              >
                Configurar ahora
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Earnings history */}
      {(earnings?.payouts ?? []).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">Historial de comisiones</h3>
          {isLoadingEarnings ? (
            <div className="text-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : (
            <ReferralEarningsList payouts={earnings!.payouts} />
          )}
        </div>
      )}

      {/* How it works */}
      <Card className="bg-muted/30 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {[
            { step: '1', text: 'Comparte tu cupón con dueños de negocio por WhatsApp o donde quieras.' },
            { step: '2', text: 'El negocio se registra en Gestabiz, elige el Plan Básico y aplica tu cupón.' },
            { step: '3', text: 'Paga $74.900 (en lugar de $89.900) y tú recibes $60.000 automáticamente por MercadoPago.' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {step}
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1 border-t border-border mt-2">
            Solo aplica al Plan Básico por primera vez. Cupón válido por 90 días.
          </p>
        </CardContent>
      </Card>

      {/* Payout details modal */}
      <PayoutDetailsForm
        isOpen={showPayoutForm}
        onClose={() => setShowPayoutForm(false)}
        onSaved={handlePayoutSaved}
        isSaving={isSaving}
        defaultValues={details}
        onSubmit={upsert}
      />
    </div>
  )
}

/**
 * PlanUpgradeModal Component
 * 
 * Modal para actualizar el plan de suscripción (upgrade/downgrade)
 */

import { useState } from 'react'
import * as Sentry from '@sentry/react'
import { useSubscription } from '@/hooks/useSubscription'
import { Confetti, TrendDown } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CheckCircle, Loader2 } from 'lucide-react'
import type { PlanType, BillingCycle } from '@/lib/payments/PaymentGateway'
import { formatCurrency } from '@/lib/utils'

interface PlanUpgradeModalProps {
  businessId: string
  currentPlan: PlanType
  currentCycle: BillingCycle
  onClose: () => void
  onSuccess: () => void
  /** Si el usuario aún no ha usado su mes gratuito y es owner */
  isTrialEligible?: boolean
  /** Callback para activar el trial (provisto por useFreeTrial) */
  onActivateTrial?: () => Promise<void>
}

const PLANS = {
  free: {
    name: 'Free',
    monthly: 0,
    yearly: 0,
    features: ['1 sede', '1 empleado', '50 citas/mes', '50 clientes', '15 servicios'],
  },
  basico: {
    name: 'Básico',
    monthly: 89900,
    yearly: 899000,
    features: ['3 sedes', '6 empleados', 'Citas ilimitadas', 'CRM completo', 'Chat y WhatsApp'],
  },
  pro: {
    name: 'Pro',
    monthly: 159900,
    yearly: 1599000,
    features: ['10 sedes', '15 empleados', 'Contabilidad', 'Reclutamiento', 'Analíticas avanzadas'],
  },
}

export function PlanUpgradeModal({
  businessId,
  currentPlan,
  currentCycle,
  onClose,
  onSuccess,
  isTrialEligible = false,
  onActivateTrial,
}: PlanUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(currentPlan)
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(currentCycle)
  const [discountCode, setDiscountCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { updatePlan, applyDiscount } = useSubscription(businessId)

  const getPrice = (plan: PlanType, cycle: BillingCycle) => {
    if (PLANS[plan].monthly === 0) return 'Gratis'
    const amount = PLANS[plan][cycle]
    return formatCurrency(amount)
  }

  const isTrialAction = isTrialEligible && selectedPlan === 'basico' && onActivateTrial != null

  const handleSubmit = async () => {
    if (selectedPlan === currentPlan && selectedCycle === currentCycle) {
      return
    }

    setIsSubmitting(true)
    try {
      // Si aplica trial gratuito, activarlo directamente
      if (isTrialAction) {
        await onActivateTrial!()
        onSuccess()
        return
      }

      // Aplicar código de descuento si existe
      if (discountCode) {
        const amount = PLANS[selectedPlan]?.[selectedCycle] ?? 0
        await applyDiscount(discountCode, selectedPlan, amount)
      }

      // Actualizar plan
      await updatePlan(selectedPlan, selectedCycle)
      onSuccess()
    } catch (error) {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'PlanUpgradeModal' } })
      console.error('Error updating plan:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isUpgrade = () => {
    const planOrder: PlanType[] = ['free', 'basico', 'pro']
    const currentIndex = planOrder.indexOf(currentPlan)
    const selectedIndex = planOrder.indexOf(selectedPlan)
    return selectedIndex > currentIndex
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Actualizar Plan</DialogTitle>
          <DialogDescription>
            {isUpgrade() ? 'Mejora tu plan' : 'Cambia tu plan'} para ajustarlo a tus necesidades
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selector de ciclo de facturación */}
          <div className="space-y-2">
            <Label>Ciclo de Facturación</Label>
            <RadioGroup
              value={selectedCycle}
              onValueChange={(value) => setSelectedCycle(value as BillingCycle)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer">
                  Mensual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yearly" id="yearly" />
                <Label htmlFor="yearly" className="cursor-pointer">
                  Anual (ahorra 17%)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Grid de planes */}
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
            {(Object.keys(PLANS) as PlanType[]).map((planKey) => {
              const plan = PLANS[planKey]
              const isCurrent = planKey === currentPlan && selectedCycle === currentCycle
              const isSelected = planKey === selectedPlan

              return (
                <div
                  key={planKey}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'
                  } ${isCurrent ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedPlan(planKey)}
                >
                  {isCurrent && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                      Actual
                    </div>
                  )}
                  
                  <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                  {isTrialEligible && planKey === 'basico' && (
                    <div className="mb-3 rounded-md bg-primary/10 border border-primary/20 px-2 py-1.5 text-xs font-semibold text-primary">
                      Primer mes GRATIS — sin tarjeta de crédito
                    </div>
                  )}
                  <div className="text-2xl font-bold mb-4">
                    {getPrice(planKey, selectedCycle)}
                    {PLANS[planKey].monthly > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /{selectedCycle === 'monthly' ? 'mes' : 'año'}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {/* Código de descuento */}
          <div className="space-y-2">
            <Label htmlFor="discount">Código de Descuento (Opcional)</Label>
            <Input
              id="discount"
              placeholder="Ej: LAUNCH2025"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            />
          </div>

          {/* Información del cambio */}
          {(selectedPlan !== currentPlan || selectedCycle !== currentCycle) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-medium mb-1 flex items-center gap-2">
                {isUpgrade() 
                  ? <><Confetti size={18} weight="fill" /> Mejorando plan</>
                  : <><TrendDown size={18} weight="fill" /> Cambiando plan</>
                }
              </p>
              <p className="text-muted-foreground">
                {isUpgrade()
                  ? 'Se aplicará un prorateo inmediato. Solo pagarás la diferencia del período actual.'
                  : 'El cambio se aplicará al final del período de facturación actual.'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (selectedPlan === currentPlan && selectedCycle === currentCycle)
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isTrialAction ? 'Activando...' : 'Actualizando...'}
              </>
            ) : isTrialAction ? (
              'Activar Mes Gratis'
            ) : (
              'Confirmar Cambio'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

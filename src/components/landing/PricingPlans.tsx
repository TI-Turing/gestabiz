import { useState } from 'react'
import { Check, X, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PRICING_PLANS } from '@/lib/pricingPlans'

interface PricingPlansProps {
  showCTA?: boolean
  onSelectPlan?: (planId: string) => void
  compact?: boolean
}

type BillingCycle = 'monthly' | 'yearly'

export function PricingPlans({ showCTA = false, onSelectPlan, compact = false }: PricingPlansProps) {
  const plans = PRICING_PLANS
  const [cycle, setCycle] = useState<BillingCycle>('monthly')

  const formatPrice = (price: number | null) => {
    if (price === null) return 'A cotizar'
    if (price === 0) return '$0'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatLimit = (value: number | null | string | undefined): string => {
    if (value === null || value === undefined) return 'Ilimitado'
    if (typeof value === 'string') return value
    return value.toLocaleString('es-CO')
  }

  const getDisplayPrice = (plan: typeof plans[number]) => {
    if (plan.price === 0) return { price: 0, suffix: '' }
    if (cycle === 'yearly' && plan.priceAnnual > 0) {
      return { price: Math.round(plan.priceAnnual / 12), suffix: '/mes · facturado anualmente' }
    }
    return { price: plan.price, suffix: '/mes' }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Toggle mensual / anual */}
      <div className="inline-flex rounded-full border border-gray-200 bg-gray-100 p-1">
        <button
          onClick={() => setCycle('monthly')}
          className={cn(
            'rounded-full px-6 py-2 text-sm font-medium transition-all',
            cycle === 'monthly'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Mensual
        </button>
        <button
          onClick={() => setCycle('yearly')}
          className={cn(
            'flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-all',
            cycle === 'yearly'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Anual
          <span className={cn(
            'rounded-full px-2 py-0.5 text-xs font-semibold',
            cycle === 'yearly' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
          )}>
            2 meses gratis
          </span>
        </button>
      </div>

      {/* Grid de planes */}
      <div className={cn(
        'grid w-full gap-4 sm:gap-6 lg:gap-8',
        compact ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'
      )}>
        {plans.map((plan) => {
          const { price, suffix } = getDisplayPrice(plan)

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col bg-white',
                plan.popular && 'border-purple-600 shadow-xl sm:scale-105 z-10',
                !compact && 'hover:shadow-2xl transition-all'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-purple-600 text-white px-6 py-1 gap-2">
                    <Sparkles className="h-4 w-4" />
                    Más Popular
                  </Badge>
                </div>
              )}

              <CardHeader className={cn('space-y-4', compact ? 'pb-4' : 'pb-6')}>
                <div>
                  <CardTitle className={cn(
                    'flex items-center justify-between text-gray-900',
                    compact ? 'text-xl' : 'text-2xl'
                  )}>
                    {plan.name}
                  </CardTitle>
                  <CardDescription className={cn(
                    'mt-2 text-gray-600',
                    compact ? 'text-xs' : 'text-sm'
                  )}>
                    {plan.subtitle}
                  </CardDescription>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      'font-bold text-purple-600',
                      compact ? 'text-3xl' : 'text-4xl'
                    )}>
                      {plan.price === 0 ? 'Gratis' : formatPrice(price)}
                    </span>
                  </div>
                  {suffix && (
                    <p className="text-sm text-gray-500 mt-1">{suffix}</p>
                  )}
                  {cycle === 'yearly' && plan.priceAnnual > 0 && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      {formatPrice(plan.priceAnnual)}/año
                    </p>
                  )}
                </div>

                {!compact && (
                  <p className="text-sm text-gray-600">{plan.description}</p>
                )}
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Limits */}
                {!compact && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sedes:</span>
                      <span className="font-semibold text-gray-900">{formatLimit(plan.limits?.locations)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Empleados:</span>
                      <span className="font-semibold text-gray-900">{formatLimit(plan.limits?.employees)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Citas/mes:</span>
                      <span className="font-semibold text-gray-900">{formatLimit(plan.limits?.appointments)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Clientes (CRM):</span>
                      <span className="font-semibold text-gray-900">{formatLimit(plan.limits?.clients)}</span>
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className="space-y-3 flex-1">
                  {plan.features.map((feature, index) => (
                    <div
                      key={`${plan.id}-feature-${index}`}
                      className={cn(
                        'flex items-start gap-3',
                        compact ? 'text-xs' : 'text-sm'
                      )}
                    >
                      {feature.included ? (
                        <Check className={cn(
                          'flex-shrink-0 text-green-500',
                          compact ? 'h-4 w-4' : 'h-5 w-5'
                        )} />
                      ) : (
                        <X className={cn(
                          'flex-shrink-0 text-gray-300',
                          compact ? 'h-4 w-4' : 'h-5 w-5'
                        )} />
                      )}
                      <span className={cn(
                        feature.highlight ? 'font-semibold text-gray-900' : 'text-gray-700',
                        !feature.included && 'text-gray-400 line-through'
                      )}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                {showCTA && (
                  <Button
                    className={cn(
                      'w-full mt-6',
                      plan.popular && 'bg-purple-600 hover:bg-purple-700 text-white'
                    )}
                    variant={plan.popular ? 'default' : 'outline'}
                    size={compact ? 'default' : 'lg'}
                    onClick={() => onSelectPlan?.(plan.id)}
                  >
                    {plan.cta ?? (plan.price === 0 ? 'Comenzar gratis' : 'Activar plan')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

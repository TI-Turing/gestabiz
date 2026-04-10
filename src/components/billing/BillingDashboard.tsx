/**
 * BillingDashboard Component
 *
 * Dashboard principal de facturación.
 * - Con plan activo: muestra estado del plan, uso y pagos recientes.
 * - Sin plan activo: muestra opción Free + comparativa Básico/Pro.
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useBillingPlan } from '@/hooks/useBillingPlan'
import { useFreeTrial } from '@/hooks/useFreeTrial'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Mail,
  MessageSquare,
  Gift,
  Loader2,
} from 'lucide-react'
import { PricingPage } from '@/pages/PricingPage'
import { PRICING_PLANS } from '@/lib/pricingPlans'

interface BillingDashboardProps {
  businessId: string
  ownerId: string
}

interface RecentPayment {
  id: string
  created_at: string
  amount: number
  status: string
  payment_gateway: string | null
}

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  inicio: 'Plan Básico',
  profesional: 'Plan Pro',
  empresarial: 'Plan Empresarial',
  free: 'Plan Gratis',
}

function getPlanDisplayName(planType: string): string {
  return PLAN_DISPLAY_NAMES[planType] ?? planType
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getStatusBadge(status: string) {
  if (status === 'active' || status === 'trialing') {
    return <Badge className="bg-emerald-500 text-white">Activo</Badge>
  }
  if (status === 'canceled') {
    return <Badge className="bg-destructive text-white">Cancelado</Badge>
  }
  if (status === 'expired') {
    return <Badge className="bg-muted text-foreground">Expirado</Badge>
  }
  if (status === 'past_due') {
    return <Badge className="bg-amber-500 text-black">Pago vencido</Badge>
  }
  return <Badge className="bg-muted text-foreground">{status}</Badge>
}

export function BillingDashboard({ businessId, ownerId }: Readonly<BillingDashboardProps>) {
  const { plan, usage, isLoading, cancelPlan, refetch } = useBillingPlan(businessId)
  const trial = useFreeTrial(businessId, ownerId, refetch, plan)

  const [showPricingPage, setShowPricingPage] = useState(false)
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [showFreeTrialConfirmation, setShowFreeTrialConfirmation] = useState(false)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [loadingBusinessName, setLoadingBusinessName] = useState(true)

  // Fetch recent payments when there is an active plan
  useEffect(() => {
    const hasActivePlan = plan && (plan.status === 'active' || plan.status === 'trialing' || plan.status === 'canceled')
    if (!hasActivePlan) return

    let cancelled = false
    setPaymentsLoading(true)

    supabase
      .from('subscription_payments')
      .select('id, created_at, amount, status, payment_gateway')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (!cancelled) {
          if (!error && data) {
            setRecentPayments(data as RecentPayment[])
          }
          setPaymentsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [businessId, plan])

  // Fetch business name
  useEffect(() => {
    let cancelled = false
    setLoadingBusinessName(true)

    supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single()
      .then(({ data, error }) => {
        if (!cancelled) {
          if (!error && data) {
            setBusinessName(data.name)
          }
          setLoadingBusinessName(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [businessId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  // Show pricing page inline
  if (showPricingPage) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setShowPricingPage(false)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Dashboard
        </Button>
        <PricingPage businessId={businessId} onClose={() => setShowPricingPage(false)} />
      </div>
    )
  }

  const hasActivePlan = plan && (plan.status === 'active' || plan.status === 'trialing')

  // ─── NO active plan: show Free + plan comparison ─────────────────────────
  if (!hasActivePlan) {
    const freePlan = PRICING_PLANS.find((p) => p.id === 'free')!
    const basicoPlan = PRICING_PLANS.find((p) => p.id === 'basico')!
    const proPlan = PRICING_PLANS.find((p) => p.id === 'pro')!

    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Facturación</h2>
          <p className="text-muted-foreground">Administra tu suscripción y métodos de pago</p>
        </div>

        {/* Free trial banner */}
        {trial.isEligible && (
          <Card className="border-2 border-primary bg-primary/5 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Gift className="h-5 w-5" />
                1 Mes Gratis — Plan Básico
              </CardTitle>
              <CardDescription>
                Prueba todas las funciones del Plan Básico sin costo. Disponible una sola vez por usuario.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {trial.error && (
                <p className="text-sm text-destructive">{trial.error}</p>
              )}
              <Button
                onClick={() => setShowFreeTrialConfirmation(true)}
                disabled={trial.isActivating}
                className="w-full sm:w-auto"
              >
                {trial.isActivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Activar Mes Gratis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current plan: Free */}
        <Card className="border border-primary/20 shadow-sm bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Plan Free — Activo
            </CardTitle>
            <CardDescription>{freePlan.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Lo que incluye:</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {freePlan.features
                  .filter((f) => f.included)
                  .map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      {f.name}
                    </li>
                  ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Plan comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Plan Básico */}
          <Card className="relative border border-border/70 bg-card/95 shadow-sm">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                Más Popular
              </span>
            </div>
            <CardHeader className="pt-6">
              <CardTitle>{basicoPlan.name}</CardTitle>
              <CardDescription>{basicoPlan.description}</CardDescription>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-bold">
                  ${basicoPlan.price.toLocaleString('es-CO')}
                </span>
                <span className="text-muted-foreground text-sm">/mes</span>
                <p className="text-xs text-primary/80 mt-1">
                  ${basicoPlan.priceAnnual.toLocaleString('es-CO')}/año (2 meses gratis)
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5 text-sm">
                {basicoPlan.features
                  .filter((f) => f.included)
                  .slice(0, 6)
                  .map((f, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2 ${
                        f.highlight ? 'font-semibold text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f.name}
                    </li>
                  ))}
              </ul>
              <Button onClick={() => setShowPricingPage(true)} className="w-full mt-4">
                Activar Plan Básico
              </Button>
            </CardContent>
          </Card>

          {/* Plan Pro */}
          <Card className="border border-border/70 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>{proPlan.name}</CardTitle>
              <CardDescription>{proPlan.description}</CardDescription>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-bold">
                  ${proPlan.price.toLocaleString('es-CO')}
                </span>
                <span className="text-muted-foreground text-sm">/mes</span>
                <p className="text-xs text-primary/80 mt-1">
                  ${proPlan.priceAnnual.toLocaleString('es-CO')}/año (2 meses gratis)
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5 text-sm">
                {proPlan.features
                  .filter((f) => f.included)
                  .slice(0, 6)
                  .map((f, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2 ${
                        f.highlight ? 'font-semibold text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f.name}
                    </li>
                  ))}
              </ul>
              <Button
                variant="outline"
                onClick={() => setShowPricingPage(true)}
                className="w-full mt-4"
              >
                Activar Plan Pro
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Free Trial Confirmation Dialog */}
        <AlertDialog open={showFreeTrialConfirmation} onOpenChange={(open) => { if (!trial.isActivating) setShowFreeTrialConfirmation(open) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Activar Mes Gratis
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 pt-2">
                <div>
                  <p className="font-medium text-foreground">
                    Este mes gratis se aplicará al negocio:
                  </p>
                  <p className="text-primary font-semibold mt-1">
                    {loadingBusinessName ? '...' : businessName || 'Negocio'}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">Importante:</span> Solo puedes utilizar el mes gratis una sola vez. 
                    Después de vencer, deberás activar un plan de pago para mantener el acceso.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  ¿Deseas proceder con la activación?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel disabled={trial.isActivating}>Cancelar</AlertDialogCancel>
              <Button
                onClick={async () => {
                  await trial.activateFreeTrial()
                  setShowFreeTrialConfirmation(false)
                }}
                disabled={trial.isActivating}
                className="bg-primary hover:bg-primary/90"
              >
                {trial.isActivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Activar
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // ─── CANCELED plan: show summary + reactivate button ─────────────────────
  if (plan.status === 'canceled') {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Facturación</h2>
          <p className="text-muted-foreground">Administra tu suscripción y métodos de pago</p>
        </div>

        <Card className="border border-destructive/30 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              {getPlanDisplayName(plan.plan_type)}
              <span className="ml-2">{getStatusBadge(plan.status)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80">
                Plan cancelado — acceso hasta{' '}
                <strong>{formatDateLong(plan.end_date)}</strong>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Fecha de inicio</p>
                <p className="font-medium">{formatDateLong(plan.start_date)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha de vencimiento</p>
                <p className="font-medium">{formatDateLong(plan.end_date)}</p>
              </div>
            </div>
            <Button onClick={() => setShowPricingPage(true)} className="w-full sm:w-auto">
              Reactivar Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── ACTIVE / TRIALING plan ───────────────────────────────────────────────
  const handleCancelPlan = async () => {
    const endDateFormatted = formatDateLong(plan.end_date)
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres cancelar el plan? Tendrás acceso hasta ${endDateFormatted}.`
    )
    if (!confirmed) return

    try {
      await cancelPlan()
      refetch()
    } catch (err) {
      window.alert('Error al cancelar el plan. Por favor intenta de nuevo.')
    }
  }

  const planBorderColor =
    plan.status === 'active'
      ? 'border-emerald-400/70'
      : plan.status === 'trialing'
        ? 'border-primary/30'
        : 'border-border'

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Facturación</h2>
        <p className="text-muted-foreground">Administra tu suscripción y métodos de pago</p>
      </div>

      {/* Main plan card */}
      <Card className={`border-2 ${planBorderColor} bg-card/95 shadow-sm`}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">
                {getPlanDisplayName(plan.plan_type)}
              </CardTitle>
              {getStatusBadge(plan.status)}
            </div>
            <span className="text-sm text-muted-foreground">
              {plan.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trial active alert */}
          {plan.status === 'trialing' && (
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <p className="text-sm font-medium">Mes gratuito activo</p>
                <p className="text-sm text-foreground/80">
                  Tu período gratuito vence el{' '}
                  <strong>{formatDateLong(plan.end_date)}</strong>
                  {trial.daysRemaining !== null && (
                    <span className="ml-1 text-primary font-semibold">
                      ({trial.daysRemaining} {trial.daysRemaining === 1 ? 'día' : 'días'} restantes)
                    </span>
                  )}
                  . Activa un plan de pago para no perder el acceso.
                </p>
                <Button size="sm" className="mt-1" onClick={() => setShowPricingPage(true)}>
                  Activar Plan Básico
                </Button>
              </div>
            </div>
          )}

          {/* Canceled alert */}
          {plan.canceled_at && (
            <div className="rounded-2xl bg-accent/10 border border-accent/20 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80">
                Plan cancelado — acceso hasta{' '}
                <strong>{formatDateLong(plan.end_date)}</strong>
              </p>
            </div>
          )}

          {/* Dates grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground">Fecha de inicio</p>
                <p className="font-medium">{formatDateLong(plan.start_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground">Fecha de vencimiento</p>
                <p className="font-medium">{formatDateLong(plan.end_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground">Días restantes</p>
                <p className="font-medium">
                  {usage !== null ? `${usage.daysRemaining} días` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {!plan.canceled_at && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => setShowPricingPage(true)} variant="outline">
                Cambiar Plan
              </Button>
              <Button
                onClick={handleCancelPlan}
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
              >
                Cancelar Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/70 bg-card/95">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas este período</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {usage !== null ? usage.appointmentsThisPeriod : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              citas reservadas desde que inició el plan
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/95">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recordatorios por email</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {usage !== null ? usage.emailsSent : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">emails enviados</p>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/95">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recordatorios WhatsApp</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {usage !== null ? usage.whatsappSent : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">mensajes WhatsApp enviados</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment history */}
      <Card className="border border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle>Historial de pagos</CardTitle>
          <CardDescription>Tus últimos 10 pagos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : recentPayments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No hay pagos registrados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left pb-2 pr-4 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left pb-2 pr-4 font-medium text-muted-foreground">Monto</th>
                    <th className="text-left pb-2 pr-4 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left pb-2 font-medium text-muted-foreground">Gateway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="py-3 pr-4">
                        {new Date(payment.created_at).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 pr-4 font-medium">
                        ${(payment.amount ?? 0).toLocaleString('es-CO')} COP
                      </td>
                      <td className="py-3 pr-4">
                        {payment.status === 'completed' ? (
                          <span className="flex items-center gap-1.5 text-emerald-500">
                            <CheckCircle className="h-4 w-4" />
                            Completado
                          </span>
                        ) : payment.status === 'failed' ? (
                          <span className="flex items-center gap-1.5 text-destructive">
                            <XCircle className="h-4 w-4" />
                            Fallido
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-amber-500">
                            <Clock className="h-4 w-4" />
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-3 capitalize text-muted-foreground">
                        {payment.payment_gateway ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}

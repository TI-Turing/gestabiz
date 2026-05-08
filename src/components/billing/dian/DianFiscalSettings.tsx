import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { supabase } from '@/lib/supabase'
import { usePlanFeatures } from '@/hooks/usePlanFeatures'
import { planIncludes } from '@/lib/pricingPlans'
import { DianEnrollmentWizard } from './DianEnrollmentWizard'
import {
  Certificate,
  FileText,
  CheckCircle,
  Warning,
  Lock,
  ArrowRight,
  Spinner,
  Buildings,
} from '@phosphor-icons/react'

interface DianFiscalSettingsProps {
  businessId: string
}

interface DianSoftwareRow {
  id: string
  business_id: string
  environment: 'sandbox' | 'production'
  is_enrolled: boolean
  enrolled_at: string | null
  certificate_expires_at: string | null
}

interface DianResolutionRow {
  id: string
  resolution_number: string
  prefix: string | null
  from_number: number
  to_number: number
  current_number: number
  valid_from: string
  valid_to: string
  is_active: boolean
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function resolutionRangePercent(row: DianResolutionRow): number {
  const total = row.to_number - row.from_number
  if (total <= 0) return 100
  return Math.round(((row.current_number - row.from_number) / total) * 100)
}

export function DianFiscalSettings({ businessId }: DianFiscalSettingsProps) {
  const [wizardOpen, setWizardOpen] = useState(false)
  const { planId, isLoading: planLoading } = usePlanFeatures(businessId)

  const isPro = planIncludes(planId, 'pro')

  const { data: software, isLoading: softwareLoading } = useQuery({
    queryKey: ['dian-software', businessId],
    queryFn: async () => {
      const { data } = await (supabase.from('business_dian_software') as unknown as {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: DianSoftwareRow | null }>
          }
        }
      })
        .select('id, business_id, environment, is_enrolled, enrolled_at, certificate_expires_at')
        .eq('business_id', businessId)
        .maybeSingle()
      return data
    },
    enabled: isPro,
    staleTime: 1000 * 60 * 5,
  })

  const { data: resolution } = useQuery({
    queryKey: ['dian-resolution-active', businessId],
    queryFn: async () => {
      const { data } = await (supabase.from('business_dian_resolution') as unknown as {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            eq: (col: string, val: boolean) => {
              maybeSingle: () => Promise<{ data: DianResolutionRow | null }>
            }
          }
        }
      })
        .select('id, resolution_number, prefix, from_number, to_number, current_number, valid_from, valid_to, is_active')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .maybeSingle()
      return data
    },
    enabled: isPro && !!software?.is_enrolled,
    staleTime: 1000 * 60 * 5,
  })

  if (planLoading || softwareLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Spinner size={22} className="animate-spin mr-2" />
        Cargando configuración fiscal...
      </div>
    )
  }

  if (!isPro) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
          <div className="p-3 rounded-full bg-muted">
            <Lock size={28} className="text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-base mb-1">Facturación Electrónica DIAN</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              La habilitación ante la DIAN y la emisión de facturas electrónicas están disponibles
              en los planes <strong>Pro</strong> y <strong>Empresarial</strong>.
            </p>
          </div>
          <Button variant="default" size="sm" onClick={() => window.location.href = '/app/admin/billing'}>
            Ver planes
            <ArrowRight size={14} className="ml-1" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!software?.is_enrolled) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                <Certificate size={22} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Habilitar Facturación Electrónica</CardTitle>
                <CardDescription className="mt-1">
                  Completa el proceso de habilitación ante la DIAN para emitir facturas electrónicas,
                  POS electrónico y notas crédito desde Gestabiz.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { icon: Buildings, label: 'Datos del negocio', desc: 'NIT, razón social, CIIU' },
                { icon: FileText, label: 'Resolución DIAN', desc: 'Número, prefijo y rango' },
                { icon: Certificate, label: 'Certificado digital', desc: 'Archivo .p12 de la ECD' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex gap-3 p-3 rounded-lg bg-muted/40">
                  <Icon size={18} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <PermissionGate permission="billing.dian_enroll" businessId={businessId} mode="disable">
              <Button onClick={() => setWizardOpen(true)} className="w-full sm:w-auto">
                <Certificate size={16} className="mr-2" />
                Iniciar habilitación
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>

        {wizardOpen && (
          <DianEnrollmentWizard
            businessId={businessId}
            onComplete={() => setWizardOpen(false)}
            onCancel={() => setWizardOpen(false)}
          />
        )}
      </>
    )
  }

  // Enrolled — show status dashboard
  const certDays = software.certificate_expires_at ? daysUntil(software.certificate_expires_at) : null
  const resDays = resolution ? daysUntil(resolution.valid_to) : null
  const rangePercent = resolution ? resolutionRangePercent(resolution) : null

  const certStatus = certDays === null ? 'ok' : certDays <= 0 ? 'expired' : certDays <= 30 ? 'warning' : 'ok'
  const resStatus = resDays === null ? 'ok' : resDays <= 0 ? 'expired' : resDays <= 30 ? 'warning' : rangePercent !== null && rangePercent >= 90 ? 'warning' : 'ok'

  return (
    <>
      <div className="space-y-4">
        {/* Status header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                <CardTitle className="text-base">Habilitado ante la DIAN</CardTitle>
              </div>
              <Badge variant={software.environment === 'production' ? 'default' : 'secondary'}>
                {software.environment === 'production' ? 'Producción' : 'Sandbox'}
              </Badge>
            </div>
            {software.enrolled_at && (
              <CardDescription>
                Habilitado el {new Date(software.enrolled_at).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Resolution status */}
        {resolution ? (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Resolución de numeración</CardTitle>
                {resStatus !== 'ok' && (
                  <Warning size={16} className={resStatus === 'expired' ? 'text-red-500' : 'text-amber-500'} />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Resolución</span>
                <span className="font-mono font-medium text-foreground">{resolution.resolution_number}</span>
              </div>
              {resolution.prefix && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Prefijo</span>
                  <span className="font-mono font-medium text-foreground">{resolution.prefix}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Rango</span>
                <span className="font-mono font-medium text-foreground">
                  {resolution.current_number.toLocaleString()} / {resolution.to_number.toLocaleString()}
                </span>
              </div>
              {rangePercent !== null && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${rangePercent >= 90 ? 'bg-amber-500' : 'bg-primary'}`}
                      style={{ width: `${rangePercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{rangePercent}% consumido</p>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Vigencia</span>
                <span className={`font-medium ${resDays !== null && resDays <= 30 ? 'text-amber-600' : resDays !== null && resDays <= 0 ? 'text-red-600' : 'text-foreground'}`}>
                  {resDays !== null
                    ? resDays <= 0
                      ? 'Vencida'
                      : `${resDays} días restantes`
                    : new Date(resolution.valid_to).toLocaleDateString('es-CO')}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20">
            <CardContent className="py-4 flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400">
              <Warning size={18} />
              No hay resolución de numeración activa. Actualiza tu configuración para continuar emitiendo facturas.
            </CardContent>
          </Card>
        )}

        {/* Certificate status */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Certificado digital</CardTitle>
              {certStatus !== 'ok' && (
                <Warning size={16} className={certStatus === 'expired' ? 'text-red-500' : 'text-amber-500'} />
              )}
            </div>
          </CardHeader>
          <CardContent className="text-sm">
            {certDays !== null ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Vencimiento</span>
                <span className={`font-medium ${certDays <= 0 ? 'text-red-600' : certDays <= 30 ? 'text-amber-600' : 'text-foreground'}`}>
                  {certDays <= 0
                    ? 'Vencido'
                    : certDays <= 30
                    ? `Vence en ${certDays} días`
                    : new Date(software.certificate_expires_at!).toLocaleDateString('es-CO')}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground">Sin fecha de vencimiento registrada</p>
            )}
          </CardContent>
        </Card>

        {/* Re-configure button */}
        <PermissionGate permission="billing.dian_enroll" businessId={businessId} mode="hide">
          <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)}>
            <Certificate size={14} className="mr-2" />
            Actualizar configuración DIAN
          </Button>
        </PermissionGate>
      </div>

      {wizardOpen && (
        <DianEnrollmentWizard
          businessId={businessId}
          onComplete={() => setWizardOpen(false)}
          onCancel={() => setWizardOpen(false)}
        />
      )}
    </>
  )
}

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Buildings,
  Certificate,
  CloudArrowUp,
  CheckCircle,
  Warning,
  ArrowLeft,
  ArrowRight,
  Spinner,
  Link as LinkIcon,
  Lock,
} from '@phosphor-icons/react'

const TAX_RESPONSIBILITIES = [
  { code: 'O-13', label: 'Gran contribuyente' },
  { code: 'O-15', label: 'Autorretenedor' },
  { code: 'O-23', label: 'Agente de retención IVA' },
  { code: 'O-47', label: 'Régimen simple de tributación' },
  { code: 'R-99-PN', label: 'No responsable de IVA (persona natural)' },
]

interface WizardData {
  // Step 1 - Business data
  nit: string
  dv: string
  legalName: string
  typeOrganizationId: '1' | '2' | ''
  ciiuCode: string
  municipalityCode: string
  taxResponsibilities: string[]
  // Step 2 - Resolution
  resolutionNumber: string
  prefix: string
  fromNumber: string
  toNumber: string
  validFrom: string
  validTo: string
  technicalKey: string
  // Step 3 - Matias API
  environment: 'sandbox' | 'production'
  matiasToken: string
  useOwnSoftware: boolean
  ownSoftwareId: string
  ownSoftwarePin: string
  // Step 4 - Certificate
  certificateFile: File | null
  certificatePassword: string
  // Step 5 - Test result
  testPassed: boolean | null
}

const INITIAL_DATA: WizardData = {
  nit: '', dv: '', legalName: '', typeOrganizationId: '', ciiuCode: '',
  municipalityCode: '', taxResponsibilities: [],
  resolutionNumber: '', prefix: '', fromNumber: '', toNumber: '',
  validFrom: '', validTo: '', technicalKey: '',
  environment: 'sandbox', matiasToken: '', useOwnSoftware: false,
  ownSoftwareId: '', ownSoftwarePin: '',
  certificateFile: null, certificatePassword: '',
  testPassed: null,
}

interface Props {
  businessId: string
  onComplete: () => void
  onCancel: () => void
}

export function DianEnrollmentWizard({ businessId, onComplete, onCancel }: Readonly<Props>) {
  const { t } = useLanguage()
  const [step, setStep] = useState(1)
  const TOTAL_STEPS = 5
  const [data, setData] = useState<WizardData>(INITIAL_DATA)
  const [loading, setLoading] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)

  const update = (patch: Partial<WizardData>) => setData(prev => ({ ...prev, ...patch }))

  const toggleResponsibility = (code: string) => {
    update({
      taxResponsibilities: data.taxResponsibilities.includes(code)
        ? data.taxResponsibilities.filter(r => r !== code)
        : [...data.taxResponsibilities, code],
    })
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(s => s + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1)
  }

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = (reader.result as string).split(',')[1] ?? ''
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleTestConnection = async () => {
    setLoading(true)
    setTestError(null)
    try {
      let certificateBase64 = ''
      if (data.certificateFile) {
        certificateBase64 = await readFileAsBase64(data.certificateFile)
      }

      const { data: result, error } = await supabase.functions.invoke('dian-enroll-business', {
        body: {
          businessId,
          environment: data.environment,
          matiasToken: data.matiasToken,
          nit: data.nit,
          dv: parseInt(data.dv, 10),
          legalName: data.legalName,
          typeOrganizationId: parseInt(data.typeOrganizationId || '2', 10),
          ciiuCode: data.ciiuCode,
          municipalityCode: data.municipalityCode,
          taxResponsibilities: data.taxResponsibilities,
          certificateBase64,
          certificatePassword: data.certificatePassword,
          resolution: {
            number: data.resolutionNumber,
            prefix: data.prefix || null,
            fromNumber: parseInt(data.fromNumber, 10),
            toNumber: parseInt(data.toNumber, 10),
            validFrom: data.validFrom,
            validTo: data.validTo,
            technicalKey: data.technicalKey,
          },
          useOwnSoftware: data.useOwnSoftware,
          ownSoftwareId: data.useOwnSoftware ? data.ownSoftwareId : null,
          ownSoftwarePin: data.useOwnSoftware ? data.ownSoftwarePin : null,
        },
      })

      if (error || result?.error) {
        throw new Error(result?.error || error?.message || 'Error desconocido')
      }

      update({ testPassed: true })
      toast.success(t('electronicBilling.wizard.connectionSuccess'))
    } catch (err) {
      update({ testPassed: false })
      const msg = err instanceof Error ? err.message : 'Error de conexión'
      setTestError(msg)
      toast.error(t('electronicBilling.wizard.connectionError'))
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      // If certificate file present, upload it first
      if (data.certificateFile) {
        const path = `${businessId}/certificate.p12`
        const { error: uploadError } = await supabase.storage
          .from('electronic-invoices')
          .upload(path, data.certificateFile, { upsert: true })
        if (uploadError) throw uploadError
      }

      toast.success('¡Habilitación DIAN completada!')
      onComplete()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al finalizar')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'h-11 bg-background border-border focus-visible:ring-primary'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">
            {t('electronicBilling.wizard.step')
              .replace('{{current}}', String(step))
              .replace('{{total}}', String(TOTAL_STEPS))}
          </p>
          <Badge variant="outline">{Math.round((step / TOTAL_STEPS) * 100)}%</Badge>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t(`electronicBilling.wizard.steps.${getStepKey(step)}.title`)}
          </CardTitle>
          <CardDescription>
            {t(`electronicBilling.wizard.steps.${getStepKey(step)}.description`)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* STEP 1 — Business data */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    {t('electronicBilling.wizard.steps.businessData.nit')} *
                  </label>
                  <Input
                    value={data.nit}
                    onChange={e => update({ nit: e.target.value })}
                    placeholder="900123456"
                    className={inputClass}
                  />
                </div>
                <div className="w-24">
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    {t('electronicBilling.wizard.steps.businessData.dv')} *
                  </label>
                  <Input
                    value={data.dv}
                    onChange={e => update({ dv: e.target.value })}
                    placeholder="7"
                    maxLength={1}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  {t('electronicBilling.wizard.steps.businessData.legalName')} *
                </label>
                <Input
                  value={data.legalName}
                  onChange={e => update({ legalName: e.target.value })}
                  placeholder="Mi Empresa S.A.S."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  {t('electronicBilling.wizard.steps.businessData.typeOrganization')} *
                </label>
                <div className="flex gap-3">
                  {[
                    { value: '2', label: t('electronicBilling.wizard.steps.businessData.typeOrganizationNatural') },
                    { value: '1', label: t('electronicBilling.wizard.steps.businessData.typeOrganizationJuridica') },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="typeOrg"
                        value={opt.value}
                        checked={data.typeOrganizationId === opt.value}
                        onChange={() => update({ typeOrganizationId: opt.value as '1' | '2' })}
                        className="accent-primary"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    {t('electronicBilling.wizard.steps.businessData.ciiu')} *
                  </label>
                  <Input
                    value={data.ciiuCode}
                    onChange={e => update({ ciiuCode: e.target.value })}
                    placeholder="9602"
                    maxLength={4}
                    className={inputClass}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('electronicBilling.wizard.steps.businessData.ciiuHelp')}
                  </p>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    {t('electronicBilling.wizard.steps.businessData.municipalityCode')} *
                  </label>
                  <Input
                    value={data.municipalityCode}
                    onChange={e => update({ municipalityCode: e.target.value })}
                    placeholder="11001"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t('electronicBilling.wizard.steps.businessData.taxResponsibilities')}
                </label>
                <div className="space-y-2">
                  {TAX_RESPONSIBILITIES.map(r => (
                    <label key={r.code} className="flex items-center gap-3 cursor-pointer group">
                      <Checkbox
                        checked={data.taxResponsibilities.includes(r.code)}
                        onCheckedChange={() => toggleResponsibility(r.code)}
                      />
                      <span className="text-sm group-hover:text-foreground text-muted-foreground">
                        <span className="font-mono text-xs bg-muted px-1 rounded mr-1">{r.code}</span>
                        {r.label}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('electronicBilling.wizard.steps.businessData.taxResponsibilitiesHelp')}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2 — Resolution */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
                {t('electronicBilling.wizard.steps.resolution.helpText')}
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    {t('electronicBilling.wizard.steps.resolution.resolutionNumber')} *
                  </label>
                  <Input
                    value={data.resolutionNumber}
                    onChange={e => update({ resolutionNumber: e.target.value })}
                    placeholder="18764XXXXXXXXX"
                    className={inputClass}
                  />
                </div>
                <div className="w-32">
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    {t('electronicBilling.wizard.steps.resolution.prefix')}
                  </label>
                  <Input
                    value={data.prefix}
                    onChange={e => update({ prefix: e.target.value })}
                    placeholder="FE"
                    maxLength={10}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    {t('electronicBilling.wizard.steps.resolution.fromNumber')} *
                  </label>
                  <Input
                    type="number"
                    value={data.fromNumber}
                    onChange={e => update({ fromNumber: e.target.value })}
                    placeholder="1"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    {t('electronicBilling.wizard.steps.resolution.toNumber')} *
                  </label>
                  <Input
                    type="number"
                    value={data.toNumber}
                    onChange={e => update({ toNumber: e.target.value })}
                    placeholder="5000"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    {t('electronicBilling.wizard.steps.resolution.validFrom')} *
                  </label>
                  <Input
                    type="date"
                    value={data.validFrom}
                    onChange={e => update({ validFrom: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    {t('electronicBilling.wizard.steps.resolution.validTo')} *
                  </label>
                  <Input
                    type="date"
                    value={data.validTo}
                    onChange={e => update({ validTo: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  {t('electronicBilling.wizard.steps.resolution.technicalKey')} *
                </label>
                <Input
                  value={data.technicalKey}
                  onChange={e => update({ technicalKey: e.target.value })}
                  placeholder="Clave técnica de 96 caracteres"
                  className={inputClass}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('electronicBilling.wizard.steps.resolution.technicalKeyHelp')}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3 — Matias API token */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t('electronicBilling.wizard.steps.software.environment')} *
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'sandbox', label: t('electronicBilling.wizard.steps.software.sandbox') },
                    { value: 'production', label: t('electronicBilling.wizard.steps.software.production') },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="env"
                        value={opt.value}
                        checked={data.environment === opt.value}
                        onChange={() => update({ environment: opt.value as 'sandbox' | 'production' })}
                        className="accent-primary"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  {t('electronicBilling.wizard.steps.software.matiasToken')} *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    value={data.matiasToken}
                    onChange={e => update({ matiasToken: e.target.value })}
                    placeholder="mat_pat_xxxxxxxxxxxxxxxx"
                    className={`${inputClass} pl-9`}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('electronicBilling.wizard.steps.software.matiasTokenHelp')}
                  {' '}
                  <a
                    href="https://app.matias-api.com/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline inline-flex items-center gap-1"
                  >
                    {t('electronicBilling.wizard.steps.software.matiasLink')}
                    <LinkIcon size={12} />
                  </a>
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={data.useOwnSoftware}
                    onCheckedChange={v => update({ useOwnSoftware: !!v })}
                  />
                  <span className="text-sm font-medium">
                    {t('electronicBilling.wizard.steps.software.useOwnSoftware')}
                  </span>
                </label>
              </div>

              {data.useOwnSoftware && (
                <div className="space-y-3 pl-4 border-l-2 border-border">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      {t('electronicBilling.wizard.steps.software.ownSoftwareId')}
                    </label>
                    <Input
                      value={data.ownSoftwareId}
                      onChange={e => update({ ownSoftwareId: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      {t('electronicBilling.wizard.steps.software.ownSoftwarePin')}
                    </label>
                    <Input
                      type="password"
                      value={data.ownSoftwarePin}
                      onChange={e => update({ ownSoftwarePin: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('electronicBilling.wizard.steps.software.ownSoftwareHelp')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Certificate */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
                {t('electronicBilling.wizard.steps.certificate.helpText')}
                {' '}
                <a
                  href="https://www.gse.com.co/certificados-digitales/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  {t('electronicBilling.wizard.steps.certificate.freeOption')}
                </a>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t('electronicBilling.wizard.steps.certificate.uploadLabel')}
                </label>
                <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors">
                  <CloudArrowUp size={24} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {data.certificateFile ? data.certificateFile.name : t('electronicBilling.wizard.steps.certificate.uploadButton')}
                    </p>
                    {!data.certificateFile && (
                      <p className="text-xs text-muted-foreground">.p12 · máx 5 MB</p>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".p12,.pfx"
                    className="hidden"
                    onChange={e => update({ certificateFile: e.target.files?.[0] ?? null })}
                  />
                </label>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  {t('electronicBilling.wizard.steps.certificate.passwordLabel')}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    value={data.certificatePassword}
                    onChange={e => update({ certificatePassword: e.target.value })}
                    placeholder="Contraseña del certificado"
                    className={`${inputClass} pl-9`}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('electronicBilling.wizard.steps.certificate.passwordHelp')}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                <Certificate size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {t('electronicBilling.wizard.steps.certificate.securityNote')}
                </p>
              </div>
            </div>
          )}

          {/* STEP 5 — Test */}
          {step === 5 && (
            <div className="space-y-4">
              {data.testPassed === null && (
                <div className="text-center py-6 space-y-4">
                  <Buildings size={48} className="mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t('electronicBilling.wizard.steps.test.description')}
                  </p>
                  <Button
                    onClick={handleTestConnection}
                    disabled={loading}
                    variant="outline"
                    className="gap-2"
                  >
                    {loading ? (
                      <><Spinner className="animate-spin" size={16} /> {t('electronicBilling.wizard.testing')}</>
                    ) : (
                      t('electronicBilling.wizard.testConnection')
                    )}
                  </Button>
                </div>
              )}

              {data.testPassed === true && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle size={24} className="text-green-600 dark:text-green-400 shrink-0" />
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      {t('electronicBilling.wizard.steps.test.success')}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                    <p className="text-sm font-medium">{t('electronicBilling.wizard.steps.test.whatNext')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('electronicBilling.wizard.steps.test.whatNextDesc')}
                    </p>
                  </div>
                </div>
              )}

              {data.testPassed === false && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <Warning size={20} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        {t('electronicBilling.wizard.steps.test.error')}
                      </p>
                      {testError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {t('electronicBilling.wizard.steps.test.errorDetails')} {testError}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleTestConnection}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {loading ? <Spinner className="animate-spin" size={14} /> : null}
                    {t('electronicBilling.wizard.testConnection')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="ghost"
          onClick={step === 1 ? onCancel : handleBack}
          disabled={loading}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          {step === 1 ? 'Cancelar' : t('electronicBilling.wizard.back')}
        </Button>

        {step < TOTAL_STEPS ? (
          <Button onClick={handleNext} className="gap-2">
            {t('electronicBilling.wizard.next')}
            <ArrowRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={loading || data.testPassed !== true}
            className="gap-2"
          >
            {loading ? <Spinner className="animate-spin" size={16} /> : <CheckCircle size={16} />}
            {t('electronicBilling.wizard.finish')}
          </Button>
        )}
      </div>
    </div>
  )
}

function getStepKey(step: number): string {
  const keys = ['businessData', 'resolution', 'software', 'certificate', 'test']
  return keys[step - 1] ?? 'businessData'
}

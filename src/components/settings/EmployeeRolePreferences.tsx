/**
 * Preferencias específicas del rol Empleado dentro de CompleteUnifiedSettings.
 */
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import {
  UserCircle,
  Bell,
  Briefcase,
  Plus,
  X,
  FloppyDisk as Save,
  CircleNotch as Loader2,
  Medal as Award,
  Translate as Languages,
  Link as LinkIcon,
  CurrencyDollar as DollarSign,
  Calendar,
  Warning as AlertCircle,
} from '@phosphor-icons/react'
import { useEmployeeProfile, type Certification } from '@/hooks/useEmployeeProfile'
import { supabase } from '@/lib/supabase'

interface EmployeeRolePreferencesProps {
  userId: string
  businessId?: string
}

export function EmployeeRolePreferences({ userId, businessId }: EmployeeRolePreferencesProps) {
  const { t } = useLanguage()
  const {
    profile,
    loading,
    updateProfile,
    addCertification,
    removeCertification,
    addSpecialization,
    removeSpecialization,
    addLanguage,
    removeLanguage,
  } = useEmployeeProfile(userId)

  const [professionalSummary, setProfessionalSummary] = useState('')
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0)
  const [preferredWorkType, setPreferredWorkType] = useState<'full_time' | 'part_time' | 'contract' | 'flexible'>('full_time')
  const [availableForHire, setAvailableForHire] = useState(true)
  const [expectedSalaryMin, setExpectedSalaryMin] = useState<number>(0)
  const [expectedSalaryMax, setExpectedSalaryMax] = useState<number>(0)
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')

  const [allowClientMessages, setAllowClientMessages] = useState(true)
  const [loadingMessagePref, setLoadingMessagePref] = useState(false)

  const [newSpecialization, setNewSpecialization] = useState('')
  const [newLanguage, setNewLanguage] = useState('')
  const [showCertificationForm, setShowCertificationForm] = useState(false)

  const [certName, setCertName] = useState('')
  const [certIssuer, setCertIssuer] = useState('')
  const [certIssueDate, setCertIssueDate] = useState('')
  const [certExpiryDate, setCertExpiryDate] = useState('')
  const [certCredentialId, setCertCredentialId] = useState('')
  const [certCredentialUrl, setCertCredentialUrl] = useState('')

  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setProfessionalSummary(profile.professional_summary || '')
      setYearsOfExperience(profile.years_of_experience || 0)
      setPreferredWorkType(profile.preferred_work_type || 'full_time')
      setAvailableForHire(profile.available_for_hire ?? true)
      setExpectedSalaryMin(profile.expected_salary_min || 0)
      setExpectedSalaryMax(profile.expected_salary_max || 0)
      setPortfolioUrl(profile.portfolio_url || '')
      setLinkedinUrl(profile.linkedin_url || '')
      setGithubUrl(profile.github_url || '')
    }
  }, [profile])

  useEffect(() => {
    const loadMessagePreference = async () => {
      if (!businessId) return
      try {
        const { data, error } = await supabase
          .from('business_employees')
          .select('allow_client_messages')
          .eq('employee_id', userId)
          .eq('business_id', businessId)
          .single()
        if (error) throw error
        setAllowClientMessages(data?.allow_client_messages ?? true)
      } catch {
        setAllowClientMessages(true)
      }
    }
    loadMessagePreference()
  }, [userId, businessId])

  const handleMessagePreferenceToggle = async (newValue: boolean) => {
    if (!businessId) {
      toast.error(t('settings.employeePrefs.messages.allowClientMessages.errorBusinessId'))
      return
    }
    setLoadingMessagePref(true)
    try {
      const { error } = await supabase
        .from('business_employees')
        .update({ allow_client_messages: newValue })
        .eq('employee_id', userId)
        .eq('business_id', businessId)
      if (error) throw error
      setAllowClientMessages(newValue)
      toast.success(
        newValue
          ? t('settings.employeePrefs.messages.allowClientMessages.successEnabled')
          : t('settings.employeePrefs.messages.allowClientMessages.successDisabled'),
      )
    } catch (error) {
      const err = error as Error
      toast.error(err.message || t('settings.employeePrefs.messages.allowClientMessages.error'))
      setAllowClientMessages(!newValue)
    } finally {
      setLoadingMessagePref(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setValidationError(null)

      if (professionalSummary.trim().length > 0 && professionalSummary.trim().length < 50) {
        setValidationError(t('settings.employeePrefs.professionalInfo.errors.summaryTooShort'))
        return
      }
      if (yearsOfExperience < 0 || yearsOfExperience > 50) {
        setValidationError(t('settings.employeePrefs.professionalInfo.errors.experienceRange'))
        return
      }
      if (expectedSalaryMin > 0 && expectedSalaryMax > 0 && expectedSalaryMin > expectedSalaryMax) {
        setValidationError(t('settings.employeePrefs.salary.errors.minGreaterThanMax'))
        return
      }

      await updateProfile({
        professional_summary: professionalSummary.trim() || undefined,
        years_of_experience: yearsOfExperience,
        preferred_work_type: preferredWorkType,
        available_for_hire: availableForHire,
        expected_salary_min: expectedSalaryMin > 0 ? expectedSalaryMin : undefined,
        expected_salary_max: expectedSalaryMax > 0 ? expectedSalaryMax : undefined,
        portfolio_url: portfolioUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        github_url: githubUrl.trim() || undefined,
      })
      toast.success(t('settings.employeePrefs.profileUpdateSuccess'))
    } catch (error) {
      const err = error as Error
      toast.error(err.message || t('settings.employeePrefs.profileUpdateError'))
    } finally {
      setSaving(false)
    }
  }

  const handleAddSpecialization = async () => {
    if (!newSpecialization.trim()) return
    try {
      await addSpecialization(newSpecialization.trim())
      setNewSpecialization('')
      toast.success(t('settings.employeePrefs.specializations.successAdd'))
    } catch (error) { toast.error((error as Error).message) }
  }

  const handleAddLanguage = async () => {
    if (!newLanguage.trim()) return
    try {
      await addLanguage(newLanguage.trim())
      setNewLanguage('')
      toast.success(t('settings.employeePrefs.languages.successAdd'))
    } catch (error) { toast.error((error as Error).message) }
  }

  const handleAddCertification = async () => {
    if (!certName.trim() || !certIssuer.trim() || !certIssueDate) {
      toast.error(t('settings.employeePrefs.certifications.requiredFields'))
      return
    }
    try {
      await addCertification({
        name: certName.trim(),
        issuer: certIssuer.trim(),
        issue_date: certIssueDate,
        expiry_date: certExpiryDate || undefined,
        credential_id: certCredentialId.trim() || undefined,
        credential_url: certCredentialUrl.trim() || undefined,
      })
      setCertName(''); setCertIssuer(''); setCertIssueDate(''); setCertExpiryDate('')
      setCertCredentialId(''); setCertCredentialUrl(''); setShowCertificationForm(false)
      toast.success(t('settings.employeePrefs.certifications.successAdd'))
    } catch (error) { toast.error((error as Error).message) }
  }

  const handleRemoveSpecialization = async (spec: string) => {
    try { await removeSpecialization(spec); toast.success(t('settings.employeePrefs.specializations.successRemove')) }
    catch (error) { toast.error((error as Error).message) }
  }

  const handleRemoveLanguage = async (lang: string) => {
    try { await removeLanguage(lang); toast.success(t('settings.employeePrefs.languages.successRemove')) }
    catch (error) { toast.error((error as Error).message) }
  }

  const handleRemoveCertification = async (certId: string) => {
    try { await removeCertification(certId); toast.success(t('settings.employeePrefs.certifications.successRemove')) }
    catch (error) { toast.error((error as Error).message) }
  }

  const formatSalary = (amount: number): string =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Disponibilidad y Horarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            {t('settings.employeePrefs.availability.title')}
          </CardTitle>
          <CardDescription>{t('settings.employeePrefs.availability.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">{t('settings.employeePrefs.availability.availableForHire.label')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.employeePrefs.availability.availableForHire.description')}</p>
            </div>
            <Switch checked={availableForHire} onCheckedChange={setAvailableForHire} />
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">{t('settings.employeePrefs.availability.notifyAssignments.label')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.employeePrefs.availability.notifyAssignments.description')}</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">{t('settings.employeePrefs.availability.reminders.label')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.employeePrefs.availability.reminders.description')}</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">{t('settings.employeePrefs.schedule.title')}</Label>
            <p className="text-sm text-muted-foreground">{t('settings.employeePrefs.schedule.description')}</p>
            <div className="space-y-2 mt-3">
              {[
                t('settings.employeePrefs.schedule.days.monday'),
                t('settings.employeePrefs.schedule.days.tuesday'),
                t('settings.employeePrefs.schedule.days.wednesday'),
                t('settings.employeePrefs.schedule.days.thursday'),
                t('settings.employeePrefs.schedule.days.friday'),
                t('settings.employeePrefs.schedule.days.saturday'),
                t('settings.employeePrefs.schedule.days.sunday'),
              ].map((day) => (
                <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                  <Switch defaultChecked={!day.includes('Domingo')} />
                  <span className="w-24 font-medium">{day}</span>
                  <div className="flex gap-2 flex-1">
                    {['09:00', '18:00'].map((defaultValue, i) => (
                      <Select key={i} defaultValue={defaultValue}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, h) => {
                            const hour = h.toString().padStart(2, '0')
                            return <SelectItem key={h} value={`${hour}:00`}>{hour}:00</SelectItem>
                          })}
                        </SelectContent>
                      </Select>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferencias de Mensajes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('settings.employeePrefs.messages.title')}
          </CardTitle>
          <CardDescription>{t('settings.employeePrefs.messages.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">{t('settings.employeePrefs.messages.allowClientMessages.label')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.employeePrefs.messages.allowClientMessages.description')}</p>
            </div>
            <Switch checked={allowClientMessages} onCheckedChange={handleMessagePreferenceToggle} disabled={loadingMessagePref} />
          </div>
        </CardContent>
      </Card>

      {/* Información Profesional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            {t('settings.employeePrefs.professionalInfo.title')}
          </CardTitle>
          <CardDescription>{t('settings.employeePrefs.professionalInfo.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="professional-summary">{t('settings.employeePrefs.professionalInfo.summaryLabel')}</Label>
            <Textarea
              id="professional-summary"
              value={professionalSummary}
              onChange={(e) => setProfessionalSummary(e.target.value)}
              placeholder={t('settings.employeePrefs.professionalInfo.summaryPlaceholder')}
              className="min-h-[120px] resize-y"
            />
            {professionalSummary.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('settings.employeePrefs.professionalInfo.minCharacters', { count: professionalSummary.length.toString() })}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="years-experience">{t('settings.employeePrefs.professionalInfo.yearsExperienceLabel')}</Label>
              <Input id="years-experience" type="number" min={0} max={50} value={yearsOfExperience} onChange={(e) => setYearsOfExperience(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-type">{t('settings.employeePrefs.professionalInfo.workTypeLabel')}</Label>
              <Select value={preferredWorkType} onValueChange={(v) => setPreferredWorkType(v as typeof preferredWorkType)}>
                <SelectTrigger id="work-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">{t('settings.employeePrefs.professionalInfo.workTypes.fullTime')}</SelectItem>
                  <SelectItem value="part_time">{t('settings.employeePrefs.professionalInfo.workTypes.partTime')}</SelectItem>
                  <SelectItem value="contract">{t('settings.employeePrefs.professionalInfo.workTypes.contract')}</SelectItem>
                  <SelectItem value="flexible">{t('settings.employeePrefs.professionalInfo.workTypes.flexible')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expectativas Salariales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('settings.employeePrefs.salary.title')}
          </CardTitle>
          <CardDescription>{t('settings.employeePrefs.salary.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary-min">{t('settings.employeePrefs.salary.minLabel')}</Label>
              <Input id="salary-min" type="number" min={0} value={expectedSalaryMin} onChange={(e) => setExpectedSalaryMin(Number(e.target.value))} placeholder={t('settings.employeePrefs.salary.minPlaceholder')} />
              {expectedSalaryMin > 0 && <p className="text-xs text-muted-foreground">{formatSalary(expectedSalaryMin)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary-max">{t('settings.employeePrefs.salary.maxLabel')}</Label>
              <Input id="salary-max" type="number" min={0} value={expectedSalaryMax} onChange={(e) => setExpectedSalaryMax(Number(e.target.value))} placeholder={t('settings.employeePrefs.salary.maxPlaceholder')} />
              {expectedSalaryMax > 0 && <p className="text-xs text-muted-foreground">{formatSalary(expectedSalaryMax)}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Especializaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {t('settings.employeePrefs.specializations.title')}
          </CardTitle>
          <CardDescription>{t('settings.employeePrefs.specializations.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {profile?.specializations?.map((spec) => (
              <Badge key={spec} variant="secondary" className="text-sm">
                {spec}
                <button onClick={() => handleRemoveSpecialization(spec)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder={t('settings.employeePrefs.specializations.placeholder')} value={newSpecialization} onChange={(e) => setNewSpecialization(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialization()} />
            <Button onClick={handleAddSpecialization} size="sm"><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Idiomas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t('settings.employeePrefs.languages.title')}
          </CardTitle>
          <CardDescription>{t('settings.employeePrefs.languages.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {profile?.languages?.map((lang) => (
              <Badge key={lang} variant="outline" className="text-sm">
                {lang}
                <button onClick={() => handleRemoveLanguage(lang)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder={t('settings.employeePrefs.languages.placeholder')} value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()} />
            <Button onClick={handleAddLanguage} size="sm"><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('settings.employeePrefs.certifications.title')}
              </CardTitle>
              <CardDescription>{t('settings.employeePrefs.certifications.description')}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowCertificationForm(!showCertificationForm)}>
              <Plus className="h-4 w-4 mr-1" />
              {t('settings.employeePrefs.certifications.addButton')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCertificationForm && (
            <Card className="border-dashed">
              <CardContent className="pt-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder={t('settings.employeePrefs.certifications.namePlaceholder')} value={certName} onChange={(e) => setCertName(e.target.value)} />
                  <Input placeholder={t('settings.employeePrefs.certifications.issuerPlaceholder')} value={certIssuer} onChange={(e) => setCertIssuer(e.target.value)} />
                  <Input type="date" value={certIssueDate} onChange={(e) => setCertIssueDate(e.target.value)} />
                  <Input type="date" value={certExpiryDate} onChange={(e) => setCertExpiryDate(e.target.value)} />
                  <Input placeholder={t('settings.employeePrefs.certifications.credentialIdPlaceholder')} value={certCredentialId} onChange={(e) => setCertCredentialId(e.target.value)} />
                  <Input placeholder={t('settings.employeePrefs.certifications.credentialUrlPlaceholder')} value={certCredentialUrl} onChange={(e) => setCertCredentialUrl(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddCertification} size="sm">{t('common.actions.save')}</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowCertificationForm(false)}>{t('common.actions.cancel')}</Button>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="space-y-3">
            {profile?.certifications?.map((cert: Certification) => (
              <div key={cert.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{cert.name}</h4>
                    <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{t('settings.employeePrefs.certifications.issuedLabel')}: {new Date(cert.issue_date).toLocaleDateString()}</span>
                      {cert.expiry_date && (
                        <span>• {t('settings.employeePrefs.certifications.expiresLabel')}: {new Date(cert.expiry_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    {cert.credential_url && (
                      <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
                        {t('settings.employeePrefs.certifications.viewCredential')} →
                      </a>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveCertification(cert.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* External Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            {t('settings.employeePrefs.links.title')}
          </CardTitle>
          <CardDescription>{t('settings.employeePrefs.links.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { id: 'portfolio-url', key: 'portfolio', value: portfolioUrl, onChange: setPortfolioUrl },
            { id: 'linkedin-url', key: 'linkedin', value: linkedinUrl, onChange: setLinkedinUrl },
            { id: 'github-url', key: 'github', value: githubUrl, onChange: setGithubUrl },
          ].map(({ id, key, value, onChange }) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={id}>{t(`settings.employeePrefs.links.${key}Label`)}</Label>
              <Input id={id} type="url" placeholder={t(`settings.employeePrefs.links.${key}Placeholder`)} value={value} onChange={(e) => onChange(e.target.value)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-2">
        <PermissionGate permission="employees.edit_own_profile" businessId={businessId} mode="disable">
          <Button onClick={handleSaveProfile} disabled={saving} size="lg">
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.actions.saving')}...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />{t('settings.employeePrefs.saveChanges')}</>
            )}
          </Button>
        </PermissionGate>
      </div>
    </div>
  )
}

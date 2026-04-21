/**
 * Paso del wizard para ingresar datos del cliente (solo modo admin booking).
 * Busca automáticamente el perfil por teléfono o email con debounce.
 */
import React, { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { User, Phone, Mail, CheckCircle, Search } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { PhonePrefixSelect } from '@/components/catalog/PhonePrefixSelect'
import { profilesService, type ProfileSummary } from '@/lib/services/profiles'
import type { WizardData } from '../wizard-types'

interface ClientDataStepProps {
  readonly wizardData: WizardData
  readonly updateWizardData: (data: Partial<WizardData>) => void
}

export function ClientDataStep({ wizardData, updateWizardData }: ClientDataStepProps) {
  const { t } = useLanguage()

  const [phonePrefix, setPhonePrefix] = useState(wizardData.clientPhonePrefix || '+57')
  const [phone, setPhone] = useState(wizardData.clientPhone || '')
  const [email, setEmail] = useState(wizardData.clientEmail || '')
  const [name, setName] = useState(wizardData.clientName || '')
  const [foundProfile, setFoundProfile] = useState<ProfileSummary | null>(null)
  const [isSearchingPhone, setIsSearchingPhone] = useState(false)
  const [isSearchingEmail, setIsSearchingEmail] = useState(false)

  // Sync local state back to wizardData on every change
  useEffect(() => {
    updateWizardData({
      clientPhone: phone,
      clientPhonePrefix: phonePrefix,
      clientEmail: email,
      clientName: name,
      clientProfileId: foundProfile?.id ?? null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, phonePrefix, email, name, foundProfile])

  // Auto-fill fields from found profile
  const fillFromProfile = useCallback((profile: ProfileSummary) => {
    setFoundProfile(profile)
    if (profile.full_name && !name) setName(profile.full_name)
    if (profile.email && !email) setEmail(profile.email)
    if (profile.phone && !phone) setPhone(profile.phone.replace(phonePrefix, ''))
  }, [name, email, phone, phonePrefix])

  // Debounced phone lookup
  useEffect(() => {
    if (phone.length < 7) {
      if (foundProfile && !email) setFoundProfile(null)
      return
    }
    const fullPhone = `${phonePrefix}${phone}`
    const timer = setTimeout(async () => {
      setIsSearchingPhone(true)
      try {
        const profile = await profilesService.findByPhone(fullPhone)
        if (profile) {
          fillFromProfile(profile)
        } else if (!email) {
          setFoundProfile(null)
        }
      } finally {
        setIsSearchingPhone(false)
      }
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, phonePrefix])

  // Debounced email lookup
  useEffect(() => {
    if (!email || !email.includes('@') || email.length < 5) {
      if (foundProfile && phone.length < 7) setFoundProfile(null)
      return
    }
    const timer = setTimeout(async () => {
      setIsSearchingEmail(true)
      try {
        const profile = await profilesService.findByEmail(email)
        if (profile) {
          fillFromProfile(profile)
        } else if (phone.length < 7) {
          setFoundProfile(null)
        }
      } finally {
        setIsSearchingEmail(false)
      }
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  const isRegistered = !!foundProfile

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-foreground mb-1">
          {t('appointments.clientData.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('appointments.clientData.subtitle')}
        </p>
      </div>

      <Card className="bg-card border-border p-5 space-y-5">
        {/* Phone field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            {t('appointments.clientData.phone')} *
          </label>
          <div className="flex gap-2">
            <div className="w-[130px]">
              <PhonePrefixSelect
                value={phonePrefix}
                onChange={setPhonePrefix}
                defaultToColombia
              />
            </div>
            <div className="relative flex-1">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="3001234567"
                className="pr-8"
              />
              {isSearchingPhone && (
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Email field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            {t('appointments.clientData.email')} *
          </label>
          <div className="relative">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
            />
            {isSearchingEmail && (
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-pulse" />
            )}
          </div>
        </div>

        {/* Name field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {t('appointments.clientData.name')} *
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('appointments.clientData.namePlaceholder')}
          />
        </div>

        {/* Registration status badge */}
        {(phone.length >= 7 || (email && email.includes('@'))) && (
          <div className="flex items-center justify-center pt-2">
            {isRegistered ? (
              <Badge variant="default" className="bg-green-600/20 text-green-400 border-green-600/30 gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                {t('appointments.clientData.registered')}
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5">
                <User className="h-3.5 w-3.5" />
                {t('appointments.clientData.guest')}
              </Badge>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

/**
 * Preferencias específicas del rol Cliente dentro de CompleteUnifiedSettings.
 */
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/contexts/LanguageContext'
import { ShoppingCart } from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'

interface ClientRolePreferencesProps {
  userId: string
}

export function ClientRolePreferences({ userId }: ClientRolePreferencesProps) {
  const { t } = useLanguage()
  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    const fetchCompletedCount = async () => {
      if (!userId) return
      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', userId)
        .eq('status', 'completed')
      if (!error) setCompletedCount(count ?? 0)
    }
    fetchCompletedCount()
  }, [userId])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('settings.clientPrefs.bookingPrefs.title')}
          </CardTitle>
          <CardDescription>{t('settings.clientPrefs.bookingPrefs.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {[
              { key: 'reminders', defaultChecked: true },
              { key: 'emailConfirmation', defaultChecked: true },
              { key: 'promotions', defaultChecked: false },
              { key: 'savePayment', defaultChecked: false },
            ].map(({ key, defaultChecked }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">{t(`settings.clientPrefs.bookingPrefs.${key}.label`)}</Label>
                  <p className="text-sm text-muted-foreground">{t(`settings.clientPrefs.bookingPrefs.${key}.description`)}</p>
                </div>
                <Switch defaultChecked={defaultChecked} />
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">{t('settings.clientPrefs.advanceTime.title')}</Label>
            <p className="text-sm text-muted-foreground">{t('settings.clientPrefs.advanceTime.description')}</p>
            <Select defaultValue="24">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('settings.clientPrefs.advanceTime.options.oneHour')}</SelectItem>
                <SelectItem value="2">{t('settings.clientPrefs.advanceTime.options.twoHours')}</SelectItem>
                <SelectItem value="4">{t('settings.clientPrefs.advanceTime.options.fourHours')}</SelectItem>
                <SelectItem value="24">{t('settings.clientPrefs.advanceTime.options.oneDay')}</SelectItem>
                <SelectItem value="48">{t('settings.clientPrefs.advanceTime.options.twoDays')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">{t('settings.clientPrefs.paymentMethods.title')}</Label>
            <Select defaultValue="card">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="card">{t('settings.clientPrefs.paymentMethods.options.card')}</SelectItem>
                <SelectItem value="cash">{t('settings.clientPrefs.paymentMethods.options.cash')}</SelectItem>
                <SelectItem value="transfer">{t('settings.clientPrefs.paymentMethods.options.transfer')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">{t('settings.clientPrefs.serviceHistory.title')}</Label>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('settings.clientPrefs.serviceHistory.completedServices', { count: String(completedCount) })}
              </p>
              <Button variant="outline" className="mt-3 w-full">
                {t('settings.clientPrefs.serviceHistory.viewHistory')}
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <Button className="w-full">{t('settings.clientPrefs.savePreferences')}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

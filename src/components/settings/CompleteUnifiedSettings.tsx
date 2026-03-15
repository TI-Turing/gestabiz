/**
 * CompleteUnifiedSettings — Configuraciones para todos los roles (admin / empleado / cliente).
 *
 * Arquitectura modular:
 *  - AdminRolePreferences.tsx   — Preferencias del negocio (admin)
 *  - EmployeeRolePreferences.tsx — Perfil profesional, horarios, mensajes (empleado)
 *  - ClientRolePreferences.tsx  — Preferencias de reserva y pago (cliente)
 *  - DangerZone.tsx             — Desactivación de cuenta
 */
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User } from '@/types'
import { useKV } from '@/lib/useKV'
import { useTheme } from '@/contexts'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import UserProfile from './UserProfile'
import { NotificationSettings } from './NotificationSettings'
import { AdminRolePreferences } from './AdminRolePreferences'
import { EmployeeRolePreferences } from './EmployeeRolePreferences'
import { ClientRolePreferences } from './ClientRolePreferences'
import { DangerZone } from './DangerZone'
import {
  User as UserIcon,
  Bell,
  Palette,
  Globe,
  Moon,
  Sun,
  Monitor,
  Briefcase,
  UserCircle,
  ShoppingCart,
  Warning as AlertCircle,
} from '@phosphor-icons/react'
import type { Business } from '@/types/types'

interface CompleteUnifiedSettingsProps {
  user: User
  onUserUpdate: (user: User) => void
  currentRole: 'admin' | 'employee' | 'client'
  businessId?: string
  business?: Business
  initialTab?: string
}

export default function CompleteUnifiedSettings({
  user,
  onUserUpdate,
  currentRole,
  businessId,
  business,
  initialTab,
}: CompleteUnifiedSettingsProps) {
  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [, setUsers] = useKV<User[]>('users', [])

  const getThemeInfo = () => {
    if (theme === 'light') return { label: t('settings.themeSection.themes.light.label'), classes: 'bg-yellow-100 text-yellow-600', icon: Sun }
    if (theme === 'dark') return { label: t('settings.themeSection.themes.dark.label'), classes: 'bg-blue-100 text-blue-600', icon: Moon }
    return { label: t('settings.themeSection.themes.system.label'), classes: 'bg-primary/10 text-primary', icon: Monitor }
  }

  const themeInfo = getThemeInfo()
  const ThemeIcon = themeInfo.icon

  const handleLanguageChange = async (newLanguage: 'es' | 'en') => {
    try {
      const updatedUser = { ...user, language: newLanguage, updated_at: new Date().toISOString() }
      await setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u))
      setLanguage(newLanguage)
      onUserUpdate(updatedUser)
      toast.success(t('settings.preferences_saved'))
    } catch (error) {
      toast.error(t('common.messages.updateError'))
      throw error
    }
  }

  const getRoleSpecificTab = () => {
    switch (currentRole) {
      case 'admin': return { value: 'role-specific', label: t('settings.tabs.businessPreferences'), icon: <Briefcase className="h-4 w-4" /> }
      case 'employee': return { value: 'role-specific', label: t('settings.tabs.employeePreferences'), icon: <UserCircle className="h-4 w-4" /> }
      case 'client': return { value: 'role-specific', label: t('settings.tabs.clientPreferences'), icon: <ShoppingCart className="h-4 w-4" /> }
      default: return null
    }
  }

  const tabs = [
    { value: 'general', label: t('settings.tabs.general'), icon: <Palette className="h-4 w-4" /> },
    { value: 'profile', label: t('settings.tabs.profile'), icon: <UserIcon className="h-4 w-4" /> },
    { value: 'notifications', label: t('settings.tabs.notifications'), icon: <Bell className="h-4 w-4" /> },
  ]
  const roleTab = getRoleSpecificTab()
  if (roleTab) tabs.push(roleTab)
  tabs.push({ value: 'danger-zone', label: t('settings.tabs.dangerZone'), icon: <AlertCircle className="h-4 w-4" /> })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t('settings.title')}</h2>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue={initialTab || 'general'} className="space-y-4">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* General — Theme & Language */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t('settings.themeSection.title')}
              </CardTitle>
              <CardDescription>{t('settings.themeSection.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  {t('settings.themeSection.themeLabel')}
                </Label>
                <p className="text-sm text-muted-foreground mb-3">{t('settings.themeSection.themeDescription')}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: t('settings.themeSection.themes.light.label'), icon: <Sun className="h-5 w-5" />, description: t('settings.themeSection.themes.light.description') },
                    { value: 'dark', label: t('settings.themeSection.themes.dark.label'), icon: <Moon className="h-5 w-5" />, description: t('settings.themeSection.themes.dark.description') },
                    { value: 'system', label: t('settings.themeSection.themes.system.label'), icon: <Monitor className="h-5 w-5" />, description: t('settings.themeSection.themes.system.description') },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value as 'light' | 'dark' | 'system')}
                      className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${theme === opt.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
                    >
                      <div className={`p-3 rounded-full ${theme === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {opt.icon}
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg mt-3">
                  <div className={`p-2 rounded-full ${themeInfo.classes}`}>
                    <ThemeIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t('settings.themeSection.currentTheme', { theme: themeInfo.label })}</p>
                    <p className="text-xs text-muted-foreground">
                      {theme === 'system' ? t('settings.themeSection.systemThemeNote') : t('settings.themeSection.changeAnytime')}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('settings.language')}
                </Label>
                <p className="text-sm text-muted-foreground mb-3">{t('settings.languageSection.description')}</p>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full md:w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">ES</span>
                        <span>{t('settings.spanish')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="en">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">EN</span>
                        <span>{t('settings.english')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile */}
        <TabsContent value="profile">
          <UserProfile user={user} onUserUpdate={onUserUpdate} />
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings userId={user.id} />
        </TabsContent>

        {/* Role-specific */}
        <TabsContent value="role-specific" className="space-y-4">
          {currentRole === 'admin' && business && <AdminRolePreferences business={business} />}
          {currentRole === 'employee' && <EmployeeRolePreferences userId={user.id} businessId={businessId} />}
          {currentRole === 'client' && <ClientRolePreferences userId={user.id} />}
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger-zone" className="space-y-4">
          <DangerZone user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

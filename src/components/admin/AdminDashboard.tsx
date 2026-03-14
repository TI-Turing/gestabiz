import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, MapPin, Briefcase, Users, FileText, Shield, CreditCard, BriefcaseBusiness, ShoppingCart, Calendar, CalendarOff, Box, Wallet } from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import { usePreferredLocation } from '@/hooks/usePreferredLocation'
import { APP_CONFIG } from '@/constants'
import { useQuery } from '@tanstack/react-query'
import { locationsService } from '@/lib/services'
import { useLanguage } from '@/contexts/LanguageContext'
import { OverviewTab } from './OverviewTab'
import { LocationsManager } from './LocationsManager'
import { ServicesManager } from './ServicesManager'
import { EmployeeManagementHierarchy } from './EmployeeManagementHierarchy'
import { ReportsPage } from './ReportsPage'
import { BillingDashboard } from '@/components/billing'
import { RecruitmentDashboard } from '@/components/jobs/RecruitmentDashboard'
import { QuickSalesPage } from '@/pages/QuickSalesPage'
import { AppointmentsCalendar } from './AppointmentsCalendar'
import { AbsencesTab } from './AbsencesTab'
import { ResourcesManager } from './ResourcesManager'
import { ExpensesManagementPage } from './expenses/ExpensesManagementPage'
import CompleteUnifiedSettings from '@/components/settings/CompleteUnifiedSettings'
import { usePendingNavigation } from '@/hooks/usePendingNavigation'
import type { Business, UserRole, User, EmployeeHierarchy } from '@/types/types'
import logoTiTuring from '@/assets/images/tt/1.png'

// Lazy load de componentes pesados (optimización de performance)
const PermissionsManager = lazy(() => import('./PermissionsManager').then(module => ({ default: module.PermissionsManager })))

interface AdminDashboardProps {
  business: Business
  businesses: Business[]
  onSelectBusiness: (businessId: string) => void
  onCreateNew?: () => void
  onUpdate?: () => void
  onLogout?: () => void
  currentRole: UserRole
  availableRoles: UserRole[]
  onRoleChange: (role: UserRole) => void
  user: User // Cambiar de opcional a requerido y usar tipo User completo
}

export function AdminDashboard({ 
  business, 
  businesses, 
  onSelectBusiness, 
  onCreateNew, 
  onUpdate,
  onLogout,
  currentRole,
  availableRoles,
  onRoleChange,
  user
}: Readonly<AdminDashboardProps>) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  
  // ✅ Extraer página activa de la URL (ej: /app/admin/appointments → 'appointments')
  const getPageFromUrl = () => {
    const path = location.pathname
    const match = path.match(/\/app\/admin\/([^/]+)/)
    return match ? match[1] : 'overview'
  }
  
  const [activePage, setActivePage] = useState(getPageFromUrl())
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeHierarchy | null>(null)
  const [pageContext, setPageContext] = useState<Record<string, unknown>>({})
  const [chatConversationId, setChatConversationId] = useState<string | null>(null)
  
  // Hooks para sede preferida y ubicaciones
  const { preferredLocationId, setPreferredLocation, isInitialized: locationInitialized, isExplicitlySet: locationExplicitlySet } = usePreferredLocation(business.id)
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', business.id],
    queryFn: () => locationsService.list({ businessIds: [business.id], activeOnly: true }),
    enabled: !!business.id,
    staleTime: 5 * 60 * 1000,
  })
  
  // Estado para nombre de la sede
  const [preferredLocationName, setPreferredLocationName] = useState<string | null>(null)
  
  // ✅ Sincronizar activePage con la URL
  useEffect(() => {
    const pageFromUrl = getPageFromUrl()
    if (pageFromUrl !== activePage) {
      setActivePage(pageFromUrl)
    }
  }, [location.pathname])
  
  // ✅ Redirigir a /app/admin/overview si estamos en /app
  useEffect(() => {
    if (location.pathname === '/app' || location.pathname === '/app/') {
      navigate('/app/admin/overview', { replace: true })
    }
  }, [location.pathname, navigate])
  
  // Resolver nombre de la sede a partir del id preferido
  useEffect(() => {
    if (preferredLocationId && locations.length > 0) {
      const loc = locations.find(l => l.id === preferredLocationId)
      setPreferredLocationName(loc?.name || null)
    } else {
      setPreferredLocationName(null)
    }
  }, [preferredLocationId, locations])

  // Auto-selección en primer acceso: elegir sede principal (is_primary) o la primera disponible.
  // Solo se ejecuta cuando el hook ya leyó localStorage y no hay ningún valor guardado.
  useEffect(() => {
    if (locationInitialized && !locationExplicitlySet && locations.length > 0) {
      const primaryLoc = locations.find(l => l.is_primary) ?? locations[0]
      setPreferredLocation(primaryLoc.id)
    }
  }, [locationInitialized, locationExplicitlySet, locations, setPreferredLocation])

  // ✅ Función para manejar cambios de página con navegación de URL
  const handlePageChange = useCallback((page: string, context?: Record<string, unknown>) => {
    setActivePage(page)
    navigate(`/app/admin/${page}`, { replace: true })
    if (context) {
      setPageContext(context)
    } else {
      setPageContext({})
    }
  }, [navigate])

  // Hook para procesar navegaciones pendientes después de cambio de rol
  usePendingNavigation(handlePageChange)

  // Listen for avatar updates and refresh user
  useEffect(() => {
    const handleAvatarUpdate = () => {
      onUpdate?.()
    }

    window.addEventListener('avatar-updated', handleAvatarUpdate)
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate)
  }, [onUpdate])

  // Determinar si mostrar tab de recursos
  const showResourcesTab = business.resource_model && business.resource_model !== 'professional'

  const sidebarItems = useMemo(() => [
    {
      id: 'overview',
      label: t('adminDashboard.sidebar.overview'),
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      id: 'appointments',
      label: t('adminDashboard.sidebar.appointments'),
      icon: <Calendar className="h-5 w-5" />
    },
    {
      id: 'absences',
      label: t('adminDashboard.sidebar.absences'),
      icon: <CalendarOff className="h-5 w-5" />
    },
    {
      id: 'locations',
      label: t('adminDashboard.sidebar.locations'),
      icon: <MapPin className="h-5 w-5" />
    },
    {
      id: 'services',
      label: t('adminDashboard.sidebar.services'),
      icon: <Briefcase className="h-5 w-5" />
    },
    // Tab de recursos (solo para negocios con recursos físicos)
    ...(showResourcesTab ? [{
      id: 'resources',
      label: t('adminDashboard.sidebar.resources'),
      icon: <Box className="h-5 w-5" />
    }] : []),
    {
      id: 'employees',
      label: t('adminDashboard.sidebar.employees'),
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'recruitment',
      label: t('adminDashboard.sidebar.recruitment'),
      icon: <BriefcaseBusiness className="h-5 w-5" />
    },
    {
      id: 'quick-sales',
      label: t('adminDashboard.sidebar.quickSales'),
      icon: <ShoppingCart className="h-5 w-5" />
    },
    {
      id: 'expenses',
      label: 'Egresos',
      icon: <Wallet className="h-5 w-5" />
    },
    // {
    //   id: 'accounting',
    //   label: t('adminDashboard.sidebar.accounting'),
    //   icon: <Calculator className="h-5 w-5" />
    // },
    {
      id: 'reports',
      label: t('adminDashboard.sidebar.reports'),
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'billing',
      label: t('adminDashboard.sidebar.billing'),
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      id: 'permissions',
      label: t('adminDashboard.sidebar.permissions'),
      icon: <Shield className="h-5 w-5" />
    }
  ], [t, showResourcesTab])

  const renderContent = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewTab business={business} />
      case 'appointments':
        return <AppointmentsCalendar businessId={business.id} />
      case 'absences':
        return <AbsencesTab businessId={business.id} />
      case 'locations':
        return <LocationsManager businessId={business.id} />
      case 'services':
        return <ServicesManager businessId={business.id} />
      case 'resources':
        return <ResourcesManager business={business} />
      case 'employees':
        return (
          <>
            <EmployeeManagementHierarchy 
              businessId={business.id}
              onEmployeeSelect={(employee: EmployeeHierarchy) => {
                setSelectedEmployee(employee)
                // Future: Abrir modal de detalle del empleado
              }}
            />
            {selectedEmployee && (
              // Future: Modal de detalle del empleado
              <></>
            )}
          </>
        )
      case 'recruitment':
        return (
          <RecruitmentDashboard 
            businessId={business.id} 
            highlightedVacancyId={pageContext.vacancyId as string | undefined}
            onChatStarted={setChatConversationId}
          />
        )
      case 'quick-sales':
        return <QuickSalesPage businessId={business.id} />
      case 'expenses':
        return <ExpensesManagementPage businessId={business.id} />
      // case 'accounting':
      //   return <AccountingPage businessId={business.id} onUpdate={onUpdate} />
      case 'reports':
        return <ReportsPage businessId={business.id} user={user} />
      case 'billing':
        return <BillingDashboard businessId={business.id} />
      case 'permissions':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <PermissionsManager 
              businessId={business.id}
              ownerId={business.owner_id}
              currentUserId={user.id}
            />
          </Suspense>
        )
      case 'settings':
      case 'profile':
        return (
          <div className="p-4">
            <CompleteUnifiedSettings 
              user={user} 
              onUserUpdate={() => {
                onUpdate?.()
              }}
              currentRole="admin"
              businessId={business.id}
              business={business}
              initialTab={activePage === 'profile' ? 'profile' : undefined}
            />
          </div>
        )
      default:
        return <OverviewTab business={business} />
    }
  }

  return (
    <UnifiedLayout
      business={business}
      businesses={businesses}
      onSelectBusiness={onSelectBusiness}
      onCreateNew={onCreateNew}
      currentRole={currentRole}
      availableRoles={availableRoles}
      onRoleChange={onRoleChange}
      onLogout={onLogout}
      sidebarItems={sidebarItems}
      activePage={activePage}
      onPageChange={handlePageChange}
      preferredLocationName={preferredLocationName}
      onLocationSelect={setPreferredLocation}
      availableLocations={locations.map(l => ({ id: l.id, name: l.name }))}
      chatConversationId={chatConversationId}
      onChatClose={() => setChatConversationId(null)}
      user={user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar_url
      } : undefined}
    >
      <div className="flex flex-col min-h-full">
        <div key={business.id} className="flex-1 p-4">
          {renderContent()}
        </div>
        
        {/* Ti Turing Footer */}
        <footer className="border-t border-border/50 py-2 px-4 mt-auto">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>{t('landing.footer.developedBy')}</span>
            <a 
              href="https://tituring.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <img 
                src={logoTiTuring} 
                alt="Ti Turing" 
                className="h-4 w-4 object-contain"
              />
              <span className="font-semibold text-primary">Ti Turing</span>
            </a>
            <span className="mx-2">·</span>
            <span className="text-muted-foreground/70">v{APP_CONFIG.VERSION}</span>
          </div>
        </footer>
      </div>
    </UnifiedLayout>
  )
}

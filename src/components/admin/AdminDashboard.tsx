import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, MapPin, Briefcase, Users, FileText, Shield, CreditCard, BriefcaseBusiness, ShoppingCart, Calendar, CalendarOff, Box, Wallet, UserCheck, BarChart3 } from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import { usePreferredLocation } from '@/hooks/usePreferredLocation'
import { APP_CONFIG } from '@/constants'
import { useQuery } from '@tanstack/react-query'
import { locationsService } from '@/lib/services'
import QUERY_CONFIG from '@/lib/queryConfig'
import { useLanguage } from '@/contexts/LanguageContext'
import { usePlanFeatures } from '@/hooks/usePlanFeatures'
import { PlanGate } from '@/components/ui/PlanGate'
import { OverviewTab } from './OverviewTab'
import { MyProfilePage } from '@/components/profile/MyProfilePage'
import { SectionErrorBoundary } from '@/components/ui/SectionErrorBoundary'
import { usePendingNavigation } from '@/hooks/usePendingNavigation'
import { usePendingJoinRequests } from '@/hooks/useEmployeeJoinRequests'
import { lazyWithRetry } from '@/lib/lazyWithRetry'
import type { Business, UserRole, User, EmployeeHierarchy } from '@/types/types'
import logoTiTuring from '@/assets/images/tt/1.png'

// ✅ Lazy load: solo se descarga el chunk cuando el usuario navega a esa pestaña
const PermissionsManager = lazy(() => import('./PermissionsManager').then(m => ({ default: m.PermissionsManager })))
const LocationsManager = lazy(() => import('./LocationsManager').then(m => ({ default: m.LocationsManager })))
const ServicesManager = lazy(() => import('./ServicesManager').then(m => ({ default: m.ServicesManager })))
const EmployeeManagementHierarchy = lazy(() => import('./EmployeeManagementHierarchy').then(m => ({ default: m.EmployeeManagementHierarchy })))
const ReportsPage = lazy(() => import('./ReportsPage').then(m => ({ default: m.ReportsPage })))
const BillingDashboard = lazy(() => import('@/components/billing').then(m => ({ default: m.BillingDashboard })))
const RecruitmentDashboard = lazy(() => import('@/components/jobs/RecruitmentDashboard').then(m => ({ default: m.RecruitmentDashboard })))
const QuickSalesPage = lazy(() => import('@/pages/QuickSalesPage').then(m => ({ default: m.QuickSalesPage })))
const AppointmentsCalendar = lazy(() => import('./AppointmentsCalendar').then(m => ({ default: m.AppointmentsCalendar })))
const AbsencesTab = lazy(() => import('./AbsencesTab').then(m => ({ default: m.AbsencesTab })))
const ResourcesManager = lazy(() => import('./ResourcesManager').then(m => ({ default: m.ResourcesManager })))
const ExpensesManagementPage = lazy(() => import('./expenses/ExpensesManagementPage').then(m => ({ default: m.ExpensesManagementPage })))
const ClientsManager = lazy(() => lazyWithRetry(
  () => import('./ClientsManager').then(m => ({ default: m.ClientsManager })),
  'admin-clients-manager'
))
const SalesHistoryPage = lazy(() => import('./SalesHistoryPage').then(m => ({ default: m.SalesHistoryPage })))
const CompleteUnifiedSettings = lazy(() => import('@/components/settings/CompleteUnifiedSettings'))

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
  // Función pura, no necesita ser hook: recibe pathname como argumento
  const getPageFromUrl = useCallback((pathname: string) => {
    const match = pathname.match(/\/app\/admin\/([^/]+)/)
    return match ? match[1] : 'overview'
  }, [])

  const [activePage, setActivePage] = useState(() => getPageFromUrl(location.pathname))
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeHierarchy | null>(null)
  const [pageContext, setPageContext] = useState<Record<string, unknown>>({})
  const [chatConversationId, setChatConversationId] = useState<string | null>(null)
  
  // Hooks para sede preferida y ubicaciones
  const { preferredLocationId, setPreferredLocation, isInitialized: locationInitialized, isExplicitlySet: locationExplicitlySet } = usePreferredLocation(business.id)
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', business.id],
    queryFn: () => locationsService.list({ businessIds: [business.id], activeOnly: true }),
    enabled: !!business.id,
    ...QUERY_CONFIG.STABLE,
  })
  
  // Estado para nombre de la sede
  const [preferredLocationName, setPreferredLocationName] = useState<string | null>(null)
  
  // ✅ Sincronizar activePage con la URL
  useEffect(() => {
    const pageFromUrl = getPageFromUrl(location.pathname)
    if (pageFromUrl !== activePage) {
      setActivePage(pageFromUrl)
    }
  }, [location.pathname, activePage, getPageFromUrl])
  
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
    navigate(`/app/admin/${page}`)
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

  // Plan activo del negocio
  const { hasModule, upgradePlan } = usePlanFeatures(business.id)

  // Solicitudes de ingreso de empleados pendientes (para badge en sidebar)
  const { data: pendingJoinRequests = [] } = usePendingJoinRequests(business.id)

  // Determinar si mostrar tab de recursos
  const showResourcesTab = business.resource_model && business.resource_model !== 'professional'

  // Helper: enriquece un item con estado locked si el módulo no está en el plan activo
  const planItem = useCallback((
    id: string,
    label: string,
    icon: React.ReactNode,
    extra?: { badge?: number }
  ) => {
    const locked = !hasModule(id)
    return {
      id,
      label,
      icon,
      locked,
      lockedPlan: locked ? (upgradePlan?.name ?? 'superior') : undefined,
      ...extra,
    }
  }, [hasModule, upgradePlan])

  const sidebarItems = useMemo(() => {
    const items = [
      planItem('overview',    t('adminDashboard.sidebar.overview'),     <LayoutDashboard className="h-5 w-5" />),
      planItem('appointments',t('adminDashboard.sidebar.appointments'), <Calendar className="h-5 w-5" />),
      planItem('absences',    t('adminDashboard.sidebar.absences'),     <CalendarOff className="h-5 w-5" />),
      planItem('locations',   t('adminDashboard.sidebar.locations'),    <MapPin className="h-5 w-5" />),
      planItem('services',    t('adminDashboard.sidebar.services'),     <Briefcase className="h-5 w-5" />),
      // Tab de recursos (solo para negocios con recursos físicos)
      ...(showResourcesTab ? [planItem('resources', t('adminDashboard.sidebar.resources'), <Box className="h-5 w-5" />)] : []),
      planItem('employees',   t('adminDashboard.sidebar.employees'),    <Users className="h-5 w-5" />, pendingJoinRequests.length > 0 ? { badge: pendingJoinRequests.length } : undefined),
      planItem('recruitment', t('adminDashboard.sidebar.recruitment'),  <BriefcaseBusiness className="h-5 w-5" />),
      planItem('clients',     'Clientes',                               <UserCheck className="h-5 w-5" />),
      planItem('sales',       'Ventas',                                 <BarChart3 className="h-5 w-5" />),
      planItem('quick-sales', t('adminDashboard.sidebar.quickSales'),   <ShoppingCart className="h-5 w-5" />),
      planItem('expenses',    'Egresos',                                <Wallet className="h-5 w-5" />),
      planItem('reports',     t('adminDashboard.sidebar.reports'),      <FileText className="h-5 w-5" />),
      planItem('billing',     t('adminDashboard.sidebar.billing'),      <CreditCard className="h-5 w-5" />),
      planItem('permissions', t('adminDashboard.sidebar.permissions'),  <Shield className="h-5 w-5" />),
    ]
    // Módulos disponibles en el plan activo primero, bloqueados al final
    return [...items.filter(i => !i.locked), ...items.filter(i => i.locked)]
  }, [t, showResourcesTab, planItem, pendingJoinRequests.length])

  const renderContent = () => {
    const tabFallback = (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    )
    const wrap = (node: React.ReactNode, errorMsg?: string) => (
      <SectionErrorBoundary resetKey={activePage} errorMessage={errorMsg}>
        <Suspense fallback={tabFallback}>{node}</Suspense>
      </SectionErrorBoundary>
    )

    // Wrapper que añade PlanGate si el módulo requiere un plan superior
    const planWrap = (moduleId: string, node: React.ReactNode) => {
      if (hasModule(moduleId)) return wrap(node)
      return (
        <PlanGate
          feature={moduleId}
          businessId={business.id}
          onUpgradeClick={() => handlePageChange('billing')}
        >
          {node}
        </PlanGate>
      )
    }

    switch (activePage) {
      case 'overview':
        return wrap(<OverviewTab business={business} />)
      case 'appointments':
        return wrap(<AppointmentsCalendar businessId={business.id} />)
      case 'absences':
        return planWrap('absences', <AbsencesTab businessId={business.id} />)
      case 'locations':
        return planWrap('locations', <LocationsManager businessId={business.id} />)
      case 'services':
        return wrap(<ServicesManager businessId={business.id} />)
      case 'resources':
        return planWrap('resources', <ResourcesManager business={business} />)
      case 'employees':
        return planWrap('employees',
          <>
            <EmployeeManagementHierarchy
              businessId={business.id}
              onEmployeeSelect={(employee: EmployeeHierarchy) => {
                setSelectedEmployee(employee)
              }}
            />
            {selectedEmployee && <></>}
          </>,
        )
      case 'recruitment':
        return planWrap('recruitment',
          <RecruitmentDashboard
            businessId={business.id}
            highlightedVacancyId={pageContext.vacancyId as string | undefined}
            onChatStarted={setChatConversationId}
          />,
        )
      case 'clients':
        return wrap(<ClientsManager businessId={business.id} />)
      case 'sales':
        return planWrap('sales', <SalesHistoryPage businessId={business.id} />)
      case 'quick-sales':
        return planWrap('quick-sales', <QuickSalesPage businessId={business.id} />)
      case 'expenses':
        return planWrap('expenses', <ExpensesManagementPage businessId={business.id} />)
      case 'reports':
        return planWrap('reports', <ReportsPage businessId={business.id} user={user} />)
      case 'billing':
        return wrap(<BillingDashboard businessId={business.id} ownerId={business.owner_id} />)
      case 'permissions':
        return planWrap('permissions',
          <PermissionsManager
            businessId={business.id}
            ownerId={business.owner_id}
            currentUserId={user.id}
          />,
        )
      case 'profile':
        return wrap(
          <MyProfilePage user={user} onNavigate={handlePageChange} />,
        )
      case 'settings':
        return wrap(
          <div className="p-4">
            <CompleteUnifiedSettings
              user={user}
              onUserUpdate={() => { onUpdate?.() }}
              currentRole="admin"
              businessId={business.id}
              business={business}
            />
          </div>,
        )
      default:
        return wrap(<OverviewTab business={business} />)
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
      onLocationSelect={(locationId) => {
        setPreferredLocation(locationId)
        window.location.reload()
      }}
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
        <div key={business.id} className="flex-1 p-3 sm:p-4 pt-4 sm:pt-4">
          {renderContent()}
        </div>

        {/* Ti Turing Footer */}
        <footer className="border-t border-border/50 py-2 px-4 mt-auto hidden sm:block">
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

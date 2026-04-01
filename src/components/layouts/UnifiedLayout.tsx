import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  LogOut,
  User as UserIcon,
  Plus,
  Bug,
  MapPin,
  Lock,
  Search
} from 'lucide-react'
import logoGestabizIcon from '@/assets/images/gestabiz/gestabiz_icon_clean.svg'
import logoGestabizDark from '@/assets/images/gestabiz/gestabiz_logo_dark.svg'
import logoGestabizLight from '@/assets/images/gestabiz/gestabiz_logo_light.svg'
import logoGestabizDarkEn from '@/assets/images/gestabiz/gestabiz_logo_dark_en.svg'
import logoGestabizLightEn from '@/assets/images/gestabiz/gestabiz_logo_light_en.svg'
import { Badge } from '@/components/ui/badge'
import { SearchBar, type SearchType } from '@/components/client/SearchBar'
import { CitySelector } from '@/components/client/CitySelector'
import { usePreferredCity } from '@/hooks/usePreferredCity'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { isTouchDevice } from '@/lib/animations'
import type { Business, UserRole } from '@/types/types'
import { NotificationBell } from '@/components/notifications'
import { FloatingChatButton } from '@/components/chat/FloatingChatButton'
import { BugReportModal } from '@/components/bug-report/BugReportModal'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/useTheme'

// Sidebar width constants
const SIDEBAR_EXPANDED_W = 'w-56' // 224px
const SIDEBAR_COLLAPSED_W = 'w-16' // 64px
const SIDEBAR_EXPANDED_ML = 'lg:ml-56'
const SIDEBAR_COLLAPSED_ML = 'lg:ml-16'
const SIDEBAR_EXPANDED_LEFT = 'lg:left-56'
const SIDEBAR_COLLAPSED_LEFT = 'lg:left-16'


interface SearchResult {
  id: string
  name: string
  type: SearchType
  subtitle?: string
  category?: string
  location?: string
}

interface UnifiedLayoutProps {
  children: React.ReactNode
  business?: Business
  businesses?: Business[]
  onSelectBusiness?: (businessId: string) => void
  onCreateNew?: () => void
  currentRole: UserRole
  availableRoles: UserRole[]
  onRoleChange: (role: UserRole) => void
  onLogout?: () => void
  sidebarItems: SidebarItem[]
  activePage: string
  onPageChange: (page: string, context?: Record<string, unknown>) => void
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  preferredLocationName?: string | null
  onLocationSelect?: (locationId: string | null) => void
  availableLocations?: Array<{ id: string; name: string }>
  onSearchResultSelect?: (result: SearchResult) => void
  onSearchViewMore?: (searchTerm: string, searchType: SearchType) => void
  chatConversationId?: string | null
  onChatClose?: () => void
  hideBusinessSelector?: boolean
}

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: number
  /** Si true, el ítem se muestra bloqueado con candado (plan insuficiente) */
  locked?: boolean
  /** Nombre del plan requerido para mostrar en el tooltip / badge del candado */
  lockedPlan?: string
}

const getBusinessCategoryName = (category: Business['category']) =>
  typeof category === 'string' ? category : category?.name

export function UnifiedLayout({
  children,
  business,
  businesses = [],
  onSelectBusiness,
  onCreateNew,
  currentRole,
  availableRoles,
  onRoleChange,
  onLogout,
  sidebarItems,
  activePage,
  onPageChange,
  user,
  preferredLocationName,
  onLocationSelect,
  availableLocations = [],
  onSearchResultSelect,
  onSearchViewMore,
  chatConversationId,
  onChatClose
}: Readonly<UnifiedLayoutProps>) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= 1024
  })
  // Sidebar collapsed state (icons only) - persisted in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      const stored = localStorage.getItem('sidebar-collapsed')
      if (stored !== null) return stored === 'true'
    } catch { /* ignore */ }
    // Default: collapsed on screens < 1440px
    return window.innerWidth < 1440
  })
  const [bugReportOpen, setBugReportOpen] = useState(false)
  const [locationMenuOpen, setLocationMenuOpen] = useState(false)
  const [mobileHeaderOpen, setMobileHeaderOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const locationMenuRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const touchRef = useRef({
    startX: 0,
    startY: 0,
    isSwiping: false,
    edge: null as null | 'left' | 'right',
  })
  const { t, language } = useLanguage()
  const { isDark } = useTheme()
  const logoGestabizFull = isDark
    ? (language === 'en' ? logoGestabizDarkEn : logoGestabizDark)
    : (language === 'en' ? logoGestabizLightEn : logoGestabizLight)
  const roleLabels = useMemo<Record<UserRole, string>>(() => ({
    admin: t('roleSelector.admin'),
    employee: t('roleSelector.employee'),
    client: t('roleSelector.client'),
  }), [t])
  
  // Hook para preferencias de ciudad (solo para cliente)
  const {
    preferredRegionId,
    preferredRegionName,
    preferredCityId,
    preferredCityName,
    setPreferredCity
  } = usePreferredCity()

  // Toggle sidebar collapsed state
  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('sidebar-collapsed', String(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  // Close location menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationMenuRef.current && !locationMenuRef.current.contains(event.target as Node)) {
        setLocationMenuOpen(false)
      }
    }

    if (locationMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [locationMenuOpen])

  // Deduplicate available roles
  const uniqueRoles = useMemo(() => Array.from(new Set(availableRoles)), [availableRoles])

  // Mobile bottom nav: up to 4 unlocked primary items + optional "Más" button
  const mobileNavItems = useMemo(() => {
    const unlocked = sidebarItems.filter(i => !i.locked)
    return unlocked.slice(0, 4)
  }, [sidebarItems])
  const hasMobileMoreButton = sidebarItems.length > 4

  // Swipe gestures to open/close side menus (mobile)
  useEffect(() => {
    // Attach on window to ensure gestures are detected across overlays/portals
    if (!isTouchDevice()) return

    const handleStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchRef.current.startX = touch.clientX
      touchRef.current.startY = touch.clientY
      touchRef.current.isSwiping = false
      // Permitimos gestos desde toda la pantalla; mantenemos detección de borde solo como referencia
      const edgeThreshold = 24
      const w = window.innerWidth
      touchRef.current.edge =
        touch.clientX <= edgeThreshold ? 'left' :
        touch.clientX >= w - edgeThreshold ? 'right' :
        null
    }

    const handleMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const dx = touch.clientX - touchRef.current.startX
      const dy = touch.clientY - touchRef.current.startY
      if (!touchRef.current.isSwiping) {
        if (Math.abs(dx) > 15 && Math.abs(dy) < 40) {
          touchRef.current.isSwiping = true
        }
      }
    }

    const handleEnd = (e: TouchEvent) => {
      const { edge, startX } = touchRef.current
      const touch = e.changedTouches[0]
      const dx = touch.clientX - startX
      const dy = touch.clientY - touchRef.current.startY
      const threshold = 60
      const directionalEnough = Math.abs(dy) < 40

      // Close menus with inverse swipe when already open
      if (directionalEnough) {
        // Close left sidebar with swipe left from anywhere (admin only)
        if (currentRole === 'admin' && sidebarOpen && dx < -threshold && startX > 80) {
          setSidebarOpen(false)
          touchRef.current.edge = null
          touchRef.current.isSwiping = false
          return
        }
        // Close right mobile header with swipe right from anywhere (avoid extreme right edge)
        if (mobileHeaderOpen && dx > threshold && startX < window.innerWidth - 80) {
          setMobileHeaderOpen(false)
          touchRef.current.edge = null
          touchRef.current.isSwiping = false
          return
        }
      }

      // Open menus with directional swipe from anywhere on the screen
      if (directionalEnough) {
        if (currentRole === 'admin' && !sidebarOpen && dx > threshold) {
          setSidebarOpen(true)
        } else if (!mobileHeaderOpen && dx < -threshold) {
          setMobileHeaderOpen(true)
        }
      }

      touchRef.current.edge = null
      touchRef.current.isSwiping = false
    }

    window.addEventListener('touchstart', handleStart, { passive: true })
    window.addEventListener('touchmove', handleMove, { passive: true })
    window.addEventListener('touchend', handleEnd)
    return () => {
      window.removeEventListener('touchstart', handleStart)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [sidebarOpen, mobileHeaderOpen])

  return (
    <div ref={rootRef} className="min-h-screen bg-background flex overflow-x-hidden">
      {/* Sidebar - Full Height & Fixed - Collapsible */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-card border-r border-border z-[100] transition-all duration-200 flex flex-col",
          sidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W,
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo/Brand */}
        <div className={cn(
          "border-b border-border flex-shrink-0 flex items-center",
          sidebarCollapsed ? "justify-center" : ""
        )}>
          {sidebarCollapsed ? (
            <img 
              src={logoGestabizIcon} 
              alt="Gestabiz" 
              className="w-full h-auto"
            />
          ) : (
            <img 
              src={logoGestabizFull} 
              alt="Gestabiz" 
              className="w-full h-auto"
            />
          )}
        </div>

        {/* Navigation - Scrollable */}
        <nav className={cn(
          "flex-1 space-y-0.5 overflow-y-auto",
          sidebarCollapsed ? "p-2" : "p-3"
        )}>
          {sidebarItems.map((item) => {
            const isLocked = item.locked === true
            const navButton = (
              <button
                key={item.id}
                onClick={() => {
                  if (isLocked) {
                    // Redirigir a billing para upgrade
                    onPageChange('billing')
                  } else {
                    onPageChange(item.id)
                  }
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false)
                  }
                }}
                title={isLocked && item.lockedPlan ? `Requiere Plan ${item.lockedPlan}` : undefined}
                className={cn(
                  "w-full flex items-center rounded-lg transition-colors text-left",
                  sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  isLocked
                    ? "opacity-50 cursor-pointer hover:bg-muted hover:opacity-70"
                    : activePage === item.id
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-muted"
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-sm">{item.label}</span>
                    {/* Candado de plan (prioridad sobre badge de notificaciones) */}
                    {isLocked ? (
                      <span className="ml-auto flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        <Lock className="h-3 w-3" />
                        {item.lockedPlan}
                      </span>
                    ) : (
                      item.badge !== undefined && item.badge > 0 && (
                        <Badge
                          variant={activePage === item.id ? "secondary" : "default"}
                          className="ml-auto text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )
                    )}
                  </>
                )}
                {/* Badge de notificaciones en modo colapsado (solo si no bloqueado) */}
                {sidebarCollapsed && !isLocked && item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    variant={activePage === item.id ? "secondary" : "default"}
                    className="absolute -top-1 -right-1 text-[10px] h-4 min-w-4 px-1"
                  >
                    {item.badge}
                  </Badge>
                )}
                {/* Indicador de candado en modo colapsado */}
                {sidebarCollapsed && isLocked && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center">
                    <Lock className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
              </button>
            )

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      {navButton}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {isLocked
                      ? `${item.label} — Requiere Plan ${item.lockedPlan ?? 'superior'}`
                      : item.label
                    }
                  </TooltipContent>
                </Tooltip>
              )
            }

            return navButton
          })}
        </nav>

        {/* Bottom Menu - Bug Report, Logout & Collapse Toggle */}
        <div className={cn(
          "border-t border-border flex-shrink-0",
          sidebarCollapsed ? "p-2 space-y-0.5" : "p-3 space-y-0.5"
        )}>
          {sidebarCollapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setBugReportOpen(true)}
                    className="w-full flex items-center justify-center p-2.5 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Bug className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t('common.actions.reportProblem')}
                </TooltipContent>
              </Tooltip>
              {onLogout && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center justify-center p-2.5 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {t('common.actions.logout')}
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setBugReportOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Bug className="h-5 w-5" />
                <span className="text-sm font-medium">{t('common.actions.reportProblem')}</span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('common.actions.logout')}</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Collapse toggle - floating on right edge, desktop only */}
        <button
          onClick={toggleSidebarCollapsed}
          className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-7 h-14 rounded-r-lg bg-card border border-l-0 border-border shadow-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[95] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Right Side: Header + Content */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen overflow-y-auto transition-[margin] duration-200",
        sidebarCollapsed ? SIDEBAR_COLLAPSED_ML : SIDEBAR_EXPANDED_ML
      )}>
        {/* Header - Compact responsive height */}
        <header className={cn(
          "bg-card border-b border-border fixed inset-x-0 top-0 z-[90] sm:fixed sm:left-0 sm:right-0 sm:top-0 shrink-0 transition-[left] duration-200",
          sidebarCollapsed ? SIDEBAR_COLLAPSED_LEFT : SIDEBAR_EXPANDED_LEFT
        )}>
        {/* Mobile top bar: logo abre el menú izquierdo + botón menú derecho */}
        <div className="px-3 py-2 flex items-center justify-between sm:hidden min-h-[48px]">
          <div className="flex items-center gap-2">
            {/* Logo — opens sidebar for admin, static for other roles */}
            {currentRole === 'admin' ? (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Abrir menú izquierdo"
              >
                <img src={logoGestabizIcon} alt="Gestabiz" className="w-12 h-12 rounded-lg object-contain" />
              </button>
            ) : (
              <div className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <img src={logoGestabizIcon} alt="Gestabiz" className="w-12 h-12 rounded-lg object-contain" />
              </div>
            )}
            <span className="text-sm font-semibold text-foreground">Gestabiz</span>
          </div>
          {/* Right area: search (client) + notification bell + overlay toggle */}
          <div className="flex items-center gap-1">
            {/* Search icon - client role only, before bell */}
            {currentRole === 'client' && (
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="p-2 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
            {user?.id && (
              <NotificationBell
                userId={user.id}
                onNavigateToPage={(page, ctx) => onPageChange(page, ctx)}
                currentRole={currentRole}
                onRoleSwitch={onRoleChange}
                availableRoles={availableRoles}
              />
            )}
            <button
              onClick={() => setMobileHeaderOpen(true)}
              className="p-2 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Abrir menú derecho"
            >
              <Menu className="h-6 w-6 text-foreground" />
            </button>
          </div>
        </div>
        <div className="hidden sm:grid px-3 sm:px-4 py-2 grid-cols-[auto_1fr_auto] items-center gap-2 h-full min-h-[48px] sm:min-h-[56px]">
          <div className="flex items-center gap-2 min-w-0">
            {/* Sidebar toggle - admin only */}
            {currentRole === 'admin' && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6 text-foreground" />
                ) : (
                  <Menu className="h-6 w-6 text-foreground" />
                )}
              </button>
            )}

            {/* Logo/Business Info - Responsive */}
            {business ? (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-2 hover:bg-muted/50 rounded-lg p-1.5 transition-colors group focus:outline-none min-w-0 overflow-hidden">
                    {business.logo_url ? (
                      <img
                        src={business.logo_url}
                        alt={business.name}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain bg-muted p-1 border border-primary/20 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20 flex-shrink-0">
                        <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      </div>
                    )}

                    <div className="text-left flex items-center gap-1.5 min-w-0">
                      <div className="min-w-0">
                        <h1 className="text-sm sm:text-base font-bold text-foreground truncate max-w-[120px] sm:max-w-[180px] md:max-w-[160px]">
                          {business.name}
                        </h1>
                      </div>
                      {business.category && (
                        <Badge variant="secondary" className="text-xs hidden md:inline-flex">
                          {getBusinessCategoryName(business.category)}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                    </div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="start" className="w-64 bg-card border-border">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Mis Negocios
                      </p>
                    </div>
                    {businesses.map((biz) => (
                      <DropdownMenuItem
                        key={biz.id}
                        onClick={() => onSelectBusiness?.(biz.id)}
                        className={cn(
                          "cursor-pointer flex items-center gap-3 py-3",
                          biz.id === business.id && "bg-primary/20 text-foreground font-semibold"
                        )}
                      >
                        {biz.logo_url ? (
                          <img
                            src={biz.logo_url}
                            alt={biz.name}
                            className="w-8 h-8 rounded-lg object-contain bg-muted p-1"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{biz.name}</p>
                          {biz.category && (
                            <p className="text-xs text-muted-foreground truncate">
                              {getBusinessCategoryName(biz.category)}
                            </p>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}

                    {onCreateNew && (
                      <>
                        <div className="my-1 h-px bg-border" />
                        <DropdownMenuItem
                          onClick={onCreateNew}
                          className="cursor-pointer flex items-center gap-3 py-3 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Plus className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">Crear Nuevo Negocio</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

              {/* Location Selector - Outside DropdownMenu */}
              {availableLocations.length > 0 && (
                <div className="relative" ref={locationMenuRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setLocationMenuOpen(!locationMenuOpen)
                    }}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 px-2 py-1 hover:bg-muted rounded-md min-w-0 max-w-[160px]"
                  >
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{preferredLocationName || 'Todas las sedes'}</span>
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  </button>
                  {locationMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 min-w-[180px]">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onLocationSelect?.(null)
                          setLocationMenuOpen(false)
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-muted/50 transition-colors first:rounded-t-md",
                          !preferredLocationName && "bg-primary/20 text-foreground font-semibold"
                        )}
                      >
                        Todas las sedes
                      </button>
                      {availableLocations.map((location) => (
                        <button
                          key={location.id}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onLocationSelect?.(location.id)
                            setLocationMenuOpen(false)
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-muted/50 transition-colors",
                            preferredLocationName === location.name && "bg-primary/20 text-foreground font-semibold"
                          )}
                        >
                          {location.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            ) : currentRole === 'client' ? (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <CitySelector
                  preferredRegionId={preferredRegionId}
                  preferredRegionName={preferredRegionName}
                  preferredCityId={preferredCityId}
                  preferredCityName={preferredCityName}
                  onCitySelect={setPreferredCity}
                />
              </div>
            ) : (
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-foreground truncate">
                  Gestabiz
                </h1>
              </div>
            )}
          </div>
          {/* Center area: search for desktop (hidden on small screens) */}
          <div className="hidden sm:block min-w-0 w-full col-start-2 col-end-3">
            {currentRole === 'client' && (
              <div className="w-full min-w-0">
                <SearchBar
                  onResultSelect={(result) => onSearchResultSelect?.(result)}
                  onViewMore={(term, type) => onSearchViewMore?.(term, type)}
                  className="w-full max-w-none"
                />
              </div>
            )}
          </div>

          {/* Right Side Controls - Compact */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Notification Bell - Show for authenticated users */}
            {user?.id && (
              <NotificationBell 
                userId={user.id} 
                onNavigateToPage={onPageChange}
                currentRole={currentRole}
                onRoleSwitch={onRoleChange}
                availableRoles={availableRoles}
              />
            )}

            {/* Role Selector - Responsive */}
            {uniqueRoles.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="group flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-muted transition-colors focus:outline-none min-h-[44px]">
                  <UserIcon className="h-4 w-4 sm:hidden text-foreground" />
                  <span className="text-xs sm:text-sm font-medium text-foreground hidden sm:inline whitespace-nowrap">
                    {roleLabels[currentRole]}
                  </span>
                  {uniqueRoles.length > 1 && (
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </DropdownMenuTrigger>
                {uniqueRoles.length > 1 && (
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                    {uniqueRoles.map((role) => (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => onRoleChange(role)}
                        className={cn(
                          "cursor-pointer",
                          role === currentRole && "bg-primary/20 text-foreground font-semibold"
                        )}
                      >
                        {roleLabels[role]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                )}
              </DropdownMenu>
            )}

            {/* User Menu - Touch optimized */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-primary/20">
                    {user.avatar && (
                      <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-primary/20 text-primary text-xs sm:text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem
                    onClick={() => onPageChange('profile')}
                    className="cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    {t('navigation.nav.client.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onPageChange('settings')}
                    className="cursor-pointer"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {t('navigation.nav.settings')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>
        </div>
      </header>

      {/* Main Content - Scrollable area (mobile padding to account for fixed header + bottom nav) */}
      <main className="flex-1 px-3 sm:px-4 max-w-[100vw] overflow-x-hidden pt-[60px] sm:pt-[56px] pb-24 lg:pb-6">
          {children}
      </main>

      {/* Mobile Search Overlay - Client role only */}
      {currentRole === 'client' && (
        <div
          className={cn(
            "fixed inset-0 z-[150] sm:hidden transition-all duration-200 bg-black/40 backdrop-blur-sm",
            mobileSearchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          aria-hidden={!mobileSearchOpen}
          onClick={() => setMobileSearchOpen(false)}
        >
          {/* Search panel - inside the overlay, not affected by backdrop-blur */}
          <div
            className="absolute top-0 left-0 right-0 bg-card border-b border-border shadow-xl px-4 pt-4 pb-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-1">
              <SearchBar
                onResultSelect={(result) => {
                  onSearchResultSelect?.(result)
                  setMobileSearchOpen(false)
                }}
                onViewMore={(term, type) => {
                  onSearchViewMore?.(term, type)
                  setMobileSearchOpen(false)
                }}
                className="flex-1"
                autoFocus={mobileSearchOpen}
              />
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Cerrar búsqueda"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header Overlay - Right side drawer (animated open/close) */}
      <div
        className={cn(
          "fixed inset-0 z-[100] sm:hidden transition-opacity duration-300",
          mobileHeaderOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!mobileHeaderOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-300",
            mobileHeaderOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileHeaderOpen(false)}
        />
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-[88vw] max-w-[380px] bg-card border-l border-border shadow-xl transform transition-transform duration-300 ease-out",
            mobileHeaderOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="h-full overflow-y-auto">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Menú</span>
                <button
                  onClick={() => setMobileHeaderOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Selector de Negocio — admin y employee */}
                {business && currentRole !== 'client' && businesses.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-border bg-muted/30 px-3 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Negocio</p>
                    <div className="space-y-0.5">
                      {businesses.map((biz) => (
                        <button
                          key={biz.id}
                          onClick={() => {
                            onSelectBusiness?.(biz.id)
                            setMobileHeaderOpen(false)
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors text-left",
                            biz.id === business.id
                              ? "bg-primary/20 text-foreground font-semibold"
                              : "hover:bg-muted text-foreground"
                          )}
                        >
                          {biz.logo_url ? (
                            <img
                              src={biz.logo_url}
                              alt={biz.name}
                              className="w-7 h-7 rounded-lg object-contain bg-muted p-0.5 border border-primary/20 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                              <Building2 className="h-3.5 w-3.5 text-primary" />
                            </div>
                          )}
                          <span className="flex-1 text-sm truncate">{biz.name}</span>
                          {biz.id === business.id && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </button>
                      ))}
                      {onCreateNew && (
                        <button
                          onClick={() => {
                            onCreateNew?.()
                            setMobileHeaderOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors text-left text-primary hover:bg-primary/10"
                        >
                          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                            <Plus className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-medium">Crear Nuevo Negocio</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Selector de Sede — admin y employee */}
                {availableLocations.length > 0 && currentRole !== 'client' && (
                  <div className="space-y-2 rounded-xl border border-border bg-muted/30 px-3 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sede</p>
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          onLocationSelect?.(null)
                          setMobileHeaderOpen(false)
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left text-sm",
                          !preferredLocationName
                            ? "bg-primary/20 text-foreground font-semibold"
                            : "hover:bg-muted text-muted-foreground"
                        )}
                      >
                        <MapPin className="h-4 w-4 shrink-0" />
                        Todas las sedes
                        {!preferredLocationName && <span className="ml-auto h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </button>
                      {availableLocations.map((location) => (
                        <button
                          key={location.id}
                          onClick={() => {
                            onLocationSelect?.(location.id)
                            setMobileHeaderOpen(false)
                          }}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left text-sm",
                            preferredLocationName === location.name
                              ? "bg-primary/20 text-foreground font-semibold"
                              : "hover:bg-muted text-muted-foreground"
                          )}
                        >
                          <MapPin className="h-4 w-4 shrink-0" />
                          {location.name}
                          {preferredLocationName === location.name && (
                            <span className="ml-auto h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ubicación */}
                {currentRole === 'client' && (
                  <div className="space-y-3 rounded-xl border border-border bg-muted/30 px-3 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ubicación</p>
                    <CitySelector
                      preferredRegionId={preferredRegionId}
                      preferredRegionName={preferredRegionName}
                      preferredCityId={preferredCityId}
                      preferredCityName={preferredCityName}
                      onCitySelect={setPreferredCity}
                    />
                  </div>
                )}


                {/* Rol y notificaciones */}
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 px-3 py-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('common.labels.account')}</p>
                  <div className="flex items-center gap-3">
                    {uniqueRoles.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors focus:outline-none">
                          <UserIcon className="h-4 w-4 text-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {roleLabels[currentRole]}
                          </span>
                          {uniqueRoles.length > 1 && (
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          )}
                        </DropdownMenuTrigger>
                        {uniqueRoles.length > 1 && (
                          <DropdownMenuContent align="end" className="w-48 bg-card border-border z-[120]">
                            {uniqueRoles.map((role) => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => {
                                  onRoleChange(role)
                                  setMobileHeaderOpen(false)
                                }}
                                className={cn(
                                  "cursor-pointer",
                                  role === currentRole && "bg-primary/20 text-foreground font-semibold"
                                )}
                              >
                                {roleLabels[role]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        )}
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Usuario */}
                {user && (
                  <div className="space-y-3 rounded-xl border border-border bg-muted/30 px-3 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('common.labels.profile')}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="focus:outline-none min-w-[44px] min-h-[44px] flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-primary/20">
                          {user.avatar && (
                            <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                          )}
                          <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-card border-border z-[120]">
                        <DropdownMenuItem
                          onClick={() => {
                            onPageChange('profile')
                            setMobileHeaderOpen(false)
                          }}
                          className="cursor-pointer"
                        >
                          <UserIcon className="h-4 w-4 mr-2" />
                          {t('navigation.nav.client.profile')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            onPageChange('settings')
                            setMobileHeaderOpen(false)
                          }}
                          className="cursor-pointer"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {t('navigation.nav.settings')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Chat Button - Visible for all roles */}
      {user && (
        <FloatingChatButton 
          userId={user.id} 
          businessId={business?.id}
          initialConversationId={chatConversationId}
          onOpenChange={(isOpen) => {
            if (!isOpen && onChatClose) {
              onChatClose()
            }
          }}
        />
      )}

      {/* Mobile Bottom Navigation Bar — fixed to viewport bottom, hidden on desktop */}
      {mobileNavItems.length > 0 && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-[88] bg-card border-t border-border lg:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-stretch">
            {mobileNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.locked) {
                    onPageChange('billing')
                  } else {
                    onPageChange(item.id)
                  }
                }}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[52px] px-1 transition-colors",
                  activePage === item.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="shrink-0 relative">
                  {item.icon}
                  {!item.locked && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-3.5 min-w-[14px] flex items-center justify-center px-0.5">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                  {item.locked && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-500 rounded-full h-3.5 w-3.5 flex items-center justify-center">
                      <Lock className="h-2 w-2 text-white" />
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium truncate max-w-[64px] text-center leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
            {hasMobileMoreButton && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[52px] px-1 transition-colors text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium">Más</span>
              </button>
            )}
          </div>
        </nav>
      )}

      {/* Bug Report Modal */}
      <BugReportModal
        open={bugReportOpen}
        onOpenChange={setBugReportOpen}
      />
    </div>
  )
}

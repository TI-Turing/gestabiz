import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { APP_CONFIG } from '@/constants'
import { QueryClientProvider } from '@tanstack/react-query'

// QueryClient singleton (extraído a src/lib/queryClient.ts para que useAuthSimple
// pueda limpiarlo en signOut sin import circular).
import { queryClient } from '@/lib/queryClient'

// Import contexts directly instead of lazy loading them
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AppStateProvider } from '@/contexts/AppStateContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Vercel Analytics
import { Analytics } from '@vercel/analytics/react'

// Google Analytics 4
import { initializeGA4 } from '@/lib/ga4'
import { hasAnalyticsConsent } from '@/hooks/useAnalytics'
import { CookieConsent } from '@/components/CookieConsent'
import { AlertProvider } from '@/components/ui/custom-alert'

// Permission Testing Page (dev only - tree-shaken in production)
const PermissionTestingPage = import.meta.env.DEV
  ? lazy(() => import('@/components/admin/permissions/PermissionTestingPage').then(m => ({ default: m.PermissionTestingPage })))
  : null

// Lazy load main application components
const LandingPage = lazy(() => import('@/components/landing/LandingPage').then(m => ({ default: m.LandingPage })))
const AuthScreen = lazy(() => import('@/components/auth/AuthScreen'))
const MainApp = lazy(() => import('@/components/MainApp'))
const PublicBusinessProfile = lazy(() => import('@/pages/PublicBusinessProfile'))
const PublicEmployeeProfile = lazy(() => import('@/pages/PublicEmployeeProfile'))
const AppointmentConfirmation = lazy(() => import('@/pages/AppointmentConfirmation'))
const AppointmentCancellation = lazy(() => import('@/pages/AppointmentCancellation'))
const AppointmentReschedule = lazy(() => import('@/pages/AppointmentReschedule'))
const GoogleCalendarCallback = lazy(() => import('@/pages/GoogleCalendarCallback'))
// SEO: landing pages verticales, blog y directorio
const VerticalLandingPage = lazy(() => import('@/pages/VerticalLandingPage'))
const BlogIndexPage = lazy(() => import('@/pages/BlogIndexPage'))
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage'))
const DirectoryPage = lazy(() => import('@/pages/DirectoryPage'))
// Páginas públicas: legal y contacto
const LegalPage = lazy(() => import('@/pages/LegalPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))

// Loading component
function AppLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-lg font-semibold text-foreground">{APP_CONFIG.NAME}</h2>
        <p className="text-muted-foreground">Cargando aplicación...</p>
      </div>
    </div>
  )
}

// Protected Route wrapper para rutas autenticadas
function ProtectedRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AppLoader />
  }

  if (!user) {
    // Redirigir a login guardando la URL de origen
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}

// Wrapper para MainApp con NotificationProvider
function AuthenticatedApp() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <NotificationProvider userId={user.id}>
      <MainApp onLogout={handleLogout} />
    </NotificationProvider>
  )
}

function AppRoutes() {
  const navigate = useNavigate();
  
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<LandingPage onNavigateToAuth={() => navigate('/login')} onNavigateToRegister={() => navigate('/register')} />} />
      <Route path="/login" element={<AuthScreen />} />
      <Route path="/register" element={<AuthScreen />} />
      
      {/* Perfil público de negocio - accesible sin autenticación */}
      <Route path="/negocio/:slug" element={<PublicBusinessProfile />} />
      <Route path="/profesional/:employeeId" element={<PublicEmployeeProfile />} />

      {/* SEO: Landing pages por vertical de industria */}
      <Route path="/para/:vertical" element={<VerticalLandingPage />} />

      {/* SEO: Blog de contenidos */}
      <Route path="/blog" element={<BlogIndexPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />

      {/* SEO: Directorio por categoría + ciudad */}
      <Route path="/directorio/:categoria/:ciudad" element={<DirectoryPage />} />

      {/* Páginas informativas públicas */}
      <Route path="/terminos"   element={<LegalPage />} />
      <Route path="/privacidad" element={<LegalPage />} />
      <Route path="/cookies"    element={<LegalPage />} />
      <Route path="/contacto"   element={<ContactPage />} />

      {/* Rutas públicas para confirmación de citas */}
      <Route path="/confirmar-cita/:token" element={<AppointmentConfirmation />} />
      <Route path="/cancelar-cita/:token" element={<AppointmentCancellation />} />
      <Route path="/reprogramar-cita/:token" element={<AppointmentReschedule />} />

      {/* OAuth callback para Google Calendar */}
      <Route path="/auth/google/callback" element={<GoogleCalendarCallback />} />
      
      {/* Rutas protegidas - requieren autenticación */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <AuthenticatedApp />
          </ProtectedRoute>
        }
      />
      
      {/* Ruta de testing de permisos (dev only - excluida en producción) */}
      {import.meta.env.DEV && PermissionTestingPage && (
        <Route
          path="/permission-testing"
          element={
            <ProtectedRoute>
              <PermissionTestingPage />
            </ProtectedRoute>
          }
        />
      )}
      
      {/* Redirigir rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  // Inicializar Google Analytics 4 si hay consentimiento
  useEffect(() => {
    if (hasAnalyticsConsent()) {
      initializeGA4()
    }
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<AppLoader />}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <LanguageProvider>
                <AppStateProvider>
                  <AuthProvider>
                    <AlertProvider>
                      <AppRoutes />
                      <CookieConsent />
                      {/* Toaster global para todas las rutas, incluidas públicas */}
                      <Toaster richColors closeButton />
                      {/* Vercel Analytics */}
                      <Analytics />
                    </AlertProvider>
                  </AuthProvider>
                </AppStateProvider>
              </LanguageProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
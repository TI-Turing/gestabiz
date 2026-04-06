import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight, Menu, X, LayoutDashboard } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { useAuth } from '@/hooks/useAuth'
// import { ThemeToggle } from '@/components/ui/theme-toggle'

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: Readonly<PublicLayoutProps>) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  const { user } = useAuth()

  const isLandingPage = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  return (
    <>
      {/* Navegación compartida */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          mobileMenuOpen || scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 focus:outline-none"
            >
              <img
                src="/favicon.svg"
                alt="Gestabiz"
                className="h-9 w-9 rounded-lg"
              />
              <span className="text-2xl font-bold bg-linear-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                Gestabiz
              </span>
            </button>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {isLandingPage && (
                <>
                  <a
                    href="#features"
                    className="text-gray-700/70 hover:text-purple-600 transition-colors font-medium"
                  >
                    {t('landing.nav.features')}
                  </a>
                  <a
                    href="#benefits"
                    className="text-gray-700/70 hover:text-purple-600 transition-colors font-medium"
                  >
                    {t('landing.nav.benefits')}
                  </a>
                  <a
                    href="#pricing"
                    className="text-gray-700/70 hover:text-purple-600 transition-colors font-medium"
                  >
                    {t('landing.nav.pricing')}
                  </a>
                  <a
                    href="#testimonials"
                    className="text-gray-700/70 hover:text-purple-600 transition-colors font-medium"
                  >
                    {t('landing.nav.testimonials')}
                  </a>
                </>
              )}
              <LanguageToggle />
              {/* <ThemeToggle /> */}
              {user ? (
                <Button
                  onClick={() => navigate('/app')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Ir a la app
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="text-gray-700/70 hover:text-purple-600"
                  >
                    {t('landing.nav.signIn')}
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {t('landing.nav.getStarted')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
              {isLandingPage && (
                <>
                  <a
                    href="#features"
                    className="block text-gray-600 hover:text-purple-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('landing.nav.features')}
                  </a>
                  <a
                    href="#benefits"
                    className="block text-gray-600 hover:text-purple-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('landing.nav.benefits')}
                  </a>
                  <a
                    href="#pricing"
                    className="block text-gray-600 hover:text-purple-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('landing.nav.pricing')}
                  </a>
                  <a
                    href="#testimonials"
                    className="block text-gray-600 hover:text-purple-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('landing.nav.testimonials')}
                  </a>
                </>
              )}
              <div className="flex justify-center gap-2">
                <LanguageToggle />
                {/* <ThemeToggle /> */}
              </div>
              {user ? (
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate('/app')
                  }}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Ir a la app
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      navigate('/login')
                    }}
                  >
                    {t('landing.nav.signIn')}
                  </Button>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      navigate('/register')
                    }}
                  >
                    {t('landing.nav.getStarted')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Contenido de la página */}
      {children}
    </>
  )
}

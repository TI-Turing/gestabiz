import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calendar, Clock, Users, TrendingUp, CheckCircle, Smartphone,
  BarChart3, MessageSquare, Briefcase, Shield, Zap, Star,
  ArrowRight, Menu, X, Bell, MapPin, CreditCard, FileText,
  Scissors, Heart, Smile, Activity, Target, Building2, Leaf,
  Sparkles, Dumbbell, Brain, ChevronDown, ChevronUp,
} from 'lucide-react'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { VERTICALS_MAP } from '@/data/verticals'

// Clases de gradiente completas (estáticas para que Tailwind las incluya en build)
const GRADIENT_CLASSES: Record<string, string> = {
  salones:         'from-pink-600 to-purple-600',
  barberias:       'from-slate-700 to-amber-600',
  clinicas:        'from-blue-600 to-cyan-500',
  gimnasios:       'from-orange-600 to-red-600',
  spas:            'from-teal-600 to-emerald-500',
  odontologos:     'from-sky-600 to-blue-500',
  psicologos:      'from-violet-600 to-purple-500',
  fisioterapeutas: 'from-green-600 to-teal-500',
  entrenadores:    'from-amber-600 to-orange-500',
  coworkings:      'from-indigo-600 to-blue-500',
}

// Map de iconos disponibles — extender según se necesite
const ICON_MAP: Record<string, React.ElementType> = {
  Calendar, Clock, Users, TrendingUp, CheckCircle, Smartphone,
  BarChart3, MessageSquare, Briefcase, Shield, Zap, Star,
  Bell, MapPin, CreditCard, FileText, Scissors, Heart, Smile,
  Activity, Target, Building2, Leaf, Sparkles, Dumbbell, Brain,
}

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Calendar
  return <Icon className={className} />
}

export default function VerticalLandingPage() {
  const { vertical: slug } = useParams<{ vertical: string }>()
  const navigate            = useNavigate()
  const analytics           = useAnalytics()
  const { user, loading }   = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled]             = useState(false)
  const [openFaq, setOpenFaq]               = useState<number | null>(null)

  const vertical = slug ? VERTICALS_MAP[slug] : undefined

  usePageMeta(
    vertical
      ? {
          title: vertical.metaTitle,
          description: vertical.metaDescription,
          keywords: vertical.metaKeywords.join(', '),
          ogType: 'website',
          ogUrl: `https://gestabiz.com${vertical.canonicalPath}`,
          ogImage: vertical.ogImage,
          canonical: `https://gestabiz.com${vertical.canonicalPath}`,
        }
      : {
          title: 'Software para Negocios de Servicios en Colombia | Gestabiz',
          description: 'Gestabiz: plataforma todo-en-uno para gestionar citas, clientes y empleados.',
          canonical: 'https://gestabiz.com/',
        }
  )

  useEffect(() => {
    if (!vertical) {
      navigate('/', { replace: true })
      return
    }
    analytics.trackPageView(vertical.canonicalPath, `Software para ${vertical.name} — Gestabiz`)
  }, [vertical, analytics, navigate])

  useEffect(() => {
    if (!loading && user) navigate('/app', { replace: true })
  }, [user, loading, navigate])

  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      const saved = localStorage.getItem('theme')
      if (saved === 'dark') {
        document.documentElement.classList.remove('light')
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  if (!vertical) return null

  const gradientClass = GRADIENT_CLASSES[vertical.slug] ?? 'from-purple-600 to-blue-600'

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-purple-600 rounded-lg p-2">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Gestabiz</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/#features" className="text-gray-600 hover:text-purple-600 font-medium">Funciones</Link>
            <Link to="/#pricing" className="text-gray-600 hover:text-purple-600 font-medium">Precios</Link>
            <Link to="/blog" className="text-gray-600 hover:text-purple-600 font-medium">Blog</Link>
            <Button variant="ghost" onClick={() => navigate('/login')}>Iniciar Sesión</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/register')}>
              Prueba Gratis
            </Button>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 p-4 space-y-3">
            <Link to="/#features" className="block text-gray-600 hover:text-purple-600">Funciones</Link>
            <Link to="/#pricing" className="block text-gray-600 hover:text-purple-600">Precios</Link>
            <Link to="/blog" className="block text-gray-600 hover:text-purple-600">Blog</Link>
            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/register')}>
              Prueba Gratis — Sin Tarjeta
            </Button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 bg-purple-100 text-purple-700 border-purple-300 text-sm px-4 py-1">
            Diseñado para {vertical.namePlural} en Colombia
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 mb-6">
            {vertical.headline}
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {vertical.subheadline}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8"
              onClick={() => navigate('/register')}
            >
              Empieza Gratis — 30 días sin tarjeta
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
              Ya tengo cuenta
            </Button>
          </div>

          {/* Stats rápidos */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {vertical.stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`text-3xl font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pain Points ── */}
      <section className="py-16 px-4 bg-red-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              ¿Te identificas con alguno de estos problemas?
            </h2>
            <p className="text-gray-600">Gestabiz fue creado para resolver exactamente estos dolores de cabeza</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {vertical.painPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-red-100 shadow-sm">
                <span className="text-red-500 mt-0.5 shrink-0">✗</span>
                <p className="text-gray-700">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-300">
              Funciones para {vertical.namePlural}
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas en una sola app
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Sin papeles, sin confusión, sin perder clientes. Gestabiz tiene todo lo que tu {vertical.name.toLowerCase()} necesita.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vertical.features.map((feature, i) => (
              <Card key={i} className="bg-white border-gray-200 hover:border-purple-600/50 transition-all hover:shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <DynamicIcon name={feature.iconName} className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Empieza en 3 pasos</h2>
            <p className="text-xl text-gray-600">En menos de 15 minutos tu {vertical.name.toLowerCase()} ya está en línea</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Crea tu cuenta', desc: 'Regístrate gratis en 2 minutos. Sin tarjeta de crédito. Sin contratos.' },
              { step: '02', title: 'Configura tu negocio', desc: `Agrega tus servicios, empleados y horarios. Tu ${vertical.name.toLowerCase()} queda listo en minutos.` },
              { step: '03', title: 'Comparte tu agenda', desc: 'Tus clientes ya pueden reservar online 24/7. Tú recibes notificaciones en tiempo real.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${gradientClass} flex items-center justify-center text-white font-bold text-xl mx-auto mb-4`}>
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Lo que dicen nuestros clientes</h2>
          </div>
          <Card className="relative overflow-hidden bg-white border-gray-200 shadow-xl">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-xl text-gray-700 italic leading-relaxed">
                "{vertical.testimonial.text}"
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="font-bold text-purple-600 text-xl">{vertical.testimonial.avatarInitial}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-lg">{vertical.testimonial.name}</div>
                  <div className="text-gray-600">{vertical.testimonial.businessName}</div>
                  <div className="text-sm text-gray-500">{vertical.testimonial.city}</div>
                </div>
              </div>
              <Badge className="absolute top-6 right-6 bg-green-100 text-green-700 border-green-300 text-sm">
                {vertical.testimonial.stat}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h2>
            <p className="text-gray-600">Todo lo que necesitas saber antes de empezar</p>
          </div>
          <div className="space-y-3">
            {vertical.faqItems.map((faq, i) => (
              <Card key={i} className="border-gray-200">
                <button
                  className="w-full text-left p-6 flex items-center justify-between"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openFaq === i
                    ? <ChevronUp className="h-5 w-5 text-purple-600 shrink-0" />
                    : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {faq.answer}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Related verticals ── */}
      {vertical.relatedVerticals.length > 0 && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <p className="text-gray-500 text-sm mb-4">Gestabiz también funciona para:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {vertical.relatedVerticals.map(rel => {
                const relData = VERTICALS_MAP[rel]
                if (!relData) return null
                return (
                  <Link key={rel} to={relData.canonicalPath}>
                    <Badge variant="outline" className="text-purple-600 border-purple-300 hover:bg-purple-50 cursor-pointer px-4 py-1.5 text-sm">
                      {relData.namePlural}
                    </Badge>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA final ── */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-r from-purple-600 to-purple-500 border-0 text-white">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-4xl font-bold text-white">
                Empieza Gratis Hoy — Sin Tarjeta de Crédito
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Únete a cientos de {vertical.namePlural} en Colombia que ya gestionan sus citas, clientes y empleados con Gestabiz.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-purple-600 hover:bg-white/90 text-lg"
                  onClick={() => navigate('/register')}
                >
                  Crear Cuenta Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg border-none shadow-md"
                  onClick={() => navigate('/login')}
                >
                  Iniciar Sesión
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 text-sm text-white/80">
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> 30 días gratis sin límites</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Sin tarjeta de crédito</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Soporte en español</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

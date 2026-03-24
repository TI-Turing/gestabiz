import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Menu, X, Clock, ArrowRight, Search } from 'lucide-react'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { BLOG_POSTS } from '@/data/blog'

const CATEGORY_LABELS: Record<string, string> = {
  guias: 'Guías',
  negocios: 'Negocios',
  tecnologia: 'Tecnología',
  comparativas: 'Comparativas',
}

const CATEGORY_COLORS: Record<string, string> = {
  guias: 'bg-blue-100 text-blue-700 border-blue-300',
  negocios: 'bg-green-100 text-green-700 border-green-300',
  tecnologia: 'bg-purple-100 text-purple-700 border-purple-300',
  comparativas: 'bg-orange-100 text-orange-700 border-orange-300',
}

export default function BlogIndexPage() {
  const navigate            = useNavigate()
  const analytics           = useAnalytics()
  const { user, loading }   = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled]             = useState(false)
  const [search, setSearch]                 = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  usePageMeta({
    title: 'Blog de Gestabiz — Guías para Negocios de Servicios en Colombia',
    description: 'Artículos, guías y comparativas para dueños de salones, clínicas, gimnasios y más negocios de servicios en Colombia. Aprende a gestionar mejor tu negocio.',
    keywords: 'blog gestión negocios colombia, guías salón belleza, software citas colombia, digitalizar pyme colombia',
    canonical: 'https://gestabiz.com/blog',
    ogUrl: 'https://gestabiz.com/blog',
    ogImage: 'https://gestabiz.com/og-image.png',
  })

  useEffect(() => {
    analytics.trackPageView('/blog', 'Blog — Gestabiz')
  }, [analytics])

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
      }
    }
  }, [])

  const published = BLOG_POSTS.filter(p => p.published)
  const featured  = published.find(p => p.featured)

  const filtered = published.filter(p => {
    const matchesSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase())
    const matchesCat = !activeCategory || p.category === activeCategory
    return matchesSearch && matchesCat
  })

  const categories = Array.from(new Set(published.map(p => p.category)))

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/80 backdrop-blur-sm border-b border-gray-100'}`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-purple-600 rounded-lg p-2">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Gestabiz</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-600 hover:text-purple-600 font-medium">Inicio</Link>
            <Link to="/#pricing" className="text-gray-600 hover:text-purple-600 font-medium">Precios</Link>
            <span className="font-semibold text-purple-600">Blog</span>
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
            <Link to="/" className="block text-gray-600">Inicio</Link>
            <Link to="/#pricing" className="block text-gray-600">Precios</Link>
            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/register')}>
              Prueba Gratis
            </Button>
          </div>
        )}
      </nav>

      {/* ── Header ── */}
      <section className="pt-28 pb-12 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-300">Blog</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Recursos para Hacer Crecer tu Negocio
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Guías prácticas, comparativas y consejos para dueños de negocios de servicios en Colombia.
          </p>
        </div>
      </section>

      {/* ── Búsqueda y filtros ── */}
      <section className="py-6 px-4 border-b border-gray-200 bg-white sticky top-[73px] z-40">
        <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar artículos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!activeCategory ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured article ── */}
      {featured && !search && !activeCategory && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <Link to={`/blog/${featured.slug}`} className="block group">
              <Card className="overflow-hidden border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 h-48 flex items-center justify-center">
                    <Calendar className="h-24 w-24 text-white/20" />
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className={CATEGORY_COLORS[featured.category]}>
                        {CATEGORY_LABELS[featured.category]}
                      </Badge>
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Destacado</Badge>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-3">
                      {featured.title}
                    </h2>
                    <p className="text-gray-600 text-lg mb-4 leading-relaxed">{featured.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{featured.author.name}</span>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{featured.readingTimeMinutes} min de lectura</span>
                        </div>
                        <span>·</span>
                        <span>{new Date(featured.publishedAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1 text-purple-600 font-medium text-sm group-hover:gap-2 transition-all">
                        Leer artículo <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      )}

      {/* ── Article grid ── */}
      <section className="py-8 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              No se encontraron artículos para esa búsqueda.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filtered
                .filter(p => !featured || p.slug !== featured.slug || search || activeCategory)
                .map(post => (
                  <Link key={post.slug} to={`/blog/${post.slug}`} className="group block">
                    <Card className="h-full border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={CATEGORY_COLORS[post.category]}>
                            {CATEGORY_LABELS[post.category]}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors mb-2 leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-4">{post.excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{post.readingTimeMinutes} min</span>
                          </div>
                          <span>{new Date(post.publishedAt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-3xl">
          <Card className="bg-gradient-to-r from-purple-600 to-purple-500 border-0 text-white">
            <CardContent className="p-10 text-center space-y-5">
              <h2 className="text-3xl font-bold">¿Listo para aplicar todo esto en tu negocio?</h2>
              <p className="text-white/90 text-lg">
                Prueba Gestabiz gratis por 30 días y comprueba la diferencia.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-purple-600 hover:bg-white/90"
                onClick={() => navigate('/register')}
              >
                Crear Cuenta Gratis — Sin Tarjeta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Menu, X, Clock, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { BLOG_POSTS_MAP } from '@/data/blog'

export interface BlogSection {
  type: 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'callout' | 'cta'
  content: string | string[]
  variant?: 'info' | 'warning' | 'success'
}

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

const CALLOUT_STYLES: Record<string, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  success: 'bg-green-50 border-green-200 text-green-800',
}

function ContentRenderer({ sections, onRegister }: { sections: BlogSection[]; onRegister: () => void }) {
  return (
    <div className="prose-content space-y-6">
      {sections.map((section, i) => {
        switch (section.type) {
          case 'h2':
            return (
              <h2 key={i} className="text-2xl font-bold text-gray-900 mt-10 mb-4 leading-tight">
                {section.content as string}
              </h2>
            )
          case 'h3':
            return (
              <h3 key={i} className="text-xl font-semibold text-gray-900 mt-8 mb-3">
                {section.content as string}
              </h3>
            )
          case 'p':
            return (
              <p key={i} className="text-gray-700 leading-relaxed text-lg">
                {section.content as string}
              </p>
            )
          case 'ul':
            return (
              <ul key={i} className="space-y-2 ml-4">
                {(section.content as string[]).map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="space-y-3 ml-4">
                {(section.content as string[]).map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-gray-700">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {j + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ol>
            )
          case 'callout':
            return (
              <div key={i} className={`border-l-4 rounded-r-lg p-5 ${CALLOUT_STYLES[section.variant ?? 'info']}`}>
                <p className="leading-relaxed">{section.content as string}</p>
              </div>
            )
          case 'cta':
            return (
              <Card key={i} className="bg-gradient-to-r from-purple-600 to-purple-500 border-0 my-8">
                <CardContent className="p-8 text-center space-y-4">
                  <p className="text-white text-xl font-semibold">{section.content as string}</p>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-purple-600 hover:bg-white/90"
                    onClick={onRegister}
                  >
                    Prueba Gestabiz Gratis — 30 Días sin Tarjeta
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            )
          default:
            return null
        }
      })}
    </div>
  )
}

export default function BlogPostPage() {
  const { slug }            = useParams<{ slug: string }>()
  const navigate            = useNavigate()
  const analytics           = useAnalytics()
  const { user, loading }   = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled]             = useState(false)
  const [sections, setSections]             = useState<BlogSection[]>([])

  const post = slug ? BLOG_POSTS_MAP[slug] : undefined

  usePageMeta(
    post
      ? {
          title: post.metaTitle,
          description: post.metaDescription,
          keywords: post.metaKeywords.join(', '),
          ogType: 'article',
          ogUrl: `https://gestabiz.com${post.canonicalPath}`,
          ogImage: post.ogImage,
          canonical: `https://gestabiz.com${post.canonicalPath}`,
        }
      : { title: 'Blog — Gestabiz', description: 'Artículos y guías para negocios de servicios en Colombia.' }
  )

  useEffect(() => {
    if (!post) {
      navigate('/blog', { replace: true })
      return
    }
    analytics.trackPageView(post.canonicalPath, post.title)

    // Carga dinámica del contenido del artículo
    import(`@/content/blog/${post.slug}`)
      .then(mod => setSections(mod.sections ?? []))
      .catch(() => setSections([]))
  }, [post, analytics, navigate])

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

  if (!post) return null

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white border-b border-gray-100'}`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-purple-600 rounded-lg p-2">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Gestabiz</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-600 hover:text-purple-600">Inicio</Link>
            <Link to="/blog" className="text-gray-600 hover:text-purple-600 font-medium">Blog</Link>
            <Button variant="ghost" onClick={() => navigate('/login')}>Iniciar Sesión</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/register')}>Prueba Gratis</Button>
          </div>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 p-4 space-y-3">
            <Link to="/blog" className="block text-gray-600">Blog</Link>
            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/register')}>
              Prueba Gratis
            </Button>
          </div>
        )}
      </nav>

      {/* ── Article header ── */}
      <section className="pt-28 pb-10 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 mb-6">
            <ArrowLeft className="h-4 w-4" /> Volver al blog
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <Badge className={CATEGORY_COLORS[post.category]}>{CATEGORY_LABELS[post.category]}</Badge>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{post.readingTimeMinutes} minutos de lectura</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5">
            {post.title}
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed mb-6">{post.excerpt}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                {post.author.avatarInitial}
              </div>
              <div>
                <span className="font-medium text-gray-700">{post.author.name}</span>
                <span className="text-gray-400 ml-2">·</span>
                <span className="ml-2">
                  {new Date(post.publishedAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Article content ── */}
      <article className="py-10 px-4">
        <div className="container mx-auto max-w-3xl">
          {sections.length > 0 ? (
            <ContentRenderer sections={sections} onRegister={() => navigate('/register')} />
          ) : (
            <div className="space-y-4 text-gray-400 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-100 rounded w-full" />
              ))}
            </div>
          )}
        </div>
      </article>

      {/* ── Article footer CTA ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-3xl">
          <Card className="bg-gradient-to-r from-purple-600 to-purple-500 border-0">
            <CardContent className="p-10 text-center space-y-5">
              <h2 className="text-3xl font-bold text-white">
                ¿Listo para transformar tu negocio?
              </h2>
              <p className="text-white/90 text-lg">
                Prueba Gestabiz gratis por 30 días. Sin tarjeta de crédito, sin compromisos.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-purple-600 hover:bg-white/90"
                onClick={() => navigate('/register')}
              >
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

          {/* Related verticals */}
          {post.relatedVerticals.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-3">¿Tu tipo de negocio?</p>
              <div className="flex flex-wrap justify-center gap-2">
                {post.relatedVerticals.map(slug => (
                  <Link key={slug} to={`/para/${slug}`}>
                    <Badge variant="outline" className="text-purple-600 border-purple-300 hover:bg-purple-50 cursor-pointer px-3 py-1">
                      Ver software para {slug}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

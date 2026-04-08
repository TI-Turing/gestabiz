/**
 * DirectoryPage — Directorio de negocios por categoría + ciudad
 *
 * Ruta: /directorio/:categoria/:ciudad
 * Ej:   /directorio/barberias/bogota
 *
 * Captura búsquedas genéricas ("barberías bogotá") y enlaza a cada
 * perfil de negocio registrado en Gestabiz, pasando autoridad de dominio
 * hacia los perfiles individuales.
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Star, ChevronRight, Search, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useAnalytics } from '@/hooks/useAnalytics'
import { supabase } from '@/lib/supabase'

// ─── Catálogos ────────────────────────────────────────────────────────────────

const CATEGORIAS: Record<string, { label: string; description: string; relatedSlugs: string[] }> = {
  barberias:       { label: 'Barberías',               description: 'Cortes de cabello, afeitado y arreglo de barba',              relatedSlugs: ['salones'] },
  salones:         { label: 'Salones de Belleza',       description: 'Corte, coloración, peinados y tratamientos capilares',        relatedSlugs: ['barberias', 'spas'] },
  clinicas:        { label: 'Clínicas',                 description: 'Consultas médicas y procedimientos de salud',                 relatedSlugs: ['odontologos', 'psicologos', 'fisioterapeutas'] },
  spas:            { label: 'Spas',                     description: 'Masajes, tratamientos corporales y relajación',               relatedSlugs: ['salones', 'clinicas'] },
  gimnasios:       { label: 'Gimnasios',                description: 'Entrenamiento físico, clases grupales y fitness',             relatedSlugs: ['entrenadores', 'fisioterapeutas'] },
  odontologos:     { label: 'Odontólogos',              description: 'Cuidado dental, blanqueamiento y ortodoncia',                 relatedSlugs: ['clinicas'] },
  psicologos:      { label: 'Psicólogos',               description: 'Consultas psicológicas y terapia',                           relatedSlugs: ['clinicas'] },
  fisioterapeutas: { label: 'Fisioterapeutas',          description: 'Rehabilitación, terapia física y manejo del dolor',           relatedSlugs: ['clinicas', 'gimnasios'] },
  nutricionistas:  { label: 'Nutricionistas',           description: 'Planes de alimentación y asesoría nutricional',              relatedSlugs: ['fisioterapeutas', 'gimnasios'] },
  entrenadores:    { label: 'Entrenadores Personales',  description: 'Entrenamiento personalizado y planes de ejercicio',           relatedSlugs: ['gimnasios'] },
}

const CIUDADES: Record<string, string> = {
  bogota: 'Bogotá', medellin: 'Medellín', cali: 'Cali', barranquilla: 'Barranquilla',
  cartagena: 'Cartagena', bucaramanga: 'Bucaramanga', pereira: 'Pereira',
  manizales: 'Manizales', cucuta: 'Cúcuta', ibague: 'Ibagué', armenia: 'Armenia',
  pasto: 'Pasto', villavicencio: 'Villavicencio', monteria: 'Montería',
  neiva: 'Neiva', santa_marta: 'Santa Marta',
}

const OTHER_CITIES = ['bogota', 'medellin', 'cali', 'barranquilla', 'cartagena', 'bucaramanga', 'pereira', 'manizales']

interface BusinessResult {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  average_rating: number | null
  review_count: number | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DirectoryPage() {
  const { categoria: categoriaSlug = '', ciudad: ciudadSlug = '' } = useParams<{ categoria: string; ciudad: string }>()
  const navigate = useNavigate()
  const analytics = useAnalytics()

  const categoriaInfo = CATEGORIAS[categoriaSlug]
  const ciudadNombre = CIUDADES[ciudadSlug]

  const [businesses, setBusinesses] = useState<BusinessResult[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  // SEO meta tags
  usePageMeta({
    title: categoriaInfo && ciudadNombre ? `${categoriaInfo.label} en ${ciudadNombre} | Gestabiz` : undefined,
    description: categoriaInfo && ciudadNombre
      ? `Encuentra y reserva cita en las mejores ${categoriaInfo.label.toLowerCase()} de ${ciudadNombre}. Reserva online 24/7 con Gestabiz.`
      : undefined,
    keywords: categoriaInfo && ciudadNombre
      ? `${categoriaInfo.label.toLowerCase()} ${ciudadNombre.toLowerCase()}, reservar cita ${ciudadNombre.toLowerCase()}, ${categoriaInfo.label.toLowerCase()} cerca de mí`
      : undefined,
    ogType: 'website',
    canonical: categoriaInfo && ciudadNombre ? `https://gestabiz.com/directorio/${categoriaSlug}/${ciudadSlug}` : undefined,
  })

  useEffect(() => {
    if (!categoriaInfo || !ciudadNombre) return
    analytics.trackPageView(`/directorio/${categoriaSlug}/${ciudadSlug}`)
  }, [categoriaSlug, ciudadSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!categoriaInfo || !ciudadNombre) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      try {
        // Intentar RPC especializado primero
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'search_businesses_by_category_city',
          { p_category_slug: categoriaSlug, p_city_name: ciudadNombre, p_limit: 30 }
        )

        if (!rpcError && rpcData) {
          setBusinesses(rpcData as BusinessResult[])
          setLoading(false)
          return
        }

        // Fallback: buscar categoría → negocios de esa categoría
        const { data: catData } = await supabase
          .from('business_categories')
          .select('id')
          .eq('slug', categoriaSlug)
          .eq('is_active', true)
          .single()

        if (!catData) {
          setBusinesses([])
          setLoading(false)
          return
        }

        const { data } = await supabase
          .from('businesses')
          .select('id, name, slug, description, logo_url, banner_url, average_rating, review_count')
          .eq('is_public', true)
          .eq('is_active', true)
          .eq('category_id', catData.id)
          .order('average_rating', { ascending: false, nullsFirst: false })
          .limit(30)

        setBusinesses((data ?? []) as BusinessResult[])
      } catch {
        setBusinesses([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [categoriaSlug, ciudadSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  // Ruta inválida
  if (!categoriaInfo || !ciudadNombre) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground text-lg">Directorio no encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/')}>Ir al inicio</Button>
      </div>
    )
  }

  const filtered = businesses.filter(b =>
    !query || b.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="font-bold text-xl text-foreground tracking-tight">
            Gestabiz
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
              Iniciar sesión
            </Button>
            <Button size="sm" onClick={() => navigate('/register')}>
              Registrar negocio
            </Button>
          </div>
        </div>
      </header>

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className="bg-muted/40 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3" />
          <span>Directorio</span>
          <ChevronRight className="w-3 h-3" />
          <span>{categoriaInfo.label}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{ciudadNombre}</span>
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {categoriaInfo.label} en {ciudadNombre}
          </h1>
          <p className="text-muted-foreground mb-6 max-w-2xl">
            {categoriaInfo.description}. Reserva tu cita online, 24/7, sin llamadas ni esperas.
          </p>

          {/* Buscador local */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder={`Buscar ${categoriaInfo.label.toLowerCase()}...`}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* ── Listado ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse h-44" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {query ? 'Sin resultados para tu búsqueda' : `Aún no hay ${categoriaInfo.label.toLowerCase()} registradas en ${ciudadNombre}`}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
              {query
                ? 'Intenta con otro nombre.'
                : `¿Tienes un negocio en ${ciudadNombre}? Regístralo gratis y aparece aquí.`}
            </p>
            {!query && (
              <Button onClick={() => navigate('/register')}>
                Registrar mi negocio gratis
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              {filtered.length} {filtered.length === 1 ? 'negocio encontrado' : 'negocios encontrados'}
              {query ? ` para "${query}"` : ` en ${ciudadNombre}`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(b => (
                <BusinessCard key={b.id} business={b} ciudadNombre={ciudadNombre} />
              ))}
            </div>
          </>
        )}

        {/* ── CTA registro ──────────────────────────────────────────────────── */}
        <div className="mt-12 rounded-2xl bg-primary/5 border border-primary/20 p-8 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">
            ¿Tu negocio no aparece aquí?
          </h2>
          <p className="text-muted-foreground mb-5 text-sm max-w-md mx-auto">
            Regístrate gratis en Gestabiz y empieza a recibir reservas online desde hoy.
            Sin tarjeta de crédito.
          </p>
          <Button onClick={() => navigate('/register')} size="lg">
            Registrar mi negocio gratis
          </Button>
        </div>

        {/* ── Otras ciudades ────────────────────────────────────────────────── */}
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {categoriaInfo.label} en otras ciudades
          </h2>
          <div className="flex flex-wrap gap-2">
            {OTHER_CITIES.filter(c => c !== ciudadSlug).map(c => (
              <Link
                key={c}
                to={`/directorio/${categoriaSlug}/${c}`}
                className="text-sm px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-colors text-foreground"
              >
                {CIUDADES[c]}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Categorías relacionadas ───────────────────────────────────────── */}
        {categoriaInfo.relatedSlugs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              También en {ciudadNombre}
            </h2>
            <div className="flex flex-wrap gap-2">
              {categoriaInfo.relatedSlugs.map(slug => {
                const cat = CATEGORIAS[slug]
                return cat ? (
                  <Link
                    key={slug}
                    to={`/directorio/${slug}/${ciudadSlug}`}
                    className="text-sm px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-colors text-foreground"
                  >
                    {cat.label}
                  </Link>
                ) : null
              })}
            </div>
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  )
}

// ─── BusinessCard ─────────────────────────────────────────────────────────────

function BusinessCard({ business, ciudadNombre }: { business: BusinessResult; ciudadNombre: string }) {
  const navigate = useNavigate()
  const initials = business.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <article
      className="rounded-xl border border-border bg-card hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
      onClick={() => navigate(`/negocio/${business.slug}`)}
    >
      {/* Banner / logo - 16:9 Aspect Ratio */}
      <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
        {business.banner_url ? (
          <img src={business.banner_url} alt={business.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl font-bold text-muted-foreground/40">{initials}</span>
        )}
        {business.logo_url && (
          <img
            src={business.logo_url}
            alt=""
            className="absolute bottom-2 left-3 w-10 h-10 rounded-full border-2 border-background object-cover bg-background"
          />
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 line-clamp-1">
          {business.name}
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="w-3 h-3" />
          <span>{ciudadNombre}</span>
        </div>
        {business.average_rating && (
          <div className="flex items-center gap-1 text-xs mb-2">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">{business.average_rating.toFixed(1)}</span>
            {business.review_count && (
              <span className="text-muted-foreground">({business.review_count})</span>
            )}
          </div>
        )}
        {business.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{business.description}</p>
        )}
        <Badge variant="secondary" className="text-xs">Reserva online</Badge>
      </div>
    </article>
  )
}

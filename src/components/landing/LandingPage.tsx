import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  Smartphone,
  BarChart3,
  MessageSquare,
  Briefcase,
  Shield,
  Zap,
  Star,
  ArrowRight,
} from 'lucide-react'
import { PricingPlans } from './PricingPlans'
import { LandingFooter } from './LandingFooter'
import { PublicLayout } from './PublicLayout'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { usePageMeta } from '@/hooks/usePageMeta'

interface LandingPageProps {
  onNavigateToAuth: () => void
  onNavigateToRegister?: () => void
}

// Mock appointments for hero illustration — visual only, not real user data
const MOCK_APPOINTMENTS = [
  { name: 'Valentina Torres', service: 'Corte + Tinte', time: '9:00 AM', bar: 'bg-purple-500' },
  { name: 'Dr. Andrés López', service: 'Consulta Inicial', time: '10:30 AM', bar: 'bg-blue-500' },
  { name: 'Camila Ruiz', service: 'Masaje Relajante', time: '11:15 AM', bar: 'bg-emerald-500' },
]

// 4-color icon system: purple (core), blue (data), emerald (people/comms), orange (business)
const FEATURES = [
  {
    icon: Calendar,
    titleKey: 'landing.features.list.appointments.title',
    descKey: 'landing.features.list.appointments.description',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  {
    icon: MessageSquare,
    titleKey: 'landing.features.list.reminders.title',
    descKey: 'landing.features.list.reminders.description',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
  {
    icon: Users,
    titleKey: 'landing.features.list.clients.title',
    descKey: 'landing.features.list.clients.description',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
  {
    icon: BarChart3,
    titleKey: 'landing.features.list.accounting.title',
    descKey: 'landing.features.list.accounting.description',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    icon: Smartphone,
    titleKey: 'landing.features.list.mobile.title',
    descKey: 'landing.features.list.mobile.description',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  {
    icon: Briefcase,
    titleKey: 'landing.features.list.jobs.title',
    descKey: 'landing.features.list.jobs.description',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
  },
  {
    icon: TrendingUp,
    titleKey: 'landing.features.list.analytics.title',
    descKey: 'landing.features.list.analytics.description',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    icon: Zap,
    titleKey: 'landing.features.list.automation.title',
    descKey: 'landing.features.list.automation.description',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  {
    icon: Shield,
    titleKey: 'landing.features.list.security.title',
    descKey: 'landing.features.list.security.description',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
]

export function LandingPage({ onNavigateToAuth, onNavigateToRegister }: Readonly<LandingPageProps>) {
  const analytics = useAnalytics()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { t } = useLanguage()

  usePageMeta({
    title: 'Gestabiz — Software de Gestión de Citas Online para Negocios | Colombia',
    description: 'Gestabiz: plataforma todo-en-uno para salones, clínicas y gimnasios. Agenda citas online, recordatorios WhatsApp, gestión de clientes y contabilidad. Prueba gratis 30 días sin tarjeta.',
    keywords: 'software de gestión de citas, agendar citas online, sistema de agendamiento, reservas online, agenda online negocios, software salón de belleza, software peluquería, software barbería, software clínica, software gimnasio, software spa, gestión de turnos online, recordatorios WhatsApp citas, app para negocios colombia, software pyme colombia, plataforma saas colombia, sistema citas colombia',
    ogType: 'website',
    ogUrl: 'https://gestabiz.com/',
    ogImage: 'https://gestabiz.com/og-image.png',
    canonical: 'https://gestabiz.com/',
  })

  useEffect(() => {
    analytics.trackPageView('/', 'Landing Page - Gestabiz')
  }, [analytics])

  useEffect(() => {
    if (!loading && user) {
      navigate('/app', { replace: true })
    }
  }, [user, loading, navigate])


  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-background to-muted/30">

        {/* ── Hero ── */}
        <section className="pt-32 pb-20 px-4">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-600 hover:bg-purple-200 dark:hover:bg-purple-900/60">
                  {t('landing.hero.badge')}
                </Badge>

                <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                  {t('landing.hero.title')}{' '}
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {t('landing.hero.titleHighlight')}
                  </span>
                </h1>

                <p className="text-xl text-muted-foreground">
                  {t('landing.hero.subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 text-white text-lg transition-colors duration-200"
                    onClick={onNavigateToRegister ?? onNavigateToAuth}
                  >
                    {t('landing.hero.cta.trial')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="transition-colors duration-200"
                    onClick={() => {
                      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    {t('landing.hero.cta.pricing')}
                  </Button>
                </div>

                <div className="flex items-center gap-8 pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-muted-foreground">{t('landing.hero.cta.noCreditCard')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-muted-foreground">{t('landing.hero.cta.cancelAnytime')}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
                  <div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">800+</div>
                    <div className="text-sm text-muted-foreground">{t('landing.hero.stats.businesses')}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">50K+</div>
                    <div className="text-sm text-muted-foreground">{t('landing.hero.stats.appointments')}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">98%</div>
                    <div className="text-sm text-muted-foreground">{t('landing.hero.stats.satisfaction')}</div>
                  </div>
                </div>
              </div>

              {/* Hero Illustration — polished product mock */}
              <div className="relative">
                <Card className="relative bg-card border-purple-200 dark:border-purple-800 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="space-y-4">

                      {/* KPI row */}
                      <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm font-semibold text-foreground">{t('landing.dashboard.title')}</span>
                          </div>
                          <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-600 text-xs">
                            {t('landing.dashboard.today')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">24</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{t('landing.dashboard.appointments')}</div>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-100 dark:border-emerald-800">
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$2.4M</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{t('landing.dashboard.revenue')}</div>
                          </div>
                        </div>
                      </div>

                      {/* Upcoming appointments */}
                      <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">{t('landing.dashboard.upcoming')}</span>
                          <span className="ml-auto text-xs text-purple-600 dark:text-purple-400 font-medium">Ver todo</span>
                        </div>
                        <div className="space-y-2">
                          {MOCK_APPOINTMENTS.map((appt) => (
                            <div key={appt.name} className="flex items-center gap-3 bg-muted/50 rounded-lg p-2.5">
                              <div className={`w-1 h-8 rounded-full shrink-0 ${appt.bar}`} />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-foreground truncate">{appt.name}</div>
                                <div className="text-xs text-muted-foreground">{appt.time} · {appt.service}</div>
                              </div>
                              <Badge className="text-xs bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-600 shrink-0 gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {t('landing.dashboard.confirmed')}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Security badge */}
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                        <Shield className="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
                        <span>{t('landing.dashboard.secureData')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <Badge className="mb-4 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-600">{t('landing.features.badge')}</Badge>
              <h2 className="text-4xl font-bold mb-4 text-foreground">
                {t('landing.features.title')}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t('landing.features.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature) => (
                <Card
                  key={feature.titleKey}
                  className="bg-card border-border hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all duration-200 group"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className={`w-11 h-11 rounded-lg ${feature.iconBg} dark:bg-opacity-20 flex items-center justify-center`}>
                      <feature.icon className={`h-5 w-5 ${feature.iconColor} dark:opacity-90`} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors duration-200">
                      {t(feature.titleKey)}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{t(feature.descKey)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Benefits ── */}
        <section id="benefits" className="py-20 px-4">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-600">{t('landing.benefits.badge')}</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  {t('landing.benefits.title')}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t('landing.benefits.subtitle')}
                </p>

                {/* Stats — border-left design, no redundant circles */}
                <div className="grid grid-cols-2 gap-6">
                  {[
                    {
                      id: 'no-shows',
                      stat: t('landing.benefits.stats.noShows.value'),
                      label: t('landing.benefits.stats.noShows.label'),
                      description: t('landing.benefits.stats.noShows.description'),
                    },
                    {
                      id: 'time-saved',
                      stat: t('landing.benefits.stats.timeSaved.value'),
                      label: t('landing.benefits.stats.timeSaved.label'),
                      description: t('landing.benefits.stats.timeSaved.description'),
                    },
                    {
                      id: 'bookings',
                      stat: t('landing.benefits.stats.bookings.value'),
                      label: t('landing.benefits.stats.bookings.label'),
                      description: t('landing.benefits.stats.bookings.description'),
                    },
                    {
                      id: 'roi',
                      stat: t('landing.benefits.stats.roi.value'),
                      label: t('landing.benefits.stats.roi.label'),
                      description: t('landing.benefits.stats.roi.description'),
                    },
                  ].map((benefit) => (
                    <div key={benefit.id} className="pl-4 border-l-2 border-purple-600 dark:border-purple-400">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 leading-tight">{benefit.stat}</div>
                      <div className="font-semibold text-sm text-foreground mt-0.5">{benefit.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{benefit.description}</div>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="transition-colors duration-200"
                  onClick={onNavigateToRegister ?? onNavigateToAuth}
                >
                  {t('landing.benefits.cta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* ROI Calculator */}
              <div className="relative overflow-hidden">
                <Card className="relative bg-card border-border shadow-xl max-w-md mx-auto md:max-w-none">
                  <CardContent className="p-6 md:p-8 space-y-6">
                    <div className="text-center">
                      <div className="text-5xl md:text-6xl font-bold text-purple-600 dark:text-purple-400 mb-2">$1.250.000</div>
                      <div className="text-xl font-semibold text-foreground mb-2">{t('landing.benefits.calculator.lost')}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('landing.benefits.calculator.lostDescription')}
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold text-foreground">{t('landing.benefits.calculator.withGestabiz')}</span>
                        <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-600">{t('landing.benefits.calculator.recovered')}</Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t('landing.benefits.calculator.appointmentsRecovered')}</span>
                          <span className="font-semibold text-foreground">$875.000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t('landing.benefits.calculator.cost')}</span>
                          <span className="font-semibold text-foreground">-$79.900</span>
                        </div>
                        <div className="border-t border-border pt-3 flex justify-between">
                          <span className="font-bold text-foreground">{t('landing.benefits.calculator.netProfit')}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">+$795.100</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg p-4 text-center">
                      <div className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
                        {t('landing.benefits.calculator.paysSelf')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <Badge className="mb-4 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-600">{t('landing.pricing.badge')}</Badge>
              <h2 className="text-4xl font-bold mb-4 text-foreground">
                {t('landing.pricing.title')}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t('landing.pricing.subtitle')}
              </p>
            </div>

            <PricingPlans showCTA={true} onSelectPlan={onNavigateToAuth} />
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section id="testimonials" className="py-20 px-4">
          <div className="container mx-auto">
            {/* Different layout: left-aligned header + right-aligned stat pill */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <Badge className="mb-3 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-600">{t('landing.testimonials.badge')}</Badge>
                <h2 className="text-4xl font-bold text-foreground">
                  {t('landing.testimonials.title')}
                </h2>
              </div>
              <p className="text-muted-foreground text-sm sm:text-right max-w-xs">
                {t('landing.testimonials.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  nameKey: 'landing.testimonials.list.maria.name',
                  businessKey: 'landing.testimonials.list.maria.business',
                  textKey: 'landing.testimonials.list.maria.text',
                  statKey: 'landing.testimonials.list.maria.stat',
                  avatar: 'M',
                  rating: 5,
                },
                {
                  nameKey: 'landing.testimonials.list.carlos.name',
                  businessKey: 'landing.testimonials.list.carlos.business',
                  textKey: 'landing.testimonials.list.carlos.text',
                  statKey: 'landing.testimonials.list.carlos.stat',
                  avatar: 'C',
                  rating: 5,
                },
                {
                  nameKey: 'landing.testimonials.list.juan.name',
                  businessKey: 'landing.testimonials.list.juan.business',
                  textKey: 'landing.testimonials.list.juan.text',
                  statKey: 'landing.testimonials.list.juan.stat',
                  avatar: 'J',
                  rating: 5,
                },
              ].map((testimonial) => (
                <Card
                  key={testimonial.nameKey}
                  className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  <CardContent className="p-6 space-y-4 flex flex-col h-full">
                    {/* Decorative quote mark */}
                    <div className="text-5xl leading-none text-purple-200 dark:text-purple-800 font-serif select-none">"</div>

                    <p className="text-muted-foreground text-sm leading-relaxed flex-1 -mt-2">
                      {t(testimonial.textKey)}
                    </p>

                    <div className="flex items-center gap-1 pt-1">
                      {Array.from({ length: testimonial.rating }, (_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400 dark:fill-yellow-500 dark:text-yellow-500" />
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                          <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">{testimonial.avatar}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{t(testimonial.nameKey)}</div>
                          <div className="text-xs text-muted-foreground">{t(testimonial.businessKey)}</div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-50 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-600 text-xs shrink-0">
                        {t(testimonial.statKey)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <Card className="bg-gradient-to-r from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-600 border-0 text-white">
              <CardContent className="p-12 text-center space-y-6">
                <h2 className="text-4xl font-bold text-white">
                  {t('landing.cta.title')}
                </h2>
                <p className="text-xl text-white/90 max-w-2xl mx-auto">
                  {t('landing.cta.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white dark:bg-gray-100 text-purple-600 hover:bg-white/90 dark:hover:bg-gray-200 text-lg transition-colors duration-200"
                    onClick={onNavigateToRegister ?? onNavigateToAuth}
                  >
                    {t('landing.cta.buttons.trial')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white/20 dark:bg-white/10 text-white hover:bg-white/30 dark:hover:bg-white/20 text-lg border border-white/30 shadow-md transition-colors duration-200"
                    onClick={onNavigateToAuth}
                  >
                    {t('landing.cta.buttons.login')}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{t('landing.cta.benefits.noCreditCard')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{t('landing.cta.benefits.cancelAnytime')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{t('landing.cta.benefits.spanishSupport')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <LandingFooter />
      </div>
    </PublicLayout>
  )
}

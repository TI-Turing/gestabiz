import { Link } from 'react-router-dom'
import { Mail, Github, MessageSquare, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PublicLayout } from '@/components/landing/PublicLayout'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { usePageMeta } from '@/hooks/usePageMeta'

export default function ContactPage() {
  usePageMeta({
    title: 'Contacto — Gestabiz',
    description: 'Comunícate con el equipo de Gestabiz. Soporte técnico, preguntas sobre planes y consultas generales.',
    canonical: 'https://gestabiz.com/contacto',
  })

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 pt-32 pb-20 max-w-3xl">

          {/* Header */}
          <div className="mb-12 text-center">
            <Badge className="mb-4 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800">
              Contacto
            </Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">¿Cómo podemos ayudarte?</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              El equipo de Ti Turing está disponible para resolver tus dudas sobre Gestabiz.
            </p>
          </div>

          {/* Contact cards */}
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            <Card className="bg-card border-border hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200">
              <CardContent className="p-6 space-y-4">
                <div className="w-11 h-11 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Soporte técnico</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    ¿Tienes un problema con la plataforma? Escríbenos y respondemos en menos de 24 horas hábiles.
                  </p>
                  <a
                    href="mailto:jlap.11@hotmail.com"
                    className="text-sm font-medium text-purple-600 hover:underline"
                  >
                    jlap.11@hotmail.com
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200">
              <CardContent className="p-6 space-y-4">
                <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                  <Github className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Reportar un bug</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Encontraste un error o tienes una sugerencia de mejora para Gestabiz.
                  </p>
                  <a
                    href="https://github.com/TI-Turing/Gestabiz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-purple-600 hover:underline"
                  >
                    github.com/TI-Turing/Gestabiz
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200">
              <CardContent className="p-6 space-y-4">
                <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Consultas comerciales</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Preguntas sobre planes, precios o integraciones personalizadas para tu negocio.
                  </p>
                  <a
                    href="mailto:jlap.11@hotmail.com?subject=Consulta%20comercial%20Gestabiz"
                    className="text-sm font-medium text-purple-600 hover:underline"
                  >
                    Enviar consulta
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <div className="w-11 h-11 rounded-lg bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Horario de atención</h3>
                  <p className="text-sm text-muted-foreground">
                    Lunes a viernes<br />
                    <span className="font-medium text-foreground">8:00 AM – 6:00 PM</span><br />
                    Hora Colombia (UTC-5)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer nav */}
          <div className="pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link to="/terminos"   className="hover:text-purple-600 transition-colors">Términos</Link>
            <Link to="/privacidad" className="hover:text-purple-600 transition-colors">Privacidad</Link>
            <Link to="/cookies"    className="hover:text-purple-600 transition-colors">Cookies</Link>
            <Link to="/"           className="hover:text-purple-600 transition-colors ml-auto">← Volver al inicio</Link>
          </div>
        </div>

        <LandingFooter />
      </div>
    </PublicLayout>
  )
}

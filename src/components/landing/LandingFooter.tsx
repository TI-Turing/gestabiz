import { Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { APP_CONFIG } from '@/constants'
import { useLanguage } from '@/contexts/LanguageContext'
import { Link } from 'react-router-dom'
import logoTiTuring from '@/assets/images/tt/1.png'

export function LandingFooter() {
  const { t } = useLanguage()

  return (
    <footer className="py-12 px-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-purple-600 rounded-lg p-2">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-gray-100">Gestabiz</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('landing.footer.tagline')}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/para/salones"   className="text-xs text-purple-600 hover:underline">Salones</Link>
              <span className="text-gray-400 dark:text-gray-600">·</span>
              <Link to="/para/clinicas"  className="text-xs text-purple-600 hover:underline">Clínicas</Link>
              <span className="text-gray-400 dark:text-gray-600">·</span>
              <Link to="/para/barberias" className="text-xs text-purple-600 hover:underline">Barberías</Link>
              <span className="text-gray-400 dark:text-gray-600">·</span>
              <Link to="/para/gimnasios" className="text-xs text-purple-600 hover:underline">Gimnasios</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('landing.footer.product.title')}</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#features" className="hover:text-purple-600 transition-colors">{t('landing.footer.product.features')}</a></li>
              <li><a href="#pricing"  className="hover:text-purple-600 transition-colors">{t('landing.footer.product.pricing')}</a></li>
              <li><Link to="/para/salones"   className="hover:text-purple-600 transition-colors">Para Salones de Belleza</Link></li>
              <li><Link to="/para/clinicas"  className="hover:text-purple-600 transition-colors">Para Clínicas Médicas</Link></li>
              <li><Link to="/para/barberias" className="hover:text-purple-600 transition-colors">Para Barberías</Link></li>
              <li><Link to="/para/gimnasios" className="hover:text-purple-600 transition-colors">Para Gimnasios</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('landing.footer.resources.title')}</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link to="/blog" className="hover:text-purple-600 transition-colors">{t('landing.footer.resources.blog')}</Link>
              </li>
              <li>
                <Link to="/blog/como-reducir-ausencias-citas-whatsapp" className="hover:text-purple-600 transition-colors">
                  Reducir ausencias con WhatsApp
                </Link>
              </li>
              <li>
                <Link to="/blog/software-salones-belleza-colombia-2026" className="hover:text-purple-600 transition-colors">
                  Software para salones 2026
                </Link>
              </li>
              {/* Ayuda y tutoriales apuntan al blog — contenido real disponible */}
              <li><Link to="/blog" className="hover:text-purple-600 transition-colors">{t('landing.footer.resources.help')}</Link></li>
              <li><Link to="/blog" className="hover:text-purple-600 transition-colors">{t('landing.footer.resources.tutorials')}</Link></li>
              <li><Link to="/contacto" className="hover:text-purple-600 transition-colors">{t('landing.footer.resources.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('landing.footer.legal.title')}</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link to="/terminos"  className="hover:text-purple-600 transition-colors">{t('landing.footer.legal.terms')}</Link></li>
              <li><Link to="/privacidad" className="hover:text-purple-600 transition-colors">{t('landing.footer.legal.privacy')}</Link></li>
              <li><Link to="/cookies"   className="hover:text-purple-600 transition-colors">{t('landing.footer.legal.cookies')}</Link></li>
              <li>
                <a
                  href="https://github.com/TI-Turing/Gestabiz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-600 transition-colors"
                >
                  {t('landing.footer.legal.licenses')}
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3">Más Verticales</h5>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li><Link to="/para/spas"            className="hover:text-purple-600 transition-colors">Spas y Estética</Link></li>
                <li><Link to="/para/odontologos"     className="hover:text-purple-600 transition-colors">Odontología</Link></li>
                <li><Link to="/para/psicologos"      className="hover:text-purple-600 transition-colors">Psicología</Link></li>
                <li><Link to="/para/fisioterapeutas" className="hover:text-purple-600 transition-colors">Fisioterapia</Link></li>
                <li><Link to="/para/entrenadores"    className="hover:text-purple-600 transition-colors">Entrenadores</Link></li>
                <li><Link to="/para/coworkings"      className="hover:text-purple-600 transition-colors">Coworking</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <p>© {new Date().getFullYear()} Gestabiz. {t('landing.footer.rightsReserved')}</p>
            <p>{t('landing.footer.madeIn')}</p>
          </div>

          <div className="flex flex-col items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{t('landing.footer.developedBy')}</span>
              <a
                href="https://tituring.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <img src={logoTiTuring} alt="Ti Turing Logo" className="h-6 w-6 object-contain" />
                <span className="font-semibold text-purple-600">{t('landing.footer.company')}</span>
              </a>
            </div>
            <Badge variant="outline" className="text-xs text-gray-500 dark:text-gray-500 border-gray-300 dark:border-gray-600">
              {t('landing.footer.version').replace('0.0.1', APP_CONFIG.VERSION)}
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  )
}

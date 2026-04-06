import { useLocation, Link } from 'react-router-dom'
import { PublicLayout } from '@/components/landing/PublicLayout'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { usePageMeta } from '@/hooks/usePageMeta'

// ── Content ──────────────────────────────────────────────────────────────────

const TERMS_CONTENT = {
  title: 'Términos y Condiciones',
  lastUpdated: '1 de abril de 2026',
  sections: [
    {
      heading: '1. Aceptación de los Términos',
      body: `Al acceder y utilizar Gestabiz ("la Plataforma"), desarrollada por Ti Turing, aceptas estar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguno de estos términos, no debes utilizar la Plataforma.`,
    },
    {
      heading: '2. Descripción del Servicio',
      body: `Gestabiz es una plataforma SaaS (Software como Servicio) de gestión de citas, clientes, empleados y contabilidad para pequeñas y medianas empresas de servicios en Colombia y Latinoamérica. El servicio incluye agendamiento online, recordatorios automáticos, gestión de personal, reportes contables y portal de empleo.`,
    },
    {
      heading: '3. Registro y Cuenta',
      body: `Para utilizar la Plataforma debes crear una cuenta con información verídica. Eres responsable de mantener la confidencialidad de tus credenciales y de todas las actividades que ocurran bajo tu cuenta. Debes notificarnos inmediatamente ante cualquier uso no autorizado.`,
    },
    {
      heading: '4. Planes y Pagos',
      body: `Gestabiz ofrece un plan gratuito con funciones limitadas y planes de pago (Inicio, Profesional, Empresarial) con facturación mensual. Los precios están expresados en pesos colombianos (COP) e incluyen IVA cuando aplica. No realizamos reembolsos por períodos parciales salvo que la ley colombiana lo exija.`,
    },
    {
      heading: '5. Uso Aceptable',
      body: `Te comprometes a no utilizar la Plataforma para actividades ilegales, fraudulentas o que violen derechos de terceros. Está prohibido intentar acceder a datos de otros usuarios, realizar ingeniería inversa del software, o sobrecargar intencionalmente la infraestructura de la Plataforma.`,
    },
    {
      heading: '6. Propiedad Intelectual',
      body: `Todo el contenido, código fuente, diseño y marcas de Gestabiz son propiedad exclusiva de Ti Turing. Los datos que ingresas a la Plataforma son de tu propiedad. Ti Turing se reserva el derecho de usar datos anonimizados y agregados para mejorar el servicio.`,
    },
    {
      heading: '7. Disponibilidad del Servicio',
      body: `Nos esforzamos por mantener una disponibilidad del 99.5% mensual. Sin embargo, no garantizamos disponibilidad ininterrumpida. Realizamos mantenimientos programados con aviso previo. No somos responsables por interrupciones causadas por terceros (proveedores de nube, telecomunicaciones, etc.).`,
    },
    {
      heading: '8. Limitación de Responsabilidad',
      body: `Ti Turing no será responsable por daños indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso de la Plataforma. Nuestra responsabilidad máxima no excederá el valor pagado por el servicio en los 3 meses anteriores al evento que originó el reclamo.`,
    },
    {
      heading: '9. Cancelación y Terminación',
      body: `Puedes cancelar tu suscripción en cualquier momento desde el panel de configuración. Al cancelar conservarás acceso hasta el final del período pagado. Ti Turing puede suspender cuentas que violen estos términos, con o sin previo aviso según la gravedad de la infracción.`,
    },
    {
      heading: '10. Ley Aplicable',
      body: `Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa se someterá a los tribunales competentes de la ciudad de Bogotá, Colombia.`,
    },
    {
      heading: '11. Contacto',
      body: `Para preguntas sobre estos términos, puedes contactarnos en: soporte@gestabiz.com o a través de nuestro portal en gestabiz.com/contacto.`,
    },
  ],
}

const PRIVACY_CONTENT = {
  title: 'Política de Privacidad',
  lastUpdated: '1 de abril de 2026',
  sections: [
    {
      heading: '1. Responsable del Tratamiento',
      body: `Ti Turing, con domicilio en Colombia, es el responsable del tratamiento de los datos personales recopilados a través de Gestabiz, en cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013.`,
    },
    {
      heading: '2. Datos que Recopilamos',
      body: `Recopilamos: (a) datos de registro: nombre, correo electrónico, teléfono; (b) datos del negocio: nombre comercial, dirección, RUT/NIT; (c) datos de clientes y citas ingresados por el usuario; (d) datos de uso: acciones dentro de la plataforma, dispositivo, navegador, dirección IP; (e) datos de pago: procesados por pasarelas de pago certificadas (no almacenamos datos de tarjetas).`,
    },
    {
      heading: '3. Finalidad del Tratamiento',
      body: `Usamos tus datos para: prestar y mejorar el servicio de Gestabiz, procesar pagos y facturación, enviarte comunicaciones del servicio (confirmaciones, alertas, recordatorios), enviarte comunicaciones de marketing si has dado tu consentimiento, cumplir obligaciones legales y prevenir fraudes.`,
    },
    {
      heading: '4. Base Legal',
      body: `El tratamiento de tus datos se basa en: ejecución del contrato de servicio, consentimiento explícito para comunicaciones de marketing, obligaciones legales aplicables a Ti Turing como empresa colombiana.`,
    },
    {
      heading: '5. Compartir Datos con Terceros',
      body: `No vendemos tus datos. Podemos compartirlos con: proveedores de infraestructura (Supabase/AWS, Vercel), pasarelas de pago (MercadoPago, PayU, Stripe), servicios de comunicación (Brevo para emails, AWS SNS para SMS), Google Analytics para análisis de uso con datos anonimizados. Todos los terceros están sujetos a acuerdos de tratamiento de datos.`,
    },
    {
      heading: '6. Retención de Datos',
      body: `Conservamos tus datos mientras mantengas una cuenta activa. Al cancelar, eliminamos los datos personales en un plazo máximo de 90 días, excepto los que debamos conservar por obligaciones legales (ej. datos de facturación por 5 años según normativa tributaria colombiana).`,
    },
    {
      heading: '7. Tus Derechos (Habeas Data)',
      body: `Conforme a la Ley 1581 de 2012 tienes derecho a: conocer, actualizar y rectificar tus datos; solicitar su supresión; revocar el consentimiento; acceder gratuitamente a tus datos. Para ejercer estos derechos escríbenos a: soporte@gestabiz.com.`,
    },
    {
      heading: '8. Seguridad',
      body: `Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado en tránsito (TLS) y en reposo, control de acceso basado en roles, auditorías de seguridad periódicas, backups automáticos cifrados.`,
    },
    {
      heading: '9. Cookies',
      body: `Usamos cookies propias y de terceros. Consulta nuestra Política de Cookies para más detalles. Puedes gestionar tus preferencias de cookies en cualquier momento.`,
    },
    {
      heading: '10. Cambios a esta Política',
      body: `Podemos actualizar esta política. Te notificaremos por correo electrónico o mediante un aviso en la Plataforma con al menos 30 días de anticipación ante cambios materiales.`,
    },
  ],
}

const COOKIES_CONTENT = {
  title: 'Política de Cookies',
  lastUpdated: '1 de abril de 2026',
  sections: [
    {
      heading: '¿Qué son las Cookies?',
      body: `Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Permiten que el sitio recuerde tus preferencias y mejore tu experiencia.`,
    },
    {
      heading: 'Cookies Estrictamente Necesarias',
      body: `Estas cookies son imprescindibles para el funcionamiento de la Plataforma y no pueden desactivarse. Incluyen: cookies de sesión de autenticación, token de seguridad CSRF, preferencias de idioma y tema (claro/oscuro).`,
    },
    {
      heading: 'Cookies de Funcionalidad',
      body: `Recordamos tus preferencias para mejorar tu experiencia: sede preferida, configuraciones del dashboard, filtros activos en listados. Estas cookies persisten entre sesiones pero puedes eliminarlas borrando la caché del navegador.`,
    },
    {
      heading: 'Cookies Analíticas',
      body: `Usamos Google Analytics 4 con IP anonimizada y modo de consentimiento. Estas cookies nos ayudan a entender cómo se usa la Plataforma para mejorarla. Solo se activan si aceptas las cookies analíticas en el banner de consentimiento.`,
    },
    {
      heading: 'Cookies de Marketing',
      body: `En la landing pública podemos usar cookies de remarketing (Google Ads) solo si das tu consentimiento explícito. Estas cookies permiten mostrarte anuncios relevantes en otras plataformas.`,
    },
    {
      heading: 'Almacenamiento Local (localStorage)',
      body: `Además de cookies, usamos localStorage para: preferencia de tema (claro/oscuro), preferencia de idioma, sede preferida del negocio. Estos datos nunca se transmiten a terceros.`,
    },
    {
      heading: 'Gestión de Preferencias',
      body: `Puedes gestionar tus preferencias de cookies en cualquier momento haciendo clic en "Gestionar cookies" en el banner de consentimiento o en el pie de página. También puedes eliminar todas las cookies borrando la caché de tu navegador.`,
    },
    {
      heading: 'Duración de las Cookies',
      body: `Cookies de sesión: se eliminan al cerrar el navegador. Cookies de preferencia: hasta 1 año. Cookies analíticas (GA4): hasta 2 años. Cookies de autenticación: según la sesión activa (máximo 7 días de inactividad).`,
    },
  ],
}

const LEGAL_ROUTES: Record<string, typeof TERMS_CONTENT & { metaTitle: string; metaDesc: string }> = {
  '/terminos': {
    ...TERMS_CONTENT,
    metaTitle: 'Términos y Condiciones — Gestabiz',
    metaDesc: 'Términos y condiciones de uso de Gestabiz, la plataforma de gestión de citas para negocios en Colombia.',
  },
  '/privacidad': {
    ...PRIVACY_CONTENT,
    metaTitle: 'Política de Privacidad — Gestabiz',
    metaDesc: 'Política de privacidad y tratamiento de datos personales de Gestabiz conforme a la Ley 1581 de 2012.',
  },
  '/cookies': {
    ...COOKIES_CONTENT,
    metaTitle: 'Política de Cookies — Gestabiz',
    metaDesc: 'Información sobre el uso de cookies y almacenamiento local en Gestabiz.',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LegalPage() {
  const { pathname } = useLocation()
  const content = LEGAL_ROUTES[pathname]

  usePageMeta({
    title: content?.metaTitle ?? 'Legal — Gestabiz',
    description: content?.metaDesc ?? '',
    canonical: `https://gestabiz.com${pathname}`,
  })

  if (!content) {
    return null
  }

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 pt-32 pb-20 max-w-3xl">
          {/* Header */}
          <div className="mb-10">
            <p className="text-sm text-muted-foreground mb-2">
              Última actualización: {content.lastUpdated}
            </p>
            <h1 className="text-4xl font-bold text-foreground">{content.title}</h1>
            <div className="h-1 w-16 bg-purple-600 rounded mt-4" />
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {content.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg font-semibold text-foreground mb-3">{section.heading}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.body}</p>
              </section>
            ))}
          </div>

          {/* Footer nav */}
          <div className="mt-14 pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link to="/terminos"   className="hover:text-purple-600 transition-colors">Términos</Link>
            <Link to="/privacidad" className="hover:text-purple-600 transition-colors">Privacidad</Link>
            <Link to="/cookies"    className="hover:text-purple-600 transition-colors">Cookies</Link>
            <Link to="/contacto"   className="hover:text-purple-600 transition-colors">Contacto</Link>
            <Link to="/"           className="hover:text-purple-600 transition-colors ml-auto">← Volver al inicio</Link>
          </div>
        </div>

        <LandingFooter />
      </div>
    </PublicLayout>
  )
}

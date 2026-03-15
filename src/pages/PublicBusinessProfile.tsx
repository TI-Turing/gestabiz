import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Phone, Mail, Globe, Star, MessageCircle, Sparkles, Heart, Dumbbell, BookOpen, Briefcase, Home, Car, UtensilsCrossed, PawPrint, Laptop, Palette, HardHat, MoreHorizontal } from 'lucide-react';
import { useBusinessProfileData } from '@/hooks/useBusinessProfileData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Button } from '@/components/ui/button';
import { ServiceCard } from '@/components/cards/ServiceCard';
import { LocationCard } from '@/components/cards/LocationCard';
import { EmployeeCard } from '@/components/cards/EmployeeCard';
import type { Location } from '@/types/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ReviewList } from '@/components/reviews/ReviewList';
import ChatWithAdminModal from '@/components/business/ChatWithAdminModal';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

const categoryIconMap: Record<string, LucideIcon> = {
  Sparkles, Heart, Dumbbell, BookOpen, Briefcase, Home, Car,
  Utensils: UtensilsCrossed, UtensilsCrossed, Calendar, PawPrint,
  Laptop, Palette, HardHat, MoreHorizontal,
};

interface PublicBusinessProfileProps {
  readonly slug?: string;
  readonly embedded?: boolean;
}

export default function PublicBusinessProfile({ slug: slugProp, embedded = false }: Readonly<PublicBusinessProfileProps>) {
  const routeParams = useParams<{ slug: string }>();
  const slug = slugProp ?? routeParams.slug;
  const navigate = useNavigate();
  const { user } = useAuth();
  const analytics = useAnalytics();
  const [showChatModal, setShowChatModal] = useState(false);
  
  // Geolocation for distance calculation
  const geoState = useGeolocation({ requestOnMount: true });

  // Memoize user location to avoid re-renders triggering refetch
  const userLocation = useMemo(() => (
    geoState.latitude && geoState.longitude
      ? { latitude: geoState.latitude, longitude: geoState.longitude }
      : undefined
  ), [geoState.latitude, geoState.longitude]);
  
  // Fetch business data by slug
  const { business, isLoading, error } = useBusinessProfileData({
    slug,
    userLocation
  });

  // Build SEO meta tags early to keep hook order stable
  const pageTitle = business?.meta_title || `${business?.name ?? 'Perfil del Negocio'} - Gestabiz`;
  const pageDescription = business?.meta_description || business?.description || (business ? `Reserva citas en ${business.name}` : 'Explora y reserva servicios en Gestabiz.');
  const ogImage = business?.og_image_url || business?.banner_url || business?.logo_url;
  const canonicalUrl = `${globalThis.location.origin}/negocio/${business?.slug ?? slug}`;

  usePageMeta({
    title: pageTitle,
    description: pageDescription,
    keywords: business?.meta_keywords?.join(', '),
    ogType: 'business.business',
    ogUrl: canonicalUrl,
    ogImage: ogImage || undefined,
    ogTitle: pageTitle,
    ogDescription: pageDescription,
    canonical: canonicalUrl,
  });

  // Track profile view when business data loads
  useEffect(() => {
    if (business?.slug) {
      analytics.trackProfileView({
        businessId: business.id,
        businessName: business.name,
        slug: business.slug,
        category: business.category?.name,
      });
    }
  }, [business, analytics]);

  // Inject JSON-LD structured data for Google rich results
  useEffect(() => {
    if (!business) return;

    const primaryLocation = business.locations[0];
    const structuredData: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": business.name,
      "description": business.description,
      "image": ogImage,
      "url": canonicalUrl,
      ...(business.phone && { "telephone": business.phone }),
      ...(business.email && { "email": business.email }),
      ...(business.website && { "sameAs": [business.website] }),
      ...(primaryLocation && {
        "address": {
          "@type": "PostalAddress",
          "streetAddress": primaryLocation.address,
          "addressLocality": primaryLocation.city,
          "addressRegion": primaryLocation.state,
          "postalCode": primaryLocation.postal_code,
          "addressCountry": primaryLocation.country ?? "CO",
        },
        ...(primaryLocation.latitude && primaryLocation.longitude && {
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": primaryLocation.latitude,
            "longitude": primaryLocation.longitude,
          }
        }),
      }),
      ...(business.reviewCount > 0 && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": business.rating.toFixed(1),
          "bestRating": "5",
          "worstRating": "1",
          "reviewCount": business.reviewCount,
        }
      }),
      ...(business.services.length > 0 && {
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": `Servicios de ${business.name}`,
          "itemListElement": business.services.slice(0, 10).map(s => ({
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": s.name,
              ...(s.description && { "description": s.description }),
            },
            ...(s.price && { "price": s.price, "priceCurrency": "COP" }),
          })),
        }
      }),
      "potentialAction": {
        "@type": "ReserveAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": canonicalUrl,
          "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
        },
        "result": {
          "@type": "Reservation",
          "name": `Cita en ${business.name}`,
        }
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'business-jsonld';
    script.textContent = JSON.stringify(structuredData);
    // Replace if already exists (avoids duplicates on re-render)
    document.getElementById('business-jsonld')?.remove();
    document.head.appendChild(script);

    return () => {
      document.getElementById('business-jsonld')?.remove();
    };
  }, [business, ogImage, canonicalUrl]);

  // Handle booking action
  const handleBookAppointment = (serviceId?: string, locationId?: string, employeeId?: string) => {
    // Track reserve button click
    analytics.trackReserveButtonClick({
      businessId: business?.id || '',
      serviceId,
      source: 'profile',
    });

    if (!user) {
      // Redirect to login; after login AuthScreen will navigate to /app
      // with booking params so MainApp opens the wizard directly in client view
      const params = new URLSearchParams();
      params.set('redirect', '/app');
      if (business?.id) params.set('businessId', business.id);
      if (serviceId) params.set('serviceId', serviceId);
      if (locationId) params.set('locationId', locationId);
      if (employeeId) params.set('employeeId', employeeId);

      navigate(`/login?${params.toString()}`);
      return;
    }

    // User is authenticated: navigate to /app with preselection params.
    // MainApp reads these params and ClientDashboard opens the wizard at step 2.
    const params = new URLSearchParams();
    if (business?.id) params.set('businessId', business.id);
    if (serviceId) params.set('serviceId', serviceId);
    if (locationId) params.set('locationId', locationId);
    if (employeeId) params.set('employeeId', employeeId);
    navigate(`/app?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Cargando información del negocio...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-foreground">Negocio no encontrado</h2>
          <p className="text-muted-foreground">
            {error || 'No pudimos encontrar el negocio que buscas.'}
          </p>
          <Button onClick={() => navigate('/')} variant="default">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header con navegación */}
        {!embedded && (
          <header className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}> 
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <Button onClick={() => handleBookAppointment()} size="lg">
              <Calendar className="w-4 h-4 mr-2" />
              Reservar Ahora
            </Button>
          </div>
        </header>
      )}

        {/* Banner */}
        {business.banner_url && (
          <div className="relative h-64 w-full overflow-hidden">
            <img
              src={business.banner_url}
              alt={`Banner de ${business.name}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Business Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Logo */}
            {business.logo_url && (
              <div className="shrink-0">
                <img
                  src={business.logo_url}
                  alt={`Logo de ${business.name}`}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border-4 border-background shadow-lg"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {business.name}
                </h1>
                {business.category && (
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    {business.category.icon && (() => {
                      const IconComponent = categoryIconMap[business.category.icon];
                      return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
                    })()}
                    <span>{business.category.name}</span>
                  </div>
                )}
                {business.subcategories && business.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {business.subcategories.map((subcat) => (
                      <Badge key={subcat.name} variant="secondary">
                        {subcat.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Rating */}
              {business.reviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="font-semibold text-primary">{business.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({business.reviewCount} {business.reviewCount === 1 ? 'reseña' : 'reseñas'})
                  </span>
                </div>
              )}

              {/* Contact */}
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                {business.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a 
                      href={`tel:${business.phone}`} 
                      className="hover:text-primary"
                      onClick={() => analytics.trackContactClick({
                        businessId: business.id,
                        contactType: 'phone',
                      })}
                    >
                      {business.phone}
                    </a>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a 
                      href={`mailto:${business.email}`} 
                      className="hover:text-primary"
                      onClick={() => analytics.trackContactClick({
                        businessId: business.id,
                        contactType: 'email',
                      })}
                    >
                      {business.email}
                    </a>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a 
                      href={business.website} 
                      target="_blank"
                      onClick={() => analytics.trackContactClick({
                        businessId: business.id,
                        contactType: 'maps',
                      })}
 
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      Sitio web
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {business.description && (
            <div className="mb-8">
              <p className="text-muted-foreground leading-relaxed">
                {business.description}
              </p>
            </div>
          )}

          <Separator className="my-8" />

          {/* Tabs */}
          <Tabs defaultValue="servicios" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="servicios">Servicios</TabsTrigger>
              <TabsTrigger value="ubicaciones">Ubicaciones</TabsTrigger>
              <TabsTrigger value="equipo">Equipo</TabsTrigger>
              <TabsTrigger value="resenas">Reseñas</TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="servicios" className="space-y-4 mt-6">
              {business.services.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay servicios disponibles
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {business.services.map(service => (
                    <ServiceCard
                      key={service.id}
                      service={{
                        id: service.id,
                        name: service.name,
                        description: service.description,
                        duration: service.duration_minutes ?? service.duration,
                        price: service.price,
                      }}
                      readOnly={embedded}
                      onViewProfile={embedded ? undefined : () => handleBookAppointment(service.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Locations Tab */}
            <TabsContent value="ubicaciones" className="space-y-4 mt-6">
              {business.locations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay ubicaciones disponibles
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {business.locations.map(location => (
                    <LocationCard
                      key={location.id}
                      location={location as unknown as Location}
                      readOnly={embedded}
                      onViewProfile={embedded ? undefined : () => handleBookAppointment(undefined, location.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="equipo" className="space-y-4 mt-6">
              {business.employees.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay información del equipo disponible
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {business.employees.map(employee => (
                    <EmployeeCard
                      key={employee.id}
                      employee={{
                        id: employee.id,
                        full_name: employee.name,
                        avatar_url: employee.avatar_url,
                        average_rating: employee.rating,
                        total_reviews: employee.review_count,
                      }}
                      readOnly={embedded}
                      onViewProfile={embedded ? undefined : () => handleBookAppointment(undefined, undefined, employee.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="resenas" className="mt-6">
              <div className="max-h-[600px] overflow-y-auto">
                <ReviewList
                  businessId={business.id}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer CTA - solo visible para clientes (no en modo embebido) */}
        {!embedded && (
        <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur-sm z-10">
          <div className="container mx-auto px-4 py-4 flex gap-3">
            <Button 
              onClick={() => handleBookAppointment()}
              size="lg"
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Reservar Ahora
            </Button>
            <Button 
              onClick={() => setShowChatModal(true)}
              size="lg"
              variant="outline"
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Iniciar Chat
            </Button>
          </div>
        </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChatModal && business && (
        <ChatWithAdminModal
          businessId={business.id}
          businessName={business.name}
          userLocation={userLocation}
          onClose={() => setShowChatModal(false)}
          onChatStarted={(conversationId) => {
            setShowChatModal(false);
            // Navegar al chat si el usuario está autenticado
            if (user) {
              navigate(`/app/client/chat?conversation=${conversationId}`);
            }
          }}
        />
      )}
    </>
  );
}
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Phone, Mail, Globe, Star, MessageCircle, Sparkles, Heart, Dumbbell, BookOpen, Briefcase, Home, Car, UtensilsCrossed, PawPrint, Laptop, Palette, HardHat, MoreHorizontal } from 'lucide-react';
import { useBusinessProfileData } from '@/hooks/useBusinessProfileData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useBookingPreselection, type BookingPreselection } from '@/hooks/useBookingPreselection';
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
import { ServiceProfileModal } from '@/components/admin/ServiceProfileModal';
import { LocationProfileModal } from '@/components/admin/LocationProfileModal';
import UserProfile from '@/components/user/UserProfile';
import { AppointmentWizard } from '@/components/appointments/AppointmentWizard';
import { PublicLayout } from '@/components/landing/PublicLayout';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useEffect, useMemo, useRef, useState } from 'react';
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

function withPublicLayout(embedded: boolean, content: React.ReactNode): React.ReactNode {
  return embedded ? content : <PublicLayout>{content}</PublicLayout>;
}

export default function PublicBusinessProfile({ slug: slugProp, embedded = false }: Readonly<PublicBusinessProfileProps>) {
  const routeParams = useParams<{ slug: string }>();
  const slug = slugProp ?? routeParams.slug;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoBook = searchParams.get('book') === 'true';
  const autoEmployeeId = searchParams.get('employeeId') ?? undefined;
  // URL params set by AuthScreen after redirect-back-to-public-profile
  const urlBusinessId = searchParams.get('businessId') ?? undefined;
  const urlServiceId  = searchParams.get('serviceId')  ?? undefined;
  const urlLocationId = searchParams.get('locationId') ?? undefined;
  const urlEmployeeIdParam = searchParams.get('employeeId') ?? undefined;

  const { user } = useAuth();
  const analytics = useAnalytics();
  const preselection = useBookingPreselection();
  const [showChatModal, setShowChatModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [profileServiceId, setProfileServiceId] = useState<string | null>(null);
  const [profileLocation, setProfileLocation] = useState<Location | null>(null);
  const [profileEmployeeId, setProfileEmployeeId] = useState<string | null>(null);

  // ─── Role gating ────────────────────────────────────────────────────────────
  // Read active role from localStorage (same key used by useUserRoles).
  // No extra DB queries – value is already persisted by useUserRoles.
  const storedActiveRole = useMemo<string>(() => {
    if (!user?.id) return 'client';
    try {
      const raw = localStorage.getItem(`user-active-role:${user.id}`);
      if (!raw) return 'client';
      const parsed = JSON.parse(raw) as { role?: string };
      return parsed?.role ?? 'client';
    } catch {
      return 'client';
    }
  }, [user?.id]);

  // Non-logged-in users and users in 'client' role can book.
  // Admins and employees visiting from their dashboard cannot.
  const canBook = !user || storedActiveRole === 'client';
  
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
  const pageDescription = business?.meta_description ?? business?.description ?? 'Explora y reserva servicios en Gestabiz.';
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

  // Auto-open booking wizard when ?book=true (QR code flow)
  const autoBookTriggered = useRef(false);
  useEffect(() => {
    if (autoBook && business && !isLoading && !autoBookTriggered.current) {
      autoBookTriggered.current = true;
      handleBookAppointment(undefined, undefined, autoEmployeeId);
    }
  // handleBookAppointment is stable within the render cycle; autoBook/business/isLoading are the real deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoBook, business, isLoading]);

  // Auto-open wizard when redirected back from login with booking params
  const urlParamBookTriggered = useRef(false);
  useEffect(() => {
    if (
      !urlParamBookTriggered.current &&
      !isLoading &&
      business &&
      user &&
      canBook &&
      urlBusinessId === business.id &&
      (urlServiceId || urlLocationId || urlEmployeeIdParam)
    ) {
      urlParamBookTriggered.current = true;
      // Patch preselection from URL params then open wizard
      preselection.patch({
        businessId: urlBusinessId,
        ...(urlServiceId  && { serviceId:  urlServiceId }),
        ...(urlLocationId && { locationId: urlLocationId }),
        ...(urlEmployeeIdParam && { employeeId: urlEmployeeIdParam }),
      });
      setShowWizard(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, business, user, canBook]);

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
    analytics.trackReserveButtonClick({
      businessId: business?.id || '',
      serviceId,
      source: 'profile',
    });

    // Write preselection to localStorage
    const updates: Partial<BookingPreselection> = {};
    if (business?.id) updates.businessId = business.id;
    if (serviceId)   updates.serviceId   = serviceId;
    if (locationId)  updates.locationId  = locationId;
    if (employeeId)  updates.employeeId  = employeeId;
    if (Object.keys(updates).length > 0) preselection.patch(updates);

    if (!user) {
      // Redirect to login; after login AuthScreen redirects back to the public profile
      // with the same params so this component reopens the wizard automatically.
      const params = new URLSearchParams();
      params.set('redirect', `/negocio/${business?.slug ?? slug}`);
      if (business?.id) params.set('businessId', business.id);
      if (serviceId)    params.set('serviceId',   serviceId);
      if (locationId)   params.set('locationId',  locationId);
      if (employeeId)   params.set('employeeId',  employeeId);
      navigate(`/login?${params.toString()}`);
      return;
    }

    setShowWizard(true);
  };

  if (isLoading) {
    const loadingContent = (
      <div className={`min-h-screen bg-background flex items-center justify-center ${embedded ? '' : 'pt-20'}`}>
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Cargando información del negocio...</p>
        </div>
      </div>
    );
    return withPublicLayout(embedded, loadingContent);
  }

  if (!business) {
    const errorContent = (
      <div className={`min-h-screen bg-background flex items-center justify-center ${embedded ? '' : 'pt-20'}`}>
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-foreground">Negocio no encontrado</h2>
          <p className="text-muted-foreground">
            {error || 'No pudimos encontrar el negocio que buscas.'}
          </p>
          <Button onClick={() => navigate('/')} variant="default">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
    return withPublicLayout(embedded, errorContent);
  }

  const profileContent = (
    <div className={`min-h-screen bg-background ${embedded ? '' : 'pt-20'}`}>
      {/* Banner */}
      {business.banner_url && (
          <div className="relative w-full aspect-video overflow-hidden">
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
                      serviceId={service.id}
                      initialData={{
                        id: service.id,
                        name: service.name,
                        description: service.description,
                        duration: service.duration_minutes ?? service.duration,
                        duration_minutes: service.duration_minutes,
                        price: service.price,
                        category: service.category,
                        image_url: service.image_url,
                      }}
                      readOnly
                      onViewProfile={(id) => {
                        preselection.patch({ serviceId: id });
                        setProfileServiceId(id);
                      }}
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
                      locationId={location.id}
                      location={location as unknown as Location}
                      readOnly
                      onViewProfile={(loc) => {
                      preselection.patch({ locationId: loc.id });
                      setProfileLocation(loc);
                    }}
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
                      employeeId={employee.user_id}
                      initialData={{
                        id: employee.user_id,
                        full_name: employee.name,
                        avatar_url: employee.avatar_url,
                        average_rating: employee.rating,
                        total_reviews: employee.review_count,
                      }}
                      readOnly
                      onViewProfile={(id) => {
                        preselection.patch({ employeeId: id });
                        setProfileEmployeeId(id);
                      }}
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
        {!embedded && canBook && (
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
  );

  return (
    <>
      {withPublicLayout(embedded, profileContent)}

      {/* Modales de perfil de entidades */}
      <ServiceProfileModal
        serviceId={profileServiceId}
        onClose={() => setProfileServiceId(null)}
        onBook={canBook ? (employeeId?: string) => {
          if (employeeId) preselection.patch({ employeeId, serviceId: profileServiceId ?? undefined });
          setProfileServiceId(null);
          setShowWizard(true);
        } : undefined}
      />
      {profileLocation && (
        <LocationProfileModal
          open={!!profileLocation}
          onOpenChange={(open) => { if (!open) setProfileLocation(null); }}
          location={profileLocation as unknown as Parameters<typeof LocationProfileModal>[0]['location']}
          bannerUrl={(profileLocation as unknown as Record<string, string>).banner_url}
          onBook={canBook ? (employeeId?: string) => {
            if (employeeId) preselection.patch({ employeeId });
            setProfileLocation(null);
            setShowWizard(true);
          } : undefined}
        />
      )}
      {profileEmployeeId && (
        <UserProfile
          userId={profileEmployeeId}
          onClose={() => setProfileEmployeeId(null)}
          hideBooking={!canBook}
          onBookAppointment={canBook ? () => {
            preselection.patch({ employeeId: profileEmployeeId ?? undefined });
            setProfileEmployeeId(null);
            setShowWizard(true);
          } : undefined}
        />
      )}

      {/* AppointmentWizard - abierto inline desde el perfil público */}
      {showWizard && business && (() => {
        const presel = preselection.get();
        return (
          <AppointmentWizard
            open={showWizard}
            onClose={() => { setShowWizard(false); preselection.clear(); }}
            businessId={presel.businessId ?? business.id}
            preselectedServiceId={presel.serviceId}
            preselectedEmployeeId={presel.employeeId}
            preselectedLocationId={presel.locationId}
            userId={user?.id}
            onSuccess={() => { setShowWizard(false); preselection.clear(); }}
          />
        );
      })()}

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
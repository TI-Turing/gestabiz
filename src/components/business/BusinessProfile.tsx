import { useState, useEffect, useCallback, type ComponentProps } from 'react';
import * as Sentry from '@sentry/react'
import { useQuery } from '@tanstack/react-query';
import { X, MapPin, Phone, Mail, Globe, Clock, Star, Calendar, ChevronRight, MessageCircle, Heart } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewList } from '@/components/reviews/ReviewList';
import { useReviews } from '@/hooks/useReviews';
import { useFavorites } from '@/hooks/useFavorites';
import { toast } from 'sonner';
import ChatWithAdminModal from './ChatWithAdminModal';
import { LocationAddress } from '@/components/ui/LocationAddress';
import { LocationProfileModal } from '@/components/admin/LocationProfileModal';
import { ServiceProfileModal } from '@/components/admin/ServiceProfileModal';
import { ServiceCard } from '@/components/cards/ServiceCard';
import { LocationCard } from '@/components/cards/LocationCard';
import { EmployeeCard } from '@/components/cards/EmployeeCard';
import UserProfile from '@/components/user/UserProfile';
import type { Location } from '@/types/types';

interface BusinessProfileProps {
  readonly businessId: string;
  readonly onClose: () => void;
  readonly onBookAppointment?: (serviceId?: string, locationId?: string, employeeId?: string) => void;
  readonly onChatStarted?: (conversationId: string) => void;
  readonly userId?: string; // NUEVO: Para resolver problema de auth context
  readonly hideBooking?: boolean;
  readonly userLocation?: {
    latitude: number;
    longitude: number;
  };
}

interface BusinessData {
  id: string;
  name: string;
  description: string;
  phone: string;
  email: string;
  website?: string;
  logo_url?: string;
  banner_url?: string;
  rating: number;
  reviewCount: number;
  category?: {
    name: string;
    icon?: string;
  };
  subcategories?: Array<{
    name: string;
  }>;
  locations: Array<{
    id: string;
    business_id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    description?: string;
    hours?: Record<string, string>;
    is_active: boolean;
    is_primary?: boolean;
    created_at: string;
    updated_at: string;
  }>;
  services: Array<{
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    category?: string;
    image_url?: string;
    location_id?: string;
    employee_id?: string;
    employee?: {
      id: string;
      name: string;
      avatar_url?: string;
    };
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    business_response?: string;
    business_response_at?: string;
  }>;
}

export default function BusinessProfile({ 
  businessId, 
  onClose, 
  onBookAppointment,
  onChatStarted,
  userId: propUserId, // Rename prop to avoid conflict
  hideBooking = false,
  userLocation 
}: BusinessProfileProps) {
  // Get user AND loading state from Auth context
  const authContext = useAuth();
  const user = authContext?.user || null;
  const authLoading = authContext?.loading || false;
  
  // CRITICAL FIX: Use prop userId as fallback if context user is not available
  const effectiveUserId = user?.id || propUserId;
  
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [eligibleAppointmentId, setEligibleAppointmentId] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<ComponentProps<typeof LocationProfileModal>['location'] | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [locationBanners, setLocationBanners] = useState<Record<string, string>>({});

  // DEBUG: Log auth state
  // Use effectiveUserId which can come from context or props
  const { isFavorite, toggleFavorite: toggleFavoriteFn } = useFavorites(effectiveUserId);
  
  const { createReview, refetch: refetchReviews } = useReviews({ business_id: businessId });

  const { data: professionals = [] } = useQuery({
    queryKey: ['business-professionals', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_services')
        .select(`
          employee_id,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('business_id', businessId);
      if (error) throw error;
      const seen = new Set<string>();
      type ProfRow = { employee_id: string; profiles: unknown }
      return ((data ?? []) as ProfRow[]).reduce<Array<{
        id: string;
        full_name: string | null;
        avatar_url?: string | null;
      }>>((acc, row) => {
        if (seen.has(row.employee_id)) return acc;
        seen.add(row.employee_id);
        const profile = Array.isArray(row.profiles)
          ? row.profiles[0]
          : row.profiles;
        acc.push({
          id: row.employee_id,
          full_name: profile?.full_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
        });
        return acc;
      }, []);
    },
    enabled: !!businessId,
  });

  const handleToggleFavorite = async () => {
    // CRITICAL FIX: Check effectiveUserId instead of just user
    if (!effectiveUserId) {
      toast.error('Inicia sesión para guardar favoritos');
      return;
    }
    
    if (!business) {
      return;
    }
    
    await toggleFavoriteFn(businessId, business.name);
  };

  const formatCurrency = (amount: number, currency: string = 'COP') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const fetchBusinessData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch ALL data in parallel for better performance
      const [
        { data: businessData, error: businessError },
        { data: locationsData },
        { data: servicesData },
        { data: reviewsData },
        { data: subcategoriesRelData }
      ] = await Promise.all([
        supabase
          .from('businesses')
          .select('id, name, description, phone, email, website, logo_url, banner_url, category_id')
          .eq('id', businessId)
          .single(),
        supabase
          .from('locations')
          .select('*')
          .eq('business_id', businessId)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('services')
          .select('id, name, description, duration_minutes, price, category, image_url')
          .eq('business_id', businessId)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('reviews')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('business_subcategories')
          .select('subcategory_id')
          .eq('business_id', businessId)
          .limit(3)
      ]);

      if (businessError) throw businessError;

      // Fetch category if exists
      let categoryData: { name: string; icon_name?: string } | null = null;
      if (businessData?.category_id) {
        const { data: catData } = await supabase
          .from('business_categories')
          .select('name, icon_name')
          .eq('id', businessData.category_id)
          .single();
        categoryData = catData;
      }

      // Fetch subcategories if exist
      let subcategoriesData: Array<{ name: string }> = [];
      if ((subcategoriesRelData?.length ?? 0) > 0) {
        const subcategoryIds = subcategoriesRelData!.map(rel => rel.subcategory_id);
        const { data: subcatsData } = await supabase
          .from('business_categories')
          .select('name')
          .in('id', subcategoryIds);
        subcategoriesData = subcatsData ?? [];
      }

      const rating = ((reviewsData?.length ?? 0) > 0)
        ? reviewsData!.reduce((acc, r) => acc + r.rating, 0) / reviewsData!.length
        : 0;

      // Process locations to resolve city and state UUIDs to names
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const cityIds = (locationsData || [])
        .map(loc => loc.city)
        .filter(city => city && uuidRegex.test(city));
      const stateIds = (locationsData || [])
        .map(loc => loc.state)
        .filter(state => state && uuidRegex.test(state));
      
      let cityMap: Record<string, string> = {};
      let stateMap: Record<string, string> = {};
      
      if (cityIds.length > 0) {
        const { data: citiesData } = await supabase
          .from('cities')
          .select('id, name')
          .in('id', cityIds);
        
        cityMap = (citiesData || []).reduce((acc, city) => {
          acc[city.id] = city.name;
          return acc;
        }, {} as Record<string, string>);
      }
      
      if (stateIds.length > 0) {
        const { data: regionsData } = await supabase
          .from('regions')
          .select('id, name')
          .in('id', stateIds);
        
        stateMap = (regionsData || []).reduce((acc, region) => {
          acc[region.id] = region.name;
          return acc;
        }, {} as Record<string, string>);
      }

      // Fetch banners for all locations from location_media
      const locationIds = (locationsData || []).map(l => l.id);
      if (locationIds.length > 0) {
        const { data: mediaData } = await supabase
          .from('location_media')
          .select('location_id, url, is_banner, type, description, created_at')
          .in('location_id', locationIds)
          .eq('is_banner', true)
          .eq('type', 'image')
          .order('created_at', { ascending: false });

        if (mediaData) {
          const banners: Record<string, string> = {};
          // Group by location and pick best (skip test banners)
          const byLoc = new Map<string, typeof mediaData>();
          for (const m of mediaData) {
            const arr = byLoc.get(m.location_id) ?? [];
            arr.push(m);
            byLoc.set(m.location_id, arr);
          }
          byLoc.forEach((arr, locId) => {
            const chosen = arr.find(x => (x.description ?? '').trim() !== 'Banner de prueba') ?? arr[0];
            if (chosen) banners[locId] = chosen.url.trim().replaceAll(/^[`'"]+|[`'"]+$/g, '');
          });
          setLocationBanners(banners);
        }
      }

      const processedLocations = (locationsData || []).map(loc => ({
        ...loc,
        city_name: loc.city && uuidRegex.test(loc.city) ? cityMap[loc.city] || loc.city : loc.city,
        state: loc.state && uuidRegex.test(loc.state) ? stateMap[loc.state] || loc.state : loc.state
      }));

      setBusiness({
        ...businessData,
        category: categoryData ? { name: categoryData.name, icon: categoryData.icon_name } : undefined,
        subcategories: subcategoriesData,
        locations: processedLocations,
        services: (servicesData ?? []).map(s => {
          return {
            ...s,
            duration: s.duration_minutes,
            employee: undefined
          };
        }),
        reviews: reviewsData || [],
        rating,
        reviewCount: reviewsData?.length || 0
      });
    } catch (error) {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'BusinessProfile' } })
      if (error instanceof Error) {
        // eslint-disable-next-line no-console
      }
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const checkReviewEligibility = useCallback(async () => {
    if (!user) return;

    try {
      // Check if user has completed appointments with this business
      // and hasn't reviewed them yet
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id')
        .eq('client_id', user.id)
        .eq('business_id', businessId)
        .eq('status', 'completed')
        .order('end_time', { ascending: false })
        .limit(10);

      if (appointmentsError) throw appointmentsError;

      if (appointmentsData && appointmentsData.length > 0) {
        // Check which appointments don't have reviews yet
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('appointment_id')
          .in('appointment_id', appointmentsData.map(a => a.id));

        if (reviewsError) throw reviewsError;

        const reviewedIds = new Set(reviewsData?.map(r => r.appointment_id) || []);
        const unreviewed = appointmentsData.find(a => !reviewedIds.has(a.id));

        if (unreviewed) {
          setCanReview(true);
          setEligibleAppointmentId(unreviewed.id);
        } else {
          setCanReview(false);
          setEligibleAppointmentId(null);
        }
      } else {
        setCanReview(false);
        setEligibleAppointmentId(null);
      }
    } catch (error) {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'BusinessProfile' } })
      // Error handling
      if (error instanceof Error) {
        // eslint-disable-next-line no-console
      }
    }
  }, [user, businessId]);

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!user || !eligibleAppointmentId) {
      toast.error('No se puede enviar la reseña en este momento');
      return;
    }

    try {
      await createReview(
        eligibleAppointmentId,
        user.id,
        businessId,
        undefined, // employeeId is optional for business reviews
        rating as 1 | 2 | 3 | 4 | 5,
        comment || undefined
      );
      
      setShowReviewForm(false);
      setCanReview(false);
      setEligibleAppointmentId(null);
      refetchReviews();
      
      // Refresh business data to update review count and rating
      fetchBusinessData();
    } catch (error) {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'BusinessProfile' } })
      // Error is already handled by useReviews hook
      // eslint-disable-next-line no-console
    }
  };

  useEffect(() => {
    fetchBusinessData();
    if (user) {
      checkReviewEligibility();
    }
  }, [fetchBusinessData, checkReviewEligibility, user]);

  const calculateDistance = (lat: number, lon: number): number => {
    if (!userLocation) return 0;
    
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat - userLocation.latitude) * (Math.PI / 180);
    const dLon = (lon - userLocation.longitude) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.latitude * (Math.PI / 180)) * 
      Math.cos(lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatHours = (hours: Record<string, string> | null | undefined): string => {
    if (!hours) return 'No disponible';
    // Assuming hours is an object like { monday: "9:00-18:00", ... }
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = daysOfWeek[new Date().getDay()];
    return hours[today] || 'Cerrado';
  };



  if (loading) {
    return (
      <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="sr-only"><DialogTitle>Cargando negocio</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!business) {
    return (
      <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="sr-only"><DialogTitle>Error</DialogTitle></DialogHeader>
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No se pudo cargar la información del negocio</p>
            <Button onClick={onClose} className="mt-4">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent hideClose className="max-w-[98vw] sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="sr-only"><DialogTitle>{business.name}</DialogTitle></DialogHeader>
      <Card className="w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden bg-card flex flex-col shadow-2xl border-0">
        {/* Header con banner - 16:9 Aspect Ratio */}
        <div className="relative aspect-video">
          {business.banner_url ? (
            <img 
              src={business.banner_url} 
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-primary/20 to-secondary/20" />
          )}
          
          {/* Botones en header - Touch Optimized */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-2">
            {/* Botón favorito - SIMPLIFICADO: Usar solo effectiveUserId sin PermissionGate */}
            {effectiveUserId ? (
              <button
                onClick={handleToggleFavorite}
                className="p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Heart 
                  className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                    isFavorite(businessId) 
                      ? 'fill-primary text-primary' 
                      : 'text-foreground'
                  }`} 
                />
              </button>
            ) : (
              <button
                onClick={() => toast.info('Inicia sesión para guardar favoritos')}
                className="p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </button>
            )}
            
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Logo y info básica - Mobile Compact */}
          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-3 sm:p-6">
            <div className="flex items-end gap-2 sm:gap-4">
              {business.logo_url && (
                <img 
                  src={business.logo_url} 
                  alt={business.name}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg border-2 sm:border-4 border-background object-cover bg-background"
                />
              )}
              <div className="flex-1 text-white min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 truncate">{business.name}</h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  {business.category && (
                    <Badge variant="secondary" className="bg-background/80 text-foreground text-[10px] sm:text-xs">
                      {business.category.name}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                    <span className="font-medium">{business.rating.toFixed(1)}</span>
                    <span className="text-white/70">({business.reviewCount})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido con scroll - Mobile Optimized */}
        <div className="flex-1 overflow-auto">
          {/* Información de contacto - Responsive Grid */}
          <div className="p-3 sm:p-6 border-b border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
              {business.phone && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{business.phone}</span>
                </div>
              )}
              {business.email && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{business.email}</span>
                </div>
              )}
              {business.website && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">
                    Sitio web
                  </a>
                </div>
              )}
              {business.subcategories && business.subcategories.length > 0 && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground col-span-full">
                  <span className="text-[10px] sm:text-xs">Especialidades:</span>
                  <span className="text-[10px] sm:text-xs line-clamp-1">{business.subcategories.map(s => s.name).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs - Mobile Scrollable */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-3 sm:px-6">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="services" className="text-xs sm:text-sm py-2 sm:py-2.5">
                <span className="hidden sm:inline">Servicios</span>
                <span className="sm:hidden">Servs.</span>
              </TabsTrigger>
              <TabsTrigger value="locations" className="text-xs sm:text-sm py-2 sm:py-2.5">
                <span className="hidden sm:inline">Ubicaciones</span>
                <span className="sm:hidden">Ubic.</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs sm:text-sm py-2 sm:py-2.5">
                <span className="hidden sm:inline">Reseñas</span>
                <span className="sm:hidden">Reviews</span>
              </TabsTrigger>
              <TabsTrigger value="professionals" className="text-xs sm:text-sm py-2 sm:py-2.5">
                <span className="hidden sm:inline">Profesionales</span>
                <span className="sm:hidden">Profes.</span>
              </TabsTrigger>
              <TabsTrigger value="about" className="text-xs sm:text-sm py-2 sm:py-2.5">
                <span className="hidden sm:inline">Acerca de</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Servicios */}
            <TabsContent value="services" className="mt-4 sm:mt-6">
              {business.services.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                  No hay servicios disponibles
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {business.services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={{
                        id: service.id,
                        name: service.name,
                        description: service.description,
                        duration: service.duration,
                        price: service.price,
                        category: service.category,
                        image_url: service.image_url,
                        business_id: businessId,
                      }}
                      readOnly
                      onViewProfile={() => setSelectedServiceId(service.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Ubicaciones */}
            <TabsContent value="locations" className="mt-6">
              {business.locations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay ubicaciones registradas
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {business.locations.map((location) => (
                    <LocationCard
                      key={location.id}
                      location={location as unknown as Location}
                      bannerUrl={locationBanners?.[location.id]}
                      readOnly
                      onViewProfile={() => setSelectedLocation(location)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Profesionales */}
            <TabsContent value="professionals" className="mt-4 sm:mt-6">
              {professionals.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                  No hay profesionales disponibles
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {professionals.map((pro) => (
                    <EmployeeCard
                      key={pro.id}
                      employee={pro}
                      readOnly
                      onViewProfile={() => setSelectedProfessionalId(pro.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Reseñas */}
            <TabsContent value="reviews" className="space-y-4 mt-6">
              {/* Formulario de nueva reseña */}
              {canReview && showReviewForm && eligibleAppointmentId && (
                <div className="mb-6">
                  <ReviewForm
                    appointmentId={eligibleAppointmentId}
                    businessId={businessId}
                    onSubmit={handleSubmitReview}
                    onCancel={() => setShowReviewForm(false)}
                  />
                </div>
              )}

              {/* Botón para mostrar formulario */}
              {canReview && !showReviewForm && (
                <div className="mb-6">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowReviewForm(true)}
                  >
                    Dejar reseña
                  </Button>
                </div>
              )}

              {/* Lista de reseñas */}
              <ReviewList businessId={businessId} />
            </TabsContent>

            {/* Tab: Acerca de */}
            <TabsContent value="about" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                  <p className="text-muted-foreground">
                    {business.description || 'Sin descripción disponible'}
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Información general</h3>
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoría</span>
                      <span className="font-medium">{business.category?.name || 'No especificada'}</span>
                    </div>
                    {business.subcategories && business.subcategories.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Especialidades</span>
                        <span className="font-medium">{business.subcategories.map(s => s.name).join(', ')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Servicios disponibles</span>
                      <span className="font-medium">{business.services.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ubicaciones</span>
                      <span className="font-medium">{business.locations.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calificación promedio</span>
                      <span className="font-medium">{business.rating.toFixed(1)} ⭐</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer sticky con botones principales */}
        {!hideBooking && (
        <div className="border-t border-border p-4 bg-background space-y-3">
          <Button 
            onClick={() => onBookAppointment?.(businessId)}
            className="w-full"
            size="lg"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Agendar Cita
          </Button>
          
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              ¿Tienes dudas sobre este negocio?
            </p>
            <Button 
              onClick={() => setShowChatModal(true)}
              className="w-full"
              size="lg"
              variant="outline"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Iniciar Chat
            </Button>
          </div>
        </div>
        )}
      </Card>

      {/* Chat Modal - inside DialogContent to stay within Radix focus scope */}
      {showChatModal && business && (
        <ChatWithAdminModal
          businessId={businessId}
          businessName={business.name}
          userLocation={userLocation}
          onClose={() => setShowChatModal(false)}
          onCloseParent={onClose}
          onChatStarted={(conversationId) => {
            if (onChatStarted) {
              onChatStarted(conversationId);
            }
          }}
        />
      )}
      </DialogContent>
    </Dialog>
    <>
      {/* Service Profile Modal */}
      <ServiceProfileModal
        serviceId={selectedServiceId}
        onClose={() => setSelectedServiceId(null)}
      />

      {/* Location Profile Modal */}
      {selectedLocation && (
        <LocationProfileModal
          open={!!selectedLocation}
          onOpenChange={(open) => { if (!open) setSelectedLocation(null); }}
          location={selectedLocation}
        />
      )}

      {/* Professional Profile Modal */}
      {selectedProfessionalId && (
        <UserProfile
          userId={selectedProfessionalId}
          onClose={() => setSelectedProfessionalId(null)}
          hideBooking
        />
      )}
    </>
    </>  )
}

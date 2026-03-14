import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Building2, Filter, Search, Star } from 'lucide-react';
import { MapPin } from '@phosphor-icons/react';
import BusinessProfile from '@/components/business/BusinessProfile';
import { cn } from '@/lib/utils';
import { withCache } from '@/lib/cache';
import supabase from '@/lib/supabase';
import { usePreferredCity } from '@/hooks/usePreferredCity';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/contexts/AuthContext';
import { BOGOTA_REGION_ID, BOGOTA_CITY_ID, BOGOTA_CITY_NAME } from '@/constants';
import { useKV } from '@/lib/useKV';

type SearchType = 'all' | 'businesses' | 'services' | 'categories' | 'users';

interface Business {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url?: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  // added for category-based filtering
  category_id?: string | null;
}

interface BusinessSelectionProps {
  readonly selectedBusinessId: string | null;
  readonly preferredCityName?: string | null;
  readonly preferredRegionName?: string | null;
  readonly onSelectBusiness: (business: Business) => void;
  // Nuevo: controlar si se debe cargar automáticamente al montar
  readonly autoLoad?: boolean;
}

export function BusinessSelection({
  selectedBusinessId,
  preferredCityName: propCityName,
  preferredRegionName: propRegionName,
  onSelectBusiness,
  autoLoad = true,
}: BusinessSelectionProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  // No mostrar loading hasta que el usuario interactúe
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const hookCityData = usePreferredCity();
  const [cityNameMap, setCityNameMap] = useState<Record<string, string>>({});
  const [locationsCountMap, setLocationsCountMap] = useState<Record<string, number>>({});
  const [cityBusinessIds, setCityBusinessIds] = useState<string[]>([]);
  const [cityLocationIds, setCityLocationIds] = useState<string[]>([]);
  const [matchSourcesByBusinessId, setMatchSourcesByBusinessId] = useState<Record<string, string[]>>({});
  const [displayedBusinesses, setDisplayedBusinesses] = useState<Business[]>([]);
  const [remainingBusinessIds, setRemainingBusinessIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const { user } = useAuth();
  const PAGE_SIZE = 12;
  const hasLoadedRef = useRef(false);
  // Cargar última búsqueda guardada (si existe)
  const [lastSearch] = useKV<{ term: string; type: SearchType } | null>('last-search', null);
  
  // Filtros y orden por calificación (solo primeros 12)
  const [minRating, setMinRating] = useState<number | ''>('');
  const [minReviewCount, setMinReviewCount] = useState<number | ''>('');
  const [orderBestRated, setOrderBestRated] = useState<boolean>(false);
  const [ratingStatsByBusinessId, setRatingStatsByBusinessId] = useState<Record<string, { average_rating: number; review_count: number }>>({});
  const [filtersApplied, setFiltersApplied] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
  const [servicesByBusinessId, setServicesByBusinessId] = useState<Record<string, string[]>>({});
  const [profileBusinessId, setProfileBusinessId] = useState<string | null>(null);
  // Ratings: se consumen desde la Edge Function `search_businesses`.
  
  // Helper para detectar UUID (IDs de ciudad/región)
  const isUUID = (value: string | null): boolean => {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  };
  
  // Usar props si vienen del parent (AppointmentWizard), si no usar hook
  const preferredCityName = propCityName ?? hookCityData.preferredCityName;
  const preferredRegionName = propRegionName ?? hookCityData.preferredRegionName;

  // Helper: obtiene negocios por IDs, activos y públicos
  const fetchBusinessesByIds = useCallback(async (ids: string[]): Promise<Business[]> => {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, description, logo_url, banner_url, address, city, phone, category_id')
      .in('id', ids)
      .eq('is_active', true)
      .eq('is_public', true);
    if (error) return [];
    return (data as Business[]) || [];
  }, []);

  // Helper: aplica la regla de disponibilidad (servicio+empleado+ubicación activos)
  const applyAvailabilityFilter = useCallback(async (candidateBusinesses: Business[]): Promise<Business[]> => {
    const businessIds = candidateBusinesses.map(b => b.id);
    if (businessIds.length === 0) return [];

    const [servicesRes, locationsRes, employeesRes, empServicesRes] = await Promise.all([
      supabase
        .from('services')
        .select('id, business_id')
        .in('business_id', businessIds)
        .eq('is_active', true),
      supabase
        .from('locations')
        .select('id, business_id')
        .in('business_id', businessIds)
        .eq('is_active', true),
      supabase
        .from('business_employees')
        .select('business_id, employee_id')
        .in('business_id', businessIds)
        .eq('status', 'approved')
        .eq('is_active', true),
      supabase
        .from('employee_services')
        .select('business_id, service_id, location_id, employee_id, is_active')
        .in('business_id', businessIds)
        .eq('is_active', true),
    ]);

    const activeServices = (servicesRes.data || []) as { id: string; business_id: string }[];
    const activeLocations = (locationsRes.data || []) as { id: string; business_id: string }[];
    const activeEmployees = (employeesRes.data || []) as { business_id: string; employee_id: string }[];
    const activeEmpServices = (empServicesRes.data || []) as { business_id: string; service_id: string; location_id: string | null; employee_id: string; is_active: boolean }[];

    const svcByBiz = new Map<string, Set<string>>();
    for (const s of activeServices) {
      if (!svcByBiz.has(s.business_id)) svcByBiz.set(s.business_id, new Set());
      svcByBiz.get(s.business_id)!.add(s.id);
    }

    const locByBiz = new Map<string, Set<string>>();
    for (const l of activeLocations) {
      if (!locByBiz.has(l.business_id)) locByBiz.set(l.business_id, new Set());
      locByBiz.get(l.business_id)!.add(l.id);
    }

    const empByBiz = new Map<string, Set<string>>();
    for (const e of activeEmployees) {
      if (!empByBiz.has(e.business_id)) empByBiz.set(e.business_id, new Set());
      empByBiz.get(e.business_id)!.add(e.employee_id);
    }

    const allowedBusinessIds = new Set<string>();
    for (const es of activeEmpServices) {
      if (!es.location_id) continue;
      const svc = svcByBiz.get(es.business_id);
      const loc = locByBiz.get(es.business_id);
      const emp = empByBiz.get(es.business_id);
      if (!svc || !loc || !emp) continue;
      if (svc.has(es.service_id) && loc.has(es.location_id) && emp.has(es.employee_id)) {
        allowedBusinessIds.add(es.business_id);
      }
    }

    return candidateBusinesses.filter(b => allowedBusinessIds.has(b.id));
  }, []);

  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const { preferredRegionId, preferredCityId, preferredRegionName: hookRegionName, preferredCityName: hookCityName } = hookCityData;
      const effectiveRegionId = preferredRegionId || null;
      const effectiveCityId = preferredCityId || null;
      const effectiveRegionName = propRegionName ?? hookRegionName ?? null;
      const effectiveCityName = propCityName ?? hookCityName ?? null;

      const cacheKey = `search_businesses|type=all|term=|regionId=${effectiveRegionId}|regionName=${effectiveRegionName}|cityId=${effectiveCityId}|cityName=${effectiveCityName}|client=${user?.id ?? ''}|page=1|size=${PAGE_SIZE}|minRating=${typeof minRating==='number'?minRating:''}|minReviews=${typeof minReviewCount==='number'?minReviewCount:''}`;
      const { data, error } = await withCache(cacheKey, async () => {
        return supabase.functions.invoke('search_businesses', {
          body: {
            type: 'all',
            term: '',
            preferredRegionId: effectiveRegionId,
            preferredRegionName: effectiveRegionName,
            preferredCityId: effectiveCityId,
            preferredCityName: effectiveCityName,
            clientId: user?.id ?? null,
            page: 1,
            pageSize: PAGE_SIZE,
            excludeBusinessIds: [],
            // Alinear con "Aplicar filtros": incluir filtros si están definidos
            minRating: typeof minRating === 'number' ? minRating : undefined,
            minReviewCount: typeof minReviewCount === 'number' ? minReviewCount : undefined,
          },
        });
      }, 120_000);
      if (error) throw error as Error;
      const result = (data as any) || {};
      const cityOnly = (result.businesses || []) as Business[];

      // Guardar metadata de ciudad y conteos provenientes de la función Edge
      setLocationsCountMap(result.locationsCountMap || {});
      setCityBusinessIds(result.cityBusinessIds || []);
      setCityLocationIds(result.cityLocationIds || []);
      setCityNameMap(result.cityNameMap || {});
      setMatchSourcesByBusinessId({});
      setRatingStatsByBusinessId(result.ratingStatsByBusinessId || {});

      setBusinesses(cityOnly);
      setFilteredBusinesses(cityOnly);
      setDisplayedBusinesses(cityOnly);
      setRemainingBusinessIds([]);
      setCurrentPage(1);
      setTotalResults(result.total || cityOnly.length || 0);
      // Marcar como filtros aplicados para que la paginación use misma estrategia
      setFiltersApplied(true);
    } catch {
      setBusinesses([]);
      setFilteredBusinesses([]);
      setDisplayedBusinesses([]);
      setRemainingBusinessIds([]);
      setCurrentPage(1);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [
    propCityName,
    propRegionName,
    user?.id,
    hookCityData.preferredRegionId,
    hookCityData.preferredCityId,
    hookCityData.preferredRegionName,
    hookCityData.preferredCityName,
    minRating,
    minReviewCount,
    PAGE_SIZE,
  ]);

  useEffect(() => {
    // Evitar doble llamada en modo Strict de React
    if (hasLoadedRef.current) return;
    // Solo cargar automáticamente si explícitamente está habilitado
    if (!autoLoad) return;

    // Esperar a que esté disponible preferredRegionId para incluirlo en la primera solicitud
    if (!hookCityData.preferredRegionId) return;

    hasLoadedRef.current = true;
    setLoading(true);
    void loadBusinesses();
  }, [loadBusinesses, autoLoad, hookCityData.preferredRegionId]);

  // Si hay una búsqueda previa persistida, aplicarla al montar
  useEffect(() => {
    if (lastSearch && lastSearch.term && lastSearch.type) {
      setSearchTerm(lastSearch.term);
      setSearchType(lastSearch.type);
      // Ejecutar búsqueda inmediata con los valores persistidos
      void handleSearch(lastSearch.term, lastSearch.type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSearch]);

  // Sincronizar estados cuando cambia el conjunto de negocios (paginación servidor)
  useEffect(() => {
    setSearchTerm('');
    setSearchType('all');
    setFilteredBusinesses(businesses);
    setDisplayedBusinesses(businesses);
    setRemainingBusinessIds([]);
  }, [businesses]);

  // Los nombres de ciudad llegan desde la Edge Function en cityNameMap
  useEffect(() => {
    // no-op: ya usamos cityNameMap de la respuesta
  }, [filteredBusinesses]);

  // Reordenar primeros 12 por mejor calificación si está activado
  useEffect(() => {
    if (!orderBestRated) return;
    if (displayedBusinesses.length === 0) return;
    const first = displayedBusinesses.slice(0, PAGE_SIZE);
    const rest = displayedBusinesses.slice(PAGE_SIZE);
    const sorted = [...first].sort((a, b) => {
      const rb = ratingStatsByBusinessId[b.id]?.average_rating ?? 0;
      const ra = ratingStatsByBusinessId[a.id]?.average_rating ?? 0;
      if (rb !== ra) return rb - ra;
      const cb = ratingStatsByBusinessId[b.id]?.review_count ?? 0;
      const ca = ratingStatsByBusinessId[a.id]?.review_count ?? 0;
      return cb - ca;
    });
    setDisplayedBusinesses([...sorted, ...rest]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderBestRated, ratingStatsByBusinessId, PAGE_SIZE]);

  // Cargar categorías y servicios para las tarjetas
  useEffect(() => {
    if (displayedBusinesses.length === 0) return;
    const bizIds = displayedBusinesses.map(b => b.id);
    const fetchExtra = async () => {
      // Categorías
      const catIds = [...new Set(displayedBusinesses.map(b => b.category_id).filter(Boolean) as string[])];
      const missingCats = catIds.filter(id => !categoriesMap[id]);
      if (missingCats.length > 0) {
        const { data } = await supabase.from('business_categories').select('id, name').in('id', missingCats);
        if (data) {
          setCategoriesMap(prev => ({ ...prev, ...Object.fromEntries((data as { id: string; name: string }[]).map(c => [c.id, c.name])) }));
        }
      }
      // Servicios (primeros 5 por negocio)
      const missingBizIds = bizIds.filter(id => !(id in servicesByBusinessId));
      if (missingBizIds.length > 0) {
        const { data } = await supabase
          .from('services')
          .select('id, name, business_id')
          .in('business_id', missingBizIds)
          .eq('is_active', true)
          .order('name')
          .limit(missingBizIds.length * 6);
        if (data) {
          const map: Record<string, string[]> = {};
          for (const s of (data as { id: string; name: string; business_id: string }[])) {
            if (!map[s.business_id]) map[s.business_id] = [];
            if (map[s.business_id].length < 5) map[s.business_id].push(s.name);
          }
          for (const id of missingBizIds) if (!map[id]) map[id] = [];
          setServicesByBusinessId(prev => ({ ...prev, ...map }));
        }
      }
    };
    void fetchExtra();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedBusinesses]);

  // Banner placeholder basado en el tipo de negocio
  const getBannerImage = (business: Business): string => {
    if (business.banner_url) return business.banner_url;
    if (business.logo_url) return business.logo_url;
    const name = business.name.toLowerCase();
    if (name.includes('salon') || name.includes('beauty') || name.includes('belleza'))
      return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=300&fit=crop';
    if (name.includes('spa') || name.includes('relax'))
      return 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=300&fit=crop';
    if (name.includes('gym') || name.includes('fitness'))
      return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=300&fit=crop';
    if (name.includes('clinic') || name.includes('dental') || name.includes('medic'))
      return 'https://images.unsplash.com/photo-1629909615184-74f495363b67?w=800&h=300&fit=crop';
    if (name.includes('barberia') || name.includes('barber'))
      return 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=300&fit=crop';
    return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=300&fit=crop';
  };

  // Handle search and filter businesses in real-time
  const handleSearch = useCallback(async (term: string, type: SearchType) => {
    setSearchTerm(term);
    setSearchType(type);

    if (!term || term.trim().length < 2) {
      setFilteredBusinesses(businesses);
      setDisplayedBusinesses(businesses);
      setRemainingBusinessIds([]);
      return;
    }

    const termLower = term.toLowerCase();

    try {
      // Consolidar búsqueda mediante Edge Function para reducir llamadas
      const { preferredRegionId, preferredCityId, preferredRegionName: hookRegionName, preferredCityName: hookCityName } = hookCityData;
      const effectiveRegionId = preferredRegionId || null;
      const effectiveCityId = preferredCityId || null;
      const effectiveRegionName = propRegionName ?? hookRegionName ?? null;
      const effectiveCityName = propCityName ?? hookCityName ?? null;

      const cacheKeySearch = `search_businesses|type=${type}|term=${termLower}|regionId=${effectiveRegionId}|regionName=${effectiveRegionName}|cityId=${effectiveCityId}|cityName=${effectiveCityName}|client=${user?.id ?? ''}|page=1|size=${PAGE_SIZE}|minRating=${typeof minRating==='number'?minRating:''}|minReviews=${typeof minReviewCount==='number'?minReviewCount:''}`;
      const { data, error } = await withCache(cacheKeySearch, async () => {
        return supabase.functions.invoke('search_businesses', {
          body: {
            type,
            term,
            preferredRegionId: effectiveRegionId,
            preferredRegionName: effectiveRegionName,
            preferredCityId: effectiveCityId,
            preferredCityName: effectiveCityName,
            clientId: user?.id ?? null,
            page: 1,
            pageSize: PAGE_SIZE,
            excludeBusinessIds: [],
            // Aplicar filtros también en búsquedas por término/categorías
            minRating: typeof minRating === 'number' ? minRating : undefined,
            minReviewCount: typeof minReviewCount === 'number' ? minReviewCount : undefined,
          },
        });
      }, 120_000);
      if (error) throw error as Error;
      const result = (data as any) || {};
      const cityOnly = (result.businesses || []) as Business[];
      setLocationsCountMap(result.locationsCountMap || {});
      setCityNameMap(result.cityNameMap || {});
      setMatchSourcesByBusinessId(result.matchSourcesByBusinessId || {});
      setRatingStatsByBusinessId(result.ratingStatsByBusinessId || {});
      setFilteredBusinesses(cityOnly);
      setDisplayedBusinesses(cityOnly);
      setRemainingBusinessIds([]);
      setCurrentPage(1);
      setTotalResults(result.total || cityOnly.length || 0);
      setFiltersApplied(false);
    } catch {
      setFilteredBusinesses([]);
      setDisplayedBusinesses([]);
      setRemainingBusinessIds([]);
      setCurrentPage(1);
      setTotalResults(0);
    }
  }, [businesses, hookCityData, propCityName, propRegionName]);

  // Debounce para evitar múltiples llamadas al escribir
  const debouncedHandleSearch = useDebounce(handleSearch, 350);

  // Botón Cargar más: pedir siguiente página al servidor evitando duplicados
  const handleLoadMore = async () => {
    if (displayedBusinesses.length >= totalResults) return;
    const { preferredRegionId, preferredCityId, preferredRegionName: hookRegionName, preferredCityName: hookCityName } = hookCityData;
    const effectiveRegionId = preferredRegionId || null;
    const effectiveCityId = preferredCityId || null;
    const effectiveRegionName = propRegionName ?? hookRegionName ?? null;
    const effectiveCityName = propCityName ?? hookCityName ?? null;

    const nextPage = currentPage + 1;
    const excludeIds = displayedBusinesses.map(b => b.id);

    try {
      const keyType = (searchTerm && searchTerm.trim().length >= 2) ? searchType : 'all';
      const keyTerm = (searchTerm && searchTerm.trim().length >= 2) ? searchTerm.toLowerCase() : '';
      const cacheKeyLoadMore = `search_businesses|type=${keyType}|term=${keyTerm}|regionId=${effectiveRegionId}|regionName=${effectiveRegionName}|cityId=${effectiveCityId}|cityName=${effectiveCityName}|client=${user?.id ?? ''}|page=${nextPage}|size=${PAGE_SIZE}|exclude=${excludeIds.join(',')}|minRating=${typeof minRating==='number'?minRating:''}|minReviews=${typeof minReviewCount==='number'?minReviewCount:''}|filtersApplied=${filtersApplied}`;
      const { data, error } = await withCache(cacheKeyLoadMore, async () => {
        return supabase.functions.invoke('search_businesses', {
          body: {
            type: keyType,
            term: (searchTerm && searchTerm.trim().length >= 2) ? searchTerm : '',
            preferredRegionId: effectiveRegionId,
            preferredRegionName: effectiveRegionName,
            preferredCityId: effectiveCityId,
            preferredCityName: effectiveCityName,
            clientId: user?.id ?? null,
            page: nextPage,
            pageSize: PAGE_SIZE,
            excludeBusinessIds: excludeIds,
            // Mantener filtros en páginas siguientes cuando hay búsqueda o filtros aplicados
            ...((searchTerm && searchTerm.trim().length >= 2) || filtersApplied ? {
              minRating: typeof minRating === 'number' ? minRating : undefined,
              minReviewCount: typeof minReviewCount === 'number' ? minReviewCount : undefined,
            } : {}),
          },
        });
      }, 120_000);
      if (error) throw error as Error;
      const result = (data as any) || {};
      const nextRows = (result.businesses || []) as Business[];
      setLocationsCountMap(result.locationsCountMap || {});
      setCityNameMap(result.cityNameMap || {});
      setMatchSourcesByBusinessId(prev => ({
        ...prev,
        ...(result.matchSourcesByBusinessId || {})
      }));
      setDisplayedBusinesses(prev => [...prev, ...nextRows]);
      setCurrentPage(nextPage);
      setTotalResults(result.total || totalResults);
    } catch {
      // No-op: no avanzamos de página si falla
    }
  };

  // Aplicar filtros explícitamente (misma consulta base que inicial + rating/reviews)
  const handleApplyFilters = useCallback(async () => {
    setLoading(true);
    try {
      const { preferredRegionId, preferredCityId, preferredRegionName: hookRegionName, preferredCityName: hookCityName } = hookCityData;
      const effectiveRegionId = preferredRegionId || null;
      const effectiveCityId = preferredCityId || null;
      const effectiveRegionName = propRegionName ?? hookRegionName ?? null;
      const effectiveCityName = propCityName ?? hookCityName ?? null;

      const cacheKeyApply = `search_businesses|type=all|term=|regionId=${effectiveRegionId}|regionName=${effectiveRegionName}|cityId=${effectiveCityId}|cityName=${effectiveCityName}|client=${user?.id ?? ''}|page=1|size=${PAGE_SIZE}|minRating=${typeof minRating==='number'?minRating:''}|minReviews=${typeof minReviewCount==='number'?minReviewCount:''}`;
      const { data, error } = await withCache(cacheKeyApply, async () => {
        return supabase.functions.invoke('search_businesses', {
          body: {
            type: 'all',
            term: '',
            preferredRegionId: effectiveRegionId,
            preferredRegionName: effectiveRegionName,
            preferredCityId: effectiveCityId,
            preferredCityName: effectiveCityName,
            clientId: user?.id ?? null,
            page: 1,
            pageSize: PAGE_SIZE,
            excludeBusinessIds: [],
            minRating: typeof minRating === 'number' ? minRating : undefined,
            minReviewCount: typeof minReviewCount === 'number' ? minReviewCount : undefined,
          },
        });
      }, 120_000);
      if (error) throw error as Error;
      const result = (data as any) || {};
      const rows = (result.businesses || []) as Business[];
      setLocationsCountMap(result.locationsCountMap || {});
      setCityBusinessIds(result.cityBusinessIds || []);
      setCityLocationIds(result.cityLocationIds || []);
      setCityNameMap(result.cityNameMap || {});
      setMatchSourcesByBusinessId(result.matchSourcesByBusinessId || {});
      setRatingStatsByBusinessId(result.ratingStatsByBusinessId || {});

      setBusinesses(rows);
      setFilteredBusinesses(rows);
      setDisplayedBusinesses(rows);
      setRemainingBusinessIds([]);
      setCurrentPage(1);
      setTotalResults(result.total || rows.length || 0);
      setFiltersApplied(true);
    } catch {
      setBusinesses([]);
      setFilteredBusinesses([]);
      setDisplayedBusinesses([]);
      setRemainingBusinessIds([]);
      setCurrentPage(1);
      setTotalResults(0);
      setFiltersApplied(true);
    } finally {
      setLoading(false);
    }
  }, [hookCityData, propCityName, propRegionName, user?.id, PAGE_SIZE, minRating, minReviewCount]);

  // Aplicar filtros automáticamente con debounce cuando cambian los valores
  const debouncedApplyFilters = useDebounce(handleApplyFilters, 500);
  
  useEffect(() => {
    // Solo aplicar si los filtros ya fueron usados una vez o si hay cambios significativos
    if (filtersApplied || typeof minReviewCount === 'number' || minRating === 4.5) {
      void debouncedApplyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minReviewCount, minRating]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#94a3b8]">Loading businesses...</p>
        </div>
      </div>
    );
  }
  const isSearching = (searchTerm && searchTerm.trim().length >= 2);

  return (
    <div className="p-3 space-y-3">
      {/* Barra de búsqueda y filtros juntos */}
      <div className="w-full flex flex-col sm:flex-row gap-2 items-center">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value, searchType)}
            placeholder="Buscar negocios..."
            className="w-full pl-10 pr-3 py-2 border border-input rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset text-sm"
          />
        </div>
        {/* Filtros siempre visibles, no colapsables */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={minRating === 4.5 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMinRating(minRating === 4.5 ? '' : 4.5)}
          >
            ⭐ 4.5 o más
          </Button>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Reviews mínimos</label>
            <Input
              type="text"
              inputMode="numeric"
              value={minReviewCount}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '');
                setMinReviewCount(v === '' ? '' : Math.max(0, Number(v)));
              }}
              className="h-8 w-24 text-xs"
              placeholder="e.g. 10"
            />
          </div>
          <Button
            variant={orderBestRated ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOrderBestRated(prev => !prev)}
          >
            {orderBestRated ? 'Orden: mejor calificados' : 'Orden: por defecto'}
          </Button>
        </div>
      </div>

      {/* Resultados */}
      {displayedBusinesses.length > 0 ? (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {displayedBusinesses.map((business) => {
          const isSelected = selectedBusinessId === business.id;
          const rs = ratingStatsByBusinessId[business.id];
          const services = servicesByBusinessId[business.id] ?? [];
          const cityDisplay = business.city ? (cityNameMap[business.city] ?? business.city) : '';
          return (
            <div
              key={business.id}
              onClick={() => onSelectBusiness(business)}
              className={cn(
                "group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200",
                "h-64",
                "border",
                "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20",
                isSelected
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/60"
              )}
            >
              {/* Banner de fondo */}
              <div
                className="w-full bg-cover bg-center"
                style={{ 
                  height: '60%',
                  backgroundImage: `url(${getBannerImage(business)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />

              {/* Degradado sobre el banner */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ 
                  height: '60%',
                  background: 'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0,0,0,0.50) 80%, rgba(0,0,0,0.80) 100%)' 
                }}
              />

              {/* Overlay de servicios al hacer hover - aparece sobre la imagen */}
              {services.length > 0 && (
                <div
                  className="absolute inset-x-0 top-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden flex flex-col justify-between"
                  style={{
                    height: '60%',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    background: 'rgba(0,0,0,0.68)',
                  }}
                >
                  <div className="p-2 flex flex-col gap-0.5 overflow-y-auto">
                    <p className="text-[10px] font-semibold text-white/55 uppercase tracking-wide mb-1">Servicios</p>
                    {services.map((svc) => (
                      <span key={svc} className="text-xs text-white/85 truncate leading-tight">
                        · {svc}
                      </span>
                    ))}
                  </div>
                  <div className="p-2 pt-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setProfileBusinessId(business.id); }}
                      className="w-full py-1 px-2 rounded text-[11px] font-semibold bg-white/15 hover:bg-white/30 text-white border border-white/25 transition-colors"
                    >
                      Perfil del negocio
                    </button>
                  </div>
                </div>
              )}

              {/* Check seleccionado */}
              {isSelected && (
                <div className="absolute top-2 right-2 z-30 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}

              {/* Info con fondo translúcido - 40% inferior */}
              <div className="relative p-2.5 flex flex-col gap-1 backdrop-blur-md bg-black/70 h-[40%] overflow-hidden">
                {/* Fila: Logo + Nombre + Categoría + Rating */}
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border border-white/30 bg-black/50">
                    {business.logo_url ? (
                      <img src={business.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white/70" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white drop-shadow truncate leading-tight">
                      {business.name}
                    </p>
                    {business.category_id && categoriesMap[business.category_id] && (
                      <p className="text-xs text-white/75 truncate leading-tight">
                        {categoriesMap[business.category_id]}
                      </p>
                    )}
                    {/* Rating justo debajo de la categoría */}
                    {rs && rs.average_rating ? (
                      <span className="flex items-center gap-0.5 text-[11px] text-white/90 mt-0.5">
                        <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                        {Number(rs.average_rating).toFixed(1)}
                        <span className="text-white/50">· {rs.review_count} reseñas</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-white/60 mt-0.5 block">
                        {locationsCountMap[business.id] ?? 0} sede{(locationsCountMap[business.id] ?? 0) !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sedes en la ciudad */}
                {(locationsCountMap[business.id] ?? 0) > 0 && (
                  <p className="flex items-center gap-1 text-xs text-white/75 truncate leading-tight mt-0.5">
                    <MapPin size={10} weight="fill" className="flex-shrink-0" />
                    {locationsCountMap[business.id]} sede{(locationsCountMap[business.id]) !== 1 ? 's' : ''}
                    {cityDisplay ? ` en ${cityDisplay}` : ''}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        </div>
        {(displayedBusinesses.length < totalResults) && (
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={handleLoadMore}>
              Cargar más
            </Button>
          </div>
        )}
        </>
      ) : (
        <div className="p-8 text-center border border-border rounded-lg bg-muted/30">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{isSearching ? 'No results found' : 'No Businesses Available'}</h3>
          <p className="text-muted-foreground">
            {isSearching
              ? 'No businesses match your search. Try different keywords.'
              : 'There are no active businesses at the moment.'}
          </p>
        </div>
      )}

      {/* Modal de perfil del negocio */}
      {profileBusinessId && (
        <BusinessProfile
          businessId={profileBusinessId}
          onClose={() => setProfileBusinessId(null)}
          hideBooking
        />
      )}
    </div>
  );
}

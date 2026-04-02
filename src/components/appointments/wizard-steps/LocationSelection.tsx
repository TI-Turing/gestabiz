import React, { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react'
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Location } from '@/types/types';
import { LocationProfileModal } from '@/components/admin/LocationProfileModal';
import { LocationCard } from '@/components/cards/LocationCard';
import supabase from '@/lib/supabase';

interface LocationSelectionProps {
  businessId: string;
  selectedLocationId: string | null;
  onSelectLocation: (location: Location) => void;
  preloadedLocations?: Location[]; // Datos pre-cargados para evitar consultas lentas
  isPreselected?: boolean; // Nueva prop para indicar si fue preseleccionado
  filterByEmployeeId?: string; // cuando está presente, las sedes donde el empleado no trabaja se deshabilitan
}

export function LocationSelection({ 
  businessId, 
  selectedLocationId, 
  onSelectLocation,
  preloadedLocations,
  isPreselected = false,
  filterByEmployeeId,
}: Readonly<LocationSelectionProps>) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(!preloadedLocations);
  const [locationBanners, setLocationBanners] = useState<Record<string, string>>({});
  const [profileLocation, setProfileLocation] = useState<Location | null>(null);
  // undefined = sin filtro activo | null = empleado sin sede asignada | string = ubicationId del empleado
  const [employeeLocationId, setEmployeeLocationId] = useState<string | null | undefined>(undefined);

  // Carga banners de sedes desde location_media
  const refreshLocationBanners = async (ids: string[]) => {
    try {
      if (!ids || ids.length === 0) {
        setLocationBanners({});
        return;
      }
      const { data, error } = await supabase
        .from('location_media')
        .select('location_id, type, url, is_banner, description, created_at')
        .in('location_id', ids)
        .order('created_at', { ascending: false });
      if (error) return; // silencioso
      const rows = Array.isArray(data) ? data : [];

      const bannerByLocation = new Map<string, any[]>();
      rows.forEach((m) => {
        const cleanUrl = (m.url || '').trim().replace(/^[`'\"]+|[`'\"]+$/g, '');
        if (m.is_banner && m.type === 'image') {
          const arr = bannerByLocation.get(m.location_id) || [];
          arr.push({ ...m, url: cleanUrl });
          bannerByLocation.set(m.location_id, arr);
        }
      });

      const banners: Record<string, string> = {};
      bannerByLocation.forEach((arr, locId) => {
        const chosen = arr.find((x) => (x.description || '').trim() !== 'Banner de prueba') || arr[0];
        if (chosen) banners[locId] = chosen.url;
      });

      setLocationBanners(banners);
    } catch {
      // noop
    }
  };

  // Fetch del location_id del empleado cuando filterByEmployeeId cambie
  useEffect(() => {
    if (!filterByEmployeeId) {
      setEmployeeLocationId(undefined);
      return;
    }
    supabase
      .from('business_employees')
      .select('location_id')
      .eq('employee_id', filterByEmployeeId)
      .eq('business_id', businessId)
      .maybeSingle()
      .then(({ data }) => {
        setEmployeeLocationId(data?.location_id ?? null);
      })
      .catch(() => {
        setEmployeeLocationId(null);
      });
  }, [filterByEmployeeId, businessId]);

  useEffect(() => {
    // Si ya tenemos datos pre-cargados, usarlos directamente (MÁS RÁPIDO)
    if (preloadedLocations) {
      setLocations(preloadedLocations);
      setLoading(false);
      const ids = preloadedLocations.map(l => l.id);
      refreshLocationBanners(ids).catch(() => {/* noop */});
      return;
    }

    // Si no hay datos pre-cargados, hacer la consulta tradicional
    const fetchLocations = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('id, business_id, name, address, city, city_name, state, country, postal_code, latitude, longitude, phone, email, description, images, business_hours, is_active, is_main, is_primary, created_at, updated_at, amenities, capacity')
          .eq('business_id', businessId)
          .eq('is_active', true)
          .order('name');

        if (error) {
          toast.error(`Error al cargar sedes: ${error.message}`);
          setLocations([]);
          return;
        }

        const activeLocations = (data || []) as Location[];
        if (activeLocations.length === 0) {
          setLocations([]);
          return;
        }

        // Filtrar sedes que no tengan servicios prestados por al menos un profesional activo
        const locationIds = activeLocations.map(l => l.id);

        const [employeesRes, empServicesRes] = await Promise.all([
          supabase
            .from('business_employees')
            .select('employee_id')
            .eq('business_id', businessId)
            .eq('status', 'approved')
            .eq('is_active', true),
          supabase
            .from('employee_services')
            .select('service_id, location_id, employee_id, is_active')
            .eq('business_id', businessId)
            .in('location_id', locationIds)
            .eq('is_active', true),
        ]);

        const activeEmployeeIds = new Set((employeesRes.data || []).map((e: any) => e.employee_id as string));
        const empServices = (empServicesRes.data || []) as { service_id: string; location_id: string | null; employee_id: string; is_active: boolean }[];

        const serviceIds = Array.from(new Set(empServices.map(es => es.service_id)));
        const { data: servicesData } = serviceIds.length > 0
          ? await supabase
              .from('services')
              .select('id')
              .in('id', serviceIds)
              .eq('is_active', true)
          : { data: [] } as any;
        const activeServiceIds = new Set((servicesData || []).map((s: any) => s.id as string));

        const allowedLocationIds = new Set<string>();
        for (const es of empServices) {
          if (!es.location_id) continue; // Debe estar ligada a sede
          if (activeEmployeeIds.has(es.employee_id) && activeServiceIds.has(es.service_id)) {
            allowedLocationIds.add(es.location_id);
          }
        }

        const filtered = activeLocations.filter(loc => allowedLocationIds.has(loc.id));
        setLocations(filtered);
        const ids = filtered.map(l => l.id);
        await refreshLocationBanners(ids);
      } catch (error) {
        Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'LocationSelection' } })
        const message = error instanceof Error ? error.message : 'Error inesperado';
        toast.error(`Error: ${message}`);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [businessId, preloadedLocations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando sedes...</span>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center">
          No hay sedes disponibles para este negocio.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Selecciona una Sede
        </h3>
        <p className="text-muted-foreground text-sm">
          Elige la ubicación donde deseas tu cita
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => {
          const isSelected = selectedLocationId === location.id;
          const wasPreselected = isPreselected && isSelected;
          const isDisabled =
            !!filterByEmployeeId &&
            employeeLocationId !== undefined &&
            location.id !== employeeLocationId;

          return (
            <div key={location.id} className="relative">
              <LocationCard
                location={location}
                bannerUrl={locationBanners[location.id]}
                isSelected={isSelected}
                onSelect={isDisabled ? undefined : onSelectLocation}
                isPreselected={wasPreselected}
                onViewProfile={(loc) => setProfileLocation(loc)}
                className={isDisabled ? 'pointer-events-none opacity-50' : undefined}
              />
              {isDisabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl pointer-events-none">
                  <p className="text-xs text-center text-muted-foreground px-3 font-medium leading-snug">
                    El empleado seleccionado no trabaja en esta sede
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>

      {/* Modal de perfil de sede */}
      {profileLocation && (
        <LocationProfileModal
          open={!!profileLocation}
          onOpenChange={(open) => { if (!open) setProfileLocation(null); }}
          location={profileLocation as unknown as Parameters<typeof LocationProfileModal>[0]['location']}
          bannerUrl={locationBanners[profileLocation.id]}
        />
      )}
    </>
  );
}

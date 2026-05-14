import React, { useEffect, useState, useCallback } from 'react';
import supabase from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { ServiceProfileModal } from '@/components/admin/ServiceProfileModal';
import { ServiceCard } from '@/components/cards/ServiceCard';
import { computeAllowedServiceIds } from '@/lib/services/servicesByModel';
import type { Service, ResourceModel } from '@/types/types';

interface ServiceSelectionProps {
  readonly businessId: string;
  readonly locationId?: string | null;
  readonly selectedServiceId: string | null;
  readonly onSelectService: (service: Service) => void;
  readonly preloadedServices?: Service[]; // Datos pre-cargados
  readonly preselectedServiceId?: string | null; // ID real del servicio preseleccionado
  readonly isPreselected?: boolean; // Compatibilidad existente
  /** Cuando está presente, solo muestra los servicios que ofrece este empleado */
  readonly filterByEmployeeId?: string;
  /**
   * Modelo del negocio. Cuando es 'physical_resource' o 'group_class', el
   * filtro por sede usa resource_services en lugar de employee_services.
   * En 'hybrid' se unen ambos. Default: 'professional' (back-compat).
   */
  readonly resourceModel?: ResourceModel | null;
}

export function ServiceSelection({
  businessId,
  locationId,
  selectedServiceId,
  onSelectService,
  preloadedServices,
  preselectedServiceId,
  isPreselected = false,
  filterByEmployeeId,
  resourceModel,
}: ServiceSelectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(!preloadedServices);
  const [profileServiceId, setProfileServiceId] = useState<string | null>(null);
  const { t } = useLanguage();

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      // Base services query
      let allServices: Service[];
      if (preloadedServices) {
        allServices = preloadedServices;
      } else {
        const { data, error } = await supabase
          .from('services')
          .select('id, business_id, name, description, duration_minutes, price, currency, category, is_active, created_at, updated_at, image_url')
          .eq('business_id', businessId)
          .eq('is_active', true);
        if (error) throw error;
        allServices = ((data as unknown[] | null) || []).map((s: any) => ({
          ...s,
          duration: s?.duration ?? s?.duration_minutes ?? 0,
        })) as Service[];
      }

      // If location is selected, restrict to services using a filter that
      // depends on the business resource_model: professional filters by
      // employee_services, physical_resource/group_class by resource_services,
      // and hybrid takes the union. See computeAllowedServiceIds() helper.
      if (locationId) {
        const model = resourceModel ?? 'professional';
        const needsEmployees = model === 'professional' || model === 'hybrid';
        const needsResources = model === 'physical_resource' || model === 'group_class' || model === 'hybrid';

        const [employeesRes, employeeServicesRes, resourcesRes, resourceServicesRes] = await Promise.all([
          needsEmployees
            ? supabase
                .from('business_employees')
                .select('employee_id')
                .eq('business_id', businessId)
                .eq('location_id', locationId)
                .eq('status', 'approved')
                .eq('is_active', true)
            : Promise.resolve({ data: [] as Array<{ employee_id: string }> }),
          needsEmployees
            ? supabase
                .from('employee_services')
                .select('employee_id, service_id')
                .eq('business_id', businessId)
                .eq('location_id', locationId)
                .eq('is_active', true)
            : Promise.resolve({ data: [] as Array<{ employee_id: string; service_id: string }> }),
          needsResources
            ? supabase
                .from('business_resources')
                .select('id')
                .eq('business_id', businessId)
                .eq('location_id', locationId)
                .eq('is_active', true)
            : Promise.resolve({ data: [] as Array<{ id: string }> }),
          needsResources
            ? supabase
                .from('resource_services')
                .select('resource_id, service_id')
                .eq('is_active', true)
            : Promise.resolve({ data: [] as Array<{ resource_id: string; service_id: string }> }),
        ]);

        const activeEmployeeIds = new Set<string>(
          (employeesRes.data ?? []).map((row: any) => row.employee_id as string),
        );
        const activeResourceIds = new Set<string>(
          (resourcesRes.data ?? []).map((row: any) => row.id as string),
        );

        const allowed = computeAllowedServiceIds({
          resourceModel: model,
          hasLocationFilter: true,
          employeeServices: ((employeeServicesRes.data ?? []) as Array<{ employee_id: string; service_id: string }>),
          activeEmployeeIds,
          resourceServices: ((resourceServicesRes.data ?? []) as Array<{ resource_id: string; service_id: string }>),
          activeResourceIds,
          allServiceIds: allServices.map((s) => s.id),
        });

        if (allowed !== null) {
          allServices = allServices.filter((service) => allowed.has(service.id));
        }
      }

      // If filtering by employee, restrict to services that employee offers
      if (filterByEmployeeId) {
        const { data: empSvcRows } = await supabase
          .from('employee_services')
          .select('service_id')
          .eq('employee_id', filterByEmployeeId)
          .eq('business_id', businessId)
          .eq('is_active', true);
        const allowedIds = new Set((empSvcRows ?? []).map((r: any) => r.service_id));
        allServices = allServices.filter(s => allowedIds.has(s.id));
      }

      setServices(allServices);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [businessId, preloadedServices, filterByEmployeeId, locationId, resourceModel]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#94a3b8]">{t('appointments.wizard.loadingServices')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="p-6">
      <h3 className="text-xl font-semibold text-foreground mb-6">
        {t('appointments.wizard.selectAService')}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id;
          const wasPreselected = preselectedServiceId
            ? service.id === preselectedServiceId
            : isPreselected && isSelected;

          return (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={isSelected}
              onSelect={onSelectService}
              isPreselected={wasPreselected}
              onViewProfile={(id) => setProfileServiceId(id)}
            />
          );
        })}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#94a3b8]">No hay servicios disponibles</p>
        </div>
      )}
    </div>

    <ServiceProfileModal
      serviceId={profileServiceId}
      onClose={() => setProfileServiceId(null)}
    />
  </>
  );
}

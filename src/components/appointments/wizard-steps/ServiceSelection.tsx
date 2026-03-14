import React, { useEffect, useState, useCallback } from 'react';
import supabase from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { ServiceProfileModal } from '@/components/admin/ServiceProfileModal';
import { ServiceCard } from '@/components/cards/ServiceCard';
import type { Service } from '@/types/types';

interface ServiceSelectionProps {
  readonly businessId: string;
  readonly selectedServiceId: string | null;
  readonly onSelectService: (service: Service) => void;
  readonly preloadedServices?: Service[]; // Datos pre-cargados
  readonly preselectedServiceId?: string | null; // ID real del servicio preseleccionado
  readonly isPreselected?: boolean; // Compatibilidad existente
}

export function ServiceSelection({
  businessId,
  selectedServiceId,
  onSelectService,
  preloadedServices,
  preselectedServiceId,
  isPreselected = false,
}: ServiceSelectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(!preloadedServices);
  const [profileServiceId, setProfileServiceId] = useState<string | null>(null);
  const { t } = useLanguage();

  const loadServices = useCallback(async () => {
    // Si ya tenemos datos pre-cargados, usarlos (MÁS RÁPIDO)
    if (preloadedServices) {
      setServices(preloadedServices);
      setLoading(false);
      return;
    }

    // Si no, hacer la consulta tradicional
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (error) throw error;
      // Normalizar duración para soportar esquemas con `duration_minutes`
      const normalized = ((data as unknown[] | null) || []).map((s: any) => ({
        ...s,
        duration: s?.duration ?? s?.duration_minutes ?? 0,
      })) as Service[];
      setServices(normalized);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [businessId, preloadedServices]);

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

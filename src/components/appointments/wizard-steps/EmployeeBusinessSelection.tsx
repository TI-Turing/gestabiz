import React, { useMemo } from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { useEmployeeBusinesses } from '@/hooks/useEmployeeBusinesses';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BusinessCard } from '@/components/cards/BusinessCard';
import type { BusinessCardData } from '@/components/cards/BusinessCard';

interface Business {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  address?: string;
  city?: string;
  state?: string;
}

interface EmployeeBusinessSelectionProps {
  employeeId: string;
  employeeName: string;
  selectedBusinessId: string | null;
  onSelectBusiness: (business: Business) => void;
}

/**
 * Componente para seleccionar bajo qué negocio se reservará la cita
 * cuando un empleado/profesional trabaja en múltiples negocios.
 */
export function EmployeeBusinessSelection({
  employeeId,
  employeeName,
  selectedBusinessId,
  onSelectBusiness,
}: Readonly<EmployeeBusinessSelectionProps>) {
  const { businesses, loading, error, isEmployeeOfAnyBusiness } = useEmployeeBusinesses(
    employeeId,
    true // Incluir negocios donde es owner (independiente)
  );

  // Validación: Si el empleado NO está vinculado a ningún negocio, no puede ser reservado
  const canBeBooked = useMemo(() => {
    return isEmployeeOfAnyBusiness && businesses.length > 0;
  }, [isEmployeeOfAnyBusiness, businesses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Verificando disponibilidad...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Si el profesional no está vinculado a ningún negocio
  if (!canBeBooked) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{employeeName}</strong> no está disponible para reservas en este momento.
            <br />
            Los profesionales deben estar vinculados a un negocio (empresa o independiente) para aceptar citas.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-center">
          <p className="text-sm text-muted-foreground">
            Por favor, selecciona otro profesional.
          </p>
        </div>
      </div>
    );
  }

  // Si solo tiene un negocio, auto-seleccionarlo (no mostrar este paso)
  // Este caso debería manejarse en el componente padre saltando este paso
  if (businesses.length === 1) {
    // Auto-select el único negocio disponible
    if (selectedBusinessId !== businesses[0].id) {
      onSelectBusiness(businesses[0]);
    }
    
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">
              Reservando con {employeeName}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Negocio: {businesses[0].name}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si tiene múltiples negocios, mostrar selector
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
              Lo sentimos, esta vez debes seleccionar el negocio
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
              <strong>{employeeName}</strong> trabaja en {businesses.length} ubicaciones diferentes.
              Selecciona el negocio donde deseas agendar tu cita.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {businesses.map((business) => {
          const cardData: BusinessCardData = {
            id: business.id,
            name: business.name,
            description: business.description,
            logo_url: business.logo_url,
            city: (() => {
              if (!business.city) return null;
              return business.state ? `${business.city}, ${business.state}` : business.city;
            })(),
            address: business.address,
          };
          return (
            <BusinessCard
              key={business.id}
              business={cardData}
              isSelected={selectedBusinessId === business.id}
              onSelect={() => onSelectBusiness(business)}
            />
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          <strong>Nota:</strong> La cita se agendará bajo el negocio seleccionado. 
          Las políticas de cancelación y confirmación pueden variar según el negocio.
        </p>
      </div>
    </div>
  );
}

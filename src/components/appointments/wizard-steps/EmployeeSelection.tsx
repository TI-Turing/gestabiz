import React, { useEffect, useMemo, useState } from 'react';
import * as Sentry from '@sentry/react'
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import UserProfile from '@/components/user/UserProfile';
import { EmployeeCard } from '@/components/cards/EmployeeCard';
import { useWizardEmployees } from '@/hooks/useWizardEmployees';

interface Employee {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  expertise_level?: number; // Nivel de experiencia 1-5
  average_rating?: number; // Calificación promedio
  total_reviews?: number; // Total de reviews
}

interface EmployeeSelectionProps {
  businessId: string;
  locationId: string; // NUEVO: Sede seleccionada
  serviceId: string;
  selectedEmployeeId: string | null;
  onSelectEmployee: (employee: Employee) => void;
  isPreselected?: boolean; // Nueva prop para indicar si fue preseleccionado
}

export function EmployeeSelection({ 
  businessId, 
  locationId,
  serviceId,
  selectedEmployeeId, 
  onSelectEmployee,
  isPreselected = false
}: Readonly<EmployeeSelectionProps>) {
  const [profileEmployeeId, setProfileEmployeeId] = useState<string | null>(null);
  const { user } = useAuth(); // Usuario actual logueado

  // ✅ Fase 3 COMPLETADA - EmployeeSelection Refactorizado:
  // Antes: 4 queries separadas (employee_services, business_employees, business_roles, reviews)
  // Ahora: 1 RPC consolidada vía useWizardEmployees hook (80% reducción)
  // Hook carga: employees, expertise_level, setup_completed, supervisor_name, ratings
  // useWizardEmployees hook consolida: employee_services, business_employees, business_roles, reviews en 1 RPC
  const { employees: rpcEmployees, isLoading, error: hookError } = useWizardEmployees(
    businessId,
    serviceId,
    locationId
  );

  // Filtro "bookable": empleados listos para recibir citas
  // (setup_completed=true OR role IN (manager, owner) con supervisor asignado)
  const employees = useMemo<Employee[]>(() => {
    if (!rpcEmployees) return [];
    
    try {
      return rpcEmployees
        .filter(emp => {
          // Solo empleados con setup completo O managers/owners (grandfathered)
          const canBook = emp.setup_completed || ['manager', 'owner'].includes(emp.role);
          // Solo empleados con supervisor asignado O si ya tiene supervisor_name
          const hasSupervisor = emp.supervisor_name && emp.supervisor_name !== 'No asignado';
          return canBook || hasSupervisor;
        })
        .map(emp => ({
          id: emp.id,
          email: emp.email,
          full_name: emp.full_name,
          role: emp.role,
          avatar_url: emp.avatar_url,
          expertise_level: emp.expertise_level,
          average_rating: emp.avg_rating,
          total_reviews: emp.total_reviews,
        } as Employee));
    } catch (err) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { 
        tags: { component: 'EmployeeSelection', location: 'useMemo filter' } 
      });
      return [];
    }
  }, [rpcEmployees]);

  useEffect(() => {
    if (hookError) {
      toast.error(`Error al cargar profesionales: ${hookError}`);
    }
  }, [hookError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando profesionales...</span>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <Users className="h-16 w-16 text-gray-600 mb-4" />
        <p className="text-gray-400 text-center">
          No hay profesionales disponibles para este servicio.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Selecciona un Profesional
        </h3>
        <p className="text-muted-foreground text-sm">
          Elige el profesional con quien deseas tu cita
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((employee) => {
          const isSelf = user?.id === employee.id;
          const isSelected = selectedEmployeeId === employee.id;
          const wasPreselected = isPreselected && isSelected;

          return (
            <EmployeeCard
              key={employee.id}
              employeeId={employee.id}
              initialData={{
                id: employee.id,
                full_name: employee.full_name,
                email: employee.email,
                role: employee.role,
                avatar_url: employee.avatar_url,
                average_rating: employee.average_rating,
                total_reviews: employee.total_reviews,
              }}
              isSelected={isSelected}
              onSelect={(emp) => {
                if (isSelf) {
                  toast.error('No puedes agendarte una cita a ti mismo');
                  return;
                }
                onSelectEmployee(emp as typeof employee);
              }}
              isPreselected={wasPreselected}
              isSelf={isSelf}
              onViewProfile={(id) => setProfileEmployeeId(id)}
            />
          );
        })}
      </div>

      {/* Modal perfil del profesional */}
      {profileEmployeeId && (
        <UserProfile
          userId={profileEmployeeId}
          onClose={() => setProfileEmployeeId(null)}
          hideBooking
        />
      )}
    </div>
  );
}

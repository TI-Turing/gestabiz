import React, { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react'
import { Loader2, Users } from 'lucide-react';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import UserProfile from '@/components/user/UserProfile';
import { EmployeeCard } from '@/components/cards/EmployeeCard';

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileEmployeeId, setProfileEmployeeId] = useState<string | null>(null);
  const { user } = useAuth(); // Usuario actual logueado

  useEffect(() => {
    /**
     * NUEVA LÓGICA: Filtrar empleados que:
     * 1. Ofrezcan el servicio seleccionado (employee_services)
     * 2. Estén asignados a la sede seleccionada o sin sede específica
     * 3. Estén activos y aprobados
     * 4. Incluir nivel de experiencia y calificaciones
     */
    const fetchEmployeesForService = async () => {
      if (!businessId || !locationId || !serviceId) {
        setEmployees([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Consulta de employee_services para obtener empleados que ofrecen el servicio
        // en la sede seleccionada, ordenados por expertise_level (mayor primero)
        const { data: employeeServices, error: servicesError } = await supabase
          .from('employee_services')
          .select(`
            employee_id,
            expertise_level,
            employee:profiles!employee_services_employee_id_fkey(
              id,
              email,
              full_name,
              role,
              avatar_url
            )
          `)
          .eq('service_id', serviceId)
          .eq('location_id', locationId)
          .eq('business_id', businessId)
          .eq('is_active', true)
          .order('expertise_level', { ascending: false });

        if (servicesError) {
          toast.error(`Error al cargar profesionales: ${servicesError.message}`);
          setEmployees([]);
          return;
        }

        if (!employeeServices || employeeServices.length === 0) {
          setEmployees([]);
          return;
        }

        // Obtener IDs de empleados (usando 'any' para evitar conflictos de tipos con Supabase)
        const employeeIds = employeeServices
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((es: any) => es.employee?.id)
          .filter((id: string | undefined): id is string => id !== null && id !== undefined);

        if (employeeIds.length === 0) {
          setEmployees([]);
          return;
        }

        // --- FILTRO DE CONFIGURACIÓN OBLIGATORIA ---
        // Solo empleados con setup completo pueden recibir citas:
        // 1. setup_completed = true  (se marca al asignar supervisor)
        // 2. role IN (manager, owner)  (grandfathered / siempre listos)
        // 3. tiene supervisor asignado en business_roles (reports_to IS NOT NULL)
        // Tipo local para incluir el campo setup_completed (recién agregado a la BD)
        interface BEWithSetup { employee_id: string | null; role: string | null; setup_completed: boolean }

        const [{ data: beSetupRaw }, { data: brWithSupervisor }] = await Promise.all([
          supabase
            .from('business_employees')
            .select('employee_id, role, setup_completed')
            .eq('business_id', businessId)
            .eq('is_active', true)
            .in('employee_id', employeeIds),
          supabase
            .from('business_roles')
            .select('user_id')
            .eq('business_id', businessId)
            .not('reports_to', 'is', null)
            .in('user_id', employeeIds),
        ]);

        const beSetup = (beSetupRaw ?? []) as BEWithSetup[];
        const withSupervisorSet = new Set(brWithSupervisor?.map(r => r.user_id) || []);
        const bookableIds = new Set<string>([
          ...beSetup
            .filter(e => e.setup_completed || ['manager', 'owner'].includes(e.role || '') || withSupervisorSet.has(e.employee_id ?? ''))
            .map(e => e.employee_id ?? '')
            .filter(id => id !== ''),
          ...Array.from(withSupervisorSet),
        ]);

        if (bookableIds.size === 0) {
          setEmployees([]);
          return;
        }
        // --- FIN FILTRO ---

        // Obtener calificaciones promedio de reviews para cada empleado
        const { data: reviews } = await supabase
          .from('reviews')
          .select('employee_id, rating')
          .in('employee_id', employeeIds)
          .eq('is_visible', true);

        // Calcular rating promedio y total reviews por empleado
        const reviewStats = reviews?.reduce((acc: Record<string, { avg: number; count: number }>, review) => {
          const empId = review.employee_id;
          if (!empId) return acc;
          
          if (!acc[empId]) {
            acc[empId] = { avg: 0, count: 0 };
          }
          acc[empId].avg += review.rating;
          acc[empId].count += 1;
          return acc;
        }, {} as Record<string, { avg: number; count: number }>);

        // Mapear empleados con expertise y ratings
        const mappedEmployees: Employee[] = employeeServices
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((es: any) => {
            if (!es.employee) return null;
            
            const stats = reviewStats?.[es.employee_id];
            return {
              id: es.employee.id,
              email: es.employee.email,
              full_name: es.employee.full_name,
              role: es.employee.role,
              avatar_url: es.employee.avatar_url,
              expertise_level: es.expertise_level,
              average_rating: stats ? Math.round((stats.avg / stats.count) * 10) / 10 : 0,
              total_reviews: stats?.count || 0,
            } as Employee;
          })
          .filter((emp): emp is Employee => emp !== null && bookableIds.has(emp.id));

        setEmployees(mappedEmployees);
      } catch (error) {
        Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'EmployeeSelection' } })
        const message = error instanceof Error ? error.message : 'Error inesperado';
        toast.error(`Error: ${message}`);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeesForService();
  }, [businessId, serviceId, locationId]);

  if (loading) {
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

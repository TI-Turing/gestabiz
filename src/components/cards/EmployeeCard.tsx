import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, Check, Info, Ban } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';

export interface EmployeeCardData {
  id: string;
  full_name: string | null;
  email?: string;
  role?: string;
  avatar_url?: string | null;
  expertise_level?: number;
  average_rating?: number;
  total_reviews?: number;
  job_title?: string | null;
  offers_services?: boolean;
  services?: Array<{
    service_id: string;
    service_name: string;
    expertise_level: number;
  }>;
}

async function fetchEmployee(employeeId: string, businessId?: string): Promise<EmployeeCardData> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('id', employeeId)
    .single();
  if (error) throw error;

  let role: string | undefined;
  let job_title: string | null = null;
  let offers_services = false;

  if (businessId) {
    const { data: empData } = await supabase
      .from('business_employees')
      .select('role, job_title, offers_services')
      .eq('employee_id', employeeId)
      .eq('business_id', businessId)
      .maybeSingle();
    if (empData) {
      role = empData.role ?? undefined;
      job_title = empData.job_title ?? null;
      offers_services = empData.offers_services ?? false;
    }
  }

  const { data: reviewStats } = await supabase
    .from('reviews')
    .select('rating')
    .eq('employee_id', employeeId);

  const ratings = reviewStats ?? [];
  const average_rating = ratings.length > 0
    ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
    : undefined;

  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email ?? undefined,
    avatar_url: profile.avatar_url,
    role,
    job_title,
    offers_services,
    average_rating,
    total_reviews: ratings.length || undefined,
  };
}

interface EmployeeCardProps {
  /** ID del empleado — el card resuelve sus datos internamente */
  employeeId?: string;
  /** businessId para resolver rol y datos de empleo */
  businessId?: string;
  /** Datos pre-cargados (initialData para evitar refetch) */
  employee?: EmployeeCardData;
  initialData?: EmployeeCardData;
  isSelected?: boolean;
  onSelect?: (employee: EmployeeCardData) => void;
  isPreselected?: boolean;
  isSelf?: boolean;
  onViewProfile?: (employeeId: string) => void;
  readOnly?: boolean;
  className?: string;
  renderActions?: (id: string) => React.ReactNode;
}

export function EmployeeCard({
  employeeId,
  businessId,
  employee: employeeProp,
  initialData,
  isSelected = false,
  onSelect,
  isPreselected = false,
  isSelf = false,
  onViewProfile,
  readOnly = false,
  className,
  renderActions,
}: Readonly<EmployeeCardProps>) {
  const seed = initialData ?? employeeProp;
  const resolvedId = employeeId ?? seed?.id;

  const { data: employee } = useQuery({
    queryKey: ['employee-card', resolvedId, businessId],
    queryFn: () => fetchEmployee(resolvedId!, businessId),
    initialData: seed,
    enabled: !!resolvedId,
    ...QUERY_CONFIG.STABLE,
  });

  if (!employee) {
    return (
      <div className={cn('rounded-xl p-6 border-2 border-border animate-pulse', className)}>
        <div className="flex flex-col items-center mb-3">
          <div className="w-20 h-20 rounded-full bg-muted mb-3" />
          <div className="h-5 bg-muted rounded w-24" />
        </div>
      </div>
    );
  }
  const rating = employee.average_rating ?? 5;
  const reviewCount = employee.total_reviews ?? 0;

  return (
    <div
      role={readOnly || isSelf ? undefined : 'button'}
      tabIndex={readOnly || isSelf ? undefined : 0}
      onClick={() => !readOnly && !isSelf && onSelect?.(employee)}
      onKeyDown={(e) => {
        if (!readOnly && !isSelf && (e.key === 'Enter' || e.key === ' ')) onSelect?.(employee);
      }}
      className={cn(
        'relative group rounded-xl p-6 text-left transition-all duration-200 border-2',
        isSelf
          ? 'opacity-50 cursor-not-allowed bg-muted/30 border-border/30'
          : readOnly
          ? 'bg-muted/50 border-border'
          : 'cursor-pointer hover:scale-[1.02] hover:shadow-xl',
        !isSelf && isSelected
          ? 'bg-primary/20 border-primary shadow-lg shadow-primary/20'
          : !isSelf && !readOnly && 'bg-muted/50 border-border hover:bg-muted hover:border-border/50',
        isPreselected && 'ring-2 ring-green-500/50',
        className,
      )}
    >
      {isPreselected && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-green-500 text-white text-xs shadow-lg">
            <Check className="w-3 h-3 mr-1" />
            Preseleccionado
          </Badge>
        </div>
      )}

      {/* Checkmark seleccionado */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center z-10">
          <Check size={14} className="text-primary-foreground" />
        </div>
      )}

      {/* Avatar y nombre */}
      <div className="flex flex-col items-center mb-3">
        <ProfileAvatar
          src={employee.avatar_url}
          alt={employee.full_name || 'Profesional'}
          fallbackText={employee.full_name || undefined}
          size="xl"
          className={cn('mb-3 border-2', isSelected ? 'border-primary' : 'border-border')}
        />
        <h4 className="text-lg font-semibold text-foreground text-center">
          {employee.full_name || 'Profesional'}
        </h4>
        {!readOnly && employee.email && (
          <p className="text-xs text-muted-foreground text-center mt-0.5 truncate max-w-full">{employee.email}</p>
        )}
      </div>

      {/* Badges de rol */}
      {(employee.role === 'manager' || employee.offers_services) && (
        <div className="flex flex-wrap justify-center gap-1 mb-3">
          {employee.role === 'manager' && (
            <Badge variant="default" className="text-xs">Administrador</Badge>
          )}
          {employee.offers_services && (
            <Badge variant="secondary" className="text-xs">Ofrece servicios</Badge>
          )}
        </div>
      )}

      {/* Job title */}
      {employee.job_title && (
        <p className="text-xs text-muted-foreground text-center mb-3">{employee.job_title}</p>
      )}

      {/* Servicios que ofrece */}
      {employee.services && employee.services.length > 0 && (
        <div className="mb-3 w-full">
          <p className="text-xs font-medium mb-1.5 text-center">
            Servicios ({employee.services.length}):
          </p>
          <div className="flex flex-wrap justify-center gap-1">
            {employee.services.map((s) => (
              <div key={s.service_id} className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                <span>{s.service_name}</span>
                <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                <span>{s.expertise_level}/5</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating */}
      <div className="flex justify-center items-center gap-1 text-yellow-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className="h-4 w-4 fill-current" />
        ))}
        <span className="text-xs text-muted-foreground ml-1">
          ({reviewCount > 0 ? rating.toFixed(1) : '5.0'})
        </span>
      </div>

      {/* Botón Ver perfil */}
      {onViewProfile && !isSelf && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewProfile(employee.id); }}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 border border-primary/40 hover:border-primary/70 px-3 py-1.5 rounded-full transition-all duration-200 bg-primary/5 hover:bg-primary/10"
          >
            <Info className="h-3.5 w-3.5" />
            Ver perfil
          </button>
        </div>
      )}

      {renderActions?.(employee.id)}

      {/* Overlay: no puedes agendarte a ti mismo */}
      {isSelf && (
        <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2">
            <Ban className="h-4 w-4" />
            No puedes agendarte a ti mismo
          </div>
        </div>
      )}

      {/* Hover gradient */}
      {!readOnly && !isSelf && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-linear-to-br from-purple-500/10 to-transparent" />
      )}
    </div>
  );
}

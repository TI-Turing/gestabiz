import React from 'react';
import { Star, Check, Info, Ban } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface EmployeeCardData {
  id: string;
  full_name: string | null;
  email?: string;
  role?: string;
  avatar_url?: string | null;
  expertise_level?: number;
  average_rating?: number;
  total_reviews?: number;
}

interface EmployeeCardProps {
  employee: EmployeeCardData;
  isSelected?: boolean;
  onSelect?: (employee: EmployeeCardData) => void;
  isPreselected?: boolean;
  isSelf?: boolean;
  onViewProfile?: (employeeId: string) => void;
  readOnly?: boolean;
}

export function EmployeeCard({
  employee,
  isSelected = false,
  onSelect,
  isPreselected = false,
  isSelf = false,
  onViewProfile,
  readOnly = false,
}: Readonly<EmployeeCardProps>) {
  const initials = (employee.full_name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const rating = employee.average_rating ?? 5.0;
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
      )}
    >
      {/* Badge preseleccionado */}
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
      <div className="flex flex-col items-center mb-4">
        <Avatar className={cn('w-20 h-20 mb-3 border-2', isSelected ? 'border-primary' : 'border-border')}>
          <AvatarImage src={employee.avatar_url || undefined} alt={employee.full_name || 'Profesional'} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <h4 className="text-lg font-semibold text-foreground text-center">
          {employee.full_name || 'Profesional'}
        </h4>
      </div>

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

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, User, Briefcase, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';

export interface AppointmentCardData {
  id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'scheduled' | 'rescheduled';
  notes?: string | null;
  price?: number | null;
  currency?: string | null;
  title?: string;
  description?: string;
  location?: string;
  client_name?: string;
  /** URL for background image (service image or location banner) */
  backgroundImageUrl?: string | null;
  business?: {
    id: string;
    name: string;
    logo_url?: string | null;
    banner_url?: string | null;
  } | null;
  service?: {
    id: string;
    name: string;
    duration_minutes?: number | null;
    price?: number | null;
    currency?: string | null;
    image_url?: string | null;
    category?: string | null;
  } | null;
  employee?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  } | null;
  locationData?: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
  } | null;
}

async function fetchAppointment(appointmentId: string): Promise<AppointmentCardData> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, start_time, end_time, status, notes, price, currency, client_name,
      businesses:business_id(id, name, logo_url, banner_url),
      services:service_id(id, name, duration_minutes, price, currency, image_url, category),
      profiles:employee_id(id, full_name, avatar_url),
      locations:location_id(id, name, address, city)
    `)
    .eq('id', appointmentId)
    .single();

  if (error) throw error;

  const row = data as Record<string, unknown>;
  return {
    id: data.id,
    start_time: data.start_time,
    end_time: data.end_time,
    status: data.status as AppointmentCardData['status'],
    notes: data.notes,
    price: data.price,
    currency: data.currency,
    client_name: data.client_name,
    business: row.businesses as AppointmentCardData['business'],
    service: row.services as AppointmentCardData['service'],
    employee: row.profiles as AppointmentCardData['employee'],
    locationData: row.locations as AppointmentCardData['locationData'],
  };
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scheduled: { label: 'Programada', variant: 'secondary' },
  pending: { label: 'Pendiente', variant: 'secondary' },
  confirmed: { label: 'Confirmada', variant: 'default' },
  in_progress: { label: 'En progreso', variant: 'default' },
  completed: { label: 'Completada', variant: 'outline' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
  no_show: { label: 'No asistió', variant: 'destructive' },
  rescheduled: { label: 'Reprogramada', variant: 'secondary' },
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatPrice(amount: number, currency?: string | null): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'COP', maximumFractionDigits: 0 }).format(amount);
}

interface AppointmentCardProps {
  appointmentId?: string;
  initialData?: AppointmentCardData;
  className?: string;
  compact?: boolean;
  /** Featured variant with background image, gradient overlay and ProfileAvatar */
  featured?: boolean;
  readOnly?: boolean;
  onClick?: () => void;
  renderActions?: (id: string) => React.ReactNode;
  children?: React.ReactNode;
}

export function AppointmentCard({
  appointmentId,
  initialData,
  className,
  compact = false,
  featured = false,
  readOnly = false,
  onClick,
  renderActions,
  children,
}: Readonly<AppointmentCardProps>) {
  const resolvedId = appointmentId || initialData?.id;

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment-card', resolvedId],
    queryFn: () => fetchAppointment(resolvedId!),
    initialData,
    ...QUERY_CONFIG.STABLE,
    enabled: !!resolvedId && !initialData,
  });

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border bg-card p-4 animate-pulse', className)}>
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  const statusCfg = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.pending;
  const serviceName = appointment.service?.name || appointment.title || 'Cita';
  const servicePrice = appointment.service?.price ?? appointment.price;

  if (compact) {
    return (
      <div className={cn('rounded-xl border bg-card p-3 hover:shadow-sm transition-shadow', className)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1 text-sm font-medium truncate">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{serviceName}</span>
            </div>
            <Badge variant={statusCfg.variant} className="text-xs shrink-0">{statusCfg.label}</Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            {formatTime(appointment.start_time)}
          </div>
        </div>
        {(appointment.business || appointment.employee) && (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {appointment.business && (
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{appointment.business.name}</span>
            )}
            {appointment.employee && (
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{appointment.employee.full_name}</span>
            )}
          </div>
        )}
        {children}
      </div>
    );
  }

  // Featured variant: background image with gradient overlay
  if (featured) {
    const bgImage =
      appointment.backgroundImageUrl ||
      appointment.service?.image_url ||
      appointment.business?.banner_url ||
      null;
    const businessLogo = appointment.business?.logo_url || null;
    const hasBg = !!bgImage;
    const textColor = hasBg ? 'text-white' : 'text-foreground';
    const mutedColor = hasBg ? 'text-white/90' : 'text-muted-foreground';
    const subtleColor = hasBg ? 'text-white/80' : 'text-muted-foreground';

    // Calculate end time if missing
    const endTime = appointment.end_time || (() => {
      const duration = appointment.service?.duration_minutes || 60;
      const startDate = new Date(appointment.start_time);
      startDate.setMinutes(startDate.getMinutes() + duration);
      return startDate.toISOString();
    })();

    return (
      <button
        type="button"
        className={cn(
          'relative overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-shadow w-full min-w-0 text-left',
          onClick && 'cursor-pointer',
          className,
        )}
        onClick={onClick}
      >
        {bgImage && (
          <>
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/40 to-black/60" aria-hidden />
          </>
        )}

        <div className="relative z-10 p-4 space-y-3 min-w-0">
          {/* Header: Logo negocio + Badge estado */}
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-border/60">
            {/* Business logo */}
            {businessLogo ? (
              <img
                src={businessLogo}
                alt={appointment.business?.name || 'Negocio'}
                className={cn(
                  'h-9 w-9 rounded-lg object-cover shrink-0',
                  hasBg ? 'ring-2 ring-white/30' : 'ring-1 ring-border',
                )}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className={cn(
                'h-9 w-9 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold',
                hasBg ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
              )}>
                {appointment.business?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            {renderActions ? renderActions(appointment.id) : (
              <Badge variant={statusCfg.variant} className="shrink-0 whitespace-nowrap">{statusCfg.label}</Badge>
            )}
          </div>

          {/* Titles: Service, Business, Location */}
          <div className="space-y-1">
            <h3 className={cn('font-semibold text-lg line-clamp-2', textColor)}>
              {serviceName}
            </h3>
            {appointment.business?.name && (
              <p className={cn('text-sm font-medium truncate', hasBg ? 'text-white/90' : 'text-muted-foreground')}>
                {appointment.business.name}
              </p>
            )}
            {appointment.locationData?.name && (
              <p className={cn('text-xs truncate', subtleColor)}>{appointment.locationData.name}</p>
            )}
          </div>

          {/* Employee with ProfileAvatar */}
          {appointment.employee?.full_name && (
            <div className={cn(
              'flex items-center gap-3 p-2 rounded-lg border',
              hasBg ? 'bg-black/30 backdrop-blur-sm border-white/10' : 'bg-card/50 border-border/50',
            )}>
              <ProfileAvatar
                src={appointment.employee.avatar_url}
                alt={appointment.employee.full_name}
                fallbackText={appointment.employee.full_name}
                size="sm"
                className="shrink-0"
                maxRetries={5}
                retryDelay={800}
              />
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium line-clamp-1', textColor)}>
                  {appointment.employee.full_name}
                </p>
                <p className={cn('text-xs', subtleColor)}>Profesional</p>
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className={cn('flex items-center gap-2 text-sm pt-1', mutedColor)}>
            <Clock className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">
              {new Date(appointment.start_time).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
              {' \u2022 '}
              {formatTime(appointment.start_time)}
              {' - '}
              {formatTime(endTime)}
            </span>
          </div>

          {/* Address & Price */}
          <div className="flex min-w-0 items-center justify-between gap-3 pt-1">
            <div className={cn('flex items-center gap-2 text-sm min-w-0', mutedColor)}>
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {appointment.locationData?.address || appointment.locationData?.name || appointment.location || '\u2014'}
              </span>
            </div>
            {servicePrice != null && servicePrice > 0 && (
              <span className={cn('shrink-0 whitespace-nowrap text-base font-bold', hasBg ? 'text-white' : 'text-primary')}>
                {formatPrice(servicePrice, appointment.service?.currency || appointment.currency)}
              </span>
            )}
          </div>

          {children && <div className="mt-2">{children}</div>}
        </div>
      </button>
    );
  }

  const DefaultTag = onClick ? 'button' : 'div';

  return (
    <DefaultTag
      type={onClick ? 'button' : undefined}
      className={cn('rounded-xl border bg-card p-4 hover:shadow-md transition-shadow w-full text-left', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">{serviceName}</h3>
            <Badge variant={statusCfg.variant} className="shrink-0">{statusCfg.label}</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(appointment.start_time)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
            </span>
            {servicePrice != null && servicePrice > 0 && (
              <span className="font-medium text-foreground">
                {formatPrice(servicePrice, appointment.service?.currency || appointment.currency)}
              </span>
            )}
          </div>

          {appointment.business && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{appointment.business.name}</span>
            </div>
          )}

          {appointment.employee && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{appointment.employee.full_name}</span>
            </div>
          )}

          {(appointment.locationData || appointment.location) && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{appointment.locationData?.name || appointment.location}</span>
            </div>
          )}

          {appointment.client_name && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{appointment.client_name}</span>
            </div>
          )}
        </div>

        {renderActions && (
          <div className="shrink-0">
            {renderActions(appointment.id)}
          </div>
        )}
      </div>

      {children && <div className="mt-3">{children}</div>}
    </DefaultTag>
  );
}

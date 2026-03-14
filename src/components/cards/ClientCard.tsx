import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Mail, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';

export interface ClientCardData {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  whatsapp?: string | null;
  company?: string | null;
  status?: string;
  total_appointments?: number;
  last_appointment?: string | null;
}

async function fetchClient(clientId: string): Promise<ClientCardData> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, avatar_url')
    .eq('id', clientId)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.full_name ?? 'Sin nombre',
    email: data.email,
    phone: data.phone,
    avatar_url: data.avatar_url,
  };
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface ClientCardProps {
  clientId?: string;
  initialData?: ClientCardData;
  className?: string;
  readOnly?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  renderActions?: (id: string) => React.ReactNode;
  children?: React.ReactNode;
}

export function ClientCard({
  clientId,
  initialData,
  className,
  readOnly = false,
  isSelected = false,
  onSelect,
  renderActions,
  children,
}: Readonly<ClientCardProps>) {
  const resolvedId = clientId ?? initialData?.id;

  const { data: client } = useQuery({
    queryKey: ['client-card', resolvedId],
    queryFn: () => fetchClient(resolvedId!),
    initialData,
    enabled: !!resolvedId && !initialData,
    ...QUERY_CONFIG.STABLE,
  });

  if (!client) {
    return (
      <div className={cn('rounded-xl border bg-card p-6 animate-pulse', className)}>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role={readOnly ? undefined : 'button'}
      tabIndex={readOnly ? undefined : 0}
      onClick={() => !readOnly && onSelect?.(client.id)}
      onKeyDown={(e) => {
        if (!readOnly && (e.key === 'Enter' || e.key === ' ')) onSelect?.(client.id);
      }}
      className={cn(
        'relative group rounded-xl border bg-card p-4 transition-all duration-200',
        !readOnly && 'cursor-pointer hover:shadow-md',
        isSelected ? 'border-primary bg-primary/10' : 'border-border',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={client.avatar_url ?? undefined} alt={client.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>

          {/* Core info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base line-clamp-1">{client.name}</h4>
            <div className="space-y-1 mt-1">
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {renderActions?.(client.id)}
      </div>

      {children}
    </div>
  );
}

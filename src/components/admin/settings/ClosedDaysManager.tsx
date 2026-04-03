/**
 * ClosedDaysManager
 *
 * Permite al administrador marcar días específicos del calendario como cerrados,
 * ya sea para todo el negocio o para una sede concreta.
 *
 * - Selección de fecha con Calendar (sin fechas pasadas)
 * - Selector de alcance: "Todo el negocio" | sede específica
 * - Motivo opcional
 * - Tabla de días cerrados futuros con botón de eliminar
 */

import React, { useState } from 'react';
import * as Sentry from '@sentry/react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarX, Trash, Plus } from '@phosphor-icons/react';
import { format, isPast, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessClosedDays } from '@/hooks/useBusinessClosedDays';
import type { BusinessClosedDay } from '@/types/types';

interface ClosedDaysManagerProps {
  businessId: string;
}

interface LocationOption {
  id: string;
  name: string;
}

export function ClosedDaysManager({ businessId }: ClosedDaysManagerProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [scopeLocationId, setScopeLocationId] = useState<string>('__all__');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Referencia de mes para el hook (usa el mes del día seleccionado o el actual)
  const hookBaseDate = selectedDate || new Date();

  // Cargamos una ventana amplia: mes actual + 3 meses adelante para listar días cerrados
  const { closedDays, loading, addClosedDay, removeClosedDay } = useBusinessClosedDays(
    businessId,
    null,
    hookBaseDate,
  );

  // Listar las sedes del negocio
  const { data: locations = [] } = useQuery<LocationOption[]>({
    queryKey: ['locations-names', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name');
      if (error) {
        Sentry.captureException(error);
        throw new Error(error.message);
      }
      return (data ?? []) as LocationOption[];
    },
    enabled: !!businessId,
    ...QUERY_CONFIG.STABLE,
  });

  // Días cerrados futuros (o hoy) para mostrar en la tabla
  const futureClosed: BusinessClosedDay[] = closedDays
    .filter((d) => !isPast(startOfDay(new Date(d.closed_date + 'T00:00:00'))))
    .sort((a, b) => a.closed_date.localeCompare(b.closed_date));

  // Días ya cerrados (para deshabilitar en el calendario)
  const closedDateSet = new Set(
    closedDays.map((d) =>
      `${scopeLocationId === '__all__' ? 'all' : scopeLocationId}::${d.closed_date}`,
    ),
  );

  const isAlreadyClosed = (date: Date) => {
    const ds = format(date, 'yyyy-MM-dd');
    return closedDays.some(
      (d) =>
        d.closed_date === ds &&
        (d.location_id === null || d.location_id === (scopeLocationId === '__all__' ? null : scopeLocationId)),
    );
  };

  const handleAddClosed = async () => {
    if (!selectedDate) return;
    const ds = format(selectedDate, 'yyyy-MM-dd');
    setIsSaving(true);
    try {
      await addClosedDay({
        closedDate: ds,
        locationId: scopeLocationId === '__all__' ? null : scopeLocationId,
        reason: reason.trim() || undefined,
        createdBy: user?.id,
      });
      setSelectedDate(undefined);
      setReason('');
    } catch (err) {
      Sentry.captureException(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return 'Todo el negocio';
    return locations.find((l) => l.id === locationId)?.name ?? 'Sede';
  };

  const today = startOfDay(new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarX className="h-5 w-5" />
          Días cerrados programados
        </CardTitle>
        <CardDescription>
          Marca días específicos del calendario en que el negocio o una sede no atiende clientes.
          Las citas de esos días quedarán bloqueadas automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulario de agregar */}
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            {/* Alcance */}
            <div className="space-y-1.5">
              <Label>Alcance del cierre</Label>
              <Select value={scopeLocationId} onValueChange={setScopeLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar alcance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todo el negocio</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Motivo */}
            <div className="space-y-1.5">
              <Label htmlFor="closed-reason">Motivo (opcional)</Label>
              <Input
                id="closed-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Mantenimiento, evento privado..."
                maxLength={120}
              />
            </div>

            {/* Fecha seleccionada + botón */}
            <div className="flex items-center gap-3 flex-wrap">
              {selectedDate ? (
                <Badge variant="secondary" className="text-sm">
                  {format(selectedDate, "d 'de' MMMM yyyy", { locale: es })}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">Selecciona una fecha en el calendario</span>
              )}
              <Button
                size="sm"
                disabled={!selectedDate || isSaving}
                onClick={handleAddClosed}
                className="flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Agregar día cerrado
              </Button>
            </div>
          </div>

          {/* Calendario */}
          <div>
            <Calendar
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) =>
                date < today || isAlreadyClosed(date)
              }
              className="rounded-md border"
            />
          </div>
        </div>

        {/* Listado de días cerrados futuros */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando días cerrados...</p>
        ) : futureClosed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay días cerrados programados.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">Próximos días cerrados</p>
            <div className="divide-y rounded-md border">
              {futureClosed.map((day) => (
                <div key={day.id} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-3">
                    <CalendarX className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(day.closed_date + 'T00:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getLocationName(day.location_id)}
                        {day.reason ? ` · ${day.reason}` : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeClosedDay(day.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

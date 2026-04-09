import React, { useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Service, Appointment } from '@/types/types';
import { format, addMinutes, parse, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useEmployeeTransferAvailability } from '@/hooks/useEmployeeTransferAvailability';
import { usePublicHolidays } from '@/hooks/usePublicHolidays';
import { useBusinessClosedDays } from '@/hooks/useBusinessClosedDays';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWizardDateTimeData } from '@/hooks/useWizardDateTimeData';
import { supabase } from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';
// Fase 2 COMPLETADA: DateTimeSelection refactorizada (9 queries → 1 RPC via useWizardDateTimeData)

interface DateTimeSelectionProps {
  readonly service: Service | null;
  readonly selectedDate: Date | null;
  readonly selectedTime: string | null;
  readonly onSelectDate: (date: Date) => void;
  readonly onSelectTime: (startTime: string, endTime: string) => void;
  readonly employeeId: string | null;
  readonly resourceId?: string | null; // NUEVO: Soporte para recursos físicos
  readonly locationId: string | null;
  readonly businessId: string | null;
  readonly appointmentToEdit?: Appointment | null;
  readonly clientId?: string | null; // NUEVO: Para validar conflictos del cliente
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  isPopular: boolean;
  unavailableReason?: string;
}

interface LocationSchedule {
  opens_at: string | null;
  closes_at: string | null;
}

interface EmployeeSchedule {
  lunch_break_start: string | null;
  lunch_break_end: string | null;
  has_lunch_break: boolean;
}

interface ExistingAppointment {
  id: string;
  start_time: string;
  end_time: string;
}

/**
 * Helper para convertir hora a formato 12h
 */
function formatHourTo12h(hour: number): string {
  if (hour > 12) {
    return `${String(hour - 12).padStart(2, '0')}:00 PM`;
  }
  if (hour === 12) {
    return '12:00 PM';
  }
  return `${String(hour).padStart(2, '0')}:00 AM`;
}

/**
 * Helper para validar si el inicio del slot cae dentro del horario de almuerzo
 */
function isLunchBreakTime(
  slotStart: Date,
  hasLunchBreak: boolean,
  lunchStart: string | null,
  lunchEnd: string | null
): boolean {
  if (!hasLunchBreak || !lunchStart || !lunchEnd) return false;

  const [lsH, lsM] = lunchStart.split(':').map((v) => parseInt(v, 10));
  const [leH, leM] = lunchEnd.split(':').map((v) => parseInt(v, 10));
  const lunchStartTime = new Date(slotStart);
  lunchStartTime.setHours(lsH, lsM, 0, 0);
  const lunchEndTime = new Date(slotStart);
  lunchEndTime.setHours(leH, leM, 0, 0);
  return slotStart >= lunchStartTime && slotStart < lunchEndTime;
}

/**
 * Helper para validar si slot se superpone con citas existentes
 */
function isSlotOccupied(
  slotStartTime: Date,
  slotEndTime: Date,
  existingAppointments: ExistingAppointment[]
): boolean {
  return existingAppointments.some((apt) => {
    const aptStart = new Date(apt.start_time);
    const aptEnd = new Date(apt.end_time);
    return slotStartTime < aptEnd && slotEndTime > aptStart;
  });
}

export function DateTimeSelection({
  service,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  employeeId,
  resourceId,
  locationId,
  businessId,
  appointmentToEdit,
  clientId,
}: DateTimeSelectionProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;
  const { isHoliday, getHolidayName, holidays } = usePublicHolidays('CO');

  // Política de festivos: negocio + override de sede (NULL en location = heredar del negocio)
  const { data: holidayPolicy } = useQuery({
    queryKey: QUERY_CONFIG.KEYS.HOLIDAY_POLICY(businessId ?? '', locationId),
    queryFn: async () => {
      if (!businessId) return { work_on_holidays: false };
      const { data: biz } = await supabase
        .from('businesses')
        .select('work_on_holidays')
        .eq('id', businessId)
        .single();
      let locationOverride: boolean | null = null;
      if (locationId) {
        const { data: loc } = await supabase
          .from('locations')
          .select('work_on_holidays')
          .eq('id', locationId)
          .single();
        if (loc) locationOverride = (loc as any).work_on_holidays ?? null;
      }
      const effective = locationOverride ?? biz?.work_on_holidays ?? false;
      return { work_on_holidays: effective };
    },
    enabled: !!businessId,
    ...QUERY_CONFIG.STABLE,
  });

  // Días cerrados programados por el negocio/sede
  const { isClosedDay, getClosedDayReason } = useBusinessClosedDays(
    businessId,
    locationId,
    selectedDate || new Date(),
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [monthAppointmentsMap, setMonthAppointmentsMap] = useState<Record<string, ExistingAppointment[]>>({});
  const [disabledDates, setDisabledDates] = useState<Set<string>>(new Set());
  const [disabledReasons, setDisabledReasons] = useState<Record<string, string>>({});
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const { validateAvailability } = useEmployeeTransferAvailability();
  const serviceDuration = service?.duration || 60;

  // Obtener todos los datos de DateTimeSelection con un solo hook (RPC consolidada)
  const wizardDateTimeData = useWizardDateTimeData(
    employeeId,
    resourceId,
    businessId,
    locationId,
    selectedDate,
    clientId,
  );

  // Extraer datos del hook para acceso más limpio
  const locationSchedule = wizardDateTimeData.day.locationSchedule;
  const employeeSchedule = wizardDateTimeData.day.employeeSchedule;
  const workSchedules = wizardDateTimeData.day.workSchedules;
  const dayAppointments = wizardDateTimeData.day.dayAppointments;
  const clientDayAppointments = wizardDateTimeData.day.clientDayAppointments;
  const monthAppointments = wizardDateTimeData.month.monthAppointments;
  const monthAbsences = wizardDateTimeData.month.monthAbsences;

  // Calcular días laborables a partir de workSchedules
  const employeeWorkingDays = React.useMemo(() => {
    if (employeeId && (!workSchedules || workSchedules.length === 0)) {
      // Regla de negocio: sin horario configurado no hay disponibilidad.
      return new Set<number>();
    }
    const days = new Set<number>();
    workSchedules.forEach((row) => {
      if (row.is_working) days.add(row.day_of_week);
    });
    return days;
  }, [workSchedules, employeeId]);

  // Sincronizar datos del hook cuando sea necesario
  useEffect(() => {
    setIsLoadingSchedule(wizardDateTimeData.isLoading);
  }, [wizardDateTimeData.isLoading]);

  const generateTimeSlots = React.useCallback(async () => {
    if (!selectedDate || !service || !locationSchedule) return;

    const slots: TimeSlot[] = [];
    const popularTimes = new Set(['10:00 AM', '03:00 PM']);
    const [openH, openM] = locationSchedule.opens_at
      ? locationSchedule.opens_at.split(':').map((v) => parseInt(v, 10))
      : [9, 0];
    const [closeH, closeM] = locationSchedule.closes_at
      ? locationSchedule.closes_at.split(':').map((v) => parseInt(v, 10))
      : [17, 0];
    const openingTime = new Date(selectedDate);
    openingTime.setHours(openH, openM, 0, 0);
    const closingTime = new Date(selectedDate);
    closingTime.setHours(closeH, closeM, 0, 0);

    // Validar disponibilidad por traslado
    const transferValidation = await validateAvailability(employeeId || resourceId || '', businessId || '', selectedDate, locationId || '');

    // Regla: si el día no es laborable para el empleado, no hay slots
    const dayOfWeek = selectedDate.getDay(); // 0=Dom, 6=Sáb
    if (employeeId && employeeWorkingDays && !employeeWorkingDays.has(dayOfWeek)) {
      setTimeSlots([]);
      return;
    }

    // Validar ausencias: buscar en monthAbsences
    let absenceData: any = undefined;
    const checkDate = format(selectedDate, 'yyyy-MM-dd');
    if (monthAbsences && monthAbsences.length > 0) {
      absenceData = monthAbsences.find((abs) => {
        const startDate = abs.start_date.substring(0, 10);
        const endDate = abs.end_date.substring(0, 10);
        return checkDate >= startDate && checkDate <= endDate && abs.status === 'approved';
      });
    }

    // Regla: 90 minutos de anticipación si es el mismo día
    const now = new Date();
    const earliestAllowed = addMinutes(now, 90);

    let current = new Date(openingTime);
    while (current < closingTime) {
      const time12h = format(current, 'hh:mm a');

      let isAvailable = true;
      let unavailableReason = '';

      // Regla 1: Validar ausencias aprobadas
      if (absenceData) {
        isAvailable = false;
        const typeLabels: Record<string, string> = {
          vacation: 'Vacaciones',
          emergency: 'Emergencia',
          sick_leave: 'Incapacidad',
          personal: 'Asunto personal',
          other: 'Ausencia',
        };
        unavailableReason = typeLabels[absenceData.absence_type] || 'Ausente';
      }

      // Regla 2: Validar traslado
      if (isAvailable && !transferValidation.isAvailable) {
        isAvailable = false;
        unavailableReason = transferValidation.reason || 'Empleado en período de traslado';
      }

      // Regla 3: Validar horario de almuerzo
      if (
        isAvailable &&
        isLunchBreakTime(
          current,
          employeeSchedule?.has_lunch_break || false,
          employeeSchedule?.lunch_break_start || null,
          employeeSchedule?.lunch_break_end || null
        )
      ) {
        isAvailable = false;
        unavailableReason = 'Hora de almuerzo';
      }

      // Regla 4: 90 minutos de anticipación si es hoy
      if (isAvailable && selectedDate && isSameDay(selectedDate, now) && current < earliestAllowed) {
        isAvailable = false;
        unavailableReason = 'Selecciona con al menos 90 minutos de anticipación';
      }

      // Regla 5: Validar citas existentes del empleado/recurso Y cliente
      if (isAvailable && service) {
        const slotStartTime = new Date(current);
        const slotEndTime = addMinutes(slotStartTime, serviceDuration);

        if (slotEndTime > closingTime) {
          isAvailable = false;
          unavailableReason = 'Fuera del horario de la sede';
        } else {
          // Filtrar citas del empleado/recurso (excluyendo la que se está editando)
          const filteredDayAppointments = appointmentToEdit
            ? dayAppointments.filter((apt: any) => apt.id !== appointmentToEdit.id)
            : dayAppointments;

          if (isSlotOccupied(slotStartTime, slotEndTime, filteredDayAppointments)) {
            isAvailable = false;
            unavailableReason = resourceId ? 'Recurso Ocupado' : 'Ocupado';
          } else {
            // Filtrar citas del cliente (excluyendo la que se está editando)
            const filteredClientAppointments = appointmentToEdit
              ? clientDayAppointments.filter((apt: any) => apt.id !== appointmentToEdit.id)
              : clientDayAppointments;

            if (isSlotOccupied(slotStartTime, slotEndTime, filteredClientAppointments)) {
              isAvailable = false;
              unavailableReason = 'Ya tienes una cita en este horario';
            }
          }
        }
      }

      slots.push({
        id: `slot-${format(current, 'HH:mm')}`,
        time: time12h,
        available: isAvailable,
        isPopular: popularTimes.has(time12h),
        unavailableReason,
      });
      current = addMinutes(current, 30);
    }

    setTimeSlots(slots);
  }, [selectedDate, service, serviceDuration, locationSchedule, employeeSchedule, dayAppointments, clientDayAppointments, monthAbsences, employeeId, resourceId, locationId, businessId, validateAvailability, employeeWorkingDays, appointmentToEdit]);

  useEffect(() => {
    if (selectedDate && !isLoadingSchedule) {
      generateTimeSlots();
    }
  }, [selectedDate, generateTimeSlots, isLoadingSchedule]);

  // Calcular y cachear días deshabilitados del mes (ausencias o sin disponibilidad)
  useEffect(() => {
    const baseDate = selectedDate || new Date();
    if (!employeeId || !locationId || !businessId || !locationSchedule) return;

    const computeMonthDisabled = async () => {
      const start = startOfMonth(baseDate);
      const end = endOfMonth(baseDate);

      const map: Record<string, ExistingAppointment[]> = {};
      (monthAppointments || [])
        .filter((apt) => (employeeId ? apt.employee_id === employeeId : resourceId ? apt.resource_id === resourceId : false))
        .forEach((apt) => {
          const d = format(new Date(apt.start_time), 'yyyy-MM-dd');
          if (!map[d]) map[d] = [];
          map[d].push({ id: apt.id, start_time: apt.start_time, end_time: apt.end_time });
        });
      setMonthAppointmentsMap(map);

      const absenceDays = new Set<string>();
      const absenceReasons: Record<string, string> = {};
      (monthAbsences || []).forEach((abs) => {
        const s = new Date(abs.start_date);
        const e = new Date(abs.end_date);
        const current = new Date(s);
        const labelMap: Record<string, string> = {
          vacation: 'Vacaciones',
          emergency: 'Emergencia',
          sick_leave: 'Incapacidad',
          personal: 'Asunto personal',
          other: 'Ausencia',
        };
        while (current <= e) {
          const ds = format(current, 'yyyy-MM-dd');
          absenceDays.add(ds);
          absenceReasons[ds] = labelMap[abs.absence_type] || 'Ausente';
          current.setDate(current.getDate() + 1);
        }
      });

      // 3) Evaluar slots disponibles por día
      const [openH, openM] = locationSchedule.opens_at
        ? locationSchedule.opens_at.split(':').map((v) => parseInt(v, 10))
        : [9, 0];
      const [closeH, closeM] = locationSchedule.closes_at
        ? locationSchedule.closes_at.split(':').map((v) => parseInt(v, 10))
        : [17, 0];

      const disabledSet = new Set<string>();
      const disabledTitle: Record<string, string> = {};

      const today = new Date();
      const earliestToday = addMinutes(today, 90);

      const dayCursor = new Date(start);
      while (dayCursor <= end) {
        const dateStr = format(dayCursor, 'yyyy-MM-dd');

        // Pasado
        if (dayCursor < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
          disabledSet.add(dateStr);
          disabledTitle[dateStr] = 'Fecha en el pasado';
          dayCursor.setDate(dayCursor.getDate() + 1);
          continue;
        }

        // Festivo público — respeta la política del negocio/sede
        if (isHoliday(dateStr)) {
          const workOnHolidays = holidayPolicy?.work_on_holidays ?? false;
          if (!workOnHolidays) {
            disabledSet.add(dateStr);
            disabledTitle[dateStr] = getHolidayName(dateStr) || 'Festivo público';
            dayCursor.setDate(dayCursor.getDate() + 1);
            continue;
          }
          // work_on_holidays = true → procesar normalmente
        }

        // Día cerrado programado
        if (isClosedDay(dateStr, locationId)) {
          disabledSet.add(dateStr);
          disabledTitle[dateStr] = getClosedDayReason(dateStr, locationId) || 'Día cerrado';
          dayCursor.setDate(dayCursor.getDate() + 1);
          continue;
        }

        // Regla: Día no laborable (semana del empleado)
        const dow = dayCursor.getDay();
        if (employeeWorkingDays && !employeeWorkingDays.has(dow)) {
          disabledSet.add(dateStr);
          disabledTitle[dateStr] = 'Día no laborable del empleado';
          dayCursor.setDate(dayCursor.getDate() + 1);
          continue;
        }

        // Ausencia
        if (absenceDays.has(dateStr)) {
          disabledSet.add(dateStr);
          disabledTitle[dateStr] = absenceReasons[dateStr] || 'Ausente';
          dayCursor.setDate(dayCursor.getDate() + 1);
          continue;
        }

        // Traslado
        const transfer = await validateAvailability(employeeId, businessId, new Date(dayCursor), locationId);
        if (!transfer.isAvailable) {
          disabledSet.add(dateStr);
          disabledTitle[dateStr] = transfer.reason || 'No disponible por traslado';
          dayCursor.setDate(dayCursor.getDate() + 1);
          continue;
        }

        // Slots
        const openingTime = new Date(dayCursor);
        openingTime.setHours(openH, openM, 0, 0);
        const closingTime = new Date(dayCursor);
        closingTime.setHours(closeH, closeM, 0, 0);

        let anyAvailable = false;
        let cursor = new Date(openingTime);
        const dayAppointments = map[dateStr] || [];
        while (cursor < closingTime) {
          const inLunch = isLunchBreakTime(
            cursor,
            employeeSchedule?.has_lunch_break || false,
            employeeSchedule?.lunch_break_start || null,
            employeeSchedule?.lunch_break_end || null
          );
          if (inLunch) {
            cursor = addMinutes(cursor, 30);
            continue;
          }

          if (isSameDay(cursor, today) && cursor < earliestToday) {
            cursor = addMinutes(cursor, 30);
            continue;
          }

          const slotEnd = addMinutes(cursor, serviceDuration);
          if (slotEnd > closingTime) break;

          const occupied = isSlotOccupied(cursor, slotEnd, dayAppointments);
          if (!occupied) {
            anyAvailable = true;
            break;
          }

          cursor = addMinutes(cursor, 30);
        }

        if (!anyAvailable) {
          disabledSet.add(dateStr);
          disabledTitle[dateStr] = 'Sin disponibilidad';
        }

        dayCursor.setDate(dayCursor.getDate() + 1);
      }

      setDisabledDates(disabledSet);
      setDisabledReasons(disabledTitle);
    };

    computeMonthDisabled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, locationId, businessId, selectedDate, locationSchedule, employeeSchedule, serviceDuration, holidays, isHoliday, getHolidayName, employeeWorkingDays, validateAvailability, resourceId, monthAppointments, monthAbsences, holidayPolicy, isClosedDay, getClosedDayReason]);

  const handleTimeSelect = React.useCallback((slot: TimeSlot) => {
    if (!slot.available) return;

    const startTimeParsed = parse(slot.time, 'hh:mm a', new Date());
    const endTime = addMinutes(startTimeParsed, serviceDuration);
    const endTimeFormatted = format(endTime, 'hh:mm a');

    onSelectTime(slot.time, endTimeFormatted);
  }, [onSelectTime, serviceDuration]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h3 className="text-xl font-semibold text-foreground mb-6">{t('appointments.wizard.selectDateTime')}</h3>

      {/* Aviso si la fecha/hora preseleccionada no está disponible */}
      {selectedDate && selectedTime && (
        (() => {
          const matched = timeSlots.find((s) => s.time === selectedTime);
          const invalid = !matched || (matched && !matched.available);
          if (!invalid) return null;
          return (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <Badge variant="destructive">No disponible</Badge>
              <p className="text-sm text-red-800 dark:text-red-200">
                La fecha y hora preseleccionadas no están disponibles. Por favor selecciona una nueva fecha y hora.
              </p>
            </div>
          );
        })()
      )}

      {service && (
        <div className="mb-6 p-3 bg-card rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">{t('appointments.wizard.selectedService')}</p>
          <p className="text-foreground font-semibold">
            {service.name}{' '}
            {(() => {
              const d = service?.duration ?? service?.duration_minutes;
              return typeof d === 'number' && d > 0 ? (
                <span className="text-muted-foreground font-normal">({d} min)</span>
              ) : null;
            })()}
          </p>
        </div>
      )}

      {selectedDate && selectedDate.toDateString() === new Date().toDateString() && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ Para citas el mismo día, solo están disponibles horarios con al menos 90 minutos de anticipación.
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendario */}
        <div className="bg-card rounded-xl border border-border shadow-sm w-full lg:w-auto lg:shrink-0">
          <Calendar
            selected={selectedDate || undefined}
            onSelect={(date) => date && onSelectDate(date)}
            disabled={(date) => {
              const key = format(date, 'yyyy-MM-dd');
              const t = new Date();
              const tm = new Date(t.getFullYear(), t.getMonth(), t.getDate());
              const nonWorking = employeeWorkingDays ? !employeeWorkingDays.has(date.getDay()) : false;
              return date < tm || nonWorking || disabledDates.has(key);
            }}
            title={(date) => {
              const key = format(date, 'yyyy-MM-dd');
              return disabledReasons[key] || '';
            }}
            className="w-full"
          />
        </div>

        {/* Time Slots */}
        <div className="flex-1 space-y-4 min-w-0">
          {selectedDate ? (
            <>
              <h3 className="text-lg font-semibold text-foreground">{t('appointments.wizard.availableOn')} {format(selectedDate, 'd MMMM yyyy', { locale: dateLocale })}</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {timeSlots.map((slot) => {
                  const buttonContent = (
                    <Button
                      key={slot.id}
                      disabled={!slot.available}
                      onClick={() => handleTimeSelect(slot)}
                      variant={selectedTime === slot.time ? 'default' : 'outline'}
                      className={cn(
                        'relative w-full h-12 text-base font-medium transition-all',
                        selectedTime === slot.time && 'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
                        selectedTime !== slot.time && slot.available && 'bg-card border-border text-foreground hover:border-primary',
                        !slot.available && 'opacity-40 cursor-not-allowed bg-muted'
                      )}
                    >
                      {slot.time}

                      {/* Badge de popularidad removido */}
                    </Button>
                  );

                  if (!slot.available && slot.unavailableReason) {
                    return (
                      <TooltipProvider key={slot.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                          <TooltipContent>
                            <p>{slot.unavailableReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }

                  return buttonContent;
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <p className="text-[#94a3b8] text-center">{t('appointments.wizard.selectDatePrompt')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

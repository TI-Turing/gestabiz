/* eslint-disable no-console */
import React, { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import * as Sentry from '@sentry/react'
import { Calendar, Clock, ChevronLeft, ChevronRight, User, X, Check, AlertCircle, Eye, EyeOff, DollarSign, Mail, Maximize2, Minimize2 } from 'lucide-react';
import { Money } from '@phosphor-icons/react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, addDays, subDays, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePreferredLocation } from '@/hooks/usePreferredLocation';
import { useTaxCalculation } from '@/hooks/useTaxCalculation';
import type { TaxType } from '@/types/accounting.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const DEFAULT_TIME_ZONE = 'America/Bogota';
const COLOMBIA_UTC_OFFSET = -5; // GMT-5
const DEBUG_MODE = import.meta.env.DEV; // Solo logs en desarrollo

const extractTimeZoneParts = (date: Date, timeZone: string = DEFAULT_TIME_ZONE) => {
  // Método 1: Intentar con toLocaleString
  try {
    const dateString = date.toLocaleString('en-US', { 
      timeZone, 
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Parse the formatted string: "MM/DD/YYYY, HH:MM:SS"
    const [datePart, timePart] = dateString.split(', ');
    const [month, day, year] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    const result = {
      year,
      month,
      day,
      hour,
      minute,
    } as const;
    
    return result;
  } catch (error) {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'AppointmentsCalendar' } })
  }
  
  // Método 2: Fallback con offset manual (más confiable)
  const utcTime = date.getTime();
  const colombiaTime = new Date(utcTime + (COLOMBIA_UTC_OFFSET * 60 * 60 * 1000));
  
  const result = {
    year: colombiaTime.getUTCFullYear(),
    month: colombiaTime.getUTCMonth() + 1,
    day: colombiaTime.getUTCDate(),
    hour: colombiaTime.getUTCHours(),
    minute: colombiaTime.getUTCMinutes(),
  } as const;
  
  return result;
};

const isSameDayInTimeZone = (dateA: Date, dateB: Date, timeZone: string = DEFAULT_TIME_ZONE) => {
  const partsA = extractTimeZoneParts(dateA, timeZone);
  const partsB = extractTimeZoneParts(dateB, timeZone);

  return partsA.year === partsB.year && partsA.month === partsB.month && partsA.day === partsB.day;
};

// Helper para formatear hora en zona horaria de Colombia
const formatTimeInColombia = (isoString: string): string => {
  const date = new Date(isoString);
  const { hour, minute } = extractTimeZoneParts(date, DEFAULT_TIME_ZONE);
  
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
};

// Small portal dropdown that positions itself next to an anchor button
function DropdownPortal({ anchorRef, isOpen, onClose, children }: { anchorRef: React.RefObject<HTMLElement | null>, isOpen: boolean, onClose: () => void, children: React.ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  const update = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return setPos(null);
    const rect = anchor.getBoundingClientRect();
    setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX, width: rect.width });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, update]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !pos) return null;

  // Flip horizontally/vertically if the menu would overflow the viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const estimatedWidth = Math.max(pos.width, 200);
  const estimatedHeight = 240; // approx max-h-64

  let left = pos.left;
  // Horizontal flip
  if (left + estimatedWidth + 12 > viewportWidth) {
    left = Math.max(8, viewportWidth - estimatedWidth - 12);
  }

  // Vertical flip: if bottom overflows, show above anchor
  let top = pos.top;
  if (top + estimatedHeight > window.scrollY + viewportHeight) {
    // place above anchor
    const anchor = anchorRef.current;
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      top = rect.top + window.scrollY - estimatedHeight - 6;
    }
  }

  const menu = (
    <div ref={portalRef} className="dropdown-portal" style={{ position: 'absolute', top, left, minWidth: estimatedWidth, zIndex: 9999 }}>
      {children}
    </div>
  );

  return createPortal(menu, document.body);
}

interface Employee {
  id: string;
  user_id: string;
  profile_name: string;
  profile_avatar?: string;
  lunch_break_start?: string | null;
  lunch_break_end?: string | null;
  has_lunch_break?: boolean;
  services?: string[]; // Servicios del empleado
}

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  confirmed?: boolean;
  service_id: string; // ✅ Agregado para handleCompleteAppointment
  service_name: string;
  service_price: number;
  service_tax_type?: TaxType;
  client_name: string;
  employee_id: string;
  employee_name: string;
  location_id?: string;
  notes?: string;
  payment_status?: string;
  gross_amount?: number;
  commission_amount?: number;
  net_amount?: number;
  other_deductions?: number;
}

interface LocationWithHours {
  id: string;
  name: string;
  opens_at: string | null;
  closes_at: string | null;
}

interface AppointmentModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  onComplete: (appointmentId: string, tip: number) => void;
  onCancel: (appointmentId: string) => void;
  onNoShow: (appointmentId: string) => void;
  onConfirm: (appointmentId: string) => void;
  onResendConfirmation: (appointmentId: string) => void;
}

const AppointmentModal = React.memo<AppointmentModalProps>(({ 
  appointment, 
  onClose, 
  onComplete, 
  onCancel,
  onNoShow,
  onConfirm,
  onResendConfirmation
}) => {
  const [tip, setTip] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!appointment) return null;

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      await onComplete(appointment.id, tip);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await onCancel(appointment.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNoShow = async () => {
    setIsProcessing(true);
    try {
      await onNoShow(appointment.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(appointment.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsProcessing(true);
    try {
      await onResendConfirmation(appointment.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled';
  const isPendingConfirmation = appointment.status === 'pending';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl max-w-lg w-full my-auto max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Detalles de la Cita</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Cliente:</span>
              <span className="text-sm text-muted-foreground">{appointment.client_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Servicio:</span>
              <span className="text-sm text-muted-foreground">{appointment.service_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Horario:</span>
              <span className="text-sm text-muted-foreground">
                {formatTimeInColombia(appointment.start_time)} - {formatTimeInColombia(appointment.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Precio:</span>
              <span className="text-sm text-muted-foreground">
                ${appointment.service_price.toLocaleString('es-CO')} COP
              </span>
            </div>

            {/* Desglose de montos si la cita está pagada */}
            {appointment.payment_status === 'paid' && appointment.gross_amount && (
              <div className="mt-3 p-3 bg-muted/50 rounded-md border border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Money size={16} weight="fill" /> Desglose de Pago
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Monto Bruto:</span>
                    <span className="text-xs font-medium text-foreground">
                      ${appointment.gross_amount.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  {appointment.commission_amount! > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-red-600 dark:text-red-400">- Comisión Empleado:</span>
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">
                        -${appointment.commission_amount!.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  )}
                  {appointment.other_deductions! > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-red-600 dark:text-red-400">- Otras Deducciones:</span>
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">
                        -${appointment.other_deductions!.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  )}
                  <div className="pt-1.5 border-t border-border flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">= Ingreso Neto:</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      ${appointment.net_amount!.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Empleado:</span>
              <span className="text-sm text-muted-foreground">{appointment.employee_name}</span>
            </div>
            {appointment.notes && (
              <div className="mt-2 p-2 bg-muted rounded-md">
                <span className="text-sm font-medium text-foreground">Notas:</span>
                <p className="text-sm text-muted-foreground mt-1">{appointment.notes}</p>
              </div>
            )}
          </div>

          {!isCompleted && !isCancelled && (
            <div className="space-y-2 p-4 rounded-lg border border-border/50 bg-muted/30">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Money size={16} weight="duotone" className="text-primary" />
                Propina (opcional)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  value={tip}
                  onChange={(e) => setTip(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {isCompleted && (
              <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                <Check className="h-3 w-3 mr-1.5" />
                Completada
              </Badge>
            )}

            {isCancelled && (
              <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                <X className="h-3 w-3 mr-1.5" />
                Cancelada
              </Badge>
            )}

            {isPendingConfirmation && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                <Clock className="h-3 w-3 mr-1.5" />
                Pendiente de confirmación
              </Badge>
            )}

            {isPendingConfirmation && appointment.confirmed && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                <Check className="h-3 w-3 mr-1.5" />
                Cliente confirmó
              </Badge>
            )}
          </div>
        </div>

        {!isCompleted && !isCancelled && (
          <div className="p-6 border-t border-border/50 space-y-3 bg-muted/20">
            {isPendingConfirmation && (
              <div className="flex gap-2">
                <Button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="flex-1"
                  size="default"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Cita
                </Button>
                <Button
                  onClick={handleResendConfirmation}
                  disabled={isProcessing}
                  variant="outline"
                  size="default"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Reenviar Email
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleComplete}
                disabled={isProcessing}
                variant="outline"
                className="flex-1 border-green-500/20 bg-green-500/10 text-green-700 hover:bg-green-500/20 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
              >
                <Check className="h-4 w-4 mr-2" />
                Completar
              </Button>
              <Button
                onClick={handleNoShow}
                disabled={isProcessing}
                variant="outline"
                className="flex-1 border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                No Show
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isProcessing}
                variant="outline"
                className="border-red-500/20 bg-red-500/10 text-red-700 hover:bg-red-500/20 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export const AppointmentsCalendar: React.FC<{ businessId?: string }> = ({ businessId: propBusinessId }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(new Date());
  const [miniCalPos, setMiniCalPos] = useState({ top: 0, left: 0 });
  const miniCalBtnRef = useRef<HTMLButtonElement>(null);
  const miniCalRef = useRef<HTMLDivElement>(null);
  const isSelectedDateToday = useMemo(
    () => isSameDayInTimeZone(selectedDate, new Date()),
    [selectedDate]
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);
  const statusBtnRef = useRef<HTMLButtonElement>(null);
  const locationBtnRef = useRef<HTMLButtonElement>(null);
  const serviceBtnRef = useRef<HTMLButtonElement>(null);
  const employeeBtnRef = useRef<HTMLButtonElement>(null);
  const [showServices, setShowServices] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filter states - now as arrays for multi-select
  const [filterStatus, setFilterStatus] = useState<string[]>(['confirmed', 'pending']);
  const [filterLocation, setFilterLocation] = useState<string[]>([]);
  const [filterService, setFilterService] = useState<string[]>([]);
  const [filterEmployee, setFilterEmployee] = useState<string[]>([]);
  const [locations, setLocations] = useState<LocationWithHours[]>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  
  // Dropdown open/close states
  const [openDropdowns, setOpenDropdowns] = useState({
    status: false,
    location: false,
    service: false,
    employee: false
  });
  // Obtener la configuración de sede preferida
  const [currentBusinessId, setCurrentBusinessId] = useState<string | undefined>(undefined);
  const { preferredLocationId } = usePreferredLocation(currentBusinessId);
  const { calculateTaxes } = useTaxCalculation(currentBusinessId);

  const formatFiscalPeriod = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Colores pastel para las columnas de empleados
  const employeeColors = [
    'bg-blue-50/30 dark:bg-blue-950/10',
    'bg-purple-50/30 dark:bg-purple-950/10',
    'bg-pink-50/30 dark:bg-pink-950/10',
    'bg-green-50/30 dark:bg-green-950/10',
    'bg-yellow-50/30 dark:bg-yellow-950/10',
    'bg-indigo-50/30 dark:bg-indigo-950/10',
    'bg-red-50/30 dark:bg-red-950/10',
    'bg-teal-50/30 dark:bg-teal-950/10',
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // If click is inside any anchor button, do nothing
      if (statusBtnRef.current?.contains(target) || locationBtnRef.current?.contains(target) || serviceBtnRef.current?.contains(target) || employeeBtnRef.current?.contains(target)) {
        return;
      }

      // If click is inside any dropdown portal, do nothing (allow interactions)
      if (document.querySelector('.dropdown-portal')?.contains(target)) {
        return;
      }

      setOpenDropdowns({ status: false, location: false, service: false, employee: false });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Load cached filters when businessId becomes available
  useEffect(() => {
    if (!currentBusinessId) return;
    try {
      const raw = localStorage.getItem(`appointments-filters-${currentBusinessId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.status) setFilterStatus(parsed.status);
        if (parsed.location) setFilterLocation(parsed.location);
        if (parsed.service) setFilterService(parsed.service);
        if (parsed.employee) setFilterEmployee(parsed.employee);
      }
    } catch (e) {
      Sentry.captureException(e instanceof Error ? e : new Error(String(e)), { tags: { component: 'AppointmentsCalendar' } })
    }
  }, [currentBusinessId]);

  // Persist filters to localStorage when they change
  useEffect(() => {
    if (!currentBusinessId) return;
    const payload = { status: filterStatus, location: filterLocation, service: filterService, employee: filterEmployee };
    try {
      localStorage.setItem(`appointments-filters-${currentBusinessId}`, JSON.stringify(payload));
    } catch (e) {
      Sentry.captureException(e instanceof Error ? e : new Error(String(e)), { tags: { component: 'AppointmentsCalendar' } })
    }
  }, [currentBusinessId, filterStatus, filterLocation, filterService, filterEmployee]);

  // useRef para prevenir llamados duplicados simultáneos
  const isFetchingRef = useRef(false);

  const fetchAppointments = useCallback(async (businessId: string, date: Date) => {
    // Protección contra llamados duplicados
    if (isFetchingRef.current) {
      if (DEBUG_MODE) console.log('⚠️ [fetchAppointments] Ya hay un fetch en progreso, ignorando...');
      return;
    }

    isFetchingRef.current = true;

    try {
      // Usar zona horaria de Colombia para los límites del día
      const { year, month, day } = extractTimeZoneParts(date, DEFAULT_TIME_ZONE);
      
      // Crear fecha inicio del día en Colombia (00:00:00)
      const start = new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0)); // UTC+5 = Colombia 00:00
      
      // Crear fecha fin del día en Colombia (23:59:59)
      const end = new Date(Date.UTC(year, month - 1, day + 1, 4, 59, 59, 999)); // UTC+5 = Colombia 23:59:59

      if (DEBUG_MODE) {
        console.log('📅 [fetchAppointments] Buscando citas para:', {
          fecha: format(date, 'yyyy-MM-dd'),
          colombiaStart: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 00:00:00`,
          colombiaEnd: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 23:59:59`,
          utcStart: start.toISOString(),
          utcEnd: end.toISOString()
        });
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          confirmed,
          notes,
          service_id,
          employee_id,
          location_id,
          client_id,
          payment_status,
          gross_amount,
          commission_amount,
          net_amount,
          other_deductions,
          services (
            id,
            name,
            price,
            tax_type
          ),
          client:profiles!appointments_client_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('business_id', businessId)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time');

      if (error) {
        return;
      }

      if (DEBUG_MODE) {
        if (data && data.length > 0) {
        }
      }

      // Obtener IDs de empleados únicos
      const employeeIds = Array.from(new Set((data || []).map(apt => apt.employee_id as string).filter(Boolean)));

      // Si hay empleados, obtener sus nombres
      let employeeNames: Record<string, string> = {};
      if (employeeIds.length > 0) {
        const { data: employeeData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', employeeIds);

        employeeNames = (employeeData || []).reduce((acc, emp: Record<string, unknown>) => {
          const empId = emp.id as string;
          const fullName = (emp.full_name as string) || 'Sin asignar';
          acc[empId] = fullName;
          return acc;
        }, {} as Record<string, string>);
        
        if (DEBUG_MODE) console.log('👥 [fetchAppointments] Nombres de empleados cargados:', employeeNames);
      }

      const formattedAppointments: Appointment[] = (data || []).map((apt: Record<string, unknown>) => ({
        id: apt.id as string,
        start_time: apt.start_time as string,
        end_time: apt.end_time as string,
        status: apt.status as string,
        confirmed: (apt.confirmed as boolean) ?? false,
        service_id: (apt.services as Record<string, unknown>)?.id as string || '', // ✅ Extraído del objeto services
        service_name: (apt.services as Record<string, unknown>)?.name as string || 'Servicio sin nombre',
        service_price: (apt.services as Record<string, unknown>)?.price as number || 0,
        service_tax_type: ((apt.services as Record<string, unknown>)?.tax_type as TaxType) || 'none',
        client_name: (apt.client as Record<string, unknown>)?.full_name as string || 'Cliente sin nombre',
        employee_id: (apt.employee_id as string) || '',
        employee_name: employeeNames[(apt.employee_id as string)] || 'Sin asignar',
        location_id: (apt.location_id as string) || '',
        notes: apt.notes as string | undefined,
        payment_status: apt.payment_status as string | undefined,
        gross_amount: apt.gross_amount as number | undefined,
        commission_amount: apt.commission_amount as number | undefined,
        net_amount: apt.net_amount as number | undefined,
        other_deductions: apt.other_deductions as number | undefined
      }));

      if (DEBUG_MODE) {
        console.log('📊 [fetchAppointments] Resumen:', {
          total: formattedAppointments.length,
          employees: employeeIds,
          employeeNames: employeeNames,
          appointments: formattedAppointments.map(a => ({
            id: a.id,
            cliente: a.client_name,
            empleado: a.employee_name,
            employee_id: a.employee_id,
            hora: a.start_time,
            estado: a.status
          }))
        });
        
        // DEBUG: Mostrar employee_ids de las citas vs los cargados
        console.log('🔴 [DEBUG] Comparar employee_ids:', {
          appointmentEmployeeIds: formattedAppointments.map(a => a.employee_id),
          loadedEmployees: employees.map(e => ({ id: e.id, user_id: e.user_id }))
        });
      }

      setAppointments(formattedAppointments);
    } finally {
      isFetchingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ SIN dependencias: fetch solo carga datos de BD, no usa state

  // Fetch business and location data - DEBE ESTAR DESPUÉS DE fetchAppointments
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Usar businessId de la prop si está disponible (desde AdminDashboard)
        let resolvedBusinessId = propBusinessId;
        
        // Si no viene del prop, resolver el negocio actual de forma robusta
        if (!resolvedBusinessId) {
          // 1) Si el usuario tiene contexto de negocio activo, usarlo
          resolvedBusinessId = user.activeBusiness?.id;
          
          // 2) Si no hay contexto activo, intentar por owner (admin clásico)
          if (!resolvedBusinessId) {
            const { data: businesses, error: businessError } = await supabase
              .from('businesses')
              .select('id')
              .eq('owner_id', user.id);

            if (businessError) throw businessError;
            if (businesses && businesses.length > 0) {
              resolvedBusinessId = businesses[0].id;
            }
          }
        }
        
        console.log('🔍 [AppointmentsCalendar] Resolviendo business_id:', {
          'propBusinessId': propBusinessId,
          'user.activeBusiness?.id': user.activeBusiness?.id,
          'user.role': user.role,
          'resolvedBusinessId (final)': resolvedBusinessId
        });

        if (!resolvedBusinessId) {
          throw new Error('No se pudo determinar el negocio actual para este usuario');
        }

        setCurrentBusinessId(resolvedBusinessId);
        // Get all locations for filter with their hours
        const { data: locationsData, error: locationError } = await supabase
          .from('locations')
          .select('id, name, opens_at, closes_at')
          .eq('business_id', resolvedBusinessId);

        if (locationError) throw locationError;
        const formattedLocations: LocationWithHours[] = (locationsData || []).map(loc => ({
          id: loc.id,
          name: loc.name,
          opens_at: loc.opens_at as string | null,
          closes_at: loc.closes_at as string | null,
        }));

        setLocations(formattedLocations);

        // Get employees with lunch break info and their services
        const { data: employeesData, error: employeesError } = await supabase
          .from('business_employees')
          .select('id, employee_id, lunch_break_start, lunch_break_end, has_lunch_break')
          .eq('business_id', resolvedBusinessId)
          .eq('status', 'approved')
          .eq('is_active', true);

        if (employeesError) throw employeesError;

        // Get employee profiles separately
        const employeeIds = (employeesData || []).map(e => e.employee_id);
        const { data: profilesData } = employeeIds.length > 0
          ? await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', employeeIds)
          : { data: [] };

        // Map profiles by ID for easy lookup
        const profilesMap = (profilesData || []).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, { full_name: string; avatar_url: string | null }>);

        // Get employee services - FILTERED BY BUSINESS_ID only (NOT by location)
        // The dropdown of professionals must show ALL employees who offer services
        // in the business, regardless of the selected location filter.
        // Location filtering only affects which appointments/services are displayed.
        let employeeServicesQuery = supabase
          .from('employee_services')
          .select('employee_id, service_id, services(name, is_active)')
          .eq('business_id', resolvedBusinessId);

        if (employeeIds.length > 0) {
          employeeServicesQuery = employeeServicesQuery.in('employee_id', employeeIds);
        }

        let employeeServicesData: Array<{ employee_id: string; service_id?: string; services?: { name?: string; is_active?: boolean } | null }> = [];
        if (employeeIds.length > 0) {
          const response = await employeeServicesQuery;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          employeeServicesData = ((response.data || []) as any[]).map((item: any) => ({
            employee_id: item.employee_id,
            service_id: item.service_id,
            services: Array.isArray(item.services) ? item.services[0] : item.services,
          }));
          if (response.error) {
            if (DEBUG_MODE) {
            }
          }
        }

        // Map services by employee_id (now location-filtered)
        const servicesMap = employeeServicesData.reduce((acc, es) => {
          if (!acc[es.employee_id]) {
            acc[es.employee_id] = [];
          }
          if (es.services && typeof es.services === 'object' && 'name' in es.services && es.services.is_active !== false) {
            acc[es.employee_id].push(es.services.name as string);
          }
          return acc;
        }, {} as Record<string, string[]>);

        const formattedEmployees = (employeesData || []).map(emp => {
          const profile = profilesMap[emp.employee_id];
          return {
            id: emp.id,
            user_id: emp.employee_id,
            profile_name: profile?.full_name || 'Sin nombre',
            profile_avatar: profile?.avatar_url || undefined,
            lunch_break_start: emp.lunch_break_start,
            lunch_break_end: emp.lunch_break_end,
            has_lunch_break: emp.has_lunch_break,
            services: servicesMap[emp.employee_id] || []
          };
        });

        setEmployees(formattedEmployees);
        if (DEBUG_MODE) {
          const selectedLocationId = filterLocation.length > 0 ? filterLocation[0] : null;
          console.log('👨‍💼 [AppointmentsCalendar] Empleados cargados:', {
            total: formattedEmployees.length,
            ubicacion_filtrada: selectedLocationId || 'TODAS',
            empleados: formattedEmployees.map(e => ({ 
              id: e.id, 
              nombre: e.profile_name,
              servicios: e.services // All services in the business (not location-filtered)
            }))
          });
        }

        // Get services - FILTERED by both location AND employee if selected
        const selectedLocationId = filterLocation.length > 0 ? filterLocation[0] : null;
        let availableServices: Array<{ id: string; name: string }> = [];
        
        // Strategy: If both employee and location are selected, use employee_services
        // If only location is selected, use location_services
        // Otherwise, load all business services
        
        if (employeeIds.length > 0 && selectedLocationId) {
          // CASE 1: Employee + Location selected → Use employee_services filtered by both
          if (DEBUG_MODE) {
          }
          
          const { data: empServData, error: empServError } = await supabase
            .from('employee_services')
            .select('service_id, services(id, name)')
            .eq('business_id', resolvedBusinessId) // ✅ FIX: Filtrar por negocio actual
            .in('employee_id', employeeIds)
            .eq('location_id', selectedLocationId);

          if (empServError) {
            setServices([]);
            return;
          }

          // Extract unique services
          const serviceMap = new Map<string, string>();
          (empServData || []).forEach(es => {
            if (es.services && typeof es.services === 'object' && 'id' in es.services && 'name' in es.services) {
              serviceMap.set(es.services.id as string, es.services.name as string);
            }
          });

          availableServices = Array.from(serviceMap.entries()).map(([id, name]) => ({ id, name }));
          
        } else if (selectedLocationId) {
          // CASE 2: Only location selected → Use location_services
          if (DEBUG_MODE) {
          }
          
          const { data: locationServicesData, error: locServError } = await supabase
            .from('location_services')
            .select('service_id')
            .eq('location_id', selectedLocationId);

          if (locServError) {
            setServices([]);
            return;
          }

          const availableServiceIds = (locationServicesData || []).map(ls => ls.service_id);
          
          if (availableServiceIds.length > 0) {
            const { data: servicesData, error: servError } = await supabase
              .from('services')
              .select('id, name')
              .eq('business_id', resolvedBusinessId)
              .in('id', availableServiceIds);

            if (servError) {
              setServices([]);
              return;
            }

            availableServices = (servicesData || []).map(s => ({ id: s.id, name: s.name }));
          }
          
        } else {
          // CASE 3: No filters → Load all business services
          if (DEBUG_MODE) {
          }
          
          const { data: servicesData, error: servError } = await supabase
            .from('services')
            .select('id, name')
            .eq('business_id', resolvedBusinessId);

          if (servError) {
            setServices([]);
            return;
          }

          availableServices = (servicesData || []).map(s => ({ id: s.id, name: s.name }));
          
          if (DEBUG_MODE) {
          }
        }

        setServices(availableServices);

        // Nota: fetchAppointments se llamará desde el siguiente effect
        // cuando business.id esté disponible
      } catch (error) {
        Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'AppointmentsCalendar' } })
        toast.error('Error al cargar los datos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, propBusinessId, filterLocation, filterEmployee]); // ✅ Dependencias: user, business ID, filtro ubicación y filtro empleados

  // Fetch appointments cuando currentBusinessId o selectedDate cambian
  useEffect(() => {
    if (!currentBusinessId) return;
    
    fetchAppointments(currentBusinessId, selectedDate);
  }, [currentBusinessId, selectedDate, fetchAppointments]);

  // Persist filters to localStorage when they change
  useEffect(() => {
    if (!currentBusinessId) return;
    const payload = { status: filterStatus, location: filterLocation, service: filterService, employee: filterEmployee };
    try {
      localStorage.setItem(`appointments-filters-${currentBusinessId}`, JSON.stringify(payload));
    } catch (e) {
      Sentry.captureException(e instanceof Error ? e : new Error(String(e)), { tags: { component: 'AppointmentsCalendar' } })
    }
  }, [currentBusinessId, filterStatus, filterLocation, filterService, filterEmployee]);

  // Sincronizar filtros de sede con las sedes disponibles
  // Evita que IDs obsoletos en localStorage oculten todas las citas
  useEffect(() => {
    // Si no hay sedes cargadas, limpiar el filtro de sede para no filtrar todo
    if (!locations || locations.length === 0) {
      if (filterLocation.length > 0) {
        setFilterLocation([]);
      }
      return;
    }

    const availableIds = new Set(locations.map(l => l.id));
    const validSelected = filterLocation.filter(id => availableIds.has(id));
    if (validSelected.length !== filterLocation.length) {
      setFilterLocation(validSelected);
    }
  }, [locations]);

  const handleCompleteAppointment = async (appointmentId: string, tip: number) => {
    try {
      // Get appointment details first
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) return;

      // ✅ Validar que service_id existe antes de hacer la query
      if (!appointment.service_id) {
        throw new Error('La cita no tiene un servicio asociado');
      }

      // Get service details including commission
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('commission_percentage')
        .eq('id', appointment.service_id)
        .single();

      if (serviceError) throw serviceError;

      // Calculate amounts
      const grossAmount = appointment.service_price;
      const commissionPercentage = service?.commission_percentage || 0;
      const commissionAmount = Math.round(grossAmount * (commissionPercentage / 100));
      const otherDeductions = 0; // Por ahora, se puede expandir después
      const netAmount = grossAmount - commissionAmount - otherDeductions;

      // Update appointment with payment status and amounts
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          status: 'completed', 
          payment_status: 'paid',
          gross_amount: grossAmount,
          commission_amount: commissionAmount,
          net_amount: netAmount,
          other_deductions: otherDeductions
        })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      // Create transactions: income + commission expense + optional tip
      const nowIso = new Date().toISOString();
      const nowDate = new Date(nowIso);
      const fiscalPeriod = formatFiscalPeriod(nowDate);

      // Calcular impuestos según el tipo del servicio
      const taxType: TaxType = appointment.service_tax_type || 'none';
      const taxes = calculateTaxes(grossAmount, taxType);
      const taxAmount = taxes.total_tax;
      const taxRate = grossAmount > 0 ? taxAmount / grossAmount : 0;
      const totalAmount = taxes.total_amount;

      const baseTxn = {
        business_id: currentBusinessId!,
        appointment_id: appointment.id,
        location_id: appointment.location_id ?? null,
        currency: 'COP',
        payment_method: 'cash',
        transaction_date: nowIso,
      };

      const payload = [
        // 1. Ingreso bruto del servicio
        {
          ...baseTxn,
          employee_id: appointment.employee_id ?? null,
          type: 'income' as const,
          subtotal: grossAmount,
          tax_type: taxType,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          amount: totalAmount,
          fiscal_period: fiscalPeriod,
          category: 'appointment_payment',
          description: `Pago de cita - ${appointment.service_name} (Bruto: ${grossAmount.toLocaleString('es-CO')} COP)`,
        },
        // 2. Egreso por comisión del empleado (solo si hay comisión)
        ...(commissionAmount > 0 && appointment.employee_id
          ? [{
              ...baseTxn,
              employee_id: appointment.employee_id,
              type: 'expense' as const,
              subtotal: commissionAmount,
              tax_type: 'none' as const,
              tax_rate: 0,
              tax_amount: 0,
              total_amount: commissionAmount,
              amount: commissionAmount,
              fiscal_period: fiscalPeriod,
              category: 'commission',
              description: `Comisión ${commissionPercentage}% - ${appointment.service_name} (Empleado: ${appointment.employee_name || 'Sin nombre'})`,
            }]
          : []),
        // 3. Propina adicional (opcional)
        ...(tip && tip > 0
          ? [{
              ...baseTxn,
              employee_id: appointment.employee_id ?? null,
              type: 'income' as const,
              subtotal: tip,
              tax_type: 'none' as const,
              tax_rate: 0,
              tax_amount: 0,
              total_amount: tip,
              amount: tip,
              fiscal_period: fiscalPeriod,
              category: 'tip',
              description: `Propina - ${appointment.service_name}`,
            }]
          : []),
      ];

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(payload);

      if (transactionError) throw transactionError;

      const successMsg = commissionAmount > 0 
        ? `Cita completada. Ingreso bruto: ${grossAmount.toLocaleString('es-CO')} COP, Comisión: ${commissionAmount.toLocaleString('es-CO')} COP, Neto: ${netAmount.toLocaleString('es-CO')} COP`
        : 'Cita completada y pago registrado';
      
      toast.success(successMsg);
      
      // Refresh appointments
      if (currentBusinessId) {
        await fetchAppointments(currentBusinessId, selectedDate);
      }
    } catch (error) {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'AppointmentsCalendar' } })
      toast.error('Error al completar la cita');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('Cita cancelada');
      
      // Refresh appointments
      if (currentBusinessId) {
        await fetchAppointments(currentBusinessId, selectedDate);
      }
    } catch {
      toast.error('Error al cancelar la cita');
    }
  };

  const handleNoShow = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'no_show',
          notes: 'Cliente no se presentó'
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.warning('Cita marcada como sin asistencia');
      
      // Refresh appointments
      if (currentBusinessId) {
        await fetchAppointments(currentBusinessId, selectedDate);
      }
    } catch {
      toast.error('Error al marcar sin asistencia');
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('Cita confirmada manualmente');
      
      // Refresh appointments
      if (currentBusinessId) {
        await fetchAppointments(currentBusinessId, selectedDate);
      }
    } catch {
      toast.error('Error al confirmar la cita');
    }
  };

  const handleResendConfirmation = async (appointmentId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-appointment-confirmation', {
        body: { appointmentId }
      });

      if (error) throw error;

      toast.success('Email de confirmación reenviado');
    } catch {
      toast.error('Error al reenviar email de confirmación');
    }
  };

  // Generate hours array (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Calcular horario operativo basado en configuración y filtros
  const operatingHours = useMemo((): { openHour: number; closeHour: number } | null => {
    if (DEBUG_MODE) {
    }
    
    // Determinar qué sedes considerar
    let selectedLocations: LocationWithHours[] = [];
    
    if (preferredLocationId && filterLocation.length === 0) {
      // Si hay sede configurada y no hay filtros, usar solo esa
      const preferred = locations.find(l => l.id === preferredLocationId);
      if (preferred) {
        selectedLocations = [preferred];
        if (DEBUG_MODE) console.log('  ✅ Usando sede preferida:', preferred.name, preferred);
      } else {
        if (DEBUG_MODE) console.log('  ⚠️ Sede preferida no encontrada en locations');
      }
    } else if (filterLocation.length > 0) {
      // Si hay filtros aplicados, usar solo las sedes filtradas
      selectedLocations = locations.filter(l => filterLocation.includes(l.id));
      if (DEBUG_MODE) console.log('  ✅ Usando sedes filtradas:', selectedLocations.map(l => l.name));
    } else {
      // Si no hay filtros ni sede preferida, usar todas
      selectedLocations = locations;
      if (DEBUG_MODE) console.log('  ✅ Usando todas las sedes:', selectedLocations.map(l => l.name));
    }

    // Si no hay sedes o más de una sede con horarios diferentes, no hacer scroll automático
    if (selectedLocations.length === 0) {
      if (DEBUG_MODE) console.log('  ❌ No hay sedes seleccionadas');
      return null;
    }
    
    // Verificar si todas las sedes tienen el mismo horario
    const firstOpens = selectedLocations[0]?.opens_at;
    const firstCloses = selectedLocations[0]?.closes_at;
    
    if (!firstOpens || !firstCloses) {
      if (DEBUG_MODE) console.log('  ❌ Primera sede no tiene horarios definidos');
      return null;
    }
    
    if (DEBUG_MODE) console.log('  - Primer horario encontrado:', { opens_at: firstOpens, closes_at: firstCloses });
    
    const allSameSchedule = selectedLocations.every(
      loc => loc.opens_at === firstOpens && loc.closes_at === firstCloses
    );
    
    if (!allSameSchedule) {
      if (DEBUG_MODE) {
        selectedLocations.forEach(loc => {
        });
      }
      return null;
    }
    
    // Todas tienen el mismo horario
    const openHour = Number.parseInt(firstOpens.split(':')[0], 10);
    const closeHour = Number.parseInt(firstCloses.split(':')[0], 10);
    
    if (DEBUG_MODE) {
    }
    
    return { openHour, closeHour };
  }, [locations, preferredLocationId, filterLocation]);

  // Check if hour is within business hours (for styling)
  const isBusinessHour = (hour: number): boolean => {
    if (!operatingHours) return true; // Si no hay horarios definidos, mostrar todas las horas
    return hour >= operatingHours.openHour && hour < operatingHours.closeHour;
  };

  // Filtrar citas según los filtros seleccionados
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // ✅ Filtro de estado - si está vacío, NO mostrar nada (requiere selección)
      if (filterStatus.length === 0) {
        return false;
      }
      if (!filterStatus.includes(apt.status)) {
        return false;
      }

      // ✅ Filtro de ubicación - si está vacío, mostrar todas (pass-through)
      if (filterLocation.length > 0 && !filterLocation.includes(apt.location_id || '')) {
        return false;
      }

      // ✅ Filtro de servicio - si está vacío, mostrar todos (pass-through)
      if (filterService.length > 0 && !filterService.includes(apt.service_id)) {
        return false;
      }

      // ✅ Filtro de empleado - si está vacío, NO mostrar nada (requiere selección para columnas)
      if (filterEmployee.length === 0) {
        return false;
      }
      if (!filterEmployee.includes(apt.employee_id)) {
        return false;
      }

      return true;
    });
  }, [appointments, filterStatus, filterLocation, filterService, filterEmployee]);

  // ✅ Filtrar empleados a mostrar basado en filterEmployee
  // Días del mini-calendario mensual
  const miniCalDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(miniCalendarMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(miniCalendarMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [miniCalendarMonth]);

  // ESC cierra modo maximizado
  useEffect(() => {
    if (!isMaximized) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMaximized(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isMaximized]);

  // Click fuera cierra el mini-calendario
  useEffect(() => {
    if (!showMiniCalendar) return;
    const handle = (e: MouseEvent) => {
      if (
        miniCalRef.current && !miniCalRef.current.contains(e.target as Node) &&
        miniCalBtnRef.current && !miniCalBtnRef.current.contains(e.target as Node)
      ) {
        setShowMiniCalendar(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showMiniCalendar]);

  // Empleados que ofrecen al menos un servicio activo del negocio
  const employeesEligible = useMemo(() =>
    employees.filter(emp => (emp.services ?? []).length > 0)
  , [employees]);

  // Limpiar filterEmployee de IDs que no tienen servicios activos (p.ej. admin sin servicios)
  useEffect(() => {
    if (employeesEligible.length === 0) return;
    const eligibleIds = new Set(employeesEligible.map(e => e.user_id));
    const sanitized = filterEmployee.filter(id => eligibleIds.has(id));
    if (sanitized.length !== filterEmployee.length) {
      setFilterEmployee(sanitized);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeesEligible]);

  const employeesToDisplay = useMemo(() => {
    // Si el filtro está vacío, no mostrar ningún empleado
    if (filterEmployee.length === 0) {
      return [];
    }
    // Mostrar solo empleados seleccionados en el filtro
    // Solo empleados seleccionados que ofrezcan al menos un servicio activo
    const byEmployee = employees.filter(emp =>
      filterEmployee.includes(emp.user_id) &&
      (emp.services ?? []).length > 0
    );

    // Si hay filtro de servicios activo, ocultar empleados que no ofrecen ninguno
    if (filterService.length > 0) {
      return byEmployee.filter(emp => {
        const empServiceNames = emp.services ?? [];
        // Comparar contra los nombres de los servicios filtrados
        const filteredServiceNames = services
          .filter(s => filterService.includes(s.id))
          .map(s => s.name);
        return empServiceNames.some(sn => filteredServiceNames.includes(sn));
      });
    }

    return byEmployee;
  }, [employees, filterEmployee, filterService, services]);

  // Pre-calcular mapa de citas por empleado y hora (OPTIMIZACIÓN: evita 24+ filtros por render)
  const appointmentsBySlot = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    
    filteredAppointments.forEach(apt => {
      const aptDate = new Date(apt.start_time);
      const { hour: aptHourColombia } = extractTimeZoneParts(aptDate, DEFAULT_TIME_ZONE);
      const key = `${apt.employee_id}-${aptHourColombia}`;
      
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(apt);
    });
    
    return map;
  }, [filteredAppointments]);

  // Get appointments for specific employee and hour (ahora usa el mapa precalculado)
  const getAppointmentsForSlot = useCallback((employeeId: string, hour: number): Appointment[] => {
    const key = `${employeeId}-${hour}`;
    return appointmentsBySlot.get(key) || [];
  }, [appointmentsBySlot]);

  // Get active and overdue appointments
  const activeAppointments = useMemo(() => {
    const now = new Date();
    const result = appointments.filter(apt => {
      const start = parseISO(apt.start_time);
      const end = parseISO(apt.end_time);
      return apt.status === 'confirmed' && isWithinInterval(now, { start, end });
    });
    if (DEBUG_MODE) {
      console.log('🎯 [activeAppointments] Citas en proceso:', {
        total: result.length,
        citas: result.map(a => ({ id: a.id, cliente: a.client_name, hora: a.start_time }))
      });
    }
    return result;
  }, [appointments]);

  const overdueAppointments = useMemo(() => {
    const now = new Date();
    const result = appointments.filter(apt => {
      const end = parseISO(apt.end_time);
      return apt.status === 'confirmed' && end < now;
    });
    if (DEBUG_MODE) {
      console.log('⏰ [overdueAppointments] Citas pendientes de confirmar:', {
        total: result.length,
        citas: result.map(a => ({ id: a.id, cliente: a.client_name, horaFin: a.end_time }))
      });
    }
    return result;
  }, [appointments]);

  // Calculate current time position using Colombia timezone
  const currentTimePosition = useMemo(() => {
    if (!isSelectedDateToday) return null;

    const now = new Date();
    const { hour, minute } = extractTimeZoneParts(now, DEFAULT_TIME_ZONE);
    
    // Log detallado para debugging (solo en dev)
    if (DEBUG_MODE) {
      console.log('  - Hora sistema (UTC):', now.toISOString());
    }
    
    // Calcular posición relativa a las 24 horas completas
    const totalMinutesInDay = 24 * 60;
    const currentMinutes = hour * 60 + minute;
    const percentage = (currentMinutes / totalMinutesInDay) * 100;
    
    if (DEBUG_MODE) {
      console.log('  - Porcentaje calculado:', `${percentage.toFixed(2)}%`);
    }

    return percentage;
  }, [isSelectedDateToday]);

  // Scroll automático al horario de operación o a la hora actual
  useEffect(() => {
    if (DEBUG_MODE) {
    }
    
    if (!timelineRef.current && DEBUG_MODE) {
    }

    // Usar múltiples intentos para asegurar que el DOM esté listo
    const attemptScroll = (attempt = 0, maxAttempts = 5) => {
      if (!timelineRef.current && attempt < maxAttempts) {
        if (DEBUG_MODE) console.log(`  🔄 Reintentando (${attempt + 1}/${maxAttempts})...`);
        setTimeout(() => attemptScroll(attempt + 1, maxAttempts), 200);
        return;
      }

      if (!timelineRef.current) {
        if (DEBUG_MODE) console.log('  ❌ No se pudo acceder al ref después de intentos');
        return;
      }

      const scrollHeight = timelineRef.current.scrollHeight;
      const containerHeight = timelineRef.current.clientHeight;
      let scrollPosition = 0;

      if (DEBUG_MODE) {
      }

      // Prioridad 1: Si es hoy y tenemos posición actual, scroll a hora actual
      if (isSelectedDateToday && currentTimePosition !== null) {
        const linePxPosition = (currentTimePosition / 100) * scrollHeight;
        scrollPosition = linePxPosition - (containerHeight / 2);
        if (DEBUG_MODE) {
        }
      } 
      // Prioridad 2: Si tenemos horario operativo, scroll al inicio del horario
      else if (operatingHours) {
        // Calcular el porcentaje donde empieza el día laboral
        const openPercentage = (operatingHours.openHour / 24) * 100;
        const openPxPosition = (openPercentage / 100) * scrollHeight;
        // Dejar un poco de margen arriba (restar 50px)
        scrollPosition = Math.max(0, openPxPosition - 50);
        if (DEBUG_MODE) {
          console.log('    - scrollPosition final (con margen -50px):', scrollPosition);
        }
      } else {
        if (DEBUG_MODE) console.log('  ⏭️ Sin condiciones de scroll, permanece en top');
      }

      if (DEBUG_MODE) console.log('  🎯 Aplicando scrollTo:', Math.max(0, scrollPosition));
      if (timelineRef.current) {
        timelineRef.current.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'auto'
        });
      }
    };

    // Iniciar los intentos con delay inicial más largo
    setTimeout(() => attemptScroll(0, 5), 500);
  }, [isSelectedDateToday, currentTimePosition, operatingHours, selectedDate, showFilters]);

  // Check if hour is within employee's lunch break.
  // Never block past days — lunch times change over time and would hide historical appointments.
  const isLunchBreak = (hour: number, employee: Employee): boolean => {
    if (!employee.has_lunch_break || !employee.lunch_break_start || !employee.lunch_break_end) {
      return false;
    }
    // Past days: don't show lunch block (avoids hiding historical appointments)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    if (sel < today) return false;

    const lunchStart = Number.parseInt(employee.lunch_break_start.split(':')[0]);
    const lunchEnd = Number.parseInt(employee.lunch_break_end.split(':')[0]);

    return hour >= lunchStart && hour < lunchEnd;
  };

  // Get appointment status class
  const getAppointmentClass = (status: string): string => {
    if (status === 'pending') {
      // Improve contrast in light mode: lighter background, neutral text
      return 'bg-yellow-50 border border-yellow-400 text-foreground dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-100';
    }
    if (status === 'confirmed') {
      // ✅ Mejorado para ambos temas: mejor contraste en light mode
      return 'bg-blue-100 border border-blue-400 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200';
    }
    if (status === 'completed') {
      // ✅ Mejorado para ambos temas: mejor contraste en light mode
      return 'bg-green-100 border border-green-400 text-green-900 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200';
    }
    if (status === 'in_progress') {
      return 'bg-purple-100 border border-purple-400 text-purple-900 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-200';
    }
    if (status === 'no_show') {
      return 'bg-muted border border-border text-muted-foreground opacity-70 dark:bg-muted/50';
    }
    if (status === 'cancelled') {
      return 'bg-red-50 border border-red-300 text-red-400 line-through opacity-60 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
    }
    return 'bg-red-100 border border-red-400 text-red-900 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando calendario...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Calendario de Citas</h2>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="p-2 hover:bg-muted rounded-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {format(selectedDate, 'EEEE', { locale: es })}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(selectedDate, 'dd MMMM yyyy', { locale: es })}
            </div>
          </div>
          
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 hover:bg-muted rounded-md"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
          >
            Hoy
          </button>

          <button
            ref={miniCalBtnRef}
            onClick={() => {
              if (!showMiniCalendar && miniCalBtnRef.current) {
                const rect = miniCalBtnRef.current.getBoundingClientRect();
                setMiniCalPos({ top: rect.bottom + 8, left: Math.max(4, rect.right - 288) });
              }
              setMiniCalendarMonth(new Date(selectedDate));
              setShowMiniCalendar(prev => !prev);
            }}
            className={cn(
              'px-4 py-2 border border-border rounded-md font-medium flex items-center gap-2 transition-colors',
              showMiniCalendar
                ? 'bg-muted text-foreground'
                : 'bg-background hover:bg-muted text-foreground'
            )}
          >
            <Calendar className="h-4 w-4" />
            Ir a fecha
          </button>
        </div>
      </div>

      {/* Filters Panel - Custom Dropdowns with Checkboxes */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </h3>
          <div className="flex items-center gap-2">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setFilterStatus(['confirmed']);
                setFilterService([]);
                setFilterLocation([]);
                setFilterEmployee([]);
              }}
              className="px-3 py-1.5 text-xs bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors font-medium border border-border cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  setFilterStatus(['confirmed']);
                  setFilterService([]);
                  setFilterLocation([]);
                  setFilterEmployee([]);
                }
              }}
            >
              Limpiar
            </div>
            <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${showFilters ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {showFilters && (
          <div className="px-4 py-4 bg-background space-y-3">
            <div className="flex flex-wrap gap-3">
              {/* Estado Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1">Estado</label>
                <button
                  ref={statusBtnRef}
                  onClick={() => setOpenDropdowns(prev => ({ ...prev, status: !prev.status }))}
                  className="px-3 py-2 pr-8 text-sm border border-border rounded-md bg-background text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-w-[160px] flex items-center justify-between"
                >
                  <span className="truncate">
                    {filterStatus.length === 0
                      ? 'Ninguno'
                      : `${filterStatus.length} ${filterStatus.length === 1 ? 'seleccionado' : 'seleccionados'}`}
                  </span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground ml-2 transition-transform ${openDropdowns.status ? 'rotate-90' : ''}`} />
                </button>
                <DropdownPortal anchorRef={statusBtnRef} isOpen={openDropdowns.status} onClose={() => setOpenDropdowns(prev => ({ ...prev, status: false }))}>
                  <div className="bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                    <div className="px-2 py-2 border-b border-border">
                      <button
                        className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted/40 rounded"
                        onClick={() => setFilterStatus(['pending', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled'])}
                      >
                        Seleccionar Todos
                      </button>
                    </div>
                    {['pending', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled'].map(status => (
                      <label key={status} className="flex items-center px-3 py-2 hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterStatus.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterStatus([...filterStatus, status]);
                            } else {
                              setFilterStatus(filterStatus.filter(s => s !== status));
                            }
                          }}
                          className="w-4 h-4 rounded border-2 border-muted-foreground/40 bg-background checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-foreground">
                          {status === 'pending' && 'Pendiente'}
                          {status === 'confirmed' && 'Confirmada'}
                          {status === 'in_progress' && 'En progreso'}
                          {status === 'completed' && 'Completada'}
                          {status === 'no_show' && 'No se presentó'}
                          {status === 'cancelled' && 'Cancelada'}
                        </span>
                      </label>
                    ))}
                  </div>
                </DropdownPortal>
              </div>

              {/* Sede Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1">Sede</label>
                <button
                  ref={locationBtnRef}
                  onClick={() => setOpenDropdowns(prev => ({ ...prev, location: !prev.location }))}
                  className="px-3 py-2 pr-8 text-sm border border-border rounded-md bg-background text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-w-[160px] flex items-center justify-between"
                >
                  <span className="truncate">
                    {filterLocation.length === 0 ? 'Todas' : `${filterLocation.length} seleccionadas`}
                  </span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground ml-2 transition-transform ${openDropdowns.location ? 'rotate-90' : ''}`} />
                </button>
                <DropdownPortal anchorRef={locationBtnRef} isOpen={openDropdowns.location} onClose={() => setOpenDropdowns(prev => ({ ...prev, location: false }))}>
                  <div className="bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                    <div className="px-2 py-2 border-b border-border">
                      <button
                        className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted/40 rounded"
                        onClick={() => setFilterLocation(locations.map(l => l.id))}
                      >
                        Seleccionar Todos
                      </button>
                    </div>
                    {locations.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground italic">Sin sedes</div>
                    ) : (
                      locations.map(location => (
                        <label key={location.id} className="flex items-center px-3 py-2 hover:bg-muted/50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterLocation.includes(location.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilterLocation([...filterLocation, location.id]);
                              } else {
                                setFilterLocation(filterLocation.filter(l => l !== location.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-2 border-muted-foreground/40 bg-background checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-foreground truncate">{location.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </DropdownPortal>
              </div>

              {/* Servicio Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1">Servicio</label>
                <button
                  ref={serviceBtnRef}
                  onClick={() => setOpenDropdowns(prev => ({ ...prev, service: !prev.service }))}
                  className="px-3 py-2 pr-8 text-sm border border-border rounded-md bg-background text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-w-[160px] flex items-center justify-between"
                >
                  <span className="truncate">
                    {filterService.length === 0
                      ? 'Todos'
                      : `${filterService.length} ${filterService.length === 1 ? 'seleccionado' : 'seleccionados'}`}
                  </span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground ml-2 transition-transform ${openDropdowns.service ? 'rotate-90' : ''}`} />
                </button>
                <DropdownPortal anchorRef={serviceBtnRef} isOpen={openDropdowns.service} onClose={() => setOpenDropdowns(prev => ({ ...prev, service: false }))}>
                  <div className="bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                    <div className="px-2 py-2 border-b border-border">
                      <button
                        className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted/40 rounded"
                        onClick={() => setFilterService(services.map(s => s.id))}
                      >
                        Seleccionar Todos
                      </button>
                    </div>
                    {services.map(service => (
                      <label key={service.id} className="flex items-center px-3 py-2 hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterService.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterService([...filterService, service.id]);
                            } else {
                              setFilterService(filterService.filter(s => s !== service.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-2 border-muted-foreground/40 bg-background checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-foreground truncate">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </DropdownPortal>
              </div>

              {/* Profesional Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1">Profesional</label>
                <button
                  ref={employeeBtnRef}
                  onClick={() => setOpenDropdowns(prev => ({ ...prev, employee: !prev.employee }))}
                  className="px-3 py-2 pr-8 text-sm border border-border rounded-md bg-background text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-w-[160px] flex items-center justify-between"
                >
                  <span className="truncate">
                    {filterEmployee.length === 0
                      ? 'Todos'
                      : `${filterEmployee.length} ${filterEmployee.length === 1 ? 'seleccionado' : 'seleccionados'}`}
                  </span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground ml-2 transition-transform ${openDropdowns.employee ? 'rotate-90' : ''}`} />
                </button>
                <DropdownPortal anchorRef={employeeBtnRef} isOpen={openDropdowns.employee} onClose={() => setOpenDropdowns(prev => ({ ...prev, employee: false }))}>
                  <div className="bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                    <div className="px-2 py-2 border-b border-border">
                      <button
                        className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted/40 rounded"
                        onClick={() => setFilterEmployee(employeesEligible.map(e => e.user_id))}
                      >
                        Seleccionar Todos
                      </button>
                    </div>
                    {employeesEligible.map(employee => (
                      <label key={employee.user_id} className="flex items-center px-3 py-2 hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterEmployee.includes(employee.user_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterEmployee([...filterEmployee, employee.user_id]);
                            } else {
                              setFilterEmployee(filterEmployee.filter(e => e !== employee.user_id));
                            }
                          }}
                          className="w-4 h-4 rounded border-2 border-muted-foreground/40 bg-background checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-foreground truncate">{employee.profile_name}</span>
                      </label>
                    ))}
                  </div>
                </DropdownPortal>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className={cn(
        'bg-card border border-border',
        isMaximized
          ? 'fixed inset-0 z-[60] flex flex-col overflow-hidden'
          : 'rounded-lg overflow-hidden'
      )}>
        {/* Calendar Toolbar */}
        <div className="bg-muted/30 border-b border-border px-4 py-2 flex items-center justify-between gap-2">
          {/* Izquierda: Toggle servicios */}
          <button
            onClick={() => setShowServices(!showServices)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors duration-200 font-medium"
          >
            {showServices ? (
              <>
                <EyeOff className="h-4 w-4" />
                Ocultar servicios
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Ver servicios
              </>
            )}
          </button>
          {/* Derecha: hint ESC + botón maximizar */}
          <div className="flex items-center gap-3">
            {isMaximized && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted border border-border rounded-md text-xs text-foreground font-medium">
                Presiona
                <kbd className="px-1.5 py-0.5 font-mono bg-background border border-border rounded shadow-sm">Esc</kbd>
                para salir del modo pantalla completa
              </div>
            )}
            <button
              onClick={() => setIsMaximized(prev => !prev)}
              title={isMaximized ? 'Minimizar calendario (Esc)' : 'Maximizar calendario'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors duration-200 font-medium"
            >
              {isMaximized ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  Minimizar
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  Maximizar
                </>
              )}
            </button>
          </div>
        </div>

        <div className={cn('overflow-x-auto', isMaximized && 'flex-1 min-h-0')}>
          {employeesToDisplay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <User className="h-16 w-16 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No hay profesionales seleccionados
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Selecciona al menos un profesional en el filtro "PROFESIONAL" para ver sus citas en el calendario.
              </p>
            </div>
          ) : (
            <div className="inline-block min-w-full">
              {/* Scroll container wraps header + rows so sticky header aligns with body columns */}
              <div ref={timelineRef} className={cn('relative overflow-y-auto', isMaximized ? 'max-h-[calc(100vh-110px)]' : 'max-h-[600px]')}>
              {/* Header with employee names */}
              <div className="flex border-b-2 border-border bg-muted/50 sticky top-0 z-20">
                <div className="w-20 shrink-0 p-3 font-semibold text-sm text-muted-foreground border-r-2 border-border bg-background">
                  Hora
                </div>
                {employeesToDisplay.map((employee, index) => (
                <div
                  key={employee.id}
                  className={`flex-1 min-w-[280px] p-3 border-r-2 border-border last:border-r-0 ${employeeColors[index % employeeColors.length]}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      {employee.profile_avatar ? (
                        <img
                          src={employee.profile_avatar}
                          alt={employee.profile_name}
                          className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <span className="font-semibold text-sm text-foreground">
                        {employee.profile_name}
                      </span>
                    </div>
                    
                    {/* Services - only show if toggle is ON */}
                    {showServices && employee.services && employee.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center mt-1">
                        {employee.services.map((serviceName, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20"
                          >
                            {serviceName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="relative">
              {hours.map(hour => {
                const isWorkHour = isBusinessHour(hour);
                const workHourClass = isWorkHour ? '' : 'bg-muted/40';
                
                // Verificar si la línea debe aparecer en esta hora
                const shouldShowLineInHour = currentTimePosition !== null && isSelectedDateToday && (
                  Math.floor(currentTimePosition / (100 / 24)) === hour
                );
                
                return (
                  <div
                    key={hour}
                    className={`flex border-b border-border min-h-[80px] ${workHourClass} hover:bg-muted/20 transition-colors relative`}
                  >
                    {/* Línea de hora actual - SOLO si es la hora correcta */}
                    {shouldShowLineInHour && currentTimePosition !== null && (
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-blue-500 z-10 pointer-events-none"
                        style={{ 
                          top: `${((currentTimePosition % (100 / 24)) / (100 / 24)) * 80}px`
                        }}
                      >
                        <div className="absolute -left-2 -top-2 w-4 h-4 bg-blue-500 rounded-full shadow-lg"></div>
                      </div>
                    )}

                    <div className="w-20 shrink-0 p-2 text-sm text-muted-foreground font-medium border-r-2 border-border bg-background">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    {employeesToDisplay.map((employee, index) => {
                      const slotAppointments = getAppointmentsForSlot(employee.user_id, hour);
                      const isLunch = isLunchBreak(hour, employee);
                      
                      // DEBUG: Log appointments for this employee/hour combo
                      if (slotAppointments.length > 0) {
                        console.log(`📍 Slot [${hour}:00] - Empleado: ${employee.user_id} (${employee.profile_name}) - Citas: ${slotAppointments.length}`, slotAppointments);
                      }
                      
                      return (
                        <div
                          key={employee.id}
                          className={`flex-1 min-w-[280px] p-2 border-r-2 border-border last:border-r-0 transition-colors ${
                            isLunch
                              ? 'bg-gray-100 dark:bg-gray-900 opacity-60 cursor-not-allowed'
                              : `hover:bg-accent/50 ${employeeColors[index % employeeColors.length]}`
                          }`}
                        >
                          {isLunch ? (
                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground italic">
                              Almuerzo
                            </div>
                          ) : (
                            <>
                              {slotAppointments.map(apt => {
                                const appointmentClass = getAppointmentClass(apt.status);
                                
                                return (
                                  <button
                                    key={apt.id}
                                    onClick={() => setSelectedAppointment(apt)}
                                    className={`w-full p-2 rounded-md text-left text-xs hover:opacity-80 transition-opacity shadow-sm ${appointmentClass}`}
                                  >
                                    <div className="font-medium truncate">{apt.client_name}</div>
                                    <div className="truncate">{apt.service_name}</div>
                                    <div className="text-xs opacity-75">
                                      {formatTimeInColombia(apt.start_time)} - {formatTimeInColombia(apt.end_time)}
                                    </div>
                                    {apt.status === 'pending' && apt.confirmed && (
                                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-600/15 text-green-700 border border-green-600/25 dark:text-green-300">
                                        <Check className="h-3 w-3" /> Cliente confirmó
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
          )}
        </div>
      </div>

      {/* Appointment Modal */}
      {(activeAppointments.length > 0 || overdueAppointments.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Active Appointments */}
          {activeAppointments.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                En Proceso ({activeAppointments.length})
              </h3>
              <div className="space-y-2">
                {activeAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{apt.client_name}</div>
                        <div className="text-sm text-muted-foreground">{apt.service_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {apt.employee_name} • {formatTimeInColombia(apt.start_time)} - {formatTimeInColombia(apt.end_time)}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedAppointment(apt)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
                      >
                        Gestionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Appointments */}
          {overdueAppointments.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Pendientes de Confirmar ({overdueAppointments.length})
              </h3>
              <div className="space-y-2">
                {overdueAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{apt.client_name}</div>
                        <div className="text-sm text-muted-foreground">{apt.service_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {apt.employee_name} • {formatTimeInColombia(apt.start_time)} - {formatTimeInColombia(apt.end_time)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCompleteAppointment(apt.id, 0)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
                        >
                          Completada
                        </button>
                        <button
                          onClick={() => handleNoShow(apt.id)}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md"
                        >
                          Sin Asistencia
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Appointment Modal */}
      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onComplete={handleCompleteAppointment}
          onCancel={handleCancelAppointment}
          onNoShow={handleNoShow}
          onConfirm={handleConfirmAppointment}
          onResendConfirmation={handleResendConfirmation}
        />
      )}

      {/* Mini-calendario flotante */}
      {showMiniCalendar && createPortal(
        <div
          ref={miniCalRef}
          style={{ top: miniCalPos.top, left: miniCalPos.left }}
          className="fixed z-[9999] bg-card border border-border rounded-xl shadow-2xl p-4 w-72"
        >
          {/* Navegación de mes */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setMiniCalendarMonth(subMonths(miniCalendarMonth, 1))}
              className="p-1.5 hover:bg-muted rounded-md transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <span className="text-sm font-semibold text-foreground capitalize">
              {format(miniCalendarMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <button
              onClick={() => setMiniCalendarMonth(addMonths(miniCalendarMonth, 1))}
              className="p-1.5 hover:bg-muted rounded-md transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </div>

          {/* Cabecera de días */}
          <div className="grid grid-cols-7 mb-1">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Grilla de días */}
          <div className="grid grid-cols-7 gap-0.5">
            {miniCalDays.map(day => {
              const isCurrentMonth = isSameMonth(day, miniCalendarMonth);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setShowMiniCalendar(false);
                  }}
                  className={cn(
                    'h-8 w-full rounded-md text-xs font-medium transition-colors',
                    !isCurrentMonth && 'text-muted-foreground/40',
                    isCurrentMonth && !isToday && !isSelected && 'hover:bg-muted text-foreground',
                    isToday && !isSelected && 'bg-primary/10 text-primary font-bold',
                    isSelected && 'bg-primary text-primary-foreground font-bold',
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Atajo "Ir a hoy" */}
          <div className="mt-3 pt-3 border-t border-border">
            <button
              onClick={() => {
                setSelectedDate(new Date());
                setMiniCalendarMonth(new Date());
                setShowMiniCalendar(false);
              }}
              className="w-full py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
            >
              Ir a hoy
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

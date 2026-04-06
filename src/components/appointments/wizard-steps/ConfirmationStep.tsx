import React from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, User, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface WizardData {
  serviceId: string | null;
  service: { name: string; duration: number; duration_minutes?: number; price?: number } | null;
  date: Date | null;
  startTime: string | null;
  endTime: string | null;
  notes: string;
  locationId: string | null;
  location: { name: string; address?: string | null } | null;
  employeeId: string | null;
  employee: { full_name: string | null; email: string } | null;
}

interface ConfirmationStepProps {
  readonly wizardData: WizardData;
  readonly onUpdateNotes: (notes: string) => void;
  readonly onSubmit: () => void;
  readonly isEditing?: boolean;
}

interface InfoRowProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-primary mt-1">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground font-medium">{value}</p>
      </div>
    </div>
  );
}

export function ConfirmationStep({
  wizardData,
  onUpdateNotes,
  isEditing,
}: ConfirmationStepProps) {
  const { service, date, startTime, endTime, notes, location, employee } = wizardData;
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t(isEditing ? 'appointments.wizard.editAppointment' : 'appointments.wizard.newAppointment')}</h2>
        <p className="text-muted-foreground">{t(isEditing ? 'appointments.wizard.confirmDetailsEdit' : 'appointments.wizard.confirmDetails')}</p>
      </div>

      {/* Appointment Summary Card */}
      <Card className="bg-card border-border p-6">
        <div className="space-y-4">
          {/* Header con icono */}
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">{t('appointments.wizard.appointmentSummary')}</h3>
          </div>

          {/* Service */}
          <InfoRow
            icon={<Scissors className="h-5 w-5" />}
            label={t('appointments.service')}
            value={service?.name || t('appointments.wizard.notSelected')}
          />

          {/* Duration */}
          {(() => {
            const d = service?.duration ?? service?.duration_minutes;
            return typeof d === 'number' && d > 0;
          })() && (
            <InfoRow
              icon={<Clock className="h-5 w-5" />}
              label={t('appointments.duration')}
              value={`${service?.duration ?? service?.duration_minutes} ${t('appointments.wizard.minutes')}`}
            />
          )}

          <Separator className="bg-white/10" />

          {/* Date */}
          <InfoRow
            icon={<Calendar className="h-5 w-5" />}
            label={t('appointments.date')}
            value={date ? format(date, 'EEEE, d MMMM yyyy', { locale: dateLocale }) : t('appointments.wizard.notSelected')}
          />

          {/* Time */}
          <InfoRow
            icon={<Clock className="h-5 w-5" />}
            label={t('appointments.time')}
            value={startTime && endTime ? `${startTime} - ${endTime}` : t('appointments.wizard.notSelected')}
          />

          {/* Location */}
          {location && (
            <>
              <Separator className="bg-white/10" />
              <InfoRow
                icon={<MapPin className="h-5 w-5" />}
                label={t('appointments.wizard.location')}
                value={location.name}
              />
            </>
          )}

          {/* Employee */}
          {employee && (
            <>
              <Separator className="bg-white/10" />
              <InfoRow
                icon={<User className="h-5 w-5" />}
                label={t('appointments.wizard.professional')}
                value={employee.full_name || employee.email}
              />
            </>
          )}

          {/* Price */}
          {service?.price && (
            <>
              <Separator className="bg-white/10" />
              <div className="flex justify-between items-center pt-2">
                <span className="text-[#94a3b8] font-medium">{t('appointments.wizard.total')}</span>
                <span className="text-2xl font-bold text-[#ff8c00]">
                  ${service.price.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Notes Section */}
      <div className="space-y-3">
        <label htmlFor="appointment-notes" className="text-sm font-medium text-foreground">
          {t('appointments.wizard.optionalNotes')}
        </label>
        <Textarea
          id="appointment-notes"
          value={notes}
          onChange={(e) => onUpdateNotes(e.target.value)}
          placeholder={t('appointments.wizard.notesPlaceholder')}
          className="bg-background border-border text-foreground placeholder:text-muted-foreground min-h-[100px]
                     focus:border-primary focus:ring-primary/20"
        />
      </div>

      {/* Footer info */}
      <div className="text-center pt-4">
        <p className="text-xs text-[#94a3b8]">
          {t('appointments.wizard.confirmationMessage')}
        </p>
      </div>
    </div>
  );
}

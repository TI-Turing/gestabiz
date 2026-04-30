import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useEmployeeWorkSchedule } from '@/hooks/useEmployeeWorkSchedule'
import type { WorkScheduleSlot } from '@/types/types'
import { cn } from '@/lib/utils'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

interface EmployeeWorkScheduleEditorProps {
  employeeId: string
  businessId: string
}

export function EmployeeWorkScheduleEditor({ employeeId, businessId }: EmployeeWorkScheduleEditorProps) {
  const { slots, isLoading, addSlot, updateSlot, deleteSlot } = useEmployeeWorkSchedule(employeeId, businessId)
  const [adding, setAdding] = useState<number | null>(null)
  const [newSlot, setNewSlot] = useState({ start: '09:00', end: '18:00' })

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando horario...</p>

  const slotsByDay = DAYS.map((_, i) => slots.filter(s => s.day_of_week === i))

  const handleAdd = async (day: number) => {
    await addSlot({
      employee_id: employeeId,
      business_id: businessId,
      day_of_week: day,
      start_time: newSlot.start,
      end_time: newSlot.end,
      is_active: true,
    } as Omit<WorkScheduleSlot, 'id' | 'created_at' | 'updated_at'>)
    setAdding(null)
    setNewSlot({ start: '09:00', end: '18:00' })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Configura tu horario laboral. Esto determina el indicador amarillo de presencia en el chat.
      </p>

      <div className="divide-y border rounded-lg overflow-hidden">
        {DAYS.map((dayName, dayIndex) => {
          const daySlots = slotsByDay[dayIndex]
          return (
            <div key={dayIndex} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium w-10">{dayName}</span>
                {daySlots.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No laboral</span>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs ml-auto"
                  onClick={() => setAdding(dayIndex === adding ? null : dayIndex)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>

              {daySlots.map(slot => (
                <SlotRow
                  key={slot.id}
                  slot={slot}
                  onUpdate={(id, data) => updateSlot({ id, ...data })}
                  onRemove={() => deleteSlot(slot.id)}
                />
              ))}

              {adding === dayIndex && (
                <div className="flex items-center gap-2 mt-2 bg-muted/40 rounded p-2">
                  <TimeInput value={newSlot.start} onChange={v => setNewSlot(s => ({ ...s, start: v }))} label="Inicio" />
                  <span className="text-muted-foreground">–</span>
                  <TimeInput value={newSlot.end} onChange={v => setNewSlot(s => ({ ...s, end: v }))} label="Fin" />
                  <Button size="sm" className="h-8" onClick={() => handleAdd(dayIndex)}>
                    Guardar
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => setAdding(null)}>
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SlotRow({
  slot,
  onUpdate,
  onRemove,
}: {
  slot: WorkScheduleSlot
  onUpdate: (id: string, data: Partial<WorkScheduleSlot>) => Promise<unknown>
  onRemove: () => void
}) {
  return (
    <div className={cn('flex items-center gap-2 py-1', !slot.is_active && 'opacity-50')}>
      <Switch
        checked={slot.is_active}
        onCheckedChange={v => onUpdate(slot.id, { is_active: v })}
        aria-label="Activo"
      />
      <TimeInput
        value={slot.start_time.slice(0, 5)}
        onChange={v => onUpdate(slot.id, { start_time: v })}
        label="Inicio"
      />
      <span className="text-muted-foreground text-sm">–</span>
      <TimeInput
        value={slot.end_time.slice(0, 5)}
        onChange={v => onUpdate(slot.id, { end_time: v })}
        label="Fin"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
        onClick={onRemove}
        aria-label="Eliminar bloque"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function TimeInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring w-[5.5rem]"
      />
    </div>
  )
}

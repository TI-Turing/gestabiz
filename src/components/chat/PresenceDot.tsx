import { cn } from '@/lib/utils'
import type { PresenceStatus } from '@/types/types'

interface PresenceDotProps {
  status: PresenceStatus
  className?: string
  size?: 'sm' | 'md'
}

const COLOR_MAP: Record<PresenceStatus, { bg: string; label: string }> = {
  online:  { bg: 'bg-green-500',  label: 'Conectado' },
  away:    { bg: 'bg-yellow-400', label: 'Ausente (en horario)' },
  offline: { bg: 'bg-gray-400',   label: 'Desconectado' },
}

export function PresenceDot({ status, className, size = 'sm' }: PresenceDotProps) {
  const { bg, label } = COLOR_MAP[status]
  const dim = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'

  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        'block rounded-full border-2 border-background',
        dim,
        bg,
        className
      )}
    />
  )
}

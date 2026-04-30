import { Phone, Video, Search as SearchIcon, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PresenceDot } from './PresenceDot'
import type { ConversationPreview } from '@/hooks/useConversations'
import type { UserPresenceInfo } from '@/types/types'

interface ChatHeaderProps {
  conversation: ConversationPreview
  currentUserId: string
  otherUserPresence?: UserPresenceInfo
  isSearchOpen?: boolean
  onToggleSearch?: () => void
  onStartCall?: () => void
  onToggleArchive?: (id: string, archived: boolean) => void
}

/**
 * Resuelve el avatar, título y subtítulo según relationship_type.
 *
 * client_business (cliente mira):
 *   avatar = logo del negocio; título = "NombreNegocio[ - NombreEmpleado]"; subtítulo = "Negocio"
 * client_business (admin/empleado mira):
 *   avatar = avatar del cliente; título = nombre del cliente; subtítulo = "Cliente"
 * business_collaborator:
 *   avatar = avatar counterpart; título = nombre counterpart; subtítulo = "Colaborador"/"Profesional"
 * support:
 *   avatar = null (ícono robot); título = "Soporte Gestabiz"; subtítulo = "Soporte"
 * legacy (null):
 *   comportamiento anterior — nombre del other_user
 */
function resolveHeaderInfo(
  conversation: ConversationPreview,
  currentUserId: string
): { avatarSrc?: string | null; title: string; subtitle?: string; fallback: string } {
  const rel = (conversation as ConversationPreview & {
    relationship_type?: string | null
    client_id?: string | null
    counterpart_user_id?: string | null
    business_info?: { id: string; name: string; logo_url?: string; allow_chat_with_professionals?: boolean }
    counterpart_role?: 'owner' | 'admin' | 'employee' | null
  })

  if (!rel.relationship_type) {
    // Legacy
    const name = conversation.other_user?.full_name || conversation.other_user?.email || 'Usuario'
    return { avatarSrc: conversation.other_user?.avatar_url, title: name, fallback: name }
  }

  if (rel.relationship_type === 'support') {
    return { avatarSrc: null, title: 'Soporte Gestabiz', subtitle: 'Soporte', fallback: 'SG' }
  }

  if (rel.relationship_type === 'client_business') {
    const isClient = rel.client_id === currentUserId

    if (isClient) {
      // El cliente mira el chat — mostrar el negocio
      const biz = rel.business_info
      let title = biz?.name || 'Negocio'
      const counterpart = conversation.other_user

      // Mostrar nombre del profesional solo si está configurado y el counterpart es employee
      if (
        biz?.allow_chat_with_professionals !== false &&
        rel.counterpart_role === 'employee' &&
        counterpart?.full_name
      ) {
        title = `${title} - ${counterpart.full_name}`
      }

      return {
        avatarSrc: biz?.logo_url,
        title,
        subtitle: 'Negocio',
        fallback: biz?.name?.slice(0, 2).toUpperCase() || 'NE',
      }
    } else {
      // El admin/empleado mira el chat — mostrar el cliente
      const clientName = conversation.other_user?.full_name || conversation.other_user?.email || 'Cliente'
      return {
        avatarSrc: conversation.other_user?.avatar_url,
        title: clientName,
        subtitle: 'Cliente',
        fallback: clientName,
      }
    }
  }

  if (rel.relationship_type === 'business_collaborator') {
    const name = conversation.other_user?.full_name || conversation.other_user?.email || 'Colaborador'
    const subtitle = rel.counterpart_role === 'employee' ? 'Profesional' : 'Colaborador'
    return {
      avatarSrc: conversation.other_user?.avatar_url,
      title: name,
      subtitle,
      fallback: name,
    }
  }

  // Fallback
  const name = conversation.other_user?.full_name || 'Usuario'
  return { avatarSrc: conversation.other_user?.avatar_url, title: name, fallback: name }
}

export function ChatHeader({
  conversation,
  currentUserId,
  otherUserPresence,
  isSearchOpen,
  onToggleSearch,
  onStartCall,
  onToggleArchive,
}: ChatHeaderProps) {
  const { avatarSrc, title, subtitle, fallback } = resolveHeaderInfo(conversation, currentUserId)

  return (
    <div className="border-b bg-background p-3 sm:p-4 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Avatar con punto de presencia */}
        <div className="relative shrink-0">
          <ProfileAvatar
            src={avatarSrc}
            alt={title}
            fallbackText={fallback}
            size="md"
            maxRetries={5}
            retryDelay={800}
          />
          {otherUserPresence && (
            <PresenceDot
              status={otherUserPresence.status}
              className="absolute bottom-0 right-0"
            />
          )}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm sm:text-base truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate italic">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:flex h-9 w-9"
          onClick={onStartCall}
          disabled={!onStartCall}
          title="Llamada de voz"
          aria-label="Iniciar llamada de voz"
        >
          <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          disabled
          title="Videollamada (próximamente)"
          className="hidden sm:flex h-9 w-9 opacity-40 cursor-not-allowed"
          aria-label="Videollamada — próximamente"
        >
          <Video className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onToggleSearch}
          title="Buscar en conversación"
          aria-label={isSearchOpen ? 'Cerrar búsqueda' : 'Buscar en mensajes'}
          aria-expanded={isSearchOpen}
        >
          <SearchIcon className="h-5 w-5" aria-hidden />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Opciones de conversación">
              <MoreVertical className="h-5 w-5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onToggleArchive && (
              <DropdownMenuItem
                onClick={() => onToggleArchive(conversation.id, !conversation.is_archived)}
                className="text-destructive"
              >
                {conversation.is_archived ? 'Desarchivar' : 'Archivar'} conversación
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

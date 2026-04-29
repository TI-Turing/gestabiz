import React, { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search, Archive, X, ChevronDown, ChevronRight } from 'lucide-react'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PresenceDot } from './PresenceDot'
import { useUserPresence } from '@/hooks/useUserPresence'
import type { ConversationPreview } from '@/hooks/useConversations'
import type { RelationshipType } from '@/types/types'
import { cn } from '@/lib/utils'

interface ConversationListProps {
  conversations: ConversationPreview[]
  activeConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  totalUnreadCount?: number
  loading?: boolean
  /** ID del usuario actual — necesario para resolver labels de relación */
  currentUserId?: string
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  totalUnreadCount = 0,
  loading = false,
  currentUserId,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  // Obtener todos los other_user IDs para presence
  const otherUserIds = conversations.map(c => c.other_user?.id).filter(Boolean) as string[]
  const presenceMap = useUserPresence(otherUserIds)

  const filtered = conversations.filter(conv => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      conv.name?.toLowerCase().includes(q) ||
      conv.display_name?.toLowerCase().includes(q) ||
      conv.other_user?.full_name?.toLowerCase().includes(q) ||
      conv.other_user?.email?.toLowerCase().includes(q) ||
      conv.last_message_preview?.toLowerCase().includes(q)
    )
  })

  // Agrupar por relationship_type
  const groups = buildGroups(filtered, currentUserId)

  const toggleGroup = (key: string) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  return (
    <div className="flex flex-col h-full border-r bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Mensajes</h2>
          {totalUnreadCount > 0 && (
            <Badge variant="default" className="rounded-full">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => setSearchQuery('')}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading && filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Cargando conversaciones...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No se encontraron conversaciones' : 'No hay conversaciones'}
          </div>
        )}

        {groups.map(group => {
          const isOpen = !collapsed[group.key]
          return (
            <div key={group.key}>
              {group.label && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center gap-1 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                >
                  {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  {group.label}
                  {group.unread > 0 && (
                    <Badge variant="default" className="ml-auto rounded-full h-4 min-w-[16px] px-1 text-[10px]">
                      {group.unread}
                    </Badge>
                  )}
                </button>
              )}
              {isOpen && (
                <div className="divide-y">
                  {group.convs.map(conv => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeConversationId}
                      onClick={() => onSelectConversation(conv.id)}
                      presence={presenceMap.get(conv.other_user?.id ?? '')}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </ScrollArea>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface ConvGroup {
  key: string
  label?: string
  convs: ConversationPreview[]
  unread: number
}

function buildGroups(convs: ConversationPreview[], currentUserId?: string): ConvGroup[] {
  const sorted = [...convs].sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
    return bTime - aTime
  })

  const buckets: Record<string, ConversationPreview[]> = {
    client_as_client: [],
    client_as_business: [],
    collaborator: [],
    support: [],
    legacy: [],
  }

  for (const conv of sorted) {
    const rel = (conv as ConversationPreview & { relationship_type?: string | null; client_id?: string | null })
    if (!rel.relationship_type) { buckets.legacy.push(conv); continue }
    if (rel.relationship_type === 'support') { buckets.support.push(conv); continue }
    if (rel.relationship_type === 'business_collaborator') { buckets.collaborator.push(conv); continue }
    if (rel.relationship_type === 'client_business') {
      if (rel.client_id === currentUserId) buckets.client_as_client.push(conv)
      else buckets.client_as_business.push(conv)
      continue
    }
    buckets.legacy.push(conv)
  }

  const groups: ConvGroup[] = []

  const addGroup = (key: string, label: string, list: ConversationPreview[]) => {
    if (!list.length) return
    const unread = list.reduce((s, c) => s + (c.unread_count || 0), 0)
    groups.push({ key, label, convs: list, unread })
  }

  addGroup('client_as_client', 'Como cliente', buckets.client_as_client)
  addGroup('client_as_business', 'Mis negocios', buckets.client_as_business)
  addGroup('collaborator', 'Equipo', buckets.collaborator)
  addGroup('support', 'Soporte', buckets.support)

  // Legacy sin etiqueta (comportamiento anterior)
  if (buckets.legacy.length) {
    const unread = buckets.legacy.reduce((s, c) => s + (c.unread_count || 0), 0)
    groups.push({ key: 'legacy', convs: buckets.legacy, unread })
  }

  return groups
}

// ─── ConversationItem ─────────────────────────────────────────────────────────

interface ConversationItemProps {
  conversation: ConversationPreview
  isActive: boolean
  onClick: () => void
  presence?: ReturnType<ReturnType<typeof useUserPresence>['get']>
  currentUserId?: string
}

function ConversationItem({ conversation, isActive, onClick, presence }: ConversationItemProps) {
  const rel = conversation as ConversationPreview & {
    relationship_type?: RelationshipType | null
    business?: { name: string; logo_url?: string | null }
  }

  let title: string
  let avatarSrc: string | null | undefined

  if (rel.relationship_type === 'client_business' && rel.business) {
    title = rel.business.name
    avatarSrc = rel.business.logo_url
  } else {
    title = conversation.display_name || conversation.other_user?.full_name || conversation.other_user?.email || 'Usuario'
    avatarSrc = conversation.other_user?.avatar_url
  }

  const lastMessageDate = conversation.last_message_at ? new Date(conversation.last_message_at) : new Date()
  const now = new Date()
  const isToday = lastMessageDate.toDateString() === now.toDateString()
  const timestamp = conversation.last_message_at
    ? isToday
      ? format(lastMessageDate, 'HH:mm', { locale: es })
      : format(lastMessageDate, 'd MMM', { locale: es })
    : ''

  const hasUnread = (conversation.unread_count || 0) > 0

  return (
    <button
      onClick={onClick}
      className={cn('w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left', isActive && 'bg-muted')}
    >
      {/* Avatar con PresenceDot */}
      <div className="relative shrink-0">
        <ProfileAvatar
          src={avatarSrc}
          alt={title}
          fallbackText={title}
          size="lg"
          maxRetries={5}
          retryDelay={800}
        />
        {presence && (
          <PresenceDot
            status={presence.status}
            className="absolute bottom-0 right-0"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {conversation.is_archived && <Archive className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <h3 className={cn('font-medium truncate', hasUnread && 'font-semibold')}>{title}</h3>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground shrink-0">{timestamp}</span>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm text-muted-foreground truncate', hasUnread && 'font-medium text-foreground')}>
            {conversation.last_message_preview || 'Sin mensajes'}
          </p>
          {hasUnread && (
            <Badge variant="default" className="rounded-full h-5 min-w-[20px] px-1.5 text-xs">
              {conversation.unread_count! > 99 ? '99+' : conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}

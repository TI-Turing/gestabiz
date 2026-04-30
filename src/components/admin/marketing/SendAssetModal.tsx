import { useState, useEffect } from 'react'
import { X, Send, FileText, Video, File, MessageSquare, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { MarketingVaultFile } from '@/types/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SendAssetModalProps {
  file: MarketingVaultFile
  businessId: string
  isOpen: boolean
  onClose: () => void
}

type Tab = 'whatsapp' | 'email'

interface Recipient {
  id: string
  name: string
  phone?: string | null
  email?: string | null
}

interface ConversationItem {
  id: string
  display_name?: string
  name?: string
  last_message_preview?: string
}

function AssetThumbnail({ file }: { file: MarketingVaultFile }) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (file.isImage && file.url) {
    return (
      <img
        src={file.url}
        alt={file.name}
        className="h-20 w-20 rounded-md object-cover shrink-0 border"
      />
    )
  }
  const Icon =
    ['mp4', 'webm'].includes(ext) ? Video :
    ext === 'pdf' ? FileText :
    File
  return (
    <div className="h-20 w-20 rounded-md border bg-muted flex items-center justify-center shrink-0">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
  )
}

export function SendAssetModal({ file, businessId, isOpen, onClose }: SendAssetModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('whatsapp')

  // --- Estado de conversaciones (chat) ---
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [selectedConvIds, setSelectedConvIds] = useState<Set<string>>(new Set())

  // --- Estado de destinatarios ---
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [recipientSearch, setRecipientSearch] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set())

  // --- Campos de email ---
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')

  // --- Estado de envío ---
  const [isSending, setIsSending] = useState(false)
  const [loadingRecipients, setLoadingRecipients] = useState(false)

  // Cargar conversaciones activas del negocio
  useEffect(() => {
    if (!isOpen || !user) return
    supabase
      .rpc('get_conversation_preview', {
        p_user_id: user.id,
        p_business_id: businessId,
        p_limit: 50,
        p_offset: 0,
      })
      .then(({ data }) => {
        setConversations((data ?? []) as ConversationItem[])
      })
      .catch(() => {
        // No bloquear si no hay conversaciones
        setConversations([])
      })
  }, [isOpen, user, businessId])

  // Cargar clientes del negocio (para WhatsApp/email)
  useEffect(() => {
    if (!isOpen) return
    setLoadingRecipients(true)
    async function load() {
      try {
        // Paso 1: obtener client_ids con citas no canceladas
        const { data: apts, error: aptsError } = await supabase
          .from('appointments')
          .select('client_id')
          .eq('business_id', businessId)
          .neq('status', 'cancelled')
          .limit(500)
        if (aptsError) throw aptsError

        const clientIds = [...new Set((apts ?? []).map((a: { client_id: string }) => a.client_id))]
        if (clientIds.length === 0) {
          setRecipients([])
          return
        }

        // Paso 2: obtener perfiles
        const { data: profiles, error: profError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .in('id', clientIds)
          .limit(300)
        if (profError) throw profError

        setRecipients(
          (profiles ?? []).map((p: { id: string; full_name: string | null; email: string | null; phone?: string | null }) => ({
            id: p.id,
            name: p.full_name ?? 'Cliente',
            email: p.email,
            phone: p.phone ?? null,
          }))
        )
      } catch {
        setRecipients([])
      } finally {
        setLoadingRecipients(false)
      }
    }
    void load()
  }, [isOpen, businessId])

  if (!isOpen) return null

  const filteredRecipients = recipients.filter(r =>
    r.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
    (r.email ?? '').toLowerCase().includes(recipientSearch.toLowerCase()) ||
    (r.phone ?? '').includes(recipientSearch)
  )

  const toggleConv = (id: string) => {
    setSelectedConvIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const getConvLabel = (c: ConversationItem) =>
    c.display_name ?? c.name ?? 'Conversación'

  const handleSendChat = async () => {
    if (selectedConvIds.size === 0) {
      toast.error('Selecciona al menos una conversación')
      return
    }
    setIsSending(true)
    try {
      // Generar URL firmada de 7 días para adjuntar
      const { data: signedData, error: signErr } = await supabase.storage
        .from('business-marketing-vault')
        .createSignedUrl(file.path, 604800)
      if (signErr || !signedData?.signedUrl) throw signErr

      const url = signedData.signedUrl
      const mimeType = file.isImage
        ? 'image/jpeg'
        : file.name.endsWith('.pdf')
        ? 'application/pdf'
        : file.name.endsWith('.mp4') || file.name.endsWith('.webm')
        ? 'video/mp4'
        : 'application/octet-stream'

      const attachment = { url, name: file.name, size: 0, type: mimeType }

      // Enviar a cada conversación seleccionada via send-message edge function
      const sends = Array.from(selectedConvIds).map(convId =>
        supabase.functions.invoke('send-message', {
          body: {
            conversationId: convId,
            content: 'Archivo de marketing adjunto',
            attachments: [attachment],
          },
        })
      )
      await Promise.all(sends)
      toast.success(`Enviado a ${selectedConvIds.size} conversación${selectedConvIds.size > 1 ? 'es' : ''}`)
      setSelectedConvIds(new Set())
      onClose()
    } catch {
      toast.error('Error al enviar a chat')
    } finally {
      setIsSending(false)
    }
  }

  const handleSendWhatsApp = async () => {
    if (selectedRecipients.size === 0) {
      toast.error('Selecciona al menos un destinatario')
      return
    }
    if (selectedRecipients.size > 50) {
      toast.error('Máximo 50 destinatarios a la vez')
      return
    }
    setIsSending(true)
    try {
      const recipList = recipients
        .filter(r => selectedRecipients.has(r.id) && r.phone)
        .map(r => ({ phone: r.phone!, name: r.name }))

      if (recipList.length === 0) {
        toast.error('Ningún destinatario tiene número de teléfono registrado')
        setIsSending(false)
        return
      }

      const { error } = await supabase.functions.invoke('send-marketing-whatsapp', {
        body: {
          businessId,
          assetPath: file.path,
          recipients: recipList,
        },
      })
      if (error) throw error

      toast.success(`WhatsApp enviado a ${recipList.length} destinatario${recipList.length > 1 ? 's' : ''}`)
      setSelectedRecipients(new Set())
      onClose()
    } catch {
      toast.error('Error al enviar por WhatsApp')
    } finally {
      setIsSending(false)
    }
  }

  const handleSendEmail = async () => {
    if (selectedRecipients.size === 0) {
      toast.error('Selecciona al menos un destinatario')
      return
    }
    if (!emailSubject.trim()) {
      toast.error('El asunto es requerido')
      return
    }
    setIsSending(true)
    try {
      const recipList = recipients
        .filter(r => selectedRecipients.has(r.id) && r.email)
        .map(r => ({ email: r.email!, name: r.name }))

      if (recipList.length === 0) {
        toast.error('Ningún destinatario tiene email registrado')
        setIsSending(false)
        return
      }

      const { error } = await supabase.functions.invoke('send-marketing-email', {
        body: {
          businessId,
          assetPath: file.path,
          recipients: recipList,
          subject: emailSubject.trim(),
          body: emailBody.trim(),
        },
      })
      if (error) throw error

      toast.success(`Email enviado a ${recipList.length} destinatario${recipList.length > 1 ? 's' : ''}`)
      setSelectedRecipients(new Set())
      setEmailSubject('')
      setEmailBody('')
      onClose()
    } catch {
      toast.error('Error al enviar por email')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <AssetThumbnail file={file} />
            <div className="min-w-0">
              <h2 className="font-semibold text-sm truncate max-w-[18rem]">{file.name}</h2>
              <p className="text-xs text-muted-foreground">Enviar archivo de marketing</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0">
          {(
            [
              { id: 'whatsapp', label: 'WhatsApp', icon: <Phone className="h-4 w-4" /> },
              { id: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
            ] as { id: Tab; label: string; icon: React.ReactNode }[]
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                setSelectedRecipients(new Set())
              }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setActiveTab('whatsapp')
              setSelectedConvIds(new Set())
            }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ml-auto',
              'border-transparent text-muted-foreground hover:text-foreground'
            )}
            title="Enviar a conversación de chat"
            aria-label="Chat"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {/* Selector de destinatarios (WhatsApp / Email) */}
          {(activeTab === 'whatsapp' || activeTab === 'email') && (
            <>
              <div className="p-3 border-b shrink-0">
                <Input
                  placeholder="Buscar cliente por nombre, email o teléfono..."
                  value={recipientSearch}
                  onChange={e => setRecipientSearch(e.target.value)}
                  className="h-8 text-sm"
                />
                {selectedRecipients.size > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {selectedRecipients.size} seleccionado{selectedRecipients.size > 1 ? 's' : ''}
                    {activeTab === 'whatsapp' && selectedRecipients.size > 50 && (
                      <span className="text-destructive ml-1"> (máx. 50)</span>
                    )}
                  </p>
                )}
              </div>
              <ScrollArea className="flex-1">
                {loadingRecipients && (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    Cargando clientes...
                  </p>
                )}
                {!loadingRecipients && filteredRecipients.length === 0 && (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    Sin clientes{recipientSearch ? ' que coincidan' : ''}
                  </p>
                )}
                <div className="p-2 space-y-0.5">
                  {filteredRecipients.map(r => {
                    const hasContact = activeTab === 'whatsapp' ? !!r.phone : !!r.email
                    return (
                      <button
                        key={r.id}
                        type="button"
                        disabled={!hasContact}
                        onClick={() => hasContact && toggleRecipient(r.id)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors',
                          selectedRecipients.has(r.id)
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/60',
                          !hasContact && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        <div
                          className={cn(
                            'h-4 w-4 rounded border shrink-0 flex items-center justify-center',
                            selectedRecipients.has(r.id)
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground'
                          )}
                        >
                          {selectedRecipients.has(r.id) && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{r.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {activeTab === 'whatsapp'
                              ? r.phone ?? 'Sin teléfono'
                              : r.email ?? 'Sin email'}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Campos adicionales para email */}
          {activeTab === 'email' && (
            <div className="p-3 border-t space-y-2 shrink-0">
              <Input
                placeholder="Asunto del correo"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className="h-8 text-sm"
              />
              <Textarea
                placeholder="Cuerpo del correo (opcional)"
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={
              isSending ||
              (activeTab !== 'whatsapp' && activeTab !== 'email'
                ? selectedConvIds.size === 0
                : selectedRecipients.size === 0) ||
              (activeTab === 'email' && !emailSubject.trim())
            }
            onClick={() => {
              if (activeTab === 'whatsapp') void handleSendWhatsApp()
              else void handleSendEmail()
            }}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending
              ? 'Enviando...'
              : activeTab === 'whatsapp'
              ? `Enviar por WhatsApp (${selectedRecipients.size})`
              : `Enviar por Email (${selectedRecipients.size})`}
          </Button>
        </div>
      </div>
    </div>
  )
}

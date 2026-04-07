/**
 * JoinBusiness — Employee flow to request joining a business.
 * - Search real businesses from Supabase
 * - Send join request (stored in employee_join_requests)
 * - Enter admin-generated invite code
 * - See status of existing requests
 */

import { useState } from 'react'
import { Building, MagnifyingGlass as Search, Clock, QrCode, KeyReturn } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  useMyJoinRequests,
  useSendJoinRequest,
  useClaimInviteCode,
} from '@/hooks/useEmployeeJoinRequests'

interface JoinBusinessProps {
  userId: string
  onRequestSent?: () => void
}

interface BusinessResult {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  city: string | null
  category_id: string | null
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  approved: 'bg-green-500/10 text-green-700 dark:text-green-400',
  rejected: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

export default function JoinBusiness({ userId, onRequestSent }: Readonly<JoinBusinessProps>) {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessResult | null>(null)
  const [message, setMessage] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const { data: myRequests = [], isLoading: loadingRequests } = useMyJoinRequests(userId)
  const sendRequest = useSendJoinRequest(userId)
  const claimCode = useClaimInviteCode(userId)

  // Search businesses
  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: ['business-search-join', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim() || searchTerm.trim().length < 2) return []
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, city, category_id')
        .eq('is_active', true)
        .ilike('name', `%${searchTerm}%`)
        .limit(12)
      if (error) throw error
      return (data ?? []) as BusinessResult[]
    },
    enabled: searchTerm.trim().length >= 2,
    staleTime: 10_000,
  })

  // Already-requested business IDs
  const pendingOrApprovedIds = new Set(
    myRequests
      .filter(r => r.status === 'pending' || r.status === 'approved')
      .map(r => r.business_id),
  )

  const handleSendRequest = async () => {
    if (!selectedBusiness) return
    try {
      await sendRequest.mutateAsync({ businessId: selectedBusiness.id, message })
      toast.success(t('employee.join.request_sent_success'))
      setSelectedBusiness(null)
      setMessage('')
      onRequestSent?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('employee.join.request_error')
      toast.error(msg)
    }
  }

  const handleClaimCode = async () => {
    if (!inviteCode.trim()) return
    try {
      const result = await claimCode.mutateAsync(inviteCode.trim().toUpperCase())
      toast.success('Código aplicado. Tu solicitud está pendiente de aprobación.')
      setInviteCode('')
      onRequestSent?.()
      // Optionally navigate to the business
      void result
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al aplicar el código'
      toast.error(msg)
    }
  }

  // ===== Send Request Form =====
  if (selectedBusiness) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>{t('employee.join.request_form_title')}</CardTitle>
          <CardDescription>
            Enviando solicitud para unirse a <strong>{selectedBusiness.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Business preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedBusiness.logo_url ?? undefined} alt={selectedBusiness.name} />
              <AvatarFallback>{selectedBusiness.name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold truncate">{selectedBusiness.name}</p>
              {selectedBusiness.city && (
                <p className="text-xs text-muted-foreground">{selectedBusiness.city}</p>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">{t('employee.join.message_label')}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('employee.join.message_placeholder')}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{t('employee.join.message_hint')}</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedBusiness(null)} disabled={sendRequest.isPending}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSendRequest} disabled={sendRequest.isPending}>
              {sendRequest.isPending ? t('employee.join.sending') : t('employee.join.send_request')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ===== Main View =====
  return (
    <div className="space-y-6">
      <Tabs defaultValue="search">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Buscar Negocio
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-2">
            <QrCode className="h-4 w-4" />
            Código de Invitación
          </TabsTrigger>
        </TabsList>

        {/* TAB: Search */}
        <TabsContent value="search" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {t('employee.join.title')}
              </CardTitle>
              <CardDescription>{t('employee.join.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={t('employee.join.search_placeholder')}
                  className="flex-1"
                />
              </div>
              {searching && (
                <p className="text-sm text-muted-foreground mt-2">Buscando...</p>
              )}
            </CardContent>
          </Card>

          {searchTerm.trim().length >= 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchResults.length === 0 && !searching && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Building className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>{t('employee.join.no_results_title')}</p>
                  <p className="text-sm">{t('employee.join.no_results_description')}</p>
                </div>
              )}
              {searchResults.map(biz => {
                const alreadyRequested = pendingOrApprovedIds.has(biz.id)
                return (
                  <Card key={biz.id} className="p-4 flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={biz.logo_url ?? undefined} alt={biz.name} />
                      <AvatarFallback>{biz.name[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-semibold truncate">{biz.name}</p>
                      {biz.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {biz.city}
                        </p>
                      )}
                      {biz.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{biz.description}</p>
                      )}
                      {alreadyRequested ? (
                        <Badge className="mt-1 text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-0">
                          Solicitud enviada
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          className="mt-1 w-full"
                          onClick={() => setSelectedBusiness(biz)}
                        >
                          {t('employee.join.request_to_join')}
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB: Invite Code */}
        <TabsContent value="code" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Código de Invitación
              </CardTitle>
              <CardDescription>
                Si el administrador de un negocio te compartió un código de invitación, ingrésalo aquí.
                El código es válido por 24 horas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Código de invitación</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-code"
                    value={inviteCode}
                    onChange={e => setInviteCode(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
                    )}
                    placeholder="Ej: ABC123"
                    maxLength={6}
                    className="font-mono text-lg tracking-widest uppercase"
                  />
                  <Button
                    onClick={handleClaimCode}
                    disabled={inviteCode.trim().length < 6 || claimCode.isPending}
                    className="gap-2"
                  >
                    <KeyReturn className="h-4 w-4" />
                    Aplicar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* My Requests */}
      {myRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mis solicitudes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingRequests && (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            )}
            {myRequests.map(req => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage
                    src={(req.business as unknown as { logo_url?: string })?.logo_url ?? undefined}
                    alt={(req.business as unknown as { name?: string })?.name}
                  />
                  <AvatarFallback>
                    {(req.business as unknown as { name?: string })?.name?.[0]?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {(req.business as unknown as { name?: string })?.name ?? req.business_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                  {req.rejection_reason && (
                    <p className="text-xs text-red-600 mt-0.5">Motivo: {req.rejection_reason}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[req.status] ?? ''}`}>
                  {statusLabels[req.status] ?? req.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

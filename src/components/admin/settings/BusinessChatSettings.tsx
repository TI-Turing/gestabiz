/**
 * BusinessChatSettings — Configuración de chat del negocio
 *
 * Permite al administrador:
 *   1. Habilitar/deshabilitar que los clientes puedan chatear con profesionales.
 *   2. Asignar un administrador de chat específico a cada sede.
 *      Solo aparecen como candidatos los usuarios con nivel jerárquico
 *      0 (Propietario) o 1 (Administrador).
 */

import { MapPin, ChatText, UserCircle } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { useBusinessChatConfig } from '@/hooks/useBusinessChatConfig'
import { useChatAdminCandidates } from '@/hooks/useChatAdminCandidates'

interface BusinessChatSettingsProps {
  businessId: string
}

export function BusinessChatSettings({ businessId }: BusinessChatSettingsProps) {
  const {
    config,
    isLoading,
    updateProfessionalChat,
    isPendingProfessionalChat,
    updateLocationChatAdmin,
    isPendingLocationAdmin,
  } = useBusinessChatConfig(businessId)

  const { data: candidates = [], isLoading: isLoadingCandidates } =
    useChatAdminCandidates(businessId)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Toggle global ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ChatText className="h-5 w-5 text-primary" weight="duotone" />
            Chat con profesionales
          </CardTitle>
          <CardDescription>
            Controla si los clientes pueden iniciar conversaciones directamente con los
            profesionales del negocio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionGate
            permission="settings.edit_business"
            businessId={businessId}
            mode="disable"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">
                  Permitir chat con profesionales
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {config.allow_professional_chat
                    ? 'Activado — los clientes pueden chatear con cualquier profesional disponible'
                    : 'Desactivado — los clientes solo pueden chatear con el admin asignado a la sede'}
                </p>
              </div>
              <Switch
                checked={config.allow_professional_chat}
                disabled={isPendingProfessionalChat}
                onCheckedChange={(checked) => updateProfessionalChat(checked)}
              />
            </div>
          </PermissionGate>
        </CardContent>
      </Card>

      {/* ── Admin de chat por sede ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-primary" weight="duotone" />
            Admin de chat por sede
          </CardTitle>
          <CardDescription>
            Asigna un administrador de chat para cada sede. Solo pueden ser asignados
            usuarios con rol de Propietario o Administrador. Si no se asigna ninguno,
            el sistema usa el propietario del negocio como fallback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.locations.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay sedes activas configuradas.</p>
          )}

          {config.locations.map((loc, index) => (
            <div key={loc.location_id}>
              {index > 0 && <Separator className="mb-4" />}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{loc.location_name}</span>
                </div>
                <PermissionGate
                  permission="settings.edit_business"
                  businessId={businessId}
                  mode="disable"
                >
                  <div className="w-full sm:w-64">
                    <Select
                      value={loc.chat_admin_id ?? 'none'}
                      disabled={isPendingLocationAdmin || isLoadingCandidates}
                      onValueChange={(value) =>
                        updateLocationChatAdmin({
                          locationId: loc.location_id,
                          adminId: value === 'none' ? null : value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <SelectValue placeholder="Usar propietario (por defecto)" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">
                            Usar propietario (por defecto)
                          </span>
                        </SelectItem>
                        {candidates.map((c) => (
                          <SelectItem key={c.user_id} value={c.user_id}>
                            <div className="flex flex-col">
                              <span>{c.full_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {c.role_label}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </PermissionGate>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

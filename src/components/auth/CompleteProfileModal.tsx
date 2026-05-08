import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DocumentTypeSelect } from '@/components/catalog/DocumentTypeSelect'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import { Phone, IdentificationCard, ShieldCheck } from '@phosphor-icons/react'

interface CompleteProfileModalProps {
  userId: string
  missingFields: {
    phone: boolean
    documentType: boolean
    documentNumber: boolean
  }
  onComplete: () => void
}

export function CompleteProfileModal({ userId, missingFields, onComplete }: Readonly<CompleteProfileModalProps>) {
  const { t } = useLanguage()
  const [phone, setPhone] = useState('')
  const [documentTypeId, setDocumentTypeId] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [saving, setSaving] = useState(false)

  const needsDocument = missingFields.documentType || missingFields.documentNumber

  const handleSave = async () => {
    if (missingFields.phone && !phone.trim()) {
      toast.error(t('auth.phonePlaceholder') || 'Ingresa tu número de teléfono')
      return
    }
    if (needsDocument && (!documentTypeId || !documentNumber.trim())) {
      toast.error('Ingresa tu tipo y número de documento')
      return
    }

    setSaving(true)
    try {
      const updates: Record<string, string | null> = {}
      if (missingFields.phone && phone) updates.phone = phone.trim()
      if (needsDocument) {
        if (documentTypeId) updates.document_type_id = documentTypeId
        if (documentNumber) updates.document_number = documentNumber.trim()
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('profiles') as any)
        .update(updates)
        .eq('id', userId)

      if (error) throw error

      toast.success('¡Perfil completado!')
      onComplete()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open modal>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-full bg-primary/10">
              <ShieldCheck size={22} className="text-primary" />
            </div>
            <DialogTitle className="text-lg">
              {t('auth.completeProfileTitle') || 'Completa tu perfil'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {t('auth.completeProfileDesc') || 'Para continuar necesitamos algunos datos adicionales requeridos por la normativa colombiana de facturación electrónica (DIAN).'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {missingFields.phone && (
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="tel"
                placeholder={t('auth.phonePlaceholder') || 'Teléfono (ej: 300 123 4567)'}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          )}

          {needsDocument && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {t('auth.identityDocumentLabel') || 'Documento de identidad'}
              </p>
              <div className="flex gap-2">
                <div className="w-2/5">
                  <DocumentTypeSelect
                    countryId="CO"
                    forCompany={false}
                    value={documentTypeId}
                    onChange={setDocumentTypeId}
                    placeholder={t('auth.documentTypePlaceholder') || 'Tipo'}
                    required
                    className="h-11"
                  />
                </div>
                <div className="relative flex-1">
                  <IdentificationCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder={t('auth.documentNumberPlaceholder') || 'N.° de documento'}
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            {t('auth.documentPrivacyNote') || 'Estos datos se almacenan de forma segura y solo se usan para emisión de facturas electrónicas según la Ley 1581/2012.'}
          </p>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Guardando...' : (t('common.actions.save') || 'Guardar y continuar')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Receipt, Spinner } from '@phosphor-icons/react'

interface EmitInvoiceButtonProps {
  businessId: string
  appointmentId?: string
  transactionId?: string
  clientId?: string
  clientName?: string
  clientDocType?: string
  clientDocNumber?: string
  clientEmail?: string
  items: Array<{ description: string; quantity: number; unitPrice: number; taxRate?: number }>
  subtotal: number
  taxAmount: number
  total: number
  notes?: string
  onSuccess?: (invoiceId: string) => void
  size?: 'sm' | 'default'
  variant?: 'default' | 'outline' | 'ghost'
}

export function EmitInvoiceButton({
  businessId,
  appointmentId,
  transactionId,
  clientId,
  clientName,
  clientDocType,
  clientDocNumber,
  clientEmail,
  items,
  subtotal,
  taxAmount,
  total,
  notes,
  onSuccess,
  size = 'sm',
  variant = 'outline',
}: Readonly<EmitInvoiceButtonProps>) {
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleEmit = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('emit-electronic-invoice', {
        body: {
          businessId,
          appointmentId,
          transactionId,
          clientId,
          clientName,
          clientDocType,
          clientDocNumber,
          clientEmail,
          items,
          subtotal,
          taxAmount,
          total,
          notes,
        },
      })

      if (error || data?.error) {
        throw new Error(data?.error ?? error?.message ?? 'Error al emitir factura')
      }

      if (data?.alreadyExists) {
        toast.info('Ya existe una factura para este registro')
        return
      }

      toast.success('Factura electrónica emitida')
      void queryClient.invalidateQueries({ queryKey: ['electronic-invoices', businessId] })
      onSuccess?.(data.invoiceId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al emitir factura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PermissionGate permission="billing.emit_invoice" businessId={businessId} mode="hide">
      <Button variant={variant} size={size} onClick={handleEmit} disabled={loading} className="gap-1.5">
        {loading ? <Spinner size={14} className="animate-spin" /> : <Receipt size={14} />}
        {loading ? 'Emitiendo...' : 'Emitir factura'}
      </Button>
    </PermissionGate>
  )
}

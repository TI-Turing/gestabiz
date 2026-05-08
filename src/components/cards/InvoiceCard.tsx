import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  FileText,
  ArrowCounterClockwise,
  Download,
  Spinner,
} from '@phosphor-icons/react'

interface ElectronicInvoice {
  id: string
  business_id: string
  appointment_id: string | null
  transaction_id: string | null
  client_id: string | null
  document_type: 'invoice' | 'pos' | 'credit_note'
  document_number: number
  prefix: string | null
  cufe: string | null
  cude: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'failed_permanent' | 'cancelled'
  xml_storage_path: string | null
  pdf_storage_path: string | null
  error_message: string | null
  issued_at: string
  created_at: string
  parent_invoice_id: string | null
}

interface InvoiceCardProps {
  invoiceId: string
  businessId: string
  initialData?: ElectronicInvoice
  onRetry?: (invoiceId: string) => void
  onEmitCreditNote?: (invoiceId: string) => void
  readOnly?: boolean
}

const STATUS_BADGE: Record<ElectronicInvoice['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  accepted: { label: 'Aceptada', variant: 'default' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
  failed_permanent: { label: 'Error', variant: 'destructive' },
  cancelled: { label: 'Anulada', variant: 'outline' },
}

const DOC_TYPE_LABEL: Record<ElectronicInvoice['document_type'], string> = {
  invoice: 'Factura de venta',
  pos: 'Documento POS',
  credit_note: 'Nota crédito',
}

export function InvoiceCard({
  invoiceId,
  businessId,
  initialData,
  onRetry,
  onEmitCreditNote,
  readOnly = false,
}: Readonly<InvoiceCardProps>) {
  const { t } = useLanguage()

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const { data } = await (supabase.from('electronic_invoices') as unknown as {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            single: () => Promise<{ data: ElectronicInvoice | null }>
          }
        }
      })
        .select('*')
        .eq('id', invoiceId)
        .single()
      return data
    },
    initialData,
    staleTime: 1000 * 30,
  })

  const handleDownload = async (pathKey: 'xml_storage_path' | 'pdf_storage_path') => {
    if (!invoice?.[pathKey]) return
    const { data } = await supabase.storage
      .from('electronic-invoices')
      .createSignedUrl(invoice[pathKey]!, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-4 flex items-center gap-2 text-muted-foreground text-sm">
          <Spinner size={16} className="animate-spin" />
          Cargando factura...
        </CardContent>
      </Card>
    )
  }

  if (!invoice) return null

  const docNum = invoice.prefix
    ? `${invoice.prefix}${invoice.document_number}`
    : String(invoice.document_number)
  const badge = STATUS_BADGE[invoice.status]
  const issuedDate = new Date(invoice.issued_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted mt-0.5">
              <FileText size={16} className="text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium font-mono">{docNum}</span>
                <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                <span className="text-xs text-muted-foreground">{DOC_TYPE_LABEL[invoice.document_type]}</span>
              </div>
              <p className="text-xs text-muted-foreground">{issuedDate}</p>
              {invoice.cufe && (
                <p className="text-xs text-muted-foreground font-mono truncate max-w-xs" title={invoice.cufe}>
                  CUFE: {invoice.cufe.slice(0, 20)}…
                </p>
              )}
              {invoice.error_message && invoice.status !== 'accepted' && (
                <p className="text-xs text-destructive mt-1 max-w-sm truncate" title={invoice.error_message}>
                  {invoice.error_message}
                </p>
              )}
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-1 shrink-0">
              {invoice.status === 'accepted' && (
                <>
                  {invoice.pdf_storage_path && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload('pdf_storage_path')} title="Descargar PDF">
                      <Download size={14} />
                    </Button>
                  )}
                  {invoice.xml_storage_path && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload('xml_storage_path')} title="Descargar XML">
                      <FileText size={14} />
                    </Button>
                  )}
                  {invoice.document_type !== 'credit_note' && !invoice.parent_invoice_id && onEmitCreditNote && (
                    <PermissionGate permission="billing.emit_credit_note" businessId={businessId} mode="hide">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onEmitCreditNote(invoiceId)}>
                        Anular con NC
                      </Button>
                    </PermissionGate>
                  )}
                </>
              )}
              {(invoice.status === 'rejected' || invoice.status === 'failed_permanent') && onRetry && (
                <PermissionGate permission="billing.emit_invoice" businessId={businessId} mode="hide">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => onRetry(invoiceId)}>
                    <ArrowCounterClockwise size={12} />
                    Reintentar
                  </Button>
                </PermissionGate>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { InvoiceCard } from '@/components/cards/InvoiceCard'
import { toast } from 'sonner'
import {
  MagnifyingGlass,
  Funnel,
  FileText,
  Spinner,
} from '@phosphor-icons/react'

type InvoiceStatus = 'all' | 'pending' | 'accepted' | 'rejected' | 'cancelled'
type DocTypeFilter = 'all' | 'invoice' | 'pos' | 'credit_note'

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

interface InvoicesHistoryPageProps {
  businessId: string
}

const STATUS_FILTER_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'accepted', label: 'Aceptadas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'cancelled', label: 'Anuladas' },
]

const DOC_TYPE_OPTIONS: { value: DocTypeFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'invoice', label: 'Facturas' },
  { value: 'pos', label: 'POS' },
  { value: 'credit_note', label: 'Notas crédito' },
]

export function InvoicesHistoryPage({ businessId }: Readonly<InvoicesHistoryPageProps>) {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>('all')
  const [docTypeFilter, setDocTypeFilter] = useState<DocTypeFilter>('all')
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['electronic-invoices', businessId, statusFilter, docTypeFilter],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = (supabase.from('electronic_invoices') as any)
        .select('*')
        .eq('business_id', businessId)

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)
      if (docTypeFilter !== 'all') query = query.eq('document_type', docTypeFilter)

      const { data } = await query
        .order('issued_at', { ascending: false })
        .limit(100)

      return (data as ElectronicInvoice[]) ?? []
    },
    staleTime: 1000 * 30,
  })

  const filtered = search.trim()
    ? invoices.filter(inv => {
        const doc = inv.prefix ? `${inv.prefix}${inv.document_number}` : String(inv.document_number)
        return doc.toLowerCase().includes(search.toLowerCase())
          || (inv.cufe ?? '').toLowerCase().includes(search.toLowerCase())
      })
    : invoices

  const handleRetry = async (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId)
    if (!inv) return
    try {
      const { data, error } = await supabase.functions.invoke('emit-electronic-invoice', {
        body: {
          businessId,
          appointmentId: inv.appointment_id,
          transactionId: inv.transaction_id,
          clientId: inv.client_id,
          items: [],
          subtotal: 0,
          taxAmount: 0,
          total: 0,
        },
      })
      if (error || data?.error) throw new Error(data?.error ?? error?.message)
      toast.success('Reintento enviado')
      void queryClient.invalidateQueries({ queryKey: ['electronic-invoices', businessId] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al reintentar')
    }
  }

  const acceptedCount = invoices.filter(i => i.status === 'accepted').length
  const pendingCount = invoices.filter(i => i.status === 'pending').length
  const rejectedCount = invoices.filter(i => i.status === 'rejected' || i.status === 'failed_permanent').length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Aceptadas', count: acceptedCount, color: 'text-green-600' },
          { label: 'Pendientes', count: pendingCount, color: 'text-amber-600' },
          { label: 'Rechazadas', count: rejectedCount, color: 'text-red-600' },
        ].map(({ label, count, color }) => (
          <Card key={label}>
            <CardContent className="py-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Funnel size={16} />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número o CUFE..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1">
              {STATUS_FILTER_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={statusFilter === opt.value ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => setStatusFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              {DOC_TYPE_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={docTypeFilter === opt.value ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => setDocTypeFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Spinner size={20} className="animate-spin mr-2" />
          Cargando facturas...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="p-3 rounded-full bg-muted">
            <FileText size={24} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">Sin facturas</p>
            <p className="text-xs text-muted-foreground">
              {search ? 'No se encontraron facturas con ese criterio.' : 'Aún no has emitido facturas electrónicas.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(inv => (
            <InvoiceCard
              key={inv.id}
              invoiceId={inv.id}
              businessId={businessId}
              initialData={inv}
              onRetry={handleRetry}
            />
          ))}
          {filtered.length >= 100 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Mostrando los 100 más recientes
            </p>
          )}
        </div>
      )}
    </div>
  )
}

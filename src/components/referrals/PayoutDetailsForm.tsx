import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { payoutDetailsSchema, type PayoutDetailsFormValues } from '@/lib/referrals/schemas'
import type { UserPayoutDetails } from '@/hooks/usePayoutDetails'

interface PayoutDetailsFormProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  isSaving: boolean
  defaultValues?: UserPayoutDetails | null
  onSubmit: (values: PayoutDetailsFormValues) => Promise<void>
}

const DOCUMENT_TYPES = [
  { value: 'CC',  label: 'Cédula de Ciudadanía (CC)' },
  { value: 'CE',  label: 'Cédula de Extranjería (CE)' },
  { value: 'PPT', label: 'Permiso de Permanencia (PPT)' },
  { value: 'PAS', label: 'Pasaporte (PAS)' },
  { value: 'NIT', label: 'NIT Empresa' },
]

const COLOMBIAN_BANKS = [
  'Bancolombia',
  'Banco de Bogotá',
  'Davivienda',
  'BBVA Colombia',
  'Banco de Occidente',
  'Banco Popular',
  'Scotiabank Colpatria',
  'AV Villas',
  'Banco Agrario de Colombia',
  'Banco Caja Social',
  'Banco Falabella',
  'Banco Finandina',
  'Banco GNB Sudameris',
  'Banco Itaú',
  'Banco Mundo Mujer',
  'Banco Pichincha',
  'Banco Santander de Negocios Colombia',
  'Banco Serfinanza',
  'Banco W',
  'Bancamía',
  'Bancoomeva',
  'BancoProcredit',
  'Citibank Colombia',
  'Confiar Cooperativa Financiera',
  'Cooperativa Financiera de Antioquia (CFA)',
  'Coopcentral',
  'Coofinep Cooperativa Financiera',
  'Credifamilia',
  'Daviplata',
  'Financiera Dann Regional',
  'Fincomercio',
  'Finantel',
  'IRIS (Movii)',
  'JFK Cooperativa Financiera',
  'Lulo Bank',
  'Nequi',
  'Nubank Colombia',
  'Pibank',
  'Rappipay',
  'Ualá Colombia',
]

export function PayoutDetailsForm({
  isOpen,
  onClose,
  onSaved,
  isSaving,
  defaultValues,
  onSubmit,
}: PayoutDetailsFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<PayoutDetailsFormValues>({
    resolver: zodResolver(payoutDetailsSchema),
    defaultValues: {
      full_name:       defaultValues?.full_name       ?? '',
      document_type:   (defaultValues?.document_type  as PayoutDetailsFormValues['document_type']) ?? 'CC',
      document_number: defaultValues?.document_number ?? '',
      mp_email:        defaultValues?.mp_email        ?? '',
      bank_name:       defaultValues?.bank_name       ?? '',
      bank_account:    defaultValues?.bank_account    ?? '',
      account_type:    (defaultValues?.account_type   as PayoutDetailsFormValues['account_type']) ?? undefined,
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        full_name:       defaultValues?.full_name       ?? '',
        document_type:   (defaultValues?.document_type  as PayoutDetailsFormValues['document_type']) ?? 'CC',
        document_number: defaultValues?.document_number ?? '',
        mp_email:        defaultValues?.mp_email        ?? '',
        bank_name:       defaultValues?.bank_name       ?? '',
        bank_account:    defaultValues?.bank_account    ?? '',
        account_type:    (defaultValues?.account_type   as PayoutDetailsFormValues['account_type']) ?? undefined,
      })
    }
  }, [isOpen])

  const handleFormSubmit = async (values: PayoutDetailsFormValues) => {
    await onSubmit(values)
    onSaved()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configura tus datos de pago</DialogTitle>
          <DialogDescription>
            Necesitamos estos datos para transferirte las comisiones por referrals vía MercadoPago.
            Solo los necesitas configurar una vez.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Nombre completo */}
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nombre completo *</Label>
            <Input
              id="full_name"
              placeholder="Como aparece en tu documento"
              {...register('full_name')}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          {/* Tipo + número de documento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de documento *</Label>
              <Select
                defaultValue={defaultValues?.document_type ?? 'CC'}
                onValueChange={(v) => setValue('document_type', v as PayoutDetailsFormValues['document_type'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.document_type && (
                <p className="text-xs text-destructive">{errors.document_type.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="document_number">Número de documento *</Label>
              <Input
                id="document_number"
                placeholder="Ej: 1234567890"
                {...register('document_number')}
              />
              {errors.document_number && (
                <p className="text-xs text-destructive">{errors.document_number.message}</p>
              )}
            </div>
          </div>

          {/* Email MercadoPago */}
          <div className="space-y-1.5">
            <Label htmlFor="mp_email">Email de MercadoPago *</Label>
            <Input
              id="mp_email"
              type="email"
              placeholder="tu@email.com"
              {...register('mp_email')}
            />
            <p className="text-xs text-muted-foreground">
              Las comisiones se enviarán a esta cuenta de MercadoPago.
            </p>
            {errors.mp_email && (
              <p className="text-xs text-destructive">{errors.mp_email.message}</p>
            )}
          </div>

          {/* Datos bancarios (opcionales) */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">
              Datos bancarios opcionales (para registro interno):
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Banco</Label>
                <Controller
                  name="bank_name"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un banco" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {COLOMBIAN_BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Tipo de cuenta</Label>
                <Select
                  defaultValue={defaultValues?.account_type ?? undefined}
                  onValueChange={(v) => setValue('account_type', v as 'savings' | 'checking')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Ahorros</SelectItem>
                    <SelectItem value="checking">Corriente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5 mt-3">
              <Label htmlFor="bank_account">Número de cuenta</Label>
              <Input
                id="bank_account"
                placeholder="Últimos 4 dígitos suficientes"
                {...register('bank_account')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar y continuar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

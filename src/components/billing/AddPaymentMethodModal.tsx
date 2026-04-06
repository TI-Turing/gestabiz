/**
 * AddPaymentMethodModal Component
 *
 * Con MercadoPago Checkout Pro, los datos de pago se recopilan directamente
 * durante el flujo de checkout — no existe un "método de pago guardado" separado.
 * Este modal informa al usuario cómo actualizar/cambiar su método de pago.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CreditCard, Info, ShieldCheck } from 'lucide-react'

interface AddPaymentMethodModalProps {
  businessId: string
  onClose: () => void
  onSuccess: () => void
}

export function AddPaymentMethodModal({
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  businessId: _businessId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSuccess: _onSuccess,
}: Readonly<AddPaymentMethodModalProps>) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Método de Pago
          </DialogTitle>
          <DialogDescription>
            Cómo funciona el pago con MercadoPago
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">
                  Pago gestionado por MercadoPago
                </p>
                <p className="text-sm text-blue-800">
                  Los datos de tarjeta o cuenta bancaria se ingresan directamente
                  en el checkout seguro de MercadoPago cada vez que realizas un pago.
                  No almacenamos datos de pago en nuestros servidores.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  ¿Cómo cambiar el método de pago?
                </p>
                <p className="text-sm text-gray-700">
                  Al renovar o cambiar tu suscripción desde la sección de planes,
                  MercadoPago te ofrecerá ingresar nuevos datos de pago o usar
                  un método guardado en tu cuenta de MercadoPago.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

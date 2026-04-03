/**
 * @file PhoneRequiredModal.tsx
 * @description Modal bloqueante que exige al usuario registrar y verificar su número
 * de teléfono antes de poder usar el rol Empleado. No puede cerrarse hasta completar
 * el registro con verificación OTP vía SMS.
 */

import { ShieldAlert } from 'lucide-react'
import { PhoneVerificationModal } from '@/components/ui/PhoneVerificationModal'

// ─────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────

interface PhoneRequiredModalProps {
  userId:       string
  userName?:    string
  roleName?:    string
  description?: string
}

export function PhoneRequiredModal({ userId, userName, roleName = 'Empleado', description }: Readonly<PhoneRequiredModalProps>) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-sm space-y-6">

        {/* Encabezado */}
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-yellow-600" />
            </div>
          </div>
          <h2 className="text-lg font-semibold leading-tight">
            Número de teléfono requerido
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {userName ? `Hola ${userName.split(' ')[0]}, para` : 'Para'} usar el rol{' '}
            <strong>{roleName}</strong> debes tener un número de teléfono verificado.
            <br />
            {description ?? 'Los negocios lo utilizarán para contactarte.'}
          </p>
        </div>

        {/* Verificación OTP */}
        <PhoneVerificationModal
          userId={userId}
          submitLabel="Registrar teléfono y continuar"
          onSuccess={() => {
            globalThis.location.reload()
          }}
        />

      </div>
    </div>
  )
}

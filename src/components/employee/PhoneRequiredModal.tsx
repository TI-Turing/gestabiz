/**
 * @file PhoneRequiredModal.tsx
 * @description Modal bloqueante que exige al usuario registrar un número de teléfono
 * antes de poder usar el rol Empleado. No puede cerrarse hasta completar el registro.
 *
 * PENDIENTE: Implementar verificación de teléfono real (OTP vía SMS / WhatsApp) en lugar de
 * solo guardar el número sin validación. Ver sistema de notificaciones multicanal ya
 * disponible (Edge Function send-notification con canal SMS/WhatsApp).
 */

import { useState } from 'react'
import { Phone, Loader2, ShieldAlert } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// ─────────────────────────────────────────────
// Prefijos de país con imagen de bandera (flagcdn.com)
// ─────────────────────────────────────────────
interface CountryCode {
  code: string   // +57
  iso:  string   // CO (también es el path en flagcdn: co.png)
  name: string   // Colombia
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+57',  iso: 'CO', name: 'Colombia'        },
  { code: '+54',  iso: 'AR', name: 'Argentina'       },
  { code: '+55',  iso: 'BR', name: 'Brasil'          },
  { code: '+56',  iso: 'CL', name: 'Chile'           },
  { code: '+52',  iso: 'MX', name: 'México'          },
  { code: '+51',  iso: 'PE', name: 'Perú'            },
  { code: '+58',  iso: 'VE', name: 'Venezuela'       },
  { code: '+593', iso: 'EC', name: 'Ecuador'         },
  { code: '+591', iso: 'BO', name: 'Bolivia'         },
  { code: '+595', iso: 'PY', name: 'Paraguay'        },
  { code: '+598', iso: 'UY', name: 'Uruguay'         },
  { code: '+507', iso: 'PA', name: 'Panamá'          },
  { code: '+506', iso: 'CR', name: 'Costa Rica'      },
  { code: '+503', iso: 'SV', name: 'El Salvador'     },
  { code: '+502', iso: 'GT', name: 'Guatemala'       },
  { code: '+504', iso: 'HN', name: 'Honduras'        },
  { code: '+505', iso: 'NI', name: 'Nicaragua'       },
  { code: '+1',   iso: 'US', name: 'Estados Unidos'  },
  { code: '+1',   iso: 'CA', name: 'Canadá'          },
  { code: '+34',  iso: 'ES', name: 'España'          },
  { code: '+44',  iso: 'GB', name: 'Reino Unido'     },
  { code: '+49',  iso: 'DE', name: 'Alemania'        },
  { code: '+33',  iso: 'FR', name: 'Francia'         },
  { code: '+39',  iso: 'IT', name: 'Italia'          },
  { code: '+351', iso: 'PT', name: 'Portugal'        },
  { code: '+31',  iso: 'NL', name: 'Países Bajos'    },
  { code: '+61',  iso: 'AU', name: 'Australia'       },
  { code: '+81',  iso: 'JP', name: 'Japón'           },
  { code: '+86',  iso: 'CN', name: 'China'           },
  { code: '+91',  iso: 'IN', name: 'India'           },
]

/** Devuelve la URL de bandera de flagcdn.com para un ISO de 2 letras */
function flagUrl(iso: string): string {
  return `https://flagcdn.com/20x15/${iso.toLowerCase()}.png`
}

const DIGITS_REGEX = /^\d{6,14}$/

// ─────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────

interface PhoneRequiredModalProps {
  userId:      string
  userName?:   string
  roleName?:   string
  description?: string
}

export function PhoneRequiredModal({ userId, userName, roleName = 'Empleado', description }: Readonly<PhoneRequiredModalProps>) {
  const [countryIso, setCountryIso] = useState<string>('CO')
  const [number, setNumber]         = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const selected = COUNTRY_CODES.find((c) => c.iso === countryIso) ?? COUNTRY_CODES[0]

  const handleSave = async () => {
    const trimmed = number.replaceAll(' ', '')

    if (!trimmed) {
      setError('El número de teléfono es obligatorio.')
      return
    }

    if (!DIGITS_REGEX.test(trimmed)) {
      setError('Ingresa solo dígitos (6 – 14 números sin el indicativo).')
      return
    }

    const fullPhone = `${selected.code}${trimmed}`
    setSaving(true)
    setError(null)

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ phone: fullPhone })
      .eq('id', userId)

    if (dbError) {
      setError('No se pudo guardar el número. Intenta de nuevo.')
      setSaving(false)
      return
    }

    toast.success('Teléfono registrado correctamente')
    globalThis.location.reload()
  }

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
            <strong>{roleName}</strong> debes tener un número de teléfono registrado.
            <br />
            {description ?? 'Los negocios lo utilizarán para contactarte.'}
          </p>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Número de teléfono</Label>

            {/* Fila: selector de país + campo de número */}
            <div className="flex gap-2">
              {/* Selector de país */}
              <Select
                value={countryIso}
                onValueChange={(val) => {
                  setCountryIso(val)
                  if (error) setError(null)
                }}
                disabled={saving}
              >
                {/*
                  El trigger renderiza el emoji + código directamente (sin SelectValue)
                  para evitar que radix-ui muestre el valor interno (iso) en el botón.
                */}
                <SelectTrigger
                  className="w-[110px] shrink-0"
                  aria-label={`Prefijo: ${selected.name}`}
                >
                  <span className="flex items-center gap-1.5">
                    <img
                      src={flagUrl(selected.iso)}
                      alt={selected.name}
                      className="w-5 h-auto object-contain rounded-[2px]"
                    />
                    <span className="text-sm font-medium">{selected.code}</span>
                  </span>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {COUNTRY_CODES.map((c) => (
                    <SelectItem key={c.iso} value={c.iso}>
                      <span className="flex items-center gap-2">
                        <img
                          src={flagUrl(c.iso)}
                          alt={c.name}
                          className="w-5 h-auto object-contain rounded-[2px] shrink-0"
                        />
                        <span className="text-sm">{c.code}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[110px]">{c.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Número local */}
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="tel"
                  placeholder="300 123 4567"
                  value={number}
                  onChange={(e) => {
                    setNumber(e.target.value)
                    if (error) setError(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !saving && handleSave()}
                  className="pl-10"
                  autoFocus
                  disabled={saving}
                />
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              El número se guardará como{' '}
              <span className="font-medium">
                {selected.code} {number || '300 123 4567'}
              </span>
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || !number.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando…
              </>
            ) : (
              'Registrar teléfono y continuar'
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}

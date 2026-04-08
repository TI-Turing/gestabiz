/**
 * @file PhoneVerificationModal.tsx
 * @description Componente reutilizable de verificación de teléfono con OTP.
 * Muestra dos pasos inline: ingreso de número → ingreso del código OTP.
 * Usado en PhoneRequiredModal y en la configuración de perfil (UserProfile).
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Phone, ArrowRight, RotateCcw, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
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

// ─── Tipos de países (banderas + prefijos) ────────────────────────────────────

interface CountryCode {
  code: string
  iso:  string
  name: string
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+57',  iso: 'CO', name: 'Colombia'       },
  { code: '+54',  iso: 'AR', name: 'Argentina'      },
  { code: '+55',  iso: 'BR', name: 'Brasil'         },
  { code: '+56',  iso: 'CL', name: 'Chile'          },
  { code: '+52',  iso: 'MX', name: 'México'         },
  { code: '+51',  iso: 'PE', name: 'Perú'           },
  { code: '+58',  iso: 'VE', name: 'Venezuela'      },
  { code: '+593', iso: 'EC', name: 'Ecuador'        },
  { code: '+591', iso: 'BO', name: 'Bolivia'        },
  { code: '+595', iso: 'PY', name: 'Paraguay'       },
  { code: '+598', iso: 'UY', name: 'Uruguay'        },
  { code: '+507', iso: 'PA', name: 'Panamá'         },
  { code: '+506', iso: 'CR', name: 'Costa Rica'     },
  { code: '+503', iso: 'SV', name: 'El Salvador'    },
  { code: '+502', iso: 'GT', name: 'Guatemala'      },
  { code: '+504', iso: 'HN', name: 'Honduras'       },
  { code: '+505', iso: 'NI', name: 'Nicaragua'      },
  { code: '+1',   iso: 'US', name: 'Estados Unidos' },
  { code: '+1',   iso: 'CA', name: 'Canadá'         },
  { code: '+34',  iso: 'ES', name: 'España'         },
  { code: '+44',  iso: 'GB', name: 'Reino Unido'    },
  { code: '+49',  iso: 'DE', name: 'Alemania'       },
  { code: '+33',  iso: 'FR', name: 'Francia'        },
  { code: '+39',  iso: 'IT', name: 'Italia'         },
  { code: '+351', iso: 'PT', name: 'Portugal'       },
  { code: '+31',  iso: 'NL', name: 'Países Bajos'   },
  { code: '+61',  iso: 'AU', name: 'Australia'      },
  { code: '+81',  iso: 'JP', name: 'Japón'          },
  { code: '+86',  iso: 'CN', name: 'China'          },
  { code: '+91',  iso: 'IN', name: 'India'          },
]

function flagUrl(iso: string): string {
  return `https://flagcdn.com/20x15/${iso.toLowerCase()}.png`
}

const LOCAL_DIGITS_REGEX = /^\d{6,14}$/
const OTP_LENGTH = 4
const RESEND_COOLDOWN_SEC = 60

// ─── Props ────────────────────────────────────────────────────────────────────

interface PhoneVerificationProps {
  userId:        string
  onSuccess:     (verifiedPhone: string) => void
  onCancel?:     () => void
  /** Teléfono prerellenado en formato E.164, ej: "+573001234567" */
  initialPhone?: string
  /** Texto del botón en la pantalla de teléfono. Default: "Enviar código por WhatsApp" */
  submitLabel?:  string
}

// ─── Componente ───────────────────────────────────────────────────────────────

type Step = 'phone_input' | 'otp_input' | 'verified'

export function PhoneVerificationModal({
  userId,
  onSuccess,
  onCancel,
  initialPhone,
  submitLabel = 'Enviar código por WhatsApp',
}: Readonly<PhoneVerificationProps>) {

  // ── Parsear teléfono inicial ──────────────────────────────────────────────

  const parseInitialPhone = (): { iso: string; local: string } => {
    if (!initialPhone) return { iso: 'CO', local: '' }
    for (const c of COUNTRY_CODES.sort((a, b) => b.code.length - a.code.length)) {
      if (initialPhone.startsWith(c.code)) {
        return { iso: c.iso, local: initialPhone.slice(c.code.length) }
      }
    }
    return { iso: 'CO', local: initialPhone.replace(/^\+/, '') }
  }

  const initial = parseInitialPhone()

  // ── Estado ────────────────────────────────────────────────────────────────

  const [step, setStep]             = useState<Step>('phone_input')
  const [countryIso, setCountryIso] = useState(initial.iso)
  const [localNumber, setLocalNumber] = useState(initial.local)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [otpError, setOtpError]     = useState<string | null>(null)
  const [sending, setSending]       = useState(false)
  const [verifying, setVerifying]   = useState(false)
  const [otpDigits, setOtpDigits]   = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [countdown, setCountdown]   = useState(0)
  const [confirmedPhone, setConfirmedPhone] = useState('')

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(OTP_LENGTH).fill(null))
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const selected = COUNTRY_CODES.find((c) => c.iso === countryIso) ?? COUNTRY_CODES[0]
  const fullPhone = `${selected.code}${localNumber.trim()}`

  // ── Countdown ─────────────────────────────────────────────────────────────

  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN_SEC)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // ── Enviar OTP ────────────────────────────────────────────────────────────

  const handleSendOtp = async () => {
    const trimmed = localNumber.replaceAll(' ', '')
    if (!trimmed) {
      setPhoneError('El número de teléfono es obligatorio.')
      return
    }
    if (!LOCAL_DIGITS_REGEX.test(trimmed)) {
      setPhoneError('Ingresa solo dígitos (6 – 14 números sin el indicativo).')
      return
    }

    setSending(true)
    setPhoneError(null)

    try {
      const { data, error } = await supabase.functions.invoke('send-phone-otp', {
        body: { userId, phone: fullPhone },
      })

      if (error) throw error

      if (!data?.success) {
        setPhoneError(data?.error ?? 'No se pudo enviar el código. Intenta de nuevo.')
        return
      }

      // Modo DEV: el código viene en la respuesta (WhatsApp no configurado)
      if (data.dev_code) {
        toast.info(`[DEV] Código WhatsApp: ${data.dev_code}`)
      }

      setConfirmedPhone(fullPhone)
      setStep('otp_input')
      setOtpDigits(Array(OTP_LENGTH).fill(''))
      setOtpError(null)
      startCountdown()

      // Foco en el primer input del OTP
      setTimeout(() => inputRefs.current[0]?.focus(), 100)

    } catch (err) {
      setPhoneError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  // ── Escribir en las cajitas OTP ───────────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otpDigits]
    next[index] = digit
    setOtpDigits(next)
    setOtpError(null)

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    e.preventDefault()
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((d, i) => { next[i] = d })
    setOtpDigits(next)
    setOtpError(null)
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    setTimeout(() => inputRefs.current[focusIdx]?.focus(), 0)
  }

  // ── Verificar OTP ─────────────────────────────────────────────────────────

  const handleVerify = async () => {
    const code = otpDigits.join('')
    if (code.length < OTP_LENGTH) {
      setOtpError('Ingresa los 4 dígitos del código.')
      return
    }

    setVerifying(true)
    setOtpError(null)

    try {
      const { data, error } = await supabase.functions.invoke('verify-phone-otp', {
        body: { userId, code, phone: confirmedPhone },
      })

      if (error) throw error

      if (!data?.success) {
        if (data?.expired) {
          setOtpError('El código expiró.')
        } else if (data?.maxAttempts) {
          setOtpError('Demasiados intentos. Solicita un nuevo código.')
          setStep('phone_input')
        } else {
          setOtpError(data?.error ?? 'Código incorrecto.')
        }
        return
      }

      // Éxito
      setStep('verified')
      toast.success('Teléfono verificado correctamente')
      onSuccess(confirmedPhone)

    } catch {
      setOtpError('Error de conexión. Intenta de nuevo.')
    } finally {
      setVerifying(false)
    }
  }

  // ── Reenviar OTP ──────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (countdown > 0) return
    setOtpDigits(Array(OTP_LENGTH).fill(''))
    setOtpError(null)
    setSending(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-phone-otp', {
        body: { userId, phone: confirmedPhone },
      })
      if (error) throw error
      if (!data?.success) {
        setOtpError(data?.error ?? 'No se pudo reenviar.')
        return
      }
      if (data.dev_code) toast.info(`[DEV] Nuevo código WhatsApp: ${data.dev_code}`)
      toast.success('Código reenviado')
      startCountdown()
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch {
      setOtpError('Error al reenviar el código.')
    } finally {
      setSending(false)
    }
  }

  // ── Renders por paso ──────────────────────────────────────────────────────

  if (step === 'verified') {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <p className="text-sm font-medium text-center text-foreground">Teléfono verificado</p>
        <p className="text-xs text-muted-foreground text-center">{confirmedPhone}</p>
      </div>
    )
  }

  if (step === 'otp_input') {
    return (
      <div className="space-y-5">

        {/* Encabezado paso 2 */}
        <div className="text-center space-y-1">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-sm font-medium text-foreground">Código enviado por WhatsApp a</p>
          <p className="text-sm text-muted-foreground font-mono">{confirmedPhone}</p>
          <button
            type="button"
            onClick={() => { setStep('phone_input'); setOtpError(null) }}
            className="text-xs text-primary hover:underline mt-1"
          >
            Cambiar número
          </button>
        </div>

        {/* Cajitas OTP */}
        <div className="space-y-2">
          <Label className="text-sm font-medium block text-center">Ingresa el código de 4 dígitos</Label>
          <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                disabled={verifying}
                className={[
                  'w-11 h-12 text-center text-xl font-bold rounded-lg border-2 bg-background',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all',
                  otpError ? 'border-destructive' : digit ? 'border-primary' : 'border-border',
                  verifying ? 'opacity-50 cursor-not-allowed' : '',
                ].filter(Boolean).join(' ')}
                aria-label={`Dígito ${i + 1} del código`}
              />
            ))}
          </div>
          {otpError && (
            <p className="text-xs text-destructive text-center mt-1">{otpError}</p>
          )}
        </div>

        {/* Botón verificar */}
        <Button
          className="w-full"
          onClick={handleVerify}
          disabled={verifying || otpDigits.join('').length < OTP_LENGTH}
        >
          {verifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Verificar
            </>
          )}
        </Button>

        {/* Reenviar */}
        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-xs text-muted-foreground">
              Puedes reenviar el código en{' '}
              <span className="font-semibold text-foreground tabular-nums">{countdown}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={sending}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RotateCcw className="w-3 h-3" />
              )}
              Reenviar código
            </button>
          )}
        </div>

        {/* Cancelar */}
        {onCancel && (
          <Button variant="ghost" className="w-full text-sm" onClick={onCancel} disabled={verifying}>
            Cancelar
          </Button>
        )}
      </div>
    )
  }

  // Paso 1: ingreso de teléfono
  return (
    <div className="space-y-4">

      <div className="space-y-2">
        <Label className="text-sm font-medium">Número de teléfono</Label>

        <div className="flex gap-2">
          {/* Selector de país */}
          <Select
            value={countryIso}
            onValueChange={(val) => { setCountryIso(val); setPhoneError(null) }}
            disabled={sending}
          >
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
              inputMode="numeric"
              placeholder="300 123 4567"
              value={localNumber}
              onChange={(e) => {
                setLocalNumber(e.target.value.replace(/[^\d\s-()]/g, ''))
                if (phoneError) setPhoneError(null)
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendOtp() }}
              disabled={sending}
              className="pl-10"
              aria-label="Número local sin indicativo"
            />
          </div>
        </div>

        {phoneError && (
          <p className="text-xs text-destructive">{phoneError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Número sin el indicativo del país. Ej: 300 123 4567
        </p>
      </div>

      <Button
        className="w-full"
        onClick={handleSendOtp}
        disabled={sending || !localNumber.trim()}
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enviando…
          </>
        ) : (
          <>
            <ArrowRight className="w-4 h-4 mr-2" />
            {submitLabel}
          </>
        )}
      </Button>

      {onCancel && (
        <Button variant="ghost" className="w-full text-sm" onClick={onCancel} disabled={sending}>
          Cancelar
        </Button>
      )}
    </div>
  )
}

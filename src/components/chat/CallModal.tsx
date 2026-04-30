import { useEffect, useRef, useState } from 'react'
import { Phone, PhoneX, Microphone, MicrophoneSlash } from '@phosphor-icons/react'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CallSession } from '@/types/types'
import type { CallState } from '@/hooks/useWebRTCCall'

interface CallModalProps {
  callState: CallState
  activeCall: CallSession | null
  callerName?: string
  callerAvatar?: string
  isMuted: boolean
  remoteStream: MediaStream | null
  onAnswer: () => void
  onReject: () => void
  onHangUp: () => void
  onToggleMute: () => void
}

function useCallTimer(active: boolean) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!active) { setElapsed(0); return }
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [active])
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function CallModal({
  callState,
  activeCall,
  callerName = 'Usuario',
  callerAvatar,
  isMuted,
  remoteStream,
  onAnswer,
  onReject,
  onHangUp,
  onToggleMute,
}: CallModalProps) {
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const timer = useCallTimer(callState === 'in-call')

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  if (callState === 'idle') return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
      <audio ref={remoteAudioRef} autoPlay playsInline aria-hidden />

      <div className={cn(
        'relative flex flex-col items-center gap-6 rounded-2xl p-8 shadow-2xl w-full max-w-sm mx-4',
        'bg-gradient-to-b from-slate-800 to-slate-900 text-white'
      )}>
        {/* Avatar */}
        <div className="relative">
          <ProfileAvatar
            src={callerAvatar}
            alt={callerName}
            fallbackText={callerName}
            size="xl"
            className="ring-4 ring-white/20"
          />
          {callState === 'ringing' && (
            <span className="absolute -inset-2 rounded-full border-2 border-white/30 animate-ping" />
          )}
        </div>

        {/* Nombre y estado */}
        <div className="text-center">
          <p className="text-xl font-semibold">{callerName}</p>
          <p className="text-sm text-white/60 mt-1">
            {callState === 'ringing' && !activeCall?.caller_id
              ? 'Llamada entrante...'
              : callState === 'ringing'
              ? 'Llamando...'
              : callState === 'in-call'
              ? timer
              : callState === 'ended'
              ? 'Llamada finalizada'
              : 'Llamada fallida'}
          </p>
        </div>

        {/* Controles según estado */}
        {callState === 'ringing' && !activeCall?.caller_id && (
          // Llamada entrante
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-1">
              <Button
                onClick={onReject}
                size="icon"
                className="h-14 w-14 rounded-full bg-destructive hover:bg-destructive/90"
                aria-label="Rechazar llamada"
              >
                <PhoneX size={24} weight="fill" />
              </Button>
              <span className="text-xs text-white/60">Rechazar</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Button
                onClick={onAnswer}
                size="icon"
                className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600"
                aria-label="Aceptar llamada"
              >
                <Phone size={24} weight="fill" />
              </Button>
              <span className="text-xs text-white/60">Aceptar</span>
            </div>
          </div>
        )}

        {(callState === 'ringing' && activeCall?.caller_id) && (
          // Llamada saliente
          <div className="flex flex-col items-center gap-1">
            <Button
              onClick={onHangUp}
              size="icon"
              className="h-14 w-14 rounded-full bg-destructive hover:bg-destructive/90"
              aria-label="Cancelar llamada"
            >
              <PhoneX size={24} weight="fill" />
            </Button>
            <span className="text-xs text-white/60">Cancelar</span>
          </div>
        )}

        {callState === 'in-call' && (
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <Button
                onClick={onToggleMute}
                size="icon"
                variant="ghost"
                className={cn(
                  'h-12 w-12 rounded-full border border-white/20 text-white',
                  isMuted ? 'bg-white/20' : 'bg-transparent'
                )}
                aria-label={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
              >
                {isMuted ? <MicrophoneSlash size={20} weight="fill" /> : <Microphone size={20} weight="fill" />}
              </Button>
              <span className="text-xs text-white/60">{isMuted ? 'Silenciado' : 'Micrófono'}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <Button
                onClick={onHangUp}
                size="icon"
                className="h-14 w-14 rounded-full bg-destructive hover:bg-destructive/90"
                aria-label="Colgar"
              >
                <PhoneX size={24} weight="fill" />
              </Button>
              <span className="text-xs text-white/60">Colgar</span>
            </div>
          </div>
        )}
        {(callState === 'failed' || callState === 'ended') && (
          <Button
            onClick={onHangUp}
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10 mt-2"
            aria-label="Cerrar"
          >
            Cerrar
          </Button>
        )}
      </div>
    </div>
  )
}

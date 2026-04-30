import { useRef } from 'react'
import { Microphone, MicrophoneSlash, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'

interface AudioRecorderProps {
  onAudioReady: (blob: Blob, duration: number, waveform: number[]) => void
  disabled?: boolean
}

export function AudioRecorder({ onAudioReady, disabled }: AudioRecorderProps) {
  const { state, duration, waveformData, startRecording, stopRecording, cancelRecording } =
    useAudioRecorder()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isRecording = state === 'recording'

  const handlePointerDown = async (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    buttonRef.current?.setPointerCapture(e.pointerId)
    await startRecording()
  }

  const handlePointerUp = async () => {
    if (!isRecording) return
    const result = await stopRecording()
    if (result) {
      onAudioReady(result.blob, result.duration, result.waveform)
    }
  }

  const handlePointerLeave = () => {
    if (isRecording) cancelRecording()
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 px-2">
        {/* Timer */}
        <span className="text-sm font-mono text-destructive tabular-nums min-w-[2.5rem]">
          {formatDuration(duration)}
        </span>

        {/* Mini waveform */}
        <div className="flex items-center gap-0.5 h-5 flex-1 max-w-[80px]">
          {waveformData.slice(-16).map((amp, i) => (
            <div
              key={i}
              className="flex-1 bg-destructive rounded-full transition-all duration-75"
              style={{ height: `${Math.max(15, amp * 100)}%` }}
            />
          ))}
        </div>

        {/* Cancel */}
        <button
          type="button"
          onClick={cancelRecording}
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted"
          title="Cancelar grabación"
          aria-label="Cancelar grabación"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Stop & Send */}
        <button
          ref={buttonRef}
          type="button"
          onPointerUp={handlePointerUp}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-destructive text-white"
          title="Soltar para enviar"
          aria-label="Soltar para enviar audio"
        >
          <Microphone size={18} weight="fill" />
        </button>
      </div>
    )
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      title="Mantén presionado para grabar audio"
      aria-label="Grabar nota de voz"
      className={cn(
        'flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-full',
        'hover:bg-muted transition-colors select-none touch-none',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {state === 'cancelled' ? (
        <MicrophoneSlash size={20} className="text-muted-foreground" />
      ) : (
        <Microphone size={20} className="text-muted-foreground" />
      )}
    </button>
  )
}

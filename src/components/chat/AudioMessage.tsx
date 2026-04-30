import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface AudioMessageProps {
  url: string
  duration: number
  waveform?: number[]
  isOwnMessage?: boolean
}

export function AudioMessage({ url, duration, waveform = [], isOwnMessage }: AudioMessageProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration)

  const BARS = 40
  const bars = waveform.length >= BARS
    ? waveform.slice(0, BARS)
    : [...waveform, ...Array(BARS - waveform.length).fill(0.2)]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onDuration = () => {
      // WebM/Opus from MediaRecorder often lacks duration metadata → audio.duration = Infinity
      // Infinity is truthy, so `audio.duration || duration` would silently keep Infinity.
      // Use the stored duration_seconds prop as fallback in that case.
      const d = audio.duration
      if (isFinite(d) && d > 0) setAudioDuration(d)
      // else: keep initial state (duration prop)
    }
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onDuration)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onDuration)
      audio.removeEventListener('ended', onEnded)
    }
  }, [duration])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      await audio.play()
      setIsPlaying(true)
    }
  }

  const handleBarClick = (index: number) => {
    const audio = audioRef.current
    if (!audio || !audioDuration) return
    audio.currentTime = (index / BARS) * audioDuration
  }

  const progress = audioDuration > 0 ? currentTime / audioDuration : 0

  const formatTime = (s: number) => {
    if (!isFinite(s) || isNaN(s) || s < 0) return '0:00'
    const m = Math.floor(s / 60)
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  const barActive = (i: number) => i / BARS <= progress

  return (
    <div className="flex items-center gap-2 min-w-[180px] max-w-[260px]">
      <audio ref={audioRef} src={url} preload="metadata" />

      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          'shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors',
          isOwnMessage
            ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
        )}
        aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
      >
        {isPlaying ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
      </button>

      {/* Waveform */}
      <div className="flex items-center gap-[1.5px] h-8 flex-1" role="slider" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        {bars.map((amp, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleBarClick(i)}
            className={cn(
              'flex-1 rounded-full transition-colors cursor-pointer',
              barActive(i)
                ? isOwnMessage ? 'bg-primary-foreground' : 'bg-primary'
                : isOwnMessage ? 'bg-primary-foreground/40' : 'bg-muted-foreground/40'
            )}
            style={{ height: `${Math.max(20, amp * 100)}%` }}
            aria-label={`Ir al ${Math.round((i / BARS) * 100)}%`}
          />
        ))}
      </div>

      <span className={cn(
        'text-xs tabular-nums shrink-0',
        isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
      )}>
        {formatTime(isPlaying ? currentTime : audioDuration)}
      </span>
    </div>
  )
}

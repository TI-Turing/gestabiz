/**
 * useAudioRecorder
 *
 * Graba audio usando MediaRecorder con codec opus (audio/webm;codecs=opus).
 * Captura amplitudes en tiempo real con AudioContext+AnalyserNode para
 * generar la forma de onda (waveform) de 40 puntos.
 *
 * Estados: 'idle' | 'recording' | 'cancelled'
 * Flujo hold-to-record:
 *   - onPointerDown → startRecording()
 *   - onPointerUp   → stopRecording() → onAudioReady(blob, duration, waveform)
 *   - onPointerLeave → cancelRecording()
 */

import { useState, useRef, useCallback } from 'react'

export type AudioRecorderState = 'idle' | 'recording' | 'cancelled'

export interface AudioRecorderResult {
  state: AudioRecorderState
  duration: number          // segundos grabados
  waveformData: number[]    // 40 amplitudes normalizadas [0..1]
  startRecording: () => Promise<void>
  stopRecording: () => Promise<{ blob: Blob; duration: number; waveform: number[] } | null>
  cancelRecording: () => void
}

const WAVEFORM_POINTS = 40
const MIME_TYPE = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
  ? 'audio/webm;codecs=opus'
  : 'audio/webm'

export function useAudioRecorder(): AudioRecorderResult {
  const [state, setState] = useState<AudioRecorderState>('idle')
  const [duration, setDuration] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const waveformSamplesRef = useRef<number[]>([])
  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number>(0)
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  // ── Capturar amplitudes de onda ──────────────────────────────────────────
  const captureWaveformFrame = useCallback(() => {
    if (!analyserRef.current || state !== 'recording') return

    const buffer = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteTimeDomainData(buffer)

    // RMS de la frame
    let sum = 0
    for (const val of buffer) {
      const normalized = (val - 128) / 128
      sum += normalized * normalized
    }
    const rms = Math.sqrt(sum / buffer.length)
    waveformSamplesRef.current.push(Math.min(1, rms * 4)) // amplificar para visualización

    // Mantener solo los últimos WAVEFORM_POINTS * 4 samples para downsample
    if (waveformSamplesRef.current.length > WAVEFORM_POINTS * 10) {
      waveformSamplesRef.current = waveformSamplesRef.current.slice(-WAVEFORM_POINTS * 10)
    }

    setWaveformData(downsampleWaveform(waveformSamplesRef.current, WAVEFORM_POINTS))
    animationFrameRef.current = requestAnimationFrame(captureWaveformFrame)
  }, [state])

  // ── Iniciar grabación ────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      cancelledRef.current = false
      chunksRef.current = []
      waveformSamplesRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Configurar AudioContext para waveform
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // MediaRecorder
      const recorder = new MediaRecorder(stream, { mimeType: MIME_TYPE })
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mediaRecorderRef.current = recorder
      recorder.start(100) // chunk cada 100ms

      startTimeRef.current = Date.now()
      setState('recording')

      // Timer de duración
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 500)

      // Captura de waveform
      animationFrameRef.current = requestAnimationFrame(captureWaveformFrame)
    } catch {
      setState('idle')
    }
  }, [captureWaveformFrame])

  // ── Limpiar recursos ─────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current)
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current)

    streamRef.current?.getTracks().forEach(t => t.stop())
    audioContextRef.current?.close()

    streamRef.current = null
    audioContextRef.current = null
    analyserRef.current = null
    mediaRecorderRef.current = null

    setDuration(0)
    setWaveformData([])
  }, [])

  // ── Detener y entregar audio ─────────────────────────────────────────────
  const stopRecording = useCallback(async (): Promise<{
    blob: Blob
    duration: number
    waveform: number[]
  } | null> => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return null

    return new Promise((resolve) => {
      recorder.onstop = () => {
        if (cancelledRef.current) {
          cleanup()
          setState('cancelled')
          resolve(null)
          return
        }

        const blob = new Blob(chunksRef.current, { type: MIME_TYPE })
        const elapsed = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000))
        const finalWaveform = downsampleWaveform(waveformSamplesRef.current, WAVEFORM_POINTS)

        cleanup()
        setState('idle')
        resolve({ blob, duration: elapsed, waveform: finalWaveform })
      }

      recorder.stop()
    })
  }, [cleanup])

  // ── Cancelar grabación ───────────────────────────────────────────────────
  const cancelRecording = useCallback(() => {
    cancelledRef.current = true
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    } else {
      cleanup()
      setState('idle')
    }
  }, [cleanup])

  return {
    state,
    duration,
    waveformData,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}

// ============================================================================
// HELPER
// ============================================================================

function downsampleWaveform(samples: number[], targetPoints: number): number[] {
  if (samples.length === 0) return []
  if (samples.length <= targetPoints) return samples

  const step = samples.length / targetPoints
  const result: number[] = []
  for (let i = 0; i < targetPoints; i++) {
    const start = Math.floor(i * step)
    const end = Math.min(Math.floor((i + 1) * step), samples.length)
    const chunk = samples.slice(start, end)
    const avg = chunk.reduce((a, b) => a + b, 0) / chunk.length
    result.push(avg)
  }
  return result
}

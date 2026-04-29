/**
 * useWebRTCCall
 *
 * Gestiona el ciclo de vida completo de una llamada WebRTC P2P.
 * Signaling vía Supabase Realtime en el canal `call:{callId}`.
 *
 * Estados del ciclo:
 *   idle → ringing (caller) → in-call → ended/failed
 *   idle → ringing (callee, escucha incoming_call) → answered/rejected → ended
 *
 * Limitaciones conocidas:
 *   - STUN/TURN: usa servidores STUN públicos de Google (para producción
 *     se recomienda un servidor TURN propio para NAT traversal fiable).
 *   - Audio únicamente en la implementación inicial; video requiere
 *     getUserMedia({ video: true }) y <video> elements en CallModal.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { CallSession } from '@/types/types'

// ============================================================================
// TIPOS
// ============================================================================

export type CallState = 'idle' | 'ringing' | 'in-call' | 'ended' | 'failed'

export interface UseWebRTCCallReturn {
  callState: CallState
  activeCall: CallSession | null
  localStream: MediaStream | null
  isMuted: boolean
  incomingCall: IncomingCallPayload | null
  startCall: (calleeId: string, conversationId: string, callType?: 'voice' | 'video') => Promise<void>
  answerCall: () => Promise<void>
  rejectCall: () => Promise<void>
  hangUp: () => Promise<void>
  toggleMute: () => void
}

interface IncomingCallPayload {
  call_id: string
  caller_id: string
  caller_name?: string
  call_type: 'voice' | 'video'
  conversation_id: string
}

type SignalingEvent =
  | { event: 'incoming_call'; payload: IncomingCallPayload }
  | { event: 'call_answered' }
  | { event: 'call_rejected' }
  | { event: 'call_ended'; payload: { duration?: number } }
  | { event: 'offer'; payload: RTCSessionDescriptionInit }
  | { event: 'answer'; payload: RTCSessionDescriptionInit }
  | { event: 'ice_candidate'; payload: RTCIceCandidateInit }

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

// ============================================================================
// HOOK
// ============================================================================

export function useWebRTCCall(currentUserId: string): UseWebRTCCallReturn {
  const [callState, setCallState] = useState<CallState>('idle')
  const [activeCall, setActiveCall] = useState<CallSession | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const signalingChannelRef = useRef<RealtimeChannel | null>(null)
  const callStartTimeRef = useRef<number>(0)

  // ── Suscribir al canal de señalización para llamadas entrantes ───────────
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel(`user-calls:${currentUserId}`)
      .on('broadcast', { event: 'incoming_call' }, (msg) => {
        const payload = msg.payload as IncomingCallPayload
        setIncomingCall(payload)
        setCallState('ringing')
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  // ── Crear RTCPeerConnection ───────────────────────────────────────────────
  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pcRef.current = pc
    return pc
  }, [])

  // ── Enviar señal al canal de la llamada ──────────────────────────────────
  const sendSignal = useCallback((callId: string, event: SignalingEvent) => {
    if (!signalingChannelRef.current) return
    signalingChannelRef.current.send({
      type: 'broadcast',
      event: event.event,
      payload: 'payload' in event ? event.payload : {},
    })
  }, [])

  // ── Limpiar recursos ─────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    pcRef.current?.close()
    pcRef.current = null

    localStream?.getTracks().forEach(t => t.stop())
    setLocalStream(null)

    if (signalingChannelRef.current) {
      supabase.removeChannel(signalingChannelRef.current)
      signalingChannelRef.current = null
    }
  }, [localStream])

  // ── Iniciar llamada (caller) ─────────────────────────────────────────────
  const startCall = useCallback(async (
    calleeId: string,
    conversationId: string,
    callType: 'voice' | 'video' = 'voice'
  ) => {
    if (callState !== 'idle') {
      toast.error('Ya hay una llamada activa')
      return
    }

    try {
      // 1. Obtener stream local
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      })
      setLocalStream(stream)

      // 2. Llamar Edge Function start-call
      const { data, error } = await supabase.functions.invoke('start-call', {
        body: { conversation_id: conversationId, callee_id: calleeId, call_type: callType },
      })

      if (error) throw error

      const callId = data.call_id as string
      callStartTimeRef.current = Date.now()

      // 3. Crear sesión activa provisional
      setActiveCall({
        id: callId,
        conversation_id: conversationId,
        caller_id: currentUserId,
        callee_id: calleeId,
        call_type: callType,
        status: 'ringing',
        started_at: new Date().toISOString(),
      })
      setCallState('ringing')

      // 4. Suscribir al canal de signaling de esta llamada
      const channel = supabase
        .channel(`call:${callId}`)
        .on('broadcast', { event: 'call_answered' }, async () => {
          // Crear PC y enviar offer
          const pc = createPC()
          stream.getTracks().forEach(t => pc.addTrack(t, stream))

          pc.onicecandidate = (e) => {
            if (e.candidate) {
              sendSignal(callId, { event: 'ice_candidate', payload: e.candidate.toJSON() })
            }
          }

          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          sendSignal(callId, { event: 'offer', payload: offer })
          setCallState('in-call')
          callStartTimeRef.current = Date.now()
        })
        .on('broadcast', { event: 'answer' }, async (msg) => {
          const answer = msg.payload as RTCSessionDescriptionInit
          await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer))
        })
        .on('broadcast', { event: 'ice_candidate' }, async (msg) => {
          const candidate = msg.payload as RTCIceCandidateInit
          await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate))
        })
        .on('broadcast', { event: 'call_rejected' }, () => {
          cleanup()
          setCallState('ended')
          setActiveCall(null)
          toast.info('Llamada rechazada')
        })
        .on('broadcast', { event: 'call_ended' }, () => {
          cleanup()
          setCallState('ended')
          setActiveCall(null)
        })
        .subscribe()

      signalingChannelRef.current = channel
    } catch (err) {
      logger.error('startCall failed', err as Error, { component: 'useWebRTCCall' })
      cleanup()
      setCallState('failed')
      toast.error('No se pudo iniciar la llamada')
    }
  }, [callState, currentUserId, createPC, sendSignal, cleanup])

  // ── Contestar llamada (callee) ───────────────────────────────────────────
  const answerCall = useCallback(async () => {
    if (!incomingCall) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.call_type === 'video',
      })
      setLocalStream(stream)

      const channel = supabase
        .channel(`call:${incomingCall.call_id}`)
        .on('broadcast', { event: 'offer' }, async (msg) => {
          const offer = msg.payload as RTCSessionDescriptionInit
          const pc = createPC()
          stream.getTracks().forEach(t => pc.addTrack(t, stream))

          pc.onicecandidate = (e) => {
            if (e.candidate) {
              sendSignal(incomingCall.call_id, { event: 'ice_candidate', payload: e.candidate.toJSON() })
            }
          }

          await pc.setRemoteDescription(new RTCSessionDescription(offer))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          sendSignal(incomingCall.call_id, { event: 'answer', payload: answer })
          setCallState('in-call')
          callStartTimeRef.current = Date.now()
        })
        .on('broadcast', { event: 'ice_candidate' }, async (msg) => {
          const candidate = msg.payload as RTCIceCandidateInit
          await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate))
        })
        .on('broadcast', { event: 'call_ended' }, () => {
          cleanup()
          setCallState('ended')
          setActiveCall(null)
        })
        .subscribe()

      signalingChannelRef.current = channel

      // Notificar al caller que se contestó
      channel.send({ type: 'broadcast', event: 'call_answered', payload: {} })

      setActiveCall({
        id: incomingCall.call_id,
        conversation_id: incomingCall.conversation_id,
        caller_id: incomingCall.caller_id,
        callee_id: currentUserId,
        call_type: incomingCall.call_type,
        status: 'answered',
        started_at: new Date().toISOString(),
      })
      setIncomingCall(null)
    } catch (err) {
      logger.error('answerCall failed', err as Error, { component: 'useWebRTCCall' })
      cleanup()
      setCallState('failed')
      toast.error('No se pudo contestar la llamada')
    }
  }, [incomingCall, currentUserId, createPC, sendSignal, cleanup])

  // ── Rechazar llamada ─────────────────────────────────────────────────────
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return

    // Notificar al caller
    const channel = supabase.channel(`call:${incomingCall.call_id}`)
    await channel.subscribe()
    channel.send({ type: 'broadcast', event: 'call_rejected', payload: {} })
    supabase.removeChannel(channel)

    // Cerrar en BD
    await supabase.functions.invoke('end-call', {
      body: { call_id: incomingCall.call_id, status: 'rejected' },
    }).catch(() => null)

    setIncomingCall(null)
    setCallState('idle')
  }, [incomingCall])

  // ── Colgar ───────────────────────────────────────────────────────────────
  const hangUp = useCallback(async () => {
    if (!activeCall) return

    const durationSeconds = callState === 'in-call'
      ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
      : undefined

    // Notificar al otro extremo
    signalingChannelRef.current?.send({
      type: 'broadcast',
      event: 'call_ended',
      payload: { duration: durationSeconds },
    })

    // Cerrar en BD y crear call_log
    await supabase.functions.invoke('end-call', {
      body: {
        call_id: activeCall.id,
        status: 'ended',
        duration_seconds: durationSeconds,
      },
    }).catch(() => null)

    cleanup()
    setCallState('ended')
    setActiveCall(null)
  }, [activeCall, callState, cleanup])

  // ── Toggle mute ──────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!localStream) return
    const audioTracks = localStream.getAudioTracks()
    audioTracks.forEach(track => {
      track.enabled = !track.enabled
    })
    setIsMuted(prev => !prev)
  }, [localStream])

  return {
    callState,
    activeCall,
    localStream,
    isMuted,
    incomingCall,
    startCall,
    answerCall,
    rejectCall,
    hangUp,
    toggleMute,
  }
}

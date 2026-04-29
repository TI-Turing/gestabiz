import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X, FileIcon, FolderOpen } from 'lucide-react'
import { Smiley, Microphone, MicrophoneSlash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileUpload } from './FileUpload'
import { EmojiPicker } from './EmojiPicker'
import { MediaPreview } from './MediaPreview'
import { MarketingVaultPicker } from './MarketingVaultPicker'
import { useImageCompression } from '@/hooks/useImageCompression'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import type { MessageWithSender } from '@/hooks/useMessages'
import type { ChatAttachment } from '@/hooks/useChat'
import type { MarketingVaultFile } from '@/types/types'
import { cn } from '@/lib/utils'
import { announce } from '@/lib/accessibility'
import { toast } from 'sonner'

const VIDEO_MAX_MB = 25

interface ChatInputProps {
  conversationId: string
  onSendMessage: (content: string, replyTo?: string, attachments?: ChatAttachment[]) => Promise<void>
  onSendAudio?: (blob: Blob, duration: number, waveform: number[]) => Promise<void>
  onTypingChange?: (isTyping: boolean) => void
  replyToMessage?: MessageWithSender | null
  onCancelReply?: () => void
  disabled?: boolean
  placeholder?: string
  businessId?: string
  isBusinessSide?: boolean
}

export function ChatInput({
  conversationId,
  onSendMessage,
  onSendAudio,
  onTypingChange,
  replyToMessage,
  onCancelReply,
  disabled = false,
  placeholder = 'Escribe un mensaje...',
  businessId,
  isBusinessSide = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)
  const [isVaultOpen, setIsVaultOpen] = useState(false)
  const [mediaPreview, setMediaPreview] = useState<{ file: File; objectUrl: string; type: 'image' | 'video' } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const micButtonRef = useRef<HTMLButtonElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { compress } = useImageCompression()

  // Audio recorder inline
  const { state: audioState, duration: audioDuration, waveformData, startRecording, stopRecording, cancelRecording } = useAudioRecorder()
  const isRecording = audioState === 'recording'

  useEffect(() => {
    if (textareaRef.current && !disabled) textareaRef.current.focus()
  }, [conversationId, disabled])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [message])

  useEffect(() => {
    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current) }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    if (onTypingChange) {
      onTypingChange(true)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => onTypingChange(false), 3000)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) { setMessage(m => m + emoji); return }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const next = message.slice(0, start) + emoji + message.slice(end)
    setMessage(next)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  const handleUploadComplete = (uploaded: ChatAttachment[]) => {
    setAttachments(prev => [...prev, ...uploaded])
    setIsUploadOpen(false)
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleVaultSelect = (files: MarketingVaultFile[]) => {
    const vaultAttachments: ChatAttachment[] = files.map(f => ({
      url: f.url ?? '',
      name: f.name,
      size: 0,
      type: f.isImage ? 'image/jpeg' : 'application/octet-stream',
    }))
    setAttachments(prev => [...prev, ...vaultAttachments])
  }

  // Gestiona el pegado / selección de media (imágenes y videos con preview)
  const handleMediaFile = async (file: File) => {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) return false

    if (isVideo && file.size > VIDEO_MAX_MB * 1024 * 1024) {
      toast.error(`El video excede el límite de ${VIDEO_MAX_MB} MB. Por favor comprímelo antes de enviarlo.`)
      return true
    }

    let processedFile = file
    if (isImage) {
      try { processedFile = await compress(file) } catch { /* silencio */ }
    }

    const objectUrl = URL.createObjectURL(processedFile)
    setMediaPreview({ file: processedFile, objectUrl, type: isImage ? 'image' : 'video' })
    return true
  }

  const handleConfirmMedia = async () => {
    if (!mediaPreview) return
    const { file, objectUrl, type } = mediaPreview
    URL.revokeObjectURL(objectUrl)
    setMediaPreview(null)

    // Upload inmediato y agregar como attachment
    try {
      const { supabase } = await import('@/lib/supabase')
      const ext = file.name.split('.').pop() || (type === 'image' ? 'jpg' : 'mp4')
      const path = `${conversationId}/${Date.now()}-${Math.random().toString(36).slice(7)}.${ext}`
      const { error } = await supabase.storage.from('chat-attachments').upload(path, file)
      if (error) throw error
      const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path)
      setAttachments(prev => [...prev, { url: data.publicUrl, name: file.name, size: file.size, type: file.type }])
    } catch {
      toast.error('No se pudo subir el archivo')
    }
  }

  const handleCancelMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview.objectUrl)
    setMediaPreview(null)
  }

  // Pegado de imágenes desde clipboard
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items ?? [])
    const mediaItem = items.find(i => i.type.startsWith('image/') || i.type.startsWith('video/'))
    if (!mediaItem) return
    const file = mediaItem.getAsFile()
    if (file) {
      e.preventDefault()
      await handleMediaFile(file)
    }
  }

  const handleSend = async () => {
    const trimmed = message.trim()
    if ((!trimmed && attachments.length === 0) || isSending) return
    try {
      setIsSending(true)
      if (onTypingChange) onTypingChange(false)
      await onSendMessage(trimmed || 'Archivo adjunto', replyToMessage?.id, attachments.length ? attachments : undefined)
      setMessage('')
      setAttachments([])
      if (onCancelReply) onCancelReply()
    } catch {
      // Error manejado por el padre
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleMicPointerDown = async (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!onSendAudio) return
    e.preventDefault()
    micButtonRef.current?.setPointerCapture(e.pointerId)
    await startRecording()
  }

  const handleMicPointerUp = async () => {
    if (!isRecording) return
    const result = await stopRecording()
    if (result && onSendAudio) {
      await onSendAudio(result.blob, result.duration, result.waveform)
    }
  }

  const handleMicPointerLeave = () => {
    if (isRecording) cancelRecording()
  }

  const formatAudioDuration = (s: number) => {
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); return }
    if (e.key === 'Escape' && replyToMessage) { e.preventDefault(); onCancelReply?.(); announce('Respuesta cancelada', 'polite'); textareaRef.current?.focus() }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const canSend = (message.trim().length > 0 || attachments.length > 0) && !disabled && !isSending

  return (
    <div className="border-t bg-background relative">
      <output className="sr-only" aria-live="polite" aria-atomic>
        {isSending && 'Enviando mensaje...'}
      </output>

      {/* Preview de reply */}
      {replyToMessage && (
        <div className="px-3 py-2 sm:px-4 bg-muted/50 border-b flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              Respondiendo a {replyToMessage.sender?.full_name || 'Usuario'}
            </div>
            <p className="text-sm line-clamp-1">{replyToMessage.body || '(mensaje sin contenido)'}</p>
          </div>
          {onCancelReply && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onCancelReply} aria-label="Cancelar respuesta">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Preview de attachments */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 sm:px-4 bg-muted/30 border-b">
          <p className="text-xs font-medium text-muted-foreground mb-2">Adjuntos ({attachments.length})</p>
          <div className="flex flex-wrap gap-2">
            {attachments.map((a, i) => (
              <div key={`${a.name}-${i}`} className="flex items-center gap-2 px-2 py-1 bg-background border rounded-md text-sm">
                {a.type.startsWith('image/') ? (
                  <img src={a.url} alt={a.name} className="h-8 w-8 object-cover rounded" />
                ) : (
                  <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate max-w-[120px]">{a.name}</span>
                {a.size > 0 && <span className="text-xs text-muted-foreground">{formatFileSize(a.size)}</span>}
                <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => handleRemoveAttachment(i)} aria-label={`Eliminar ${a.name}`}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input principal */}
      <div className="px-3 py-2 sm:px-4 sm:py-3 flex items-end gap-1 sm:gap-2">
        {/* Adjuntar — oculto mientras graba */}
        {!isRecording && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-9 w-9"
                disabled={disabled}
                title="Adjuntar"
                aria-label="Adjuntar archivo"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start">
              <DropdownMenuItem onSelect={() => setIsUploadOpen(true)}>
                <FileIcon className="h-4 w-4 mr-2" /> Archivo del dispositivo
              </DropdownMenuItem>
              {isBusinessSide && businessId && (
                <DropdownMenuItem onSelect={() => setIsVaultOpen(true)}>
                  <FolderOpen className="h-4 w-4 mr-2" /> Vault de marketing
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Textarea — reemplazado por UI de grabación cuando isRecording */}
        {isRecording ? (
          <div className="flex-1 flex items-center gap-2 px-2 py-1 bg-muted/40 rounded-lg min-h-[44px]">
            {/* Cancel */}
            <button
              type="button"
              onClick={cancelRecording}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted shrink-0"
              title="Cancelar grabación"
              aria-label="Cancelar grabación"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            {/* Timer */}
            <span className="text-sm font-mono text-destructive tabular-nums w-10 shrink-0">
              {formatAudioDuration(audioDuration)}
            </span>
            {/* Waveform */}
            <div className="flex items-center gap-0.5 h-5 flex-1">
              {waveformData.slice(-20).map((amp, i) => (
                <div
                  key={i}
                  className="flex-1 bg-destructive rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(15, amp * 100)}%` }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">Suelta para enviar</span>
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className={cn('min-h-[44px] sm:min-h-[40px] max-h-[120px] resize-none text-base focus-visible:ring-1')}
            rows={1}
            aria-label="Escribe un mensaje"
            aria-multiline
          />
        )}

        {/* Emoji — oculto mientras graba */}
        {!isRecording && (
          <div className="relative hidden sm:flex">
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-9 w-9"
              disabled={disabled}
              title="Emojis"
              aria-label="Agregar emoji"
              onClick={() => setIsEmojiOpen(o => !o)}
            >
              <Smiley size={20} />
            </Button>
            <EmojiPicker isOpen={isEmojiOpen} onEmojiSelect={handleEmojiSelect} onClose={() => setIsEmojiOpen(false)} />
          </div>
        )}

        {/* Botón único: micrófono (campo vacío) o enviar (tiene texto/adjuntos) */}
        {canSend ? (
          <Button
            onClick={handleSend}
            disabled={isSending}
            size="icon"
            className="flex-shrink-0 h-10 w-10 min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0"
            aria-label={isSending ? 'Enviando...' : 'Enviar mensaje'}
            aria-busy={isSending}
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : onSendAudio ? (
          <button
            ref={micButtonRef}
            type="button"
            disabled={disabled}
            onPointerDown={handleMicPointerDown}
            onPointerUp={handleMicPointerUp}
            onPointerLeave={handleMicPointerLeave}
            title={isRecording ? 'Suelta para enviar' : 'Mantén presionado para grabar'}
            aria-label={isRecording ? 'Soltar para enviar audio' : 'Grabar nota de voz'}
            className={cn(
              'flex-shrink-0 h-10 w-10 min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0',
              'flex items-center justify-center rounded-full transition-colors select-none touch-none',
              isRecording
                ? 'bg-destructive text-white scale-110'
                : 'hover:bg-muted text-muted-foreground',
              disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {audioState === 'cancelled' ? (
              <MicrophoneSlash size={20} />
            ) : (
              <Microphone size={20} weight={isRecording ? 'fill' : 'regular'} />
            )}
          </button>
        ) : (
          <Button
            onClick={handleSend}
            disabled
            size="icon"
            className="flex-shrink-0 h-10 w-10 min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0 opacity-40"
            aria-label="Enviar mensaje"
          >
            <Send className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="hidden sm:block px-4 pb-2 text-xs text-muted-foreground">
        <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> para enviar ·{' '}
        <kbd className="px-1 py-0.5 bg-muted rounded">Shift+Enter</kbd> para nueva línea
        {replyToMessage && <> · <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> para cancelar</>}
      </div>

      {/* Popover de upload de archivos */}
      {isUploadOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 sm:w-96 z-30 shadow-lg border bg-background rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Subir archivo</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsUploadOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <FileUpload
            conversationId={conversationId}
            messageId={`temp-${Date.now()}`}
            onUploadComplete={handleUploadComplete}
            maxFiles={5}
            maxSizeMB={10}
          />
        </div>
      )}

      {/* Media preview modal */}
      {mediaPreview && (
        <MediaPreview
          file={mediaPreview.file}
          type={mediaPreview.type}
          objectUrl={mediaPreview.objectUrl}
          onConfirm={handleConfirmMedia}
          onCancel={handleCancelMedia}
        />
      )}

      {/* Marketing vault picker */}
      {businessId && (
        <MarketingVaultPicker
          businessId={businessId}
          isOpen={isVaultOpen}
          onClose={() => setIsVaultOpen(false)}
          onSelect={handleVaultSelect}
        />
      )}
    </div>
  )
}

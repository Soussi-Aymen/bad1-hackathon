import { useCallback, useEffect, useRef, useState } from 'react'

// Browser SpeechRecognition is non-standard but available in Chrome / Edge.
// We use `any` shims rather than dragging in @types/dom-speech-recognition.
type AnyRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognitionCtor(): (new () => AnyRecognition) | null {
  if (typeof window === 'undefined') return null
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type VoiceState =
  | { status: 'idle' }
  | { status: 'listening' }
  | { status: 'speaking' }
  | { status: 'unsupported' }
  | { status: 'error'; message: string }

export interface UseVoiceOptions {
  onTranscript: (text: string) => void
  lang?: string
}

const BIN_COUNT = 24

export function useVoice({ onTranscript, lang = 'en-US' }: UseVoiceOptions) {
  const [state, setState] = useState<VoiceState>(() =>
    getSpeechRecognitionCtor() ? { status: 'idle' } : { status: 'unsupported' },
  )
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [conversationMode, setConversationMode] = useState(false)
  const [volume, setVolume] = useState(0)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [bars, setBars] = useState<number[]>(() => new Array(BIN_COUNT).fill(0))

  const recognitionRef = useRef<AnyRecognition | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const conversationModeRef = useRef(false)
  const speakingRef = useRef(false)
  const resumeTimerRef = useRef<number | null>(null)

  const teardownAudio = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    analyserRef.current = null
    setVolume(0)
    setBars(new Array(BIN_COUNT).fill(0))
  }, [])

  const setupAudioMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext
      const ctx = new AC()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      analyser.smoothingTimeConstant = 0.6
      source.connect(analyser)
      analyserRef.current = analyser

      const freqBuf = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(freqBuf)
        const next = new Array<number>(BIN_COUNT).fill(0)
        const step = Math.max(1, Math.floor(freqBuf.length / BIN_COUNT))
        let sum = 0
        for (let i = 0; i < BIN_COUNT; i++) {
          let acc = 0
          for (let j = 0; j < step; j++) {
            acc += freqBuf[i * step + j] ?? 0
          }
          const v = acc / step / 255
          next[i] = v
          sum += v
        }
        const avg = sum / BIN_COUNT
        setBars(next)
        setVolume(avg)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (err: any) {
      setState({ status: 'error', message: err?.message ?? 'Microphone access denied' })
    }
  }, [])

  const startListeningInternal = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setState({ status: 'unsupported' })
      return
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setInterimTranscript('')
    try {
      const rec = new Ctor()
      rec.lang = lang
      rec.continuous = false
      rec.interimResults = true
      rec.onresult = (event: any) => {
        let finalText = ''
        let interimText = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i]
          const t = r[0]?.transcript ?? ''
          if (r.isFinal) finalText += t
          else interimText += t
        }
        if (interimText) setInterimTranscript(interimText)
        if (finalText.trim()) {
          setInterimTranscript('')
          onTranscript(finalText.trim())
        }
      }
      rec.onerror = (event: any) => {
        const err = event?.error ?? 'unknown'
        // 'no-speech' and 'aborted' are benign in conversation mode — just loop.
        if ((err === 'no-speech' || err === 'aborted') && conversationModeRef.current) {
          return
        }
        setState({ status: 'error', message: err })
        teardownAudio()
      }
      rec.onend = () => {
        setInterimTranscript('')
        teardownAudio()
        setState((prev) => (prev.status === 'listening' ? { status: 'idle' } : prev))
      }
      recognitionRef.current = rec
      rec.start()
      setState({ status: 'listening' })
      void setupAudioMeter()
    } catch (err: any) {
      setState({ status: 'error', message: err?.message ?? 'Could not start microphone' })
      teardownAudio()
    }
  }, [lang, onTranscript, setupAudioMeter, teardownAudio])

  const stopListeningOnly = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const startConversation = useCallback(() => {
    conversationModeRef.current = true
    setConversationMode(true)
    setAutoSpeak(true)
    startListeningInternal()
  }, [startListeningInternal])

  const endConversation = useCallback(() => {
    conversationModeRef.current = false
    setConversationMode(false)
    if (resumeTimerRef.current != null) {
      clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = null
    }
    recognitionRef.current?.stop()
    teardownAudio()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    speakingRef.current = false
    setState({ status: 'idle' })
  }, [teardownAudio])

  const speak = useCallback(
    (text: string) => {
      if (!autoSpeak) return
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      window.speechSynthesis.cancel()
      // Stop the mic while we speak so the agent doesn't hear itself.
      recognitionRef.current?.stop()
      teardownAudio()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = lang
      utter.rate = 1
      utter.pitch = 1
      utter.onstart = () => {
        speakingRef.current = true
        setState({ status: 'speaking' })
      }
      const afterSpeak = () => {
        speakingRef.current = false
        if (conversationModeRef.current) {
          // Tiny grace period so audio devices settle before we re-open the mic.
          resumeTimerRef.current = window.setTimeout(() => {
            resumeTimerRef.current = null
            if (conversationModeRef.current) startListeningInternal()
          }, 350)
        } else {
          setState({ status: 'idle' })
        }
      }
      utter.onend = afterSpeak
      utter.onerror = afterSpeak
      window.speechSynthesis.speak(utter)
    },
    [autoSpeak, lang, startListeningInternal, teardownAudio],
  )

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    speakingRef.current = false
    setState({ status: 'idle' })
  }, [])

  useEffect(() => {
    return () => {
      conversationModeRef.current = false
      if (resumeTimerRef.current != null) clearTimeout(resumeTimerRef.current)
      recognitionRef.current?.stop()
      teardownAudio()
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [teardownAudio])

  return {
    state,
    autoSpeak,
    setAutoSpeak,
    conversationMode,
    startConversation,
    endConversation,
    stopListening: stopListeningOnly,
    speak,
    stopSpeaking,
    supported: state.status !== 'unsupported',
    volume,
    bars,
    interimTranscript,
  }
}

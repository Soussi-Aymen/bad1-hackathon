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

export function useVoice({ onTranscript, lang = 'en-US' }: UseVoiceOptions) {
  const [state, setState] = useState<VoiceState>(() =>
    getSpeechRecognitionCtor() ? { status: 'idle' } : { status: 'unsupported' },
  )
  const [autoSpeak, setAutoSpeak] = useState(true)
  const recognitionRef = useRef<AnyRecognition | null>(null)

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setState({ status: 'unsupported' })
      return
    }
    // Cancel any ongoing TTS so the mic doesn't pick it up.
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    try {
      const rec = new Ctor()
      rec.lang = lang
      rec.continuous = false
      rec.interimResults = false
      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0]?.transcript ?? '')
          .join(' ')
          .trim()
        if (transcript) onTranscript(transcript)
      }
      rec.onerror = (event: any) => {
        setState({ status: 'error', message: event?.error ?? 'Speech recognition failed' })
      }
      rec.onend = () => {
        setState((prev) => (prev.status === 'listening' ? { status: 'idle' } : prev))
      }
      recognitionRef.current = rec
      rec.start()
      setState({ status: 'listening' })
    } catch (err: any) {
      setState({ status: 'error', message: err?.message ?? 'Could not start microphone' })
    }
  }, [lang, onTranscript])

  const speak = useCallback(
    (text: string) => {
      if (!autoSpeak) return
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = lang
      utter.rate = 1
      utter.pitch = 1
      utter.onstart = () => setState({ status: 'speaking' })
      utter.onend = () => setState({ status: 'idle' })
      utter.onerror = () => setState({ status: 'idle' })
      window.speechSynthesis.speak(utter)
    },
    [autoSpeak, lang],
  )

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setState({ status: 'idle' })
  }, [])

  // Stop everything on unmount.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return {
    state,
    autoSpeak,
    setAutoSpeak,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    supported: state.status !== 'unsupported',
  }
}

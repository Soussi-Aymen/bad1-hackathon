import { useEffect, useState } from 'react'

interface Props {
  bars: number[]
  volume: number
  interimTranscript: string
  phase: 'listening' | 'speaking' | 'idle'
  lastAgentReply: string
  onEnd: () => void
}

// Premium "Siri-style" listening + speaking overlay for the two-way voice chat.
// During listening: bars driven by mic frequency data, aura tracks input volume.
// During speaking: bars animate via a smooth synthetic envelope so the agent
//   has visible presence while it talks; caption shows its reply.
export function VoiceListeningOverlay({
  bars,
  volume,
  interimTranscript,
  phase,
  lastAgentReply,
  onEnd,
}: Props) {
  // Synthetic envelope used while the agent is speaking (we can't easily tap
  // SpeechSynthesis audio levels, so we fake a pleasant wave).
  const [t, setT] = useState(0)
  useEffect(() => {
    if (phase !== 'speaking') return
    let raf = 0
    const start = performance.now()
    const tick = () => {
      setT((performance.now() - start) / 1000)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  const listening = phase === 'listening'
  const speaking = phase === 'speaking'
  const thinking = phase === 'idle'

  const auraScale =
    speaking ? 1.2 + Math.sin(t * 3) * 0.08 :
    listening ? 1 + Math.min(0.6, volume * 1.6) :
    1.05
  const auraOpacity =
    speaking ? 0.55 :
    listening ? 0.25 + Math.min(0.5, volume * 1.2) :
    0.35

  const renderedBars = speaking
    ? bars.map((_, i) => {
        const phaseI = i / bars.length
        const wave =
          0.45 +
          0.4 * Math.sin(t * 2.4 + phaseI * 6.0) * 0.5 +
          0.25 * Math.sin(t * 5.1 + phaseI * 3.0)
        return Math.max(0.1, Math.min(1, wave))
      })
    : bars

  const ringColor = speaking ? 'bg-brand/30' : listening ? 'bg-red-400/30' : 'bg-slate-300/40'
  const ringCoreFrom = speaking ? 'from-brand-soft' : listening ? 'from-red-400' : 'from-slate-300'
  const ringCoreTo = speaking ? 'to-brand' : listening ? 'to-amber-400' : 'to-slate-400'
  const dotColor = speaking ? 'text-brand bg-brand-tint' : listening ? 'text-red-600 bg-red-50' : 'text-faint bg-panel'
  const barColor = speaking ? 'bg-brand' : listening ? 'bg-red-500' : 'bg-slate-400'
  const label = speaking
    ? '◆ Speaking'
    : listening
      ? '● Listening'
      : '… Thinking'
  const subline = speaking
    ? 'Agent is replying — feel free to interrupt when it finishes'
    : listening
      ? "Speak now — I'll transcribe as you go"
      : 'Agent is preparing an answer…'

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-between bg-gradient-to-b from-card via-canvas to-panel px-6 py-8 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${dotColor}`}>
          {label}
        </span>
        <span className="text-xs text-faint">{subline}</span>
      </div>

      <div className="relative flex h-44 w-full items-center justify-center">
        <div
          className={`absolute h-44 w-44 rounded-full blur-2xl transition-all duration-100 ease-out ${ringColor}`}
          style={{
            transform: `scale(${auraScale + 0.15})`,
            opacity: auraOpacity * 0.75,
          }}
        />
        <div
          className={`absolute h-36 w-36 rounded-full blur-xl transition-all duration-100 ease-out ${ringColor}`}
          style={{
            transform: `scale(${auraScale})`,
            opacity: auraOpacity,
          }}
        />
        <div
          className={`absolute h-20 w-20 rounded-full bg-gradient-to-br ${ringCoreFrom} ${ringCoreTo} shadow-[0_0_40px_rgba(79,70,229,0.35)] transition-transform duration-100 ease-out`}
          style={{ transform: `scale(${1 + (listening ? volume : speaking ? 0.15 + Math.sin(t * 3) * 0.05 : 0) * 0.5})` }}
        />

        <div className="relative flex h-24 items-center gap-1">
          {renderedBars.map((b, i) => {
            const center = (renderedBars.length - 1) / 2
            const weight = 1 - Math.abs(i - center) / renderedBars.length
            const h = Math.max(8, Math.min(92, b * 100 * (0.6 + weight * 0.6)))
            return (
              <span
                key={i}
                className={`block w-1 rounded-full ${barColor}`}
                style={{
                  height: `${h}%`,
                  transition: 'height 60ms ease-out',
                }}
              />
            )
          })}
        </div>
      </div>

      <div className="w-full">
        <div className="min-h-[3rem] rounded-xl border border-edge bg-card/80 px-4 py-3 text-center text-sm text-ink shadow-sm">
          {listening && interimTranscript && <span className="italic">{interimTranscript}</span>}
          {listening && !interimTranscript && <span className="text-faint">…</span>}
          {speaking && (
            <span className="line-clamp-3 text-left text-muted">{lastAgentReply}</span>
          )}
          {thinking && <span className="animate-pulse text-faint">Thinking…</span>}
        </div>
        <button
          type="button"
          onClick={onEnd}
          className="mt-4 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          End voice chat
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import type { TopicContent } from '../../store/learnStore'

interface Props {
  topic: TopicContent
  onRead: () => void
  isRead: boolean
}

export default function TopicCard({ topic, onRead, isRead }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [readSeconds, setReadSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (expanded && !isRead) {
      timerRef.current = setInterval(() => {
        setReadSeconds(s => {
          if (s >= 29) {
            clearInterval(timerRef.current!)
            onRead()
            return 30
          }
          return s + 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [expanded, isRead]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`bg-ink rounded-xl border transition-all ${isRead ? 'border-pass/30' : 'border-white/10'}`}>
      <button
        className="w-full text-left p-4 flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {isRead && <span className="text-pass text-sm">✓</span>}
          <span className="text-cream font-medium">{topic.topic}</span>
        </div>
        <span className="text-mist text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-5 space-y-4">
          {!isRead && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-navy rounded-full">
                <div className="h-1 bg-gold rounded-full transition-all" style={{ width: `${(readSeconds / 30) * 100}%` }} />
              </div>
              <span className="text-mist text-xs">{30 - readSeconds}s</span>
            </div>
          )}

          <p className="text-mist text-sm leading-relaxed">{topic.explanation}</p>

          <div className="bg-navy/60 rounded-lg p-3">
            <div className="text-gold text-xs font-bold mb-1">Real-world example</div>
            <p className="text-mist text-sm">{topic.example}</p>
          </div>

          <div className="bg-warn/10 border border-warn/30 rounded-lg p-3">
            <div className="text-warn text-xs font-bold mb-1">⚠ Exam trap</div>
            <p className="text-cream text-sm">{topic.examTrap}</p>
          </div>

          {topic.keyTerms.length > 0 && (
            <div>
              <div className="text-gold text-xs font-bold mb-2">Key Terms</div>
              <div className="space-y-2">
                {topic.keyTerms.map(({ term, definition }) => (
                  <div key={term} className="flex gap-2 text-sm">
                    <span className="text-cream font-medium min-w-0">{term}:</span>
                    <span className="text-mist">{definition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

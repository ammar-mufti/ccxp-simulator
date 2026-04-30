import { useEffect, useRef } from 'react'
import { useExamStore } from '../../store/examStore'

interface Props {
  onSubmit: () => void
}

export default function NavigationBar({ onSubmit }: Props) {
  const { questions, answers, currentIndex, navigateTo } = useExamStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const answered = Object.keys(answers).length
  const total = questions.length
  const unanswered = total - answered

  // Auto-scroll current button into view
  useEffect(() => {
    const el = document.getElementById(`q-btn-${currentIndex}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [currentIndex])

  return (
    <div className="bg-ink border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 pt-3 pb-2">
        {/* Scrollable question strip */}
        <div
          ref={scrollRef}
          className="flex gap-1 overflow-x-auto pb-2 mb-2"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,168,76,0.3) transparent' }}
        >
          {questions.map((q, i) => {
            const isAnswered = !!answers[q.id]
            const isCurrent = i === currentIndex
            return (
              <button
                key={q.id}
                id={`q-btn-${i}`}
                onClick={() => navigateTo(i)}
                className={`flex-shrink-0 w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  isCurrent
                    ? 'bg-gold text-navy ring-2 ring-gold/50'
                    : isAnswered
                    ? 'bg-pass/40 text-pass border border-pass/30'
                    : 'bg-white/8 text-mist hover:bg-white/15'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-3 text-xs text-mist">
            <span className="text-pass font-medium">{answered} answered</span>
            {unanswered > 0 && <span>{unanswered} remaining</span>}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => navigateTo(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 rounded-lg bg-white/8 text-mist hover:bg-white/15 disabled:opacity-30 text-sm transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => navigateTo(Math.min(total - 1, currentIndex + 1))}
              disabled={currentIndex === total - 1}
              className="px-3 py-1.5 rounded-lg bg-white/8 text-mist hover:bg-white/15 disabled:opacity-30 text-sm transition-colors"
            >
              Next →
            </button>
            <button
              onClick={onSubmit}
              className="px-5 py-1.5 rounded-lg bg-gold text-navy font-bold hover:bg-amber-400 text-sm transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

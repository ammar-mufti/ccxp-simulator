import { useExamStore } from '../../store/examStore'

interface Props {
  onSubmit: () => void
}

export default function NavigationBar({ onSubmit }: Props) {
  const { questions, answers, currentIndex, navigateTo } = useExamStore()
  const answered = Object.keys(answers).length
  const total = questions.length
  const unanswered = total - answered

  return (
    <div className="bg-ink border-t border-white/10">
      {/* Question grid */}
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex flex-wrap gap-1 mb-3">
          {questions.map((q, i) => {
            const isAnswered = !!answers[q.id]
            const isCurrent = i === currentIndex
            return (
              <button
                key={q.id}
                onClick={() => navigateTo(i)}
                className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                  isCurrent
                    ? 'bg-gold text-navy'
                    : isAnswered
                    ? 'bg-pass/60 text-cream'
                    : 'bg-white/10 text-mist hover:bg-white/20'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <span className="text-pass">{answered} answered</span>
            {unanswered > 0 && <span className="text-mist">{unanswered} remaining</span>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigateTo(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-lg bg-white/10 text-mist hover:bg-white/20 disabled:opacity-30 text-sm transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => navigateTo(Math.min(total - 1, currentIndex + 1))}
              disabled={currentIndex === total - 1}
              className="px-4 py-2 rounded-lg bg-white/10 text-mist hover:bg-white/20 disabled:opacity-30 text-sm transition-colors"
            >
              Next →
            </button>
            <button
              onClick={onSubmit}
              className="px-6 py-2 rounded-lg bg-gold text-navy font-bold hover:bg-amber-400 text-sm transition-colors"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

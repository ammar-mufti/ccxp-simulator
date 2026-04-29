import { useState } from 'react'
import type { Question } from '../../store/examStore'

interface Props {
  questions: Question[]
  answers: Record<string, string>
}

const OPTS = ['a', 'b', 'c', 'd'] as const

export default function WrongAnswers({ questions, answers }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const wrong = questions.filter(q => answers[q.id] !== q.correct)

  if (wrong.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🏆</div>
        <p className="text-pass font-semibold">Perfect score on reviewed questions!</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-cream font-semibold mb-4">Wrong Answers ({wrong.length})</h3>
      <div className="space-y-3">
        {wrong.map((q, i) => {
          const yourAnswer = answers[q.id]
          const isOpen = expanded === q.id
          return (
            <div key={q.id} className="bg-ink rounded-xl border border-white/10 overflow-hidden">
              <button
                className="w-full text-left p-4 flex items-start gap-3"
                onClick={() => setExpanded(isOpen ? null : q.id)}
              >
                <span className="text-fail text-sm font-bold flex-shrink-0">#{i + 1}</span>
                <p className="text-mist text-sm flex-1 leading-relaxed">{q.q}</p>
                <span className="text-mist text-xs flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-2">
                  {OPTS.map(opt => {
                    const isYours = opt === yourAnswer
                    const isCorrect = opt === q.correct
                    let cls = 'border-white/10 text-mist'
                    if (isCorrect) cls = 'border-pass/60 bg-pass/10 text-cream'
                    else if (isYours) cls = 'border-fail/60 bg-fail/10 text-cream'
                    return (
                      <div key={opt} className={`rounded-lg px-3 py-2 border text-sm flex items-center gap-2 ${cls}`}>
                        <span className="font-bold uppercase w-4">{opt}</span>
                        <span>{q[opt]}</span>
                        {isCorrect && <span className="ml-auto text-pass text-xs font-bold">✓ correct</span>}
                        {isYours && !isCorrect && <span className="ml-auto text-fail text-xs font-bold">✗ yours</span>}
                      </div>
                    )
                  })}
                  <div className="bg-gold/10 rounded-lg px-3 py-2 mt-2">
                    <span className="text-gold text-xs font-bold">Explanation: </span>
                    <span className="text-cream text-xs">{q.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { QuizQuestion } from '../../store/learnStore'

interface Props {
  questions: QuizQuestion[]
  onComplete: (score: number) => void
}

const OPTS = ['a', 'b', 'c', 'd'] as const

export default function QuickQuiz({ questions, onComplete }: Props) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<Record<number, string>>({})
  const [showResult, setShowResult] = useState(false)
  const [finished, setFinished] = useState(false)

  const q = questions[current]
  const answered = selected[current]

  function choose(opt: string) {
    if (answered) return
    setSelected(p => ({ ...p, [current]: opt }))
    setShowResult(true)
  }

  function next() {
    setShowResult(false)
    if (current < questions.length - 1) {
      setCurrent(c => c + 1)
    } else {
      const score = questions.filter((q, i) => selected[i] === q.correct).length
      onComplete(score)
      setFinished(true)
    }
  }

  if (finished) {
    const score = questions.filter((q, i) => selected[i] === q.correct).length
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">{score >= 4 ? '🏆' : score >= 3 ? '👍' : '📚'}</div>
        <div className="text-cream text-2xl font-bold mb-2">{score} / {questions.length}</div>
        <div className="text-mist">{score >= 4 ? 'Excellent!' : score >= 3 ? 'Good work!' : 'Keep studying!'}</div>
        <button
          onClick={() => { setCurrent(0); setSelected({}); setShowResult(false); setFinished(false) }}
          className="mt-6 bg-gold text-navy font-bold px-6 py-2 rounded-lg hover:bg-amber-400 transition-colors"
        >
          Retake Quiz
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-mist text-sm">Question {current + 1} of {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < current ? 'bg-gold' : i === current ? 'bg-gold animate-pulse' : 'bg-white/20'}`} />
          ))}
        </div>
      </div>

      <div className="bg-ink rounded-xl border border-white/10 p-5 mb-4">
        <p className="text-cream leading-relaxed">{q.q}</p>
      </div>

      <div className="grid gap-2 mb-4">
        {OPTS.map(opt => {
          const isSelected = answered === opt
          const isCorrect = opt === q.correct
          let cls = 'border-white/10 text-mist hover:border-white/30 hover:text-cream'
          if (showResult && isCorrect) cls = 'border-pass/60 bg-pass/10 text-cream'
          else if (showResult && isSelected && !isCorrect) cls = 'border-fail/60 bg-fail/10 text-cream'
          else if (isSelected) cls = 'border-gold bg-gold/10 text-cream'
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              className={`w-full text-left rounded-xl p-3 border transition-all flex items-center gap-3 ${cls}`}
            >
              <span className="font-bold uppercase w-4 text-sm">{opt}</span>
              <span className="text-sm">{q[opt]}</span>
            </button>
          )
        })}
      </div>

      {showResult && (
        <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-4">
          <div className="text-gold text-xs font-bold mb-1">
            {answered === q.correct ? '✓ Correct!' : `✗ Incorrect — Answer is (${q.correct.toUpperCase()})`}
          </div>
          <p className="text-cream text-sm leading-relaxed">{q.explanation}</p>
        </div>
      )}

      {showResult && (
        <button
          onClick={next}
          className="w-full bg-gold text-navy font-bold py-3 rounded-xl hover:bg-amber-400 transition-colors"
        >
          {current < questions.length - 1 ? 'Next Question →' : 'See Results'}
        </button>
      )}
    </div>
  )
}

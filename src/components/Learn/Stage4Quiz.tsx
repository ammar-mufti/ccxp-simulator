import { useState } from 'react'
import type { Stage4Question } from '../../types/content'
import { useLearnStore } from '../../store/learnStore'

const OPTS = ['a', 'b', 'c', 'd'] as const

interface Props {
  questions: Stage4Question[]
  domain: string
}

export default function Stage4Quiz({ questions, domain }: Props) {
  const { setQuizScore } = useLearnStore()
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<Record<number, string>>({})
  const [showResult, setShowResult] = useState(false)
  const [finished, setFinished] = useState(false)

  if (!started) {
    return (
      <div className="bg-ink rounded-2xl border border-white/10 p-6 text-center">
        <div className="text-3xl mb-2">🧩</div>
        <h3 className="text-cream font-semibold mb-1">Quick Quiz</h3>
        <p className="text-mist text-sm mb-4">{questions.length} questions · Immediate feedback</p>
        <button
          onClick={() => setStarted(true)}
          className="bg-gold text-navy font-bold px-6 py-2 rounded-xl hover:bg-amber-400 transition-colors"
        >
          Start Quiz
        </button>
      </div>
    )
  }

  if (finished) {
    const score = questions.filter((q, i) => selected[i] === q.correct).length
    return (
      <div className="bg-ink rounded-2xl border border-white/10 p-6 text-center">
        <div className="text-4xl mb-3">{score >= 4 ? '🏆' : score >= 3 ? '👍' : '📚'}</div>
        <div className="text-cream text-2xl font-bold mb-1">{score} / {questions.length}</div>
        <div className="text-mist text-sm mb-5">{score >= 4 ? 'Excellent mastery!' : score >= 3 ? 'Good work — review weak spots' : 'Review the concepts above and retry'}</div>
        <button
          onClick={() => { setCurrent(0); setSelected({}); setShowResult(false); setFinished(false); setStarted(false) }}
          className="bg-gold text-navy font-bold px-6 py-2 rounded-xl hover:bg-amber-400 transition-colors"
        >
          Retake Quiz
        </button>
      </div>
    )
  }

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
      setQuizScore(domain, score)
      setFinished(true)
    }
  }

  return (
    <div className="bg-ink rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-mist text-sm">Question {current + 1} of {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
              i < current ? 'bg-gold' : i === current ? 'bg-gold animate-pulse' : 'bg-white/20'
            }`} />
          ))}
        </div>
      </div>

      <p className="text-cream leading-relaxed mb-4">{q.q}</p>

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

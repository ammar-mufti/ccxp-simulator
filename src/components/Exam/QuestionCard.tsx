import { useState } from 'react'
import type { Question } from '../../store/examStore'
import { useExamStore } from '../../store/examStore'
import { useAuthStore } from '../../store/authStore'

const OPTION_LABELS = ['a', 'b', 'c', 'd'] as const
const WORKER_URL = import.meta.env.VITE_WORKER_URL

interface Props {
  question: Question
  selectedAnswer: string | undefined
  onAnswer: (answer: string) => void
  questionNumber: number
  totalQuestions: number
}

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<div class="flex gap-2 mt-1"><span class="text-gold flex-shrink-0">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div class="mt-2"></div>')
    .replace(/\n/g, '<br/>')
}

export default function QuestionCard({ question, selectedAnswer, onAnswer, questionNumber, totalQuestions }: Props) {
  const { explanations, setExplanation } = useExamStore()
  const token = useAuthStore(s => s.token) ?? ''
  const [explaining, setExplaining] = useState(false)

  const explanation = explanations[question.id]

  async function fetchExplanation() {
    if (explanation || explaining) return
    setExplaining(true)
    try {
      const res = await fetch(`${WORKER_URL}/api/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'explain-question',
          domain: question.domain,
          question: question.q,
          a: question.a,
          b: question.b,
          c: question.c,
          d: question.d,
          correct: question.correct,
          userAnswer: selectedAnswer,
        }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json() as { explanation: string }
      setExplanation(question.id, data.explanation ?? 'No explanation available.')
    } catch {
      setExplanation(question.id, 'Could not load explanation — please try again.')
    } finally {
      setExplaining(false)
    }
  }

  return (
    <div className="bg-ink rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-mist text-sm">Question {questionNumber} of {totalQuestions}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-mist">{question.domain}</span>
      </div>

      <p className="text-cream text-lg leading-relaxed mb-6">{question.q}</p>

      <div className="grid gap-3">
        {OPTION_LABELS.map(opt => {
          const text = question[opt]
          const isSelected = selectedAnswer === opt
          return (
            <button
              key={opt}
              onClick={() => onAnswer(opt)}
              className={`w-full text-left rounded-xl p-4 border transition-all flex items-start gap-3 ${
                isSelected
                  ? 'border-gold bg-gold/10 text-cream'
                  : 'border-white/10 bg-navy/50 text-mist hover:border-white/30 hover:text-cream'
              }`}
            >
              <span className={`font-bold uppercase w-5 flex-shrink-0 ${isSelected ? 'text-gold' : 'text-mist'}`}>
                {opt}
              </span>
              <span className="leading-relaxed">{text}</span>
            </button>
          )
        })}
      </div>

      {/* Explain button — only shown after answering */}
      {selectedAnswer && (
        <div className="mt-4">
          {!explanation && (
            <button
              onClick={fetchExplanation}
              disabled={explaining}
              className="w-full py-2.5 rounded-xl border border-gold/40 text-gold text-sm font-medium hover:bg-gold/10 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {explaining ? (
                <>
                  <span className="animate-spin text-base">⟳</span>
                  Generating explanation…
                </>
              ) : (
                <>🧠 Explain this question</>
              )}
            </button>
          )}

          {explanation && (
            <div className="mt-3 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm">
              <div
                className="text-cream leading-relaxed space-y-1"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(explanation) }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

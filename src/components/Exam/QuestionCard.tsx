import type { Question } from '../../store/examStore'

const OPTION_LABELS = ['a', 'b', 'c', 'd'] as const

interface Props {
  question: Question
  selectedAnswer: string | undefined
  onAnswer: (answer: string) => void
  questionNumber: number
  totalQuestions: number
}

export default function QuestionCard({ question, selectedAnswer, onAnswer, questionNumber, totalQuestions }: Props) {
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
    </div>
  )
}

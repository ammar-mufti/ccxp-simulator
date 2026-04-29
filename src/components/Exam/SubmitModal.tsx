import { useExamStore } from '../../store/examStore'

interface Props {
  onConfirm: () => void
  onCancel: () => void
}

export default function SubmitModal({ onConfirm, onCancel }: Props) {
  const { questions, answers } = useExamStore()
  const answered = Object.keys(answers).length
  const unanswered = questions.length - answered

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
      <div className="bg-ink border border-white/20 rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">📋</div>
        <h2 className="text-cream font-serif text-xl mb-2">Submit Exam?</h2>

        {unanswered > 0 ? (
          <p className="text-warn text-sm mb-6">
            You have <strong>{unanswered}</strong> unanswered question{unanswered > 1 ? 's' : ''}.
            These will be marked incorrect.
          </p>
        ) : (
          <p className="text-mist text-sm mb-6">
            All {questions.length} questions answered. Ready to see your results?
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/20 text-mist hover:text-cream hover:border-white/40 transition-colors font-medium"
          >
            Keep Going
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-gold text-navy font-bold hover:bg-amber-400 transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}

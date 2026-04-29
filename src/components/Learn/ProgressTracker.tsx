import { useLearnStore } from '../../store/learnStore'
import { DOMAIN_COLORS } from '../../store/examStore'

interface Props { domain: string }

export default function ProgressTracker({ domain }: Props) {
  const { progress } = useLearnStore()
  const p = progress[domain]
  const color = DOMAIN_COLORS[domain] ?? '#C9A84C'

  const topicsRead = p?.topicsRead.length ?? 0
  const flashcardsKnown = p?.flashcardsKnown.length ?? 0
  const quizScore = p?.quizScore

  return (
    <div className="flex gap-4 text-xs text-mist">
      <span style={{ color: topicsRead > 0 ? color : undefined }}>
        {topicsRead} topics read
      </span>
      <span style={{ color: flashcardsKnown > 0 ? color : undefined }}>
        {flashcardsKnown}/10 flashcards
      </span>
      {quizScore !== null && quizScore !== undefined && (
        <span style={{ color }}>Quiz: {quizScore}/5</span>
      )}
    </div>
  )
}

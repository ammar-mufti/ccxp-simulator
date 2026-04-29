import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExamStore } from '../store/examStore'
import TopNav from '../components/Nav/TopNav'
import ScoreRing from '../components/Results/ScoreRing'
import DomainBreakdown from '../components/Results/DomainBreakdown'
import WrongAnswers from '../components/Results/WrongAnswers'
import StudyPlan from '../components/Results/StudyPlan'

export default function ResultsPage() {
  const { questions, answers, submitted, resetExam } = useExamStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!submitted || questions.length === 0) navigate('/exam', { replace: true })
  }, [submitted, questions.length, navigate])

  if (!submitted || questions.length === 0) return null

  const correct = questions.filter(q => answers[q.id] === q.correct).length

  return (
    <div className="min-h-screen bg-navy">
      <TopNav />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Score */}
        <div className="bg-ink rounded-2xl p-8 border border-white/10 text-center">
          <h1 className="text-cream font-serif text-2xl mb-6">Exam Results</h1>
          <ScoreRing score={correct} total={questions.length} />
        </div>

        {/* Domain breakdown */}
        <div className="bg-ink rounded-2xl p-6 border border-white/10">
          <DomainBreakdown questions={questions} answers={answers} />
        </div>

        {/* Study plan */}
        <div className="bg-ink rounded-2xl p-6 border border-white/10">
          <StudyPlan questions={questions} answers={answers} />
        </div>

        {/* Wrong answers */}
        <div className="bg-ink rounded-2xl p-6 border border-white/10">
          <WrongAnswers questions={questions} answers={answers} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={() => { resetExam(); navigate('/exam') }}
            className="flex-1 bg-gold text-navy font-bold py-3 rounded-xl hover:bg-amber-400 transition-colors"
          >
            New Exam
          </button>
          <button
            onClick={() => { resetExam(); navigate('/learn') }}
            className="flex-1 bg-ink border border-white/20 text-mist py-3 rounded-xl hover:text-cream hover:border-white/40 transition-colors"
          >
            Back to Learn
          </button>
        </div>
      </div>
    </div>
  )
}

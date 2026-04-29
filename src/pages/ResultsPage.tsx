import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExamStore } from '../store/examStore'
import { useHistoryStore, buildDomainScores } from '../store/historyStore'
import TopNav from '../components/Nav/TopNav'
import ScoreRing from '../components/Results/ScoreRing'
import DomainBreakdown from '../components/Results/DomainBreakdown'
import WrongAnswers from '../components/Results/WrongAnswers'
import StudyPlan from '../components/Results/StudyPlan'

export default function ResultsPage() {
  const { questions, answers, submitted, mode, selectedDomain, resetExam, buildWrongQuestions } = useExamStore()
  const navigate = useNavigate()
  const savedRef = useRef(false)

  useEffect(() => {
    if (!submitted || questions.length === 0) { navigate('/exam', { replace: true }); return }

    // Save attempt to history — only once per mount
    if (savedRef.current) return
    savedRef.current = true

    const correct = questions.filter(q => answers[q.id] === q.correct).length
    const pct = Math.round((correct / questions.length) * 100)
    const domainScores = buildDomainScores(questions, answers)

    const attempt = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mode: (mode ?? 'full') as 'full' | 'mini' | 'domain',
      selectedDomain: selectedDomain ?? null,
      score: correct,
      total: questions.length,
      pct,
      timeTaken: 0,
      domainScores,
      wrongQuestions: buildWrongQuestions(),
    }

    console.log('[Results] Saving attempt to history:', attempt.id, `${correct}/${questions.length} (${pct}%)`)
    useHistoryStore.getState().addAttempt(attempt)
    console.log('[Results] History count after save:', useHistoryStore.getState().attempts.length)
  }, [submitted, questions.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!submitted || questions.length === 0) return null

  const correct = questions.filter(q => answers[q.id] === q.correct).length

  return (
    <div className="min-h-screen bg-navy">
      <TopNav />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-ink rounded-2xl p-8 border border-white/10 text-center">
          <h1 className="text-cream font-serif text-2xl mb-6">Exam Results</h1>
          <ScoreRing score={correct} total={questions.length} />
        </div>

        <div className="bg-ink rounded-2xl p-6 border border-white/10">
          <DomainBreakdown questions={questions} answers={answers} />
        </div>

        <div className="bg-ink rounded-2xl p-6 border border-white/10">
          <StudyPlan questions={questions} answers={answers} />
        </div>

        <div className="bg-ink rounded-2xl p-6 border border-white/10">
          <WrongAnswers questions={questions} answers={answers} />
        </div>

        <div className="flex gap-3 pb-8">
          <button
            onClick={() => { resetExam(); navigate('/exam') }}
            className="flex-1 bg-gold text-navy font-bold py-3 rounded-xl hover:bg-amber-400 transition-colors"
          >
            New Exam
          </button>
          <button
            onClick={() => navigate('/history')}
            className="flex-1 bg-ink border border-white/20 text-mist py-3 rounded-xl hover:text-cream hover:border-white/40 transition-colors"
          >
            View History
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

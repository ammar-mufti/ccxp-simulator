import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExamStore } from '../../store/examStore'
import { useQuestionGen, type GenProgress } from '../../hooks/useQuestionGen'

export default function LoadingScreen() {
  const { mode, selectedDomain, setQuestions, setLoading, setError, error } = useExamStore()
  const { generateForMode } = useQuestionGen()
  const navigate = useNavigate()
  const [progress, setProgress] = useState<GenProgress>({
    percent: 0,
    collected: 0,
    total: 1,
    currentDomain: '',
    message: 'Preparing questions…',
  })

  useEffect(() => {
    if (!mode) { navigate('/exam'); return }

    generateForMode(mode, selectedDomain, setProgress)
      .then(questions => {
        setQuestions(questions)
        setLoading(false)
        navigate('/exam/question')
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to generate questions')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-fail text-lg mb-4">{error}</div>
          <button
            onClick={() => navigate('/exam')}
            className="bg-gold text-navy font-bold px-6 py-2 rounded-lg hover:bg-amber-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const barWidth = Math.min(progress.percent, 100)

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <div className="text-gold text-4xl font-serif mb-6">CCXP</div>
        <div className="text-cream text-lg mb-2 animate-pulse">{progress.message}</div>
        <div className="text-mist text-sm mb-6">
          {progress.collected} / {progress.total} questions ready
        </div>
        <div className="w-full bg-ink rounded-full h-2">
          <div
            className="bg-gold h-2 rounded-full transition-all duration-500"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="text-mist text-xs mt-2">{progress.percent}%</div>
      </div>
    </div>
  )
}

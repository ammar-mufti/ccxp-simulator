import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExamStore } from '../../store/examStore'
import { useQuestionGen } from '../../hooks/useQuestionGen'
import { useState } from 'react'

export default function LoadingScreen() {
  const { mode, selectedDomain, setQuestions, setLoading, setError, error } = useExamStore()
  const { generateForMode } = useQuestionGen()
  const navigate = useNavigate()
  const [progress, setProgress] = useState({ loaded: 0, total: 1 })
  const [message, setMessage] = useState('Preparing questions…')

  useEffect(() => {
    if (!mode) { navigate('/exam'); return }

    const messages = [
      'Generating realistic CCXP questions…',
      'Applying CXPA difficulty standards…',
      'Mixing question types…',
      'Almost ready…',
    ]
    let msgIdx = 0
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length
      setMessage(messages[msgIdx])
    }, 2500)

    generateForMode(mode, selectedDomain, (loaded, total) => {
      setProgress({ loaded, total })
    }).then(questions => {
      clearInterval(msgInterval)
      setQuestions(questions)
      setLoading(false)
      navigate('/exam/question')
    }).catch(err => {
      clearInterval(msgInterval)
      setError(err instanceof Error ? err.message : 'Failed to generate questions')
    })

    return () => clearInterval(msgInterval)
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

  const pct = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <div className="text-gold text-4xl font-serif mb-6">CCXP</div>
        <div className="text-cream text-lg mb-2 animate-pulse">{message}</div>
        <div className="text-mist text-sm mb-6">
          {progress.loaded} / {progress.total} chunks complete
        </div>
        <div className="w-full bg-ink rounded-full h-2">
          <div
            className="bg-gold h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-mist text-xs mt-2">{pct}%</div>
      </div>
    </div>
  )
}

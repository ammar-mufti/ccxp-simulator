import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import { useExamStore, EXAM_DURATIONS } from '../store/examStore'
import { useTimer } from '../hooks/useTimer'
import TopNav from '../components/Nav/TopNav'
import ConfigScreen from '../components/Exam/ConfigScreen'
import LoadingScreen from '../components/Exam/LoadingScreen'
import QuestionCard from '../components/Exam/QuestionCard'
import NavigationBar from '../components/Exam/NavigationBar'
import TimerDisplay from '../components/Exam/TimerDisplay'
import SubmitModal from '../components/Exam/SubmitModal'

function ActiveExam() {
  const { mode, questions, answers, currentIndex, submitExam, answerQuestion } = useExamStore()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  const handleExpire = useCallback(() => {
    submitExam()
    navigate('/results', { replace: true })
  }, [submitExam, navigate])

  const duration = mode ? EXAM_DURATIONS[mode] : EXAM_DURATIONS.full
  const { formatted, timerColor, timerPulse, start, stop } = useTimer(duration, handleExpire)

  useEffect(() => {
    if (questions.length === 0) { navigate('/exam', { replace: true }); return }
    start()
    return () => stop()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (questions.length === 0) return null

  const question = questions[currentIndex]

  function confirm() {
    stop()
    submitExam()
    navigate('/results', { replace: true })
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      {/* Top bar */}
      <div className="bg-ink border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="text-mist text-sm">{questions.length}Q · {mode} exam</div>
        <TimerDisplay formatted={formatted} timerColor={timerColor} timerPulse={timerPulse} />
        <div className="text-mist text-sm">{Object.keys(answers).length}/{questions.length}</div>
      </div>

      {/* Question */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <QuestionCard
          question={question}
          selectedAnswer={answers[question.id]}
          onAnswer={ans => answerQuestion(question.id, ans)}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
        />
      </div>

      {/* Navigation pinned to bottom */}
      <div className="sticky bottom-0 z-40">
        <NavigationBar onSubmit={() => setShowModal(true)} />
      </div>

      {showModal && (
        <SubmitModal onConfirm={confirm} onCancel={() => setShowModal(false)} />
      )}
    </div>
  )
}

export default function ExamPage() {
  const [params] = useSearchParams()
  const { setMode } = useExamStore()
  const navigate = useNavigate()

  // Handle domain drill from Learn page
  useEffect(() => {
    const domain = params.get('domain')
    if (domain) {
      setMode('domain', domain)
      navigate('/exam/loading', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      <Route index element={<><TopNav /><div className="bg-navy min-h-screen"><ConfigScreen /></div></>} />
      <Route path="loading" element={<LoadingScreen />} />
      <Route path="question" element={<ActiveExam />} />
    </Routes>
  )
}

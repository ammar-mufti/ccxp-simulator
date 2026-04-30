import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import { useExamStore } from '../store/examStore'
import { useTimer } from '../hooks/useTimer'
import { getCert } from '../data/certifications'
import TopNav from '../components/Nav/TopNav'
import ConfigScreen from '../components/Exam/ConfigScreen'
import LoadingScreen from '../components/Exam/LoadingScreen'
import QuestionCard from '../components/Exam/QuestionCard'
import NavigationBar from '../components/Exam/NavigationBar'
import TimerDisplay from '../components/Exam/TimerDisplay'
import SubmitModal from '../components/Exam/SubmitModal'

interface Props {
  certId: string
}

function ActiveExam({ certId }: { certId: string }) {
  const { mode, questions, answers, currentIndex, submitExam, answerQuestion } = useExamStore()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  const cert = getCert(certId)

  const handleExpire = useCallback(() => {
    submitExam()
    navigate(`/${certId}/results`, { replace: true })
  }, [submitExam, navigate, certId])

  // Duration: use cert registry for full exam, fallback to standard timings
  const fullDuration = cert ? cert.examDuration * 60 : 3 * 60 * 60
  const miniDuration = 60 * 60
  const domainDuration = 30 * 60
  const duration = mode === 'full' ? fullDuration : mode === 'mini' ? miniDuration : domainDuration

  const { formatted, timerColor, timerPulse, start, stop } = useTimer(duration, handleExpire)

  useEffect(() => {
    if (questions.length === 0) { navigate(`/${certId}/exam`, { replace: true }); return }
    start()
    return () => stop()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (questions.length === 0) return null

  const question = questions[currentIndex]

  function confirm() {
    stop()
    submitExam()
    navigate(`/${certId}/results`, { replace: true })
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <div className="bg-ink border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="text-mist text-sm">
          {questions.length}Q · {mode === 'full' ? 'Full Exam' : mode === 'mini' ? 'Mini Drill' : 'Domain Drill'}
        </div>
        <TimerDisplay formatted={formatted} timerColor={timerColor} timerPulse={timerPulse} />
        <div className="text-mist text-sm">{Object.keys(answers).length}/{questions.length}</div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <QuestionCard
          question={question}
          selectedAnswer={answers[question.id]}
          onAnswer={ans => answerQuestion(question.id, ans)}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
        />
      </div>

      <div className="sticky bottom-0 z-40">
        <NavigationBar onSubmit={() => setShowModal(true)} />
      </div>

      {showModal && (
        <SubmitModal onConfirm={confirm} onCancel={() => setShowModal(false)} />
      )}
    </div>
  )
}

export default function ExamPage({ certId }: Props) {
  const [params] = useSearchParams()
  const { setMode, setCertId } = useExamStore()
  const navigate = useNavigate()

  useEffect(() => {
    setCertId(certId)
    const domain = params.get('domain')
    if (domain) {
      setMode('domain', domain)
      navigate(`/${certId}/exam/loading`, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      <Route index element={<><TopNav /><div className="bg-navy min-h-screen"><ConfigScreen certId={certId} /></div></>} />
      <Route path="loading" element={<LoadingScreen certId={certId} />} />
      <Route path="question" element={<ActiveExam certId={certId} />} />
    </Routes>
  )
}

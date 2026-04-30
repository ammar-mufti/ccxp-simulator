import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import LearnPage from './pages/LearnPage'
import ExamPage from './pages/ExamPage'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'
import TutorChat from './components/AI/TutorChat'

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  if (!offline) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-warn text-navy text-center text-sm py-2 font-medium">
      You're offline — showing cached content
    </div>
  )
}

function TutorChatWrapper() {
  const user = useAuthStore(s => s.user)
  if (!user) return null
  return <TutorChat />
}

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [init])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_WORKER_URL}/api/health`)
      .then(r => r.json())
      .then((data: { status: string; groq: string; keyPrefix: string }) => {
        if (data.status !== 'healthy') {
          console.error('[health] Worker unhealthy:', data)
        } else {
          console.log(`[health] Groq connected (key: ${data.keyPrefix}…)`)
        }
      })
      .catch(e => console.error('[health] check failed:', e))
  }, [])

  return (
    <BrowserRouter basename="/ccxp-simulator">
      <OfflineBanner />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/learn" element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />
        <Route path="/learn/:domainSlug" element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />
        <Route path="/exam/*" element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
        <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/learn" replace />} />
      </Routes>
      {/* AI Tutor — shown when logged in */}
      <TutorChatWrapper />
    </BrowserRouter>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useHistoryStore } from '../../store/historyStore'

export default function TopNav() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const attemptCount = useHistoryStore(s => s.attempts.length)

  const isLearn = location.pathname.startsWith('/learn')
  const isExam = location.pathname.startsWith('/exam') || location.pathname.startsWith('/results')
  const isHistory = location.pathname.startsWith('/history')

  return (
    <nav className="bg-ink border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/learn" className="text-gold font-serif text-xl">CCXP</Link>
          <div className="flex gap-1">
            <Link
              to="/learn"
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isLearn ? 'bg-gold text-navy' : 'text-mist hover:text-cream'
              }`}
            >
              📚 Learn
            </Link>
            <Link
              to="/exam"
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isExam ? 'bg-gold text-navy' : 'text-mist hover:text-cream'
              }`}
            >
              📝 Exam
            </Link>
            <Link
              to="/history"
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isHistory ? 'bg-gold text-navy' : 'text-mist hover:text-cream'
              }`}
            >
              📊 History
              {attemptCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isHistory ? 'bg-navy/30 text-navy' : 'bg-white/10 text-mist'
                }`}>
                  {attemptCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt={user.login} className="w-7 h-7 rounded-full" />
            <span className="text-mist text-sm hidden sm:block">{user.login}</span>
            <button
              onClick={logout}
              className="text-mist/60 hover:text-mist text-xs transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
